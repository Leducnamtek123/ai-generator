import { create } from 'zustand';
import { toast } from 'sonner';

import { get as apiGet } from '@/lib/api';
import { getGeneration, postGeneration } from '@/lib/api/generations';
import { getUserFacingErrorMessage, isAbortError, pollUntil } from '@/lib/async-operation';

export interface Generation {
  id: string;
  userId: string;
  type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  prompt: string;
  model?: string;
  resultUrl?: string;
  error?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export type GenerationSnapshot = Partial<Generation> & {
  id: string;
  status: Generation['status'];
  resultUrl?: string;
  metadata?: Record<string, unknown>;
};

type GenerationListResponse = {
  data?: Generation[];
};

type TemplateListResponse = {
  data?: unknown[];
};

type FetchGenerationsParams = {
  page?: number;
  limit?: number;
  type?: string;
  search?: string;
};

type GenerationParams = Record<string, unknown>;

interface GenerationState {
  currentGeneration: GenerationSnapshot | null;
  isGenerating: boolean;
  error: string | null;
  fetchError: string | null;

  generateImage: (params: {
    prompt: string;
    model?: string;
    aspectRatio?: string;
    seed?: number;
  }) => Promise<void>;
  generateVideo: (params: {
    prompt: string;
    model?: string;
    duration?: string;
    aspectRatio?: string;
    startImageUrl?: string;
    endImageUrl?: string;
  }) => Promise<void>;
  upscaleImage: (params: {
    imageUrl: string;
    scale?: number;
    model?: string;
    optimization?: string;
    engine?: string;
    mode?: string;
    creativity?: number;
    hdr?: number;
    resemblance?: number;
    fractality?: number;
    prompt?: string;
  }) => Promise<void>;

  generateMusic: (params: {
    prompt: string;
    genre?: string;
    moods?: string[];
    instruments?: string[];
    duration?: number;
    tempo?: number;
  }) => Promise<void>;
  generateSfx: (params: { prompt: string; category?: string; duration?: number }) => Promise<void>;
  generateVoice: (params: {
    text: string;
    mode?: 'tts' | 'clone';
    voiceId?: string;
    language?: string;
    emotion?: string;
    speed?: number;
  }) => Promise<void>;

  lipSync: (params: {
    videoUrl: string;
    audioUrl: string;
    syncMode?: string;
    accuracy?: number;
    smoothing?: number;
  }) => Promise<void>;
  upscaleVideo: (params: {
    videoUrl: string;
    targetResolution?: string;
    model?: string;
    denoise?: number;
    sharpen?: number;
    fpsBoost?: boolean;
  }) => Promise<void>;

  removeBackground: (params: {
    imageUrl: string;
    mode?: string;
    edgeRefinement?: number;
  }) => Promise<void>;
  sketchToImage: (params: {
    prompt: string;
    sketchUrl: string;
    style?: string;
    fidelity?: number;
  }) => Promise<void>;
  imageVariations: (params: {
    imageUrl: string;
    prompt?: string;
    strength?: number;
    count?: number;
  }) => Promise<void>;
  cameraChange: (params: {
    imageUrl: string;
    movement?: string;
    angle?: number;
    prompt?: string;
  }) => Promise<void>;
  iconGenerator: (params: {
    prompt: string;
    style?: string;
    size?: string;
    color?: string;
    backgroundColor?: string;
  }) => Promise<void>;
  imageExtend: (params: {
    imageUrl: string;
    direction?: string;
    pixels?: number;
    prompt?: string;
  }) => Promise<void>;
  mockupGenerator: (params: {
    designUrl: string;
    template?: string;
    prompt?: string;
    scene?: string;
  }) => Promise<void>;
  skinEnhance: (params: {
    imageUrl: string;
    level?: number;
    mode?: string;
    preserveDetails?: boolean;
  }) => Promise<void>;

  startGeneration: (endpoint: string, params: GenerationParams) => Promise<void>;

  generations: Generation[];
  isLoading: boolean;
  fetchGenerations: (params: FetchGenerationsParams) => Promise<void>;
  templates: unknown[];
  isTemplatesLoading: boolean;
  fetchTemplates: (params: FetchGenerationsParams) => Promise<void>;

