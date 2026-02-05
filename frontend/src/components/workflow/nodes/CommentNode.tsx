'use client';

import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { NodeProps, Handle, Position } from '@xyflow/react';
import { MessageSquare, Trash2, MoreHorizontal, User, ChevronDown, ChevronUp, Pin, PinOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

interface CommentData {
    text?: string;
    author?: string;
    timestamp?: number;
    color?: 'yellow' | 'blue' | 'green' | 'pink' | 'purple';
    isMinimized?: boolean;
    isPinned?: boolean;
    onDelete?: () => void;
    onTextChange?: (nodeId: string, text: string) => void;
    onColorChange?: (nodeId: string, color: string) => void;
    onToggleMinimize?: (nodeId: string) => void;
    onTogglePin?: (nodeId: string) => void;
}

const colorStyles = {
    yellow: {
        bg: 'bg-yellow-500/20',
        border: 'border-yellow-500/30',
        header: 'bg-yellow-500/30',
        text: 'text-yellow-200',
        icon: 'text-yellow-400'
    },
    blue: {
        bg: 'bg-blue-500/20',
        border: 'border-blue-500/30',
        header: 'bg-blue-500/30',
        text: 'text-blue-200',
        icon: 'text-blue-400'
    },
    green: {
        bg: 'bg-green-500/20',
        border: 'border-green-500/30',
        header: 'bg-green-500/30',
        text: 'text-green-200',
        icon: 'text-green-400'
    },
    pink: {
        bg: 'bg-pink-500/20',
        border: 'border-pink-500/30',
        header: 'bg-pink-500/30',
        text: 'text-pink-200',
        icon: 'text-pink-400'
    },
    purple: {
        bg: 'bg-purple-500/20',
        border: 'border-purple-500/30',
        header: 'bg-purple-500/30',
        text: 'text-purple-200',
        icon: 'text-purple-400'
    }
};

function CommentNodeComponent({ id, data, selected }: NodeProps) {
    const commentData = data as CommentData;
    const [isEditing, setIsEditing] = useState(false);
    const [localText, setLocalText] = useState(commentData.text || '');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const color = commentData.color || 'yellow';
    const styles = colorStyles[color];
    const isMinimized = commentData.isMinimized || false;
    const isPinned = commentData.isPinned || false;

    useEffect(() => {
        setLocalText(commentData.text || '');
    }, [commentData.text]);

    useEffect(() => {
        if (isEditing && textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.selectionStart = textareaRef.current.value.length;
        }
    }, [isEditing]);

    const handleBlur = useCallback(() => {
        setIsEditing(false);
        if (localText !== commentData.text) {
            commentData.onTextChange?.(id, localText);
        }
    }, [id, localText, commentData]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            setIsEditing(false);
            setLocalText(commentData.text || '');
        }
        // Ctrl/Cmd + Enter to save
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            handleBlur();
        }
    }, [commentData.text, handleBlur]);

    const formatTimestamp = (timestamp?: number) => {
        if (!timestamp) return 'Just now';
        const diff = Date.now() - timestamp;
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    // Minimized view - just a small bubble
    if (isMinimized) {
        return (
            <div
                className={cn(
                    "group relative cursor-pointer transition-all duration-200",
                    selected && "ring-2 ring-white/50"
                )}
                onDoubleClick={() => commentData.onToggleMinimize?.(id)}
            >
                <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center shadow-lg",
                    styles.bg,
                    styles.border,
                    "border-2"
                )}>
                    <MessageSquare className={cn("w-5 h-5", styles.icon)} />
                </div>

                {/* Preview tooltip on hover */}
                {localText && (
                    <div className="absolute left-12 top-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                        <div className={cn(
                            "max-w-[200px] p-2 rounded-lg shadow-xl text-xs",
                            styles.bg,
                            styles.border,
                            "border backdrop-blur-md"
                        )}>
                            <p className="text-white/80 line-clamp-3">{localText}</p>
                        </div>
                    </div>
                )}

                {/* Expand button */}
                <button
                    onClick={() => commentData.onToggleMinimize?.(id)}
                    className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#1A1B1F] border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <ChevronDown className="w-3 h-3 text-white/60" />
                </button>

                {isPinned && (
                    <div className="absolute -top-1 -right-1">
                        <Pin className="w-3 h-3 text-white" />
                    </div>
                )}
            </div>
        );
    }

    // Full comment view
    return (
        <div
            className={cn(
                "group rounded-xl shadow-xl transition-all duration-200 min-w-[240px] max-w-[320px]",
                styles.bg,
                styles.border,
                "border backdrop-blur-md",
                selected && "ring-2 ring-white/50 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
            )}
        >
            {/* Header */}
            <div className={cn(
                "flex items-center justify-between px-3 py-2 rounded-t-xl",
                styles.header
            )}>
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                        <User className="w-3.5 h-3.5 text-white/80" />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-white/90">
                            {commentData.author || 'You'}
                        </p>
                        <p className="text-[10px] text-white/50">
                            {formatTimestamp(commentData.timestamp)}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Minimize button */}
                    <button
                        onClick={() => commentData.onToggleMinimize?.(id)}
                        className="p-1 rounded hover:bg-white/10 transition-colors"
                    >
                        <ChevronUp className="w-4 h-4 text-white/60" />
                    </button>

                    {/* Menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="p-1 rounded hover:bg-white/10 transition-colors">
                                <MoreHorizontal className="w-4 h-4 text-white/60" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 bg-[#1A1B1F] border-white/10">
                            <DropdownMenuItem
                                onClick={() => commentData.onTogglePin?.(id)}
                                className="text-white/70 hover:text-white hover:bg-white/5"
                            >
                                {isPinned ? (
                                    <><PinOff className="w-4 h-4 mr-2" /> Unpin</>
                                ) : (
                                    <><Pin className="w-4 h-4 mr-2" /> Pin</>
                                )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-white/5" />
                            {/* Color options */}
                            <div className="px-2 py-1.5">
                                <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1.5">Color</p>
                                <div className="flex gap-1">
                                    {(Object.keys(colorStyles) as Array<keyof typeof colorStyles>).map((c) => (
                                        <button
                                            key={c}
                                            onClick={() => commentData.onColorChange?.(id, c)}
                                            className={cn(
                                                "w-5 h-5 rounded-full border-2 transition-transform",
                                                colorStyles[c].bg,
                                                color === c ? "scale-110 border-white" : "border-transparent hover:scale-105"
                                            )}
                                        />
                                    ))}
                                </div>
                            </div>
                            <DropdownMenuSeparator className="bg-white/5" />
                            <DropdownMenuItem
                                onClick={commentData.onDelete}
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            >
                                <Trash2 className="w-4 h-4 mr-2" /> Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Content */}
            <div className="p-3">
                {isEditing ? (
                    <textarea
                        ref={textareaRef}
                        value={localText}
                        onChange={(e) => setLocalText(e.target.value)}
                        onBlur={handleBlur}
                        onKeyDown={handleKeyDown}
                        placeholder="Add a comment..."
                        className="w-full min-h-[60px] bg-transparent text-sm text-white/90 placeholder:text-white/30 resize-none focus:outline-none"
                    />
                ) : (
                    <div
                        onClick={() => setIsEditing(true)}
                        className="min-h-[40px] cursor-text"
                    >
                        {localText ? (
                            <p className="text-sm text-white/80 whitespace-pre-wrap">{localText}</p>
                        ) : (
                            <p className="text-sm text-white/30 italic">Click to add a comment...</p>
                        )}
                    </div>
                )}
            </div>

            {/* Pinned indicator */}
            {isPinned && (
                <div className="absolute -top-2 -right-2">
                    <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-lg">
                        <Pin className="w-3 h-3 text-black" />
                    </div>
                </div>
            )}

            {/* Editing indicator */}
            {isEditing && (
                <div className="absolute bottom-1 right-2 text-[10px] text-white/30">
                    Ctrl+Enter to save • Esc to cancel
                </div>
            )}
        </div>
    );
}

export const CommentNode = memo(CommentNodeComponent);
