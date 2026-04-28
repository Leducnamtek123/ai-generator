import { del as apiDel, get as apiGet, patch as apiPatch, post as apiPost } from '@/lib/api';

export type SocialPostStatus = 'draft' | 'scheduled' | 'published' | 'failed';

export interface SocialChannel {
  id: number;
  platform: string;
  platformId: string;
  name?: string | null;
  username?: string | null;
  picture?: string | null;
  expiresAt?: string | null;
  needsReauth?: boolean;
  createdAt: string;
}

export interface SocialProvider {
  identifier: string;
  name: string;
  supportsTokenRefresh: boolean;
}

export interface SocialPost {
  id: number;
  content: string;
  mediaUrls?: string[] | null;
  status: SocialPostStatus;
  scheduledAt?: string | null;
  publishedAt?: string | null;
  createdAt: string;
  error?: string | null;
  socialAccount?: SocialChannel | null;
}

export interface CreateSocialPostPayload {
  content: string;
  scheduledAt?: string | null;
  mediaUrls?: string[];
  socialAccountId?: number;
  socialAccountIds?: number[];
}

export interface SocialInteraction {
  id: number | string;
  platform: string;
  type: string;
  user: string;
  content: string;
  time: string;
  status?: string;
  isNew?: boolean;
}

export interface SocialAnalytics {
  totals: {
    likes: number;
    comments: number;
    shares: number;
  };
  chartData: Array<{
    name: string;
    engagement: number;
  }>;
}

export const socialHubApi = {
  getChannels: async () => apiGet<SocialChannel[]>('/social-hub/channels'),
  getProviders: async () => apiGet<SocialProvider[]>('/social-hub/providers'),
  getAuthUrl: async (platform: string) =>
    apiGet<{ url: string }>(`/social-hub/auth/${platform}`),
  disconnectChannel: async (accountId: number) =>
    apiDel(`/social-hub/channels/${accountId}`),

  getPosts: async () => apiGet<SocialPost[]>('/social-hub/posts'),
  createPost: async (payload: CreateSocialPostPayload) =>
    apiPost<SocialPost | { created: number; posts: SocialPost[] }, CreateSocialPostPayload>(
      '/social-hub/posts',
      payload,
    ),
  updatePost: async (id: number, payload: Partial<Pick<SocialPost, 'content' | 'mediaUrls'>>) =>
    apiPatch<SocialPost>(`/social-hub/posts/${id}`, payload),
  reschedulePost: async (id: number, scheduledAt: string) =>
    apiPatch<SocialPost>(`/social-hub/posts/${id}/reschedule`, { scheduledAt }),
  deletePost: async (id: number) => apiDel(`/social-hub/posts/${id}`),

  getInbox: async () => apiGet<SocialInteraction[]>('/social-hub/inbox'),
  getAnalytics: async () => apiGet<SocialAnalytics>('/social-hub/analytics'),
};
