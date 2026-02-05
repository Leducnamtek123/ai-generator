import { create } from 'zustand';
import { Node, Edge, OnNodesChange, OnEdgesChange, applyNodeChanges, applyEdgeChanges, addEdge, Connection } from '@xyflow/react';
import { get as apiGet, post as apiPost, patch as apiPatch } from '@/lib/api';

export interface Workflow {
    id: string;
    name: string;
    projectId: string;
    nodes: Node[];
    edges: Edge[];
    visibility: 'private' | 'public';
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
    fetchCommunityWorkflows: () => Promise<void>;
    fetchWorkflow: (id: string) => Promise<void>;
    fetchWorkflowByProject: (projectId: string) => Promise<void>;
    fetchWorkflowsByProject: (projectId: string) => Promise<void>;
    loadTemplate: (templateId: string) => Promise<void>;
    createWorkflow: (payload: { name: string; projectId?: string; nodes?: Node[]; edges?: Edge[] }) => Promise<string | null>;
    duplicateWorkflow: (id: string) => Promise<string | null>;
    updateWorkflow: (id: string, payload: Partial<Workflow>) => Promise<void>;
    deleteWorkflow: (id: string) => Promise<void>;
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
    executionError: string | null;
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
    executionError: null,

    executeWorkflow: async () => {
        const { workflow, nodes, edges } = get();
        if (!workflow) return;

        set({ isExecuting: true, executionStatus: 'running', lastExecutionResult: null, executionError: null });

        try {
            // Include current graph state in execution request
            const result = await apiPost<any>(`/workflows/${workflow.id}/execute`, {
                graph: { nodes, edges }
            });

            // If it's queued (new background system), we set status to running and start polling
            if (result.status === 'queued') {
                set({
                    executionStatus: 'running',
                    isExecuting: true,
                    lastExecutionResult: result
                });
            } else {
                set({
                    executionStatus: 'completed',
                    lastExecutionResult: result
                });
            }

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

            // Start polling for updates if execution is still running or queued
            if (result.status === 'queued' || result.status === 'RUNNING' || result.status === 'idle') {
                const pollInterval = setInterval(async () => {
                    try {
                        const updatedWorkflow = await apiGet<Workflow>(`/workflows/${workflow.id}`);

                        // Update nodes with latest statuses
                        set((state) => ({
                            nodes: state.nodes.map(node => {
                                const backendNode = updatedWorkflow.nodes?.find(n => n.id === node.id);
                                if (backendNode) {
                                    return {
                                        ...node,
                                        data: {
                                            ...node.data,
                                            status: backendNode.data?.status || node.data.status,
                                            previewUrl: backendNode.data?.previewUrl || node.data.previewUrl,
                                            errorMessage: backendNode.data?.errorMessage
                                        }
                                    };
                                }
                                return node;
                            })
                        }));

                        // Stop polling if completed or failed
                        // We might need to check the global status from the API specifically
                        // For now, if all generation nodes are not 'running'/'pending'/'processing'/'queued'
                        const isStillRunning = updatedWorkflow.nodes?.some(n =>
                            n.data?.status === 'running' ||
                            n.data?.status === 'pending' ||
                            n.data?.status === 'processing' ||
                            n.data?.status === 'queued'
                        );

                        if (!isStillRunning) {
                            clearInterval(pollInterval);
                            set({ isExecuting: false, executionStatus: 'completed' }); // Or failed if any have error
                        }
                    } catch (pollError) {
                        console.error('Polling failed', pollError);
                        clearInterval(pollInterval);
                        set({ isExecuting: false, executionStatus: 'failed' });
                    }
                }, 3000); // Poll every 3 seconds
            }

        } catch (error) {
            console.error('Workflow execution failed', error);
            const errorMessage = (error as any)?.response?.data?.message || (error as any)?.message || 'Execution failed';
            set({ executionStatus: 'failed', executionError: errorMessage });
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

    fetchCommunityWorkflows: async () => {
        set({ isLoading: true });
        try {
            const data = await apiGet<Workflow[]>('/workflows/community');
            if (Array.isArray(data)) {
                set({ workflows: data });
            }
        } catch (error) {
            console.error('Failed to fetch community workflows', error);
        } finally {
            set({ isLoading: false });
        }
    },

    createWorkflow: async (payload) => {
        set({ isLoading: true });
        try {
            let projectId = payload.projectId;

            // If no projectId provided, try to use the first available project
            if (!projectId) {
                try {
                    const { useProjectStore } = await import('./project-store');
                    const projectState = useProjectStore.getState();

                    if (projectState.projects.length === 0) {
                        await projectState.fetchProjects();
                    }

                    const projects = useProjectStore.getState().projects;
                    if (projects.length > 0) {
                        projectId = projects[0].id;
                    }
                } catch (e) {
                    console.error('Failed to auto-fetch project ID', e);
                }
            }

            const newWorkflow = await apiPost<Workflow>('/workflows', {
                ...payload,
                projectId: projectId || '00000000-0000-0000-0000-000000000000', // Final fallback
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
    deleteWorkflow: async (id: string) => {
        try {
            const { del: apiDel } = await import('@/lib/api');
            await apiDel(`/workflows/${id}`);

            set((state) => ({
                workflows: state.workflows.filter(w => w.id !== id)
            }));
        } catch (error) {
            console.error('Failed to delete workflow:', error);
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
            set({ nodes: (nodes as (nodes: Node[]) => Node[])(get().nodes) });
        } else {
            set({ nodes });
        }
        get().triggerAutoSave();
    },
    setEdges: (edges) => {
        if (typeof edges === 'function') {
            set({ edges: (edges as (edges: Edge[]) => Edge[])(get().edges) });
        } else {
            set({ edges });
        }
        get().triggerAutoSave();
    },
}));
