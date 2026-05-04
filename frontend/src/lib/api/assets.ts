import { get, post, del } from '@/lib/api';

export interface Asset {
    id: string;
    type: 'image' | 'video' | 'audio';
    url: string;
    userId: string;
    projectId?: string;
    metadata?: {
        prompt?: string;
        authorName?: string;
        likes?: number;
        aspectRatio?: string;
        category?: string;
        [key: string]: any;
    };
    createdAt: string;
}

export interface GetAssetsParams {
    page?: number;
    limit?: number;
    type?: string;
    mode?: 'public' | 'private';
}

export interface PaginatedResponse<T> {
    data: T[];
    hasNextPage: boolean;
}

export async function getAssets(params: GetAssetsParams = {}) {
    const queryString = new URLSearchParams();
    if (params.page) queryString.append('page', params.page.toString());
    if (params.limit) queryString.append('limit', params.limit.toString());
    if (params.mode) queryString.append('mode', params.mode);
    // if (params.type) queryString.append('type', params.type); // backend might not support filter yet, but good to have

    const response = await get<PaginatedResponse<Asset>>(`/assets?${queryString.toString()}`);
    return response; // Return full response with hasNextPage
}

interface CreateAssetDto {
    type: 'image' | 'video' | 'audio';
    url: string;
    projectId?: string;
    metadata?: Record<string, unknown>;
}

export async function createAsset(data: CreateAssetDto) {
    return post<Asset>('/assets', data);
}

export async function deleteAsset(id: string) {
    return del(`/assets/${id}`);
}
