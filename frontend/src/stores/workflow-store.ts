import { create } from 'zustand';
import { Node, Edge, OnNodesChange, OnEdgesChange, applyNodeChanges, applyEdgeChanges, addEdge, Connection } from '@xyflow/react';
import { get as apiGet, post as apiPost, patch as apiPatch } from '@/lib/api';

export interface Workflow {
    id: string;
    name: string;
    projectId: string;
    nodes: Node[];
    edges: Edge[];
    previewUrl?: string; // Optional URL for workflow preview image
    createdAt: Date;
    updatedAt: Date;
}

interface WorkflowState {
    workflow: Workflow | null;
    isLoading: boolean;

    // React Flow specific
    nodes: Node[];
    edges: Edge[];

    // Collections
    workflows: Workflow[];

    fetchWorkflows: () => Promise<void>;
    fetchWorkflow: (id: string) => Promise<void>;
    fetchWorkflowByProject: (projectId: string) => Promise<void>;
    fetchWorkflowsByProject: (projectId: string) => Promise<void>;
    loadTemplate: (templateId: string) => Promise<void>;
    createWorkflow: (payload: { name: string; projectId?: string; nodes?: Node[]; edges?: Edge[] }) => Promise<string | null>;
    duplicateWorkflow: (id: string) => Promise<string | null>;
    updateWorkflow: (id: string, payload: Partial<Workflow>) => Promise<void>;
    saveWorkflow: () => Promise<void>;

    // Actions
    onNodesChange: OnNodesChange;
    onEdgesChange: OnEdgesChange;
    onConnect: (connection: Connection) => void;
    setNodes: (nodes: Node[] | ((nodes: Node[]) => Node[])) => void;
    setEdges: (edges: Edge[] | ((edges: Edge[]) => Edge[])) => void;

    // Internal
    isSaving: boolean;
    saveTimeout: NodeJS.Timeout | null;
    triggerAutoSave: () => void;

    // Execution
    isExecuting: boolean;
    executionStatus: 'idle' | 'running' | 'completed' | 'failed';
    lastExecutionResult: any;
    executeWorkflow: () => Promise<void>;
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
    workflow: null,
    isLoading: false,
    nodes: [],
    edges: [],
    workflows: [],

    // Execution State
    isExecuting: false,
    executionStatus: 'idle',
    lastExecutionResult: null,

    executeWorkflow: async () => {
        const { workflow, nodes, edges } = get();
        if (!workflow) return;

        set({ isExecuting: true, executionStatus: 'running', lastExecutionResult: null });

        try {
            // Include current graph state in execution request
            const result = await apiPost<any>(`/workflows/${workflow.id}/execute`, {
                graph: { nodes, edges }
            });

            set({
                executionStatus: 'completed',
                lastExecutionResult: result
            });

            // Update nodes with execution results
            if (result && result.nodeStates) {
                const nodeStates = result.nodeStates; // Map of nodeId -> state
                set((state) => ({
                    nodes: state.nodes.map(node => {
                        // The map keys might be object keys if it's JSON over wire
                        // Assuming result.nodeStates is an object/map from backend
                        // If it's a Map serialized to JSON, it might be an object
                        const nodeState = nodeStates[node.id] || (nodeStates instanceof Map ? nodeStates.get(node.id) : undefined);

                        if (nodeState) {
                            return {
                                ...node,
                                data: {
                                    ...node.data,
                                    status: nodeState.status === 'completed' ? 'success' :
                                        nodeState.status === 'failed' ? 'error' :
                                            nodeState.status === 'running' ? 'processing' : 'idle',
                                    // Update output data if present
                                    ...nodeState.output
                                }
                            };
                        }
                        return node;
                    })
                }));
            }

            // TODO: In a real app, we would poll here or listen to WS for node-by-node updates
            // For now, we assume immediate return or handled via polling elsewhere

        } catch (error) {
            console.error('Workflow execution failed', error);
            set({ executionStatus: 'failed' });
        } finally {
            set({ isExecuting: false });
        }
    },



    fetchWorkflows: async () => {
        set({ isLoading: true });
        try {
            const data = await apiGet<Workflow[]>('/workflows');
            if (Array.isArray(data)) {
                set({ workflows: data });
            }
        } catch (error) {
            console.error('Failed to fetch workflows', error);
        } finally {
            set({ isLoading: false });
        }
    },

    createWorkflow: async (payload) => {
        set({ isLoading: true });
        try {
            // If projectId is not provided, we might need a default or optional handling in backend?
            // For now, let's assume projectId is optional in DTO if we modify it, 
            // OR we pass a dummy/default project if required. 
            // Wait, WorkflowEntity REQUIRES projectId.
            // But we want "Creative Studios" to be standalone?
            // The user said "Project is like a workspace". 
            // Maybe we should allow creating a workflow WITHOUT a specific project ID if the backend supports it?
            // Or auto-create a "General" project?
            // Let's stick to requiring projectId for now, OR find a way to get a default project.
            // User: "project is like workspace".
            // I'll update the backend to make projectId optional later if needed.
            // usage: createWorkflow({ name: 'My Studio', projectId: '...' })
            // If the user is in "Creative Studio" root, do they have a selected project? 
            // Maybe we can list PROJECTS in the dropdown?
            // OR just hardcode a default "Personal Workspace" ID?
            // Actually, for now, I'll pass userId if backend supports it.
            // Backend CreateWorkflowDto requires `projectId`.
            // I will MODIFY the backend to make `projectId` optional, 
            // or automatically assign to a default "Personal" project for the user.

            // For this step, I'll just implement the frontend call.
            const newWorkflow = await apiPost<Workflow>('/workflows', {
                ...payload,
                projectId: payload.projectId || '00000000-0000-0000-0000-000000000000', // Temporary hack or needs backend fix
                nodes: payload.nodes || [],
                edges: payload.edges || []
            });

            // Refresh list
            const currentWorkflows = get().workflows;
            set({ workflows: [newWorkflow, ...currentWorkflows] });

            return newWorkflow.id;
        } catch (error) {
            console.error('Failed to create workflow', error);
            return null;
        } finally {
            set({ isLoading: false });
        }
    },

