import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import {
  SocialProvider,
  AuthTokenDetails,
  PostDetails,
  MediaContent,
  PostResponse,
  MetricsData,
} from '../social.provider.interface';
import { SocialAbstractBase, RefreshTokenError } from '../social-abstract.base';
import { buildSignedOAuthState } from '../../utils/oauth-state.helper';

/**
 * LinkedIn Provider.
 * Based on patterns from Postiz's LinkedinProvider:
 * - OAuth 2.0 Authorization Code flow
 * - Token refresh via /accessToken endpoint
 * - UGC Post API for content publishing
 * - Share Statistics API for analytics
 */
@Injectable()
export class LinkedinAdapter
  extends SocialAbstractBase
  implements SocialProvider
{
  readonly identifier = 'linkedin';
  readonly name = 'LinkedIn';
  readonly supportsTokenRefresh = true;
  readonly requiredScopes = ['openid', 'profile', 'w_member_social'];

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    super();
  }

  protected override handleErrors(
    body: string,
    status: number,
  ):
    | { type: 'refresh-token' | 'bad-body' | 'retry'; value: string }
    | undefined {
    if (body.includes('expired_token') || body.includes('invalid_token')) {
      return {
        type: 'refresh-token',
        value: 'LinkedIn token expired, please re-authenticate',
      };
    }
    if (body.includes('DUPLICATE_POST')) {
      return { type: 'bad-body', value: 'LinkedIn detected duplicate content' };
    }
    if (status === 429) {
      return { type: 'retry', value: 'LinkedIn rate limit hit' };
    }
    return undefined;
  }

  generateAuthUrl(extraParams: Record<string, string> = {}): Promise<{
    url: string;
    codeVerifier?: string;
    state: string;
  }> {
    const clientId = this.configService.getOrThrow<string>(
      'LINKEDIN_CLIENT_ID',
      {
        infer: true,
      },
    );
    const redirectUri = `${this.configService.get<string>('BACKEND_DOMAIN', {
      infer: true,
    })}/api/v1/social-hub/auth/linkedin/callback`;
    const secret = this.configService.getOrThrow('auth.secret', {
      infer: true,
    });
    const state = buildSignedOAuthState(secret, extraParams);

    return Promise.resolve({
      url:
        `https://www.linkedin.com/oauth/v2/authorization` +
        `?response_type=code` +
        `&client_id=${clientId}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&scope=${encodeURIComponent(this.requiredScopes.join(' '))}` +
        `&state=${state}`,
      state,
    });
  }

  async authenticate(
    code: string,
    _extraParams: Record<string, any> = {},
  ): Promise<AuthTokenDetails> {
    this.logger.log('Exchanging code for LinkedIn access token...');

    const clientId = this.configService.getOrThrow<string>(
      'LINKEDIN_CLIENT_ID',
      {
        infer: true,
      },
    );
    const clientSecret = this.configService.getOrThrow<string>(
      'LINKEDIN_CLIENT_SECRET',
      { infer: true },
    );
    const redirectUri = `${this.configService.get<string>('BACKEND_DOMAIN', {
      infer: true,
    })}/api/v1/social-hub/auth/linkedin/callback`;

    try {
      // Exchange code for token
      const tokenResponse = await this.fetchWithRetry(
        'https://www.linkedin.com/oauth/v2/accessToken',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: redirectUri,
            client_id: clientId,
            client_secret: clientSecret,
          }).toString(),
        },
        'token_exchange',
      );
      const tokenData = await tokenResponse.json();

      // Get user profile
      const profileResponse = await this.fetchWithRetry(
        'https://api.linkedin.com/v2/userinfo',
        {
          headers: { Authorization: `Bearer ${tokenData.access_token}` },
        },
        'user_profile',
      );
      const profile = await profileResponse.json();

      return {
        id: profile.sub,
        name: profile.name || `${profile.given_name} ${profile.family_name}`,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresIn: tokenData.expires_in || 5183999, // ~60 days
        picture: profile.picture || '',
        username: profile.email || '',
      };
    } catch (error) {
      if (error instanceof RefreshTokenError) throw error;
      this.logger.error('LinkedIn authentication failed:', error);
      throw new Error('LinkedIn authentication failed');
    }
  }

  async refreshToken(refreshTokenValue: string): Promise<AuthTokenDetails> {
    this.logger.log('Refreshing LinkedIn token...');

    const clientId = this.configService.getOrThrow<string>(
      'LINKEDIN_CLIENT_ID',
      {
        infer: true,
      },
    );
    const clientSecret = this.configService.getOrThrow<string>(
      'LINKEDIN_CLIENT_SECRET',
      { infer: true },
    );

    const response = await this.fetchWithRetry(
      'https://www.linkedin.com/oauth/v2/accessToken',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshTokenValue,
          client_id: clientId,
          client_secret: clientSecret,
        }).toString(),
      },
      'refresh_token',
    );
    const tokenData = await response.json();

    return {
      id: '',
      name: '',
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token || refreshTokenValue,
      expiresIn: tokenData.expires_in,
    };
  }

  async post(
    accessToken: string,
    details: PostDetails,
    platformId: string,
  ): Promise<PostResponse> {
    this.logger.log(`Publishing to LinkedIn for user ${platformId}...`);

    try {
      const postBody: any = {
        author: `urn:li:person:${platformId}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: details.message,
            },
            shareMediaCategory: details.media?.length ? 'IMAGE' : 'NONE',
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
        },
      };

      // Handle media if present
      if (details.media?.length) {
        const assets: string[] = [];
        for (const media of details.media) {
          try {
            const assetId = await this.uploadMedia(
              accessToken,
              media,
              platformId,
            );
            if (assetId) assets.push(assetId);
          } catch (err) {
            this.logger.error(
              `Failed to upload media to LinkedIn: ${err.message}`,
            );
          }
        }

        if (assets.length) {
          postBody.specificContent[
            'com.linkedin.ugc.ShareContent'
          ].shareMediaCategory = 'IMAGE';
          postBody.specificContent['com.linkedin.ugc.ShareContent'].media =
            assets.map((asset) => ({
              status: 'READY',
              description: { text: details.message.substring(0, 200) },
              media: asset,
              title: { text: 'Shared via AI Generator' },
            }));
        }
      }

      const response = await this.fetchWithRetry(
        'https://api.linkedin.com/v2/ugcPosts',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
            'X-Restli-Protocol-Version': '2.0.0',
          },
          body: JSON.stringify(postBody),
        },
        'publish_post',
      );

      const postId =
        response.headers.get('x-restli-id') || `li_post_${Date.now()}`;

      return {
        postId,
        releaseURL: `https://www.linkedin.com/feed/update/${postId}`,
        status: 'success',
      };
    } catch (error) {
      this.logger.error('LinkedIn post failed:', error);
      return {
        postId: '',
        releaseURL: '',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  getInteractions(_accessToken: string, _platformId: string): Promise<any[]> {
    // LinkedIn API has limited interaction endpoints
    // Social Actions API for comments on posts
    return Promise.resolve([]);
  }

  async getMetrics(
    accessToken: string,
    externalId: string,
  ): Promise<MetricsData> {
    this.logger.log(`Fetching metrics for LinkedIn post ${externalId}...`);

    try {
      const response = await this.fetchWithRetry(
        `https://api.linkedin.com/v2/socialActions/${encodeURIComponent(externalId)}` +
          `?fields=likes($count),comments($count)`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'X-Restli-Protocol-Version': '2.0.0',
          },
        },
        'post_metrics',
      );
      const data = await response.json();

      return {
        likes: data.likes?.$count || 0,
        comments: data.comments?.$count || 0,
        shares: 0,
      };
    } catch (error) {
      this.logger.warn(`Failed to fetch LinkedIn metrics:`, error);
      return {
        likes: 0,
        comments: 0,
        shares: 0,
      };
    }
  }

  /**
   * Upload media to LinkedIn using the Assets API.
   * Steps: Register -> Binary Upload (PUT) -> Asset ID
   */
  private async uploadMedia(
    accessToken: string,
    media: MediaContent,
    platformId: string,
  ): Promise<string> {
    const isVideo = media.type === 'video';
    const recipe = isVideo
      ? 'urn:li:digitalmediaRecipe:feedshare-video'
      : 'urn:li:digitalmediaRecipe:feedshare-image';

    // 1. Register Upload
    const registerResponse = await this.fetchWithRetry(
      'https://api.linkedin.com/v2/assets?action=registerUpload',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          registerUploadRequest: {
            recipes: [recipe],
            owner: `urn:li:person:${platformId}`,
            serviceRelationships: [
              {
                relationshipType: 'OWNER',
                identifier: 'urn:li:userGeneratedContent',
              },
            ],
          },
        }),
      },
      'register_upload',
    );
    const registerData = await registerResponse.json();
    const uploadUrl =
      registerData.value.uploadMechanism[
        'com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'
      ].uploadUrl;
    const assetId = registerData.value.asset;

    // 2. Download Media binary
    const fileRes = await this.httpService.axiosRef.get(media.path, {
      responseType: 'arraybuffer',
    });
    const buffer = Buffer.from(fileRes.data);

    // 3. Binary Upload (PUT)
    await this.fetchWithRetry(
      uploadUrl,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': isVideo ? 'video/mp4' : 'image/jpeg',
        },
        body: buffer,
      },
      'binary_upload',
    );

    return assetId;
  }
}
