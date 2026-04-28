import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Repository, LessThan } from 'typeorm';
import { SocialAccountEntity } from '../infrastructure/persistence/relational/entities/social-account.entity';
import { SocialProviderRegistry } from '../providers/social-provider.registry';
import { encrypt, decrypt } from '../utils/encryption.helper';
import { SOCIAL_ANALYTICS_QUEUE } from '../../queues/queues.constants';
import { SocialHubGateway } from '../gateways/social-hub.gateway';

/**
 * Token Refresh Service.
 * Inspired by Postiz's RefreshIntegrationService:
 * - Runs on a schedule to check expiring tokens
 * - Calls provider.refreshToken() for each expiring account
 * - Updates the database with new tokens
 * - Notifies users via WebSocket if refresh fails
 * - Disconnects accounts that can't be refreshed
 */
@Injectable()
export class TokenRefreshService implements OnModuleInit {
  private readonly logger = new Logger(TokenRefreshService.name);

  constructor(
    @InjectRepository(SocialAccountEntity)
    private readonly socialAccountRepository: Repository<SocialAccountEntity>,
    private readonly providerRegistry: SocialProviderRegistry,
    private readonly socialHubGateway: SocialHubGateway,
    @InjectQueue(SOCIAL_ANALYTICS_QUEUE)
    private readonly analyticsQueue: Queue,
  ) {}

  /**
   * On module init, schedule a repeating job to check tokens every 30 minutes.
   * Uses BullMQ repeatable jobs instead of @nestjs/schedule.
   */
  async onModuleInit() {
    await this.analyticsQueue.add(
      'token-refresh',
      {},
      {
        repeat: { every: 30 * 60 * 1000 }, // every 30 minutes
        removeOnComplete: true,
        removeOnFail: 5,
      },
    );
    this.logger.log('Token refresh repeating job scheduled (every 30 minutes)');
  }

  /**
   * Run every 30 minutes to check for expiring tokens.
   * Refresh tokens that expire within the next 1 hour.
   */
  async handleTokenRefreshCron() {
    this.logger.log('Starting token refresh cycle...');

    const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);

    const expiringAccounts = await this.socialAccountRepository.find({
      where: {
        expiresAt: LessThan(oneHourFromNow),
      },
      relations: ['user'],
    });

    if (expiringAccounts.length === 0) {
      this.logger.debug('No tokens need refresh');
      return;
    }

    this.logger.log(
      `Found ${expiringAccounts.length} accounts with expiring tokens`,
    );

    for (const account of expiringAccounts) {
      await this.refreshAccount(account);
    }
  }

  /**
   * Refresh a single account's token.
   */
  async refreshAccount(account: SocialAccountEntity): Promise<boolean> {
    try {
      const provider = this.providerRegistry.getProvider(account.platform);

      // Check if provider supports token refresh
      if (!provider.refreshToken || !provider.supportsTokenRefresh) {
        this.logger.debug(
          `Provider ${account.platform} doesn't support token refresh. Skipping account ${account.id}.`,
        );
        return false;
      }

      // Check if we have a refresh token
      if (!account.refreshToken) {
        this.logger.warn(
          `Account ${account.id} (${account.platform}) has no refresh token. User needs to re-authenticate.`,
        );
        this.notifyRefreshFailure(account, 'No refresh token available');
        return false;
      }

      this.logger.log(
        `Refreshing token for ${account.platform} account ${account.id}...`,
      );

      const decryptedRefreshToken = decrypt(account.refreshToken);
      const newTokenDetails = await provider.refreshToken(
        decryptedRefreshToken,
      );

      // Update the account with new tokens
      await this.socialAccountRepository.update(account.id, {
        accessToken: encrypt(newTokenDetails.accessToken),
        refreshToken: newTokenDetails.refreshToken
          ? encrypt(newTokenDetails.refreshToken)
          : account.refreshToken,
        expiresAt: newTokenDetails.expiresIn
          ? new Date(Date.now() + newTokenDetails.expiresIn * 1000)
          : account.expiresAt,
      });

      this.logger.log(
        `Successfully refreshed token for ${account.platform} account ${account.id}`,
      );

      return true;
    } catch (error) {
      this.logger.error(
        `Failed to refresh token for ${account.platform} account ${account.id}: ${error.message}`,
      );

      this.notifyRefreshFailure(account, error.message);

      // Mark account as needing re-authentication via metadata
      account.metadata = {
        ...(account.metadata || {}),
        refreshError: error.message,
        refreshFailedAt: new Date().toISOString(),
        needsReauth: true,
      };
      await this.socialAccountRepository.save(account);

      return false;
    }
  }

  /**
   * Force refresh for a specific account (manual trigger).
   */
  async forceRefresh(accountId: number): Promise<boolean> {
    const account = await this.socialAccountRepository.findOne({
      where: { id: accountId },
      relations: ['user'],
    });

    if (!account) {
      throw new Error('Account not found');
    }

    return this.refreshAccount(account);
  }

  /**
   * Notify user via WebSocket that token refresh failed.
   * Inspired by Postiz's informAboutRefreshError.
   */
  private notifyRefreshFailure(account: SocialAccountEntity, reason: string) {
    if (account.user?.id) {
      this.socialHubGateway.broadcastInteraction(account.user.id, {
        type: 'token_refresh_failed',
        platform: account.platform,
        accountId: account.id,
        accountName: account.name,
        message: `Your ${account.platform} connection needs to be re-authenticated: ${reason}`,
        timestamp: new Date(),
      });
    }
  }
}
