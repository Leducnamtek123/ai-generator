'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ReactFlow, Background, Controls, useReactFlow, ReactFlowProvider, BackgroundVariant } from '@xyflow/react';
import type { Edge, Node } from '@xyflow/react';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import '@xyflow/react/dist/style.css';
import { Download, RotateCcw, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/ui/button';
import { get as apiGet } from '@/lib/api';
import { projectApi } from '@/services/projectApi';
import type { Template } from '@/lib/api/templates';
import { AsyncStateSurface } from '@/components/common/AsyncStateSurface';
import { toast } from 'sonner';

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
    const [canvasRevision, setCanvasRevision] = useState(0);
    const { replace } = useRouter();
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
                    const templateContent = template.content as {
                        nodes?: unknown[];
                        edges?: unknown[];
                    } | undefined;
                    const templateNodes = (templateContent?.nodes || []) as Node[];
                    const templateEdges = (templateContent?.edges || []) as Edge[];

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

                        replace(`/creator/workflow-editor?workflowId=${newWorkflowId}${projectId ? `&projectId=${projectId}` : ''}`);
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

                    replace(`/creator/workflow-editor?workflowId=${draftWorkflowId}`);
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
    }, [projectId, templateId, workflowId, fetchWorkflow, fetchWorkflowByProject, createWorkflow, replace, hydrateAttempt]);

    if (!isHydrated) {
        return (
            <AsyncStateSurface
                status="loading"
                title="Loading workflow"
                message="Preparing the editor and restoring the latest graph state."
                compact
            />
        );
    }

    if (hydrateError) {
        return (
            <AsyncStateSurface
                status="error"
                title="Workflow failed to load"
                message={hydrateError}
                onRetry={() => setHydrateAttempt((value) => value + 1)}
                retryLabel="Retry"
                compact
            />
        );
    }

    return <WorkflowCanvasContent key={canvasRevision} projectId={projectId} onResetCanvas={() => setCanvasRevision((value) => value + 1)} />;
}

function WorkflowCanvasContent({ projectId, onResetCanvas }: { projectId?: string; onResetCanvas: () => void }) {
    const { resolvedTheme } = useTheme();
    const { zoomIn, zoomOut, fitView } = useReactFlow();
    const {
        workflow, nodes, edges, onNodesChange, onEdgesChange, setNodes, setEdges, flushWorkflowSave,
        fetchWorkflow, isSaving, executeWorkflow, isExecuting, executionError,
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
            const endpoint = `/api/workflows/${state.workflow.id}`;
            const body = new Blob([payload], { type: 'application/json' });
            navigator.sendBeacon(endpoint, body);
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
    const [isProjectSaving, setIsProjectSaving] = React.useState(false);
    const [projectSaveError, setProjectSaveError] = React.useState<string | null>(null);
    const helperLines = useWorkflowUIStore((state) => state.helperLines);
    const mouseWheelMode = useWorkflowUIStore((state) => state.mouseWheelMode);
    const selectedNodeId = selectedNode?.id;
    const liveSelectedNode = useMemo(() => {
        if (!selectedNodeId) return null;
        return nodes.find((node) => node.id === selectedNodeId) ?? null;
    }, [nodes, selectedNodeId]);

    const persistProjectSnapshot = React.useCallback(async () => {
        if (!projectId || !workflow) {
            return true;
        }

        try {
            setIsProjectSaving(true);
            setProjectSaveError(null);
            await projectApi.update(projectId, {
                name: workflow.name,
                description: 'Workflow editor snapshot',
                content: {
                    version: 1,
                    savedAt: new Date().toISOString(),
                    workflowId: workflow.id,
                    graph: buildWorkflowBody(nodes, edges),
                },
            });
            return true;
        } catch (error) {
            console.error('Failed to persist workflow project snapshot', error);
            setProjectSaveError('Workflow project snapshot save failed. The graph itself is still saved.');
            return false;
        } finally {
            setIsProjectSaving(false);
        }
    }, [edges, nodes, projectId, workflow]);

    useEffect(() => {
        if (!projectId || !workflow) return;

        const timeout = window.setTimeout(() => {
            void persistProjectSnapshot();
        }, 2000);

        return () => window.clearTimeout(timeout);
    }, [edges, nodes, persistProjectSnapshot, projectId, workflow]);

    const handleSave = React.useCallback(async () => {
        await flushWorkflowSave();
        if (projectId && workflow) {
            const persisted = await persistProjectSnapshot();
            if (!persisted) {
                toast.error('Workflow saved, but project snapshot persistence failed.');
                return;
            }
        }

        toast.success('Workflow saved');
    }, [flushWorkflowSave, persistProjectSnapshot, projectId, workflow]);

    const handleExport = React.useCallback(() => {
        const payload = buildWorkflowBody(nodes, edges);
        const exportPayload = {
            workflowId: workflow?.id ?? null,
            name: workflow?.name ?? 'Untitled Studio',
            exportedAt: new Date().toISOString(),
            graph: payload,
        };
        const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `${workflow?.name?.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'workflow'}-export.json`;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(url);
        toast.success('Workflow exported');
    }, [nodes, edges, workflow?.id, workflow?.name]);

    const handleReset = React.useCallback(async () => {
        if (!workflow?.id) {
            toast.error('No workflow to reset');
            return;
        }

        await fetchWorkflow(workflow.id);
        setSelectedNode(null);
        setPendingConnection(null);
        setIsCommentsOpen(false);
        setEditingMedia(null);
        onResetCanvas();
        toast.success('Workflow restored');
    }, [fetchWorkflow, onResetCanvas, setSelectedNode, workflow?.id]);

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
                <div className="absolute right-5 top-5 z-40 flex items-center gap-2">
                    {executionError && (
                        <div className="hidden max-w-[360px] rounded-full border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200 shadow-lg backdrop-blur md:block">
                            {executionError}
                        </div>
                    )}
                    {projectSaveError && (
                        <div className="hidden max-w-[360px] rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200 shadow-lg backdrop-blur md:block">
                            {projectSaveError}
                        </div>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleReset}
                        className="h-10 rounded-full border-border/70 bg-background/90 px-4"
                    >
                        <RotateCcw className="mr-2 size-4" />
                        Reset
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSave}
                        disabled={isSaving || isProjectSaving}
                        className="h-10 rounded-full border-border/70 bg-background/90 px-4"
                    >
                        <Save className="mr-2 size-4" />
                        {isSaving || isProjectSaving ? 'Saving...' : 'Save'}
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleExport}
                        className="h-10 rounded-full bg-primary px-4 text-primary-foreground hover:bg-primary/90"
                    >
                        <Download className="mr-2 size-4" />
                        Export
                    </Button>
                </div>

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
