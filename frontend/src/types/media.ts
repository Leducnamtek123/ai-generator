export interface MediaItem {
    id: string;
    url: string;
    thumbnailUrl: string;
    name: string;
    type: 'image' | 'video';
    mimeType: string;
    size: number;
    width?: number;
    height?: number;
    duration?: number;
    createdAt: string;
    folder?: string;
}

export interface MediaFolder {
    id: string;
    name: string;
    icon: 'favorites' | 'history' | 'uploads' | 'downloads' | 'folder';
    count: number;
}

export interface MediaLibraryResponse {
    items: MediaItem[];
    folders: MediaFolder[];
    totalCount: number;
    hasMore: boolean;
}
