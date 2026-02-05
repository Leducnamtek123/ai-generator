import { create } from 'zustand';
import { get as apiGet } from '@/lib/api';

export interface Template {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    type: string;
    visibility: string;
    content: any;
    usageCount: number;
    createdAt: string;
}

interface TemplateState {
    templates: Template[];
    isLoading: boolean;
    error: string | null;

    fetchTemplates: () => Promise<void>;
}

export const useTemplateStore = create<TemplateState>((set) => ({
    templates: [],
    isLoading: false,
    error: null,

    fetchTemplates: async () => {
        set({ isLoading: true, error: null });
        try {
            const data = await apiGet<Template[]>('/templates');
            set({ templates: data });
        } catch (error: any) {
            console.error('Failed to fetch templates', error);
            set({ error: error.message || 'Failed to fetch templates' });
        } finally {
            set({ isLoading: false });
        }
    },
}));
