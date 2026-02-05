
import { get, post, patch, del } from '../api';

export interface Template {
    id: string;
    title: string;
    description?: string;
    thumbnail?: string;
    type: string;
    visibility: string;
    content?: any;
    author: {
        id: string;
        email: string;
        firstName?: string;
        lastName?: string;
    };
    usageCount: number;
    createdAt: string;
}

export const templatesApi = {
    getAll: () => get<Template[]>('/templates'),
    getOne: (id: string) => get<Template>(`/templates/${id}`),
    create: (data: Partial<Template>) => post<Template>('/templates', data),
    update: (id: string, data: Partial<Template>) => patch<Template>(`/templates/${id}`, data),
    delete: (id: string) => del(`/templates/${id}`),
};
