import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { SOCIAL_ANALYTICS_QUEUE } from '../../queues/queues.constants';
import { SocialAnalyticsService } from '../services/social-analytics.service';
import { TokenRefreshService } from '../services/token-refresh.service';

@Processor(SOCIAL_ANALYTICS_QUEUE)
export class SocialAnalyticsProcessor extends WorkerHost {
  constructor(
    private readonly analyticsService: SocialAnalyticsService,
    private readonly tokenRefreshService: TokenRefreshService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case 'token-refresh':
        console.log(`Processing token refresh job ${job.id}`);
        await this.tokenRefreshService.handleTokenRefreshCron();
        return { status: 'tokens_refreshed' };

      case 'refresh-metrics':
      default:
        console.log(`Processing background analytics refresh job ${job.id}`);
        await this.analyticsService.refreshAllMetrics();
        return { status: 'metrics_refreshed' };
    }
  }
}
