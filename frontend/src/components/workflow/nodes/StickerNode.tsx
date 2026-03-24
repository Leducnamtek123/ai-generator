import React, { useState } from 'react';
import { BaseNode } from './BaseNode';
import { Smile } from 'lucide-react';
import { NodeToolbar } from '../NodeToolbar';
import { cn } from '@/lib/utils';
import { NodeStatus } from '../types';

interface StickerNodeProps {
    id: string;
    data: {
        label?: string;
        sticker?: string;
        status?: NodeStatus;
        onDelete?: (id: string) => void;
        onSelect?: (id: string, sticker: string) => void;
        onDuplicate?: () => void;
        isPreview?: boolean;
    };
    selected?: boolean;
}

const STICKERS = ['👍', '👎', '❤️', '🔥', '🎉', '🚀', '⚠️', '✅', '❌', '🤔', '💡', '💩'];

export function StickerNode({ id, data, selected }: StickerNodeProps) {
    const [sticker, setSticker] = useState(data.sticker || '👍');
    const [showPicker, setShowPicker] = useState(false);

    const handleSelect = (s: string) => {
        setSticker(s);
        setShowPicker(false);
        data.onSelect?.(id, s);
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
                    "relative flex items-center justify-center transition-transform cursor-pointer",
                    data.isPreview ? "w-12 h-12" : "w-24 h-24 hover:scale-110",
                    selected && "drop-shadow-[0_0_15px_#2563EB80]"
                )}
                onClick={() => !data.isPreview && setShowPicker(!showPicker)}
            >
                <div className={cn(
                    "text-8xl select-none filter drop-shadow-lg",
                    data.isPreview && "text-4xl"
                )}>
                    {sticker}
                </div>

                {!data.isPreview && showPicker && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-popover border border-border rounded-xl p-2 grid grid-cols-4 gap-2 shadow-2xl z-50 min-w-[160px]">
                        {STICKERS.map((s) => (
                            <button
                                key={s}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelect(s);
                                }}
                                className="w-8 h-8 flex items-center justify-center text-xl hover:bg-accent rounded-lg transition-colors"
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
