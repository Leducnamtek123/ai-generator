import { MediaItem, MediaLibraryResponse } from '@/types/media';
import { api } from '@/lib/api';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_API === 'true';

const mockDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const DEFAULT_FOLDERS: MediaLibraryResponse['folders'] = [
    { id: 'favorites', name: 'Favorites', icon: 'favorites', count: 0 },
    { id: 'history', name: 'History', icon: 'history', count: 0 },
    { id: 'uploads', name: 'Uploads', icon: 'uploads', count: 0 },
    { id: 'downloads', name: 'Downloads', icon: 'downloads', count: 0 },
];

function inferMediaType(fileNameOrUrl: string, fallbackMimeType?: string): 'image' | 'video' {
    const lower = `${fileNameOrUrl}`.toLowerCase();
    const mime = `${fallbackMimeType || ''}`.toLowerCase();

    if (mime.startsWith('video/') || /\.(mp4|mov|avi|webm|mkv)$/i.test(lower)) {
        return 'video';
    }

    return 'image';
}

function inferMimeType(fileNameOrUrl: string, fallbackType?: string): string {
    if (fallbackType) {
        return fallbackType;
    }

    const lower = fileNameOrUrl.toLowerCase();
    if (/\.(png)$/i.test(lower)) return 'image/png';
    if (/\.(gif)$/i.test(lower)) return 'image/gif';
    if (/\.(webp)$/i.test(lower)) return 'image/webp';
    if (/\.(svg)$/i.test(lower)) return 'image/svg+xml';
    if (/\.(mp4)$/i.test(lower)) return 'video/mp4';
    if (/\.(mov)$/i.test(lower)) return 'video/quicktime';
    if (/\.(webm)$/i.test(lower)) return 'video/webm';

    return 'application/octet-stream';
}

function fileNameFromUrl(url: string): string {
    const clean = url.split('?')[0].split('#')[0];
    const lastSegment = clean.split('/').filter(Boolean).pop();
    return lastSegment ? decodeURIComponent(lastSegment) : 'media-file';
}

function normalizeMediaItem(raw: any, fallbackFile?: File): MediaItem {
    const url =
        typeof raw?.url === 'string'
            ? raw.url
            : typeof raw?.path === 'string'
              ? raw.path
              : typeof raw === 'string'
                ? raw
                : fallbackFile
                  ? URL.createObjectURL(fallbackFile)
                  : '';
    const name =
        typeof raw?.name === 'string'
            ? raw.name
            : fallbackFile?.name || fileNameFromUrl(url);
    const mimeType =
        typeof raw?.mimeType === 'string'
            ? raw.mimeType
            : inferMimeType(name || url, typeof raw?.type === 'string' ? raw.type : undefined);
    const type =
        typeof raw?.type === 'string' && (raw.type === 'image' || raw.type === 'video')
            ? raw.type
            : inferMediaType(name || url, mimeType);

    return {
        id: typeof raw?.id === 'string' ? raw.id : `upload_${Date.now()}`,
        url,
        thumbnailUrl: typeof raw?.thumbnailUrl === 'string' ? raw.thumbnailUrl : url,
        name,
        type,
        mimeType,
        size: typeof raw?.size === 'number' ? raw.size : fallbackFile?.size || 0,
        width: typeof raw?.width === 'number' ? raw.width : undefined,
        height: typeof raw?.height === 'number' ? raw.height : undefined,
        duration: typeof raw?.duration === 'number' ? raw.duration : undefined,
        createdAt: typeof raw?.createdAt === 'string' ? raw.createdAt : new Date().toISOString(),
        folder: typeof raw?.folder === 'string' ? raw.folder : undefined,
    };
}

function normalizeLibraryResponse(raw: any): MediaLibraryResponse {
    const data = Array.isArray(raw?.data)
        ? raw.data
        : Array.isArray(raw?.items)
          ? raw.items
          : Array.isArray(raw)
            ? raw
            : [];

    const items = data.map((item: any) => normalizeMediaItem(item));
    const byFolder = new Map(DEFAULT_FOLDERS.map((folder) => [folder.id, 0]));
    for (const item of items) {
        if (item.folder && byFolder.has(item.folder)) {
            byFolder.set(item.folder, (byFolder.get(item.folder) || 0) + 1);
        }
    }

    const folders = DEFAULT_FOLDERS.map((folder) => ({
        ...folder,
        count: byFolder.get(folder.id) || 0,
    }));

    return {
        items,
        folders,
        totalCount: typeof raw?.total === 'number' ? raw.total : items.length,
        hasMore: typeof raw?.hasNextPage === 'boolean' ? raw.hasNextPage : false,
    };
}

const mockMediaLibrary: MediaItem[] = [
    {
        id: '1',
        url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800',
        thumbnailUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
        name: 'portrait-1.jpg',
        type: 'image',
        mimeType: 'image/jpeg',
        size: 245000,
        width: 800,
        height: 1200,
        createdAt: new Date().toISOString(),
    },
    {
        id: '2',
        url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
        thumbnailUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
        name: 'portrait-2.jpg',
        type: 'image',
        mimeType: 'image/jpeg',
        size: 198000,
        width: 800,
        height: 1000,
        createdAt: new Date().toISOString(),
    },
    {
        id: '3',
        url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800',
        thumbnailUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200',
        name: 'portrait-3.jpg',
        type: 'image',
        mimeType: 'image/jpeg',
        size: 212000,
        width: 800,
        height: 1100,
        createdAt: new Date().toISOString(),
    },
];

export const mediaApi = {
    async uploadMedia(file: File, onProgress?: (progress: number) => void): Promise<MediaItem | null> {
        if (USE_MOCK) {
            for (let i = 0; i <= 100; i += 10) {
                await mockDelay(100);
                onProgress?.(i);
            }

            const url = URL.createObjectURL(file);
            return {
                id: `upload_${Date.now()}`,
                url,
                thumbnailUrl: url,
                name: file.name,
                type: file.type.startsWith('video') ? 'video' : 'image',
                mimeType: file.type,
                size: file.size,
                createdAt: new Date().toISOString(),
            };
        }

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await api.post<MediaItem>('/files/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.total && onProgress) {
                        onProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
                    }
                },
            });
            const uploadedFile = (response.data as any)?.file ?? response.data;
            return normalizeMediaItem(uploadedFile, file);
        } catch {
            return null;
        }
    },

    async getMediaLibrary(folder?: string, page = 1): Promise<MediaLibraryResponse> {
        if (USE_MOCK) {
            await mockDelay(500);
            return {
                items: mockMediaLibrary,
                folders: [
                    { id: 'favorites', name: 'Favorites', icon: 'favorites', count: 12 },
                    { id: 'history', name: 'History', icon: 'history', count: 48 },
                    { id: 'uploads', name: 'Uploads', icon: 'uploads', count: 24 },
                    { id: 'downloads', name: 'Downloads', icon: 'downloads', count: 16 },
                ],
                totalCount: mockMediaLibrary.length,
                hasMore: false,
            };
        }

        try {
            const response = await api.get<MediaLibraryResponse>('/assets', {
                params: { folder: folder || '', page },
            });
            return normalizeLibraryResponse(response.data);
        } catch {
            return { items: [], folders: DEFAULT_FOLDERS, totalCount: 0, hasMore: false };
        }
    },
};
