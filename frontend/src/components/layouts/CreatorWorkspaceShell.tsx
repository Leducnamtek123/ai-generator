'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type CreatorWorkspaceShellProps = {
    children: ReactNode;
    variant?: 'split' | 'stack';
    className?: string;
};

export function CreatorWorkspaceShell({
    children,
    variant = 'split',
    className,
}: CreatorWorkspaceShellProps) {
    return (
        <div
            className={cn(
                'h-full min-h-0 overflow-hidden bg-background text-foreground',
                variant === 'stack' ? 'flex flex-col' : 'flex items-stretch',
                className,
            )}
        >
            {children}
        </div>
    );
}
