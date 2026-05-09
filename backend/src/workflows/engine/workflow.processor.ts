import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { WORKFLOW_QUEUE } from '../../queues/queues.constants';
import { QueueReliabilityService } from '../../queues/queue-reliability.service';
import { WorkflowEngine } from './workflow.engine';
import { WorkflowGraph } from './types';
import { WorkflowsService } from '../workflows.service';

export interface WorkflowJobData {
  workflowId: string;
  userId: string;
  graph: WorkflowGraph;
  projectId?: string;
  runId: string;
}

@Processor(WORKFLOW_QUEUE)
export class WorkflowProcessor extends WorkerHost {
  private readonly logger = new Logger(WorkflowProcessor.name);

  constructor(
    private readonly workflowEngine: WorkflowEngine,
    private readonly workflowsService: WorkflowsService,
    private readonly queueReliabilityService: QueueReliabilityService,
  ) {
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
        job.data.runId,
      );

      await job.updateProgress(100);

      await this.workflowsService
        .recordExecutionSnapshot({
          workflowId: job.data.workflowId,
          userId: job.data.userId,
          runId: job.data.runId,
          projectId: job.data.projectId,
          jobId: String(job.id ?? ''),
          status: result.status,
          graph: job.data.graph,
          nodeStates: result.nodeStates,
          error: result.error ?? null,
          startedAt: result.startedAt ?? null,
          completedAt: result.completedAt ?? new Date(),
        })
        .catch((error) =>
          this.logger.warn(
            `Failed to persist workflow execution result for ${job.data.workflowId}:${job.data.runId}: ${error.message}`,
          ),
        );

      this.logger.log(`Workflow job ${job.id} completed successfully`);
      return {
        status: result.status,
        nodeStates: Object.fromEntries(result.nodeStates),
        completedAt: result.completedAt,
      };
    } catch (error: any) {
      await this.workflowsService
        .recordExecutionSnapshot({
          workflowId: job.data.workflowId,
          userId: job.data.userId,
          runId: job.data.runId,
          projectId: job.data.projectId,
          jobId: String(job.id ?? ''),
          status: 'failed',
          graph: job.data.graph,
          error: error.message,
          completedAt: new Date(),
        })
        .catch((recordError) =>
          this.logger.warn(
            `Failed to persist workflow execution failure for ${job.data.workflowId}:${job.data.runId}: ${recordError.message}`,
          ),
        );

      this.logger.error(`Workflow job ${job.id} failed: ${error.message}`);
      throw error;
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<WorkflowJobData>) {
    this.logger.log(`Workflow job ${job.id} completed`);
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<WorkflowJobData>, error: Error) {
    this.logger.error(`Workflow job ${job.id} failed: ${error.message}`);
    await this.queueReliabilityService.archiveFailure(
      WORKFLOW_QUEUE,
      job,
      error,
      {
        workflowId: job.data.workflowId,
        projectId: job.data.projectId,
        runId: job.data.runId,
      },
    );
  }
}
