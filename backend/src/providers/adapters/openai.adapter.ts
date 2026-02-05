import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import {
    AIProvider,
    GenerationResult,
    ImageOptions,
    VideoOptions,
    UpscaleOptions,
} from '../provider.interface';

const OPENAI_API_BASE = 'https://api.openai.com/v1';

/**
 * OpenAI Direct API Adapter (DALL-E 3, GPT-4 for prompts)
 */
@Injectable()
export class OpenAIAdapter implements AIProvider {
    readonly name = 'openai';
    private readonly logger = new Logger(OpenAIAdapter.name);

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
    ) { }

    private getApiKey(): string {
        const apiKey = this.configService.get<string>('providers.imageGeneration.openai.apiKey');
        if (!apiKey) {
            throw new Error('OPENAI_API_KEY is not configured');
        }
        return apiKey;
    }

    private getHeaders() {
        return {
            'Authorization': `Bearer ${this.getApiKey()}`,
            'Content-Type': 'application/json',
        };
    }

    async generateImage(prompt: string, options?: ImageOptions): Promise<GenerationResult> {
        try {
            const response = await this.httpService.axiosRef.post(
                `${OPENAI_API_BASE}/images/generations`,
                {
                    model: 'dall-e-3',
                    prompt,
                    size: this.getSizeFromRatio(options?.aspectRatio || '1:1'),
                    quality: options?.quality === '4k' ? 'hd' : 'standard',
                    n: 1,
                },
                { headers: this.getHeaders() },
            );

            const imageUrl = response.data?.data?.[0]?.url;
            this.logger.log(`DALL-E 3 image generated`);

            return {
                id: crypto.randomUUID(),
                status: 'completed',
                resultUrl: imageUrl,
                metadata: { provider: 'openai', model: 'dall-e-3' },
            };
        } catch (error) {
            this.logger.error('OpenAI image generation failed', error);
            throw error;
        }
    }

    async generateVideo(prompt: string, options?: VideoOptions): Promise<GenerationResult> {
        // Sora is not publicly available via API yet
        throw new Error('OpenAI Sora is not available via public API. Use n8n or Runway.');
    }

    async upscaleImage(imageUrl: string, options?: UpscaleOptions): Promise<GenerationResult> {
        // OpenAI doesn't have upscaling
        throw new Error('OpenAI does not support image upscaling. Use n8n or Replicate.');
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
                { headers: this.getHeaders() },
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
