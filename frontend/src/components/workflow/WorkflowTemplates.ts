import { Node, Edge } from '@xyflow/react';

export const templates = [
    {
        id: 'pikaso-basic',
        name: 'Text to Image (Pikaso)',
        description: 'Simple text-to-image generation using Flux or Imagen.',
        nodes: [
            {
                id: '1',
                type: 'text',
                data: { label: 'Prompt', text: 'A futuristic city with flying cars, neon lights, 8k resolution' },
                position: { x: 50, y: 150 }
            },
            {
                id: '2',
                type: 'generator',
                data: { label: 'Flux Generator', model: 'flux', status: 'idle' },
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
                type: 'text',
                data: { label: 'Raw Idea', text: 'Cyberpunk street food vendor' },
                position: { x: 50, y: 150 }
            },
            {
                id: '2',
                type: 'assistant',
                data: { label: 'Prompt Enhancer', status: 'idle' },
                position: { x: 350, y: 150 }
            },
            {
                id: '3',
                type: 'generator',
                data: { label: 'Midjourney Node', model: 'midjourney', status: 'idle' },
                position: { x: 650, y: 150 }
            },
            {
                id: '4',
                type: 'upscale',
                data: { label: 'Magnific Upscale', status: 'idle' },
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
