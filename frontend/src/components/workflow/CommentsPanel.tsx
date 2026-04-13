'use client';

import React, { useState } from 'react';
import { X, Search, MessageSquare, Filter, MoreHorizontal, User, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';

interface CommentsPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CommentsPanel({ isOpen, onClose }: CommentsPanelProps) {
    const [activeTab, setActiveTab] = useState<'all' | 'open' | 'resolved'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    if (!isOpen) return null;

    return (
        <div className="absolute top-0 right-0 w-80 h-full bg-[#1A1B1F] border-l border-white/10 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="h-14 px-4 flex items-center justify-between border-b border-white/5 bg-[#0F1014]">
                <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-white/60" />
                    <h2 className="text-sm font-semibold text-white">Comments</h2>
                </div>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-white/5">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" />
                    <Input
                        placeholder="Search comments..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-black/20 border-white/5 pl-9 h-9 text-xs placeholder:text-white/20"
                    />
                </div>
            </div>

            {/* Tabs */}
            <div className="px-4 py-2 flex items-center gap-1 border-b border-white/5 bg-black/10">
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
            <div className="flex-1 overflow-y-auto bg-[#151619]/50 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
                    <MessageSquare className="w-6 h-6 text-white/20" />
                </div>
                <h3 className="text-sm font-medium text-white/80">No comments yet</h3>
                <p className="text-xs text-white/40 mt-1 max-w-[200px]">
                    Click anywhere on the canvas or an element to leave a comment.
                </p>
                <Button variant="outline" className="mt-6 border-white/10 text-xs h-8 hover:bg-white/5">
                    Add first comment
                </Button>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/5 bg-black/10 text-[10px] text-white/30 text-center">
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
                    ? "bg-white/10 text-white"
                    : "text-white/40 hover:text-white/60"
            )}
        >
            {label}
        </button>
    );
}
