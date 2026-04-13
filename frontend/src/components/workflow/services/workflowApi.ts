/**
 * Workflow API Service
 * 
 * This service handles all API calls related to the workflow system.
 * When integrating with a real backend:
 * 1. Replace mock implementations with actual API calls
 * 2. Add proper error handling and retry logic
 * 3. Implement WebSocket for real-time status updates
 * 
 * Architecture:
 * - All API calls go through this service
 * - Returns typed responses matching the types in types.ts
 * - Easy to swap between mock and real API
 */
import {
    GenerateImageRequest,
    GenerateVideoRequest,
    EnhancePromptRequest,
    UpscaleImageRequest,
    GenerationResult,
    WorkflowData,
    MediaLibraryResponse,
    MediaItem,
    NodeStatus,
} from '../types';

// ============================================
// CONFIGURATION
// ============================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_API === 'true' || true; // Default to mock for now

// ============================================
// HTTP CLIENT HELPERS
// ============================================

// Import pre-configured axios instance
import { api } from '@/lib/api';

// ============================================
// MOCK IMPLEMENTATIONS
// For development without backend
// ============================================

const mockDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const mockGenerateImage = async (request: GenerateImageRequest): Promise<GenerationResult> => {
    // Simulate API delay
    await mockDelay(2000 + Math.random() * 3000);

    // Random mock images
    const mockImages = [
        `https://picsum.photos/seed/${request.nodeId}-${Date.now()}/1024/1024`,
    ];

    // 90% success rate for demo
    if (Math.random() > 0.1) {
        return {
            success: true,
            nodeId: request.nodeId,
            generationId: `gen_${Date.now()}`,
            status: NodeStatus.SUCCESS,
            outputUrls: mockImages,
            previewUrl: mockImages[0],
            processingTime: 2500,
            creditsUsed: 1,
        };
    }

    return {
        success: false,
        nodeId: request.nodeId,
        generationId: `gen_${Date.now()}`,
        status: NodeStatus.ERROR,
        error: 'Generation failed. Please try again.',
    };
};

const mockGenerateVideo = async (request: GenerateVideoRequest): Promise<GenerationResult> => {
    await mockDelay(5000 + Math.random() * 5000);

    return {
        success: true,
        nodeId: request.nodeId,
        generationId: `gen_${Date.now()}`,
        status: NodeStatus.SUCCESS,
        previewUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
        processingTime: 8000,
        creditsUsed: 3,
    };
};

const mockEnhancePrompt = async (request: EnhancePromptRequest): Promise<{ enhancedText: string }> => {
    await mockDelay(1000 + Math.random() * 1000);

    const enhancements: Record<string, string> = {
        enhance: `${request.inputText}, highly detailed, professional photography, 8k resolution, sharp focus, studio lighting`,
        expand: `${request.inputText}, captured in stunning detail with dramatic lighting, rich textures and colors, cinematic composition, award-winning photography, masterpiece quality`,
        creative: `${request.inputText}, reimagined through an artistic lens, surreal and dreamlike quality, vibrant colors bleeding into ethereal mist, digital art masterpiece`,
        professional: `${request.inputText}, commercial quality, clean composition, product photography style, studio lighting setup, high-end finish, advertising ready`,
        cinematic: `${request.inputText}, film still, anamorphic lens flare, moody atmosphere, dramatic shadows, movie poster quality, directed by Christopher Nolan`,
    };

    return {
        enhancedText: enhancements[request.mode] || request.inputText,
    };
};

const mockUpscaleImage = async (request: UpscaleImageRequest): Promise<GenerationResult> => {
    await mockDelay(3000 + Math.random() * 2000);

    return {
        success: true,
        nodeId: request.nodeId,
        generationId: `upscale_${Date.now()}`,
        status: NodeStatus.SUCCESS,
        previewUrl: request.inputImageUrl, // In real API, this would be the upscaled version
        processingTime: 3500,
        creditsUsed: 1,
    };
};

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
];

// ============================================
// PUBLIC API METHODS
// ============================================

