import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '../config/config.type';
import { AIProvider, ProviderType, ProviderCapability } from './provider.interface';
import { ReplicateAdapter } from './adapters/replicate.adapter';
import { StabilityAdapter } from './adapters/stability.adapter';
import { OpenAIAdapter } from './adapters/openai.adapter';
import { LeonardoAdapter } from './adapters/leonardo.adapter';
import { RunwayAdapter } from './adapters/runway.adapter';
import { ElevenLabsAdapter } from './adapters/elevenlabs.adapter';
import { FalAdapter } from './adapters/fal.adapter';

/**
 * Provider Registry - Smart factory for selecting the right AI provider
 * Supports auto-fallback: if primary provider fails, try alternatives
 */
@Injectable()
export class ProviderRegistry {
  private readonly logger = new Logger(ProviderRegistry.name);
  private readonly providers = new Map<string, AIProvider>();

  constructor(
    private readonly configService: ConfigService<AllConfigType>,
    private readonly replicateAdapter: ReplicateAdapter,
    private readonly stabilityAdapter: StabilityAdapter,
    private readonly openaiAdapter: OpenAIAdapter,
    private readonly leonardoAdapter: LeonardoAdapter,
    private readonly runwayAdapter: RunwayAdapter,
    private readonly elevenlabsAdapter: ElevenLabsAdapter,
    private readonly falAdapter: FalAdapter,
  ) {
    this.providers.set('replicate', replicateAdapter);
    this.providers.set('stability', stabilityAdapter);
    this.providers.set('openai', openaiAdapter);
    this.providers.set('leonardo', leonardoAdapter);
    this.providers.set('runway', runwayAdapter);
    this.providers.set('elevenlabs', elevenlabsAdapter);
    this.providers.set('fal', falAdapter);

    this.logger.log(`Registered ${this.providers.size} AI providers: ${this.listProviders().join(', ')}`);
  }

  /**
   * Get the configured provider for image generation
   */
  getImageProvider(): AIProvider {
    const providerName =
      this.configService.get('providers.imageGeneration.provider', {
        infer: true,
      }) || 'replicate';
    return this.getProvider(providerName);
  }

  /**
   * Get the configured provider for video generation
   */
  getVideoProvider(): AIProvider {
    const providerName =
      this.configService.get('providers.videoGeneration.provider', {
        infer: true,
      }) || 'replicate';
    return this.getProvider(providerName);
  }

  /**
   * Get the configured provider for image upscaling
   */
  getUpscaleProvider(): AIProvider {
    const providerName =
      this.configService.get('providers.upscaler.provider', {
        infer: true,
      }) || 'replicate';
    return this.getProvider(providerName);
  }

  /**
   * Get the configured provider for prompt enhancement
   */
  getPromptEnhancerProvider(): AIProvider {
    const providerName =
      this.configService.get('providers.promptEnhancer.provider', {
        infer: true,
      }) || 'openai';
    return this.getProvider(providerName);
  }

  /**
   * Get the configured provider for audio generation
   */
  getAudioProvider(type: 'music' | 'sfx' | 'voice'): AIProvider {
    let providerName: string | undefined;

    switch (type) {
      case 'music':
        providerName = this.configService.get('providers.audio.musicProvider', { infer: true });
        break;
      case 'sfx':
        providerName = this.configService.get('providers.audio.sfxProvider', { infer: true });
        break;
      case 'voice':
        providerName = this.configService.get('providers.audio.voiceProvider', { infer: true });
        break;
    }

    // Smart defaults
    const defaults: Record<string, string> = {
      music: 'replicate',
      sfx: 'elevenlabs',
      voice: 'elevenlabs',
    };

    return this.getProvider(providerName || defaults[type]);
  }

  /**
   * Get the configured provider for image processing
   */
  getImageProcessingProvider(type: string): AIProvider {
    const providerName = this.configService.get(
      'providers.imageProcessing.provider',
      { infer: true },
    ) as string | undefined;
    return this.getProvider(providerName || 'replicate');
  }

  /**
   * Get a specific provider by name
   */
  getProvider(name: ProviderType | string): AIProvider {
    const provider = this.providers.get(name);
    if (!provider) {
      this.logger.warn(`Provider "${name}" not found, falling back to replicate`);
      return this.providers.get('replicate')!;
    }
    return provider;
  }

  /**
   * Find the best provider for a given capability
   * Tries configured provider first, then falls back to any provider that supports it
   */
  getProviderForCapability(capability: ProviderCapability): AIProvider | null {
    // First try: check all providers for capability support
    for (const [name, provider] of this.providers) {
      if (provider.supports(capability)) {
        this.logger.debug(`Provider "${name}" supports capability "${capability}"`);
        return provider;
      }
    }

    this.logger.warn(`No provider found for capability: ${capability}`);
    return null;
  }

  /**
   * Get all providers that support a given capability
   */
  getProvidersForCapability(capability: ProviderCapability): AIProvider[] {
    return Array.from(this.providers.values()).filter(p => p.supports(capability));
  }

  /**
   * Execute with fallback: try primary provider, then alternatives
   */
  async executeWithFallback<T>(
    capability: ProviderCapability,
    operation: (provider: AIProvider) => Promise<T>,
    preferredProvider?: string,
  ): Promise<T> {
    const providers = this.getProvidersForCapability(capability);

    // Put preferred provider first
    if (preferredProvider) {
      const idx = providers.findIndex(p => p.name === preferredProvider);
      if (idx > 0) {
        const [preferred] = providers.splice(idx, 1);
        providers.unshift(preferred);
      }
    }

    let lastError: Error | null = null;

    for (const provider of providers) {
      try {
        this.logger.debug(`Trying provider "${provider.name}" for ${capability}`);
        return await operation(provider);
      } catch (error: any) {
        this.logger.warn(`Provider "${provider.name}" failed for ${capability}: ${error.message}`);
        lastError = error;
      }
    }

    throw lastError || new Error(`No provider available for capability: ${capability}`);
  }

  /**
   * List all available providers
   */
  listProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Get provider info with capabilities
   */
  getProviderInfo(): Array<{ name: string; capabilities: ProviderCapability[] }> {
    return Array.from(this.providers.entries()).map(([name, provider]) => ({
      name,
      capabilities: provider.capabilities,
    }));
  }
}
