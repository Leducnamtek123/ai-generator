import { create } from 'zustand';
import { post as apiPost, get as apiGet } from '@/lib/api';
import { toast } from 'sonner';

export interface Generation {
    id: string;
    userId: string;
    type: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    prompt: string;
    model?: string;
    resultUrl?: string;
    error?: string;
    metadata?: Record<string, any>;
    createdAt: string;
    updatedAt: string;
}

interface GenerationState {
    currentGeneration: Generation | null;
    isGenerating: boolean;
    error: string | null;

    // Core generation actions
    generateImage: (params: { prompt: string; model?: string; aspectRatio?: string; seed?: number }) => Promise<void>;
    generateVideo: (params: { prompt: string; model?: string; duration?: string; aspectRatio?: string; startImageUrl?: string; endImageUrl?: string }) => Promise<void>;
    upscaleImage: (params: { imageUrl: string; scale?: number; creativity?: number; hdr?: number; resemblance?: number }) => Promise<void>;

    // Audio generation actions
    generateMusic: (params: { prompt: string; genre?: string; moods?: string[]; instruments?: string[]; duration?: number; tempo?: number }) => Promise<void>;
    generateSfx: (params: { prompt: string; category?: string; duration?: number }) => Promise<void>;
    generateVoice: (params: { text: string; mode?: 'tts' | 'clone'; voiceId?: string; language?: string; emotion?: string; speed?: number }) => Promise<void>;

    // Video processing actions
    lipSync: (params: { videoUrl: string; audioUrl: string; syncMode?: string; accuracy?: number; smoothing?: number }) => Promise<void>;
    upscaleVideo: (params: { videoUrl: string; targetResolution?: string; model?: string; denoise?: number; sharpen?: number; fpsBoost?: boolean }) => Promise<void>;

    // Image processing actions
    removeBackground: (params: { imageUrl: string; mode?: string; edgeRefinement?: number }) => Promise<void>;

    // Generic action for any endpoint
    startGeneration: (endpoint: string, params: Record<string, any>) => Promise<void>;

    pollStatus: (id: string) => Promise<void>;
    reset: () => void;
}

/**
 * Helper to create a standard generation action.
 * Reduces boilerplate for each endpoint.
 */
function createGenerationAction(endpoint: string) {
    return async (
        params: Record<string, any>,
        set: (state: Partial<GenerationState>) => void,
        get: () => GenerationState,
    ) => {
        set({ isGenerating: true, error: null, currentGeneration: null });
        try {
            const generation = await apiPost<Generation>(endpoint, params);
            set({ currentGeneration: generation });

            if (generation.status === 'pending' || generation.status === 'processing') {
                toast.loading('Processing your request...', { id: 'generation' });
                get().pollStatus(generation.id);
            } else if (generation.status === 'completed') {
                set({ isGenerating: false });
                toast.success('Generation completed!', { id: 'generation' });
            } else {
                set({ isGenerating: false });
            }
        } catch (error: any) {
            console.error(`Generation failed (${endpoint})`, error);
            const msg = error.message || 'Failed to start generation';
            set({ isGenerating: false, error: msg });
            toast.error(msg, { id: 'generation' });
        }
    };
}

const imageAction = createGenerationAction('/generations/image');
const videoAction = createGenerationAction('/generations/video');
const upscaleAction = createGenerationAction('/generations/upscale');
const musicAction = createGenerationAction('/generations/music');
const sfxAction = createGenerationAction('/generations/sfx');
const voiceAction = createGenerationAction('/generations/voice');
const lipSyncAction = createGenerationAction('/generations/lip-sync');
const videoUpscaleAction = createGenerationAction('/generations/video-upscale');
const bgRemoveAction = createGenerationAction('/generations/bg-remove');

export const useGenerationStore = create<GenerationState>((set, get) => ({
    currentGeneration: null,
    isGenerating: false,
    error: null,

    // Core
    generateImage: (params) => imageAction(params, set, get),
    generateVideo: (params) => videoAction(params, set, get),
    upscaleImage: (params) => upscaleAction(params, set, get),

    // Audio
    generateMusic: (params) => musicAction(params, set, get),
    generateSfx: (params) => sfxAction(params, set, get),
    generateVoice: (params) => voiceAction(params, set, get),

    // Video processing
    lipSync: (params) => lipSyncAction(params, set, get),
    upscaleVideo: (params) => videoUpscaleAction(params, set, get),

    // Image processing
    removeBackground: (params) => bgRemoveAction(params, set, get),

    // Generic
    startGeneration: async (endpoint, params) => {
        const action = createGenerationAction(endpoint);
        return action(params, set, get);
    },

    pollStatus: async (id) => {
        const pollInterval = 2000;

        const checkStatus = async () => {
            try {
                const generation = await apiGet<Generation>(`/generations/${id}`);
                set({ currentGeneration: generation });

                if (generation.status === 'completed') {
                    set({ isGenerating: false });
                    toast.success('Generation completed!', { id: 'generation' });
                } else if (generation.status === 'failed') {
                    set({ isGenerating: false });
                    toast.error(generation.error || 'Generation failed', { id: 'generation' });
                } else {
                    setTimeout(checkStatus, pollInterval);
                }
            } catch (error) {
                console.error('Polling failed', error);
                set({ isGenerating: false, error: 'Failed to update status' });
                toast.error('Connection lost. Please refresh.', { id: 'generation' });
            }
        };

        setTimeout(checkStatus, pollInterval);
    },

    reset: () => set({ currentGeneration: null, isGenerating: false, error: null }),
}));
