'use client';

import React, { useState } from 'react';
import { BaseNode } from './BaseNode';
import { Handle, Position } from '@xyflow/react';
import {
    Video,
    Loader2,
    Play,
    Maximize2,
} from 'lucide-react';
import { NodeToolbar } from '../NodeToolbar';
import { cn } from '@/lib/utils';
import { ExecutionMode, NodeStatus, VideoModel, VideoDuration, AspectRatio } from '../types';
import { useWorkflowUIStore } from '@/stores/workflow-ui-store';

interface VideoNodeProps {
    id: string;
    data: {
        label?: string;
        model?: VideoModel;
        previewUrl?: string;
        duration?: VideoDuration;
        aspectRatio?: AspectRatio;
        status?: NodeStatus;
        prompt?: string;
        inputs?: {
            prompt?: boolean;
            image?: boolean;
        };
        connectedPrompt?: string;
        connectedPromptSource?: string;
        connectedImageSource?: string;
        onDelete?: (id: string) => void;
        onRun?: (id: string, mode?: ExecutionMode) => void;
        onSettingsChange?: (id: string, settings: Record<string, unknown>) => void;
        onTextChange?: (id: string, text: string) => void;
        onDuplicate?: () => void;
        onSettings?: () => void;
        onReplace?: () => void;
        onReference?: () => void;
        onHandleClick?: (event: React.MouseEvent, handleId: string, handleType: 'source' | 'target') => void;
        isPreview?: boolean;
    };
    selected?: boolean;
}

const MODELS = [
    { id: VideoModel.RUNWAY, name: 'Runway Gen-3 Alpha', badge: 'Realistic' },
    { id: VideoModel.SORA, name: 'Sora', badge: 'New' },
    { id: VideoModel.PIKA, name: 'Pika 1.5', badge: 'Animation' },
    { id: VideoModel.KLING, name: 'Kling', badge: 'Fast' },
];

