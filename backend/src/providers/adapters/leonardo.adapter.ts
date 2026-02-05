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
        private readonly configService: ConfigService,
    ) { }

    private getApiKey(): string {
        const apiKey = this.configService.get<string>('providers.imageGeneration.leonardo.apiKey');
        if (!apiKey) {
            throw new Error('LEONARDO_API_KEY is not configured');
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
        const modelId = this.configService.get<string>('providers.imageGeneration.leonardo.modelId') || 'phoenix';

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

            return {
                id: generationId,
                status: 'processing',
                metadata: { provider: 'leonardo', modelId },
            };
        } catch (error) {
            this.logger.error('Leonardo image generation failed', error);
            throw error;
        }
    }

    async generateVideo(prompt: string, options?: VideoOptions): Promise<GenerationResult> {
        // Leonardo doesn't support video, throw appropriate error
        throw new Error('Leonardo.AI does not support video generation. Use Runway or n8n.');
    }

    async upscaleImage(imageUrl: string, options?: UpscaleOptions): Promise<GenerationResult> {
        try {
            const response = await this.httpService.axiosRef.post(
                `${LEONARDO_API_BASE}/variations/upscale`,
                {
                    id: imageUrl, // Assuming imageUrl is actually the generation ID
                },
                { headers: this.getHeaders() },
            );

            return {
                id: response.data?.id || crypto.randomUUID(),
                status: 'processing',
                metadata: { provider: 'leonardo' },
            };
        } catch (error) {
            this.logger.error('Leonardo upscale failed', error);
            throw error;
        }
    }

    async enhancePrompt(prompt: string, style?: string): Promise<string> {
        // Leonardo doesn't have prompt enhancement, return as-is
        return prompt;
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
