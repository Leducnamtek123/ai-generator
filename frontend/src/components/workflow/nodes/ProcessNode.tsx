'use client';

import * as React from 'react';
import { BaseNode } from './BaseNode';
import { Cpu } from 'lucide-react';
import { useReactFlow } from '@xyflow/react';
import { NodeStatus } from '../types';

export function ProcessNode({ id, data, selected }: any) {
    const { deleteElements } = useReactFlow();
    const status = data.status || NodeStatus.IDLE;

    const handleDelete = () => {
        deleteElements({ nodes: [{ id }] });
    };

    return (
        <BaseNode id={id} title="Process Node" selected={selected} status={status} onDelete={handleDelete}>
            <div className="flex flex-col items-center justify-center py-2">
                <div className="mb-2 flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-blue-400" />
                    <span className="text-sm font-medium">{data.label || 'AI Model'}</span>
                </div>

                {status === NodeStatus.PROCESSING && (
                    <div className="w-full space-y-1">
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-accent">
                            <div
                                className="h-full bg-blue-500 transition-all duration-300"
                                style={{ width: `${data.progress || 45}%` }}
                            />
                        </div>
                        <p className="text-center text-[10px] text-muted-foreground">Generating...</p>
                    </div>
                )}
            </div>
        </BaseNode>
    );
}
