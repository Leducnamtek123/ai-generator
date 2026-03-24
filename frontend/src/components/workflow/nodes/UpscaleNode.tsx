import React, { useState, useEffect } from 'react';
import { BaseNode } from './BaseNode';
import { Handle, Position, useUpdateNodeInternals } from '@xyflow/react';
import {
    Scan,
    Loader2,
    Download,
    ZoomIn,
    Maximize2,
    Lock,
    Settings,
    Wand2,
    Crown,
    ChevronDown,
    Info
} from 'lucide-react';
import { NodeToolbar } from '../NodeToolbar';
import { cn } from '@/lib/utils';
import {
    ExecutionMode,
    NodeStatus,
    UpscaleFactor,
    UpscaleMode,
    UpscaleModel,
    UpscalePreset
} from '../types';

interface UpscaleNodeProps {
    id: string;
    data: {
        label?: string;
        inputUrl?: string;
        previewUrl?: string;
        scale?: UpscaleFactor;
        status?: NodeStatus;
        enhanceMode?: UpscaleMode;
        model?: UpscaleModel;
        preset?: UpscalePreset;
        sharpness?: number;
        grain?: number;
        onDelete?: (id: string) => void;
        onRun?: (id: string, mode?: ExecutionMode) => void;
        onDuplicate?: () => void;
        onSettings?: () => void;
        onReplace?: () => void;
        onReference?: () => void;
        onSettingsChange?: (id: string, settings: any) => void;
        onHandleClick?: (event: any, handleId: string, handleType: 'source' | 'target') => void;
    };
    selected?: boolean;
}

const MODELS = [
    { id: UpscaleModel.MAGNIFIC_V2, name: 'Magnific v2 (sublime)' },
    { id: UpscaleModel.SUPIR, name: 'SUPIR (high fidelity)' },
    { id: UpscaleModel.REAL_ESRGAN, name: 'Real-ESRGAN' },
];

const PRESETS = [
    { id: UpscalePreset.BALANCED, name: 'Balanced' },
    { id: UpscalePreset.CINEMATIC, name: 'Cinematic' },
    { id: UpscalePreset.PORTRAIT, name: 'Portrait' },
    { id: UpscalePreset.LANDSCAPE, name: 'Landscape' },
    { id: UpscalePreset.FANTASY, name: 'Fantasy' },
];

const SCALE_FACTORS = [
    { id: UpscaleFactor.TWO_X, name: '2x' },
    { id: UpscaleFactor.FOUR_X, name: '4x' },
    { id: UpscaleFactor.EIGHT_X, name: '8x' },
];

