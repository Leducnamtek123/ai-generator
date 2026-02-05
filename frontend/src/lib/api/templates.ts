import { get, post, patch, del } from '../api';

export enum TemplateTypeEnum {
    IMAGE_GENERATOR = 'image-generator',
    VIDEO_GENERATOR = 'video-generator',
    AI_ASSISTANT = 'ai-assistant',
    WORKFLOW_EDITOR = 'workflow-editor',
    DESIGN_EDITOR = 'design-editor',
    IMAGE_UPSCALER = 'image-upscaler',
    VIDEO_UPSCALER = 'video-upscaler',
    VOICE_GENERATOR = 'voice-generator',
    MUSIC_GENERATOR = 'music-generator',
    SOUND_EFFECT_GENERATOR = 'sfx-generator',
    ICON_GENERATOR = 'icon-generator',
    MOCKUP_GENERATOR = 'mockup-generator',
    BG_REMOVER = 'bg-remover',
}

export interface Template {
    id: string;
    title: string;
    description?: string;
    thumbnail?: string;
    type: TemplateTypeEnum;
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

export interface PaginatedResponse<T> {
    data: T[];
    hasNextPage: boolean;
}

export const templatesApi = {
    getAll: (page = 1, limit = 10, type?: string, mode?: string) => {
        const query = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
        });

        if (type) query.append('type', type);

        if (mode === 'my-templates') {
            return get<PaginatedResponse<Template>>(`/templates/me?${query.toString()}`);
        }

        if (mode) query.append('mode', mode); // For other modes if any

        return get<PaginatedResponse<Template>>(`/templates?${query.toString()}`);
    },
    getOne: (id: string) => get<Template>(`/templates/${id}`),
    create: (data: Partial<Template>) => post<Template>('/templates', data),
    update: (id: string, data: Partial<Template>) => patch<Template>(`/templates/${id}`, data),
    delete: (id: string) => del(`/templates/${id}`),
};
