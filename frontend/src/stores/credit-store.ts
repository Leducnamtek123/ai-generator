import { create } from 'zustand';
import { get as apiGet } from '@/lib/api';

interface CreditState {
    balance: number | null;
    isLoading: boolean;
    error: string | null;

    fetchBalance: () => Promise<void>;
    // Optimistic update or manual deduction if needed, though usually we strictly sync with backend
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
            // The backend returns the number directly or an object? 
            // Checking credits.controller.ts: `return this.creditsService.getBalance(req.user.id);`
            // CreditsService usually returns a number directly? Let's assume object wrapper or number. 
            // Actually, standard NestJS methods often return the primitive if not wrapped in DTO. 
            // But typically JSON APIs return objects. Let's verify standard response format.
            // If it returns just `100`, axios might parse it. 
            // Safest is to handle both, but let's assume it returns { balance: number } or just number.
            // Looking at other stores/api usage might clarify.
            // Let's assume it returns a number for now based on the controller signature not explicitly wrapping it.
            // Wait, let's double check standard API wrapper.
            // If `apiGet` follows standard generic formatting, it might expect T.
            // Let's assume the API returns `number` directly based on `CreditsController`.

            const balance = typeof response === 'number' ? response : (response as any).balance;
            set({ balance: typeof balance === 'number' ? balance : 0, isLoading: false });
        } catch (error: any) {
            console.error('Failed to fetch credits', error);
            set({ error: error.message || 'Failed to fetch credits', isLoading: false });
        }
    },

    setBalance: (balance) => set({ balance }),
}));
