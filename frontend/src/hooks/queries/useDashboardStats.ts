'use client';

import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/services/dashboardApi';

export const DASHBOARD_KEYS = {
  all: ['dashboard'] as const,
  stats: () => [...DASHBOARD_KEYS.all, 'stats'] as const,
};

export function useDashboardStats() {
  return useQuery({
    queryKey: DASHBOARD_KEYS.stats(),
    queryFn: () => dashboardApi.getStats(),
    staleTime: 60 * 1000, // 1 minute
  });
}
