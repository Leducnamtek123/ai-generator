import { get, post } from '@/lib/api';

export interface GenerationResult {
    id: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    resultUrl?: string;
    thumbnailUrl?: string;
    metadata?: Record<string, unknown>;
}

export interface GenerateImageParams {
    prompt: string;
    model?: string;
    aspectRatio?: string;
    quality?: 'standard' | 'hd' | '4k';
    negativePrompt?: string;
    seed?: number;
}

export interface GenerateVideoParams {
    prompt: string;
    model?: string;
    duration?: string;
    aspectRatio?: string;
    startImageUrl?: string;
    endImageUrl?: string;
}

export interface UpscaleImageParams {
    imageUrl: string;
    scale?: 2 | 4;
    enhanceMode?: 'balanced' | 'creative' | 'faithful' | 'precision';
}

export interface EnhancePromptParams {
    prompt: string;
    style?: string;
}

// ======== New Audio Params ========

export interface GenerateMusicParams {
    prompt: string;
    genre?: string;
    moods?: string[];
    instruments?: string[];
    duration?: number;
    tempo?: number;
}

export interface GenerateSfxParams {
    prompt: string;
    category?: string;
    duration?: number;
}

export interface GenerateVoiceParams {
    text: string;
    mode?: 'tts' | 'clone';
    voiceId?: string;
    language?: string;
    emotion?: string;
    speed?: number;
}

// ======== New Video Processing Params ========

export interface LipSyncParams {
    videoUrl: string;
    audioUrl: string;
    syncMode?: string;
    accuracy?: number;
    smoothing?: number;
}

export interface UpscaleVideoParams {
    videoUrl: string;
    targetResolution?: string;
    model?: string;
    denoise?: number;
    sharpen?: number;
    fpsBoost?: boolean;
}

// ======== New Image Processing Params ========

export interface RemoveBackgroundParams {
    imageUrl: string;
    mode?: string;
    edgeRefinement?: number;
}

// ======== API Functions ========

/** Generate an image using the configured AI provider */
export async function generateImage(params: GenerateImageParams): Promise<GenerationResult> {
    return post<GenerationResult>('/generations/image', params);
}

/** Generate a video using the configured AI provider */
export async function generateVideo(params: GenerateVideoParams): Promise<GenerationResult> {
    return post<GenerationResult>('/generations/video', params);
}

/** Upscale an image using the configured AI provider */
export async function upscaleImage(params: UpscaleImageParams): Promise<GenerationResult> {
    return post<GenerationResult>('/generations/upscale', params);
}

/** Enhance a prompt using AI */
export async function enhancePrompt(params: EnhancePromptParams): Promise<{ enhancedPrompt: string }> {
    return post<{ enhancedPrompt: string }>('/generations/enhance-prompt', params);
}

/** Generate music from text description */
export async function generateMusic(params: GenerateMusicParams): Promise<GenerationResult> {
    return post<GenerationResult>('/generations/music', params);
}

/** Generate a sound effect from text */
export async function generateSfx(params: GenerateSfxParams): Promise<GenerationResult> {
    return post<GenerationResult>('/generations/sfx', params);
}

/** Generate voice audio (TTS or clone) */
export async function generateVoice(params: GenerateVoiceParams): Promise<GenerationResult> {
    return post<GenerationResult>('/generations/voice', params);
}

/** Lip-sync a video to audio */
export async function lipSync(params: LipSyncParams): Promise<GenerationResult> {
    return post<GenerationResult>('/generations/lip-sync', params);
}

/** Upscale a video to higher resolution */
export async function upscaleVideo(params: UpscaleVideoParams): Promise<GenerationResult> {
    return post<GenerationResult>('/generations/video-upscale', params);
}

/** Remove background from an image */
export async function removeBackground(params: RemoveBackgroundParams): Promise<GenerationResult> {
    return post<GenerationResult>('/generations/bg-remove', params);
}

/** Get generation status by ID */
export async function getGeneration(id: string): Promise<GenerationResult> {
    return get<GenerationResult>(`/generations/${id}`);
}
