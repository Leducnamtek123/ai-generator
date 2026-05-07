import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SocialProviderRegistry } from '../providers/social-provider.registry';
import { ChannelsService } from './channels.service';
import { UserEntity } from '../../users/infrastructure/persistence/relational/entities/user.entity';
import crypto from 'crypto';

@Injectable()
export class SocialAuthService {
  private readonly logger = new Logger(SocialAuthService.name);
  private readonly stateTtlMs = 10 * 60 * 1000;

  constructor(
    private configService: ConfigService,
    private readonly socialProviderRegistry: SocialProviderRegistry,
    private readonly channelsService: ChannelsService,
  ) {}

  async getAuthUrl(platform: string, extraParams: Record<string, string> = {}): Promise<string> {
    this.socialProviderRegistry.getProvider(platform);
    const safeExtraParams: Record<string, string> = extraParams.appId
      ? { appId: extraParams.appId }
      : {};

    // Fallback to manual URL construction
    const clientId =
      safeExtraParams.appId ||
      this.configService.get(`${platform.toUpperCase()}_APP_ID`) ||
      this.configService.get(`${platform.toUpperCase()}_CLIENT_ID`);
    const redirectUri = `${this.configService.get('BACKEND_DOMAIN')}/api/v1/social-hub/auth/${platform}/callback`;

    this.logger.log(`Generating auth URL for ${platform}`);

    // Encode extra params in state
    const state = this.buildState(safeExtraParams);

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
        extraParams = this.verifyState(state);
      } catch (e) {
        this.logger.warn(`Failed to parse state: ${e.message}`);
        throw new BadRequestException('Invalid OAuth state');
      }
    }

    return this.channelsService.connect(user, platform, code, extraParams);
  }

  private buildState(extraParams: Record<string, string>): string {
    const issuedAt = Date.now();
    const payload = {
      extraParams,
      issuedAt,
    };

    const payloadString = JSON.stringify(payload);
    const secret = this.configService.getOrThrow('auth.secret', { infer: true });
    const signature = crypto
      .createHmac('sha256', secret)
      .update(payloadString)
      .digest('hex');

    return Buffer.from(
      JSON.stringify({
        payload,
        signature,
      }),
    ).toString('base64url');
  }

  private verifyState(state: string): Record<string, string> {
    const secret = this.configService.getOrThrow('auth.secret', { infer: true });
    const decoded = JSON.parse(Buffer.from(state, 'base64url').toString('utf8')) as {
      payload?: { extraParams?: Record<string, string>; issuedAt?: number };
      signature?: string;
    };

    if (!decoded.payload?.issuedAt || !decoded.signature) {
      throw new Error('Missing OAuth state signature');
    }

    if (Date.now() - decoded.payload.issuedAt > this.stateTtlMs) {
      throw new Error('OAuth state expired');
    }

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(decoded.payload))
      .digest('hex');

    if (expectedSignature !== decoded.signature) {
      throw new Error('OAuth state signature mismatch');
    }

    return decoded.payload.extraParams ?? {};
  }
}
