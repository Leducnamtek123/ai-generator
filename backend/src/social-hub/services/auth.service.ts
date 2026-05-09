import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SocialProviderRegistry } from '../providers/social-provider.registry';
import { ChannelsService } from './channels.service';
import crypto from 'crypto';
import { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import {
  buildSignedOAuthState,
  verifySignedOAuthState,
} from '../utils/oauth-state.helper';

@Injectable()
export class SocialAuthService {
  private readonly logger = new Logger(SocialAuthService.name);
  private readonly stateTtlMs = 10 * 60 * 1000;

  constructor(
    private configService: ConfigService,
    private readonly socialProviderRegistry: SocialProviderRegistry,
    private readonly channelsService: ChannelsService,
  ) {}

  async getAuthUrl(
    platform: string,
    user: AuthenticatedUser,
    extraParams: Record<string, string> = {},
  ): Promise<string> {
    const provider = this.socialProviderRegistry.getProvider(platform);
    const safeExtraParams: Record<string, string> = extraParams.appId
      ? {
          userId: String(user.id),
          appId: extraParams.appId,
          ...(extraParams.appSecret
            ? { appSecret: extraParams.appSecret }
            : {}),
        }
      : {
          userId: String(user.id),
        };

    // Fallback to manual URL construction
    const clientId =
      safeExtraParams.appId ||
      this.configService.get<string>(`${platform.toUpperCase()}_APP_ID`, {
        infer: true,
      }) ||
      this.configService.get<string>(`${platform.toUpperCase()}_CLIENT_ID`, {
        infer: true,
      });
    const redirectUri = `${this.configService.get<string>('BACKEND_DOMAIN', {
      infer: true,
    })}/api/v1/social-hub/auth/${platform}/callback`;

    this.logger.log(`Generating auth URL for ${platform}`);

    if (platform.toLowerCase() === 'linkedin' && provider.generateAuthUrl) {
      return (await provider.generateAuthUrl(safeExtraParams)).url;
    }

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
      case 'x': {
        const codeVerifier = crypto.randomBytes(32).toString('base64url');
        const codeChallenge = crypto
          .createHash('sha256')
          .update(codeVerifier)
          .digest('base64url');
        const xState = this.buildState({
          ...safeExtraParams,
          codeVerifier,
        });
        return `https://x.com/i/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=tweet.read%20tweet.write%20users.read%20offline.access&state=${xState}&code_challenge=${codeChallenge}&code_challenge_method=S256`;
      }
      case 'linkedin':
        return `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=openid%20profile%20w_member_social&state=${state}`;
      default:
        throw new Error(`Platform ${platform} not supported for OAuth yet.`);
    }
  }

  async handleCallback(
    platform: string,
    code: string,
    state?: string,
  ): Promise<any> {
    this.logger.log(`Handling callback for ${platform}`);

    let extraParams: Record<string, string> = {};
    let user: AuthenticatedUser | undefined;
    if (state) {
      try {
        extraParams = this.verifyState(state);
        const userIdValue = extraParams.userId;
        if (!userIdValue) {
          throw new Error('Missing OAuth user context');
        }
        const providerParams = { ...extraParams };
        delete providerParams.userId;
        extraParams = providerParams;
        user = {
          id: Number(userIdValue),
          email: '',
          role: 'user' as unknown as AuthenticatedUser['role'],
        } as AuthenticatedUser;
      } catch (e) {
        this.logger.warn(`Failed to parse state: ${e.message}`);
        throw new BadRequestException('Invalid OAuth state');
      }
    }

    if (!user) {
      throw new BadRequestException('Missing OAuth user context');
    }

    return this.channelsService.connect(user, platform, code, extraParams);
  }

  private buildState(extraParams: Record<string, string>): string {
    const secret = this.configService.getOrThrow('auth.secret', {
      infer: true,
    });
    return buildSignedOAuthState(secret, extraParams);
  }

  private verifyState(state: string): Record<string, string> {
    const secret = this.configService.getOrThrow('auth.secret', {
      infer: true,
    });
    return verifySignedOAuthState(secret, state, this.stateTtlMs);
  }
}
