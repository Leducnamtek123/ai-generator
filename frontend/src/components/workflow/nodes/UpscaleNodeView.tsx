'use client';

import Image from 'next/image';
import { Handle, Position } from '@xyflow/react';
import { Loader2, Download, Maximize2, Wand2, Crown, ChevronDown, Info } from 'lucide-react';
import { BaseNode } from './BaseNode';
import { NodeToolbar } from '../NodeToolbar';
import { cn } from '@/lib/utils';
import {
    ExecutionMode,
    NodeStatus,
    UpscaleFactor,
    UpscaleMode,
    UpscaleModel,
    UpscalePreset,
} from '../types';

type UpscaleNodeViewProps = {
    id: string;
    data: {
        label?: string;
        inputUrl?: string;
        previewUrl?: string;
        status?: NodeStatus;
        onDelete?: (id: string) => void;
        onRun?: (id: string, mode?: ExecutionMode) => void;
        onDuplicate?: () => void;
        onSettings?: () => void;
        onReplace?: () => void;
        onReference?: () => void;
        onOpenImageEditor?: (url?: string | null) => void;
        onHandleClick?: (event: React.MouseEvent, handleId: string, handleType: 'source' | 'target') => void;
    };
    selected?: boolean;
    activeTab: UpscaleMode;
    scale: UpscaleFactor;
    model: UpscaleModel;
    preset: UpscalePreset;
    sharpness: number;
    grain: number;
    showFullscreen: boolean;
    mediaDimensions: { width: number; height: number } | null;
    isFinished: boolean;
    isProcessing: boolean;
    finalWidth: number;
    finalHeight: number;
    onSetTab: (tab: UpscaleMode) => void;
    onSetModel: (model: UpscaleModel) => void;
    onSetPreset: (preset: UpscalePreset) => void;
    onSetScale: (scale: UpscaleFactor) => void;
    onSetSharpness: (value: number) => void;
    onSetGrain: (value: number) => void;
    onSetFullscreen: (open: boolean) => void;
    onMediaLoad: (e: React.SyntheticEvent<HTMLImageElement>) => void;
    onDownload: () => void;
    onSettingChange: (key: string, value: unknown) => void;
};

