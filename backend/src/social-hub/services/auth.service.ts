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

  async getAuthUrl(platform: string, extraParams: Record<string, string> = {}): Promise<string> {
    const provider = this.socialProviderRegistry.getProvider(platform);
    
    // Fallback to manual URL construction
    const clientId = extraParams.appId || this.configService.get(`${platform.toUpperCase()}_APP_ID`) || this.configService.get(`${platform.toUpperCase()}_CLIENT_ID`);
    const redirectUri = `${this.configService.get('BACKEND_DOMAIN')}/api/v1/social-hub/auth/${platform}/callback`;

    this.logger.log(`Generating auth URL for ${platform}`);

    // Encode extra params in state
    const state = Buffer.from(JSON.stringify(extraParams)).toString('base64');

    switch (platform.toLowerCase()) {
      case 'facebook':
        const scopes = [
          'pages_show_list',
          'pages_manage_posts',
          'pages_manage_engagement',
          'pages_read_engagement',
          'read_insights',
          'pages_messaging',
          'pages_manage_metadata',
        ].join(',');
        return `https://www.facebook.com/v20.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}&state=${state}`;
      case 'twitter':
      case 'x':
        return `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=tweet.read%20tweet.write%20users.read%20offline.access&state=${state}&code_challenge=challenge&code_challenge_method=plain`;
      case 'linkedin':
        return `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=openid%20profile%20w_member_social&state=${state}`;
      default:
        throw new Error(`Platform ${platform} not supported for OAuth yet.`);
    }
  }

  async handleCallback(user: UserEntity, platform: string, code: string, state?: string): Promise<any> {
    this.logger.log(`Handling callback for ${platform}`);
    
    let extraParams: Record<string, string> = {};
    if (state) {
      try {
        extraParams = JSON.parse(Buffer.from(state, 'base64').toString());
      } catch (e) {
        this.logger.warn(`Failed to parse state: ${e.message}`);
      }
    }

    return this.channelsService.connect(user, platform, code, extraParams);
  }
}
