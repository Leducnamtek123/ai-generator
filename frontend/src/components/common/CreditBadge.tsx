'use client';

import { Coins, Loader2 } from 'lucide-react';
import { useCredits } from '@/hooks/useCredits';
import { cn } from '@/lib/utils';

interface CreditBadgeProps {
    className?: string;
    showIcon?: boolean;
}

export function CreditBadge({ className, showIcon = true }: CreditBadgeProps) {
    const { balance, isLoading } = useCredits();

    const formatBalance = (num: number | null) => {
        if (num === null) return '---';
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toLocaleString();
    };

    return (
        <div
            className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pricing/10 border border-pricing/20',
                className
            )}
        >
            {showIcon && (
                <Coins className="w-4 h-4 text-pricing" />
            )}
            {isLoading ? (
                <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
            ) : (
                <span className="text-sm font-semibold text-pricing">
                    {formatBalance(balance)}
                </span>
            )}
        </div>
    );
}
