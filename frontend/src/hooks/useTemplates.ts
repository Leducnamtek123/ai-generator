'use client';

import { useState } from 'react';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { templatesApi, Template, PaginatedResponse } from '@/lib/api/templates';

interface UseTemplatesParams {
    page?: number;
    limit?: number;
    type?: string;
    mode?: string;
}

export function useTemplates(initialParams: UseTemplatesParams = {}) {
    const [page, setPage] = useState(initialParams.page || 1);
    const [limit, setLimit] = useState(initialParams.limit || 20);

    const {
        data,
        isLoading,
        error,
        refetch
    } = useQuery<PaginatedResponse<Template>>({
        queryKey: ['templates', page, limit, initialParams.type, initialParams.mode],
        queryFn: () => templatesApi.getAll(page, limit, initialParams.type, initialParams.mode),
        placeholderData: (previousData) => previousData,
    });

    return {
        templates: data?.data || [],
        isLoading,
        error: error ? (error as Error).message : null,
        hasNextPage: data ? data.hasNextPage : false,
        refresh: refetch,
        page,
        setPage,
        setLimit,
    };
}

export function useInfiniteTemplates(initialParams: Omit<UseTemplatesParams, 'page'> = {}) {
    return useInfiniteQuery({
        queryKey: ['templates-infinite', initialParams],
        queryFn: async ({ pageParam = 1 }) => {
            const res = await templatesApi.getAll(
                pageParam as number,
                initialParams.limit || 20,
                initialParams.type,
                initialParams.mode
            );
            return res;
        },
        initialPageParam: 1,
        getNextPageParam: (lastPage, allPages) => {
            return lastPage.hasNextPage ? allPages.length + 1 : undefined;
        },
    });
}
