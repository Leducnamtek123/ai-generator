import * as React from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
    variant?: 'default' | 'morphism';
}

export function GlassCard({ children, className, variant = 'default', ...props }: GlassCardProps) {
    const glassClass = variant === 'default' ? 'glass' : 'glass-morphism';

    return (
        <div
            className={cn(
                'rounded-lg p-6 transition-all duration-300',
                glassClass,
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}
