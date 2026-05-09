import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { SOCIAL_ANALYTICS_QUEUE } from '../../queues/queues.constants';
import { QueueReliabilityService } from '../../queues/queue-reliability.service';
import { SocialAnalyticsService } from '../services/social-analytics.service';
import { TokenRefreshService } from '../services/token-refresh.service';
import { Logger } from '@nestjs/common';

@Processor(SOCIAL_ANALYTICS_QUEUE)
export class SocialAnalyticsProcessor extends WorkerHost {
  private readonly logger = new Logger(SocialAnalyticsProcessor.name);

  constructor(
    private readonly analyticsService: SocialAnalyticsService,
    private readonly tokenRefreshService: TokenRefreshService,
    private readonly queueReliabilityService: QueueReliabilityService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case 'token-refresh':
        this.logger.log(`Processing token refresh job ${job.id}`);
        await this.tokenRefreshService.handleTokenRefreshCron();
        return { status: 'tokens_refreshed' };

      case 'refresh-metrics':
      default:
        this.logger.log(`Processing background analytics refresh job ${job.id}`);
        await this.analyticsService.refreshAllMetrics();
        return { status: 'metrics_refreshed' };
    }
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<any, any, string>, error: Error) {
    this.logger.error(`Social analytics job ${job.id} failed: ${error.message}`);
    await this.queueReliabilityService.archiveFailure(
      SOCIAL_ANALYTICS_QUEUE,
      job,
      error,
      {
        jobName: job.name,
      },
    );
  }
}
