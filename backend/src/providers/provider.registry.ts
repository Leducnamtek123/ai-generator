import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AIProvider, ProviderType } from './provider.interface';
import { N8nAdapter } from './adapters/n8n.adapter';
import { LeonardoAdapter } from './adapters/leonardo.adapter';
import { OpenAIAdapter } from './adapters/openai.adapter';

/**
 * Provider Registry - Factory for getting the right AI provider
 */
@Injectable()
export class ProviderRegistry {
    private readonly logger = new Logger(ProviderRegistry.name);
    private readonly providers = new Map<string, AIProvider>();

    constructor(
        private readonly configService: ConfigService,
        private readonly n8nAdapter: N8nAdapter,
        private readonly leonardoAdapter: LeonardoAdapter,
        private readonly openaiAdapter: OpenAIAdapter,
    ) {
        this.providers.set('n8n', n8nAdapter);
        this.providers.set('leonardo', leonardoAdapter);
        this.providers.set('openai', openaiAdapter);
    }

    /**
     * Get the configured provider for image generation
     */
    getImageProvider(): AIProvider {
        const providerName = this.configService.get<string>('providers.imageGeneration.provider') || 'n8n';
        return this.getProvider(providerName);
    }

    /**
     * Get the configured provider for video generation
     */
    getVideoProvider(): AIProvider {
        const providerName = this.configService.get<string>('providers.videoGeneration.provider') || 'n8n';
        return this.getProvider(providerName);
    }

    /**
     * Get the configured provider for image upscaling
     */
    getUpscaleProvider(): AIProvider {
        const providerName = this.configService.get<string>('providers.upscaler.provider') || 'n8n';
        return this.getProvider(providerName);
    }

    /**
     * Get the configured provider for prompt enhancement
     */
    getPromptEnhancerProvider(): AIProvider {
        const providerName = this.configService.get<string>('providers.promptEnhancer.provider') || 'n8n';
        return this.getProvider(providerName);
    }

    /**
     * Get a specific provider by name
     */
    getProvider(name: ProviderType | string): AIProvider {
        const provider = this.providers.get(name);
        if (!provider) {
            this.logger.warn(`Provider "${name}" not found, falling back to n8n`);
            return this.providers.get('n8n')!;
        }
        return provider;
    }

    /**
     * List all available providers
     */
    listProviders(): string[] {
        return Array.from(this.providers.keys());
    }
}
