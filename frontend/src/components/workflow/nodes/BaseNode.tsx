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
        <div className="relative group">
            {/* Minimal Title - Floating above */}
            {!isPreview && (
                <div className="absolute -top-7 left-0 flex items-center justify-between w-full px-1 z-10">
                    <div className="flex items-center gap-2">
                        {isEditing ? (
                            <input
                                ref={inputRef}
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                onBlur={handleTitleSubmit}
                                onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
                                className="bg-background border border-input rounded px-2 py-0.5 text-[10px] text-foreground outline-none w-32 focus:ring-1 focus:ring-ring"
                            />
                        ) : (
                            <span
                                onDoubleClick={handleStartEditing}
                                className={cn(
                                    "text-[10px] font-medium transition-colors cursor-text select-none",
                                    selected ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                                )}>{title}</span>
                        )}
                    </div>
                </div>
            )}

            {/* Top Toolbar (Appears on selection) */}
            {selected && !isPreview && headerActions && (
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-[60] animate-in fade-in zoom-in-95 duration-200">
                    <div className="bg-popover border border-border rounded-xl px-1.5 py-1 flex items-center gap-0.5 shadow-xl shadow-black/10">
                        {headerActions}
                    </div>
                </div>
            )}

            {/* Side Mini Icons */}
            {!isPreview && sideActions && (
                <div className="absolute top-0 -right-8 flex flex-col gap-1 z-10">
                    {sideActions}
                </div>
            )}

            {/* Main Content Card */}
            <Card
                className={cn(
                    "rounded-xl transition-all duration-200 overflow-hidden",
                    "bg-card shadow-sm relative",
                    selected && !isPreview ? "border-primary shadow-[0_0_0_4px_rgba(59,130,246,0.1)]" : "border-border/50",
                    !isPreview && "hover:border-border"
                )}
            >
                {children}
            </Card>
        </div>
    );
});

BaseNode.displayName = 'BaseNode';
