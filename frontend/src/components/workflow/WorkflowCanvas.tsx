'use client';

import React, { useMemo } from 'react';
import { ReactFlow, Background, Controls, useReactFlow, ReactFlowProvider, BackgroundVariant } from '@xyflow/react';
import { useTheme } from 'next-themes';
import '@xyflow/react/dist/style.css';
import { cn } from '@/lib/utils';

// Components
import { PropertiesPanel } from './PropertiesPanel';
import { FloatingToolbar } from './FloatingToolbar';
import { CanvasEmptyState } from './CanvasEmptyState';
import { CommentsPanel } from './CommentsPanel';
import { HandleMenu } from './HandleMenu';
import { NodeContextMenu } from './NodeContextMenu';
import { MediaPickerModal } from '@/components/common/MediaPickerModal';
import { ImageEditorModal } from './ImageEditorModal';
import { VideoEditorModal } from './VideoEditorModal';

// Hooks & Types
import { useWorkflowStore } from '@/stores/workflow-store';
import { useWorkflowHistory } from './hooks/useWorkflowHistory';
import { useWorkflowExecution } from './hooks/useWorkflowExecution';
import { useWorkflowHandlers } from './hooks/useWorkflowHandlers';
import { WorkflowNodeType, NodeStatus } from './types';
import { nodeTypes } from './NodeRegistry';

interface WorkflowCanvasProps {
    projectId?: string;
    templateId?: string;
    workflowId?: string;
}

function WorkflowCanvasContent({ projectId, templateId, workflowId }: WorkflowCanvasProps) {
    const { theme: currentTheme } = useTheme();
    const {
        nodes, edges, onNodesChange, onEdgesChange, setNodes, setEdges,
        isSaving, executeWorkflow, isExecuting,
    } = useWorkflowStore();

    // Custom Hooks
    const { saveToHistory, undo, redo, canUndo, canRedo } = useWorkflowHistory(nodes, edges);
    const { runWorkflow } = useWorkflowExecution(setNodes, saveToHistory);
    const {
        selectedNode, setSelectedNode, activeTool, setActiveTool,
        onConnect, addNode, updateNodeData, handleToolChange,
        handleZoomIn, handleZoomOut, handleFitView, handlePaneClick
    } = useWorkflowHandlers(nodes, setNodes, setEdges, saveToHistory, runWorkflow);

    const nodesWithHandlers = useMemo(() => nodes.map(node => ({
        ...node,
        data: {
            ...node.data,
            onRun: (id?: string) => runWorkflow(id || node.id),
            // ... inject other handlers ...
        }
    })), [nodes, runWorkflow]);

    return (
        <div className="flex h-full w-full flex-col bg-[#0B0C0E]">
            <div className="flex-1 relative overflow-hidden">
                <FloatingToolbar
                    onAddNode={addNode}
                    onToolChange={setActiveTool}
                    onUndo={() => undo(setNodes, setEdges)}
                    onRedo={() => redo(setNodes, setEdges)}
                    activeTool={activeTool}
                    canUndo={canUndo}
                    canRedo={canRedo}
                    isSaving={isSaving}
                    onRun={executeWorkflow}
                    isExecuting={isExecuting}
                />

                {nodes.length === 0 && <CanvasEmptyState onAddNode={addNode} />}

                <div className={cn("h-full w-full", nodes.length === 0 && 'hidden')}>
                    <ReactFlow
                        nodes={nodesWithHandlers}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onPaneClick={handlePaneClick}
                        nodeTypes={nodeTypes as any}
                        colorMode={currentTheme === 'dark' ? 'dark' : 'light'}
                    >
                        <Background variant={BackgroundVariant.Dots} />
                        <Controls />
                    </ReactFlow>
                </div>

                <div className={cn("absolute right-0 top-0 bottom-0 z-30 transition-transform", !selectedNode && "translate-x-full")}>
                    <PropertiesPanel selectedNode={selectedNode} onChange={updateNodeData} onClose={() => setSelectedNode(null)} />
                </div>
            </div>
        </div>
    );
}

export function WorkflowCanvas(props: WorkflowCanvasProps) {
    return (
        <ReactFlowProvider>
            <WorkflowCanvasContent {...props} />
        </ReactFlowProvider>
    );
}
