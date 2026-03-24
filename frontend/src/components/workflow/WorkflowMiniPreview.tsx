'use client';

import React, { useMemo } from 'react';
import {
    ReactFlow,
    Background,
    Node,
    Edge,
    ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { WorkflowNodeType } from './types';
import { TextNode } from './nodes/TextNode';
import { GeneratorNode } from './nodes/GeneratorNode';
import { AssistantNode } from './nodes/AssistantNode';
import { UpscaleNode } from './nodes/UpscaleNode';
import { MediaNode } from './nodes/MediaNode';
import { useTheme } from 'next-themes';

const nodeTypes = {
    [WorkflowNodeType.TEXT]: TextNode,
    [WorkflowNodeType.IMAGE_GEN]: GeneratorNode,
    [WorkflowNodeType.VIDEO_GEN]: GeneratorNode,
    [WorkflowNodeType.ASSISTANT]: AssistantNode,
    [WorkflowNodeType.UPSCALE]: UpscaleNode,
    [WorkflowNodeType.MEDIA]: MediaNode,
    // Add fallback/basic types if needed
    input: (props: any) => <div className="p-2 border rounded bg-card text-foreground text-[10px] scale-50 origin-top-left">{props.data.label}</div>,
    process: (props: any) => <div className="p-2 border rounded bg-card text-foreground text-[10px] scale-50 origin-top-left">{props.data.label}</div>,
    output: (props: any) => <div className="p-2 border rounded bg-card text-foreground text-[10px] scale-50 origin-top-left">{props.data.label}</div>,
};

interface WorkflowMiniPreviewProps {
    nodes: Node[];
    edges: Edge[];
}

function WorkflowMiniPreviewContent({ nodes, edges }: WorkflowMiniPreviewProps) {
    const { theme: currentTheme } = useTheme();

    // Inject preview mode flag into node data so nodes can omit complex UI elements (like buttons/controls)
    const nodesWithPreviewMode = useMemo(() =>
        nodes.map(node => ({
            ...node,
            data: {
                ...node.data,
                isPreview: true // Custom property to hide buttons etc in node components
            }
        })),
        [nodes]);

    return (
        <ReactFlow
            nodes={nodesWithPreviewMode}
            edges={edges}
            nodeTypes={nodeTypes as any}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            className="bg-transparent pointer-events-none"
            colorMode={currentTheme === 'dark' ? 'dark' : 'light'}
            proOptions={{ hideAttribution: true }}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
            panOnDrag={false}
            zoomOnScroll={false}
            zoomOnDoubleClick={false}
        >
            <Background color={currentTheme === 'dark' ? '#333' : '#ddd'} gap={24} size={1} />
        </ReactFlow>
    );
}

export function WorkflowMiniPreview(props: WorkflowMiniPreviewProps) {
    if (!props.nodes || props.nodes.length === 0) return null;

    return (
        <div className="h-full w-full grayscale-[0.5] opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500">
            <ReactFlowProvider>
                <WorkflowMiniPreviewContent {...props} />
            </ReactFlowProvider>
        </div>
    );
}
