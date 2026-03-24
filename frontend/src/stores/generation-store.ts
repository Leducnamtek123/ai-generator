import { create } from 'zustand';
import { post as apiPost, get as apiGet } from '@/lib/api';

export interface Generation {
    id: string;
    userId: string;
    type: 'image' | 'video' | 'upscale';
    status: 'pending' | 'processing' | 'completed' | 'failed';
    prompt: string;
    model?: string;
    resultUrl?: string;
    error?: string;
    createdAt: string;
    updatedAt: string;
}

interface GenerationState {
    currentGeneration: Generation | null;
    isGenerating: boolean;
    error: string | null;

    generateImage: (params: { prompt: string; model?: string; aspectRatio?: string; seed?: number }) => Promise<void>;
    upscaleImage: (params: { imageUrl: string; scale?: number; creativity?: number; hdr?: number; resemblance?: number }) => Promise<void>;
    pollStatus: (id: string) => Promise<void>;
    reset: () => void;
}

export const useGenerationStore = create<GenerationState>((set, get) => ({
    currentGeneration: null,
    isGenerating: false,
    error: null,

    generateImage: async (params) => {
        set({ isGenerating: true, error: null, currentGeneration: null });
        try {
            // Call API
            const generation = await apiPost<Generation>('/generations/image', params);
            set({ currentGeneration: generation });

            // If not completed, start polling
            if (generation.status === 'pending' || generation.status === 'processing') {
                get().pollStatus(generation.id);
            } else {
                set({ isGenerating: false });
            }
        } catch (error: any) {
            console.error('Generation failed', error);
            set({ isGenerating: false, error: error.message || 'Failed to start generation' });
        }
    },

    upscaleImage: async (params) => {
        set({ isGenerating: true, error: null, currentGeneration: null });
        try {
            const generation = await apiPost<Generation>('/generations/upscale', params);
            set({ currentGeneration: generation });

            if (generation.status === 'pending' || generation.status === 'processing') {
                get().pollStatus(generation.id);
            } else {
                set({ isGenerating: false });
            }
        } catch (error: any) {
            console.error('Upscale failed', error);
            set({ isGenerating: false, error: error.message || 'Failed to start upscale' });
        }
    },

    pollStatus: async (id) => {
        const pollInterval = 2000; // 2 seconds

        const checkStatus = async () => {
            try {
                const generation = await apiGet<Generation>(`/generations/${id}`);
                set({ currentGeneration: generation });

                if (generation.status === 'completed' || generation.status === 'failed') {
                    set({ isGenerating: false });
                } else {
                    // Continue polling
                    setTimeout(checkStatus, pollInterval);
                }
            } catch (error) {
                console.error('Polling failed', error);
                // Don't stop polling on transient network errors? 
                // For now, stop to avoid infinite loop of errors
                set({ isGenerating: false, error: 'Failed to update status' });
            }
        };

        setTimeout(checkStatus, pollInterval);
    },

    reset: () => set({ currentGeneration: null, isGenerating: false, error: null }),
}));
