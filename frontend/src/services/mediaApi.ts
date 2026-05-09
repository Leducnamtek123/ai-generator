import { api } from '@/lib/api';
import {
    getFileUrl,
    resolveDisplayFileUrl,
    type StoredFileResponse,
} from '@/lib/file-storage';
import { MediaItem, MediaLibraryResponse } from '@/types/media';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_API === 'true';

const mockDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const DEFAULT_FOLDERS: MediaLibraryResponse['folders'] = [
    { id: 'favorites', name: 'Favorites', icon: 'favorites', count: 0 },
    { id: 'history', name: 'History', icon: 'history', count: 0 },
    { id: 'uploads', name: 'Uploads', icon: 'uploads', count: 0 },
    { id: 'downloads', name: 'Downloads', icon: 'downloads', count: 0 },
];

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
    return typeof value === 'object' && value !== null;
}

function readString(record: UnknownRecord | undefined, key: string): string | undefined {
    const value = record?.[key];
    return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function readNumber(record: UnknownRecord | undefined, key: string): number | undefined {
    const value = record?.[key];
    return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function inferMediaType(fileNameOrUrl: string, fallbackMimeType?: string): 'image' | 'video' | 'audio' {
    const lower = `${fileNameOrUrl}`.toLowerCase();
    const mime = `${fallbackMimeType || ''}`.toLowerCase();

    if (mime.startsWith('audio/') || /\.(mp3|wav|aac|m4a|ogg|flac)$/i.test(lower)) {
        return 'audio';
    }

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
    if (/\.(mp3|wav|aac|m4a|ogg|flac)$/i.test(lower)) return 'audio/mpeg';
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

function normalizeMediaUrl(rawUrl: string | undefined, fallbackFile?: File): string {
    if (rawUrl) {
        return resolveDisplayFileUrl(rawUrl);
    }

    if (fallbackFile) {
        return URL.createObjectURL(fallbackFile);
    }

    return '';
}

function normalizeMediaItem(raw: unknown, fallbackFile?: File): MediaItem {
    const record = isRecord(raw) ? raw : undefined;
    const url = normalizeMediaUrl(
        readString(record, 'url') ?? readString(record, 'path') ?? (typeof raw === 'string' ? raw : undefined),
        fallbackFile,
    );
    const name = readString(record, 'name') ?? fallbackFile?.name ?? fileNameFromUrl(url);
    const mimeType = readString(record, 'mimeType') ?? inferMimeType(name || url, readString(record, 'type'));
    const typeValue = readString(record, 'type');
    const type = typeValue === 'image' || typeValue === 'video' || typeValue === 'audio'
        ? typeValue
        : inferMediaType(name || url, mimeType);

    return {
        id: readString(record, 'id') ?? `upload_${Date.now()}`,
        url,
        thumbnailUrl: normalizeMediaUrl(readString(record, 'thumbnailUrl'), fallbackFile) || url,
        name,
        type,
        mimeType,
        size: readNumber(record, 'size') ?? fallbackFile?.size ?? 0,
        width: readNumber(record, 'width'),
        height: readNumber(record, 'height'),
        duration: readNumber(record, 'duration'),
        createdAt: readString(record, 'createdAt') ?? new Date().toISOString(),
        folder: readString(record, 'folder'),
    };
}

function normalizeLibraryResponse(raw: unknown): MediaLibraryResponse {
    const record = isRecord(raw) ? raw : undefined;
    const data = Array.isArray(record?.data)
        ? record.data
        : Array.isArray(record?.items)
            ? record.items
            : Array.isArray(raw)
                ? raw
                : [];

    const items = data.map((item) => normalizeMediaItem(item));
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
        totalCount: readNumber(record, 'total') ?? items.length,
        hasMore: typeof record?.hasNextPage === 'boolean' ? record.hasNextPage : false,
    };
}

const mockMediaLibrary: MediaItem[] = [
    {
        id: '1',
        url: getFileUrl('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800'),
        thumbnailUrl: getFileUrl('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'),
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
        url: getFileUrl('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800'),
        thumbnailUrl: getFileUrl('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200'),
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
        url: getFileUrl('https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800'),
        thumbnailUrl: getFileUrl('https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200'),
        name: 'portrait-3.jpg',
        type: 'image',
        mimeType: 'image/jpeg',
        size: 212000,
        width: 800,
        height: 1100,
        createdAt: new Date().toISOString(),
    },
];

function createUploadedMedia(fileRecord: StoredFileResponse['file'], sourceFile: File): MediaItem {
    const resolvedUrl = resolveDisplayFileUrl(fileRecord.path);

    return {
        id: fileRecord.id,
        url: resolvedUrl,
        thumbnailUrl: resolvedUrl,
        name: sourceFile.name,
        type: sourceFile.type.startsWith('video')
            ? 'video'
            : sourceFile.type.startsWith('audio')
                ? 'audio'
                : 'image',
        mimeType: sourceFile.type,
        size: sourceFile.size,
        createdAt: new Date().toISOString(),
    };
}

export const mediaApi = {
    async uploadMedia(file: File, onProgress?: (progress: number) => void): Promise<MediaItem | null> {
        if (USE_MOCK) {
            await new Promise<void>((resolve) => {
                let progress = 0;
                const timer = window.setInterval(() => {
                    onProgress?.(progress);
                    if (progress >= 100) {
                        window.clearInterval(timer);
                        resolve();
                        return;
                    }

                    progress += 10;
                }, 100);
            });

            const url = URL.createObjectURL(file);
            return {
                id: `upload_${Date.now()}`,
                url,
                thumbnailUrl: url,
                name: file.name,
                type: file.type.startsWith('video')
                    ? 'video'
                    : file.type.startsWith('audio')
                        ? 'audio'
                        : 'image',
                mimeType: file.type,
                size: file.size,
                createdAt: new Date().toISOString(),
            };
        }

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await api.post<StoredFileResponse>('/files/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.total && onProgress) {
                        onProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
                    }
                },
            });
            return createUploadedMedia(response.data.file, file);
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
            const response = await api.get<unknown>('/assets', {
                params: { folder: folder || '', page },
            });
            return normalizeLibraryResponse(response.data);
        } catch {
            return { items: [], folders: DEFAULT_FOLDERS, totalCount: 0, hasMore: false };
        }
    },
};
