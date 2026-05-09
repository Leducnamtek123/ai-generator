import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job, Queue } from 'bullmq';
import { DEAD_LETTER_QUEUE } from './queues.constants';

export type DeadLetterQueueRecord = {
  sourceQueue: string;
  jobId: string | number | null;
  jobName: string;
  attemptsMade: number;
  maxAttempts: number;
  failedAt: string;
  error: {
    name: string;
    message: string;
    stack?: string;
  };
  data: unknown;
  metadata: Record<string, unknown>;
};

@Injectable()
export class QueueReliabilityService {
  private readonly logger = new Logger(QueueReliabilityService.name);

  constructor(
    @InjectQueue(DEAD_LETTER_QUEUE)
    private readonly deadLetterQueue: Queue,
  ) {}

  shouldArchiveFailure(job: Job<any, any, string>): boolean {
    const maxAttempts = Math.max(Number(job.opts.attempts ?? 1), 1);
    return job.attemptsMade >= maxAttempts;
  }

  async archiveFailure(
    sourceQueue: string,
    job: Job<any, any, string>,
    error: Error,
    metadata: Record<string, unknown> = {},
  ): Promise<boolean> {
    if (!this.shouldArchiveFailure(job)) {
      return false;
    }

    const payload: DeadLetterQueueRecord = {
      sourceQueue,
      jobId: job.id ?? null,
      jobName: job.name,
      attemptsMade: job.attemptsMade,
      maxAttempts: Math.max(Number(job.opts.attempts ?? 1), 1),
      failedAt: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      data: this.cloneJobData(job.data),
      metadata,
    };

    try {
      await this.deadLetterQueue.add('failed-job', payload, {
        jobId: `dlq:${sourceQueue}:${String(job.id ?? job.name)}`,
      });

      this.logger.warn(
        `Archived failed job ${job.id ?? job.name} from ${sourceQueue} to dead-letter queue`,
      );

      return true;
    } catch (archiveError: any) {
      this.logger.error(
        `Failed to archive job ${job.id ?? job.name} from ${sourceQueue}: ${archiveError.message}`,
      );
      return false;
    }
  }

  private cloneJobData<T>(data: T): T {
    try {
      return structuredClone(data);
    } catch {
      return JSON.parse(JSON.stringify(data)) as T;
    }
  }
}
