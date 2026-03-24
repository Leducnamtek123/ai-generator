import React, { useState } from 'react';
import { BaseNode } from './BaseNode';
import { Handle, Position } from '@xyflow/react';
import {
    Video,
    Loader2,
    Play,
    Download,
    Maximize2,
    Type,
    Settings,
    Image as ImageIcon,
    Clock,
    MonitorPlay
} from 'lucide-react';
import { NodeToolbar } from '../NodeToolbar';
import { cn } from '@/lib/utils';
import { useUpdateNodeInternals } from '@xyflow/react';
import { ExecutionMode, NodeStatus, VideoModel, VideoDuration, AspectRatio } from '../types';

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
        onDelete?: (id: string) => void;
        onRun?: (id: string, mode?: ExecutionMode) => void;
        onSettingsChange?: (id: string, settings: any) => void;
        onTextChange?: (id: string, text: string) => void;
        onDuplicate?: () => void;
        onSettings?: () => void;
        onReplace?: () => void;
        onReference?: () => void;
        onHandleClick?: (event: any, handleId: string, handleType: 'source' | 'target') => void;
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
    const [selectedModel, setSelectedModel] = useState(data.model || VideoModel.RUNWAY);
    const [showFullscreen, setShowFullscreen] = useState(false);
    const [localPrompt, setLocalPrompt] = useState(data.prompt || '');

    // Derived state for display
    const currentModel = MODELS.find(m => m.id === selectedModel) || MODELS[0];

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
            <div className={cn("absolute -left-3 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-50", data.isPreview && "scale-50 opacity-0")}>
                <Handle
                    type="target"
                    position={Position.Left}
                    id="prompt-input"
                    className={cn(
                        "!w-8 !h-8 !border-2 !border-background !bg-card !rounded-full !relative !left-0 !top-0 !flex !items-center !justify-center !transition-colors !opacity-100",
                        data.inputs?.prompt ? "!bg-green-500 !border-green-500/20" : "hover:!bg-green-500/20"
                    )}
                >
                    <Type className={cn("w-4 h-4", data.inputs?.prompt ? "text-white" : "text-muted-foreground")} />
                </Handle>
                <Handle
                    type="target"
                    position={Position.Left}
                    id="image-input"
                    className={cn(
                        "!w-8 !h-8 !border-2 !border-background !bg-card !rounded-full !relative !left-0 !top-0 !flex !items-center !justify-center !transition-colors !opacity-100",
                        data.inputs?.image ? "!bg-blue-500 !border-blue-500/20" : "hover:!bg-blue-500/20"
                    )}
                >
                    <ImageIcon className={cn("w-4 h-4", data.inputs?.image ? "text-white" : "text-muted-foreground")} />
                </Handle>
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
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md z-10 transition-all">
                                <div className="relative">
                                    <div className="w-16 h-16 border-4 border-green-500/20 rounded-full" />
                                    <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-green-500 rounded-full animate-spin" />
                                    <div className="absolute inset-0 flex items-center justify-center text-green-500">
                                        <Video className="w-6 h-6 animate-pulse" />
                                    </div>
                                </div>
                                <span className="mt-4 text-[10px] text-green-400 font-bold uppercase tracking-widest animate-pulse">
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
                                    autoPlay
                                    playsInline
                                />

                                {/* Overlay Actions */}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                    <button
                                        onClick={() => setShowFullscreen(true)}
                                        className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                                    >
                                        <Maximize2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-3 text-white/5 italic py-6">
                                <Video className={data.isPreview ? "w-6 h-6" : "w-12 h-12"} />
                            </div>
                        )}

                        {!data.isPreview && (
                            <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
                                <div className="pointer-events-auto">
                                    {data.inputs?.prompt ? (
                                        <div className="px-3 py-2 bg-green-500/10 border border-green-500/20 rounded-lg">
                                            <p className="text-sm text-green-400 font-medium">Prompt (connected)</p>
                                        </div>
                                    ) : (
                                        <textarea
                                            className="w-full bg-transparent border-none text-sm text-white/60 placeholder:text-white/20 focus:outline-none resize-none h-12 custom-scrollbar"
                                            placeholder="Describe the video..."
                                            value={localPrompt}
                                            onChange={handlePromptChange}
                                        />
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {!data.isPreview && (
                        /* Bottom Control Bar */
                        <div className="p-3 bg-card border-t border-border flex items-center gap-2">
                            <div className="flex-1 truncate text-xs text-muted-foreground flex items-center gap-2">
                                <span className="text-green-500">{currentModel.name}</span>
                                <span className="w-1 h-1 rounded-full bg-white/20" />
                                <span>{data.duration || '4s'}</span>
                            </div>

                            <button
                                onClick={() => data.onRun?.(id, ExecutionMode.LOCAL)}
                                disabled={isProcessing || (!localPrompt.trim() && !data.inputs?.prompt)}
                                className="p-2 bg-green-500 hover:bg-green-400 disabled:opacity-50 rounded-full text-white h-8 w-8 flex items-center justify-center transition-all shadow-lg shadow-green-500/20"
                            >
                                {isProcessing ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Play className="w-4 h-4 fill-current" />
                                )}
                            </button>
                        </div>
                    )}
                </div>

                <Handle
                    type="source"
                    position={Position.Right}
                    className={cn("!w-3 !h-3 !border-2 !border-background !bg-foreground/50 z-50 transform translate-x-1.5", data.isPreview && "scale-50 opacity-0")}
                />
            </BaseNode>

            {showFullscreen && data.previewUrl && !data.isPreview && (
                <div className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-10" onClick={() => setShowFullscreen(false)}>
                    <video
                        src={data.previewUrl}
                        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                        controls
                        autoPlay
                    />
                </div>
            )}
        </div>
    );
}
