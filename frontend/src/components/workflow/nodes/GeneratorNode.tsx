'use client';

import React from 'react';
import Image from 'next/image';
import { BaseNode } from './BaseNode';
import { Handle, Position, useUpdateNodeInternals } from '@xyflow/react';
import { Image as ImageIcon, Loader2, Play, Type } from 'lucide-react';
import { NodeToolbar } from '../NodeToolbar';
import { cn } from '@/lib/utils';
import { ExecutionMode, NodeStatus, ImageModel } from '../types';

interface GeneratorNodeProps {
    id: string;
    data: {
        label?: string;
        model?: ImageModel;
        previewUrl?: string;
        status?: NodeStatus;
        prompt?: string;
        inputs?: {
            prompt?: boolean;
            media?: boolean;
        };
        onDelete?: (id: string) => void;
        onRun?: (id: string, mode?: ExecutionMode) => void;
        onDuplicate?: () => void;
        onSettings?: () => void;
        onReplace?: () => void;
        onReference?: () => void;
        onOpenImageEditor?: (previewUrl: string) => void;
        isPreview?: boolean;
    };
    selected?: boolean;
}

const MODELS = [
    { id: ImageModel.SEEDREAM, name: 'Seedream 4 4K', badge: 'Fast' },
    { id: ImageModel.FLUX, name: 'Flux Schnell', badge: 'Popular' },
    { id: ImageModel.IMAGEN3, name: 'Imagen 3', badge: 'Best' },
    { id: ImageModel.MIDJOURNEY, name: 'Midjourney v6', badge: '' },
    { id: ImageModel.DALLE3, name: 'DALL-E 3', badge: '' },
];

export function GeneratorNode({ id, data, selected }: GeneratorNodeProps) {
    const updateNodeInternals = useUpdateNodeInternals();

    const currentModel = MODELS.find((model) => model.id === (data.model ?? ImageModel.SEEDREAM)) ?? MODELS[0];

    const handleMediaLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const target = e.currentTarget;
        if (target.naturalWidth > 0 && target.naturalHeight > 0) {
            updateNodeInternals(id);
        }
    };

    return (
        <div className="relative">
            {selected && !data.isPreview && (
                <NodeToolbar
                    nodeId={id}
                    onRun={() => data.onRun?.(id, ExecutionMode.WORKFLOW)}
                    onRunLocal={() => data.onRun?.(id, ExecutionMode.LOCAL)}
                    runDisabled={data.status === NodeStatus.PROCESSING || data.status === NodeStatus.QUEUED || (!data.prompt?.trim() && !data.inputs?.prompt)}
                    onDelete={() => data.onDelete?.(id)}
                    onDuplicate={data.onDuplicate}
                    onSettings={data.onSettings}
                    onReplace={data.onReplace}
                    onReference={data.onReference}
                />
            )}

            <div className={cn('absolute -left-3 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-50', data.isPreview && 'scale-50 opacity-0')}>
                <Handle
                    type="target"
                    position={Position.Left}
                    id="prompt-input"
                    className={cn(
                        '!w-8 !h-8 !border-2 !border-background !bg-card !rounded-full !relative !left-0 !top-0 !flex !items-center !justify-center !transition-colors !opacity-100',
                        data.inputs?.prompt ? '!bg-blue-500 !border-blue-500/20' : 'hover:!bg-blue-500/20',
                    )}
                >
                    <Type className={cn('w-4 h-4', data.inputs?.prompt ? 'text-white' : 'text-muted-foreground')} />
                </Handle>
                <Handle
                    type="target"
                    position={Position.Left}
                    id="media-input"
                    className={cn(
                        '!w-8 !h-8 !border-2 !border-background !bg-card !rounded-full !relative !left-0 !top-0 !flex !items-center !justify-center !transition-colors !opacity-100',
                        data.inputs?.media ? '!bg-green-500 !border-green-500/20' : 'hover:!bg-green-500/20',
                    )}
                >
                    <ImageIcon className={cn('w-4 h-4', data.inputs?.media ? 'text-white' : 'text-white/40')} />
                </Handle>
            </div>

            <BaseNode
                id={id}
                title={data.label || 'Image Generator'}
                selected={selected}
                status={data.status}
                onDelete={data.onDelete}
                isPreview={data.isPreview}
            >
                <div className={cn('relative bg-muted/30 overflow-hidden', data.isPreview ? 'w-[120px]' : 'w-[340px]')}>
                    <div className={cn('w-full bg-background flex items-center justify-center overflow-hidden relative', data.isPreview ? 'min-h-[80px]' : 'min-h-[200px]')}>
                        {data.status === NodeStatus.PROCESSING || data.status === NodeStatus.QUEUED ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-950/40 backdrop-blur-[2px] z-10">
                                <div className="relative w-12 h-12 flex items-center justify-center">
                                    <div className="absolute inset-0 border-2 border-blue-500/20 rounded-full animate-ping" />
                                    <Loader2 className="w-6 h-6 text-blue-500 animate-spin relative z-20" />
                                </div>
                                <span className="mt-3 text-[10px] font-bold text-blue-400 uppercase tracking-widest animate-pulse">
                                    {data.status === NodeStatus.QUEUED ? 'In Queue' : 'Generating...'}
                                </span>
                            </div>
                        ) : null}

                        {data.previewUrl ? (
                            <div className="relative w-full aspect-video">
                                <Image
                                    src={data.previewUrl}
                                    alt="Generated"
                                    fill
                                    className="object-cover cursor-pointer hover:ring-2 hover:ring-blue-500/50 transition-all"
                                    sizes="(max-width: 1024px) 100vw, 340px"
                                    onClick={() => data.onOpenImageEditor?.(data.previewUrl ?? '')}
                                    onLoad={handleMediaLoad}
                                />
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-3 text-white/5 italic py-6">
                                <ImageIcon className={data.isPreview ? 'w-6 h-6' : 'w-12 h-12'} />
                            </div>
                        )}

                        {!data.isPreview && (
                            <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-gray-950/80 to-transparent">
                                {data.inputs?.prompt ? (
                                    <div className="px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                        <p className="text-sm text-blue-400 font-medium">Prompt (connected)</p>
                                    </div>
                                ) : (
                                    <div className="w-full bg-transparent border-none text-sm text-white/60 placeholder:text-white/20 focus:outline-none resize-none h-12 custom-scrollbar">
                                        {data.prompt || 'Describe the image...'}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {!data.isPreview && (
                        <div className="p-3 bg-card border-t border-border flex items-center gap-2">
                            <div className="flex-1 truncate text-xs text-muted-foreground">{currentModel.name}</div>
                            <button
                                onClick={() => data.onRun?.(id, ExecutionMode.LOCAL)}
                                disabled={data.status === NodeStatus.PROCESSING || data.status === NodeStatus.QUEUED || (!data.prompt?.trim() && !data.inputs?.prompt)}
                                className="p-2 bg-blue-500 hover:bg-blue-400 disabled:opacity-50 rounded-full text-white h-8 w-8 flex items-center justify-center transition-all"
                            >
                                <Play className="w-4 h-4 fill-current" />
                            </button>
                        </div>
                    )}
                </div>

                <Handle
                    type="source"
                    position={Position.Right}
                    className={cn('!w-3 !h-3 !border-2 !border-background !bg-foreground/50 z-50 transform translate-x-1.5', data.isPreview && 'scale-50 opacity-0')}
                />
            </BaseNode>
        </div>
    );
}
