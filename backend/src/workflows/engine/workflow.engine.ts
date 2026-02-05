import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
    WorkflowGraph,
    WorkflowNode,
    WorkflowEdge,
    WorkflowStatus,
    NodeStatus,
    NodeExecutionState,
    WorkflowExecutionState,
} from './types';
import {
    NodeProcessor,
    ProcessorContext,
    TextNodeProcessor,
    ImageGenNodeProcessor,
    VideoGenNodeProcessor,
    UpscaleNodeProcessor,
    AssistantNodeProcessor,
} from './processors';
import { GENERATION_QUEUE } from 'src/queues/queues.constants';

@Injectable()
export class WorkflowEngine {
    private readonly logger = new Logger(WorkflowEngine.name);
    private readonly processors: Map<string, NodeProcessor>;

    constructor(
        @InjectQueue(GENERATION_QUEUE) private generationQueue: Queue,
    ) {
        // Register all node processors
        this.processors = new Map();
        this.registerProcessor(new TextNodeProcessor());
        this.registerProcessor(new ImageGenNodeProcessor());
        this.registerProcessor(new VideoGenNodeProcessor());
        this.registerProcessor(new UpscaleNodeProcessor());
        this.registerProcessor(new AssistantNodeProcessor());
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
                const node = graph.nodes.find(n => n.id === nodeId);
                if (!node) continue;

                // Gather inputs from connected source nodes
                const nodeInputs = this.gatherInputs(node.id, graph, nodeOutputs);

                // Execute the node
                const result = await this.executeNode(node, {
                    workflowId,
                    userId,
                    nodeInputs,
                }, state);

                if (result.output) {
                    nodeOutputs.set(nodeId, result.output);
                }

                if (!result.success) {
                    state.status = WorkflowStatus.FAILED;
                    state.error = result.error;
                    break;
                }
            }

            if (state.status !== WorkflowStatus.FAILED) {
                state.status = WorkflowStatus.COMPLETED;
            }
        } catch (error: any) {
            this.logger.error(`Workflow ${workflowId} failed: ${error.message}`);
            state.status = WorkflowStatus.FAILED;
            state.error = error.message;
        }

        state.completedAt = new Date();
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
                nodeState.status = NodeStatus.COMPLETED;
                nodeState.output = result.output;

                // If the output indicates a queued job, add to BullMQ
                if (result.output?.status === 'queued') {
                    await this.queueGenerationJob(node, context, result.output);
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
        const jobType = this.getJobType(node.type);
        if (!jobType) return;

        await this.generationQueue.add(jobType, {
            type: jobType,
            userId: context.userId,
            params: output,
            nodeId: node.id,
            workflowId: context.workflowId,
        });

        this.logger.debug(`Queued ${jobType} job for node ${node.id}`);
    }

    private getJobType(nodeType: string): 'image' | 'video' | 'upscale' | 'enhance' | null {
        const mapping: Record<string, 'image' | 'video' | 'upscale' | 'enhance'> = {
            'image_gen': 'image',
            'video_gen': 'video',
            'upscale': 'upscale',
            'assistant': 'enhance',
        };
        return mapping[nodeType] || null;
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

        const incomingEdges = graph.edges.filter(e => e.target === nodeId);

        for (const edge of incomingEdges) {
            const sourceOutput = nodeOutputs.get(edge.source);
            if (sourceOutput) {
                // Map outputs to inputs based on handle names or use defaults
                const handleName = edge.targetHandle || 'default';
                if (sourceOutput.text) inputs.set('prompt', sourceOutput.text);
                if (sourceOutput.text) inputs.set('text', sourceOutput.text);
                if (sourceOutput.imageUrl) inputs.set('image', sourceOutput.imageUrl);
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
            const incomingEdges = graph.edges.filter(e => e.target === nodeId);
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
