import React, { memo } from 'react';
import { cn } from '@/lib/utils';
import { Trash2 } from 'lucide-react';

interface BaseNodeProps {
    id: string;
    title: string;
    children: React.ReactNode;
    selected?: boolean;
    onDelete?: (id: string) => void;
    onTitleChange?: (newTitle: string) => void;
    status?: 'idle' | 'processing' | 'error' | 'success' | 'uploading';
    isPreview?: boolean;
}

export const BaseNode = memo(({ id, title, children, selected, onDelete, status, onTitleChange, isPreview }: BaseNodeProps) => {
    const [isEditing, setIsEditing] = React.useState(false);
    const [editTitle, setEditTitle] = React.useState(title);
    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        if (isEditing) inputRef.current?.focus();
    }, [isEditing]);

    const handleTitleSubmit = () => {
        setIsEditing(false);
        if (editTitle.trim() !== title && onTitleChange) {
            onTitleChange(editTitle);
        }
    };

    return (
        <div className="relative group">
            {/* Minimal Title - Floating above */}
            {!isPreview && (
                <div className="absolute -top-6 left-0 flex items-center gap-2 px-1 z-10">
                    {isEditing ? (
                        <input
                            ref={inputRef}
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onBlur={handleTitleSubmit}
                            onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
                            className="bg-black/50 border border-blue-500/50 rounded px-1 py-0.5 text-[10px] text-white outline-none w-32"
                        />
                    ) : (
                        <span
                            onDoubleClick={() => setIsEditing(true)}
                            className={cn(
                                "text-[10px] font-medium transition-colors cursor-text select-none",
                                selected ? "text-blue-400" : "text-white/50 group-hover:text-white/70"
                            )}>{title}</span>
                    )}
                </div>
            )}

            {/* Main Content Card */}
            <div
                className={cn(
                    "rounded-[18px] border-2 transition-all duration-200 overflow-hidden",
                    "bg-[#1A1B1F] shadow-xl",
                    selected && !isPreview ? "border-blue-500 shadow-[0_0_0_4px_rgba(59,130,246,0.1)]" : "border-transparent",
                    !isPreview && "hover:border-white/10"
                )}
            >
                {children}
            </div>

            {/* Selection Ring (Optional separate element if border isn't enough) */}
        </div>
    );
});

BaseNode.displayName = 'BaseNode';
