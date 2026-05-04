'use client';

import React, { useState } from 'react';
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
                    data.isPreview ? "w-[100px] h-[100px] p-2" : "w-[240px] h-[240px] p-4",
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
                    className="absolute bottom-0 right-0 w-[15%] h-[15%] bg-gray-950/10"
                    style={{
                        clipPath: 'polygon(0% 0%, 100% 100%, 0% 100%)'
                    }}
                />
                <div
                    className="absolute bottom-0 right-0 w-[15%] h-[15%] bg-white/30"
                    style={{
                        clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%)'
                    }}
                />

                {!data.isPreview && (
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex bg-gray-950/10 rounded-full p-1 backdrop-blur-sm">
                            {Object.values(NoteColor).map((noteColor) => (
                                <button
                                    key={noteColor}
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleColorChange(noteColor);
                                    }}
                                    className={cn(
                                        "w-3 h-3 rounded-full mx-0.5 border border-black/10",
                                        COLORS[noteColor].split(' ')[0],
                                        color === noteColor && "ring-1 ring-black/50 scale-125"
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
                    placeholder="Add a note..."
                    className={cn(
                        "w-full h-full bg-transparent border-none resize-none focus:outline-none placeholder:text-black/30 font-handwriting",
                        data.isPreview ? "text-[8px] pointer-events-none" : "text-lg leading-relaxed"
                    )}
                    style={{ fontFamily: '"Comic Sans MS", "Chalkboard SE", "Marker Felt", sans-serif' }}
                    readOnly={data.isPreview}
                />

                {!data.isPreview && (
                    <div className="absolute bottom-2 left-2 flex items-center gap-1 text-[10px] text-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Palette className="w-3 h-3" />
                        Sticky note
                    </div>
                )}
            </div>
        </div>
    );
}
