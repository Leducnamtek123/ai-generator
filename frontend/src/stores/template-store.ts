import { create } from 'zustand';
import { get as apiGet } from '@/lib/api';

export interface Template {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    type: string;
    visibility: string;
    content: unknown;
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
        } catch (error: unknown) {
            console.error('Failed to fetch templates', error);
            const maybeError = error as { message?: string };
            set({ error: maybeError.message || 'Failed to fetch templates' });
        }
        set({ isLoading: false });
    },
}));