    fetchWorkflow: async (id) => {
        set({ isLoading: true });
        try {
            // Token handled by interceptor
            const data = await apiGet<Workflow>(`/workflows/${id}`);
            set({
                workflow: data,
                nodes: data.nodes || [],
                edges: data.edges || []
            });
        } catch (error) {
            console.error('Failed to fetch workflow', error);
        } finally {
            set({ isLoading: false });
        }
    },

    fetchWorkflowByProject: async (projectId) => {
        set({ isLoading: true });
        try {
            // Try fetching existing workflow
            const data = await apiGet<Workflow[]>(`/workflows?projectId=${projectId}`);

            if (Array.isArray(data) && data.length > 0) {
                // Load the first workflow
                const workflow = data[0];
                set({
                    workflow: workflow,
                    nodes: workflow.nodes || [],
                    edges: workflow.edges || []
                });
            } else {
                // Create new workflow for this project
                const newWorkflow = await apiPost<Workflow>('/workflows', {
                    name: 'Untitled Studio',
                    projectId: projectId,
                    nodes: [],
                    edges: []
                });

                set({
                    workflow: newWorkflow,
                    nodes: [],
                    edges: []
                });
            }
        } catch (error) {
            console.error('Failed to fetch/create workflow', error);
        } finally {
            set({ isLoading: false });
        }
    },

    fetchWorkflowsByProject: async (projectId) => {
        set({ isLoading: true });
        try {
            const data = await apiGet<Workflow[]>(`/workflows?projectId=${projectId}`);
            if (Array.isArray(data)) {
                set({ workflows: data });
            } else {
                set({ workflows: [] });
            }
        } catch (error) {
            console.error('Failed to fetch project workflows', error);
        } finally {
            set({ isLoading: false });
        }
    },

    loadTemplate: async (templateId) => {
        set({ isLoading: true });
        try {
            const template = await apiGet<any>(`/templates/${templateId}`);
            if (template && template.content) {
                set({
                    workflow: null,
                    nodes: template.content.nodes || [],
                    edges: template.content.edges || []
                });
            }
        } catch (error) {
            console.error('Failed to load template', error);
        } finally {
            set({ isLoading: false });
        }
    },

    duplicateWorkflow: async (id: string) => {
        try {
            const workflow = get().workflows.find(w => w.id === id);
            if (!workflow) return null;

            const newId = await get().createWorkflow({
                name: `${workflow.name} (Copy)`,
                projectId: workflow.projectId,
                nodes: workflow.nodes,
                edges: workflow.edges
            });
            return newId;
        } catch (error) {
            console.error('Failed to duplicate workflow:', error);
            return null;
        }
    },

    updateWorkflow: async (id: string, payload: Partial<Workflow>) => {
        try {
            await apiPatch(`/workflows/${id}`, payload);
            set((state) => ({
                workflow: state.workflow && state.workflow.id === id ? { ...state.workflow, ...payload } : state.workflow,
                workflows: state.workflows.map(w => w.id === id ? { ...w, ...payload } : w)
            }));
        } catch (error) {
            console.error('Failed to update workflow:', error);
        }
    },

    saveWorkflow: async () => {
        const { workflow, nodes, edges } = get();
        if (!workflow) return;

        try {
            await apiPatch(`/workflows/${workflow.id}`, {
                nodes,
                edges
            });
        } catch (error) {
            console.error('Failed to save workflow', error);
        }
    },

    saveTimeout: null as NodeJS.Timeout | null,
    isSaving: false,

    triggerAutoSave: () => {
        const { saveTimeout, saveWorkflow } = get();
        if (saveTimeout) clearTimeout(saveTimeout);

        const timeout = setTimeout(async () => {
            set({ isSaving: true });
            await saveWorkflow();
            set({ isSaving: false });
        }, 2000); // 2 second debounce

        set({ saveTimeout: timeout });
    },

    onNodesChange: (changes) => {
        set({
            nodes: applyNodeChanges(changes, get().nodes),
        });
        get().triggerAutoSave();
    },
    onEdgesChange: (changes) => {
        set({
            edges: applyEdgeChanges(changes, get().edges),
        });
        get().triggerAutoSave();
    },
    onConnect: (connection) => {
        set({
            edges: addEdge(connection, get().edges),
        });
        get().triggerAutoSave();
    },
    setNodes: (nodes) => {
        if (typeof nodes === 'function') {
            set({ nodes: (nodes as Function)(get().nodes) });
        } else {
            set({ nodes });
        }
        get().triggerAutoSave();
    },
    setEdges: (edges) => {
        if (typeof edges === 'function') {
            set({ edges: (edges as Function)(get().edges) });
        } else {
            set({ edges });
        }
        get().triggerAutoSave();
    },
}));
