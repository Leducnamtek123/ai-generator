import React, { useState } from 'react';
import { BaseNode } from './BaseNode';
import { Layers } from 'lucide-react';
import { NodeToolbar } from '../NodeToolbar';
import { cn } from '@/lib/utils';
import { NodeStatus } from '../types';

interface GroupNodeProps {
    id: string;
    data: {
        label?: string;
        width?: number;
        height?: number;
        status?: NodeStatus;
        onDelete?: (id: string) => void;
        onLabelChange?: (id: string, label: string) => void;
        onResize?: (id: string, width: number, height: number) => void;
        isPreview?: boolean;
    };
    selected?: boolean;
}

export function GroupNode({ id, data, selected }: GroupNodeProps) {
    const [label, setLabel] = useState(data.label || 'Group');

    // In React Flow, "group" nodes act as containers if set up in parent.
    // For now, this is a visual backdrop.

    const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLabel(e.target.value);
        data.onLabelChange?.(id, e.target.value);
    };

    return (
        <div className="relative group w-full h-full -z-10">
            {selected && !data.isPreview && (
                <NodeToolbar
                    nodeId={id}
                    onDelete={() => data.onDelete?.(id)}
                />
            )}

            <div
                className={cn(
                    "w-full h-full rounded-2xl border-2 border-dashed border-border bg-accent/5 transition-all text-foreground",
                    selected ? "border-primary/50 bg-accent/10" : "hover:border-border/80",
                    data.isPreview && "w-[200px] h-[150px]"
                )}
                style={{
                    minWidth: 300,
                    minHeight: 300
                }}
            >
                <div className="absolute top-4 left-4 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-muted-foreground" />
                    <input
                        value={label}
                        onChange={handleLabelChange}
                        className="bg-transparent border-none text-sm text-foreground/80 font-medium focus:outline-none focus:text-foreground"
                        placeholder="Group Name"
                        readOnly={data.isPreview}
                    />
                </div>
            </div>
        </div>
    );
}
