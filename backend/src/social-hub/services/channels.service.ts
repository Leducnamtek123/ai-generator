import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SocialAccountEntity } from '../infrastructure/persistence/relational/entities/social-account.entity';
import { UserEntity } from '../../users/infrastructure/persistence/relational/entities/user.entity';
import { SocialProviderRegistry } from '../providers/social-provider.registry';
import { encrypt, decrypt } from '../utils/encryption.helper';

@Injectable()
export class ChannelsService {
  private readonly logger = new Logger(ChannelsService.name);

  constructor(
    @InjectRepository(SocialAccountEntity)
    private readonly socialAccountRepository: Repository<SocialAccountEntity>,
    private readonly socialProviderRegistry: SocialProviderRegistry,
  ) {}

  /**
   * Find all channels for the current user.
   * Improved: scoped to user instead of returning all accounts.
   */
  async findAllForUser(user: UserEntity) {
    try {
      const accounts = await this.socialAccountRepository.find({
        where: { user: { id: user.id } },
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

  async connect(user: UserEntity, platform: string, code: string) {
    console.log(`User ${user.id} connecting to ${platform} with code ${code}`);

    // Get the provider and exchange code for real tokens
    const provider = this.socialProviderRegistry.getProvider(platform);
    const details = await provider.authenticate(code);

    // Check if account already exists (re-connecting)
    const existingAccount = await this.socialAccountRepository.findOne({
      where: {
        user: { id: user.id },
        platform,
        platformId: details.id,
      },
    });

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
      existingAccount.metadata = {
        ...(existingAccount.metadata || {}),
        needsReauth: false,
        refreshError: null,
        reconnectedAt: new Date().toISOString(),
      };
      return this.socialAccountRepository.save(existingAccount);
    }

    const account = this.socialAccountRepository.create({
      user,
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
    });

    return this.socialAccountRepository.save(account);
  }

  async disconnect(id: number) {
    const account = await this.socialAccountRepository.findOne({
      where: { id },
    });
    if (!account) {
      throw new NotFoundException('Account not found');
    }
    return this.socialAccountRepository.remove(account);
  }

  /**
   * Fetch real interactions from the social platform.
   * Improved: actually calls the provider API instead of returning mock data.
   */
  async getInteractions(accountId: number) {
    const account = await this.socialAccountRepository.findOne({
      where: { id: accountId },
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
      console.error(
        `Failed to fetch interactions for ${account.platform}:`,
        error,
      );
    }

    return [];
  }

  async getFeed(user: UserEntity) {
    let accounts: SocialAccountEntity[] = [];
    try {
      accounts = await this.socialAccountRepository.find({
        where: { user: { id: user.id } },
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
          allInteractions.push(...interactions);
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
