'use client';

import * as React from 'react';
import { BaseNode } from './BaseNode';
import { Image as ImageIcon } from 'lucide-react';
import { useReactFlow } from '@xyflow/react';

export function OutputNode({ id, data, selected }: any) {
    const { deleteElements } = useReactFlow();

    const handleDelete = () => {
        deleteElements({ nodes: [{ id }] });
    };

    return (
        <BaseNode id={id} title="Output Node" selected={selected} onDelete={handleDelete}>
            <div className="flex aspect-video w-full flex-col items-center justify-center rounded-lg border border-dashed border-border bg-accent/5">
                {data.previewUrl ? (
                    <img src={data.previewUrl} alt="Output" className="h-full w-full object-cover rounded-lg" />
                ) : (
                    <div className="flex flex-col items-center gap-2">
                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground">Waiting for preview...</span>
                    </div>
                )}
            </div>
        </BaseNode>
    );
}
