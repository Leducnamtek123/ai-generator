'use client';

import { useState, useEffect, useCallback } from 'react';
import { getCreditsBalance } from '@/lib/api/credits';

interface UseCreditsReturn {
    balance: number | null;
    isLoading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}

export function useCredits(): UseCreditsReturn {
    const [balance, setBalance] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchBalance = useCallback(async () => {
        let nextBalance: number | null = null;
        try {
            setIsLoading(true);
            setError(null);
            const data = await getCreditsBalance();
            nextBalance = data;
        } catch (err: unknown) {
            const maybeError = err as {
                response?: { data?: { message?: string } };
                message?: string;
            };
            const msg = maybeError?.response?.data?.message || maybeError?.message || 'Failed to fetch balance';
            setError(msg);
            nextBalance = 0;
        }
        setBalance(nextBalance);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        queueMicrotask(() => {
            void fetchBalance();
        });
    }, [fetchBalance]);

    return {
        balance,
        isLoading,
        error,
        refresh: fetchBalance,
    };
}
