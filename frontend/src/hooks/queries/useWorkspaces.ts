'use client';

import { useQuery } from '@tanstack/react-query';
import { workspaceApi } from '@/services/workspaceApi';

const WORKSPACE_KEYS = {
  all: ['workspaces'] as const,
  list: () => [...WORKSPACE_KEYS.all, 'list'] as const,
  detail: (slug: string) => [...WORKSPACE_KEYS.all, 'detail', slug] as const,
  membership: (slug: string) => [...WORKSPACE_KEYS.all, 'membership', slug] as const,
};

export function useWorkspaces() {
  return useQuery({
    queryKey: WORKSPACE_KEYS.list(),
    queryFn: () => workspaceApi.list(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

function useWorkspace(slug?: string) {
  return useQuery({
    queryKey: WORKSPACE_KEYS.detail(slug || ''),
    queryFn: () => workspaceApi.get(slug!),
    enabled: !!slug,
  });
}

function useWorkspaceMembership(slug?: string) {
  return useQuery({
    queryKey: WORKSPACE_KEYS.membership(slug || ''),
    queryFn: () => workspaceApi.getMembership(slug!),
    enabled: !!slug,
  });
}
