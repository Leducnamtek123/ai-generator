'use client';

import React from 'react';
import { BaseNode } from './BaseNode';
import { Handle, Position } from '@xyflow/react';
import { Loader2, Play, Wand2, ArrowRightLeft } from 'lucide-react';
import { NodeToolbar } from '../NodeToolbar';
import { cn } from '@/lib/utils';
import { ExecutionMode, NodeStatus, ToolType } from '../types';

interface ToolNodeProps {
    id: string;
    data: {
        label?: string;
        toolType?: ToolType;
        prompt?: string;
        primaryUrl?: string;
        secondaryUrl?: string;
        resultUrl?: string;
        resultText?: string;
        status?: NodeStatus;
        onDelete?: (id: string) => void;
        onRun?: (id: string, mode?: ExecutionMode) => void;
        onDuplicate?: () => void;
        onSettings?: () => void;
        isPreview?: boolean;
    };
    selected?: boolean;
}

export function ToolNode({ id, data, selected }: ToolNodeProps) {
    const toolLabel = data.toolType || ToolType.IMAGE_GEN;

    return (
        <>
            {selected && !data.isPreview && (
                <NodeToolbar
                    nodeId={id}
                    onRun={() => data.onRun?.(id, ExecutionMode.WORKFLOW)}
                    onRunLocal={() => data.onRun?.(id, ExecutionMode.LOCAL)}
                    runDisabled={data.status === NodeStatus.PROCESSING || data.status === NodeStatus.QUEUED}
                    onDelete={() => data.onDelete?.(id)}
                    onDuplicate={data.onDuplicate}
                    onSettings={data.onSettings}
                />
            )}

            <BaseNode
                id={id}
                title={data.label || 'Tool Node'}
                selected={selected}
                status={data.status}
                onDelete={data.onDelete}
                isPreview={data.isPreview}
            >
                <div className={cn('w-[320px] bg-card border-t border-border', data.isPreview && 'w-[120px]')}>
                    <div className="p-3 border-b border-border/60">
                        <div className="flex items-center gap-2">
                            <div className="rounded-md bg-fuchsia-500/15 p-2 text-fuchsia-300">
                                <Wand2 className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-foreground">Tool: {toolLabel}</p>
                                <p className="text-[10px] text-muted-foreground truncate">
                                    Runs via the real generation backend
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-3 space-y-2">
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Input</div>
                        <div className="rounded-lg border border-border bg-muted/40 p-2 text-xs text-foreground min-h-[56px]">
                            {data.prompt || data.primaryUrl || data.secondaryUrl || 'Configure the node in the properties panel.'}
                        </div>

                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Output</div>
                        <div className="rounded-lg border border-border bg-muted/40 p-2 text-xs text-foreground min-h-[56px]">
                            {data.status === NodeStatus.PROCESSING || data.status === NodeStatus.QUEUED ? (
                                <div className="flex items-center gap-2 text-fuchsia-400">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>{data.status === NodeStatus.QUEUED ? 'Queued...' : 'Processing...'}</span>
                                </div>
                            ) : data.resultText ? (
                                <p className="whitespace-pre-wrap">{data.resultText}</p>
                            ) : data.resultUrl ? (
                                <div className="flex items-center gap-2 text-sm">
                                    <ArrowRightLeft className="w-4 h-4 text-fuchsia-400" />
                                    <span className="truncate">{data.resultUrl}</span>
                                </div>
                            ) : (
                                <p className="text-muted-foreground italic">No result yet.</p>
                            )}
                        </div>
                    </div>
                </div>

                <Handle
                    type="target"
                    position={Position.Left}
                    id="input"
                    className="!h-3 !w-3 !border-2 !border-background !bg-fuchsia-500 z-50 transform -translate-x-1.5"
                />

                <Handle
                    type="source"
                    position={Position.Right}
                    id="output"
                    className="!h-3 !w-3 !border-2 !border-background !bg-fuchsia-500 z-50 transform translate-x-1.5"
                />
            </BaseNode>
        </>
    );
}
