import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '../../config/config.type';
import {
  AIProvider,
  GenerationResult,
  ImageOptions,
  VideoOptions,
  UpscaleOptions,
} from '../provider.interface';

const LEONARDO_API_BASE = 'https://cloud.leonardo.ai/api/rest/v1';

/**
 * Leonardo.AI Direct API Adapter
 */
@Injectable()
export class LeonardoAdapter implements AIProvider {
  readonly name = 'leonardo';
  private readonly logger = new Logger(LeonardoAdapter.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService<AllConfigType>,
  ) {}

  private getApiKey(): string {
    const apiKey = this.configService.get(
      'providers.imageGeneration.leonardo.apiKey',
      { infer: true },
    );
    if (!apiKey) {
      throw new Error('LEONARDO_API_KEY is not configured');
    }
    return apiKey;
  }

  private getHeaders() {
    return {
      Authorization: `Bearer ${this.getApiKey()}`,
      'Content-Type': 'application/json',
    };
  }

  async generateImage(
    prompt: string,
    options?: ImageOptions,
  ): Promise<GenerationResult> {
    const modelId =
      this.configService.get('providers.imageGeneration.leonardo.modelId', {
        infer: true,
      }) || 'phoenix';

    try {
      // Step 1: Create generation
      const response = await this.httpService.axiosRef.post(
        `${LEONARDO_API_BASE}/generations`,
        {
          prompt,
          modelId,
          width: this.getWidthFromRatio(options?.aspectRatio || '1:1'),
          height: this.getHeightFromRatio(options?.aspectRatio || '1:1'),
          negative_prompt: options?.negativePrompt,
          num_images: 1,
          seed: options?.seed,
        },
        { headers: this.getHeaders() },
      );

      const generationId = response.data?.sdGenerationJob?.generationId;
      this.logger.log(`Leonardo generation started: ${generationId}`);

      // Step 2: Poll for completion
      return await this.pollGenerationResult(generationId);
    } catch (error) {
      this.logger.error('Leonardo image generation failed', error);
      throw error;
    }
  }

  async generateVideo(
    _prompt: string,
    _options?: VideoOptions,
  ): Promise<GenerationResult> {
    // Leonardo doesn't support video, throw appropriate error
    return Promise.reject(
      new Error(
        'Leonardo.AI does not support video generation. Use Runway or n8n.',
      ),
    );
  }

  async upscaleImage(
    imageUrl: string,
    _options?: UpscaleOptions,
  ): Promise<GenerationResult> {
    try {
      // Note: In Leonardo, upscaling usually requires a variation ID/Generation ID
      // If imageUrl is already a Leonardo URL, this might not work directly.
      // Assuming for now it's a generation ID or we have a way to handle it.
      const response = await this.httpService.axiosRef.post(
        `${LEONARDO_API_BASE}/variations/upscale`,
        {
          id: imageUrl,
        },
        { headers: this.getHeaders() },
      );

      const variationId = response.data?.id;
      return await this.pollVariationResult(variationId);
    } catch (error) {
      this.logger.error('Leonardo upscale failed', error);
      throw error;
    }
  }

  async enhancePrompt(prompt: string, _style?: string): Promise<string> {
    // Leonardo doesn't have prompt enhancement, return as-is
    return Promise.resolve(prompt);
  }

  private async pollGenerationResult(
    generationId: string,
  ): Promise<GenerationResult> {
    const maxRetries = 30;
    const delay = 3000; // 3 seconds

    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await this.httpService.axiosRef.get(
          `${LEONARDO_API_BASE}/generations/${generationId}`,
          { headers: this.getHeaders() },
        );

        const generation = response.data?.generations_by_pk;
        const status = generation?.status;

        if (status === 'COMPLETE') {
          const image = generation.generated_images?.[0];
          if (image) {
            return {
              id: generationId,
              status: 'completed',
              resultUrl: image.url,
              metadata: { provider: 'leonardo', modelId: generation.modelId },
            };
          }
        } else if (status === 'FAILED') {
          throw new Error('Leonardo generation failed');
        }

        this.logger.debug(
          `Polling Leonardo generation ${generationId}... status: ${status}`,
        );
      } catch (error) {
        this.logger.warn(`Polling error for ${generationId}: ${error.message}`);
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    throw new Error(`Leonardo generation ${generationId} timed out`);
  }

  private async pollVariationResult(
    variationId: string,
  ): Promise<GenerationResult> {
    const maxRetries = 30;
    const delay = 3000;

    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await this.httpService.axiosRef.get(
          `${LEONARDO_API_BASE}/variations/${variationId}`,
          { headers: this.getHeaders() },
        );

        const variation = response.data?.generated_variations_by_pk;
        const status = variation?.status;

        if (status === 'COMPLETE') {
          return {
            id: variationId,
            status: 'completed',
            resultUrl: variation.url,
            metadata: { provider: 'leonardo' },
          };
        } else if (status === 'FAILED') {
          throw new Error('Leonardo variation failed');
        }
      } catch (error) {
        this.logger.warn(
          `Polling error for variation ${variationId}: ${error.message}`,
        );
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    throw new Error(`Leonardo variation ${variationId} timed out`);
  }

  private getWidthFromRatio(ratio: string): number {
    const ratios: Record<string, number> = {
      '1:1': 1024,
      '4:3': 1024,
      '16:9': 1344,
      '9:16': 768,
    };
    return ratios[ratio] || 1024;
  }

  private getHeightFromRatio(ratio: string): number {
    const ratios: Record<string, number> = {
      '1:1': 1024,
      '4:3': 768,
      '16:9': 768,
      '9:16': 1344,
    };
    return ratios[ratio] || 1024;
  }
}
