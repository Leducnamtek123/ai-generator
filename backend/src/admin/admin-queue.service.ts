import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, Job } from 'bullmq';
import {
  DEAD_LETTER_QUEUE,
  GENERATION_QUEUE,
  SOCIAL_ANALYTICS_QUEUE,
  SOCIAL_POSTING_QUEUE,
  VISUAL_FLOW_QUEUE,
  WORKFLOW_QUEUE,
  QUEUE_RETRY_ATTEMPTS,
  QUEUE_RETRY_BACKOFF_MS,
  QUEUE_TIMEOUT_MS,
} from '../queues/queues.constants';

type SourceQueueName =
  | typeof GENERATION_QUEUE
  | typeof WORKFLOW_QUEUE
  | typeof SOCIAL_POSTING_QUEUE
  | typeof SOCIAL_ANALYTICS_QUEUE
  | typeof VISUAL_FLOW_QUEUE;

type DeadLetterPayload = {
  sourceQueue: SourceQueueName;
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
  data: Record<string, unknown>;
  metadata: Record<string, unknown>;
};

type DeadLetterSummary = {
  id: string | number;
  sourceQueue: string;
  jobId: string | number | null;
  jobName: string;
  attemptsMade: number;
  errorMessage: string;
  failedAt: string;
};

type QueueCounts = {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: number;
  'waiting-children': number;
};

type QueueSnapshot = {
  queue: string;
  counts: QueueCounts;
};

@Injectable()
export class AdminQueueService {
  private readonly sourceQueues: Record<SourceQueueName, Queue>;

  constructor(
    @InjectQueue(DEAD_LETTER_QUEUE)
    private readonly deadLetterQueue: Queue,
    @InjectQueue(GENERATION_QUEUE)
    generationQueue: Queue,
    @InjectQueue(WORKFLOW_QUEUE)
    workflowQueue: Queue,
    @InjectQueue(SOCIAL_POSTING_QUEUE)
    socialPostingQueue: Queue,
    @InjectQueue(SOCIAL_ANALYTICS_QUEUE)
    socialAnalyticsQueue: Queue,
    @InjectQueue(VISUAL_FLOW_QUEUE)
    visualFlowQueue: Queue,
  ) {
    this.sourceQueues = {
      [GENERATION_QUEUE]: generationQueue,
      [WORKFLOW_QUEUE]: workflowQueue,
      [SOCIAL_POSTING_QUEUE]: socialPostingQueue,
      [SOCIAL_ANALYTICS_QUEUE]: socialAnalyticsQueue,
      [VISUAL_FLOW_QUEUE]: visualFlowQueue,
    };
  }

  async getQueueSnapshot(): Promise<{
    timestamp: string;
    queues: QueueSnapshot[];
  }> {
    return {
      timestamp: new Date().toISOString(),
      queues: await Promise.all([
        this.readQueueSnapshot(this.sourceQueues[GENERATION_QUEUE], GENERATION_QUEUE),
        this.readQueueSnapshot(this.sourceQueues[WORKFLOW_QUEUE], WORKFLOW_QUEUE),
        this.readQueueSnapshot(this.sourceQueues[SOCIAL_POSTING_QUEUE], SOCIAL_POSTING_QUEUE),
        this.readQueueSnapshot(this.sourceQueues[SOCIAL_ANALYTICS_QUEUE], SOCIAL_ANALYTICS_QUEUE),
        this.readQueueSnapshot(this.sourceQueues[VISUAL_FLOW_QUEUE], VISUAL_FLOW_QUEUE),
        this.readQueueSnapshot(this.deadLetterQueue, 'dead-letter'),
      ]),
    };
  }

  async listDeadLetterJobs(limit = 25): Promise<DeadLetterSummary[]> {
    const jobs = await this.deadLetterQueue.getJobs(
      ['waiting', 'active', 'delayed', 'failed'],
      0,
      Math.min(Math.max(limit, 1), 100),
      true,
    );

    return jobs.map((job) => this.toSummary(job));
  }

  async recoverDeadLetterJob(deadLetterJobId: string) {
    const job = await this.deadLetterQueue.getJob(deadLetterJobId);
    if (!job) {
      throw new NotFoundException(`Dead-letter job ${deadLetterJobId} not found`);
    }

    const payload = job.data as DeadLetterPayload;
    const queue = this.sourceQueues[payload.sourceQueue];
    if (!queue) {
      throw new BadRequestException(
        `Unsupported source queue ${String(payload.sourceQueue)}`,
      );
    }

    const sourceJobId = String(payload.jobId ?? deadLetterJobId);
    const existing = await queue.getJob(sourceJobId);
    if (existing) {
      await existing.remove().catch(() => undefined);
    }

    await queue.add(payload.jobName, payload.data, {
      jobId: sourceJobId,
      attempts: Math.max(Number(payload.maxAttempts ?? QUEUE_RETRY_ATTEMPTS), 1),
      backoff: {
        type: 'exponential',
        delay: QUEUE_RETRY_BACKOFF_MS,
      },
      removeOnComplete: true,
      removeOnFail: 10,
    });

    await job.remove();

    return {
      recovered: true,
      deadLetterJobId,
      sourceQueue: payload.sourceQueue,
      sourceJobId,
      recoveredAt: new Date().toISOString(),
    };
  }

  private toSummary(job: Job<any, any, string>): DeadLetterSummary {
    const payload = (job.data ?? {}) as Partial<DeadLetterPayload>;
    return {
      id: job.id ?? job.name,
      sourceQueue: String(payload.sourceQueue ?? 'unknown'),
      jobId: payload.jobId ?? null,
      jobName: payload.jobName ?? job.name,
      attemptsMade: Number(payload.attemptsMade ?? job.attemptsMade ?? 0),
      errorMessage: payload.error?.message ?? 'Unknown error',
      failedAt:
        payload.failedAt ??
        (job.timestamp
          ? new Date(job.timestamp).toISOString()
          : new Date().toISOString()),
    };
  }

  private async readQueueSnapshot(queue: Queue, queueName: string): Promise<QueueSnapshot> {
    const counts = await queue.getJobCounts(
      'waiting',
      'active',
      'completed',
      'failed',
      'delayed',
      'paused',
      'waiting-children',
    );

    return {
      queue: queueName,
      counts: counts as QueueCounts,
    };
  }
}
