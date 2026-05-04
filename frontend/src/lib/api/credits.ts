import { get } from '@/lib/api';

interface CreditsBalance {
    balance: number;
}

/**
 * Get the current user's credit balance
 */
export async function getCreditsBalance(): Promise<number> {
    return get<number>('/credits/balance');
}

/**
 * Get credit transaction history
 */
export async function getCreditHistory(page = 1, limit = 10) {
    return get<any[]>(`/credits?page=${page}&limit=${limit}`);
}
