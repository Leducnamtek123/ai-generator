import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import {
  DEAD_LETTER_QUEUE,
  GENERATION_QUEUE,
  SOCIAL_ANALYTICS_QUEUE,
  SOCIAL_POSTING_QUEUE,
  VISUAL_FLOW_QUEUE,
  WORKFLOW_QUEUE,
} from '../queues/queues.constants';

type QueueSnapshot = {
  queue: string;
  counts: Awaited<ReturnType<Queue['getJobCounts']>>;
};

@Injectable()
export class QueueHealthService {
  constructor(
    @InjectQueue(GENERATION_QUEUE)
    private readonly generationQueue: Queue,
    @InjectQueue(WORKFLOW_QUEUE)
    private readonly workflowQueue: Queue,
    @InjectQueue(SOCIAL_POSTING_QUEUE)
    private readonly socialPostingQueue: Queue,
    @InjectQueue(SOCIAL_ANALYTICS_QUEUE)
    private readonly socialAnalyticsQueue: Queue,
    @InjectQueue(VISUAL_FLOW_QUEUE)
    private readonly visualFlowQueue: Queue,
    @InjectQueue(DEAD_LETTER_QUEUE)
    private readonly deadLetterQueue: Queue,
  ) {}

  async snapshot(): Promise<{
    timestamp: string;
    queues: QueueSnapshot[];
  }> {
    return {
      timestamp: new Date().toISOString(),
      queues: await Promise.all([
        this.readQueueSnapshot(this.generationQueue, GENERATION_QUEUE),
        this.readQueueSnapshot(this.workflowQueue, WORKFLOW_QUEUE),
        this.readQueueSnapshot(this.socialPostingQueue, SOCIAL_POSTING_QUEUE),
        this.readQueueSnapshot(this.socialAnalyticsQueue, SOCIAL_ANALYTICS_QUEUE),
        this.readQueueSnapshot(this.visualFlowQueue, VISUAL_FLOW_QUEUE),
        this.readQueueSnapshot(this.deadLetterQueue, DEAD_LETTER_QUEUE),
      ]),
    };
  }

  private async readQueueSnapshot(
    queue: Queue,
    queueName: string,
  ): Promise<QueueSnapshot> {
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
      counts,
    };
  }
}
