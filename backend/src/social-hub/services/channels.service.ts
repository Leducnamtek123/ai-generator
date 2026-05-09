import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SocialAccountEntity } from '../infrastructure/persistence/relational/entities/social-account.entity';
import {
  FacebookPendingConnectionEntity,
  FacebookPendingPage,
} from '../infrastructure/persistence/relational/entities/facebook-pending-connection.entity';
import { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import { SocialProviderRegistry } from '../providers/social-provider.registry';
import { encrypt, decrypt } from '../utils/encryption.helper';
import { NotificationsService } from '../../notifications/notifications.service';
import { NotificationCategory } from '../../notifications/notifications.types';
import { NotificationType } from '../../notifications/infrastructure/persistence/relational/entities/notification.entity';

type SocialMetadata = {
  needsReauth?: boolean;
  refreshError?: string | null;
  reconnectedAt?: string;
  isPage?: boolean;
  facebookUserId?: string;
  verifyToken?: string;
  handledInteractionIds?: Array<string | number>;
  inboxTriage?: Record<
    string,
    {
      assignedTo?: string | null;
      labels?: string[];
      followUp?: boolean;
      updatedAt?: string;
    }
  >;
  [key: string]: unknown;
};

type SocialInboxItem = {
  id: string | number;
  platform: string;
  type: string;
  user: string;
  content: string;
  time: string;
  status?: string;
  accountId?: number;
  canReply?: boolean;
  isNew?: boolean;
};

function normalizeMetadata(metadata: unknown): SocialMetadata {
  return metadata && typeof metadata === 'object' ? (metadata as SocialMetadata) : {};
}

function getHandledInteractionIds(metadata: unknown): string[] {
  const normalizedMetadata = normalizeMetadata(metadata);
  return Array.isArray(normalizedMetadata.handledInteractionIds)
    ? normalizedMetadata.handledInteractionIds.map((id) => String(id))
    : [];
}

function getInboxTriageState(metadata: unknown) {
  const normalizedMetadata = normalizeMetadata(metadata);
  return normalizedMetadata.inboxTriage && typeof normalizedMetadata.inboxTriage === 'object'
    ? normalizedMetadata.inboxTriage
    : {};
}

@Injectable()
export class ChannelsService {
  private readonly logger = new Logger(ChannelsService.name);

  constructor(
    @InjectRepository(SocialAccountEntity)
    private readonly socialAccountRepository: Repository<SocialAccountEntity>,
    @InjectRepository(FacebookPendingConnectionEntity)
    private readonly facebookPendingConnectionRepository: Repository<FacebookPendingConnectionEntity>,
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

      return accounts
        .filter(
          (account) =>
            account.platform !== 'facebook' || account.metadata?.isPage === true,
        )
        .map((account) => ({
          id: account.id,
          platform: account.platform,
          platformId: account.platformId,
          name: account.name,
          username: account.username,
          picture: account.picture,
          expiresAt: account.expiresAt,
          needsReauth: Boolean(account.metadata?.needsReauth),
          metadata: account.metadata,
          createdAt: account.createdAt,
        })) as Array<{
        id: number;
        platform: string;
        platformId: string;
        name: string | null;
        username: string | null;
        picture: string | null;
        expiresAt: Date | null;
        needsReauth: boolean;
        metadata: Record<string, unknown> | null;
        createdAt: Date;
      }>;
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
    extraParams: Record<string, string> = {},
  ) {
    const userId = Number(user.id);
    // Get the provider and exchange code for real tokens
    const provider = this.socialProviderRegistry.getProvider(platform);
    const details = await provider.authenticate(code, extraParams);
    const facebookPages =
      platform === 'facebook'
        ? ((details.extraData?.facebookPages as
            | FacebookPendingPage[]
            | undefined) ?? [])
        : [];

    let savedAccount: SocialAccountEntity;

    if (platform === 'facebook') {
      if (facebookPages.length === 0) {
        throw new BadRequestException(
          'No Facebook pages were returned for this account. Make sure the Facebook user manages at least one Page.',
        );
      }

      await this.facebookPendingConnectionRepository
        .createQueryBuilder()
        .delete()
        .where('"userId" = :userId AND "platform" = :platform', {
          userId,
          platform: 'facebook',
        })
        .execute();

      const pendingConnection = this.facebookPendingConnectionRepository.create({
        user: { id: userId } as SocialAccountEntity['user'],
        platform: 'facebook',
        providerUserId: details.id,
        providerName: details.name,
        providerPicture: details.picture,
        accessToken: encrypt(details.accessToken),
        expiresAt: details.expiresIn
          ? new Date(Date.now() + details.expiresIn * 1000)
          : undefined,
        pages: facebookPages,
      });

      await this.facebookPendingConnectionRepository.save(pendingConnection);
      return pendingConnection;
    } else {
      // Check if account already exists (re-connecting)
      const existingAccount = await this.socialAccountRepository.findOne({
        where: {
          user: { id: userId },
          platform,
          platformId: details.id,
        },
      });

      const metadata: SocialMetadata = {
        ...normalizeMetadata(existingAccount?.metadata),
        needsReauth: false,
        refreshError: null,
        reconnectedAt: new Date().toISOString(),
      };

      if (platform === 'facebook' && !metadata.verifyToken) {
        metadata.verifyToken = `paint_ai_${randomUUID()}`;
      }

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
      try {
        await this.notificationsService.notifyUser({
          userId: user.id,
          category: NotificationCategory.SOCIAL,
          type: NotificationType.SUCCESS,
          title: 'Social account connected',
          message: `${savedAccount.platform.charAt(0).toUpperCase()}${savedAccount.platform.slice(1)} is now connected${savedAccount.name ? ` as ${savedAccount.name}` : ''}.`,
          emailSubject: `${savedAccount.platform} account connected`,
        });
      } catch (error) {
        this.logger.warn(
          `Notification failed after connecting ${platform}: ${error?.message || error}`,
        );
      }

      return savedAccount;
    }
  }

  async getPendingFacebookConnections(user: AuthenticatedUser) {
    const userId = Number(user.id);
    const connections = await this.facebookPendingConnectionRepository.find({
      where: { user: { id: userId }, platform: 'facebook' },
      order: { createdAt: 'DESC' },
    });

    return connections.map((connection) => ({
      id: connection.id,
      platform: connection.platform,
      providerUserId: connection.providerUserId,
      providerName: connection.providerName,
      providerPicture: connection.providerPicture,
      expiresAt: connection.expiresAt,
      pages: connection.pages.map((page) => ({
        id: page.id,
        name: page.name,
        picture: page.picture,
      })),
      createdAt: connection.createdAt,
      updatedAt: connection.updatedAt,
    }));
  }

  async confirmPendingFacebookConnection(
    user: AuthenticatedUser,
    pendingConnectionId: string,
    selectedPageIds: string[],
  ) {
    const userId = Number(user.id);
    const pendingConnection = await this.facebookPendingConnectionRepository.findOne({
      where: {
        id: pendingConnectionId,
        user: { id: userId },
        platform: 'facebook',
      },
    });

    if (!pendingConnection) {
      throw new NotFoundException('Pending Facebook connection not found');
    }

    const selectedIdSet = new Set(selectedPageIds.map((id) => String(id)));
    const selectedPages = pendingConnection.pages.filter((page) =>
      selectedIdSet.has(String(page.id)),
    );

    if (selectedPages.length === 0) {
      throw new BadRequestException('Select at least one Facebook page to connect');
    }

    const savedPages = await this.saveFacebookPages(
      userId,
      pendingConnection.providerUserId,
      selectedPages,
      pendingConnection.expiresAt,
    );
    await this.facebookPendingConnectionRepository.remove(pendingConnection);

    try {
      await this.notificationsService.notifyUser({
        userId: user.id,
        category: NotificationCategory.SOCIAL,
        type: NotificationType.SUCCESS,
        title: 'Facebook pages connected',
        message: `${savedPages.length} Facebook page${savedPages.length === 1 ? '' : 's'} are now connected.`,
        emailSubject: 'Facebook pages connected',
      });
    } catch (error) {
      this.logger.warn(
        `Notification failed after confirming Facebook pages: ${error?.message || error}`,
      );
    }

    return savedPages;
  }

  async discardPendingFacebookConnection(
    user: AuthenticatedUser,
    pendingConnectionId: string,
  ) {
    const userId = Number(user.id);
    const pendingConnection = await this.facebookPendingConnectionRepository.findOne({
      where: {
        id: pendingConnectionId,
        user: { id: userId },
        platform: 'facebook',
      },
    });

    if (!pendingConnection) {
      throw new NotFoundException('Pending Facebook connection not found');
    }

    await this.facebookPendingConnectionRepository.remove(pendingConnection);
    return { removed: true };
  }

  private async saveFacebookPages(
    userId: number,
    facebookUserId: string,
    pages: FacebookPendingPage[],
    expiresAt?: Date,
  ) {
    const savedPages: SocialAccountEntity[] = [];
    const legacyProfileAccount = await this.socialAccountRepository.findOne({
      where: {
        user: { id: userId },
        platform: 'facebook',
        platformId: facebookUserId,
      },
    });

    for (const page of pages) {
      const existingPageAccount = await this.socialAccountRepository.findOne({
        where: {
          user: { id: userId },
          platform: 'facebook',
          platformId: page.id,
        },
      });

      const pageMetadata: SocialMetadata = {
        ...normalizeMetadata(existingPageAccount?.metadata),
        needsReauth: false,
        refreshError: null,
        reconnectedAt: new Date().toISOString(),
        isPage: true,
        facebookUserId,
      };

      if (existingPageAccount) {
        existingPageAccount.accessToken = encrypt(page.accessToken);
        existingPageAccount.refreshToken = page.accessToken
          ? encrypt(page.accessToken)
          : existingPageAccount.refreshToken;
        existingPageAccount.expiresAt = expiresAt ?? existingPageAccount.expiresAt;
        existingPageAccount.name = page.name || existingPageAccount.name;
        existingPageAccount.picture = page.picture || existingPageAccount.picture;
        existingPageAccount.metadata = pageMetadata;
        savedPages.push(
          (await this.socialAccountRepository.save(
            existingPageAccount,
          )) as SocialAccountEntity,
        );
      } else {
        const userRef = { id: userId } as SocialAccountEntity['user'];
        const account = this.socialAccountRepository.create({
          user: userRef,
          platform: 'facebook',
          platformId: page.id,
          name: page.name,
          picture: page.picture,
          accessToken: encrypt(page.accessToken),
          refreshToken: page.accessToken
            ? encrypt(page.accessToken)
            : undefined,
          expiresAt,
          metadata: pageMetadata,
        });
        savedPages.push(
          (await this.socialAccountRepository.save(
            account,
          )) as SocialAccountEntity,
        );
      }
    }

    if (legacyProfileAccount) {
      await this.socialAccountRepository.remove(legacyProfileAccount);
    }

    return savedPages;
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
      try {
        await this.notificationsService.notifyUser({
          userId: account.user.id,
          category: NotificationCategory.SOCIAL,
          type: NotificationType.WARNING,
          title: 'Social account disconnected',
          message: `${account.platform.charAt(0).toUpperCase()}${account.platform.slice(1)} was disconnected from your workspace.`,
          emailSubject: `${account.platform} account disconnected`,
        });
      } catch (error) {
        this.logger.warn(
          `Notification failed after disconnecting ${account.platform}: ${error?.message || error}`,
        );
      }
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

  async getFeed(user: AuthenticatedUser): Promise<SocialInboxItem[]> {
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

    const allInteractions: SocialInboxItem[] = [];

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
            getHandledInteractionIds(account.metadata),
          );
          const triageState = getInboxTriageState(account.metadata);
          const scopedInteractions = interactions
            .filter(
              (interaction) =>
                !handledInteractionIds.has(String(interaction.id)),
            )
            .map((interaction) => ({
              ...interaction,
              accountId: account.id,
              canReply: !!provider.comment,
              assignedTo: triageState[String(interaction.id)]?.assignedTo ?? null,
              labels: triageState[String(interaction.id)]?.labels ?? [],
              followUp: triageState[String(interaction.id)]?.followUp ?? false,
            }));
          allInteractions.push(...scopedInteractions);
        }
      } catch (error) {
        this.logger.error(
          `Failed to fetch interactions for ${account.platform}: ${error?.message || error}`,
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

    const metadata: SocialMetadata = {
      ...normalizeMetadata(account.metadata),
      handledInteractionIds: Array.from(
        new Set<string>([
          ...getHandledInteractionIds(account.metadata),
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
      getHandledInteractionIds(account.metadata),
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

  async updateInteractionTriage(
    user: AuthenticatedUser,
    accountId: number,
    interactionId: string,
    data: {
      assignedTo?: string | null;
      labels?: string[];
      followUp?: boolean;
    },
  ) {
    const userId = Number(user.id);
    const account = await this.socialAccountRepository.findOne({
      where: { id: accountId, user: { id: userId } },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    const triageState = {
      ...getInboxTriageState(account.metadata),
    };
    const nextEntry = {
      ...(triageState[interactionId] || {}),
      ...(data.assignedTo !== undefined
        ? { assignedTo: data.assignedTo || null }
        : {}),
      ...(data.labels !== undefined
        ? { labels: data.labels }
        : {}),
      ...(data.followUp !== undefined
        ? { followUp: Boolean(data.followUp) }
        : {}),
      updatedAt: new Date().toISOString(),
    };

    triageState[interactionId] = nextEntry;
    account.metadata = {
      ...(account.metadata || {}),
      inboxTriage: triageState,
    };
    await this.socialAccountRepository.save(account);

    return {
      accountId,
      interactionId,
      ...nextEntry,
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
