import React, { useState } from 'react';
import { BaseNode } from './BaseNode';
import { Handle, Position } from '@xyflow/react';
import {
    Image as ImageIcon,
    Loader2,
    Play,
    Download,
    Maximize2,
    Type,
    Settings,
    Minus,
    Plus,
    ChevronDown
} from 'lucide-react';
import { NodeToolbar } from '../NodeToolbar';
import { cn } from '@/lib/utils';
import { useUpdateNodeInternals } from '@xyflow/react';
import { ExecutionMode, NodeStatus, ImageModel, AspectRatio, WorkflowNodeType } from '../types';

interface GeneratorNodeProps {
    id: string;
    data: {
        label?: string;
        model?: ImageModel;
        previewUrl?: string;
        count?: number;
        aspectRatio?: AspectRatio;
        status?: NodeStatus;
        prompt?: string;
        inputs?: {
            prompt?: boolean;
            media?: boolean;
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
    { id: ImageModel.SEEDREAM, name: 'Seedream 4 4K', badge: 'Fast' },
    { id: ImageModel.FLUX, name: 'Flux Schnell', badge: 'Popular' },
    { id: ImageModel.IMAGEN3, name: 'Imagen 3', badge: 'Best' },
    { id: ImageModel.MIDJOURNEY, name: 'Midjourney v6', badge: '' },
    { id: ImageModel.DALLE3, name: 'DALL-E 3', badge: '' },
];

const ASPECT_RATIOS = ['1:1', '4:3', '3:4', '16:9', '9:16', '2:3', '3:2'];

export function GeneratorNode({ id, data, selected }: GeneratorNodeProps) {
    const [count, setCount] = useState(data.count || 1);
    const [selectedModel, setSelectedModel] = useState(data.model || 'seedream');
    const [aspectRatio, setAspectRatio] = useState(data.aspectRatio || '1:1');
    const [showModelDropdown, setShowModelDropdown] = useState(false);
    const [showRatioDropdown, setShowRatioDropdown] = useState(false);
    const [showFullscreen, setShowFullscreen] = useState(false);
    const [localPrompt, setLocalPrompt] = useState(data.prompt || '');

    const currentModel = MODELS.find(m => m.id === selectedModel) || MODELS[0];

    const handleCountChange = (delta: number) => {
        const newCount = Math.max(1, Math.min(4, count + delta));
        setCount(newCount);
        data.onSettingsChange?.(id, { count: newCount });
    };

    const handleModelChange = (modelId: string) => {
        setSelectedModel(modelId);
        setShowModelDropdown(false);
        data.onSettingsChange?.(id, { model: modelId });
    };

    const handleRatioChange = (ratio: string) => {
        setAspectRatio(ratio);
        setShowRatioDropdown(false);
        data.onSettingsChange?.(id, { aspectRatio: ratio });
    };

    const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setLocalPrompt(e.target.value);
        data.onTextChange?.(id, e.target.value);
    };

    const handleDownload = () => {
        if (data.previewUrl) {
            const link = document.createElement('a');
            link.href = data.previewUrl;
            link.download = `generated-${id}-${Date.now()}.png`;
            link.click();
        }
    };

    const updateNodeInternals = useUpdateNodeInternals();
    const [mediaDimensions, setMediaDimensions] = useState<{ width: number, height: number } | null>(null);

    const handleMediaLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const target = e.target as HTMLImageElement;
        setMediaDimensions({ width: target.naturalWidth, height: target.naturalHeight });
        updateNodeInternals(id);
    };

