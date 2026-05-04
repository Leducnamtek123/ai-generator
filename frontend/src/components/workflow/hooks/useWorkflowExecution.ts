'use client';

import { useCallback } from 'react';
import { Node, Edge, useReactFlow } from '@xyflow/react';
import { WorkflowNodeType, ConnectionType, NodeStatus } from '../types';
import { generateImage, generateVideo, upscaleImage, enhancePrompt } from '@/lib/api/generations';

export function useWorkflowExecution(
  setNodes: (nds: any) => void,
  saveToHistory: (nodes: Node[], edges: Edge[]) => void
) {
  const { getNodes, getEdges } = useReactFlow();

  const getNodeOutput = useCallback((node: Node) => {
    const nodeType = node.type;
    switch (nodeType) {
      case WorkflowNodeType.TEXT:
        return node.data.text ? { type: ConnectionType.TEXT, value: node.data.text as string } : null;
      case WorkflowNodeType.MEDIA:
        if (node.data.mediaUrl) {
          const isVideo = (node.data.mediaName as string)?.match(/\.(mp4|webm|mov|avi)$/i);
          return { type: isVideo ? ConnectionType.VIDEO : ConnectionType.IMAGE, value: node.data.mediaUrl as string };
        }
        break;
      case WorkflowNodeType.IMAGE_GEN:
      case WorkflowNodeType.UPSCALE:
        return node.data.previewUrl ? { type: ConnectionType.IMAGE, value: node.data.previewUrl as string } : null;
      case WorkflowNodeType.VIDEO_GEN:
        return node.data.previewUrl ? { type: ConnectionType.VIDEO, value: node.data.previewUrl as string } : null;
      case WorkflowNodeType.ASSISTANT:
        return node.data.enhancedText ? { type: ConnectionType.TEXT, value: node.data.enhancedText as string } : null;
    }
    return null;
  }, []);

  const getNodeInputs = useCallback((nodeId: string) => {
    const currentNodes = getNodes();
    const currentEdges = getEdges();
    const incomingEdges = currentEdges.filter(e => e.target === nodeId);
    const inputs: any[] = [];

    for (const edge of incomingEdges) {
      const sourceNode = currentNodes.find(n => n.id === edge.source);
      if (sourceNode) {
        const output = getNodeOutput(sourceNode);
        if (output) inputs.push(output);
      }
    }
    return inputs;
  }, [getNodes, getEdges, getNodeOutput]);

  const runNode = useCallback(async (nodeId: string) => {
    const currentNodes = getNodes();
    const node = currentNodes.find(n => n.id === nodeId);
    if (!node) return;

    const inputs = getNodeInputs(nodeId);

    setNodes((nds: any) =>
      nds.map((n: any) => n.id === nodeId ? { ...n, data: { ...n.data, status: NodeStatus.PROCESSING } } : n)
    );

    try {
        let newData: any = { ...node.data, status: NodeStatus.SUCCESS };

        if (node.type === WorkflowNodeType.IMAGE_GEN) {
            const textInput = inputs.find(i => i.type === ConnectionType.TEXT);
            const prompt = textInput?.value || node.data.text || node.data.prompt;
            if (!prompt) throw new Error("Missing prompt for Image Generation");

            const result = await generateImage({
                prompt,
                model: node.data.model as string,
                aspectRatio: node.data.aspectRatio as string,
                quality: 'standard'
            });
            newData.previewUrl = result.resultUrl;
            newData.usedPrompt = prompt;
        } else if (node.type === WorkflowNodeType.VIDEO_GEN) {
            const textInput = inputs.find(i => i.type === ConnectionType.TEXT);
            const imageInput = inputs.find(i => i.type === ConnectionType.IMAGE);
            const prompt = textInput?.value || node.data.text || node.data.prompt;
            
            const result = await generateVideo({
                prompt: prompt || 'Video from image',
                model: node.data.model as string,
                duration: node.data.duration as string,
                aspectRatio: node.data.aspectRatio as string,
                startImageUrl: imageInput?.value
            });
            newData.previewUrl = result.resultUrl;
        } else if (node.type === WorkflowNodeType.UPSCALE) {
            const imageInput = inputs.find(i => i.type === ConnectionType.IMAGE);
            const imageUrl = imageInput?.value || node.data.inputUrl;
            if (!imageUrl) throw new Error("Missing image for Upscale");

            const result = await upscaleImage({
                imageUrl,
                scale: (node.data.scale as number === 4 ? 4 : 2),
                enhanceMode: node.data.enhanceMode as any || 'balanced'
            });
            newData.previewUrl = result.resultUrl;
        } else if (node.type === WorkflowNodeType.ASSISTANT) {
            const textInput = inputs.find(i => i.type === ConnectionType.TEXT);
            const originalText = textInput?.value || node.data.inputText;
            if (!originalText) throw new Error("Missing input text for Assistant");

            newData.inputText = originalText;
            const res = await enhancePrompt({
                prompt: originalText,
                style: node.data.styleEmphasis as string || 'Photorealistic'
            });
            newData.enhancedText = res.enhancedPrompt;
        }

        setNodes((nds: any) => {
            const updatedNodes = nds.map((n: any) => n.id === nodeId ? { ...n, data: newData } : n);
            saveToHistory(updatedNodes, getEdges());
            return updatedNodes;
        });

    } catch (err) {
        console.error(`Failed to run node ${nodeId}`, err);
        setNodes((nds: any) =>
            nds.map((n: any) => n.id === nodeId ? { ...n, data: { ...n.data, status: NodeStatus.ERROR } } : n)
        );
    }
  }, [setNodes, getNodes, getEdges, getNodeInputs, saveToHistory]);

  const runWorkflow = useCallback(async (startNodeId: string, mode: 'workflow' | 'local' = 'workflow') => {
    const currentNodes = getNodes();
    const currentEdges = getEdges();
    const visited = new Set<string>();
    const executionOrder: string[] = [];

    if (mode === 'local') {
      executionOrder.push(startNodeId);
    } else {
      const visit = (nodeId: string) => {
        if (visited.has(nodeId)) return;
        visited.add(nodeId);
        const dependencies = currentEdges.filter(e => e.target === nodeId).map(e => e.source);
        dependencies.forEach(visit);
        executionOrder.push(nodeId);
      };
      visit(startNodeId);
    }

    for (const nodeId of executionOrder) {
        const node = currentNodes.find(n => n.id === nodeId);
        if (node && node.type !== WorkflowNodeType.TEXT && node.type !== WorkflowNodeType.MEDIA) {
            await runNode(nodeId);
        }
    }
  }, [getNodes, getEdges, runNode]);

  return { runNode, runWorkflow, getNodeOutput };
}
