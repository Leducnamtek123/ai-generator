'use client';

import React, { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Palette } from 'lucide-react';
import { NodeToolbar } from '../NodeToolbar';
import { cn } from '@/lib/utils';
import { NodeStatus, NoteColor } from '../types';

interface StickyNoteNodeProps {
    id: string;
    data: {
        label?: string;
        content?: string;
        color?: NoteColor;
        status?: NodeStatus;
        onDelete?: (id: string) => void;
        onTextChange?: (id: string, text: string) => void;
        onColorChange?: (id: string, color: NoteColor) => void;
        onDuplicate?: () => void;
        onSettings?: () => void;
        onHandleClick?: (event: React.MouseEvent, handleId: string, handleType: 'source' | 'target') => void;
        isPreview?: boolean;
    };
    selected?: boolean;
}

const COLORS = {
    [NoteColor.YELLOW]: 'bg-yellow-200 text-yellow-900 border-yellow-300',
    [NoteColor.GREEN]: 'bg-green-200 text-green-900 border-green-300',
    [NoteColor.BLUE]: 'bg-blue-200 text-blue-900 border-blue-300',
    [NoteColor.PINK]: 'bg-pink-200 text-pink-900 border-pink-300',
    [NoteColor.PURPLE]: 'bg-purple-200 text-purple-900 border-purple-300',
};

export function StickyNoteNode({ id, data, selected }: StickyNoteNodeProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [draftContent, setDraftContent] = useState(data.content || '');
    const color = data.color || NoteColor.YELLOW;

    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setDraftContent(e.target.value);
        data.onTextChange?.(id, e.target.value);
    };

    const handleColorChange = (newColor: NoteColor) => {
        data.onColorChange?.(id, newColor);
    };

    return (
        <div className="relative group">
            {selected && !data.isPreview && (
                <NodeToolbar
                    nodeId={id}
                    onDelete={() => data.onDelete?.(id)}
                    onDuplicate={data.onDuplicate}
                />
            )}

            <div
                className={cn(
                    "relative shadow-xl transition-all duration-200",
                    data.isPreview ? "size-[100px] p-2" : "size-[240px] p-4",
                    COLORS[color],
                    "rotate-1 hover:rotate-0 hover:scale-[1.02] transform origin-center",
                    selected ? "ring-4 ring-blue-500/50 scale-[1.02] rotate-0 shadow-2xl" : "hover:shadow-2xl"
                )}
                style={{
                    boxShadow: '2px 4px 12px rgba(0,0,0,0.2)',
                    clipPath: 'polygon(0% 0%, 100% 0%, 100% 85%, 85% 100%, 0% 100%)'
                }}
            >
                <div
                    className="absolute bottom-0 right-0 size-[15%] bg-background/10"
                    style={{
                        clipPath: 'polygon(0% 0%, 100% 100%, 0% 100%)'
                    }}
                />
                <div
                    className="absolute bottom-0 right-0 size-[15%] bg-white/30"
                    style={{
                        clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%)'
                    }}
                />

                {!data.isPreview && (
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex rounded-full bg-background/10 p-1 backdrop-blur-sm">
                            {Object.values(NoteColor).map((noteColor) => (
                                <button
                                    key={noteColor}
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleColorChange(noteColor);
                                    }}
                                    className={cn(
                                        "mx-0.5 size-3 rounded-full border border-border/40",
                                        COLORS[noteColor].split(' ')[0],
                                        color === noteColor && "scale-125 ring-1 ring-foreground/30"
                                    )}
                                />
                            ))}
                        </div>
                    </div>
                )}

                <textarea
                    value={data.isPreview ? (data.content || '') : (isEditing ? draftContent : (data.content || ''))}
                    onChange={handleContentChange}
                    onFocus={() => setIsEditing(true)}
                    onBlur={() => setIsEditing(false)}
                    onClick={() => setIsEditing(true)}
                    placeholder="Add a note?"
                    className={cn(
                        "h-full w-full resize-none border-none bg-transparent font-handwriting focus:outline-none placeholder:text-foreground/40",
                        data.isPreview ? "text-[8px] pointer-events-none" : "text-lg leading-relaxed"
                    )}
                    style={{ fontFamily: '"Comic Sans MS", "Chalkboard SE", "Marker Felt", sans-serif' }}
                    readOnly={data.isPreview}
                />

                {!data.isPreview && (
                    <div className="absolute bottom-2 left-2 flex items-center gap-1 text-[10px] text-foreground/40 opacity-0 transition-opacity group-hover:opacity-100">
                        <Palette className="size-3" />
                        Sticky note
                    </div>
                )}
            </div>

            {!data.isPreview && (
                <Handle
                    type="source"
                    position={Position.Right}
                    id="reference-output"
                    onClick={(e) => data.onHandleClick?.(e, 'reference-output', 'source')}
                    className="!border-2 !border-background !bg-yellow-500 z-50 cursor-pointer hover:!bg-yellow-400"
                />
            )}
        </div>
    );
}
