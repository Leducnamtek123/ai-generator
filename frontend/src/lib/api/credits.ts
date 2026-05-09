import { get } from '@/lib/api';

/**
 * Get the current user's credit balance
 */
export async function getCreditsBalance(): Promise<number> {
    return get<number>('/credits/balance');
}

/**
 * Get credit transaction history
 */
async function getCreditHistory(page = 1, limit = 10) {
    return get<unknown[]>(`/credits?page=${page}&limit=${limit}`);
}
