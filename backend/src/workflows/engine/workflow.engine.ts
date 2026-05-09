import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  WorkflowGraph,
  WorkflowNode,
  WorkflowStatus,
  NodeStatus,
  WorkflowExecutionState,
} from './types';
import {
  NodeProcessor,
  ProcessorContext,
  TextNodeProcessor,
  ReferenceNodeProcessor,
  ImageGenNodeProcessor,
  VideoGenNodeProcessor,
  UpscaleNodeProcessor,
  AssistantNodeProcessor,
  ToolNodeProcessor,
} from './processors';
import { GENERATION_QUEUE } from '../../queues/queues.constants';

function firstString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed) return trimmed;
    }
  }
  return '';
}

@Injectable()
export class WorkflowEngine {
  private readonly logger = new Logger(WorkflowEngine.name);
  private readonly processors: Map<string, NodeProcessor>;

  constructor(@InjectQueue(GENERATION_QUEUE) private generationQueue: Queue) {
    // Register all node processors
    this.processors = new Map();
    this.registerProcessor(new TextNodeProcessor());
    this.registerProcessor(new ReferenceNodeProcessor('input'));
    this.registerProcessor(new ReferenceNodeProcessor('process'));
    this.registerProcessor(new ReferenceNodeProcessor('output'));
    this.registerProcessor(new ReferenceNodeProcessor('sticky_note'));
    this.registerProcessor(new ReferenceNodeProcessor('group'));
    this.registerProcessor(new ReferenceNodeProcessor('sticker'));
    this.registerProcessor(new ReferenceNodeProcessor('comment'));
    this.registerProcessor(new ImageGenNodeProcessor());
    this.registerProcessor(new VideoGenNodeProcessor());
    this.registerProcessor(new UpscaleNodeProcessor());
    this.registerProcessor(new AssistantNodeProcessor());
    this.registerProcessor(new ToolNodeProcessor());
  }

  private registerProcessor(processor: NodeProcessor): void {
    this.processors.set(processor.nodeType, processor);
  }

  /**
   * Execute a workflow graph
   */
  async execute(
    workflowId: string,
    graph: WorkflowGraph,
    userId: string,
    projectId?: string,
    runId = workflowId,
  ): Promise<WorkflowExecutionState> {
    this.logger.log(`Starting execution of workflow ${workflowId}`);

    const state: WorkflowExecutionState = {
      workflowId,
      status: WorkflowStatus.RUNNING,
      nodeStates: new Map(),
      startedAt: new Date(),
    };

    // Initialize node states
    for (const node of graph.nodes) {
      state.nodeStates.set(node.id, {
        nodeId: node.id,
        status: NodeStatus.PENDING,
      });
    }

    try {
      // Get execution order using topological sort
      const executionOrder = this.topologicalSort(graph);
      this.logger.debug(`Execution order: ${executionOrder.join(' -> ')}`);

      // Execute nodes in order
      const nodeOutputs = new Map<string, any>();

      for (const nodeId of executionOrder) {
        const node = graph.nodes.find((n) => n.id === nodeId);
        if (!node) continue;

        // Gather inputs from connected source nodes
        const nodeInputs = this.gatherInputs(node.id, graph, nodeOutputs);

        // Execute the node
        const result = await this.executeNode(
          node,
          {
            workflowId,
            userId,
            nodeInputs,
            projectId,
            runId,
          },
          state,
        );

        if (result.output) {
          nodeOutputs.set(nodeId, result.output);
        }

        if (!result.success) {
          state.status = WorkflowStatus.FAILED;
          state.error = result.error;
          break;
        }
      }

      const hasQueuedNodes = [...state.nodeStates.values()].some(
        (nodeState) => nodeState.status === NodeStatus.QUEUED,
      );

      if (state.status !== WorkflowStatus.FAILED) {
        state.status = hasQueuedNodes
          ? WorkflowStatus.RUNNING
          : WorkflowStatus.COMPLETED;
      }
    } catch (error: any) {
      this.logger.error(`Workflow ${workflowId} failed: ${error.message}`);
      state.status = WorkflowStatus.FAILED;
      state.error = error.message;
    }

    if (
      state.status === WorkflowStatus.COMPLETED ||
      state.status === WorkflowStatus.FAILED
    ) {
      state.completedAt = new Date();
    }
    return state;
  }

