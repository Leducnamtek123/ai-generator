import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { SOCIAL_POSTING_QUEUE } from '../../queues/queues.constants';
import { QueueReliabilityService } from '../../queues/queue-reliability.service';
import { PublishingService } from '../services/publishing.service';
import { SocialPostStatus } from '../infrastructure/persistence/relational/entities/social-post.entity';
import { SocialProviderRegistry } from '../providers/social-provider.registry';
import { decrypt } from '../utils/encryption.helper';
import { Logger } from '@nestjs/common';

@Processor(SOCIAL_POSTING_QUEUE)
export class SocialPostingProcessor extends WorkerHost {
  private readonly logger = new Logger(SocialPostingProcessor.name);

  constructor(
    private readonly publishingService: PublishingService,
    private readonly socialProviderRegistry: SocialProviderRegistry,
    private readonly queueReliabilityService: QueueReliabilityService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { postId } = job.data;

    this.logger.log(`Processing social post ${postId}`);

    try {
      const post = await this.publishingService
        .findById(postId)
        .catch(() => null);
      if (!post) {
        this.logger.warn(`Post ${postId} not found`);
        return { status: 'skipped', reason: 'not_found' };
      }

      if (post.status === SocialPostStatus.PUBLISHED) {
        this.logger.log(
          `Post ${postId} already published, skipping duplicate job`,
        );
        return { status: 'skipped', reason: 'already_published' };
      }

      const platform = post.socialAccount?.platform || 'facebook';
      const accessToken = post.socialAccount?.accessToken;
      const platformId = post.socialAccount?.platformId;

      if (!accessToken || !platformId) {
        throw new Error(
          `Missing access token or platform ID for account ${post.socialAccount?.id}`,
        );
      }

      this.logger.log(
        `Publishing post ${postId} to ${platform} via Registry (de-mocked)`,
      );

      const provider = this.socialProviderRegistry.getProvider(platform);
      const response = await provider.post(
        decrypt(accessToken),
        { message: post.content },
        platformId,
      );

      if (response.status === 'failed') {
        throw new Error('Provider failed to publish post');
      }

      await this.publishingService.updateStatus(
        postId,
        SocialPostStatus.PUBLISHED,
        response.postId,
      );

      return { status: 'success', platform, response };
    } catch (error: any) {
      this.logger.error(
        `Failed to publish post ${postId}: ${error?.message || error}`,
      );
      await this.publishingService.updateStatus(
        postId,
        SocialPostStatus.FAILED,
        undefined,
        error.message,
      );
      throw error;
    }
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<any, any, string>, error: Error) {
    this.logger.error(`Social post job ${job.id} failed: ${error.message}`);
    await this.queueReliabilityService.archiveFailure(
      SOCIAL_POSTING_QUEUE,
      job,
      error,
      {
        postId: job.data?.postId,
      },
    );
  }
}
