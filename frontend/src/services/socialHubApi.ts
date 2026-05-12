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
  metadata?: Record<string, unknown> | null;
}

interface FacebookPendingPage {
  id: string;
  name: string;
  picture?: string | null;
}

export interface FacebookPendingConnection {
  id: string;
  platform: string;
  providerUserId: string;
  providerName: string;
  providerPicture?: string | null;
  expiresAt?: string | null;
  pages: FacebookPendingPage[];
  createdAt: string;
  updatedAt: string;
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

interface CreateSocialPostPayload {
  content: string;
  scheduledAt?: string | null;
  mediaUrls?: string[];
  socialAccountId?: number;
  socialAccountIds?: number[];
  saveDraft?: boolean;
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
  accountId?: number;
  canReply?: boolean;
  assignedTo?: string | null;
  labels?: string[];
  followUp?: boolean;
}

export interface SocialAnalytics {
  totals: {
    likes: number;
    comments: number;
    shares: number;
    views?: number;
    totalPosts?: number;
  };
  chartData: Array<{
    name: string;
    engagement: number;
    likes: number;
    comments: number;
    shares: number;
  }>;
  recentPosts?: Array<{
    id: number;
    content: string;
    platform?: string;
    publishedAt: string | null;
    likes: number;
    comments: number;
    shares: number;
    views: number;
  }>;
  platformBreakdown?: Record<
    string,
    {
      posts: number;
      likes: number;
      comments: number;
      shares: number;
    }
  >;
}

export const socialHubApi = {
  getChannels: async () => apiGet<SocialChannel[]>('/social-hub/channels'),
  getProviders: async () => apiGet<SocialProvider[]>('/social-hub/providers'),
  getFacebookPendingConnections: async () =>
    apiGet<FacebookPendingConnection[]>('/social-hub/channels/facebook/pending'),
  confirmFacebookPendingConnection: async (pendingId: string, selectedPageIds: string[]) =>
    apiPost(`/social-hub/channels/facebook/pending/${pendingId}/confirm`, {
      selectedPageIds,
    }),
  discardFacebookPendingConnection: async (pendingId: string) =>
    apiDel(`/social-hub/channels/facebook/pending/${pendingId}`),
  getAuthUrl: async (platform: string, params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return apiGet<{ url: string }>(`/social-hub/auth/${platform}${query}`);
  },
  disconnectChannel: async (accountId: number) =>
    apiDel(`/social-hub/channels/${accountId}`),

  getPosts: async () => apiGet<SocialPost[]>('/social-hub/posts'),
  createPost: async (payload: CreateSocialPostPayload) =>
    apiPost<SocialPost | { created: number; posts: SocialPost[] }, CreateSocialPostPayload>(
      '/social-hub/posts',
      payload,
    ),
  saveDraft: async (payload: CreateSocialPostPayload) =>
    apiPost<SocialPost | { created: number; posts: SocialPost[] }, CreateSocialPostPayload>(
      '/social-hub/posts',
      { ...payload, saveDraft: true },
    ),
  updatePost: async (id: number, payload: Partial<Pick<SocialPost, 'content' | 'mediaUrls'>>) =>
    apiPatch<SocialPost>(`/social-hub/posts/${id}`, payload),
  reschedulePost: async (id: number, scheduledAt: string) =>
    apiPatch<SocialPost>(`/social-hub/posts/${id}/reschedule`, { scheduledAt }),
  deletePost: async (id: number) => apiDel(`/social-hub/posts/${id}`),

  getInbox: async () => apiGet<SocialInteraction[]>('/social-hub/inbox'),
  replyToInboxInteraction: async (payload: {
    accountId: number;
    interactionId: string;
    message: string;
  }) => apiPost('/social-hub/inbox/reply', payload),
  markInboxInteractionHandled: async (payload: {
    accountId: number;
    interactionId: string;
  }) =>
    apiPatch('/social-hub/inbox/' + payload.accountId + '/' + payload.interactionId + '/handled', {}),
  updateInboxInteractionTriage: async (payload: {
    accountId: number;
    interactionId: string;
    assignedTo?: string | null;
    labels?: string[];
    followUp?: boolean;
  }) =>
    apiPatch('/social-hub/inbox/' + payload.accountId + '/' + payload.interactionId + '/triage', {
      assignedTo: payload.assignedTo,
      labels: payload.labels,
      followUp: payload.followUp,
    }),
  getAnalytics: async (days?: number) => {
    const query = days ? `?days=${days}` : '';
    return apiGet<SocialAnalytics>(`/social-hub/analytics${query}`);
  },
};
