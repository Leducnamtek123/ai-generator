'use client';

import * as React from 'react';
import type { ChangeEvent } from 'react';
import { BaseNode } from './BaseNode';
import { Input } from '@/ui/input';
import { useReactFlow } from '@xyflow/react';

export function InputNode({ id, data, selected }: any) {
    const { deleteElements, updateNodeData } = useReactFlow();

    const handleDelete = () => {
        deleteElements({ nodes: [{ id }] });
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        updateNodeData(id, { label: e.target.value });
    };

    return (
        <BaseNode id={id} title="Input Node" selected={selected} onDelete={handleDelete}>
            <div className="space-y-2">
                <label className="text-[10px] text-muted-foreground">Prompt / Input</label>
                <Input
                    placeholder="Enter prompt..."
                    value={data.label}
                    onChange={handleChange}
                    className="h-8 border-border bg-background text-xs focus:ring-blue-500/50"
                />
            </div>
        </BaseNode>
    );
}
