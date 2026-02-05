import React, { useState } from 'react';
import { BaseNode } from './BaseNode';
import { Handle, Position, useUpdateNodeInternals } from '@xyflow/react';
import { Scan, Loader2, Play, Download, ZoomIn, Maximize2, Lock, ArrowUpRight, RefreshCw, Settings } from 'lucide-react';
import { NodeToolbar } from '../NodeToolbar';
import { ExecutionMode, NodeStatus, UpscaleFactor } from '../types';

interface UpscaleNodeProps {
    id: string;
    data: {
        label?: string;
        inputUrl?: string;
        previewUrl?: string;
        scale?: UpscaleFactor;
        status?: NodeStatus;
        onDelete?: (id: string) => void;
        onRun?: (id: string, mode?: ExecutionMode) => void;
        onDuplicate?: () => void;
        onSettings?: () => void;
        onReplace?: () => void;
        onReference?: () => void;
        onHandleClick?: (event: any, handleId: string, handleType: 'source' | 'target') => void;
    };
    selected?: boolean;
}

export function UpscaleNode({ id, data, selected }: UpscaleNodeProps) {
    const [scale, setScale] = useState<UpscaleFactor>(data.scale || UpscaleFactor.TWO_X);
    const [showFullscreen, setShowFullscreen] = useState(false);
    const updateNodeInternals = useUpdateNodeInternals();
    const [mediaDimensions, setMediaDimensions] = useState<{ width: number, height: number } | null>(null);

    const handleMediaLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const target = e.target as HTMLImageElement;
        setMediaDimensions({ width: target.naturalWidth, height: target.naturalHeight });
        updateNodeInternals(id);
    };

    const handleDownload = () => {
        if (data.previewUrl) {
            const link = document.createElement('a');
            link.href = data.previewUrl;
            link.download = `upscaled-${scale}-${id}-${Date.now()}.png`;
            link.click();
        }
    };

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
                <div className="w-[300px] bg-[#0B0C0E]">
                    {/* Preview Area - Adaptive */}
                    <div className="w-full bg-black/40 flex items-center justify-center overflow-hidden relative group min-h-[160px]">
                        {data.status === NodeStatus.PROCESSING || data.status === NodeStatus.QUEUED ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md z-10 animate-in fade-in duration-300">
                                <div className="relative">
                                    <div className="w-16 h-16 border-4 border-purple-500/20 rounded-full" />
                                    <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-purple-500 rounded-full animate-spin" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse" />
                                    </div>
                                </div>
                                <span className="mt-4 text-sm text-purple-400 font-bold uppercase tracking-widest animate-pulse">
                                    {data.status === NodeStatus.QUEUED ? 'Queued' : `Upscaling to ${scale}`}
                                </span>
                                <span className="mt-1 text-[10px] text-white/30 italic">AI Enhancement in progress</span>
                            </div>
                        ) : null}

                        {data.previewUrl ? (
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
                                        onClick={handleDownload}
                                        className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                                        title="Download"
                                    >
                                        <Download className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => setShowFullscreen(true)}
                                        className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                                        title="Fullscreen"
                                    >
                                        <Maximize2 className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Scale Badge */}
                                <div className="absolute top-3 left-3 px-2 py-1 bg-purple-500/20 border border-purple-500/30 rounded text-[10px] text-purple-400 font-medium flex items-center gap-1">
                                    <ZoomIn className="w-3 h-3" />
                                    {scale} Upscaled
                                </div>

                                <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/60 rounded text-[9px] text-white/70 backdrop-blur-sm">
                                    {mediaDimensions ? `${mediaDimensions.width}x${mediaDimensions.height}` : 'Upscaled'}
                                </div>
                            </>
                        ) : data.inputUrl ? (
                            <>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={data.inputUrl}
                                    alt="Input"
                                    className="w-full h-auto block object-cover opacity-50"
                                // We could adjust height based on input too, but usually preview takes precedence
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-center">
                                        <ZoomIn className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                                        <span className="text-sm text-white/60">Ready to upscale</span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center gap-3 text-white/20 py-12">
                                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-dashed border-white/10 flex items-center justify-center">
                                    <Scan className="h-8 w-8" />
                                </div>
                                <span className="text-sm">Waiting for image...</span>
                                <span className="text-[10px] text-white/30">Connect a Generator node</span>
                            </div>
                        )}
                    </div>

                    {/* Controls */}
                    <div className="p-3 border-t border-white/10 bg-[#151619] space-y-3">
                        {/* Scale Selection */}
                        <div className="space-y-2">
                            <p className="text-[10px] text-white/30 uppercase tracking-wider">Scale Factor</p>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => setScale(UpscaleFactor.TWO_X)}
                                    className={`p-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${scale === UpscaleFactor.TWO_X
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-white/5 text-white/60 hover:bg-white/10'
                                        }`}
                                >
                                    <ZoomIn className="w-4 h-4" />
                                    2x
                                </button>
                                <button
                                    className="p-2.5 rounded-lg text-sm font-medium bg-white/5 text-white/30 cursor-not-allowed flex items-center justify-center gap-2"
                                    title="Requires Pro plan"
                                >
                                    <Lock className="w-3 h-3" />
                                    4x Pro
                                </button>
                            </div>
                        </div>

                        {/* Run Button */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                data.onRun?.(id);
                            }}
                            disabled={data.status === NodeStatus.PROCESSING || data.status === NodeStatus.QUEUED || !data.inputUrl}
                            className="w-full py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-500/20"
                        >
                            {data.status === NodeStatus.PROCESSING ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Upscaling...
                                </>
                            ) : (
                                <>
                                    <Scan className="w-4 h-4" />
                                    Upscale {scale}
                                </>
                            )}
                        </button>
                    </div>
                </div>

                <Handle
                    type="target"
                    position={Position.Left}
                    id="input"
                    onClick={(e) => data.onHandleClick?.(e, 'input', 'target')}
                    className="!h-3 !w-3 !border-2 !border-[#0B0C0E] !bg-purple-500 z-50 transform -translate-x-1.5 cursor-pointer hover:!bg-purple-400"
                />
                <Handle
                    type="source"
                    position={Position.Right}
                    id="output"
                    onClick={(e) => data.onHandleClick?.(e, 'output', 'source')}
                    className="!h-3 !w-3 !border-2 !border-[#0B0C0E] !bg-purple-500 z-50 transform translate-x-1.5 cursor-pointer hover:!bg-purple-400"
                />
            </BaseNode>

            {/* Fullscreen Modal */}
            {showFullscreen && data.previewUrl && (
                <div
                    className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center cursor-zoom-out"
                    onClick={() => setShowFullscreen(false)}
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={data.previewUrl}
                        alt="Upscaled"
                        className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
                    />
                </div>
            )}
        </>
    );
}
