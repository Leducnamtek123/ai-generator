'use client';

import { useQuery } from '@tanstack/react-query';
import { orgApi } from '@/services/orgApi';

export const ORG_KEYS = {
  all: ['organizations'] as const,
  list: () => [...ORG_KEYS.all, 'list'] as const,
  detail: (slug: string) => [...ORG_KEYS.all, 'detail', slug] as const,
  membership: (slug: string) => [...ORG_KEYS.all, 'membership', slug] as const,
};

export function useOrganizations() {
  return useQuery({
    queryKey: ORG_KEYS.list(),
    queryFn: () => orgApi.list(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useOrganization(slug?: string) {
  return useQuery({
    queryKey: ORG_KEYS.detail(slug || ''),
    queryFn: () => orgApi.get(slug!),
    enabled: !!slug,
  });
}

export function useMembership(slug?: string) {
  return useQuery({
    queryKey: ORG_KEYS.membership(slug || ''),
    queryFn: () => orgApi.getMembership(slug!),
    enabled: !!slug,
  });
}
