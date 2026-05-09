'use client';

import { useQuery } from '@tanstack/react-query';
import { siteConfigApi } from '@/services/siteConfigApi';

const SITE_CONFIG_KEYS = {
  all: ['site-config'] as const,
  detail: (key: string, locale: string) => [...SITE_CONFIG_KEYS.all, key, locale] as const,
  adminList: (key?: string, locale?: string) =>
    [...SITE_CONFIG_KEYS.all, 'admin', key ?? '', locale ?? ''] as const,
};

export function useSiteConfig(key: string, locale?: string) {
  return useQuery({
    queryKey: SITE_CONFIG_KEYS.detail(key, locale || 'en'),
    queryFn: () => siteConfigApi.getSiteConfig(key, locale),
    staleTime: 60 * 1000,
  });
}

function useAdminSiteConfigs(key?: string, locale?: string) {
  return useQuery({
    queryKey: SITE_CONFIG_KEYS.adminList(key, locale),
    queryFn: () => siteConfigApi.getAdminSiteConfigs({ key, locale }),
    staleTime: 30 * 1000,
  });
}
