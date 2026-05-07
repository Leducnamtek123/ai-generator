'use client';

import React, { memo } from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { NodeStatus } from '../types';

interface BaseNodeProps {
    id: string;
    title: string;
    children: React.ReactNode;
    selected?: boolean;
    onDelete?: (id: string) => void;
    onTitleChange?: (newTitle: string) => void;
    status?: NodeStatus;
    isPreview?: boolean;
    headerActions?: React.ReactNode;
    sideActions?: React.ReactNode;
}

export const BaseNode = memo(({
    title, children, selected,
    onTitleChange, isPreview, headerActions, sideActions
}: BaseNodeProps) => {
    const [isEditing, setIsEditing] = React.useState(false);
    const [editTitle, setEditTitle] = React.useState(title);
    const inputRef = React.useRef<HTMLInputElement>(null);

    const handleTitleSubmit = () => {
        setIsEditing(false);
        if (editTitle.trim() !== title && onTitleChange) {
            onTitleChange(editTitle);
        }
    };

    const handleStartEditing = () => {
        setIsEditing(true);
        queueMicrotask(() => {
            inputRef.current?.focus();
        });
    };

    return (
        <div className="relative isolate group">
            {!isPreview && (
                <div className="absolute -top-8 left-3 z-20 flex items-center gap-2 rounded-full border border-border/70 bg-[#0b0e13]/92 px-2.5 py-1 backdrop-blur-xl shadow-[0_10px_24px_rgba(0,0,0,0.32)]">
                    {isEditing ? (
                        <input
                            ref={inputRef}
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onBlur={handleTitleSubmit}
                            onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
                            className="h-6 w-32 rounded-full border border-input bg-background px-2 text-[10px] text-foreground outline-none focus:ring-1 focus:ring-ring"
                        />
                    ) : (
                        <span
                            onDoubleClick={handleStartEditing}
                            className={cn(
                                "cursor-text select-none text-[10px] font-semibold uppercase tracking-[0.08em] transition-colors",
                                selected ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                            )}
                        >
                            {title}
                        </span>
                    )}
                </div>
            )}

            {selected && !isPreview && headerActions && (
                <div className="absolute -top-12 left-1/2 z-[60] -translate-x-1/2">
                    <div className="flex items-center gap-0.5 rounded-lg border border-border/70 bg-[#0b0e13]/95 px-1.5 py-1 shadow-[0_16px_40px_rgba(0,0,0,0.38)] backdrop-blur-xl">
                        {headerActions}
                    </div>
                </div>
            )}

            {!isPreview && sideActions && (
                <div className="absolute top-1.5 -right-7 z-10 flex flex-col gap-1">
                    {sideActions}
                </div>
            )}

            <Card
                className={cn(
                    "relative overflow-visible rounded-xl border transition-all duration-200",
                    "bg-[#0b0e13] shadow-[0_18px_60px_rgba(0,0,0,0.35)] ring-1 ring-white/[0.03]",
                    selected && !isPreview
                        ? "border-primary/70 shadow-[0_0_0_1px_rgba(47,102,255,0.28),0_24px_60px_rgba(0,0,0,0.45)]"
                        : "border-border/55 hover:border-border/80",
                    !isPreview && "hover:shadow-[0_22px_70px_rgba(0,0,0,0.42)]"
                )}
            >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-white/[0.04] to-transparent" />
                <div className="relative">
                    {children}
                </div>
            </Card>
        </div>
    );
});

BaseNode.displayName = 'BaseNode';
