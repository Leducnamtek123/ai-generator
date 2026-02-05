import { create } from 'zustand';
import { get as apiGet, post as apiPost, patch as apiPatch, del as apiDel } from '@/lib/api';

export interface Project {
    id: string;
    name: string;
    description?: string;
    userId: string;
    visibility: 'private' | 'public';
    thumbnail?: string;
    createdAt: Date;
    updatedAt: Date;
}

interface ProjectState {
    projects: Project[];
    currentProject: Project | null;
    isLoading: boolean;

    fetchProjects: () => Promise<void>;
    fetchProject: (id: string) => Promise<void>;
    createProject: (payload: { name: string; description?: string; visibility?: 'private' | 'public' }) => Promise<string | null>;
    updateProject: (id: string, payload: { name?: string; description?: string; visibility?: 'private' | 'public' }) => Promise<void>;
    deleteProject: (id: string) => Promise<void>;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
    projects: [],
    currentProject: null,
    isLoading: false,

    fetchProjects: async () => {
        set({ isLoading: true });
        try {
            const data = await apiGet<Project[]>('/projects');
            if (Array.isArray(data)) {
                set({ projects: data });
            }
        } catch (error) {
            console.error('Failed to fetch projects', error);
        } finally {
            set({ isLoading: false });
        }
    },

    fetchProject: async (id) => {
        set({ isLoading: true });
        try {
            const data = await apiGet<Project>(`/projects/${id}`);
            set({ currentProject: data });
        } catch (error) {
            console.error('Failed to fetch project', error);
        } finally {
            set({ isLoading: false });
        }
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
        } finally {
            set({ isLoading: false });
        }
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
