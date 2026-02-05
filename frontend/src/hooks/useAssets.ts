'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Asset, getAssets, GetAssetsParams, PaginatedResponse } from '@/lib/api/assets';

export function useAssets(initialParams: GetAssetsParams = {}) {
    const [params, setParams] = useState<GetAssetsParams>(initialParams);

    const {
        data,
        isLoading,
        error,
        refetch
    } = useQuery<PaginatedResponse<Asset>>({
        queryKey: ['assets', params],
        queryFn: () => getAssets(params),
        placeholderData: (previousData) => previousData,
    });

    return {
        assets: data?.data || [],
        isLoading,
        error: error ? (error as Error).message : null,
        hasNextPage: data ? data.hasNextPage : false,
        refresh: refetch,
        setFilter: (newParams: Partial<GetAssetsParams>) =>
            setParams(prev => ({ ...prev, ...newParams }))
    };
}
