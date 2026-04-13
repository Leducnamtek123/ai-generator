import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import {
  BaseProvider,
  GenerationResult,
  ImageOptions,
  ProviderCapability,
} from '../provider.interface';

const OPENAI_API_BASE = 'https://api.openai.com/v1';

import { AllConfigType } from '../../config/config.type';

/**
 * OpenAI Direct API Adapter (DALL-E 3, GPT-4 for prompts)
 */
@Injectable()
export class OpenAIAdapter extends BaseProvider {
  readonly name = 'openai';
  readonly capabilities: ProviderCapability[] = [
    'image-generation',
    'prompt-enhance',
  ];

  private readonly logger = new Logger(OpenAIAdapter.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService<AllConfigType>,
  ) {
    super();
  }

  private getApiKey(): string {
    const apiKey = this.configService.get(
      'providers.openai.apiKey',
      { infer: true },
    ) as string | undefined;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
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
    try {
      const response = await this.httpService.axiosRef.post(
        `${OPENAI_API_BASE}/images/generations`,
        {
          model: options?.model || 'dall-e-3',
          prompt,
          size: this.getSizeFromRatio(options?.aspectRatio || '1:1'),
          quality: options?.quality === '4k' ? 'hd' : 'standard',
          n: 1,
        },
        { headers: this.getHeaders(), timeout: 120000 },
      );

      const imageUrl = response.data?.data?.[0]?.url;
      this.logger.log(`DALL-E 3 image generated`);

      return {
        id: crypto.randomUUID(),
        status: 'completed',
        resultUrl: imageUrl,
        metadata: { provider: 'openai', model: options?.model || 'dall-e-3' },
      };
    } catch (error) {
      this.logger.error('OpenAI image generation failed', error);
      throw error;
    }
  }

  async enhancePrompt(prompt: string, style?: string): Promise<string> {
    try {
      const response = await this.httpService.axiosRef.post(
        `${OPENAI_API_BASE}/chat/completions`,
        {
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are an expert prompt engineer for AI image generation. Enhance the user's prompt to be more detailed and visually descriptive. Style: ${style || 'photorealistic'}. Keep response under 200 words. Only output the enhanced prompt, nothing else.`,
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: 300,
        },
        { headers: this.getHeaders(), timeout: 30000 },
      );

      const enhanced = response.data?.choices?.[0]?.message?.content;
      return enhanced || prompt;
    } catch (error) {
      this.logger.error('OpenAI prompt enhancement failed', error);
      return prompt; // Fallback to original
    }
  }

  private getSizeFromRatio(ratio: string): string {
    const sizes: Record<string, string> = {
      '1:1': '1024x1024',
      '16:9': '1792x1024',
      '9:16': '1024x1792',
    };
    return sizes[ratio] || '1024x1024';
  }
}
