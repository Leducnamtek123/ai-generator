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

/**
 * n8n Webhook Adapter
 * Sends generation requests to n8n webhooks for orchestration
 */
@Injectable()
export class N8nAdapter implements AIProvider {
  readonly name = 'n8n';
  private readonly logger = new Logger(N8nAdapter.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService<AllConfigType>,
  ) {}

  async generateImage(
    prompt: string,
    options?: ImageOptions,
  ): Promise<GenerationResult> {
    const webhookUrl = this.configService.get(
      'providers.imageGeneration.n8n.webhookUrl',
      { infer: true },
    );

    if (!webhookUrl) {
      throw new Error('N8N_IMAGE_WEBHOOK_URL is not configured');
    }

    try {
      const response = await this.httpService.axiosRef.post(webhookUrl, {
        type: 'image',
        prompt,
        model: options?.model || 'default',
        aspectRatio: options?.aspectRatio || '1:1',
        quality: options?.quality || 'hd',
        negativePrompt: options?.negativePrompt,
        callbackUrl: `${this.configService.get('app.backendDomain', { infer: true })}/api/v1/generations/callback`,
      });

      this.logger.log(
        `Image generation triggered via n8n: ${response.data?.executionId}`,
      );

      return {
        id: response.data?.executionId || crypto.randomUUID(),
        status: 'pending',
        metadata: { provider: 'n8n', webhookUrl },
      };
    } catch (error) {
      this.logger.error('Failed to trigger n8n image generation', error);
      throw error;
    }
  }

  async generateVideo(
    prompt: string,
    options?: VideoOptions,
  ): Promise<GenerationResult> {
    const webhookUrl = this.configService.get(
      'providers.videoGeneration.n8n.webhookUrl',
      { infer: true },
    );

    if (!webhookUrl) {
      throw new Error('N8N_VIDEO_WEBHOOK_URL is not configured');
    }

    try {
      const response = await this.httpService.axiosRef.post(webhookUrl, {
        type: 'video',
        prompt,
        model: options?.model || 'default',
        duration: options?.duration || '8s',
        aspectRatio: options?.aspectRatio || '16:9',
        startImageUrl: options?.startImageUrl,
        endImageUrl: options?.endImageUrl,
        callbackUrl: `${this.configService.get('app.backendDomain', { infer: true })}/api/v1/generations/callback`,
      });

      return {
        id: response.data?.executionId || crypto.randomUUID(),
        status: 'pending',
        metadata: { provider: 'n8n', webhookUrl },
      };
    } catch (error) {
      this.logger.error('Failed to trigger n8n video generation', error);
      throw error;
    }
  }

  async upscaleImage(
    imageUrl: string,
    options?: UpscaleOptions,
  ): Promise<GenerationResult> {
    const webhookUrl = this.configService.get(
      'providers.upscaler.n8n.webhookUrl',
      { infer: true },
    );

    if (!webhookUrl) {
      throw new Error('N8N_UPSCALE_WEBHOOK_URL is not configured');
    }

    try {
      const response = await this.httpService.axiosRef.post(webhookUrl, {
        type: 'upscale',
        imageUrl,
        scale: options?.scale || 2,
        enhanceMode: options?.enhanceMode || 'balanced',
        callbackUrl: `${this.configService.get('app.backendDomain', { infer: true })}/api/v1/generations/callback`,
      });

      return {
        id: response.data?.executionId || crypto.randomUUID(),
        status: 'pending',
        metadata: { provider: 'n8n', webhookUrl },
      };
    } catch (error) {
      this.logger.error('Failed to trigger n8n upscale', error);
      throw error;
    }
  }

  async enhancePrompt(prompt: string, style?: string): Promise<string> {
    const webhookUrl = this.configService.get(
      'providers.promptEnhancer.n8n.webhookUrl',
      { infer: true },
    );

    if (!webhookUrl) {
      throw new Error('N8N_PROMPT_WEBHOOK_URL is not configured');
    }

    try {
      const response = await this.httpService.axiosRef.post(webhookUrl, {
        type: 'enhance',
        prompt,
        style: style || 'photorealistic',
      });

      return response.data?.enhancedPrompt || prompt;
    } catch (error) {
      this.logger.error('Failed to enhance prompt via n8n', error);
      return prompt; // Fallback to original
    }
  }
}
