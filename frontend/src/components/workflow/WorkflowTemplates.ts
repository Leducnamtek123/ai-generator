import { Node, Edge } from '@xyflow/react';
import { NodeStatus, ImageModel, WorkflowNodeType } from './types';

export const templates = [
    {
        id: 'pikaso-basic',
        name: 'Text to Image (Pikaso)',
        description: 'Simple text-to-image generation using Flux or Imagen.',
        nodes: [
            {
                id: '1',
                type: WorkflowNodeType.TEXT,
                data: { label: 'Prompt', text: 'A futuristic city with flying cars, neon lights, 8k resolution', status: NodeStatus.IDLE },
                position: { x: 50, y: 150 }
            },
            {
                id: '2',
                type: WorkflowNodeType.IMAGE_GEN,
                data: { label: 'Flux Generator', model: ImageModel.FLUX, status: NodeStatus.IDLE },
                position: { x: 450, y: 100 }
            },
        ] as Node[],
        edges: [
            { id: 'e1-2', source: '1', target: '2', animated: true },
        ] as Edge[],
    },
    {
        id: 'pikaso-advanced',
        name: 'Professional Workflow',
        description: 'Full pipeline: Assistant refiner -> Generation -> Upscale.',
        nodes: [
            {
                id: '1',
                type: WorkflowNodeType.TEXT,
                data: { label: 'Raw Idea', text: 'Cyberpunk street food vendor', status: NodeStatus.IDLE },
                position: { x: 50, y: 150 }
            },
            {
                id: '2',
                type: WorkflowNodeType.ASSISTANT,
                data: { label: 'Prompt Enhancer', status: NodeStatus.IDLE },
                position: { x: 350, y: 150 }
            },
            {
                id: '3',
                type: WorkflowNodeType.IMAGE_GEN,
                data: { label: 'Midjourney Node', model: ImageModel.MIDJOURNEY, status: NodeStatus.IDLE },
                position: { x: 650, y: 150 }
            },
            {
                id: '4',
                type: WorkflowNodeType.UPSCALE,
                data: { label: 'Magnific Upscale', status: NodeStatus.IDLE },
                position: { x: 1000, y: 150 }
            },
        ] as Node[],
        edges: [
            { id: 'e1-2', source: '1', target: '2', animated: true },
            { id: 'e2-3', source: '2', target: '3', animated: true },
            { id: 'e3-4', source: '3', target: '4', animated: true },
        ] as Edge[],
    },
];
