export interface AuthTokenDetails {
  id: string;
  name: string;
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  picture?: string;
  username?: string;
}

export interface PostDetails {
  message: string;
  media?: MediaContent[];
  settings?: Record<string, any>;
}

export interface MediaContent {
  type: 'image' | 'video';
  path: string;
  alt?: string;
}

export interface PostResponse {
  postId: string;
  releaseURL: string;
  status: 'success' | 'failed';
  error?: string;
}

export interface MetricsData {
  likes: number;
  comments: number;
  shares: number;
  views?: number;
  impressions?: number;
  raw?: any;
}

export interface AnalyticsData {
  label: string;
  data: Array<{ total: string; date: string }>;
  percentageChange: number;
}

/**
 * Main social provider interface.
 * Extended with token refresh, auth URL generation, and analytics 
 * patterns learned from Postiz-app & Chatwoot clones.
 */
export interface SocialProvider {
  identifier: string;
  name: string;

  /** Whether this provider supports automatic token refresh */
  supportsTokenRefresh?: boolean;

  /** Required OAuth scopes for this provider */
  requiredScopes?: string[];

  /** Exchange an OAuth code for access/refresh tokens */
  authenticate(code: string, codeVerifier?: string): Promise<AuthTokenDetails>;

  /** Refresh an expired access token. Returns new token details or throws. */
  refreshToken?(refreshToken: string): Promise<AuthTokenDetails>;

  /** Generate the OAuth authorization URL for this provider */
  generateAuthUrl?(): Promise<{ url: string; codeVerifier?: string; state: string }>;

  /** Publish a post to the social platform */
  post(
    accessToken: string,
    details: PostDetails,
    platformId: string,
  ): Promise<PostResponse>;

  /** Reply/comment on an existing post */
  comment?(
    accessToken: string,
    postId: string,
    details: PostDetails,
    platformId: string,
  ): Promise<PostResponse>;

  /** Fetch interactions (comments, likes, mentions) from the platform */
  getInteractions?(
    accessToken: string,
    platformId: string,
  ): Promise<any[]>;

  /** Fetch engagement metrics for a specific post */
  getMetrics?(
    accessToken: string,
    externalId: string,
  ): Promise<MetricsData>;

  /** Fetch channel-level analytics (impressions, followers, engagement over time) */
  getAnalytics?(
    accessToken: string,
    platformId: string,
    days: number,
  ): Promise<AnalyticsData[]>;

  /** Fetch per-post analytics */
  getPostAnalytics?(
    accessToken: string,
    externalPostId: string,
  ): Promise<AnalyticsData[]>;
}
