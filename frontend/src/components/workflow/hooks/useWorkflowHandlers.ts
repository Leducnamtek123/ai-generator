'use client';

import { useCallback, useState } from 'react';
import { Node, Edge, useReactFlow, addEdge, Connection, SelectionMode } from '@xyflow/react';
import { toast } from 'sonner';
import { useWorkflowStore } from '@/stores/workflow-store';
import { WorkflowNodeType, NodeStatus, ConnectionType, NODE_CONFIG } from '../types';
import {
    getConnectionLabel,
    getConnectionSlot,
    getConnectionStroke,
    inferNodeOutputType,
    isConnectionCompatible,
} from '../connection-utils';

export function useWorkflowHandlers(
    nodes: Node[],
    setNodes: (nds: any) => void,
    setEdges: (eds: any) => void,
    saveToHistory: (nodes: Node[], edges: Edge[]) => void,
    runWorkflow: (id: string, mode?: 'workflow' | 'local') => Promise<void>,
    clearPendingConnection?: () => void,
) {
    const { getNodes, getEdges, deleteElements, screenToFlowPosition, zoomIn, zoomOut, fitView } = useReactFlow();
    const flushWorkflowSave = useWorkflowStore((state) => state.flushWorkflowSave);
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);
    const [activeTool, setActiveTool] = useState<'select' | 'pan' | 'comment'>('select');
    const persistWorkflowNow = useCallback(() => {
        void flushWorkflowSave();
    }, [flushWorkflowSave]);

    const getNextNodePosition = useCallback(() => {
        const existingNodes = getNodes();
        const index = existingNodes.length;
        const column = index % 3;
        const row = Math.floor(index / 3);

        const screenX = Math.max(320, Math.min(window.innerWidth - 320, 620 + column * 280));
        const screenY = Math.max(220, Math.min(window.innerHeight - 220, 280 + row * 220));

        return screenToFlowPosition({ x: screenX, y: screenY });
    }, [getNodes, screenToFlowPosition]);

    const handleTextChange = useCallback((nodeId: string, text: string) => {
        setNodes((nds: Node[]) => nds.map((n) => {
            if (n.id === nodeId) {
                const newData: any = { ...n.data, text };
                if (n.type !== WorkflowNodeType.TEXT) {
                    newData.prompt = text; // Also update prompt for non-Text nodes (like VideoNode)
                }
                return { ...n, data: newData };
            }
            return n;
        }));
        saveToHistory(getNodes(), getEdges());
    }, [setNodes, saveToHistory, getNodes, getEdges]);

    const handleDuplicateNode = useCallback((nodeId: string) => {
        const nodeToDuplicate = nodes.find(n => n.id === nodeId);
        if (!nodeToDuplicate) return;

        const newId = Math.random().toString(36).substr(2, 9);
        const newNode: Node = {
            ...nodeToDuplicate,
            id: newId,
            position: { x: nodeToDuplicate.position.x + 50, y: nodeToDuplicate.position.y + 50 },
            data: { ...nodeToDuplicate.data, status: NodeStatus.IDLE, previewUrl: undefined },
            selected: true,
        };

        setNodes((nds: Node[]) => [...nds.map(n => ({ ...n, selected: false })), newNode]);
        setSelectedNode(newNode);
        saveToHistory([...nodes, newNode], getEdges());
        toast.success('Node duplicated');
        persistWorkflowNow();
    }, [nodes, setNodes, saveToHistory, getEdges, persistWorkflowNow]);

    const onConnect = useCallback((params: Connection) => {
        const sourceNode = getNodes().find((node) => node.id === params.source);
        const targetNode = getNodes().find((node) => node.id === params.target);

        if (!sourceNode || !targetNode) {
            return;
        }

        const sourceType = inferNodeOutputType(sourceNode);
        const targetSlot = getConnectionSlot(targetNode, params.targetHandle);

        if (!isConnectionCompatible(sourceType, targetSlot)) {
            toast.error('This connection type is not valid for the target node.');
            return;
        }

        const incomingEdges = getEdges().filter((edge) => edge.target === targetNode.id);
        const maxInputs = NODE_CONFIG[targetNode.type as WorkflowNodeType]?.connections?.maxInputs;

        if (typeof maxInputs === 'number' && incomingEdges.length >= maxInputs) {
            toast.error(`This node accepts at most ${maxInputs} inputs.`);
            return;
        }

        const edgeExists = getEdges().some(
            (edge) =>
                edge.source === params.source &&
                edge.target === params.target &&
                edge.sourceHandle === params.sourceHandle &&
                edge.targetHandle === params.targetHandle,
        );

        if (edgeExists) {
            return;
        }

        const edgeLabel = getConnectionLabel(targetSlot ?? 'reference', sourceType ?? ConnectionType.REFERENCE);
        const strokeColor = getConnectionStroke(sourceType ?? ConnectionType.REFERENCE);
        const edge = {
            ...params,
            animated: true,
            label: edgeLabel,
            style: {
                stroke: strokeColor,
                strokeWidth: 2,
            },
            labelBgStyle: {
                fill: 'rgba(11, 12, 14, 0.92)',
                fillOpacity: 0.96,
            },
            labelStyle: {
                fill: '#fff',
                fontSize: 10,
                fontWeight: 600,
            },
            labelBgPadding: [6, 2] as [number, number],
            labelBgBorderRadius: 6,
        };

        const nextEdges = addEdge(edge, getEdges());
        setEdges(nextEdges);
        saveToHistory(getNodes(), nextEdges);
        persistWorkflowNow();
    }, [setEdges, saveToHistory, getNodes, getEdges, persistWorkflowNow]);

    const addNode = useCallback((type: string, label: string) => {
        const id = Math.random().toString(36).substr(2, 9);
        const position = getNextNodePosition();
        const nodeType = type === 'upload' ? WorkflowNodeType.MEDIA : type;
        const defaultData = NODE_CONFIG[nodeType as WorkflowNodeType]?.defaultData || {};
        const newNode: Node = {
            id,
            type: nodeType as any,
            position,
            data: { ...defaultData, label, status: NodeStatus.IDLE },
        };
        setNodes((nds: Node[]) => nds.concat(newNode));
        saveToHistory([...nodes, newNode], getEdges());
        persistWorkflowNow();
    }, [nodes, setNodes, saveToHistory, getEdges, persistWorkflowNow, getNextNodePosition]);

    const updateNodeData = useCallback((nodeId: string, data: Record<string, unknown>) => {
        setNodes((nds: Node[]) => nds.map((n) =>
            n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n
        ));
    }, [setNodes]);

    const handleDeleteNode = useCallback((nodeId: string) => {
        setNodes((nds: Node[]) => nds.filter((n) => n.id !== nodeId));
        setEdges((eds: Edge[]) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
        if (selectedNode?.id === nodeId) {
            setSelectedNode(null);
        }
        saveToHistory(getNodes(), getEdges());
        persistWorkflowNow();
    }, [setNodes, setEdges, selectedNode, saveToHistory, getNodes, getEdges, persistWorkflowNow]);

    const handleToolChange = useCallback((tool: 'select' | 'pan' | 'comment') => {
        setActiveTool(tool);
    }, []);

    const handleZoomIn = useCallback(() => { zoomIn(); }, [zoomIn]);
    const handleZoomOut = useCallback(() => { zoomOut(); }, [zoomOut]);
    const handleFitView = useCallback(() => { fitView({ padding: 0.2 }); }, [fitView]);

    const handlePaneClick = useCallback(() => {
        setSelectedNode(null);
        clearPendingConnection?.();
    }, [clearPendingConnection]);

    const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
        setSelectedNode(node);
    }, []);

    return {
        selectedNode,
        setSelectedNode,
        activeTool,
        setActiveTool,
        handleTextChange,
        handleDuplicateNode,
        handleDeleteNode,
        onConnect,
        addNode,
        updateNodeData,
        handleToolChange,
        handleZoomIn,
        handleZoomOut,
        handleFitView,
        handlePaneClick,
        handleNodeClick,
    };
}
