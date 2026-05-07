import { del as apiDel, get as apiGet, patch as apiPatch, post as apiPost } from '@/lib/api';
import { TemplateTypeEnum, type Template } from '@/lib/api/templates';

export interface CommunityMarketplaceListing extends Template {
  marketplace: {
    listed: boolean;
    priceCredits: number;
    platformFeeBps: number;
    platformFeeCredits: number;
    creatorPayoutCredits: number;
    tags: string[];
    sourceTemplateId?: string | null;
    listedAt?: string;
    featured?: boolean;
    purchasedFrom?: string | null;
    purchasedAt?: string | null;
    lastPurchasedBy?: string | null;
  };
}

export interface CommunityMarketplacePage {
  data: CommunityMarketplaceListing[];
  hasNextPage: boolean;
}

export interface CreateListingPayload {
  title: string;
  description?: string;
  thumbnail?: string;
  type: TemplateTypeEnum;
  content?: Record<string, unknown>;
  priceCredits: number;
  platformFeeBps?: number;
  tags?: string[];
  sourceTemplateId?: string;
  listed?: boolean;
}

export interface PurchaseSummary {
  marketplace: CommunityMarketplaceListing;
  purchasedTemplate: Template;
  balance: number;
  creatorBalance: number;
  platformBalance: number;
}

export interface MarketplaceFilters {
  page?: number;
  limit?: number;
  q?: string;
  type?: TemplateTypeEnum | 'all';
  authorId?: string;
}

const buildQuery = (filters: MarketplaceFilters = {}) => {
  const query = new URLSearchParams();
  query.set('page', String(filters.page ?? 1));
  query.set('limit', String(filters.limit ?? 12));

  if (filters.q?.trim()) query.set('q', filters.q.trim());
  if (filters.type && filters.type !== 'all') query.set('type', filters.type);
  if (filters.authorId) query.set('authorId', filters.authorId);

  return query.toString();
};

export const communityMarketplaceApi = {
  getListings: async (filters: MarketplaceFilters = {}) =>
    apiGet<CommunityMarketplacePage>(`/community-marketplace/listings?${buildQuery(filters)}`),
  getMyListings: async (filters: MarketplaceFilters = {}) =>
    apiGet<CommunityMarketplacePage>(`/community-marketplace/listings/me?${buildQuery(filters)}`),
  getListing: async (id: string) =>
    apiGet<CommunityMarketplaceListing>(`/community-marketplace/listings/${id}`),
  createListing: async (payload: CreateListingPayload) =>
    apiPost<CommunityMarketplaceListing, CreateListingPayload>(
      '/community-marketplace/listings',
      payload,
    ),
  updateListing: async (id: string, payload: Partial<CreateListingPayload>) =>
    apiPatch<CommunityMarketplaceListing, Partial<CreateListingPayload>>(
      `/community-marketplace/listings/${id}`,
      payload,
    ),
  deleteListing: async (id: string) =>
    apiDel(`/community-marketplace/listings/${id}`),
  purchaseListing: async (id: string) =>
    apiPost<PurchaseSummary>(`/community-marketplace/listings/${id}/purchase`, {}),
};