export function UpscaleNode({ id, data, selected }: UpscaleNodeProps) {
    const [activeTab, setActiveTab] = useState<UpscaleMode>(data.enhanceMode || UpscaleMode.CREATIVE);
    const [scale, setScale] = useState<UpscaleFactor>(data.scale || UpscaleFactor.TWO_X);
    const [model, setModel] = useState<UpscaleModel>(data.model || UpscaleModel.MAGNIFIC_V2);
    const [preset, setPreset] = useState<UpscalePreset>(data.preset || UpscalePreset.BALANCED);
    const [sharpness, setSharpness] = useState(data.sharpness ?? 20);
    const [grain, setGrain] = useState(data.grain ?? 10);

    const [showFullscreen, setShowFullscreen] = useState(false);
    const updateNodeInternals = useUpdateNodeInternals();
    const [mediaDimensions, setMediaDimensions] = useState<{ width: number, height: number } | null>(null);

    const handleMediaLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const target = e.target as HTMLImageElement;
        setMediaDimensions({ width: target.naturalWidth, height: target.naturalHeight });
        updateNodeInternals(id);
    };

    const handleSettingChange = (key: string, value: any) => {
        data.onSettingsChange?.(id, { [key]: value });
    };

    const handleDownload = () => {
        if (data.previewUrl) {
            const link = document.createElement('a');
            link.href = data.previewUrl;
            link.download = `upscaled-${scale}-${id}-${Date.now()}.png`;
            link.click();
        }
    };

    // Calculate final dimensions
    const finalWidth = mediaDimensions ? mediaDimensions.width * (scale as number) : 0;
    const finalHeight = mediaDimensions ? mediaDimensions.height * (scale as number) : 0;

    const isFinished = data.status === NodeStatus.SUCCESS && data.previewUrl;
    const isProcessing = data.status === NodeStatus.PROCESSING || data.status === NodeStatus.QUEUED;

    return (
        <>
            {selected && (
                <NodeToolbar
                    nodeId={id}
                    onRun={() => data.onRun?.(id, ExecutionMode.WORKFLOW)}
                    onRunLocal={() => data.onRun?.(id, ExecutionMode.LOCAL)}
                    runDisabled={data.status === NodeStatus.PROCESSING || data.status === NodeStatus.QUEUED || !data.inputUrl}
                    onDelete={() => data.onDelete?.(id)}
                    onDuplicate={data.onDuplicate}
                    onReplace={data.onReplace}
                    onReference={data.onReference}
                    onSettings={data.onSettings}
                />
            )}

            <BaseNode
                id={id}
                title="AI Upscaler"
                selected={selected}
                status={data.status}
                onDelete={data.onDelete}
            >
                <div className="w-[320px] bg-muted/30">
                    {/* Tabs */}
                    <div className="flex p-1 bg-background border-b border-border">
                        <button
                            onClick={() => {
                                setActiveTab(UpscaleMode.CREATIVE);
                                handleSettingChange('enhanceMode', UpscaleMode.CREATIVE);
                            }}
                            className={cn(
                                "flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all uppercase tracking-wider",
                                activeTab === UpscaleMode.CREATIVE
                                    ? "bg-accent text-accent-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            Creative
                        </button>
                        <button
                            onClick={() => {
                                setActiveTab(UpscaleMode.PRECISION);
                                handleSettingChange('enhanceMode', UpscaleMode.PRECISION);
                            }}
                            className={cn(
                                "flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all uppercase tracking-wider",
                                activeTab === UpscaleMode.PRECISION
                                    ? "bg-accent text-accent-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            Precision
                        </button>
                    </div>

                    {/* Preview Area - Adaptive */}
                    <div className="w-full bg-background flex items-center justify-center overflow-hidden relative group min-h-[160px]">
                        {isProcessing && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md z-10 transition-all">
                                <div className="relative">
                                    <div className="w-16 h-16 border-4 border-yellow-500/20 rounded-full" />
                                    <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-yellow-500 rounded-full animate-spin" />
                                    <div className="absolute inset-0 flex items-center justify-center text-yellow-500">
                                        <Crown className="w-6 h-6 animate-pulse" />
                                    </div>
                                </div>
                                <span className="mt-4 text-[10px] text-yellow-400 font-bold uppercase tracking-widest animate-pulse">
                                    {data.status === NodeStatus.QUEUED ? 'In Queue' : `Upscaling to ${scale}x`}
                                </span>
                            </div>
                        )}

                        {isFinished ? (
                            <>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={data.previewUrl}
                                    alt="Upscaled"
                                    className="w-full h-auto block object-cover"
                                    onLoad={handleMediaLoad}
                                />

                                {/* Overlay Actions */}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                    <button
                                        onClick={() => (data as any).onOpenImageEditor?.(data.previewUrl)}
                                        className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                                    >
                                        <Wand2 className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={handleDownload}
                                        className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                                    >
                                        <Download className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => setShowFullscreen(true)}
                                        className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                                    >
                                        <Maximize2 className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Status Badge */}
                                <div className="absolute top-3 left-3 px-2 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded text-[10px] text-yellow-500 font-medium flex items-center gap-1">
                                    <Crown className="w-3 h-3" />
                                    {scale}x Upscaled
                                </div>

                                <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/60 rounded text-[9px] text-white/70 backdrop-blur-sm uppercase">
                                    {mediaDimensions ? `${mediaDimensions.width}x${mediaDimensions.height}` : 'Finished'}
                                </div>
                            </>
                        ) : (
                            /* Placeholder Area (Mẫu) */
                            <div className="flex flex-col items-center justify-center gap-4 py-8">
                                <FreepikPlaceholder />
                                {!data.inputUrl && (
                                    <div className="text-center space-y-1">
                                        <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Image Upscaler</p>
                                        <p className="text-[9px] text-white/10 italic">Waiting for input...</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Controls */}
                    <div className="p-4 bg-muted/30 space-y-5">
                        {activeTab === UpscaleMode.PRECISION && (
                            <>
                                {/* Model Selection */}
                                <div className="space-y-2">
                                    <div className="flex items-center gap-1.5">
                                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Model</p>
                                        <Info className="w-3 h-3 text-muted-foreground/50" />
                                    </div>
                                    <div className="relative">
                                        <select
                                            value={model}
                                            onChange={(e) => {
                                                setModel(e.target.value as UpscaleModel);
                                                handleSettingChange('model', e.target.value);
                                            }}
                                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground outline-none appearance-none hover:bg-accent/50 transition-colors"
                                        >
                                            {MODELS.map(m => (
                                                <option key={m.id} value={m.id}>{m.name}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40 pointer-events-none" />
                                    </div>
                                </div>

                                {/* Presets */}
                                <div className="space-y-2">
                                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Presets</p>
                                    <div className="relative">
                                        <select
                                            value={preset}
                                            onChange={(e) => {
                                                setPreset(e.target.value as UpscalePreset);
                                                handleSettingChange('preset', e.target.value);
                                            }}
                                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground outline-none appearance-none hover:bg-accent/50 transition-colors"
                                        >
                                            {PRESETS.map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40 pointer-events-none" />
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Scale Factor */}
                        <div className="space-y-2">
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Scale Factor</p>
                            <div className="relative">
                                <select
                                    value={scale}
                                    onChange={(e) => {
                                        setScale(Number(e.target.value) as UpscaleFactor);
                                        handleSettingChange('scale', Number(e.target.value));
                                    }}
                                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground outline-none appearance-none hover:bg-accent/50 transition-colors"
                                >
                                    {SCALE_FACTORS.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40 pointer-events-none" />
                            </div>
                        </div>

                        {activeTab === UpscaleMode.PRECISION && (
                            <>
                                {/* Sharpness */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5">
                                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Sharpness</p>
                                            <Info className="w-3 h-3 text-muted-foreground/50" />
                                        </div>
                                        <span className="text-[10px] font-mono text-muted-foreground">{sharpness}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={sharpness}
                                        onChange={(e) => {
                                            setSharpness(Number(e.target.value));
                                            handleSettingChange('sharpness', Number(e.target.value));
                                        }}
                                        className="w-full h-1 bg-background rounded-lg appearance-none cursor-pointer accent-blue-500"
                                    />
                                </div>

                                {/* Grain */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5">
                                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Grain</p>
                                            <Info className="w-3 h-3 text-muted-foreground/50" />
                                        </div>
                                        <span className="text-[10px] font-mono text-muted-foreground">{grain}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={grain}
                                        onChange={(e) => {
                                            setGrain(Number(e.target.value));
                                            handleSettingChange('grain', Number(e.target.value));
                                        }}
                                        className="w-full h-1 bg-background rounded-lg appearance-none cursor-pointer accent-blue-500"
                                    />
                                </div>
                            </>
                        )}

                        {/* Upscale Button */}
                        <div className="space-y-3">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    data.onRun?.(id);
                                }}
                                disabled={data.status === NodeStatus.PROCESSING || data.status === NodeStatus.QUEUED || !data.inputUrl}
                                className="w-full py-3 rounded-xl bg-[#F4B43B] hover:bg-[#FDBF47] disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-xl shadow-yellow-500/10"
                            >
                                {data.status === NodeStatus.PROCESSING ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Upscaling...
                                    </>
                                ) : (
                                    <>
                                        <Crown className="w-4 h-4 fill-current" />
                                        Upscale
                                        <SparklesIcon className="w-3.5 h-3.5 ml-1" />
                                    </>
                                )}
                            </button>
                            {finalWidth > 0 && (
                                <p className="text-[10px] text-white/20 text-center font-mono uppercase tracking-tighter">
                                    Final size: {finalWidth} × {finalHeight}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <Handle
                    type="target"
                    position={Position.Left}
                    id="input"
                    onClick={(e) => data.onHandleClick?.(e, 'input', 'target')}
                    className="!h-3.5 !w-3.5 !border-2 !border-background !bg-[#F4B43B] z-50 transform -translate-x-1.5 cursor-pointer hover:!bg-yellow-400"
                />
                <Handle
                    type="source"
                    position={Position.Right}
                    id="output"
                    onClick={(e) => data.onHandleClick?.(e, 'output', 'source')}
                    className="!h-3.5 !w-3.5 !border-2 !border-background !bg-[#F4B43B] z-50 transform translate-x-1.5 cursor-pointer hover:!bg-yellow-400"
                />
            </BaseNode>

            {/* Fullscreen Modal */}
            {showFullscreen && data.previewUrl && (
                <div
                    className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-12"
                    onClick={() => setShowFullscreen(false)}
                >
                    <img
                        src={data.previewUrl}
                        alt="Upscaled"
                        className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
                    />
                </div>
            )}
        </>
    );
}

function FreepikPlaceholder() {
    return (
        <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-400 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/30 border border-white/20 rotate-3 animate-in fade-in zoom-in duration-500">
            <svg viewBox="0 0 24 24" className="w-10 h-10 text-white fill-current -rotate-3">
                <path d="M12 2l2.4 7.2h7.6l-6.1 4.5 2.3 7.3-6.2-4.5-6.2 4.5 2.3-7.3-6.1-4.5h7.6z" />
            </svg>
        </div>
    );
}

function SparklesIcon({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
            <path d="m5 3 1 1" />
            <path d="m19 3-1 1" />
            <path d="m5 21 1-1" />
            <path d="m19 21-1-1" />
        </svg>
    )
}

