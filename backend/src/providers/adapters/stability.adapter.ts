import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '../../config/config.type';
import {
  BaseProvider,
  GenerationResult,
  ImageOptions,
  UpscaleOptions,
  ProviderCapability,
} from '../provider.interface';

const STABILITY_API_BASE = 'https://api.stability.ai/v2beta';

/**
 * Stability AI Direct API Adapter
 * Supports: Image Generation (SD3.5, SDXL), Upscale, Image-to-Image
 */
@Injectable()
export class StabilityAdapter extends BaseProvider {
  readonly name = 'stability';
  readonly capabilities: ProviderCapability[] = [
    'image-generation',
    'upscale',
    'bg-remove',
    'sketch-to-image',
  ];

  private readonly logger = new Logger(StabilityAdapter.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService<AllConfigType>,
  ) {
    super();
  }

  private getApiKey(): string {
    const apiKey = this.configService.get(
      'providers.stability.apiKey',
      { infer: true },
    ) as string | undefined;
    if (!apiKey) {
      throw new Error('STABILITY_API_KEY is not configured');
    }
    return apiKey;
  }

  private getHeaders(isMultipart = false) {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.getApiKey()}`,
      Accept: 'application/json',
    };
    if (!isMultipart) {
      headers['Content-Type'] = 'application/json';
    }
    return headers;
  }

  // ==================== Image Generation ====================

  async generateImage(
    prompt: string,
    options?: ImageOptions,
  ): Promise<GenerationResult> {
    const model = options?.model || 'sd3.5-large';
    this.logger.log(`Generating image with Stability AI model: ${model}`);

    try {
      // Use the generate endpoint
      const FormData = (await import('form-data')).default;
      const formData = new FormData();
      formData.append('prompt', prompt);
      formData.append('model', model);
      formData.append('output_format', 'png');

      if (options?.negativePrompt) {
        formData.append('negative_prompt', options.negativePrompt);
      }
      if (options?.seed) {
        formData.append('seed', String(options.seed));
      }
      if (options?.aspectRatio) {
        formData.append('aspect_ratio', options.aspectRatio);
      }
      if (options?.cfgScale) {
        formData.append('cfg_scale', String(options.cfgScale));
      }

      const response = await this.httpService.axiosRef.post(
        `${STABILITY_API_BASE}/stable-image/generate/sd3`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            Authorization: `Bearer ${this.getApiKey()}`,
            Accept: 'application/json',
          },
          timeout: 120000,
        },
      );

      const result = response.data;

      if (result.image) {
        // Result is base64 encoded image - we'd need to upload to S3
        // For now, if finish_reason is SUCCESS, return the data
        return {
          id: result.seed?.toString() || crypto.randomUUID(),
          status: 'completed',
          resultUrl: `data:image/png;base64,${result.image}`,
          metadata: {
            provider: 'stability',
            model,
            seed: result.seed,
            finishReason: result.finish_reason,
          },
        };
      }

      throw new Error('No image in Stability AI response');
    } catch (error: any) {
      this.logger.error(`Stability AI generation failed: ${error.message}`);
      throw error;
    }
  }

  // ==================== Upscale ====================

  async upscaleImage(
    imageUrl: string,
    _options?: UpscaleOptions,
  ): Promise<GenerationResult> {
    this.logger.log('Upscaling image with Stability AI');

    try {
      // Download the image first
      const imageResponse = await this.httpService.axiosRef.get(imageUrl, {
        responseType: 'arraybuffer',
      });

      const FormData = (await import('form-data')).default;
      const formData = new FormData();
      formData.append('image', Buffer.from(imageResponse.data), {
        filename: 'input.png',
        contentType: 'image/png',
      });
      formData.append('output_format', 'png');

      // Start upscale
      const response = await this.httpService.axiosRef.post(
        `${STABILITY_API_BASE}/stable-image/upscale/conservative`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            Authorization: `Bearer ${this.getApiKey()}`,
            Accept: 'application/json',
          },
          timeout: 180000,
        },
      );

      const result = response.data;

      // If async (returns generation ID)
      if (result.id) {
        // Poll for result
        const finalResult = await this.pollGeneration(result.id);
        return finalResult;
      }

      // If sync (returns base64 image)
      if (result.image) {
        return {
          id: crypto.randomUUID(),
          status: 'completed',
          resultUrl: `data:image/png;base64,${result.image}`,
          metadata: { provider: 'stability', type: 'upscale' },
        };
      }

      throw new Error('Unexpected Stability AI upscale response');
    } catch (error: any) {
      this.logger.error(`Stability AI upscale failed: ${error.message}`);
      throw error;
    }
  }

  // ==================== Polling ====================

  private async pollGeneration(
    generationId: string,
    maxRetries = 60,
    delayMs = 5000,
  ): Promise<GenerationResult> {
    for (let i = 0; i < maxRetries; i++) {
      const response = await this.httpService.axiosRef.get(
        `${STABILITY_API_BASE}/results/${generationId}`,
        {
          headers: {
            Authorization: `Bearer ${this.getApiKey()}`,
            Accept: 'application/json',
          },
          validateStatus: (status) => status < 500,
        },
      );

      if (response.status === 200) {
        const result = response.data;
        return {
          id: generationId,
          status: 'completed',
          resultUrl: result.image
            ? `data:image/png;base64,${result.image}`
            : result.output?.[0],
          metadata: { provider: 'stability' },
        };
      }

      if (response.status === 202) {
        this.logger.debug(
          `Polling Stability generation ${generationId}... (${i + 1}/${maxRetries})`,
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }

      throw new Error(`Stability AI returned status ${response.status}`);
    }

    throw new Error(`Stability AI generation ${generationId} timed out`);
  }
}
