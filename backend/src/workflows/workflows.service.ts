import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';
import { WorkflowRepository } from './infrastructure/persistence/workflow.repository';
import { WorkflowEngine } from './engine/workflow.engine';
import { WorkflowGraph } from './engine/types';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { WORKFLOW_QUEUE } from '../queues/queues.constants';

@Injectable()
export class WorkflowsService {
  constructor(
    private readonly workflowRepository: WorkflowRepository,
    private readonly workflowEngine: WorkflowEngine,
    @InjectQueue(WORKFLOW_QUEUE) private workflowQueue: Queue,
  ) {}

  create(createWorkflowDto: CreateWorkflowDto) {
    const clonedPayload = {
      name: createWorkflowDto.name,
      nodes: createWorkflowDto.nodes,
      edges: createWorkflowDto.edges,
      projectId: createWorkflowDto.projectId,
      previewUrl: createWorkflowDto.previewUrl,
      visibility: createWorkflowDto.visibility || 'private',
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
