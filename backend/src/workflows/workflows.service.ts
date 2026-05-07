import { Injectable, NotFoundException, Logger, OnModuleInit } from '@nestjs/common';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';
import { WorkflowRepository } from './infrastructure/persistence/workflow.repository';
import { WorkflowEngine } from './engine/workflow.engine';
import { WorkflowGraph } from './engine/types';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { WORKFLOW_QUEUE } from '../queues/queues.constants';
import { GenerationEventsService } from '../generations/services/generation-events.service';
import { GenerationEntity } from '../generations/entities/generation.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationCategory } from '../notifications/notifications.types';
import { NotificationType } from '../notifications/infrastructure/persistence/relational/entities/notification.entity';

@Injectable()
export class WorkflowsService implements OnModuleInit {
  private readonly logger = new Logger(WorkflowsService.name);

  constructor(
    private readonly workflowRepository: WorkflowRepository,
    private readonly workflowEngine: WorkflowEngine,
    private readonly generationEventsService: GenerationEventsService,
    private readonly notificationsService: NotificationsService,
    @InjectQueue(WORKFLOW_QUEUE) private workflowQueue: Queue,
  ) {}

  onModuleInit() {
    this.generationEventsService.generationUpdated.subscribe((data) => {
      this.handleGenerationUpdate(data.generation).catch((err) =>
        this.logger.error(`Error handling generation update for workflow: ${err.message}`),
      );
    });
  }

  private async handleGenerationUpdate(generation: GenerationEntity) {
    const metadata = generation.metadata || {};
    const { workflowId, nodeId } = metadata;

    if (!workflowId || !nodeId) return;

    this.logger.log(`Updating workflow ${workflowId} node ${nodeId} from generation ${generation.id}`);

    const workflow = await this.findOne(workflowId, generation.userId);
    if (!workflow) return;

    const patchData: any = {
      status: generation.status === 'completed' ? 'success' : generation.status === 'failed' ? 'error' : 'processing',
    };

    if (generation.resultUrl) {
      patchData.resultUrl = generation.resultUrl;
      patchData.previewUrl = generation.resultUrl;
    }

    if (generation.status === 'failed' && generation.error) {
      patchData.errorMessage = generation.error;
    }

    await this.update(workflowId, generation.userId, {
      nodes: workflow.nodes.map((node: any) =>
        node.id === nodeId
        ? {
              ...node,
              data: { ...node.data, ...patchData },
            }
          : node,
      ),
    } as any);

    if (generation.status === 'completed' || generation.status === 'failed') {
      await this.notificationsService.notifyUser({
        userId: generation.userId,
        category: NotificationCategory.WORKFLOW,
        type:
          generation.status === 'completed'
            ? NotificationType.SUCCESS
            : NotificationType.ERROR,
        title:
          generation.status === 'completed'
            ? 'Workflow step completed'
            : 'Workflow step failed',
        message:
          generation.status === 'completed'
            ? `Workflow "${workflow.name}" finished processing generation ${generation.id}.`
            : `Workflow "${workflow.name}" failed while processing generation ${generation.id}${generation.error ? `: ${generation.error}` : ''}.`,
        emailSubject:
          generation.status === 'completed'
            ? `Workflow completed: ${workflow.name}`
            : `Workflow failed: ${workflow.name}`,
      });
    }
  }

  create(createWorkflowDto: CreateWorkflowDto, userId?: string | number) {
    const clonedPayload = {
      name: createWorkflowDto.name,
      nodes: createWorkflowDto.nodes,
      edges: createWorkflowDto.edges,
      projectId: createWorkflowDto.projectId,
      previewUrl: createWorkflowDto.previewUrl,
      visibility: createWorkflowDto.visibility || 'private',
      userId: userId ? String(userId) : undefined,
    };
    return this.workflowRepository.create(clonedPayload as any);
  }

  findAll(userId: string | number) {
    return this.workflowRepository.findAll(String(userId));
  }

  findCommunity() {
    return this.workflowRepository.findCommunity();
  }

  findByProject(projectId: string, userId: string | number) {
    return this.workflowRepository.findByProject(projectId, userId);
  }

  findOne(id: string, userId?: string | number) {
    return this.workflowRepository.findById(id, userId);
  }

  update(
    id: string,
    userId: string | number,
    updateWorkflowDto: UpdateWorkflowDto,
  ) {
    const payload: Partial<UpdateWorkflowDto> = {};

    if (updateWorkflowDto.name !== undefined)
      payload.name = updateWorkflowDto.name;
    if (updateWorkflowDto.nodes !== undefined)
      payload.nodes = updateWorkflowDto.nodes;
    if (updateWorkflowDto.edges !== undefined)
      payload.edges = updateWorkflowDto.edges;
    if (updateWorkflowDto.previewUrl !== undefined)
      payload.previewUrl = updateWorkflowDto.previewUrl;
    if (updateWorkflowDto.visibility !== undefined)
      (payload as any).visibility = updateWorkflowDto.visibility;

    return this.workflowRepository.update(id, userId, payload as any);
  }

  remove(id: string, userId: string | number) {
    return this.workflowRepository.remove(id, userId);
  }

  async execute(
    id: string,
    userId: string | number,
    nodes?: any[],
    edges?: any[],
  ) {
    const workflow = await this.findOne(id, userId);
    if (!workflow) {
      throw new NotFoundException('Workflow not found');
    }

    // Build the graph from provided data or fallback to stored workflow data
    const graph: WorkflowGraph = {
      nodes: ((nodes || workflow.nodes) as any[]) || [],
      edges: ((edges || workflow.edges) as any[]) || [],
    };

    // Execute using the queue
    const job = await this.workflowQueue.add('workflow_execution', {
      workflowId: id,
      userId: String(userId),
      graph,
      projectId: workflow.projectId,
    });

    return {
      status: 'queued',
      jobId: job.id,
      workflowId: id,
      workflowName: workflow.name,
      executionId: `exec_${job.id}`,
      startedAt: new Date(),
    };
  }
}
