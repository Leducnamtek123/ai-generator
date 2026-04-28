import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SocialProviderRegistry } from '../providers/social-provider.registry';
import { ChannelsService } from './channels.service';
import { UserEntity } from '../../users/infrastructure/persistence/relational/entities/user.entity';

@Injectable()
export class SocialAuthService {
  private readonly logger = new Logger(SocialAuthService.name);

  constructor(
    private configService: ConfigService,
    private readonly socialProviderRegistry: SocialProviderRegistry,
    private readonly channelsService: ChannelsService,
  ) {}

  async getAuthUrl(platform: string): Promise<string> {
    // First try provider's own generateAuthUrl method (Postiz pattern)
    const provider = this.socialProviderRegistry.getProvider(platform);
    if (provider.generateAuthUrl) {
      const { url } = await provider.generateAuthUrl();
      return url;
    }

    // Fallback to manual URL construction
    const clientId = this.configService.get(`${platform.toUpperCase()}_CLIENT_ID`);
    const redirectUri = `${this.configService.get('BACKEND_DOMAIN')}/api/v1/social-hub/auth/${platform}/callback`;

    this.logger.log(`Generating auth URL for ${platform}`);

    switch (platform.toLowerCase()) {
      case 'facebook':
        return `https://www.facebook.com/v20.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=pages_show_list,pages_manage_posts,pages_manage_engagement,pages_read_engagement,read_insights`;
      case 'twitter':
        return `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=tweet.read%20tweet.write%20users.read%20offline.access&state=state&code_challenge=challenge&code_challenge_method=plain`;
      case 'linkedin':
        return `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=openid%20profile%20w_member_social`;
      default:
        throw new Error(`Platform ${platform} not supported for OAuth yet.`);
    }
  }

  async handleCallback(user: UserEntity, platform: string, code: string): Promise<any> {
    this.logger.log(`Handling real callback for ${platform} with code`);
    
    // Use the de-mocked registry and channels service
    return this.channelsService.connect(user, platform, code);
  }
}
