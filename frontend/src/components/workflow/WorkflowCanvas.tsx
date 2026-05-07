'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ReactFlow, Background, Controls, useReactFlow, ReactFlowProvider, BackgroundVariant } from '@xyflow/react';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import '@xyflow/react/dist/style.css';
import { cn } from '@/lib/utils';
import { Button } from '@/ui/button';
import { get as apiGet } from '@/lib/api';
import type { Template } from '@/lib/api/templates';

// Components
import { PropertiesPanel } from './PropertiesPanel';
import { FloatingToolbar } from './FloatingToolbar';
import { CanvasEmptyState } from './CanvasEmptyState';
import { CommentsPanel } from './CommentsPanel';
import { ImageEditorModal } from './ImageEditorModal';
import { VideoEditorModal } from './VideoEditorModal';

// Hooks & Types
import { useWorkflowStore } from '@/stores/workflow-store';
import { useWorkflowHistory } from './hooks/useWorkflowHistory';
import { useWorkflowExecution } from './hooks/useWorkflowExecution';
import { useWorkflowHandlers } from './hooks/useWorkflowHandlers';
import { buildNodeConnectionSnapshot } from './connection-utils';
import { inferNodeOutputType } from './connection-utils';
import { buildWorkflowBody } from './workflow-payload';
import { nodeTypes } from './NodeRegistry';
import { ConnectionType, WorkflowNodeType } from './types';
import { useWorkflowUIStore } from '@/stores/workflow-ui-store';

interface WorkflowCanvasProps {
    projectId?: string;
    templateId?: string;
    workflowId?: string;
}

function WorkflowCanvasShell({ projectId, templateId, workflowId }: WorkflowCanvasProps) {
    const [isHydrated, setIsHydrated] = useState(false);
    const [hydrateError, setHydrateError] = useState<string | null>(null);
    const [hydrateAttempt, setHydrateAttempt] = useState(0);
    const router = useRouter();
    const { fetchWorkflow, fetchWorkflowByProject, createWorkflow } = useWorkflowStore();

    useEffect(() => {
        let cancelled = false;

        const hydrate = async () => {
            setHydrateError(null);
            setIsHydrated(false);
            useWorkflowStore.setState({
                workflow: null,
                nodes: [],
                edges: [],
                isExecuting: false,
                executionStatus: 'idle',
                executionError: null,
                lastExecutionResult: null,
            });

            try {
                if (templateId) {
                    const template = await apiGet<Template>(`/templates/${templateId}`);
                    const templateNodes = template.content?.nodes || [];
                    const templateEdges = template.content?.edges || [];

                    if (workflowId) {
                        await fetchWorkflow(workflowId);
                        const workflow = useWorkflowStore.getState().workflow;
                        if (!workflow || workflow.id !== workflowId) {
                            throw new Error(`Workflow ${workflowId} could not be loaded.`);
                        }
                    } else {
                        const newWorkflowId = await createWorkflow({
                            name: template.title || 'Untitled Studio',
                            projectId,
                            nodes: templateNodes,
                            edges: templateEdges,
                        });

                        if (!newWorkflowId) {
                            throw new Error(`Template ${templateId} could not be converted into a workflow.`);
                        }

                        router.replace(`/creator/workflow-editor?workflowId=${newWorkflowId}${projectId ? `&projectId=${projectId}` : ''}`);
                        await fetchWorkflow(newWorkflowId);
                    }
                } else if (workflowId) {
                    await fetchWorkflow(workflowId);
                    const workflow = useWorkflowStore.getState().workflow;
                    if (!workflow || workflow.id !== workflowId) {
                        throw new Error(`Workflow ${workflowId} could not be loaded.`);
                    }
                } else if (projectId) {
                    await fetchWorkflowByProject(projectId);
                    const state = useWorkflowStore.getState();
                    if (!state.workflow) {
                        throw new Error(`Project ${projectId} could not be loaded.`);
                    }
                } else {
                    const draftWorkflowId = await createWorkflow({
                        name: 'Untitled Studio',
                        nodes: [],
                        edges: [],
                    });

                    if (!draftWorkflowId) {
                        throw new Error('Could not create a draft workflow.');
                    }

                    router.replace(`/creator/workflow-editor?workflowId=${draftWorkflowId}`);
                    await fetchWorkflow(draftWorkflowId);
                }
            } catch (error) {
                if (!cancelled) {
                    const message = error instanceof Error ? error.message : 'Failed to load workflow.';
                    setHydrateError(message);
                }
            } finally {
                if (!cancelled) {
                    setIsHydrated(true);
                }
            }
        };

        if (!projectId && !templateId && !workflowId) {
            setIsHydrated(true);
            return;
        }

        void hydrate();

        return () => {
            cancelled = true;
        };
    }, [projectId, templateId, workflowId, fetchWorkflow, fetchWorkflowByProject, createWorkflow, router, hydrateAttempt]);

    if (!isHydrated) {
        return (
            <div className="flex h-full w-full items-center justify-center bg-background text-muted-foreground">
                Loading workflow...
            </div>
        );
    }

    if (hydrateError) {
        return (
            <div className="flex h-full w-full items-center justify-center bg-background px-6 text-foreground">
                <div className="max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl">
                    <p className="text-lg font-semibold">Workflow failed to load</p>
                    <p className="mt-2 text-sm text-muted-foreground">{hydrateError}</p>
                    <div className="mt-5 flex gap-3">
                        <Button onClick={() => setHydrateAttempt((value) => value + 1)}>Retry</Button>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setHydrateError(null);
                                setHydrateAttempt((value) => value + 1);
                            }}
                        >
                            Reload
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return <WorkflowCanvasContent />;
}

