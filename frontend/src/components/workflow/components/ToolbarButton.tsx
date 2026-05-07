'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ToolbarButtonProps {
    icon: React.ReactNode;
    label: string;
    onClick?: () => void;
    active?: boolean;
    disabled?: boolean;
    shortcut?: string;
    tooltipEnabled?: boolean;
}

export function ToolbarButton({ icon, label, onClick, active, disabled, tooltipEnabled = true }: ToolbarButtonProps) {
    return (
        <button
            type="button"
            aria-label={label}
            onClick={onClick}
            disabled={disabled}
            className={cn(
                "p-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-all relative group",
                active && "bg-accent text-foreground",
                disabled && "opacity-30 cursor-not-allowed hover:bg-transparent hover:text-muted-foreground"
            )}
        >
            {icon}

            {tooltipEnabled && (
                <span className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 bg-popover border border-border rounded-lg text-[11px] text-popover-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-xl">
                    {label}
                </span>
            )}

            {/* Active indicator */}
            {active && (
                <div className="absolute -left-0.5 top-1/2 -translate-y-1/2 w-1 h-4 bg-primary rounded-full" />
            )}
        </button>
    );
}
