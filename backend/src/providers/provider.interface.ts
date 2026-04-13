/**
 * AI Provider Interface - Contract for all provider adapters
 * Supports: Image, Video, Audio, Upscale, Prompt Enhancement
 */
export interface ImageOptions {
  model?: string;
  aspectRatio?: string;
  quality?: 'standard' | 'hd' | '4k';
  negativePrompt?: string;
  seed?: number;
  style?: string;
  steps?: number;
  cfgScale?: number;
}

export interface VideoOptions {
  model?: string;
  duration?: string;
  aspectRatio?: string;
  startImageUrl?: string;
  endImageUrl?: string;
  fps?: number;
  resolution?: string;
}

import {
  UpscaleMode,
  UpscaleModel,
  UpscaleScale,
  UpscaleOptimization,
  UpscaleEngine,
} from '../generations/generations.constants';

export interface UpscaleOptions {
  scale: UpscaleScale;
  mode?: UpscaleMode;
  enhanceMode?: UpscaleMode;
  model?: UpscaleModel;
  optimization?: UpscaleOptimization;
  creativity?: number;
  hdr?: number;
  resemblance?: number;
  fractality?: number;
  engine?: UpscaleEngine;
  prompt?: string;
}

export interface AudioOptions {
  model?: string;
  duration?: number;
  voice?: string;
  language?: string;
  format?: 'mp3' | 'wav' | 'ogg';
}

export interface ImageProcessingOptions {
  imageUrl: string;
  type: string; // 'bg-remove' | 'sketch-to-image' | 'variations' | etc.
  prompt?: string;
  strength?: number;
  [key: string]: any;
}

export interface GenerationResult {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  resultUrl?: string;
  thumbnailUrl?: string;
  metadata?: Record<string, unknown>;
  error?: string;
}

export interface AIProvider {
  readonly name: string;

  /** Which capabilities this provider supports */
  readonly capabilities: ProviderCapability[];

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

  /**
   * Generate audio (music, sfx, voice)
   */
  generateAudio(
    prompt: string,
    type: 'music' | 'sfx' | 'voice',
    options?: AudioOptions,
  ): Promise<GenerationResult>;

  /**
   * Process an image (bg-remove, sketch-to-image, variations, etc.)
   */
  processImage(
    options: ImageProcessingOptions,
  ): Promise<GenerationResult>;

  /**
   * Check if this provider supports a given capability
   */
  supports(capability: ProviderCapability): boolean;
}

/**
 * Provider capability enumeration
 */
export type ProviderCapability =
  | 'image-generation'
  | 'video-generation'
  | 'audio-music'
  | 'audio-sfx'
  | 'audio-voice'
  | 'upscale'
  | 'prompt-enhance'
  | 'bg-remove'
  | 'sketch-to-image'
  | 'variations'
  | 'camera-change'
  | 'icon-gen'
  | 'image-extend'
  | 'mockup'
  | 'skin-enhance'
  | 'lip-sync'
  | 'video-upscale';

/**
 * Provider type enumeration
 */
export type ProviderType =
  | 'replicate'
  | 'stability'
  | 'openai'
  | 'leonardo'
  | 'runway'
  | 'elevenlabs'
  | 'fal';

/**
 * Abstract base class providing default implementations
 */
export abstract class BaseProvider implements AIProvider {
  abstract readonly name: string;
  abstract readonly capabilities: ProviderCapability[];

  supports(capability: ProviderCapability): boolean {
    return this.capabilities.includes(capability);
  }

  async generateImage(
    _prompt: string,
    _options?: ImageOptions,
  ): Promise<GenerationResult> {
    throw new Error(`${this.name} does not support image generation`);
  }

  async generateVideo(
    _prompt: string,
    _options?: VideoOptions,
  ): Promise<GenerationResult> {
    throw new Error(`${this.name} does not support video generation`);
  }

  async upscaleImage(
    _imageUrl: string,
    _options?: UpscaleOptions,
  ): Promise<GenerationResult> {
    throw new Error(`${this.name} does not support image upscaling`);
  }

  async enhancePrompt(prompt: string, _style?: string): Promise<string> {
    return prompt; // Default: return original prompt
  }

  async generateAudio(
    _prompt: string,
    _type: 'music' | 'sfx' | 'voice',
    _options?: AudioOptions,
  ): Promise<GenerationResult> {
    throw new Error(`${this.name} does not support audio generation`);
  }

  async processImage(
    _options: ImageProcessingOptions,
  ): Promise<GenerationResult> {
    throw new Error(`${this.name} does not support image processing`);
  }
}
