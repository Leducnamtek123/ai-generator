'use client';

import { useQuery } from '@tanstack/react-query';

import { getGenerationProviders, type GenerationProviderInfo } from '@/lib/api/generations';

export function useGenerationProviders(capability?: string) {
  const query = useQuery({
    queryKey: ['generation-providers'],
    queryFn: getGenerationProviders,
    staleTime: 5 * 60_000,
  });

  const providers = capability
    ? query.data?.filter((provider) => provider.capabilities.includes(capability)) ?? []
    : query.data ?? [];

  return {
    ...query,
    providers,
    allProviders: query.data ?? ([] as GenerationProviderInfo[]),
  };
}