  /**
   * Execute a single node
   */
  private async executeNode(
    node: WorkflowNode,
    context: ProcessorContext,
    state: WorkflowExecutionState,
  ): Promise<{ success: boolean; output?: any; error?: string }> {
    const nodeState = state.nodeStates.get(node.id)!;
    nodeState.status = NodeStatus.RUNNING;
    nodeState.startedAt = new Date();

    const processor = this.processors.get(node.type);

    if (!processor) {
      this.logger.warn(`No processor for node type: ${node.type}`);
      nodeState.status = NodeStatus.SKIPPED;
      return { success: true };
    }

    try {
      const result = await processor.process(node, context);

      if (result.success) {
        nodeState.output = result.output;

        // If the output indicates a queued job, add to BullMQ
        if (result.output?.status === 'queued') {
          nodeState.status = NodeStatus.QUEUED;
          await this.queueGenerationJob(node, context, result.output);
        } else {
          nodeState.status = NodeStatus.COMPLETED;
        }
      } else {
        nodeState.status = NodeStatus.FAILED;
        nodeState.error = result.error;
      }

      nodeState.completedAt = new Date();
      return result;
    } catch (error: any) {
      nodeState.status = NodeStatus.FAILED;
      nodeState.error = error.message;
      nodeState.completedAt = new Date();
      return { success: false, error: error.message };
    }
  }

  /**
   * Queue a generation job to BullMQ
   */
  private async queueGenerationJob(
    node: WorkflowNode,
    context: ProcessorContext,
    output: any,
  ): Promise<void> {
    const jobType = this.getJobType(node);
    if (!jobType) return;

    const jobId = `${context.workflowId}:${context.runId}:${node.id}:${jobType}`;
    const existingJob = await this.generationQueue.getJob(jobId);
    if (existingJob) {
      const state = await existingJob.getState().catch(() => undefined);
      if (state === 'active') {
        this.logger.warn(
          `Job ${jobId} is already active, skipping duplicate enqueue`,
        );
        return;
      }

      await existingJob.remove().catch((error: any) => {
        this.logger.debug(
          `Failed to remove existing workflow job ${jobId}: ${error.message}`,
        );
      });
    }

    await this.generationQueue.add(
      jobType,
      {
        type: jobType,
        userId: context.userId,
        params: output,
        nodeId: node.id,
        workflowId: context.workflowId,
        projectId: context.projectId,
        runId: context.runId,
      },
      {
        jobId,
        removeOnComplete: true,
        removeOnFail: 10,
      },
    );

    this.logger.debug(`Queued ${jobType} job for node ${node.id}`);
  }

  private getJobType(
    node: WorkflowNode,
  ):
    | 'image'
    | 'video'
    | 'upscale'
    | 'enhance'
    | 'music'
    | 'sfx'
    | 'voice'
    | 'lip-sync'
    | 'video-upscale'
    | 'bg-remove'
    | 'sketch-to-image'
    | 'variations'
    | 'camera-change'
    | 'icon-gen'
    | 'image-extend'
    | 'mockup'
    | 'skin-enhance'
    | null {
    const mapping: Record<string, any> = {
      image_gen: 'image',
      video_gen: 'video',
      upscale: 'upscale',
      assistant: 'enhance',
      tool: {
        image_gen: 'image',
        video_gen: 'video',
        upscale: 'upscale',
        assistant: 'enhance',
        music: 'music',
        sfx: 'sfx',
        voice: 'voice',
        'lip-sync': 'lip-sync',
        'video-upscale': 'video-upscale',
        'bg-remove': 'bg-remove',
        'sketch-to-image': 'sketch-to-image',
        variations: 'variations',
        'camera-change': 'camera-change',
        'icon-gen': 'icon-gen',
        'image-extend': 'image-extend',
        mockup: 'mockup',
        'skin-enhance': 'skin-enhance',
      }[node.data.toolType || 'image_gen'],
    };
    return mapping[node.type] || null;
  }

