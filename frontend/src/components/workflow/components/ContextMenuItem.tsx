'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import type { NodeConfig } from '../NodeConfig';

interface ContextMenuItemProps {
    node: NodeConfig;
    onClick: () => void;
}

/** Reusable menu item for context menus and handle menus */
export function ContextMenuItem({ node, onClick }: ContextMenuItemProps) {
    const Icon = node.icon;
    return (
        <button
            onClick={onClick}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors group text-left"
        >
            <div className={cn("p-1.5 rounded-md bg-white/5 group-hover:bg-white/10 transition-colors")}>
                <Icon className={cn("w-4 h-4", node.color)} />
            </div>
            <span className="text-sm font-medium text-white/90 group-hover:text-white">
                {node.label}
            </span>
        </button>
    );
}
