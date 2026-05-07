'use client';

import * as React from 'react';
import Image from 'next/image';
import { BaseNode } from './BaseNode';
import { Image as ImageIcon } from 'lucide-react';
import { Handle, Position, useReactFlow } from '@xyflow/react';

type LegacyHandleClick = (
    event: React.MouseEvent,
    handleId: string,
    handleType: 'source' | 'target',
) => void;

interface OutputNodeProps {
    id: string;
    data: {
        previewUrl?: string;
        inputUrl?: string;
        connectedImageUrl?: string;
        connectedVideoUrl?: string;
        connectedMediaUrl?: string;
        onHandleClick?: LegacyHandleClick;
    };
    selected?: boolean;
}

export function OutputNode({ id, data, selected }: OutputNodeProps) {
    const { deleteElements } = useReactFlow();
    const previewUrl = [
        data.previewUrl,
        data.inputUrl,
        data.connectedImageUrl,
        data.connectedVideoUrl,
        data.connectedMediaUrl,
    ].find((value): value is string => typeof value === 'string' && value.trim().length > 0);
    const isVideo = /\.(mp4|webm|mov|avi|mkv|m4v)$/i.test(previewUrl || '');

    const handleDelete = () => {
        deleteElements({ nodes: [{ id }] });
    };

    return (
        <BaseNode id={id} title="Output Node" selected={selected} onDelete={handleDelete}>
            <div className="flex aspect-video w-full flex-col items-center justify-center rounded-lg border border-dashed border-border bg-accent/5">
                {previewUrl ? (
                    <div className="relative h-full w-full">
                        {isVideo ? (
                            <video src={previewUrl} className="h-full w-full rounded-lg object-cover" muted loop playsInline />
                        ) : (
                            <Image src={previewUrl} alt="Output" fill className="object-cover rounded-lg" sizes="(max-width: 1024px) 100vw, 320px" />
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2">
                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground">Waiting for preview...</span>
                    </div>
                )}
            </div>
            <Handle
                type="target"
                position={Position.Left}
                id="reference-input"
                onClick={(e) => data.onHandleClick?.(e, 'reference-input', 'target')}
                className="!border-2 !border-background !bg-blue-500 z-50 cursor-pointer hover:!bg-blue-400"
            />
        </BaseNode>
    );
}
