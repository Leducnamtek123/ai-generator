'use client';

import React, { useState } from 'react';
import { X, Search, MessageSquare, Filter, MoreHorizontal, User, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';

interface CommentsPanelProps {
    isOpen: boolean;
    onClose: () => void;
    onAddFirstComment: () => void;
}

export function CommentsPanel({ isOpen, onClose, onAddFirstComment }: CommentsPanelProps) {
    const [activeTab, setActiveTab] = useState<'all' | 'open' | 'resolved'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    if (!isOpen) return null;

    return (
        <div className="absolute top-0 right-0 z-50 flex h-full w-80 flex-col border-l border-border bg-card shadow-2xl animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="flex h-14 items-center justify-between border-b border-border bg-background/60 px-4">
                <div className="flex items-center gap-2">
                    <MessageSquare className="size-4 text-muted-foreground" />
                    <h2 className="text-sm font-semibold text-foreground">Comments</h2>
                </div>
                <button
                    onClick={onClose}
                    className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                    <X className="size-4" />
                </button>
            </div>

            {/* Search */}
            <div className="border-b border-border p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/50" />
                    <Input
                        placeholder="Search comments?"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-9 border-border bg-background pl-9 text-xs placeholder:text-muted-foreground/50"
                    />
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 border-b border-border bg-muted/30 px-4 py-2">
                <TabButton
                    label="All"
                    active={activeTab === 'all'}
                    onClick={() => setActiveTab('all')}
                />
                <TabButton
                    label="Open"
                    active={activeTab === 'open'}
                    onClick={() => setActiveTab('open')}
                />
                <TabButton
                    label="Resolved"
                    active={activeTab === 'resolved'}
                    onClick={() => setActiveTab('resolved')}
                />
            </div>

            {/* Content */}
            <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto bg-background/40 p-8 text-center">
                <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
                    <MessageSquare className="size-6 text-muted-foreground/40" />
                </div>
                <h3 className="text-sm font-medium text-foreground/80">No comments yet</h3>
                <p className="mt-1 max-w-[200px] text-xs text-muted-foreground">
                    Click anywhere on the canvas or an element to leave a comment.
                </p>
                <Button
                    variant="outline"
                    className="mt-6 h-8 border-border text-xs hover:bg-accent"
                    onClick={onAddFirstComment}
                >
                    Add first comment
                </Button>
            </div>

            {/* Footer */}
            <div className="border-t border-border bg-muted/30 p-4 text-center text-[10px] text-muted-foreground">
                Review all feedback in one place
            </div>
        </div>
    );
}

function TabButton({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "px-3 py-1 rounded-full text-[11px] font-medium transition-colors",
                active
                    ? "bg-primary/10 text-foreground"
                    : "text-muted-foreground hover:text-foreground"
            )}
        >
            {label}
        </button>
    );
}
