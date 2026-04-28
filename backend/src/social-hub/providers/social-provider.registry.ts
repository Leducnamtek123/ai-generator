import { Injectable, Logger } from '@nestjs/common';
import { SocialProvider } from './social.provider.interface';
import { FacebookAdapter } from './adapters/facebook.adapter';
import { XAdapter } from './adapters/x.adapter';
import { LinkedinAdapter } from './adapters/linkedin.adapter';

/**
 * Provider Registry.
 * Central registry for all social media platform adapters.
 * Inspired by Postiz's IntegrationManager pattern.
 */
@Injectable()
export class SocialProviderRegistry {
  private readonly logger = new Logger(SocialProviderRegistry.name);
  private readonly providers = new Map<string, SocialProvider>();

  constructor(
    private readonly facebookAdapter: FacebookAdapter,
    private readonly xAdapter: XAdapter,
    private readonly linkedinAdapter: LinkedinAdapter,
  ) {
    this.providers.set(facebookAdapter.identifier, facebookAdapter);
    this.providers.set(xAdapter.identifier, xAdapter);
    this.providers.set(linkedinAdapter.identifier, linkedinAdapter);
    this.logger.log(`Registered ${this.providers.size} Social Providers: ${Array.from(this.providers.keys()).join(', ')}`);
  }

  getProvider(platform: string): SocialProvider {
    const provider = this.providers.get(platform);
    if (!provider) {
      throw new Error(`Social Provider for platform "${platform}" not found. Available: ${this.listProviders().join(', ')}`);
    }
    return provider;
  }

  listProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Get all providers with their capabilities.
   * Inspired by Postiz's IntegrationManager.getAllIntegrations()
   */
  getAllProviderDetails(): Array<{
    identifier: string;
    name: string;
    supportsTokenRefresh: boolean;
    requiredScopes: string[];
  }> {
    return Array.from(this.providers.values()).map(p => ({
      identifier: p.identifier,
      name: p.name,
      supportsTokenRefresh: p.supportsTokenRefresh || false,
      requiredScopes: p.requiredScopes || [],
    }));
  }
}
