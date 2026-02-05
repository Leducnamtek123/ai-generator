'use client';

import React, { useCallback, useState, useRef, useEffect } from 'react';
import {
    ReactFlow,
    Background,
    Controls,
    addEdge,
    useReactFlow,
    Node,
    Edge,
    Connection,
    ReactFlowProvider,
    OnSelectionChangeParams,
    SelectionMode,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { cn } from '@/lib/utils';

import { InputNode } from './nodes/InputNode';
import { ProcessNode } from './nodes/ProcessNode';
import { OutputNode } from './nodes/OutputNode';
import { TextNode } from './nodes/TextNode';
import { GeneratorNode } from './nodes/GeneratorNode';
import { AssistantNode } from './nodes/AssistantNode';
import { UpscaleNode } from './nodes/UpscaleNode';
import { MediaNode } from './nodes/MediaNode';

import { PropertiesPanel } from './PropertiesPanel';
import { FloatingToolbar, ToolMode } from './FloatingToolbar';
import { CanvasEmptyState } from './CanvasEmptyState';
import { WorkflowNodeType, ConnectionType } from './types';
import { NodeContextMenu, HandleMenu } from './NodeContextMenu';
import { MediaManagerModal } from './MediaManagerModal';
import { ImageEditorModal } from './ImageEditorModal';

// ... imports
import { useWorkflowStore } from '@/stores/workflow-store';
const nodeTypes = {
    [WorkflowNodeType.TEXT]: TextNode,
    [WorkflowNodeType.IMAGE_GEN]: GeneratorNode,
    [WorkflowNodeType.VIDEO_GEN]: GeneratorNode,
    [WorkflowNodeType.ASSISTANT]: AssistantNode,
    [WorkflowNodeType.UPSCALE]: UpscaleNode,
    [WorkflowNodeType.MEDIA]: MediaNode,
    // Legacy support for basic types
    input: InputNode,
    process: ProcessNode,
    output: OutputNode,
};

interface WorkflowCanvasProps {
    projectId?: string;
    templateId?: string;
    workflowId?: string;
}

interface HistoryState {
    nodes: Node[];
    edges: Edge[];
}

// Types of node inputs/outputs
type NodeOutput = {
    type: 'text' | 'image' | 'video' | 'enhanced_text';
    value: string;
};

// Menu states
interface HandleMenuState {
    position: { x: number; y: number };
    outputType: ConnectionType;
    sourceNodeId: string;
    sourceHandleId?: string;
}

interface ContextMenuState {
    position: { x: number; y: number };
    targetNodeId?: string;
    targetHandleId?: string;
    sourceConnectionType?: ConnectionType;
}

function WorkflowCanvasContent({ projectId, templateId, workflowId }: WorkflowCanvasProps) {
    const {
        nodes, edges,
        onNodesChange, onEdgesChange,
        fetchWorkflowByProject,
        fetchWorkflow,
        loadTemplate,
        setNodes,
        setEdges,
        isSaving,
        executeWorkflow,
        isExecuting
    } = useWorkflowStore();

    // Fetch workflow or template on mount
    useEffect(() => {
        if (templateId) {
            loadTemplate(templateId);
        } else if (workflowId) {
            fetchWorkflow(workflowId);
        } else if (projectId) {
            fetchWorkflowByProject(projectId);
        }
    }, [projectId, templateId, workflowId, fetchWorkflowByProject, loadTemplate, fetchWorkflow]);

    const { deleteElements, getNodes, getEdges, zoomIn, zoomOut, fitView, screenToFlowPosition } = useReactFlow();

    const [selectedNode, setSelectedNode] = useState<Node | null>(null);
    const [activeTool, setActiveTool] = useState<ToolMode>('select');

    const [history, setHistory] = useState<HistoryState[]>([{ nodes: [], edges: [] }]);
    const [historyIndex, setHistoryIndex] = useState(0);
    const isUndoRedo = useRef(false);

    // Menu state
    const [handleMenu, setHandleMenu] = useState<HandleMenuState | null>(null);
    const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

    // ===== NODE CONNECTION LOGIC =====

    // Get output from a node based on its type
    const getNodeOutput = useCallback((node: Node): NodeOutput | null => {
        const nodeType = node.type;

        switch (nodeType) {
            case 'text':
            case WorkflowNodeType.TEXT:
                if (node.data.text) {
                    return { type: 'text', value: node.data.text as string };
                }
                break;

            case 'media':
            case WorkflowNodeType.MEDIA:
                if (node.data.mediaUrl) {
                    const isVideo = (node.data.mediaName as string)?.match(/\.(mp4|webm|mov|avi)$/i);
                    return {
                        type: isVideo ? 'video' : 'image',
                        value: node.data.mediaUrl as string
                    };
                }
                break;

            case 'generator':
            case WorkflowNodeType.IMAGE_GEN:
                if (node.data.previewUrl) {
                    return { type: 'image', value: node.data.previewUrl as string };
                }
                break;

            case WorkflowNodeType.VIDEO_GEN:
                if (node.data.previewUrl) {
                    return { type: 'video', value: node.data.previewUrl as string };
                }
                break;

            case 'assistant':
            case WorkflowNodeType.ASSISTANT:
                if (node.data.enhancedText) {
                    return { type: 'enhanced_text', value: node.data.enhancedText as string };
                }
                break;

            case 'upscale':
            case WorkflowNodeType.UPSCALE:
                if (node.data.previewUrl) {
                    return { type: 'image', value: node.data.previewUrl as string };
                }
                break;
        }

        return null;
    }, []);

    // Get all inputs connected to a node
    const getNodeInputs = useCallback((nodeId: string): NodeOutput[] => {
        const currentNodes = getNodes();
        const currentEdges = getEdges();

        const incomingEdges = currentEdges.filter(e => e.target === nodeId);
        const inputs: NodeOutput[] = [];

        for (const edge of incomingEdges) {
            const sourceNode = currentNodes.find(n => n.id === edge.source);
            if (sourceNode) {
                const output = getNodeOutput(sourceNode);
                if (output) {
                    inputs.push(output);
                }
            }
        }

        return inputs;
    }, [getNodes, getEdges, getNodeOutput]);

    // Check if a node can accept a certain input type
    const canAcceptInput = (nodeType: string | undefined, inputType: NodeOutput['type']): boolean => {
        switch (nodeType) {
            case 'generator':
            case WorkflowNodeType.IMAGE_GEN:
            case WorkflowNodeType.VIDEO_GEN:
                // Generators accept text prompts and enhanced text
                return inputType === 'text' || inputType === 'enhanced_text';

            case 'assistant':
            case WorkflowNodeType.ASSISTANT:
                // Assistant accepts text to enhance
                return inputType === 'text';

            case 'upscale':
            case WorkflowNodeType.UPSCALE:
                // Upscaler accepts images
                return inputType === 'image';

            default:
                return true;
        }
    };

    // ===== HISTORY MANAGEMENT =====

    const saveToHistory = useCallback(() => {
        if (isUndoRedo.current) {
            isUndoRedo.current = false;
            return;
        }

        const currentNodes = getNodes();
        const currentEdges = getEdges();

        setHistory((prev: HistoryState[]) => {
            const newHistory = prev.slice(0, historyIndex + 1);
            newHistory.push({ nodes: currentNodes, edges: currentEdges });
            return newHistory.slice(-50);
        });
        setHistoryIndex((prev: number) => Math.min(prev + 1, 49));
    }, [getNodes, getEdges, historyIndex]);

    const handleUndo = useCallback(() => {
        if (historyIndex > 0) {
            isUndoRedo.current = true;
            const prevState = history[historyIndex - 1];
            setNodes(prevState.nodes);
            setEdges(prevState.edges);
            setHistoryIndex(prev => prev - 1);
        }
    }, [history, historyIndex, setNodes, setEdges]);

    const handleRedo = useCallback(() => {
        if (historyIndex < history.length - 1) {
            isUndoRedo.current = true;
            const nextState = history[historyIndex + 1];
            setNodes(nextState.nodes);
            setEdges(nextState.edges);
            setHistoryIndex((prev: number) => prev + 1);
        }
    }, [history, historyIndex, setNodes, setEdges]);

    // ===== NODE EXECUTION =====

    const runNode = useCallback(async (nodeId: string) => {
        const currentNodes = getNodes();
        const node = currentNodes.find(n => n.id === nodeId);
        if (!node) return;

        const nodeType = node.type;

        // Get inputs from connected nodes
        const inputs = getNodeInputs(nodeId);

        // Set status to processing
        setNodes((nds: Node[]) =>
            nds.map((n: Node) => n.id === nodeId ? { ...n, data: { ...n.data, status: 'processing' } } : n)
        );

        // Simulate API delay
        await new Promise(r => setTimeout(r, 1500 + Math.random() * 1500));

        // Process based on node type and inputs
        setNodes((nds) =>
            nds.map((n) => {
                if (n.id === nodeId) {
                    let newData: any = { ...n.data, status: 'success' };

                    switch (nodeType) {
                        case 'generator':
                        case WorkflowNodeType.IMAGE_GEN: {
                            // Get text input from connected nodes
                            const textInput = inputs.find(i => i.type === 'text' || i.type === 'enhanced_text');
                            const prompt = textInput?.value || 'random scene';

                            // Use prompt hash for consistent images with same prompt
                            const seed = prompt.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
                            newData.previewUrl = `https://picsum.photos/seed/${seed}-${Date.now()}/512/512`;
                            newData.usedPrompt = prompt;
                            break;
                        }

                        case WorkflowNodeType.VIDEO_GEN: {
                            const textInput = inputs.find(i => i.type === 'text' || i.type === 'enhanced_text');
                            const prompt = textInput?.value || 'random video';
                            const seed = prompt.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
                            // For video, we'd use a video API - using image as placeholder
                            newData.previewUrl = `https://picsum.photos/seed/video-${seed}-${Date.now()}/512/512`;
                            newData.usedPrompt = prompt;
                            break;
                        }

                        case 'assistant':
                        case WorkflowNodeType.ASSISTANT: {
                            // Get text input to enhance
                            const textInput = inputs.find(i => i.type === 'text');
                            const originalText = textInput?.value || 'creative scene';

                            // Generate enhanced prompt based on mode
                            const mode = n.data.mode || 'enhance';
                            let enhanced = '';

                            switch (mode) {
                                case 'enhance':
                                    enhanced = `A stunning, photorealistic ${originalText}. Ultra-detailed, 8K resolution, professional photography, perfect lighting, vibrant colors.`;
                                    break;
                                case 'expand':
                                    enhanced = `${originalText}, featuring intricate details, rich textures, atmospheric depth, cinematic composition, golden hour lighting, dramatic sky, professional grade.`;
                                    break;
                                case 'creative':
                                    enhanced = `An artistic interpretation of ${originalText}, with surreal elements, dreamlike quality, vibrant color palette, imaginative composition, fantasy atmosphere.`;
                                    break;
                                case 'artistic':
                                    enhanced = `${originalText} in the style of a masterpiece painting, oil on canvas, Renaissance techniques, chiaroscuro lighting, museum quality, timeless beauty.`;
                                    break;
                                default:
                                    enhanced = `A stunning, ultra-detailed ${originalText}. Cinematic lighting, 8K resolution, professional photography, vibrant colors, masterpiece quality.`;
                            }

                            newData.inputText = originalText;
                            newData.enhancedText = enhanced;
                            break;
                        }

                        case 'upscale':
                        case WorkflowNodeType.UPSCALE: {
                            // Get image input
                            const imageInput = inputs.find(i => i.type === 'image');

                            if (imageInput) {
                                // Use the input image (in reality, would upscale it)
                                newData.inputUrl = imageInput.value;
                                // For demo, use a higher res placeholder
                                const seed = imageInput.value.split('/').pop() || Date.now();
                                newData.previewUrl = `https://picsum.photos/seed/upscale-${seed}/1024/1024`;
                            } else {
                                newData.previewUrl = `https://picsum.photos/seed/upscale-${Date.now()}/1024/1024`;
                            }
                            break;
                        }
                    }

                    return { ...n, data: newData };
                }
                return n;
            })
        );
        saveToHistory();
    }, [setNodes, getNodes, getNodeInputs, saveToHistory]);

    // Run entire workflow from a starting node
    const runWorkflow = useCallback(async (startNodeId: string, mode: 'workflow' | 'local' = 'workflow') => {
        const currentNodes = getNodes();
        const currentEdges = getEdges();

        // Build execution order using topological sort
        const visited = new Set<string>();
        const executionOrder: string[] = [];

        if (mode === 'local') {
            // Only execute the target node, ignoring dependencies
            executionOrder.push(startNodeId);
        } else {
            const visit = (nodeId: string) => {
                if (visited.has(nodeId)) return;
                visited.add(nodeId);

                // Find all nodes that this node depends on
                const dependencies = currentEdges
                    .filter(e => e.target === nodeId)
                    .map(e => e.source);

                dependencies.forEach(depId => visit(depId));
                executionOrder.push(nodeId);
            };
            visit(startNodeId);
        }


        // Execute in order
        for (const nodeId of executionOrder) {
            const node = currentNodes.find(n => n.id === nodeId);
            if (node && node.type !== 'text' && node.type !== 'media' && node.type !== WorkflowNodeType.TEXT && node.type !== WorkflowNodeType.MEDIA) {
                // Pass the mode to runNode so it knows whether to use inputs or local params
                // We'll need to update runNode signature later or assume it checks context?
                // For now, let's assume we pass it if we can, or we rely on the fact that 
                // only the startNode has 'local' requested.
                // But runNode definition (earlier) needs to accept it.
                // Let's check runNode call.
                await runNode(nodeId /*, mode */);
            }
        }
    }, [getNodes, getEdges, runNode]);


    // ===== NODE DATA HANDLERS =====

    const handleTextChange = useCallback((nodeId: string, text: string) => {
        setNodes((nds) =>
            nds.map((n) => n.id === nodeId ? { ...n, data: { ...n.data, text } } : n)
        );
    }, [setNodes]);

    const handleMediaChange = useCallback((nodeId: string, url: string, name: string, thumbnail?: string) => {
        setNodes((nds) =>
            nds.map((n) => n.id === nodeId ? {
                ...n,
                data: {
                    ...n.data,
                    mediaUrl: url,
                    mediaName: name,
                    mediaThumbnail: thumbnail,
                    status: url ? 'success' : 'idle'
                }
            } : n)
        );
        saveToHistory();
    }, [setNodes, saveToHistory]);

    const onSelectionChange = useCallback(({ nodes }: OnSelectionChangeParams) => {
        if (nodes.length > 0) {
            setSelectedNode(nodes[0]);
        } else {
            setSelectedNode(null);
        }
    }, []);

    const updateNodeData = useCallback((id: string, newData: any) => {
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === id) {
                    return { ...node, data: newData };
                }
                return node;
            })
        );
        setSelectedNode((prev) => prev && prev.id === id ? { ...prev, data: newData } : prev);
        saveToHistory();
    }, [setNodes, saveToHistory]);

    // Inject handlers into nodes
    const nodesWithHandlers = nodes.map(node => {
        // Track connected inputs based on handles
        const incomingEdges = edges.filter(e => e.target === node.id);
        const inputs: Record<string, boolean> = {};

        incomingEdges.forEach(edge => {
            if (edge.targetHandle) {
                // Match handle IDs like 'prompt-input' or 'media-input'
                const inputKey = edge.targetHandle.replace('-input', '');
                inputs[inputKey] = true;
            } else {
                // If no specific handle ID, just mark as having input
                inputs['default'] = true;
                // For nodes like generator with multiple specific inputs, 
                // we might want to infer the type if no handle ID is provided
                if (node.type === WorkflowNodeType.IMAGE_GEN || node.type === 'generator') {
                    const sourceNode = nodes.find(n => n.id === edge.source);
                    if (sourceNode?.type === WorkflowNodeType.TEXT || sourceNode?.type === 'text') inputs['prompt'] = true;
                    if (sourceNode?.type === WorkflowNodeType.MEDIA || sourceNode?.type === 'media') inputs['media'] = true;
                }
            }
        });

        return {
            ...node,
            data: {
                ...node.data,
                onDelete: () => {
                    deleteElements({ nodes: [{ id: node.id }] });
                    saveToHistory();
                },
                onRun: (id?: string, mode?: 'workflow' | 'local') => runWorkflow(id || node.id, mode),
                onTextChange: handleTextChange,
                onMediaChange: handleMediaChange,
                inputs, // Pass active inputs info to the node
                onHandleClick: (event: any, handleId: string, handleType: 'source' | 'target') => {
                    event.stopPropagation();
                    const rect = (event.target as HTMLElement).getBoundingClientRect();

                    if (handleType === 'source') {
                        // Show menu of nodes to ADD and CONNECT
                        let outputType: ConnectionType = ConnectionType.TEXT;
                        if (node.type === WorkflowNodeType.MEDIA || node.type === 'media') outputType = ConnectionType.MEDIA;
                        if (node.type === WorkflowNodeType.IMAGE_GEN || node.type === 'generator') outputType = ConnectionType.IMAGE;
                        if (node.type === WorkflowNodeType.VIDEO_GEN) outputType = ConnectionType.VIDEO;

                        setHandleMenu({
                            position: { x: rect.left, y: rect.bottom + 5 },
                            outputType,
                            sourceNodeId: node.id,
                            sourceHandleId: handleId
                        });
                    } else {
                        // Show menu of compatible existing nodes? Or just handle context menu
                        setContextMenu({
                            position: { x: rect.left, y: rect.bottom + 5 },
                            targetNodeId: node.id,
                            targetHandleId: handleId
                        });
                    }
                }
            }
        };
    });

    const onConnect = useCallback(
        (params: Connection) => {
            // Validate connection - check if target can accept source output type
            const sourceNode = getNodes().find(n => n.id === params.source);
            const targetNode = getNodes().find(n => n.id === params.target);

            if (sourceNode && targetNode) {
                const sourceOutput = getNodeOutput(sourceNode);
                if (sourceOutput && !canAcceptInput(targetNode.type, sourceOutput.type)) {
                    console.warn('Invalid connection: Target cannot accept this input type');
                    return;
                }
            }

            setEdges((eds) => addEdge(params, eds));
            saveToHistory();
        },
        [setEdges, saveToHistory, getNodes, getNodeOutput],
    );

    const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

    const addNode = useCallback((type: string, label: string) => {
        // Media Gallery Mode
        if (type === WorkflowNodeType.MEDIA || type === 'media') {
            setIsMediaModalOpen(true);
            return;
        }

        const id = Math.random().toString(36).substr(2, 9);
        const position = {
            x: 500 + Math.random() * 50 - 25,
            y: 300 + Math.random() * 50 - 25
        };

        // Determine actual node type
        // 'upload' is just a MediaNode with empty state
        const nodeType = type === 'upload' ? WorkflowNodeType.MEDIA : type;
        const nodeLabel = type === 'upload' ? 'Media Upload' : label;

        const newNode: Node = {
            id,
            type: nodeType,
            position,
            data: {
                label: nodeLabel,
                status: 'idle',
                text: type === WorkflowNodeType.TEXT || type === 'text' ? '' : undefined,
                // If it's upload type, we leave mediaUrl undefined to show upload UI
            },
        };
        setNodes((nds: Node[]) => nds.concat(newNode));
        saveToHistory();
    }, [setNodes, saveToHistory]);

    const handleMediaSelect = useCallback((url: string, name: string, mediaType: 'image' | 'video') => {
        const id = Math.random().toString(36).substr(2, 9);
        const position = {
            x: 500 + Math.random() * 50 - 25,
            y: 300 + Math.random() * 50 - 25
        };

        const newNode: Node = {
            id,
            type: WorkflowNodeType.MEDIA,
            position,
            data: {
                label: 'Media',
                status: 'success',
                mediaUrl: url,
                mediaName: name,
                mediaType: mediaType,
            },
        };
        setNodes((nds: Node[]) => nds.concat(newNode));
        saveToHistory();
    }, [setNodes, saveToHistory]);

    // Tool handlers
    const handleToolChange = useCallback((tool: ToolMode) => {
        setActiveTool(tool);
    }, []);

    const handleZoomIn = useCallback(() => {
        zoomIn({ duration: 300 });
    }, [zoomIn]);

    const handleZoomOut = useCallback(() => {
        zoomOut({ duration: 300 });
    }, [zoomOut]);

    const handleFitView = useCallback(() => {
        fitView({ duration: 300, padding: 0.2 });
    }, [fitView]);

    const addAndConnectNode = useCallback((type: WorkflowNodeType) => {
        if (!handleMenu) return;

        const id = Math.random().toString(36).substr(2, 9);
        const sourceNode = nodes.find(n => n.id === handleMenu.sourceNodeId);
        if (!sourceNode) return;

        // Position it to the right of the source node
        const position = {
            x: sourceNode.position.x + 450,
            y: sourceNode.position.y
        };

        const newNode: Node = {
            id,
            type,
            position,
            data: {
                label: type,
                status: 'idle',
            },
        };

        setNodes((nds) => nds.concat(newNode));

        // Connect them
        const newEdge: Edge = {
            id: `e-${handleMenu.sourceNodeId}-${id}`,
            source: handleMenu.sourceNodeId,
            target: id,
            sourceHandle: handleMenu.sourceHandleId,
        };

        setEdges((eds: Edge[]) => eds.concat(newEdge));
        setHandleMenu(null);
        saveToHistory();
    }, [handleMenu, nodes, setNodes, setEdges, saveToHistory]);


    const panOnDrag = activeTool === 'pan' ? [0, 1, 2] : [1, 2];
    const selectionOnDrag = activeTool === 'select';

    const [editingImage, setEditingImage] = useState<string | null>(null);

    const handleNodeDoubleClick = useCallback((event: React.MouseEvent, node: Node) => {
        const imageUrl = node.data.mediaUrl || node.data.previewUrl;
        if (imageUrl && typeof imageUrl === 'string') {
            setEditingImage(imageUrl);
        }
    }, []);

    return (
        <div className="flex h-full w-full flex-col bg-[#0B0C0E]">
            <div className="flex-1 relative overflow-hidden">
                <FloatingToolbar
                    onAddNode={addNode}
                    onToolChange={handleToolChange}
                    onUndo={handleUndo}
                    onRedo={handleRedo}
                    onZoomIn={handleZoomIn}
                    onZoomOut={handleZoomOut}
                    onFitView={handleFitView}
                    activeTool={activeTool}
                    canUndo={historyIndex > 0}
                    canRedo={historyIndex < history.length - 1}
                    isSaving={isSaving}
                    onRun={executeWorkflow}
                    isExecuting={isExecuting}
                />

                {/* Show empty state when no nodes - render ABOVE ReactFlow */}
                {nodes.length === 0 && (
                    <div className="absolute inset-0 z-20">
                        <CanvasEmptyState onAddNode={addNode} />
                    </div>
                )}

                {/* ReactFlow always rendered but with lower z-index */}
                <div className={cn("h-full w-full", nodes.length === 0 ? 'opacity-0 pointer-events-none' : '')}>
                    <ReactFlow
                        nodes={nodesWithHandlers}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onSelectionChange={onSelectionChange}
                        onPaneClick={() => {
                            setHandleMenu(null);
                            setContextMenu(null);
                            setSelectedNode(null);
                        }}
                        nodeTypes={nodeTypes as any}
                        fitView={nodes.length > 0}
                        className="bg-transparent !h-full"
                        colorMode="dark"
                        maxZoom={2}
                        minZoom={0.2}
                        proOptions={{ hideAttribution: true }}
                        panOnDrag={panOnDrag as any}
                        selectionOnDrag={selectionOnDrag}
                        selectionMode={SelectionMode.Partial}
                        panOnScroll={activeTool === 'pan'}
                        zoomOnScroll={activeTool !== 'pan'}
                        onNodeDoubleClick={handleNodeDoubleClick}
                        style={{
                            cursor: activeTool === 'pan' ? 'grab' : 'default',
                            height: '100%',
                            width: '100%'
                        }}
                    >
                        <Background color="#222" gap={24} size={1} />
                        <Controls
                            className="!bg-[#1A1B1F] !border-white/10 !fill-white !rounded-xl !shadow-xl"
                            showInteractive={false}
                            showZoom={false}
                            showFitView={false}
                        />
                    </ReactFlow>
                </div>

                <div className={`absolute right-0 top-0 bottom-0 z-30 transition-transform duration-300 ${selectedNode ? 'translate-x-0' : 'translate-x-full'}`}>
                    <PropertiesPanel
                        selectedNode={selectedNode}
                        onChange={updateNodeData}
                        onClose={() => setSelectedNode(null)}
                    />
                </div>

                {/* Context Menus */}
                {handleMenu && (
                    <HandleMenu
                        position={handleMenu.position}
                        outputType={handleMenu.outputType}
                        onAddAndConnect={addAndConnectNode}
                        onClose={() => setHandleMenu(null)}
                    />
                )}
                {contextMenu && (
                    <NodeContextMenu
                        position={contextMenu.position}
                        onSelect={(type: WorkflowNodeType, label: string) => {
                            addNode(type, label);
                            setContextMenu(null);
                        }}
                        onClose={() => setContextMenu(null)}
                    />
                )}

                {/* Media Manager Modal */}
                <MediaManagerModal
                    isOpen={isMediaModalOpen}
                    onClose={() => setIsMediaModalOpen(false)}
                    onSelect={handleMediaSelect}
                />

                <ImageEditorModal
                    isOpen={!!editingImage}
                    imageUrl={editingImage || ''}
                    onClose={() => setEditingImage(null)}
                    onSave={(newUrl) => {
                        console.log("Saved new url", newUrl);
                        setEditingImage(null);
                        // Here we would update the node data with newUrl
                    }}
                />
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
