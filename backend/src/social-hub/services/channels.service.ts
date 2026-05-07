import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SocialAccountEntity } from '../infrastructure/persistence/relational/entities/social-account.entity';
import { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import { SocialProviderRegistry } from '../providers/social-provider.registry';
import { encrypt, decrypt } from '../utils/encryption.helper';
import { NotificationsService } from '../../notifications/notifications.service';
import { NotificationCategory } from '../../notifications/notifications.types';
import { NotificationType } from '../../notifications/infrastructure/persistence/relational/entities/notification.entity';

@Injectable()
export class ChannelsService {
  private readonly logger = new Logger(ChannelsService.name);

  constructor(
    @InjectRepository(SocialAccountEntity)
    private readonly socialAccountRepository: Repository<SocialAccountEntity>,
    private readonly socialProviderRegistry: SocialProviderRegistry,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Find all channels for the current user.
   * Improved: scoped to user instead of returning all accounts.
   */
  async findAllForUser(user: AuthenticatedUser) {
    const userId = Number(user.id);
    try {
      const accounts = await this.socialAccountRepository.find({
        where: { user: { id: userId } },
        order: { createdAt: 'DESC' },
      });

      return accounts.map((account) => ({
        id: account.id,
        platform: account.platform,
        platformId: account.platformId,
        name: account.name,
        username: account.username,
        picture: account.picture,
        expiresAt: account.expiresAt,
        needsReauth: account.metadata?.needsReauth || false,
        metadata: account.metadata,
        createdAt: account.createdAt,
      }));
    } catch (error) {
      this.logger.error(
        `Failed to fetch channels for user ${user?.id}: ${error?.message || error}`,
      );
      return [];
    }
  }

  /**
   * Legacy method - returns all accounts (for admin use).
   */
  async findAll() {
    return this.socialAccountRepository.find();
  }

  async connect(
    user: AuthenticatedUser,
    platform: string,
    code: string,
    extraParams: Record<string, any> = {},
  ) {
    const userId = Number(user.id);
    // Get the provider and exchange code for real tokens
    const provider = this.socialProviderRegistry.getProvider(platform);
    const details = await provider.authenticate(code, extraParams);

    // Check if account already exists (re-connecting)
    const existingAccount = await this.socialAccountRepository.findOne({
      where: {
        user: { id: userId },
        platform,
        platformId: details.id,
      },
    });

    const metadata: any = {
      ...(existingAccount?.metadata || {}),
      needsReauth: false,
      refreshError: null,
      reconnectedAt: new Date().toISOString(),
    };

    if (platform === 'facebook' && !metadata.verifyToken) {
      metadata.verifyToken = `paint_ai_${Math.random().toString(36).substring(2, 15)}`;
    }

    let savedAccount: SocialAccountEntity;

    if (existingAccount) {
      // Update existing account with new tokens
      existingAccount.accessToken = encrypt(details.accessToken);
      existingAccount.refreshToken = details.refreshToken
        ? encrypt(details.refreshToken)
        : existingAccount.refreshToken;
      existingAccount.expiresAt = details.expiresIn
        ? new Date(Date.now() + details.expiresIn * 1000)
        : existingAccount.expiresAt;
      existingAccount.name = details.name || existingAccount.name;
      existingAccount.picture = details.picture || existingAccount.picture;
      existingAccount.metadata = metadata;
      savedAccount = (await this.socialAccountRepository.save(
        existingAccount,
      )) as SocialAccountEntity;
    } else {
      const userRef = { id: userId } as SocialAccountEntity['user'];
      const account = this.socialAccountRepository.create({
        user: userRef,
        platform,
        platformId: details.id,
        name: details.name,
        username: details.username,
        picture: details.picture,
        accessToken: encrypt(details.accessToken),
        refreshToken: details.refreshToken
          ? encrypt(details.refreshToken)
          : undefined,
        expiresAt: details.expiresIn
          ? new Date(Date.now() + details.expiresIn * 1000)
          : undefined,
        metadata,
      });
      savedAccount = (await this.socialAccountRepository.save(
        account,
      )) as SocialAccountEntity;
    }

    await this.notificationsService.notifyUser({
      userId: user.id,
      category: NotificationCategory.SOCIAL,
      type: NotificationType.SUCCESS,
      title: existingAccount
        ? 'Social account reconnected'
        : 'Social account connected',
      message: `${savedAccount.platform.charAt(0).toUpperCase()}${savedAccount.platform.slice(1)} is now connected${savedAccount.name ? ` as ${savedAccount.name}` : ''}.`,
      emailSubject: `${savedAccount.platform} account connected`,
    });

    return savedAccount;
  }

  async disconnect(id: number, userId: AuthenticatedUser['id']) {
    const ownerId = Number(userId);
    const account = await this.socialAccountRepository.findOne({
      where: { id, user: { id: ownerId } },
      relations: ['user'],
    });
    if (!account) {
      throw new NotFoundException('Account not found');
    }
    const removed = await this.socialAccountRepository.remove(account);
    if (account.user?.id) {
      await this.notificationsService.notifyUser({
        userId: account.user.id,
        category: NotificationCategory.SOCIAL,
        type: NotificationType.WARNING,
        title: 'Social account disconnected',
        message: `${account.platform.charAt(0).toUpperCase()}${account.platform.slice(1)} was disconnected from your workspace.`,
        emailSubject: `${account.platform} account disconnected`,
      });
    }
    return removed;
  }

  /**
   * Fetch real interactions from the social platform.
   * Improved: actually calls the provider API instead of returning mock data.
   */
  async getInteractions(accountId: number, userId: AuthenticatedUser['id']) {
    const ownerId = Number(userId);
    const account = await this.socialAccountRepository.findOne({
      where: { id: accountId, user: { id: ownerId } },
    });
    if (!account) {
      throw new NotFoundException('Account not found');
    }

    try {
      const provider = this.socialProviderRegistry.getProvider(
        account.platform,
      );
      if (provider.getInteractions) {
        return provider.getInteractions(
          decrypt(account.accessToken),
          account.platformId,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to fetch interactions for ${account.platform}: ${error?.message || error}`,
      );
    }

    return [];
  }

  async getFeed(user: AuthenticatedUser) {
    const userId = Number(user.id);
    let accounts: SocialAccountEntity[] = [];
    try {
      accounts = await this.socialAccountRepository.find({
        where: { user: { id: userId } },
      });
    } catch (error) {
      this.logger.error(
        `Failed to fetch social feed channels for user ${user?.id}: ${error?.message || error}`,
      );
    }

    const allInteractions: any[] = [];

    for (const account of accounts) {
      try {
        const provider = this.socialProviderRegistry.getProvider(
          account.platform,
        );
        if (provider.getInteractions) {
          const interactions = await provider.getInteractions(
            decrypt(account.accessToken),
            account.platformId,
          );
          const handledInteractionIds = new Set<string>(
            Array.isArray(account.metadata?.handledInteractionIds)
              ? account.metadata.handledInteractionIds.map((id: any) =>
                  String(id),
                )
              : [],
          );
          const scopedInteractions = interactions
            .filter(
              (interaction) =>
                !handledInteractionIds.has(String(interaction.id)),
            )
            .map((interaction) => ({
              ...interaction,
              accountId: account.id,
              canReply: !!provider.comment,
            }));
          allInteractions.push(...scopedInteractions);
        }
      } catch (error) {
        console.error(
          `Failed to fetch interactions for ${account.platform}:`,
          error,
        );
      }
    }

    // fallback if no accounts or no interactions
    if (allInteractions.length === 0) {
      return [
        {
          id: 'welcome_1',
          platform: 'system',
          type: 'info',
          user: 'PaintAI System',
          content:
            'Welcome! Connect your social accounts to see real interactions here.',
          time: 'Now',
          status: 'unread',
        },
      ];
    }

    // Sort by time, newest first
    return allInteractions.sort((a, b) => {
      const timeA = new Date(a.time || 0).getTime();
      const timeB = new Date(b.time || 0).getTime();
      return timeB - timeA;
    });
  }

  async replyToInteraction(
    user: AuthenticatedUser,
    accountId: number,
    interactionId: string,
    message: string,
  ) {
    const userId = Number(user.id);
    const account = await this.socialAccountRepository.findOne({
      where: { id: accountId, user: { id: userId } },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    const provider = this.socialProviderRegistry.getProvider(account.platform);
    if (!provider.comment) {
      throw new Error(
        `${account.platform} does not support direct replies yet`,
      );
    }

    const result = await provider.comment(
      decrypt(account.accessToken),
      interactionId,
      { message },
      account.platformId,
    );

    const metadata = {
      ...(account.metadata || {}),
      handledInteractionIds: Array.from(
        new Set<string>([
          ...(Array.isArray(account.metadata?.handledInteractionIds)
            ? account.metadata.handledInteractionIds.map((id: any) =>
                String(id),
              )
            : []),
          interactionId,
        ]),
      ),
    };
    account.metadata = metadata;
    await this.socialAccountRepository.save(account);

    return {
      replied: true,
      interactionId,
      accountId,
      result,
    };
  }

  async markInteractionHandled(
    user: AuthenticatedUser,
    accountId: number,
    interactionId: string,
  ) {
    const userId = Number(user.id);
    const account = await this.socialAccountRepository.findOne({
      where: { id: accountId, user: { id: userId } },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    const handledInteractionIds = new Set<string>(
      Array.isArray(account.metadata?.handledInteractionIds)
        ? account.metadata.handledInteractionIds.map((id: any) => String(id))
        : [],
    );
    handledInteractionIds.add(interactionId);

    account.metadata = {
      ...(account.metadata || {}),
      handledInteractionIds: Array.from(handledInteractionIds),
    };
    await this.socialAccountRepository.save(account);

    return {
      handled: true,
      interactionId,
      accountId,
    };
  }

  /**
   * List all available providers that can be connected.
   * New endpoint inspired by Postiz's IntegrationManager.getAllIntegrations()
   */
  listAvailableProviders() {
    const providers = this.socialProviderRegistry.listProviders();
    return providers.map((id) => {
      const provider = this.socialProviderRegistry.getProvider(id);
      return {
        identifier: provider.identifier,
        name: provider.name,
        supportsTokenRefresh: provider.supportsTokenRefresh || false,
      };
    });
  }
}
