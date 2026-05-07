'use client';

import { Coins, Loader2 } from 'lucide-react';
import { useCredits } from '@/hooks/useCredits';
import { cn } from '@/lib/utils';
import { formatCredits } from '@/lib/format-credits';

interface CreditBadgeProps {
    className?: string;
    showIcon?: boolean;
}

export function CreditBadge({ className, showIcon = true }: CreditBadgeProps) {
    const { balance, isLoading } = useCredits();

    return (
        <div
            className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-credits/10 border border-credits/20',
                className
            )}
        >
            {showIcon && (
                <Coins className="w-4 h-4 text-credits" />
            )}
            {isLoading ? (
                <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
            ) : (
                <span className="text-sm font-semibold text-credits">
                    {formatCredits(balance)}
                </span>
            )}
        </div>
    );
}
