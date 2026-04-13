import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '../../config/config.type';
import {
  BaseProvider,
  GenerationResult,
  ImageOptions,
  VideoOptions,
  ProviderCapability,
  ImageProcessingOptions,
} from '../provider.interface';

/**
 * Fal.ai API Adapter
 * Supports: Image Generation (Flux Pro, Flux Dev), Video, Image Processing
 * Fal.ai provides fast inference with queue system
 */
@Injectable()
export class FalAdapter extends BaseProvider {
  readonly name = 'fal';
  readonly capabilities: ProviderCapability[] = [
    'image-generation',
    'video-generation',
    'upscale',
    'bg-remove',
    'image-extend',
  ];

  private readonly logger = new Logger(FalAdapter.name);

  // Default model endpoints
  private readonly modelEndpoints: Record<string, string> = {
    'flux-pro': 'fal-ai/flux-pro/v1.1',
    'flux-dev': 'fal-ai/flux/dev',
    'flux-schnell': 'fal-ai/flux/schnell',
    'flux-realism': 'fal-ai/flux-realism',
    'video': 'fal-ai/minimax-video/video-01-live',
    'upscale': 'fal-ai/creative-upscaler',
    'bg-remove': 'fal-ai/birefnet/v2',
    'image-extend': 'fal-ai/flux-pro/v1.1/redux',
  };

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService<AllConfigType>,
  ) {
    super();
  }

  private getApiKey(): string {
    const apiKey = this.configService.get(
      'providers.fal.apiKey',
      { infer: true },
    ) as string | undefined;
    if (!apiKey) {
      throw new Error('FAL_API_KEY is not configured');
    }
    return apiKey;
  }

  private getHeaders() {
    return {
      Authorization: `Key ${this.getApiKey()}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Submit a request to Fal.ai queue
   */
  private async submitToQueue(
    endpoint: string,
    input: Record<string, any>,
  ): Promise<any> {
    const url = `https://queue.fal.run/${endpoint}`;

    const response = await this.httpService.axiosRef.post(url, input, {
      headers: this.getHeaders(),
      timeout: 30000,
    });

    return response.data;
  }

  /**
   * Check queue status and get result
   */
  private async pollQueue(
    endpoint: string,
    requestId: string,
    maxRetries = 120,
    delayMs = 3000,
  ): Promise<any> {
    const statusUrl = `https://queue.fal.run/${endpoint}/requests/${requestId}/status`;
    const resultUrl = `https://queue.fal.run/${endpoint}/requests/${requestId}`;

    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await this.httpService.axiosRef.get(statusUrl, {
          headers: this.getHeaders(),
        });

        const status = response.data?.status;

        if (status === 'COMPLETED') {
          // Fetch the result
          const resultResponse = await this.httpService.axiosRef.get(resultUrl, {
            headers: this.getHeaders(),
          });
          return resultResponse.data;
        }

        if (status === 'FAILED') {
          throw new Error(response.data?.error || 'Fal.ai request failed');
        }

        this.logger.debug(
          `Polling Fal.ai ${endpoint} request ${requestId}... status: ${status} (${i + 1}/${maxRetries})`,
        );
      } catch (error: any) {
        if (error.response?.status === 200 || !error.response) {
          throw error;
        }
      }

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    throw new Error(`Fal.ai request ${requestId} timed out`);
  }

  /**
   * Run synchronously using Fal.ai's sync endpoint
   */
  private async runSync(
    endpoint: string,
    input: Record<string, any>,
  ): Promise<any> {
    const url = `https://fal.run/${endpoint}`;

    const response = await this.httpService.axiosRef.post(url, input, {
      headers: this.getHeaders(),
      timeout: 300000, // 5 min for sync
    });

    return response.data;
  }

  // ==================== Image Generation ====================

  async generateImage(
    prompt: string,
    options?: ImageOptions,
  ): Promise<GenerationResult> {
    const modelKey = options?.model || 'flux-pro';
    const endpoint = this.modelEndpoints[modelKey] || this.modelEndpoints['flux-pro'];
    this.logger.log(`Generating image with Fal.ai: ${endpoint}`);

    try {
      const input: Record<string, any> = {
        prompt,
        num_images: 1,
      };

      if (options?.seed) input.seed = options.seed;
      if (options?.steps) input.num_inference_steps = options.steps;
      if (options?.negativePrompt) input.negative_prompt = options.negativePrompt;

      // Image size
      if (options?.aspectRatio) {
        const dims = this.getDimensionsFromRatio(options.aspectRatio);
        input.image_size = { width: dims.width, height: dims.height };
      }

      // Safety
      input.enable_safety_checker = false;

      const result = await this.runSync(endpoint, input);

      const imageUrl = result.images?.[0]?.url || result.image?.url;

      return {
        id: result.request_id || crypto.randomUUID(),
        status: 'completed',
        resultUrl: imageUrl,
        metadata: {
          provider: 'fal',
          model: modelKey,
          endpoint,
          seed: result.seed,
        },
      };
    } catch (error: any) {
      this.logger.error(`Fal.ai image generation failed: ${error.message}`);
      throw error;
    }
  }

  // ==================== Video Generation ====================

  async generateVideo(
    prompt: string,
    options?: VideoOptions,
  ): Promise<GenerationResult> {
    const endpoint = this.modelEndpoints['video'];
    this.logger.log(`Generating video with Fal.ai: ${endpoint}`);

    try {
      const input: Record<string, any> = {
        prompt,
      };

      if (options?.startImageUrl) input.image_url = options.startImageUrl;

      // Submit to queue (video is always async)
      const queueResponse = await this.submitToQueue(endpoint, input);
      const requestId = queueResponse.request_id;

      // Poll for result
      const result = await this.pollQueue(endpoint, requestId);
      const videoUrl = result.video?.url || result.output;

      return {
        id: requestId,
        status: 'completed',
        resultUrl: videoUrl,
        metadata: {
          provider: 'fal',
          model: 'minimax-video',
          endpoint,
        },
      };
    } catch (error: any) {
      this.logger.error(`Fal.ai video generation failed: ${error.message}`);
      throw error;
    }
  }

  // ==================== Image Processing ====================

  async processImage(
    options: ImageProcessingOptions,
  ): Promise<GenerationResult> {
    const { type, imageUrl, prompt } = options;
    const endpoint = this.modelEndpoints[type];

    if (!endpoint) {
      throw new Error(`Fal.ai does not support image processing type: ${type}`);
    }

    this.logger.log(`Processing image (${type}) with Fal.ai: ${endpoint}`);

    try {
      const input: Record<string, any> = {
        image_url: imageUrl,
      };

      if (prompt) input.prompt = prompt;

      const result = await this.runSync(endpoint, input);
      const resultUrl = result.image?.url || result.images?.[0]?.url || result.output;

      return {
        id: result.request_id || crypto.randomUUID(),
        status: 'completed',
        resultUrl,
        metadata: {
          provider: 'fal',
          type,
          endpoint,
        },
      };
    } catch (error: any) {
      this.logger.error(`Fal.ai ${type} failed: ${error.message}`);
      throw error;
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
