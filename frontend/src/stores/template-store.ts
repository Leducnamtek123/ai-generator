import { create } from 'zustand';
import { get as apiGet } from '@/lib/api';
import { TemplateTypeEnum } from '@/lib/api/templates';

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

interface PaginationResponse<T> {
    data: T[];
    hasNextPage: boolean;
}

interface TemplateState {
    templates: Template[];
    isLoading: boolean;
    error: string | null;

    fetchTemplates: (type?: TemplateTypeEnum) => Promise<void>;
}

export const useTemplateStore = create<TemplateState>((set) => ({
    templates: [],
    isLoading: false,
    error: null,

    fetchTemplates: async (type?: TemplateTypeEnum) => {
        set({ isLoading: true, error: null });
        try {
            const endpoint = type ? `/templates?type=${type}` : '/templates';
            const data = await apiGet<PaginationResponse<Template>>(endpoint);
            set({ templates: data.data || [] });
        } catch (error: unknown) {
            const status = (error as { response?: { status?: number } })?.response?.status;
            console.error('Failed to fetch templates', { status, type, error });
            const maybeError = error as { message?: string };
            set({ error: maybeError.message || 'Failed to fetch templates' });
        }
        set({ isLoading: false });
    },
}));