export function VideoNode({ id, data, selected }: VideoNodeProps) {
    const [showFullscreen, setShowFullscreen] = useState(false);
    const [localPrompt, setLocalPrompt] = useState(data.prompt || '');
    const autoplayVideos = useWorkflowUIStore((state) => state.autoplayVideos);

    React.useEffect(() => {
        if (data.prompt !== undefined && data.prompt !== localPrompt) {
            setLocalPrompt(data.prompt);
        }
    }, [data.prompt, localPrompt]);

    // Derived state for display
    const currentModel = MODELS.find(m => m.id === (data.model || VideoModel.RUNWAY)) || MODELS[0];

    const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setLocalPrompt(e.target.value);
        data.onTextChange?.(id, e.target.value);
    };

    const isProcessing = data.status === NodeStatus.PROCESSING || data.status === NodeStatus.QUEUED;

    return (
        <div className="relative">
            {selected && !data.isPreview && (
                <NodeToolbar
                    nodeId={id}
                    onRun={() => data.onRun?.(id, ExecutionMode.WORKFLOW)}
                    onRunLocal={() => data.onRun?.(id, ExecutionMode.LOCAL)}
                    runDisabled={isProcessing || (!localPrompt.trim() && !data.inputs?.prompt)}
                    onDelete={() => data.onDelete?.(id)}
                    onDuplicate={data.onDuplicate}
                    onSettings={data.onSettings}
                    onReplace={data.onReplace} // For validation
                />
            )}

            {/* Left Handles (Stacked) */}
            <div className={cn("absolute left-0 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-50", data.isPreview && "scale-50 opacity-0")}>
                <Handle
                    type="target"
                    position={Position.Left}
                    id="prompt-input"
                    onClick={(e) => data.onHandleClick?.(e, 'prompt-input', 'target')}
                    className={cn(
                        "!relative !left-0 !top-0 !flex !items-center !justify-center !rounded-full !border-2 !border-background !bg-card !transition-colors !opacity-100",
                        data.inputs?.prompt ? "!bg-green-500 !border-green-500/20" : "hover:!bg-green-500/20"
                    )}
                />
                <Handle
                    type="target"
                    position={Position.Left}
                    id="image-input"
                    onClick={(e) => data.onHandleClick?.(e, 'image-input', 'target')}
                    className={cn(
                        "!relative !left-0 !top-0 !flex !items-center !justify-center !rounded-full !border-2 !border-background !bg-card !transition-colors !opacity-100",
                        data.inputs?.image ? "!bg-blue-500 !border-blue-500/20" : "hover:!bg-blue-500/20"
                    )}
                />
            </div>

            <BaseNode
                id={id}
                title={data.label || "Video Generator"}
                selected={selected}
                status={data.status}
                onDelete={data.onDelete}
                isPreview={data.isPreview}
            >
                <div className={cn("relative bg-muted/30 overflow-hidden", data.isPreview ? "w-[120px]" : "w-[340px]")}>
                    {/* Preview Area */}
                    <div className={cn("w-full bg-background flex items-center justify-center overflow-hidden relative", data.isPreview ? "min-h-[80px]" : "min-h-[200px]")}>
                        {isProcessing ? (
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/80 backdrop-blur-md transition-all">
                                <div className="relative">
                                    <div className="size-16 border-4 border-green-500/20 rounded-full" />
                                    <div className="absolute inset-0 size-16 border-4 border-transparent border-t-green-500 rounded-full animate-spin" />
                                    <div className="absolute inset-0 flex items-center justify-center text-green-500">
                                        <Video className="size-6 animate-pulse" />
                                    </div>
                                </div>
                                <span className="mt-4 text-xs text-green-400 font-medium animate-pulse">
                                    {data.status === NodeStatus.QUEUED ? 'In Queue' : 'Rendering Video...'}
                                </span>
                            </div>
                        ) : null}

                        {data.previewUrl ? (
                            <div className="relative w-full h-full group">
                                <video
                                    src={data.previewUrl}
                                    className="w-full h-auto block object-cover"
                                    muted
                                    loop
                                    autoPlay={autoplayVideos}
                                    playsInline
                                />

                                {/* Overlay Actions */}
                                <div className="absolute inset-0 flex items-center justify-center gap-3 bg-background/70 opacity-0 transition-opacity group-hover:opacity-100">
                                    <button
                                        onClick={() => setShowFullscreen(true)}
                                        className="rounded-full bg-muted/40 p-3 text-foreground transition-colors hover:bg-muted/70"
                                    >
                                        <Maximize2 className="size-5" />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-3 py-6 italic text-muted-foreground/20">
                                <Video className={data.isPreview ? "size-6" : "size-12"} />
                            </div>
                        )}

                        {!data.isPreview && (
                            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/90 to-transparent p-4">
                                <div className="pointer-events-auto">
                                    {data.inputs?.prompt ? (
                                        <div className="space-y-1 px-3 py-2 bg-green-500/10 border border-green-500/20 rounded-lg">
                                            <p className="text-sm text-green-400 font-medium">Prompt connected</p>
                                            {data.connectedPrompt && (
                                                <p className="text-xs text-green-200/80 leading-snug break-words">
                                                    {data.connectedPrompt}
                                                </p>
                                            )}
                                            {data.connectedPromptSource && (
                                                <p className="text-[10px] text-green-300/50">
                                                    From {data.connectedPromptSource}
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <textarea
                                            className="custom-scrollbar h-12 w-full resize-none border-none bg-transparent text-sm text-foreground/70 placeholder:text-muted-foreground focus:outline-none"
                                            placeholder="Describe the video?"
                                            value={localPrompt}
                                            onChange={handlePromptChange}
                                        />
                                    )}
                                    {data.inputs?.image && (
                                        <div className="mt-2 px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                            <p className="text-sm text-blue-400 font-medium">Image reference connected</p>
                                            {data.connectedImageSource && (
                                                <p className="text-[10px] text-blue-300/50">
                                                    From {data.connectedImageSource}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {!data.isPreview && (
                        /* Bottom Control Bar */
                        <div className="flex items-center gap-2 border-t border-border bg-card p-3">
                            <div className="flex-1 truncate text-xs text-muted-foreground flex items-center gap-2">
                                <span className="text-green-500">{currentModel.name}</span>
                                <span className="size-1 rounded-full bg-muted-foreground/40" />
                                <span>{data.duration || '4s'}</span>
                            </div>

                            <button
                                onClick={() => data.onRun?.(id, ExecutionMode.LOCAL)}
                                disabled={isProcessing || (!localPrompt.trim() && !data.inputs?.prompt)}
                                className="p-2 bg-green-500 hover:bg-green-400 disabled:opacity-50 rounded-full text-white size-8 flex items-center justify-center transition-all shadow-lg shadow-green-500/20"
                            >
                                {isProcessing ? (
                                    <Loader2 className="size-4 animate-spin" />
                                ) : (
                                    <Play className="size-4 fill-current" />
                                )}
                            </button>
                        </div>
                    )}
                </div>

                <Handle
                    type="source"
                    position={Position.Right}
                    id="output"
                    onClick={(e) => data.onHandleClick?.(e, 'output', 'source')}
                    className={cn("!border-2 !border-background !bg-foreground/50 z-50", data.isPreview && "scale-50 opacity-0")}
                />
            </BaseNode>

            {showFullscreen && data.previewUrl && !data.isPreview && (
                <button type="button" aria-label="Close fullscreen preview" className="fixed inset-0 z-[200] flex items-center justify-center bg-background/95 p-10" onClick={() => setShowFullscreen(false)}>
                    <video
                        src={data.previewUrl}
                        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                        controls
                        autoPlay={autoplayVideos}
                    />
                </button>
            )}
        </div>
    );
}
