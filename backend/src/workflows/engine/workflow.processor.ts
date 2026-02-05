import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { WORKFLOW_QUEUE } from '../../queues/queues.constants';
import { WorkflowEngine } from './workflow.engine';
import { WorkflowGraph } from './types';

export interface WorkflowJobData {
  workflowId: string;
  userId: string;
  graph: WorkflowGraph;
  projectId?: string;
}

@Processor(WORKFLOW_QUEUE)
export class WorkflowProcessor extends WorkerHost {
  private readonly logger = new Logger(WorkflowProcessor.name);

  constructor(private readonly workflowEngine: WorkflowEngine) {
    super();
  }

  async process(job: Job<WorkflowJobData>): Promise<any> {
    this.logger.log(
      `Processing workflow job ${job.id} for workflow ${job.data.workflowId}`,
    );

    try {
      await job.updateProgress(10);

      const result = await this.workflowEngine.execute(
        job.data.workflowId,
        job.data.graph,
        job.data.userId,
        job.data.projectId,
      );

      await job.updateProgress(100);

      this.logger.log(`Workflow job ${job.id} completed successfully`);
      return {
        status: result.status,
        nodeStates: Object.fromEntries(result.nodeStates),
        completedAt: result.completedAt,
      };
    } catch (error: any) {
      this.logger.error(`Workflow job ${job.id} failed: ${error.message}`);
      throw error;
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<WorkflowJobData>) {
    this.logger.log(`Workflow job ${job.id} completed`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<WorkflowJobData>, error: Error) {
    this.logger.error(`Workflow job ${job.id} failed: ${error.message}`);
  }
}
