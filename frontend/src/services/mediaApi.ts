import { api } from '@/lib/api';
import {
    getFileUrl,
    resolveDisplayFileUrl,
    type StoredFileResponse,
} from '@/lib/file-storage';
import { MediaItem, MediaLibraryResponse } from '@/types/media';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_API === 'true';
const MOCK_PAGE_SIZE = 6;
const LIBRARY_PAGE_SIZE = 12;

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

function readRecord(record: UnknownRecord | undefined, key: string): UnknownRecord | undefined {
    const value = record?.[key];
    return isRecord(value) ? value : undefined;
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

function inferAssetFolder(record: UnknownRecord | undefined): MediaLibraryResponse['folders'][number]['id'] {
    const metadata = readRecord(record, 'metadata');
    const source = readString(metadata, 'source');
    const provider = readString(metadata, 'provider');
    const generationId = readString(metadata, 'generationId');
    const category = readString(metadata, 'category');
    const isPublic = typeof metadata?.isPublic === 'boolean' ? metadata.isPublic : undefined;

    if (source === 'file-upload') {
        return 'uploads';
    }

    if (provider || generationId) {
        return 'history';
    }

    if (category === 'AI Images' || category === 'Vectors' || category === 'Photos' || category === '3D') {
        return isPublic === false ? 'downloads' : 'favorites';
    }

    if (isPublic) {
        return 'favorites';
    }

    return 'downloads';
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
        folder: readString(record, 'folder') ?? inferAssetFolder(record),
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

const MOCK_MEDIA_ITEMS: MediaItem[] = [
    {
        id: 'mock-image-1',
        folder: 'uploads',
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
        id: 'mock-image-2',
        folder: 'uploads',
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
        id: 'mock-image-3',
        folder: 'favorites',
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
    {
        id: 'mock-image-4',
        folder: 'history',
        url: getFileUrl('https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800'),
        thumbnailUrl: getFileUrl('https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200'),
        name: 'portrait-4.jpg',
        type: 'image',
        mimeType: 'image/jpeg',
        size: 184000,
        width: 800,
        height: 1000,
        createdAt: new Date().toISOString(),
    },
    {
        id: 'mock-video-1',
        folder: 'downloads',
        url: getFileUrl('https://example.com/mock/media/video-1.mp4'),
        thumbnailUrl: getFileUrl('https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=200'),
        name: 'brand-reveal.mp4',
        type: 'video',
        mimeType: 'video/mp4',
        size: 1820000,
        width: 1920,
        height: 1080,
        duration: 12,
        createdAt: new Date().toISOString(),
    },
    {
        id: 'mock-video-2',
        folder: 'uploads',
        url: getFileUrl('https://example.com/mock/media/video-2.mp4'),
        thumbnailUrl: getFileUrl('https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200'),
        name: 'motion-scene.mp4',
        type: 'video',
        mimeType: 'video/mp4',
        size: 2450000,
        width: 1920,
        height: 1080,
        duration: 24,
        createdAt: new Date().toISOString(),
    },
    {
        id: 'mock-video-3',
        folder: 'history',
        url: getFileUrl('https://example.com/mock/media/video-3.mp4'),
        thumbnailUrl: getFileUrl('https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=200'),
        name: 'studio-b-roll.mp4',
        type: 'video',
        mimeType: 'video/mp4',
        size: 3220000,
        width: 1920,
        height: 1080,
        duration: 18,
        createdAt: new Date().toISOString(),
    },
    {
        id: 'mock-audio-1',
        folder: 'downloads',
        url: getFileUrl('https://example.com/mock/media/audio-1.mp3'),
        thumbnailUrl: getFileUrl('https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=200'),
        name: 'music-bed.mp3',
        type: 'audio',
        mimeType: 'audio/mpeg',
        size: 4200000,
        duration: 136,
        createdAt: new Date().toISOString(),
    },
    {
        id: 'mock-audio-2',
        folder: 'favorites',
        url: getFileUrl('https://example.com/mock/media/audio-2.mp3'),
        thumbnailUrl: getFileUrl('https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=200'),
        name: 'voice-note.mp3',
        type: 'audio',
        mimeType: 'audio/mpeg',
        size: 1800000,
        duration: 42,
        createdAt: new Date().toISOString(),
    },
    {
        id: 'mock-image-5',
        folder: 'downloads',
        url: getFileUrl('https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800'),
        thumbnailUrl: getFileUrl('https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=200'),
        name: 'workspace-1.jpg',
        type: 'image',
        mimeType: 'image/jpeg',
        size: 208000,
        width: 800,
        height: 1200,
        createdAt: new Date().toISOString(),
    },
    {
        id: 'mock-image-6',
        folder: 'history',
        url: getFileUrl('https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800'),
        thumbnailUrl: getFileUrl('https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=200'),
        name: 'workspace-2.jpg',
        type: 'image',
        mimeType: 'image/jpeg',
        size: 221000,
        width: 800,
        height: 1200,
        createdAt: new Date().toISOString(),
    },
];

function buildMockFolders(items: MediaItem[]): MediaLibraryResponse['folders'] {
    const byFolder = new Map(DEFAULT_FOLDERS.map((folder) => [folder.id, 0]));
    for (const item of items) {
        if (item.folder && byFolder.has(item.folder)) {
            byFolder.set(item.folder, (byFolder.get(item.folder) || 0) + 1);
        }
    }

    return DEFAULT_FOLDERS.map((folder) => ({
        ...folder,
        count: byFolder.get(folder.id) || 0,
    }));
}

function buildMockLibrary(folder?: string, page = 1): MediaLibraryResponse {
    const filtered = folder ? MOCK_MEDIA_ITEMS.filter((item) => item.folder === folder) : MOCK_MEDIA_ITEMS;
    const folders = buildMockFolders(MOCK_MEDIA_ITEMS);
    const start = Math.max(0, (page - 1) * MOCK_PAGE_SIZE);
    const items = filtered.slice(start, start + MOCK_PAGE_SIZE);

    return {
        items,
        folders,
        totalCount: filtered.length,
        hasMore: start + MOCK_PAGE_SIZE < filtered.length,
    };
}

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
            return buildMockLibrary(folder, page);
        }

        try {
            const response = await api.get<unknown>('/assets', {
                params: { mode: 'public', page: 1, limit: 50 },
            });
            const normalized = normalizeLibraryResponse(response.data);
            const scopedItems = folder
                ? normalized.items.filter((item) => item.folder === folder)
                : normalized.items;
            const start = Math.max(0, (page - 1) * LIBRARY_PAGE_SIZE);
            const items = scopedItems.slice(start, start + LIBRARY_PAGE_SIZE);
            return {
                items,
                folders: normalized.folders,
                totalCount: scopedItems.length,
                hasMore: start + LIBRARY_PAGE_SIZE < scopedItems.length,
            };
        } catch {
            return { items: [], folders: DEFAULT_FOLDERS, totalCount: 0, hasMore: false };
        }
    },
};
