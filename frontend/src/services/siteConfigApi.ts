import { get, patch } from '@/lib/api';

export type SiteConfigEntry = {
  id: string;
  key: string;
  locale: string;
  value: Record<string, unknown>;
  description?: string | null;
  updatedById?: number | null;
  createdAt?: string;
  updatedAt?: string;
};

export type SiteConfigQuery = {
  key?: string;
  locale?: string;
};

export type UpsertSiteConfigRequest = {
  locale?: string;
  value: Record<string, unknown>;
  description?: string;
};

const buildQuery = (params: Record<string, unknown> = {}) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    query.set(key, String(value));
  });

  return query.toString();
};

export const siteConfigApi = {
  getSiteConfig: (key: string, locale?: string) =>
    get<SiteConfigEntry | null>(`/site-config/${key}${locale ? `?locale=${encodeURIComponent(locale)}` : ''}`),
  listSiteConfigs: (query: SiteConfigQuery = {}) =>
    get<SiteConfigEntry[]>(`/site-config?${buildQuery(query)}`),
  getAdminSiteConfigs: (query: SiteConfigQuery = {}) =>
    get<SiteConfigEntry[]>(`/admin/site-configs?${buildQuery(query)}`),
  upsertAdminSiteConfig: (key: string, payload: UpsertSiteConfigRequest) =>
    patch<SiteConfigEntry, UpsertSiteConfigRequest>(`/admin/site-configs/${key}`, payload),
};
