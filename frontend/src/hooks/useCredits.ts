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
        try {
            setIsLoading(true);
            setError(null);
            const data = await getCreditsBalance();
            setBalance(data);
        } catch (err: any) {
            const msg = err?.response?.data?.message || err?.message || 'Failed to fetch balance';
            setError(msg);
            setBalance(0);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBalance();
    }, [fetchBalance]);

    return {
        balance,
        isLoading,
        error,
        refresh: fetchBalance,
    };
}
