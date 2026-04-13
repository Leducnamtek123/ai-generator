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
}

export function ToolbarButton({ icon, label, onClick, active, disabled }: ToolbarButtonProps) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={cn(
                "p-3 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-all relative group",
                active && "bg-white/10 text-white",
                disabled && "opacity-30 cursor-not-allowed hover:bg-transparent hover:text-white/50"
            )}
        >
            {icon}

            {/* Tooltip */}
            <span className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 bg-[#1A1B1F] border border-white/10 rounded-lg text-[11px] text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-xl">
                {label}
            </span>

            {/* Active indicator */}
            {active && (
                <div className="absolute -left-0.5 top-1/2 -translate-y-1/2 w-1 h-4 bg-blue-500 rounded-full" />
            )}
        </button>
    );
}
