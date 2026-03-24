import { MediaItem, MediaLibraryResponse } from '@/types/media';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_API === 'true' || true;

const mockDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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

        const response = await fetch(`${API_BASE_URL}/media/upload`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            return null;
        }

        return response.json();
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

        const response = await fetch(`${API_BASE_URL}/media/library?folder=${folder || ''}&page=${page}`);
        if (!response.ok) {
            return { items: [], folders: [], totalCount: 0, hasMore: false };
        }
        return response.json();
    },
};
