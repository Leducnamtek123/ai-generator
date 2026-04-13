import { create } from 'zustand';
import { get as apiGet, post as apiPost } from '@/lib/api';
import { toast } from 'sonner';

interface CreditState {
    balance: number | null;
    isLoading: boolean;
    error: string | null;

    fetchBalance: () => Promise<void>;
    topUp: (amount: number, paymentRef?: string) => Promise<boolean>;
    setBalance: (balance: number) => void;
}

export const useCreditStore = create<CreditState>((set) => ({
    balance: null,
    isLoading: false,
    error: null,

    fetchBalance: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await apiGet<{ balance: number }>('/credits/balance');
            const balance = typeof response === 'number' ? response : (response as any).balance;
            set({ balance: typeof balance === 'number' ? balance : 0, isLoading: false });
        } catch (error: any) {
            console.error('Failed to fetch credits', error);
            set({ error: error.message || 'Failed to fetch credits', isLoading: false });
        }
    },

    topUp: async (amount: number, paymentRef?: string) => {
        set({ isLoading: true, error: null });
        try {
            const result = await apiPost<{ success: boolean; added: number; balance: number }>('/credits/topup', {
                amount,
                paymentRef,
            });
            set({ balance: result.balance, isLoading: false });
            toast.success(`Added ${result.added} credits! Balance: ${result.balance}`);
            return true;
        } catch (error: any) {
            console.error('Failed to top up credits', error);
            const msg = error.message || 'Failed to add credits';
            set({ error: msg, isLoading: false });
            toast.error(msg);
            return false;
        }
    },

    setBalance: (balance) => set({ balance }),
}));
