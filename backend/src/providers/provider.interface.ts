/**
 * AI Provider Interface - Contract for all provider adapters
 */
export interface ImageOptions {
  model?: string;
  aspectRatio?: string;
  quality?: 'standard' | 'hd' | '4k';
  negativePrompt?: string;
  seed?: number;
}

export interface VideoOptions {
  model?: string;
  duration?: string;
  aspectRatio?: string;
  startImageUrl?: string;
  endImageUrl?: string;
}

export interface UpscaleOptions {
  scale: 2 | 4;
  enhanceMode?: 'balanced' | 'creative' | 'faithful';
}

export interface GenerationResult {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  resultUrl?: string;
  thumbnailUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface AIProvider {
  readonly name: string;

  /**
   * Generate an image from a text prompt
   */
  generateImage(
    prompt: string,
    options?: ImageOptions,
  ): Promise<GenerationResult>;

  /**
   * Generate a video from a text prompt or image
   */
  generateVideo(
    prompt: string,
    options?: VideoOptions,
  ): Promise<GenerationResult>;

  /**
   * Upscale an existing image
   */
  upscaleImage(
    imageUrl: string,
    options?: UpscaleOptions,
  ): Promise<GenerationResult>;

  /**
   * Enhance a prompt using AI
   */
  enhancePrompt(prompt: string, style?: string): Promise<string>;
}

/**
 * Provider type enumeration
 */
export type ProviderType =
  | 'n8n'
  | 'leonardo'
  | 'openai'
  | 'runway'
  | 'replicate';
