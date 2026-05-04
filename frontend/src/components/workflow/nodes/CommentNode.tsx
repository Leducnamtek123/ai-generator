'use client';

import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { NodeProps } from '@xyflow/react';
import { MessageSquare, Trash2, MoreHorizontal, User, ChevronDown, ChevronUp, Pin, PinOff } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
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
    const [draftText, setDraftText] = useState(commentData.text || '');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const color = commentData.color || 'yellow';
    const styles = colorStyles[color];
    const isMinimized = commentData.isMinimized || false;
    const isPinned = commentData.isPinned || false;

    useEffect(() => {
        if (isEditing && textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.selectionStart = textareaRef.current.value.length;
        }
    }, [isEditing]);

    const handleBlur = useCallback(() => {
        setIsEditing(false);
        if (draftText !== commentData.text) {
            commentData.onTextChange?.(id, draftText);
        }
    }, [id, draftText, commentData]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            setIsEditing(false);
            setDraftText(commentData.text || '');
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            handleBlur();
        }
    }, [commentData.text, handleBlur]);

    const formatTimestamp = (timestamp?: number) => {
        if (!timestamp) return 'Just now';
        return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    };

    if (isMinimized) {
        return (
            <div
                className={cn(
                    "group relative cursor-pointer transition-all duration-200",
                    selected && "ring-2 ring-foreground/50"
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

                {draftText && (
                    <div className="absolute left-12 top-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                        <div className={cn(
                            "max-w-[200px] p-2 rounded-lg shadow-xl text-xs",
                            styles.bg,
                            styles.border,
                            "border backdrop-blur-md"
                        )}>
                            <p className="text-foreground/80 line-clamp-3">{draftText}</p>
                        </div>
                    </div>
                )}

                <button
                    type="button"
                    onClick={() => commentData.onToggleMinimize?.(id)}
                    className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-popover border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <ChevronDown className="w-3 h-3 text-muted-foreground" />
                </button>

                {isPinned && (
                    <div className="absolute -top-1 -right-1">
                        <Pin className="w-3 h-3 text-foreground" />
                    </div>
                )}
            </div>
        );
    }

    return (
        <div
            className={cn(
                "group rounded-xl shadow-xl transition-all duration-200 min-w-[240px] max-w-[320px]",
                styles.bg,
                styles.border,
                "border backdrop-blur-md",
                selected && "ring-2 ring-foreground/50 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
            )}
        >
            <div className={cn(
                "flex items-center justify-between px-3 py-2 rounded-t-xl",
                styles.header
            )}>
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-background/20 flex items-center justify-center">
                        <User className="w-3.5 h-3.5 text-foreground/80" />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-foreground/90">
                            {commentData.author || 'You'}
                        </p>
                        <p className="text-[10px] text-foreground/50">
                            {formatTimestamp(commentData.timestamp)}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        type="button"
                        onClick={() => commentData.onToggleMinimize?.(id)}
                        className="p-1 rounded hover:bg-background/10 transition-colors"
                    >
                        <ChevronUp className="w-4 h-4 text-foreground/60" />
                    </button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button type="button" className="p-1 rounded hover:bg-background/10 transition-colors">
                                <MoreHorizontal className="w-4 h-4 text-foreground/60" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 bg-popover border-border">
                            <DropdownMenuItem
                                onClick={() => commentData.onTogglePin?.(id)}
                                className="text-foreground/70 hover:text-foreground hover:bg-accent"
                            >
                                {isPinned ? (
                                    <><PinOff className="w-4 h-4 mr-2" /> Unpin</>
                                ) : (
                                    <><Pin className="w-4 h-4 mr-2" /> Pin</>
                                )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-border" />
                            <div className="px-2 py-1.5">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Color</p>
                                <div className="flex gap-1">
                                    {(Object.keys(colorStyles) as Array<keyof typeof colorStyles>).map((noteColor) => (
                                        <button
                                            type="button"
                                            key={noteColor}
                                            onClick={() => commentData.onColorChange?.(id, noteColor)}
                                            className={cn(
                                                "w-5 h-5 rounded-full border-2 transition-transform",
                                                colorStyles[noteColor].bg,
                                                color === noteColor ? "scale-110 border-white" : "border-transparent hover:scale-105"
                                            )}
                                        />
                                    ))}
                                </div>
                            </div>
                            <DropdownMenuSeparator className="bg-border" />
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

            <div className="p-3">
                {isEditing ? (
                    <textarea
                        ref={textareaRef}
                        value={draftText}
                        onChange={(e) => setDraftText(e.target.value)}
                        onBlur={handleBlur}
                        onKeyDown={handleKeyDown}
                        placeholder="Add a comment..."
                        className="w-full min-h-[60px] bg-transparent text-sm text-foreground/90 placeholder:text-foreground/30 resize-none focus:outline-none"
                    />
                ) : (
                    <div
                        onClick={() => setIsEditing(true)}
                        className="min-h-[40px] cursor-text"
                    >
                        {draftText ? (
                            <p className="text-sm text-foreground/80 whitespace-pre-wrap">{draftText}</p>
                        ) : (
                            <p className="text-sm text-muted-foreground italic">Click to add a comment...</p>
                        )}
                    </div>
                )}
            </div>

            {isPinned && (
                <div className="absolute -top-2 -right-2">
                    <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-lg">
                        <Pin className="w-3 h-3 text-black" />
                    </div>
                </div>
            )}

            {isEditing && (
                <div className="absolute bottom-1 right-2 text-[10px] text-muted-foreground">
                    Ctrl+Enter to save • Esc to cancel
                </div>
            )}
        </div>
    );
}

export const CommentNode = memo(CommentNodeComponent);