export function UpscaleNodeView({
    id,
    data,
    selected,
    activeTab,
    scale,
    model,
    preset,
    sharpness,
    grain,
    showFullscreen,
    mediaDimensions,
    isFinished,
    isProcessing,
    finalWidth,
    finalHeight,
    onSetTab,
    onSetModel,
    onSetPreset,
    onSetScale,
    onSetSharpness,
    onSetGrain,
    onSetFullscreen,
    onMediaLoad,
    onDownload,
    onSettingChange,
}: UpscaleNodeViewProps) {
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

            <BaseNode id={id} title="AI Upscaler" selected={selected} status={data.status} onDelete={data.onDelete}>
                <div className="w-[320px] bg-muted/30">
                    <div className="flex p-1 bg-background border-b border-border">
                        <button
                            onClick={() => {
                                onSetTab(UpscaleMode.CREATIVE);
                                onSettingChange('enhanceMode', UpscaleMode.CREATIVE);
                            }}
                            className={cn(
                                'flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all uppercase tracking-wider',
                                activeTab === UpscaleMode.CREATIVE
                                    ? 'bg-accent text-accent-foreground'
                                    : 'text-muted-foreground hover:text-foreground',
                            )}
                        >
                            Creative
                        </button>
                        <button
                            onClick={() => {
                                onSetTab(UpscaleMode.PRECISION);
                                onSettingChange('enhanceMode', UpscaleMode.PRECISION);
                            }}
                            className={cn(
                                'flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all uppercase tracking-wider',
                                activeTab === UpscaleMode.PRECISION
                                    ? 'bg-accent text-accent-foreground'
                                    : 'text-muted-foreground hover:text-foreground',
                            )}
                        >
                            Precision
                        </button>
                    </div>

                    <div className="w-full bg-background flex items-center justify-center overflow-hidden relative group min-h-[160px]">
                        {isProcessing && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-950/60 backdrop-blur-md z-10 transition-all">
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
                                <div className="relative w-full aspect-video">
                                    <Image
                                        src={data.previewUrl!}
                                        alt="Upscaled"
                                        fill
                                        className="object-cover"
                                        sizes="(max-width: 1024px) 100vw, 320px"
                                        onLoad={onMediaLoad}
                                    />
                                </div>

                                <div className="absolute inset-0 bg-gray-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                    <button
                                        onClick={() => data.onOpenImageEditor?.(data.previewUrl)}
                                        className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                                    >
                                        <Wand2 className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={onDownload}
                                        className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                                    >
                                        <Download className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => onSetFullscreen(true)}
                                        className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                                    >
                                        <Maximize2 className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="absolute top-3 left-3 px-2 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded text-[10px] text-yellow-500 font-medium flex items-center gap-1">
                                    <Crown className="w-3 h-3" />
                                    {scale}x Upscaled
                                </div>

                                <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-gray-950/60 rounded text-[9px] text-white/70 backdrop-blur-sm uppercase">
                                    {mediaDimensions ? `${mediaDimensions.width}x${mediaDimensions.height}` : 'Finished'}
                                </div>
                            </>
                        ) : (
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

                    <div className="p-4 bg-muted/30 space-y-5">
                        {activeTab === UpscaleMode.PRECISION && (
                            <>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-1.5">
                                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Model</p>
                                        <Info className="w-3 h-3 text-muted-foreground/50" />
                                    </div>
                                    <div className="relative">
                                        <select
                                            value={model}
                                            onChange={(e) => onSetModel(e.target.value as UpscaleModel)}
                                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground outline-none appearance-none hover:bg-accent/50 transition-colors"
                                        >
                                            {MODELS.map((m) => (
                                                <option key={m.id} value={m.id}>
                                                    {m.name}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40 pointer-events-none" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Presets</p>
                                    <div className="relative">
                                        <select
                                            value={preset}
                                            onChange={(e) => onSetPreset(e.target.value as UpscalePreset)}
                                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground outline-none appearance-none hover:bg-accent/50 transition-colors"
                                        >
                                            {PRESETS.map((p) => (
                                                <option key={p.id} value={p.id}>
                                                    {p.name}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40 pointer-events-none" />
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="space-y-2">
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Scale Factor</p>
                            <div className="relative">
                                <select
                                    value={scale}
                                    onChange={(e) => onSetScale(Number(e.target.value) as UpscaleFactor)}
                                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground outline-none appearance-none hover:bg-accent/50 transition-colors"
                                >
                                    {SCALE_FACTORS.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.name}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40 pointer-events-none" />
                            </div>
                        </div>

                        {activeTab === UpscaleMode.PRECISION && (
                            <>
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
                                        onChange={(e) => onSetSharpness(Number(e.target.value))}
                                        className="w-full h-1 bg-background rounded-lg appearance-none cursor-pointer accent-blue-500"
                                    />
                                </div>

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
                                        onChange={(e) => onSetGrain(Number(e.target.value))}
                                        className="w-full h-1 bg-background rounded-lg appearance-none cursor-pointer accent-blue-500"
                                    />
                                </div>
                            </>
                        )}

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

            {showFullscreen && data.previewUrl && (
                <div className="fixed inset-0 z-[100] bg-gray-950/90 flex items-center justify-center p-12" onClick={() => onSetFullscreen(false)}>
                    <div className="relative h-full w-full max-w-6xl max-h-[90vh]">
                        <Image src={data.previewUrl!} alt="Upscaled" fill className="object-contain rounded-xl shadow-2xl" sizes="100vw" />
                    </div>
                </div>
            )}
        </>
    );
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

function FreepikPlaceholder() {
    return (
        <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-400 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/30 border border-white/20 rotate-3 animate-in fade-in zoom-in duration-500">
            <svg viewBox="0 0 24 24" className="w-10 h-10 text-white fill-current -rotate-3">
                <path d="M12 2l2.4 7.2h7.6l-6.1 4.5 2.3 7.3-6.2-4.5-6.2 4.5 2.3-7.3-6.1-4.5h7.6z" />
            </svg>
        </div>
    );
}
