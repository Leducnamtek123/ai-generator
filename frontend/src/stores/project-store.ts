import { create } from 'zustand';
import { get as apiGet, post as apiPost, patch as apiPatch, del as apiDel } from '@/lib/api';

export interface Project {
    id: string;
    name: string;
    description?: string;
    userId: string;

    thumbnail?: string;
    content?: unknown;
    createdAt: Date;
    updatedAt: Date;
}

type ProjectFilters = Record<string, unknown>;
type ProjectSort = Record<string, unknown>;

interface ProjectState {
    projects: Project[];
    currentProject: Project | null;
    isLoading: boolean;
    hasNextPage: boolean;

    fetchProjects: (params?: { page?: number; limit?: number; filters?: ProjectFilters; sort?: ProjectSort }) => Promise<void>;
    fetchProject: (id: string) => Promise<void>;
    createProject: (payload: { name: string; description?: string }) => Promise<string | null>;
    updateProject: (id: string, payload: { name?: string; description?: string }) => Promise<void>;
    deleteProject: (id: string) => Promise<void>;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
    projects: [],
    currentProject: null,
    isLoading: false,
    hasNextPage: false,

    fetchProjects: async (params = {}) => {
        set({ isLoading: true });
        try {
            const queryParams = new URLSearchParams();
            if (params.page) queryParams.append('page', params.page.toString());
            if (params.limit) queryParams.append('limit', params.limit.toString());
            if (params.filters) queryParams.append('filters', JSON.stringify(params.filters));
            if (params.sort) queryParams.append('sort', JSON.stringify(params.sort));

            const queryString = queryParams.toString();
            const url = `/projects${queryString ? `?${queryString}` : ''}`;

            const response = await apiGet<{ data: Project[]; hasNextPage: boolean }>(url);

            if (response && Array.isArray(response.data)) {
                set({
                    projects: response.data,
                    hasNextPage: response.hasNextPage
                });
            }
        } catch (error) {
            console.error('Failed to fetch projects', error);
        }
        set({ isLoading: false });
    },

    fetchProject: async (id) => {
        set({ isLoading: true });
        try {
            const data = await apiGet<Project>(`/projects/${id}`);
            set({ currentProject: data });
        } catch (error) {
            console.error('Failed to fetch project', error);
        }
        set({ isLoading: false });
    },

    createProject: async (payload) => {
        set({ isLoading: true });
        try {
            const newProject = await apiPost<Project>('/projects', payload);
            const currentProjects = get().projects;
            set({ projects: [newProject, ...currentProjects] });
            return newProject.id;
        } catch (error) {
            console.error('Failed to create project', error);
            return null;
        }
        set({ isLoading: false });
    },

    updateProject: async (id, payload) => {
        try {
            const updated = await apiPatch<Project>(`/projects/${id}`, payload);
            set({
                projects: get().projects.map(p => p.id === id ? updated : p),
                currentProject: get().currentProject?.id === id ? updated : get().currentProject
            });
        } catch (error) {
            console.error('Failed to update project', error);
        }
    },

    deleteProject: async (id) => {
        try {
            await apiDel(`/projects/${id}`);
            set({
                projects: get().projects.filter(p => p.id !== id),
                currentProject: get().currentProject?.id === id ? null : get().currentProject
            });
        } catch (error) {
            console.error('Failed to delete project', error);
        }
    }
}));
