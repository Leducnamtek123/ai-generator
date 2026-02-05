import { Injectable } from '@nestjs/common';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';
import { WorkflowRepository } from './infrastructure/persistence/workflow.repository';
import { WorkflowEngine } from './engine/workflow.engine';
import { WorkflowGraph } from './engine/types';

@Injectable()
export class WorkflowsService {
  constructor(
    private readonly workflowRepository: WorkflowRepository,
    private readonly workflowEngine: WorkflowEngine,
  ) { }

  create(createWorkflowDto: CreateWorkflowDto) {
    const clonedPayload = {
      name: createWorkflowDto.name,
      nodes: createWorkflowDto.nodes,
      edges: createWorkflowDto.edges,
      projectId: createWorkflowDto.projectId,
      previewUrl: createWorkflowDto.previewUrl,
    };
    return this.workflowRepository.create(clonedPayload);
  }

  findAll(userId: string) {
    return this.workflowRepository.findAll(userId);
  }

  findByProject(projectId: string) {
    return this.workflowRepository.findByProject(projectId);
  }

  findOne(id: string) {
    return this.workflowRepository.findById(id);
  }

  update(id: string, updateWorkflowDto: UpdateWorkflowDto) {
    const payload: Partial<UpdateWorkflowDto> = {};

    if (updateWorkflowDto.name !== undefined) payload.name = updateWorkflowDto.name;
    if (updateWorkflowDto.nodes !== undefined) payload.nodes = updateWorkflowDto.nodes;
    if (updateWorkflowDto.edges !== undefined) payload.edges = updateWorkflowDto.edges;
    if (updateWorkflowDto.previewUrl !== undefined) payload.previewUrl = updateWorkflowDto.previewUrl;

    return this.workflowRepository.update(id, payload as any);
  }

  remove(id: string) {
    return this.workflowRepository.remove(id);
  }

  async execute(id: string, userId: string, nodes?: any[], edges?: any[]) {
    const workflow = await this.findOne(id);
    if (!workflow) {
      throw new Error('Workflow not found');
    }

    // Build the graph from provided data or fallback to stored workflow data
    const graph: WorkflowGraph = {
      nodes: (nodes || workflow.nodes) as any[] || [],
      edges: (edges || workflow.edges) as any[] || [],
    };

    // Execute using the engine
    const executionState = await this.workflowEngine.execute(id, graph, userId);

    return {
      status: executionState.status,
      workflowId: id,
      workflowName: workflow.name,
      executionId: `exec_${Date.now()}`,
      startedAt: executionState.startedAt,
      completedAt: executionState.completedAt,
      nodeStates: Object.fromEntries(executionState.nodeStates),
      error: executionState.error,
    };
  }
}

