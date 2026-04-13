'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface VideoToolButtonProps {
    icon: React.ElementType;
    label?: string;
    active?: boolean;
    onClick?: () => void;
}

export function VideoToolButton({ icon: Icon, label, active, onClick }: VideoToolButtonProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all group",
                active ? "bg-white/10 text-white" : "hover:bg-white/5 text-white/40 hover:text-white"
            )}
        >
            <Icon className={cn("w-4 h-4 transition-transform group-hover:scale-110", active && "scale-110")} />
            {label && (
                <span className="text-[9px] font-medium tracking-tight h-0 opacity-0 group-hover:h-auto group-hover:opacity-100 transition-all">
                    {label}
                </span>
            )}
        </button>
    );
}
