import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { SOCIAL_POSTING_QUEUE } from '../../queues/queues.constants';
import { PublishingService } from '../services/publishing.service';
import { SocialPostStatus } from '../infrastructure/persistence/relational/entities/social-post.entity';
import { ChannelsService } from '../services/channels.service';
import { SocialProviderRegistry } from '../providers/social-provider.registry';
import { decrypt } from '../utils/encryption.helper';

@Processor(SOCIAL_POSTING_QUEUE)
export class SocialPostingProcessor extends WorkerHost {
  constructor(
    private readonly publishingService: PublishingService,
    private readonly channelsService: ChannelsService,
    private readonly socialProviderRegistry: SocialProviderRegistry,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { postId } = job.data;
    
    console.log(`Processing social post ${postId}`);
    
    const post = await this.publishingService.findById(postId);
    if (!post) {
      console.error(`Post ${postId} not found`);
      return;
    }

    try {
      const platform = post.socialAccount?.platform || 'facebook';
      const accessToken = post.socialAccount?.accessToken;
      const platformId = post.socialAccount?.platformId;

      if (!accessToken || !platformId) {
        throw new Error(`Missing access token or platform ID for account ${post.socialAccount?.id}`);
      }

      console.log(`Publishing post ${postId} to ${platform} via Registry (de-mocked)`);
      
      const provider = this.socialProviderRegistry.getProvider(platform);
      const response = await provider.post(decrypt(accessToken), { message: post.content }, platformId);

      if (response.status === 'failed') {
        throw new Error('Provider failed to publish post');
      }

      await this.publishingService.updateStatus(
        postId, 
        SocialPostStatus.PUBLISHED, 
        response.postId
      );
      
      return { status: 'success', platform, response };
    } catch (error) {
      console.error(`Failed to publish post ${postId}:`, error);
      await this.publishingService.updateStatus(
        postId, 
        SocialPostStatus.FAILED, 
        undefined, 
        error.message
      );
      throw error;
    }
  }
}
