/**
 * Node execution status in a workflow
 */
export enum NodeStatus {
  PENDING = 'pending',
  QUEUED = 'queued',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SKIPPED = 'skipped',
}

/**
 * Workflow execution status
 */
export enum WorkflowStatus {
  IDLE = 'idle',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

/**
 * A node in the workflow graph
 */
export interface WorkflowNode {
  id: string;
  type: string;
  data: Record<string, any>;
  position: { x: number; y: number };
}

/**
 * An edge connecting two nodes
 */
export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

/**
 * Workflow graph structure
 */
export interface WorkflowGraph {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

/**
 * Runtime state for a node during execution
 */
export interface NodeExecutionState {
  nodeId: string;
  status: NodeStatus;
  input?: Record<string, any>;
  output?: Record<string, any>;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
}

/**
 * Runtime state for the entire workflow execution
 */
export interface WorkflowExecutionState {
  workflowId: string;
  status: WorkflowStatus;
  nodeStates: Map<string, NodeExecutionState>;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}
