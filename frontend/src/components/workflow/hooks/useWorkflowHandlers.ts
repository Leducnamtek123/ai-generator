'use client';

import { useCallback, useState } from 'react';
import { Node, Edge, useReactFlow, addEdge, Connection, SelectionMode } from '@xyflow/react';
import { toast } from 'sonner';
import { WorkflowNodeType, NodeStatus, ConnectionType } from '../types';

export function useWorkflowHandlers(
    nodes: Node[],
    setNodes: (nds: any) => void,
    setEdges: (eds: any) => void,
    saveToHistory: (nodes: Node[], edges: Edge[]) => void,
    runWorkflow: (id: string, mode?: 'workflow' | 'local') => Promise<void>
) {
    const { getNodes, getEdges, deleteElements, screenToFlowPosition, zoomIn, zoomOut, fitView } = useReactFlow();
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);
    const [activeTool, setActiveTool] = useState<'select' | 'pan' | 'comment'>('select');

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
    }, [nodes, setNodes, saveToHistory, getEdges]);

    const onConnect = useCallback((params: Connection) => {
        setEdges((eds: Edge[]) => addEdge(params, eds));
        saveToHistory(getNodes(), getEdges());
    }, [setEdges, saveToHistory, getNodes, getEdges]);

    const addNode = useCallback((type: string, label: string) => {
        const id = Math.random().toString(36).substr(2, 9);
        const position = { x: 500, y: 300 };
        const nodeType = type === 'upload' ? WorkflowNodeType.MEDIA : type;
        const newNode: Node = {
            id,
            type: nodeType as any,
            position,
            data: { label, status: NodeStatus.IDLE },
        };
        setNodes((nds: Node[]) => nds.concat(newNode));
        saveToHistory([...nodes, newNode], getEdges());
    }, [nodes, setNodes, saveToHistory, getEdges]);

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
    }, [setNodes, setEdges, selectedNode, saveToHistory, getNodes, getEdges]);

    const handleToolChange = useCallback((tool: 'select' | 'pan' | 'comment') => {
        setActiveTool(tool);
    }, []);

    const handleZoomIn = useCallback(() => { zoomIn(); }, [zoomIn]);
    const handleZoomOut = useCallback(() => { zoomOut(); }, [zoomOut]);
    const handleFitView = useCallback(() => { fitView({ padding: 0.2 }); }, [fitView]);

    const handlePaneClick = useCallback(() => {
        setSelectedNode(null);
    }, []);

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