  pollStatus: (id: string) => Promise<void>;
  cancelPolling: (id?: string) => void;
  reset: () => void;
}

const generationPollers = new Map<string, AbortController>();
const GENERATION_POLL_INTERVAL_MS = 2000;
const GENERATION_POLL_TIMEOUT_MS = 10 * 60 * 1000;

function stopPolling(id?: string) {
  if (id) {
    const controller = generationPollers.get(id);
    controller?.abort();
    generationPollers.delete(id);
    return;
  }

  for (const controller of generationPollers.values()) {
    controller.abort();
  }
  generationPollers.clear();
}

function createGenerationAction(endpoint: string) {
  return async (
    params: GenerationParams,
    set: (state: Partial<GenerationState>) => void,
    get: () => GenerationState,
  ) => {
    set({ isGenerating: true, error: null, currentGeneration: null });

    try {
      const generation = await postGeneration<GenerationSnapshot, GenerationParams>(endpoint, params);
      set({ currentGeneration: generation });

      if (generation.status === 'pending' || generation.status === 'processing') {
        toast.loading('Processing your request...', { id: 'generation' });
        void get().pollStatus(generation.id);
        return;
      }

      set({ isGenerating: false });
      if (generation.status === 'completed') {
        toast.success('Generation completed!', { id: 'generation' });
        void get().fetchGenerations({ type: generation.type });
        return;
      }

      const message = generation.error || 'Generation failed';
      set({ error: message });
      toast.error(message, { id: 'generation' });
    } catch (error) {
      const message = getUserFacingErrorMessage(error, 'Failed to start generation');
      console.error(`Generation failed (${endpoint})`, error);
      set({ isGenerating: false, error: message });

      if (!isAbortError(error)) {
        toast.error(message, { id: 'generation' });
      }
    }
  };
}

async function pollGenerationUntilTerminal(id: string, signal: AbortSignal): Promise<GenerationSnapshot> {
  return pollUntil({
    fetcher: (pollSignal) => getGeneration(id, { signal: pollSignal }),
    shouldStop: (generation) =>
      generation.status === 'completed' || generation.status === 'failed',
    intervalMs: GENERATION_POLL_INTERVAL_MS,
    timeoutMs: GENERATION_POLL_TIMEOUT_MS,
    signal,
  });
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
const sketchToImageAction = createGenerationAction('/generations/sketch-to-image');
const variationsAction = createGenerationAction('/generations/variations');
const cameraChangeAction = createGenerationAction('/generations/camera-change');
const iconGenAction = createGenerationAction('/generations/icon-gen');
const imageExtendAction = createGenerationAction('/generations/image-extend');
const mockupAction = createGenerationAction('/generations/mockup');
const skinEnhanceAction = createGenerationAction('/generations/skin-enhance');

export const useGenerationStore = create<GenerationState>((set, get) => ({
  currentGeneration: null,
  isGenerating: false,
  error: null,
  fetchError: null,
  generations: [],
  isLoading: false,
  templates: [],
  isTemplatesLoading: false,

  generateImage: (params) => imageAction(params, set, get),
  generateVideo: (params) => videoAction(params, set, get),
  upscaleImage: (params) => upscaleAction(params, set, get),
  generateMusic: (params) => musicAction(params, set, get),
  generateSfx: (params) => sfxAction(params, set, get),
  generateVoice: (params) => voiceAction(params, set, get),
  lipSync: (params) => lipSyncAction(params, set, get),
  upscaleVideo: (params) => videoUpscaleAction(params, set, get),
  removeBackground: (params) => bgRemoveAction(params, set, get),
  sketchToImage: (params) => sketchToImageAction(params, set, get),
  imageVariations: (params) => variationsAction(params, set, get),
  cameraChange: (params) => cameraChangeAction(params, set, get),
  iconGenerator: (params) => iconGenAction(params, set, get),
  imageExtend: (params) => imageExtendAction(params, set, get),
  mockupGenerator: (params) => mockupAction(params, set, get),
  skinEnhance: (params) => skinEnhanceAction(params, set, get),

  startGeneration: async (endpoint, params) => {
    const action = createGenerationAction(endpoint);
    return action(params, set, get);
  },

  fetchGenerations: async (params) => {
    set({ isLoading: true, fetchError: null });

    try {
      const query = new URLSearchParams();
      if (params.page) query.append('page', String(params.page));
      if (params.limit) query.append('limit', String(params.limit));
      if (params.type) query.append('type', params.type);
      if (params.search) query.append('search', params.search);

      const response = await apiGet<GenerationListResponse>(`/generations?${query.toString()}`);
      set({ generations: response.data || [] });
    } catch (error) {
      const message = getUserFacingErrorMessage(error, 'Failed to fetch generations');
      const status = (error as { response?: { status?: number } })?.response?.status;
      console.error('Failed to fetch generations', { status, type: params.type, error });
      set({
        fetchError: status === 500 ? 'Server error while loading generations' : message,
      });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchTemplates: async (params) => {
    set({ isTemplatesLoading: true });

    try {
      const query = new URLSearchParams();
      if (params.page) query.append('page', String(params.page));
      if (params.limit) query.append('limit', String(params.limit));
      if (params.type) query.append('type', params.type);
      if (params.search) query.append('search', params.search);

      const response = await apiGet<TemplateListResponse>(`/templates?${query.toString()}`);
      set({ templates: response.data || [] });
    } catch (error) {
      const message = getUserFacingErrorMessage(error, 'Failed to fetch templates');
      const status = (error as { response?: { status?: number } })?.response?.status;
      console.error('Failed to fetch templates', { status, type: params.type, error });
      set({ fetchError: message });
    } finally {
      set({ isTemplatesLoading: false });
    }
  },

  pollStatus: async (id) => {
    stopPolling(id);
    const controller = new AbortController();
    generationPollers.set(id, controller);

    try {
      const generation = await pollGenerationUntilTerminal(id, controller.signal);
      set({ currentGeneration: generation });

      if (generation.status === 'completed') {
        set({ isGenerating: false, error: null });
        toast.success('Generation completed!', { id: 'generation' });
        void get().fetchGenerations({ type: generation.type });
        return;
      }

      const message = generation.error || 'Generation failed';
      set({ isGenerating: false, error: message });
      toast.error(message, { id: 'generation' });
    } catch (error) {
      if (isAbortError(error)) {
        set({ isGenerating: false });
        return;
      }

      const message = getUserFacingErrorMessage(error, 'Failed to update status');
      console.error('Polling failed', error);
      set({ isGenerating: false, error: message });
      toast.error(message, { id: 'generation' });
    } finally {
      if (generationPollers.get(id) === controller) {
        generationPollers.delete(id);
      }
    }
  },

  cancelPolling: (id) => {
    stopPolling(id);
  },

  reset: () => {
    stopPolling();
    set({
      currentGeneration: null,
      isGenerating: false,
      error: null,
      fetchError: null,
      generations: [],
      templates: [],
      isLoading: false,
      isTemplatesLoading: false,
    });
  },
}));
