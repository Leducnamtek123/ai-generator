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
    enhanceMode?: 'balanced' | 'creative' | 'faithful';
}

export interface EnhancePromptParams {
    prompt: string;
    style?: string;
}

/**
 * Generate an image using the configured AI provider
 */
export async function generateImage(params: GenerateImageParams): Promise<GenerationResult> {
    return post<GenerationResult>('/generations/image', params);
}

/**
 * Generate a video using the configured AI provider
 */
export async function generateVideo(params: GenerateVideoParams): Promise<GenerationResult> {
    return post<GenerationResult>('/generations/video', params);
}

/**
 * Upscale an image using the configured AI provider
 */
export async function upscaleImage(params: UpscaleImageParams): Promise<GenerationResult> {
    return post<GenerationResult>('/generations/upscale', params);
}

/**
 * Enhance a prompt using AI
 */
export async function enhancePrompt(params: EnhancePromptParams): Promise<{ enhancedPrompt: string }> {
    return post<{ enhancedPrompt: string }>('/generations/enhance-prompt', params);
}
