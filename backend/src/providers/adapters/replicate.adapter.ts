import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '../../config/config.type';
import {
  BaseProvider,
  GenerationResult,
  ImageOptions,
  VideoOptions,
  UpscaleOptions,
  AudioOptions,
  ImageProcessingOptions,
  ProviderCapability,
} from '../provider.interface';

const REPLICATE_API_BASE = 'https://api.replicate.com/v1';

/**
 * Replicate API Adapter - Most versatile provider
 * Supports: Image (Flux, SDXL), Video (Wan, LTX), Audio (MusicGen),
 *           Upscale (Real-ESRGAN), BG Remove, and many more models
 */
@Injectable()
export class ReplicateAdapter extends BaseProvider {
  readonly name = 'replicate';
  readonly capabilities: ProviderCapability[] = [
    'image-generation',
    'video-generation',
    'audio-music',
    'audio-sfx',
    'upscale',
    'bg-remove',
    'sketch-to-image',
    'variations',
    'image-extend',
    'video-upscale',
    'prompt-enhance',
  ];

  private readonly logger = new Logger(ReplicateAdapter.name);

  // Default model versions for each capability
  private readonly defaultModels: Record<string, string> = {
    'image': 'black-forest-labs/flux-1.1-pro',
    'image-schnell': 'black-forest-labs/flux-schnell',
    'video': 'wan-video/wan-2.1-i2v-480p',
    'upscale': 'nightmareai/real-esrgan:f121d640bd286e1fdc67f9799164c1d5be36ff74576ee11c803ae5b665dd46aa',
    'bg-remove': 'cjwbw/rembg:fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003',
    'music': 'meta/musicgen:671ac645ce5e552cc63a54a2bbff63fcf798043055f2a2c0a23a6de13f6b5508',
    'sketch-to-image': 'rossjillian/controlnet:795433b19458d0f4fa172a7ccf93178d2adb1cb8ab2ad6c8fdc33fdbcd49f477',
    'variations': 'stability-ai/sdxl:7762fd07cf82c948c1b3d0a30ad57e814fe0e8e4e20eb8373ee2239f6a615de5',
    'image-extend': 'stability-ai/stable-diffusion-3.5-large',
    'video-upscale': 'lucataco/video-retalking:3cf42a4a795ed972c45e73e22e3cb22e69b27e71df4c4c4a7c419747b101e83e',
  };

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService<AllConfigType>,
  ) {
    super();
  }

  private getApiKey(): string {
    const apiKey = this.configService.get(
      'providers.replicate.apiKey',
      { infer: true },
    ) as string | undefined;
    if (!apiKey) {
      throw new Error('REPLICATE_API_KEY is not configured');
    }
    return apiKey;
  }

  private getHeaders() {
    return {
      Authorization: `Bearer ${this.getApiKey()}`,
      'Content-Type': 'application/json',
      Prefer: 'wait',
    };
  }

  /**
   * Create a prediction on Replicate
   */
  private async createPrediction(
    modelVersion: string,
    input: Record<string, any>,
  ): Promise<any> {
    // Check if it's a model path (org/model) or a versioned model (org/model:version)
    const isVersioned = modelVersion.includes(':');

    let url: string;
    let body: Record<string, any>;

    if (isVersioned) {
      // Use predictions API with version
      url = `${REPLICATE_API_BASE}/predictions`;
      body = { version: modelVersion.split(':')[1], input };
    } else {
      // Use models API for official models
      url = `${REPLICATE_API_BASE}/models/${modelVersion}/predictions`;
      body = { input };
    }

    const response = await this.httpService.axiosRef.post(url, body, {
      headers: {
        Authorization: `Bearer ${this.getApiKey()}`,
        'Content-Type': 'application/json',
        Prefer: 'wait=120', // Wait up to 120s for result
      },
      timeout: 180000, // 3 min timeout
    });

    return response.data;
  }

  /**
   * Poll a prediction until it completes
   */
  private async pollPrediction(
    predictionId: string,
    maxRetries = 60,
    delayMs = 5000,
  ): Promise<any> {
    for (let i = 0; i < maxRetries; i++) {
      const response = await this.httpService.axiosRef.get(
        `${REPLICATE_API_BASE}/predictions/${predictionId}`,
        { headers: { Authorization: `Bearer ${this.getApiKey()}` } },
      );

      const prediction = response.data;

      if (prediction.status === 'succeeded') {
        return prediction;
      } else if (prediction.status === 'failed' || prediction.status === 'canceled') {
        throw new Error(prediction.error || `Prediction ${predictionId} ${prediction.status}`);
      }

      this.logger.debug(
        `Polling prediction ${predictionId}... status: ${prediction.status} (${i + 1}/${maxRetries})`,
      );

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    throw new Error(`Prediction ${predictionId} timed out after ${maxRetries * delayMs / 1000}s`);
  }

  /**
   * Run a model and get result (create + poll if needed)
   */
  private async runModel(
    modelVersion: string,
    input: Record<string, any>,
  ): Promise<any> {
    const prediction = await this.createPrediction(modelVersion, input);

    // If already completed (Prefer: wait worked)
    if (prediction.status === 'succeeded') {
      return prediction;
    }

    // Otherwise poll
    return this.pollPrediction(prediction.id);
  }

  /**
   * Extract result URL from prediction output
   */
  private extractResultUrl(output: any): string | undefined {
    if (typeof output === 'string') return output;
    if (Array.isArray(output) && output.length > 0) return output[0];
    if (output?.url) return output.url;
    return undefined;
  }

  // ==================== Image Generation ====================

  async generateImage(
    prompt: string,
    options?: ImageOptions,
  ): Promise<GenerationResult> {
    const model = options?.model || this.defaultModels['image'];
    this.logger.log(`Generating image with Replicate model: ${model}`);

    try {
      const input: Record<string, any> = {
        prompt,
        num_outputs: 1,
      };

      // Flux models use different params
      if (model.includes('flux')) {
        if (options?.aspectRatio) input.aspect_ratio = options.aspectRatio;
        if (options?.seed) input.seed = options.seed;
        if (options?.steps) input.num_inference_steps = options.steps;
      } else {
        // SDXL-style models
        if (options?.negativePrompt) input.negative_prompt = options.negativePrompt;
        if (options?.seed) input.seed = options.seed;
        if (options?.cfgScale) input.guidance_scale = options.cfgScale;
        if (options?.steps) input.num_inference_steps = options.steps;
        if (options?.aspectRatio) {
          const dims = this.getDimensionsFromRatio(options.aspectRatio);
          input.width = dims.width;
          input.height = dims.height;
        }
      }

      const prediction = await this.runModel(model, input);
      const resultUrl = this.extractResultUrl(prediction.output);

      return {
        id: prediction.id,
        status: 'completed',
        resultUrl,
        metadata: { provider: 'replicate', model, predictionId: prediction.id },
      };
    } catch (error: any) {
      this.logger.error(`Replicate image generation failed: ${error.message}`);
      throw error;
    }
  }

  // ==================== Video Generation ====================

  async generateVideo(
    prompt: string,
    options?: VideoOptions,
  ): Promise<GenerationResult> {
    const model = options?.model || this.defaultModels['video'];
    this.logger.log(`Generating video with Replicate model: ${model}`);

    try {
      const input: Record<string, any> = { prompt };

      if (options?.startImageUrl) input.image = options.startImageUrl;
      if (options?.duration) {
        const seconds = parseInt(options.duration.replace('s', ''));
        input.num_frames = Math.round(seconds * 24); // 24fps
      }
      if (options?.aspectRatio) input.aspect_ratio = options.aspectRatio;
      if (options?.resolution) input.resolution = options.resolution;

      const prediction = await this.runModel(model, input);
      const resultUrl = this.extractResultUrl(prediction.output);

      return {
        id: prediction.id,
        status: 'completed',
        resultUrl,
        metadata: { provider: 'replicate', model, predictionId: prediction.id },
      };
    } catch (error: any) {
      this.logger.error(`Replicate video generation failed: ${error.message}`);
      throw error;
    }
  }

  // ==================== Upscale ====================

  async upscaleImage(
    imageUrl: string,
    options?: UpscaleOptions,
  ): Promise<GenerationResult> {
    const model = this.defaultModels['upscale'];
    this.logger.log(`Upscaling image with Replicate`);

    try {
      const input: Record<string, any> = {
        image: imageUrl,
        scale: options?.scale || 2,
      };

      if (options?.prompt) input.face_enhance = true;

      const prediction = await this.runModel(model, input);
      const resultUrl = this.extractResultUrl(prediction.output);

      return {
        id: prediction.id,
        status: 'completed',
        resultUrl,
        metadata: { provider: 'replicate', scale: options?.scale || 2 },
      };
    } catch (error: any) {
      this.logger.error(`Replicate upscale failed: ${error.message}`);
      throw error;
    }
  }

  // ==================== Audio Generation ====================

  async generateAudio(
    prompt: string,
    type: 'music' | 'sfx' | 'voice',
    options?: AudioOptions,
  ): Promise<GenerationResult> {
    const model = options?.model || this.defaultModels['music'];
    this.logger.log(`Generating ${type} audio with Replicate`);

    try {
      const input: Record<string, any> = {
        prompt,
        duration: options?.duration || 10,
        model_version: 'stereo-large',
        output_format: options?.format || 'mp3',
      };

      // For SFX, use shorter duration
      if (type === 'sfx') {
        input.duration = options?.duration || 5;
      }

      const prediction = await this.runModel(model, input);
      const resultUrl = this.extractResultUrl(prediction.output);

      return {
        id: prediction.id,
        status: 'completed',
        resultUrl,
        metadata: { provider: 'replicate', model, type },
      };
    } catch (error: any) {
      this.logger.error(`Replicate ${type} generation failed: ${error.message}`);
      throw error;
    }
  }

  // ==================== Image Processing ====================

  async processImage(
    options: ImageProcessingOptions,
  ): Promise<GenerationResult> {
    const { type, imageUrl, prompt } = options;
    const model = this.defaultModels[type] || this.defaultModels['variations'];
    this.logger.log(`Processing image (${type}) with Replicate`);

    try {
      const input: Record<string, any> = { image: imageUrl };

      switch (type) {
        case 'bg-remove':
          // No extra params needed for rembg
          break;
        case 'sketch-to-image':
          input.prompt = prompt || 'High quality image';
          input.image = imageUrl;
          break;
        case 'variations':
          input.prompt = prompt || '';
          input.image = imageUrl;
          input.prompt_strength = options.strength || 0.6;
          break;
        case 'image-extend':
          input.prompt = prompt || '';
          input.image = imageUrl;
          break;
        default:
          input.prompt = prompt || type;
          break;
      }

      const prediction = await this.runModel(model, input);
      const resultUrl = this.extractResultUrl(prediction.output);

      return {
        id: prediction.id,
        status: 'completed',
        resultUrl,
        metadata: { provider: 'replicate', type, model },
      };
    } catch (error: any) {
      this.logger.error(`Replicate ${type} failed: ${error.message}`);
      throw error;
    }
  }

  // ==================== Prompt Enhancement ====================

  async enhancePrompt(prompt: string, style?: string): Promise<string> {
    // Use a fast text model for prompt enhancement
    try {
      const prediction = await this.runModel(
        'meta/meta-llama-3-8b-instruct',
        {
          prompt: `You are an expert prompt engineer for AI image generation. Enhance this prompt to be more detailed and visually descriptive. Style: ${style || 'photorealistic'}. Keep response under 200 words. Only output the enhanced prompt.\n\nOriginal prompt: ${prompt}\n\nEnhanced prompt:`,
          max_tokens: 300,
        },
      );

      const output = prediction.output;
      if (Array.isArray(output)) return output.join('').trim();
      if (typeof output === 'string') return output.trim();
      return prompt;
    } catch (error: any) {
      this.logger.warn(`Prompt enhancement failed, using original: ${error.message}`);
      return prompt;
    }
  }

  // ==================== Helpers ====================

  private getDimensionsFromRatio(ratio: string): { width: number; height: number } {
    const ratios: Record<string, { width: number; height: number }> = {
      '1:1': { width: 1024, height: 1024 },
      '4:3': { width: 1024, height: 768 },
      '3:4': { width: 768, height: 1024 },
      '16:9': { width: 1344, height: 768 },
      '9:16': { width: 768, height: 1344 },
      '3:2': { width: 1152, height: 768 },
      '2:3': { width: 768, height: 1152 },
    };
    return ratios[ratio] || { width: 1024, height: 1024 };
  }
}
