import { http, HttpResponse } from 'msw';

export const handlers = [
    // Mock handler for projects
    http.get('/api/projects', () => {
        return HttpResponse.json([
            { id: '1', title: 'AI Portrait Gen', updatedAt: new Date().toISOString() },
            { id: '2', title: 'Cyberpunk Cityscape', updatedAt: new Date().toISOString() },
        ]);
    }),

    // Mock handler for nodes (workflow)
    http.get('/api/workflow/:id', ({ params }) => {
        const { id } = params;
        return HttpResponse.json({
            id,
            nodes: [
                { id: 'node-1', type: 'input', data: { label: 'Prompt Input' }, position: { x: 0, y: 0 } },
                { id: 'node-2', type: 'process', data: { label: 'Stable Diffusion' }, position: { x: 250, y: 0 } },
                { id: 'node-3', type: 'output', data: { label: 'Result Preview' }, position: { x: 500, y: 0 } },
            ],
            edges: [
                { id: 'e1-2', source: 'node-1', target: 'node-2' },
                { id: 'e2-3', source: 'node-2', target: 'node-3' },
            ],
        });
    }),
];
