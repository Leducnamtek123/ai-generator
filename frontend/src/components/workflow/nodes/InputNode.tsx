'use client';

import * as React from 'react';
import type { ChangeEvent } from 'react';
import { BaseNode } from './BaseNode';
import { Input } from '@/ui/input';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { useWorkflowStore } from '@/stores/workflow-store';

type LegacyHandleClick = (
    event: React.MouseEvent,
    handleId: string,
    handleType: 'source' | 'target',
) => void;

interface InputNodeProps {
    id: string;
    data: {
        label?: string;
        onHandleClick?: LegacyHandleClick;
    };
    selected?: boolean;
}

export function InputNode({ id, data, selected }: InputNodeProps) {
    const { deleteElements } = useReactFlow();
    const setNodes = useWorkflowStore((state) => state.setNodes);
    const flushWorkflowSave = useWorkflowStore((state) => state.flushWorkflowSave);

    const handleDelete = () => {
        deleteElements({ nodes: [{ id }] });
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setNodes((nodes) => nodes.map((node) =>
            node.id === id
                ? { ...node, data: { ...node.data, label: e.target.value } }
                : node
        ));
        void flushWorkflowSave();
    };

    return (
        <BaseNode id={id} title="Input Node" selected={selected} onDelete={handleDelete}>
            <div className="space-y-2">
                <label className="text-[10px] text-muted-foreground">Prompt / Input</label>
                <Input
                    placeholder="Enter prompt?"
                    value={data.label || ''}
                    onChange={handleChange}
                    className="h-8 border-border bg-background text-xs focus:ring-blue-500/50"
                />
            </div>
            <Handle
                type="source"
                position={Position.Right}
                id="output"
                onClick={(e) => data.onHandleClick?.(e, 'output', 'source')}
                className="!border-2 !border-background !bg-green-500 z-50 cursor-pointer hover:!bg-green-400"
            />
        </BaseNode>
    );
}
