import type { Edge, Node } from '@xyflow/react';

export type WorkflowNodeBody = {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, unknown>;
};

export type WorkflowEdgeBody = {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
};

function clonePlainObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object') {
    return {};
  }

  try {
    return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
  } catch {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).filter(([, entry]) => typeof entry !== 'function'),
    );
  }
}

export function buildWorkflowNodeBody(nodes: Node[]): WorkflowNodeBody[] {
  return nodes.map((node) => ({
    id: node.id,
    type: node.type ?? 'default',
    position: {
      x: node.position?.x ?? 0,
      y: node.position?.y ?? 0,
    },
    data: clonePlainObject(node.data),
  }));
}

export function buildWorkflowEdgeBody(edges: Edge[]): WorkflowEdgeBody[] {
  return edges.map((edge) => {
    const edgeBody: WorkflowEdgeBody = {
      id: edge.id,
      source: edge.source,
      target: edge.target,
    };

    if (edge.sourceHandle !== null && edge.sourceHandle !== undefined) {
      edgeBody.sourceHandle = edge.sourceHandle;
    }

    if (edge.targetHandle !== null && edge.targetHandle !== undefined) {
      edgeBody.targetHandle = edge.targetHandle;
    }

    return edgeBody;
  });
}

export function buildWorkflowBody(nodes: Node[], edges: Edge[]) {
  return {
    nodes: buildWorkflowNodeBody(nodes),
    edges: buildWorkflowEdgeBody(edges),
  };
}