function WorkflowCanvasContent() {
    const { resolvedTheme } = useTheme();
    const { zoomIn, zoomOut, fitView } = useReactFlow();
    const {
        nodes, edges, onNodesChange, onEdgesChange, setNodes, setEdges, flushWorkflowSave,
        isSaving, executeWorkflow, isExecuting,
    } = useWorkflowStore();
    const [pendingConnection, setPendingConnection] = React.useState<{
        nodeId: string;
        handleId: string;
        handleType: 'source' | 'target';
        sourceType: ConnectionType | null;
    } | null>(null);

    useEffect(() => {
        const flushPendingWorkflow = () => {
            const state = useWorkflowStore.getState();
            if (!state.workflow) return;

            if (state.saveTimeout) {
                clearTimeout(state.saveTimeout);
                useWorkflowStore.setState({ saveTimeout: null });
            }

            const payload = JSON.stringify(buildWorkflowBody(state.nodes, state.edges));

            void fetch(`/api/workflows/${state.workflow.id}`, {
                method: 'PATCH',
                credentials: 'include',
                keepalive: true,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: payload,
            });
        };

        window.addEventListener('beforeunload', flushPendingWorkflow);
        window.addEventListener('pagehide', flushPendingWorkflow);

        return () => {
            window.removeEventListener('beforeunload', flushPendingWorkflow);
            window.removeEventListener('pagehide', flushPendingWorkflow);
        };
    }, []);

    // Custom Hooks
    const { saveToHistory, undo, redo, canUndo, canRedo } = useWorkflowHistory(nodes, edges);
    const { runWorkflow } = useWorkflowExecution(setNodes, saveToHistory);
    const {
        selectedNode, setSelectedNode, activeTool, setActiveTool,
        onConnect, addNode, updateNodeData, handleDeleteNode, handlePaneClick, handleNodeClick,
        handleTextChange, handleDuplicateNode
    } = useWorkflowHandlers(nodes, setNodes, setEdges, saveToHistory, runWorkflow, () => {
        setPendingConnection(null);
    });

    const [editingMedia, setEditingMedia] = React.useState<{ url: string; type: 'image' | 'video' } | null>(null);
    const [isCommentsOpen, setIsCommentsOpen] = React.useState(false);
    const [isDraggingNode, setIsDraggingNode] = React.useState(false);
    const helperLines = useWorkflowUIStore((state) => state.helperLines);
    const mouseWheelMode = useWorkflowUIStore((state) => state.mouseWheelMode);
    const selectedNodeId = selectedNode?.id;
    const liveSelectedNode = useMemo(() => {
        if (!selectedNodeId) return null;
        return nodes.find((node) => node.id === selectedNodeId) ?? null;
    }, [nodes, selectedNodeId]);

    const nodesWithHandlers = useMemo(() => {
        return nodes.map(node => {
            const connectionSnapshot = buildNodeConnectionSnapshot(node, nodes, edges);

            return {
                ...node,
                    data: {
                        ...node.data,
                        ...connectionSnapshot,
                        onRun: (id?: string) => runWorkflow(id || node.id),
                        onMediaChange: (id: string, url: string, name: string, thumbnail?: string) => {
                            updateNodeData(id, { mediaUrl: url, mediaName: name, mediaThumbnail: thumbnail });
                            void flushWorkflowSave();
                        },
                        onDelete: handleDeleteNode,
                        onChange: (id: string, data: Record<string, unknown>) => updateNodeData(id, data),
                        onSettingsChange: (id: string, settings: Record<string, unknown>) => updateNodeData(id, settings),
                        onOpenImageEditor: (url: string) => setEditingMedia({ url, type: 'image' }),
                        onOpenVideoEditor: (url: string) => setEditingMedia({ url, type: 'video' }),
                        onTextChange: handleTextChange,
                        onDuplicate: () => handleDuplicateNode(node.id),
                        onSettings: () => setSelectedNode(node),
                        onHandleClick: (event: React.MouseEvent, handleId: string, handleType: 'source' | 'target') => {
                            event.stopPropagation();

                            if (handleType === 'source') {
                                setPendingConnection({
                                    nodeId: node.id,
                                    handleId,
                                    handleType,
                                    sourceType: inferNodeOutputType(node),
                                });
                                return;
                            }

                            if (pendingConnection && pendingConnection.handleType === 'source') {
                                if (pendingConnection.nodeId === node.id) {
                                    setPendingConnection(null);
                                    return;
                                }

                                onConnect({
                                    source: pendingConnection.nodeId,
                                    sourceHandle: pendingConnection.handleId,
                                    target: node.id,
                                    targetHandle: handleId,
                                });
                                setPendingConnection(null);
                                return;
                            }

                            setPendingConnection(null);
                        },
                }
            };
        });
    }, [nodes, edges, runWorkflow, updateNodeData, flushWorkflowSave, handleDeleteNode, handleTextChange, handleDuplicateNode, setSelectedNode, pendingConnection, onConnect]);

    return (
        <div className="flex h-full w-full flex-col bg-background text-foreground">
            <div className="flex-1 relative overflow-hidden">
                <FloatingToolbar
                    onAddNode={addNode}
                    onToolChange={setActiveTool}
                    onUndo={() => undo(setNodes, setEdges)}
                    onRedo={() => redo(setNodes, setEdges)}
                    onZoomIn={() => zoomIn()}
                    onZoomOut={() => zoomOut()}
                    onFitView={() => fitView({ padding: 0.2 })}
                    activeTool={activeTool}
                    canUndo={canUndo}
                    canRedo={canRedo}
                    isSaving={isSaving}
                    onRun={executeWorkflow}
                    isExecuting={isExecuting}
                    onOpenComments={() => setIsCommentsOpen(true)}
                />

                {nodes.length === 0 && <CanvasEmptyState onAddNode={addNode} />}

                <div className={cn(
                    "workflow-canvas h-full w-full",
                    activeTool === 'pan' ? "cursor-grab" : "cursor-default",
                    nodes.length === 0 && 'hidden'
                )}>
                    <ReactFlow
                        nodes={nodesWithHandlers}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onNodeDragStart={() => setIsDraggingNode(true)}
                        onNodeDragStop={() => {
                            setIsDraggingNode(false);
                            void flushWorkflowSave();
                        }}
                        onPaneClick={handlePaneClick}
                        onNodeClick={handleNodeClick}
                        nodeTypes={nodeTypes}
                        colorMode={resolvedTheme === 'dark' ? 'dark' : 'light'}
                        panOnDrag={activeTool === 'pan'}
                        panOnScroll={mouseWheelMode === 'pan'}
                        zoomOnScroll={mouseWheelMode === 'zoom'}
                    >
                        {helperLines && <Background variant={BackgroundVariant.Dots} color={resolvedTheme === 'dark' ? '#333' : '#cbd5e1'} gap={24} size={1} />}
                        <Controls />
                    </ReactFlow>
                </div>

                {isDraggingNode && (
                    <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-dashed border-primary/40 bg-background/80 px-5 py-3 text-sm text-muted-foreground shadow-2xl backdrop-blur">
                        Drop the node here to place it
                    </div>
                )}

                {pendingConnection && (
                    <div className="pointer-events-none absolute left-1/2 top-4 z-30 -translate-x-1/2 rounded-full border border-primary/30 bg-background/90 px-3 py-1 text-[11px] text-muted-foreground shadow-lg backdrop-blur">
                        Output selected. Click an input port to connect.
                    </div>
                )}

                {nodes.length > 0 && !pendingConnection && (
                    <div className="pointer-events-none absolute left-1/2 top-4 z-20 -translate-x-1/2 rounded-full border border-border/80 bg-background/85 px-3 py-1 text-[11px] text-muted-foreground shadow-lg backdrop-blur">
                        Connect nodes: drag or click an OUT port, then an IN port.
                    </div>
                )}

                <div className={cn("absolute right-0 top-0 bottom-0 z-30 transition-transform", !liveSelectedNode && "translate-x-full")}>
                    <PropertiesPanel selectedNode={liveSelectedNode} onChange={updateNodeData} onClose={() => setSelectedNode(null)} />
                </div>

                <ImageEditorModal
                    isOpen={editingMedia?.type === 'image'}
                    onClose={() => setEditingMedia(null)}
                    imageUrl={editingMedia?.type === 'image' ? editingMedia.url : ''}
                />
                
                <VideoEditorModal
                    isOpen={editingMedia?.type === 'video'}
                    onClose={() => setEditingMedia(null)}
                    videoUrl={editingMedia?.type === 'video' ? editingMedia.url : ''}
                />

                <CommentsPanel
                    isOpen={isCommentsOpen}
                    onClose={() => setIsCommentsOpen(false)}
                    onAddFirstComment={() => addNode(WorkflowNodeType.COMMENT, 'Comment')}
                />
            </div>
        </div>
    );
}

export function WorkflowCanvas(props: WorkflowCanvasProps) {
    return (
        <ReactFlowProvider>
            <WorkflowCanvasShell {...props} />
        </ReactFlowProvider>
    );
}