export const workflowApi = {
    /**
     * Generate images from a prompt
     */
    async generateImage(request: GenerateImageRequest): Promise<GenerationResult> {
        if (USE_MOCK) {
            return mockGenerateImage(request);
        }

        try {
            const response = await api.post<GenerationResult>('/generate/image', request);
            return response.data;
        } catch (error: any) {
            return {
                success: false,
                nodeId: request.nodeId,
                generationId: '',
                status: NodeStatus.ERROR,
                error: error.response?.data?.error || error.message || 'Failed to generate image',
            };
        }
    },

    /**
     * Generate video from prompt/image
     */
    async generateVideo(request: GenerateVideoRequest): Promise<GenerationResult> {
        if (USE_MOCK) {
            return mockGenerateVideo(request);
        }

        try {
            const response = await api.post<GenerationResult>('/generate/video', request);
            return response.data;
        } catch (error: any) {
            return {
                success: false,
                nodeId: request.nodeId,
                generationId: '',
                status: NodeStatus.ERROR,
                error: error.response?.data?.error || error.message || 'Failed to generate video',
            };
        }
    },

    /**
     * Enhance a prompt using AI
     */
    async enhancePrompt(request: EnhancePromptRequest): Promise<{ enhancedText: string; error?: string }> {
        if (USE_MOCK) {
            return mockEnhancePrompt(request);
        }

        try {
            const response = await api.post<{ enhancedText: string }>('/enhance/prompt', request);
            return response.data;
        } catch (error: any) {
            return {
                enhancedText: '',
                error: error.response?.data?.error || error.message || 'Failed to enhance prompt',
            };
        }
    },

    /**
     * Upscale an image
     */
    async upscaleImage(request: UpscaleImageRequest): Promise<GenerationResult> {
        if (USE_MOCK) {
            return mockUpscaleImage(request);
        }

        try {
            const response = await api.post<GenerationResult>('/upscale/image', request);
            return response.data;
        } catch (error: any) {
            return {
                success: false,
                nodeId: request.nodeId,
                generationId: '',
                status: NodeStatus.ERROR,
                error: error.response?.data?.error || error.message || 'Failed to upscale image',
            };
        }
    },

    /**
     * Check generation status (for polling)
     */
    async checkGenerationStatus(generationId: string): Promise<GenerationResult> {
        if (USE_MOCK) {
            // Mock always returns complete
            return {
                success: true,
                nodeId: '',
                generationId,
                status: NodeStatus.SUCCESS,
            };
        }

        try {
            const response = await api.get<GenerationResult>(`/generation/${generationId}/status`);
            return response.data;
        } catch (error: any) {
            return {
                success: false,
                nodeId: '',
                generationId,
                status: NodeStatus.ERROR,
                error: error.response?.data?.error || error.message,
            };
        }
    },

    /**
     * Upload media file
     */
    async uploadMedia(file: File, onProgress?: (progress: number) => void): Promise<MediaItem | null> {
        if (USE_MOCK) {
            // Simulate upload progress
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
            const response = await api.post('/files/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.total && onProgress) {
                        onProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
                    }
                },
            });
            return response.data;
        } catch (error) {
            return null;
        }
    },

    /**
     * Get media library
     */
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
            const response = await api.get<MediaLibraryResponse>('/media/library', {
                params: { folder: folder || '', page }
            });
            return response.data;
        } catch {
            return { items: [], folders: [], totalCount: 0, hasMore: false };
        }
    },

    /**
     * Save workflow
     */
    async saveWorkflow(workflow: WorkflowData): Promise<{ success: boolean; id?: string; error?: string }> {
        if (USE_MOCK) {
            await mockDelay(500);
            return { success: true, id: workflow.id };
        }

        try {
            const response = await api.post<{ id: string }>('/workflows', workflow);
            return { success: true, id: response.data.id };
        } catch (error: any) {
            return {
                success: false,
                error: error.response?.data?.error || error.message,
            };
        }
    },

    /**
     * Load workflow
     */
    async loadWorkflow(workflowId: string): Promise<WorkflowData | null> {
        if (USE_MOCK) {
            await mockDelay(300);
            return null; // No saved workflows in mock
        }

        try {
            const response = await api.get<WorkflowData>(`/workflows/${workflowId}`);
            return response.data;
        } catch {
            return null;
        }
    },
};

// ============================================
// WEBSOCKET SERVICE (for real-time updates)
// ============================================

type StatusCallback = (status: GenerationResult) => void;

class WebSocketService {
    private ws: WebSocket | null = null;
    private callbacks: Map<string, StatusCallback> = new Map();
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;

    connect() {
        if (USE_MOCK || this.ws?.readyState === WebSocket.OPEN) {
            return;
        }

        const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {

            this.reconnectAttempts = 0;
        };

        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data) as GenerationResult;
                const callback = this.callbacks.get(data.generationId);
                if (callback) {
                    callback(data);
                    if (data.status === NodeStatus.SUCCESS || data.status === NodeStatus.ERROR) {
                        this.callbacks.delete(data.generationId);
                    }
                }
            } catch (e) {
                console.error('Failed to parse WebSocket message:', e);
            }
        };

        this.ws.onclose = () => {
            if (this.reconnectAttempts < this.maxReconnectAttempts) {
                this.reconnectAttempts++;
                setTimeout(() => this.connect(), 1000 * this.reconnectAttempts);
            }
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    }

    subscribe(generationId: string, callback: StatusCallback) {
        this.callbacks.set(generationId, callback);
    }

    unsubscribe(generationId: string) {
        this.callbacks.delete(generationId);
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
}

export const wsService = new WebSocketService();