    return (
        <div className="relative">
            {selected && !data.isPreview && (
                <NodeToolbar
                    nodeId={id}
                    onRun={() => data.onRun?.(id, ExecutionMode.WORKFLOW)}
                    onRunLocal={() => data.onRun?.(id, ExecutionMode.LOCAL)}
                    runDisabled={data.status === NodeStatus.PROCESSING || data.status === NodeStatus.QUEUED || (!localPrompt.trim() && !data.inputs?.prompt)}
                    onDelete={() => data.onDelete?.(id)}
                    onDuplicate={data.onDuplicate}
                    onSettings={data.onSettings}
                    onReplace={data.onReplace}
                    onReference={data.onReference}
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
                        data.inputs?.prompt ? "!bg-blue-500 !border-blue-500/20" : "hover:!bg-blue-500/20"
                    )}
                >
                    <Type className={cn("w-4 h-4", data.inputs?.prompt ? "text-white" : "text-muted-foreground")} />
                </Handle>
                <Handle
                    type="target"
                    position={Position.Left}
                    id="media-input"
                    className={cn(
                        "!w-8 !h-8 !border-2 !border-background !bg-card !rounded-full !relative !left-0 !top-0 !flex !items-center !justify-center !transition-colors !opacity-100",
                        data.inputs?.media ? "!bg-green-500 !border-green-500/20" : "hover:!bg-green-500/20"
                    )}
                >
                    <ImageIcon className={cn("w-4 h-4", data.inputs?.media ? "text-white" : "text-white/40")} />
                </Handle>
            </div>

            <BaseNode
                id={id}
                title={data.label || "Image Generator"}
                selected={selected}
                status={data.status}
                onDelete={data.onDelete}
                isPreview={data.isPreview}
            >
                <div className={cn("relative bg-muted/30 overflow-hidden", data.isPreview ? "w-[120px]" : "w-[340px]")}>
                    {/* Preview Area */}
                    <div className={cn("w-full bg-background flex items-center justify-center overflow-hidden relative", data.isPreview ? "min-h-[80px]" : "min-h-[200px]")}>
                        {data.status === NodeStatus.PROCESSING || data.status === NodeStatus.QUEUED ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] z-10">
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
                            <img
                                src={data.previewUrl}
                                alt="Generated"
                                className="w-full h-auto block object-cover cursor-pointer hover:ring-2 hover:ring-blue-500/50 transition-all"
                                onClick={() => (data as any).onOpenImageEditor?.(data.previewUrl)}
                                onLoad={handleMediaLoad}
                            />
                        ) : (
                            <div className="flex flex-col items-center gap-3 text-white/5 italic py-6">
                                <ImageIcon className={data.isPreview ? "w-6 h-6" : "w-12 h-12"} />
                            </div>
                        )}

                        {!data.isPreview && (
                            <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                                {data.inputs?.prompt ? (
                                    <div className="px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                        <p className="text-sm text-blue-400 font-medium">Prompt (connected)</p>
                                    </div>
                                ) : (
                                    <textarea
                                        className="w-full bg-transparent border-none text-sm text-white/60 placeholder:text-white/20 focus:outline-none resize-none h-12 custom-scrollbar"
                                        placeholder="Describe the image..."
                                        value={localPrompt}
                                        onChange={handlePromptChange}
                                    />
                                )}
                            </div>
                        )}
                    </div>

                    {!data.isPreview && (
                        /* Bottom Control Bar */
                        <div className="p-3 bg-card border-t border-border flex items-center gap-2">
                            {/* Simplified for space - only showing play button and basic model */}
                            <div className="flex-1 truncate text-xs text-muted-foreground">{currentModel.name}</div>
                            <button
                                onClick={() => data.onRun?.(id, ExecutionMode.LOCAL)}
                                disabled={data.status === NodeStatus.PROCESSING || data.status === NodeStatus.QUEUED || (!localPrompt.trim() && !data.inputs?.prompt)}
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
                    className={cn("!w-3 !h-3 !border-2 !border-background !bg-foreground/50 z-50 transform translate-x-1.5", data.isPreview && "scale-50 opacity-0")}
                />
            </BaseNode>

            {showFullscreen && data.previewUrl && !data.isPreview && (
                <div className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-10" onClick={() => setShowFullscreen(false)}>
                    <img src={data.previewUrl} className="max-w-full max-h-full object-contain rounded-lg" alt="Full size" />
                </div>
            )}
        </div>
    );
}