  /**
   * Gather inputs from source nodes connected to this node
   */
  private gatherInputs(
    nodeId: string,
    graph: WorkflowGraph,
    nodeOutputs: Map<string, any>,
  ): Map<string, any> {
    const inputs = new Map<string, any>();

    const incomingEdges = graph.edges.filter((e) => e.target === nodeId);

    for (const edge of incomingEdges) {
      const sourceOutput = nodeOutputs.get(edge.source);
      if (sourceOutput) {
        // Map outputs to inputs based on handle names or use defaults
        const handleName = edge.targetHandle || 'default';
        const textValue = firstString(
          sourceOutput.text,
          sourceOutput.prompt,
          sourceOutput.originalPrompt,
          sourceOutput.enhancedText,
          sourceOutput.outputText,
          sourceOutput.content,
          sourceOutput.label,
          sourceOutput.name,
          sourceOutput.reference,
        );
        const imageValue = firstString(
          sourceOutput.imageUrl,
          sourceOutput.inputImageUrl,
          sourceOutput.startImageUrl,
          sourceOutput.previewUrl,
          sourceOutput.resultUrl,
          sourceOutput.mediaUrl,
        );
        const videoValue = firstString(
          sourceOutput.videoUrl,
          sourceOutput.inputVideoUrl,
          sourceOutput.startVideoUrl,
          sourceOutput.previewUrl,
          sourceOutput.resultUrl,
        );
        const referenceValue = firstString(
          sourceOutput.reference,
          sourceOutput.name,
          sourceOutput.label,
          sourceOutput.content,
        );

        if (textValue) {
          inputs.set('prompt', textValue);
          inputs.set('text', textValue);
          inputs.set('inputText', textValue);
        }
        if (imageValue) {
          inputs.set('image', imageValue);
          inputs.set('imageUrl', imageValue);
          inputs.set('inputImageUrl', imageValue);
          inputs.set('startImageUrl', imageValue);
        }
        if (videoValue) {
          inputs.set('video', videoValue);
          inputs.set('videoUrl', videoValue);
          inputs.set('inputVideoUrl', videoValue);
        }
        if (referenceValue) {
          inputs.set('reference', referenceValue);
        }
        if (sourceOutput.previewUrl)
          inputs.set('previewUrl', sourceOutput.previewUrl);
        if (sourceOutput.resultUrl)
          inputs.set('resultUrl', sourceOutput.resultUrl);
        if (sourceOutput.resultText)
          inputs.set('resultText', sourceOutput.resultText);
        if (sourceOutput.audioUrl) inputs.set('audio', sourceOutput.audioUrl);
        inputs.set(handleName, sourceOutput);
      }
    }

    return inputs;
  }

  /**
   * Topological sort for determining execution order
   */
  private topologicalSort(graph: WorkflowGraph): string[] {
    const visited = new Set<string>();
    const result: string[] = [];
    const visiting = new Set<string>();

    const visit = (nodeId: string) => {
      if (visited.has(nodeId)) return;
      if (visiting.has(nodeId)) {
        throw new Error(`Circular dependency detected at node ${nodeId}`);
      }

      visiting.add(nodeId);

      // Visit all nodes that this node depends on (sources of incoming edges)
      const incomingEdges = graph.edges.filter((e) => e.target === nodeId);
      for (const edge of incomingEdges) {
        visit(edge.source);
      }

      visiting.delete(nodeId);
      visited.add(nodeId);
      result.push(nodeId);
    };

    for (const node of graph.nodes) {
      visit(node.id);
    }

    return result;
  }
}
