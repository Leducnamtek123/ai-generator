'use client';

import React, { useState } from 'react';
import { BaseNode } from './BaseNode';
import { Handle, Position } from '@xyflow/react';
import { Camera, RefreshCw, Loader2, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RotateCw, Image as ImageIcon } from 'lucide-react';
import { NodeToolbar } from '../NodeToolbar';
import { cn } from '@/lib/utils';
import { useUpdateNodeInternals } from '@xyflow/react';
import { ExecutionMode, NodeStatus, CameraAngle } from '../types';

interface CameraNodeProps {
    id: string;
    data: {
        label?: string;
        angle?: CameraAngle;
        customRotation?: { x: number; y: number; z: number };
        status?: NodeStatus;
        inputImageUrl?: string;
        previewUrl?: string;
        onDelete?: (id: string) => void;
        onRun?: (id: string, mode?: ExecutionMode) => void;
        onSettingsChange?: (id: string, settings: any) => void;
        onDuplicate?: () => void;
        onSettings?: () => void;
        onHandleClick?: (event: any, handleId: string, handleType: 'source' | 'target') => void;
        isPreview?: boolean;
    };
    selected?: boolean;
}

const ANGLES = [
    { id: CameraAngle.FRONT, name: 'Low Angle', icon: ArrowUp },
    { id: CameraAngle.SIDE, name: 'Eye Level', icon: ArrowRight },
    { id: CameraAngle.TOP, name: 'High Angle', icon: ArrowDown },
    { id: CameraAngle.BOTTOM, name: 'Bird\'s Eye', icon: ArrowDown },
    { id: CameraAngle.THREE_QUARTER, name: 'Drone View', icon: RotateCw },
];

export function CameraNode({ id, data, selected }: CameraNodeProps) {
    const [angle, setAngle] = useState<CameraAngle>(data.angle || CameraAngle.FRONT);
    const [rotation, setRotation] = useState(data.customRotation || { x: 0, y: 0, z: 0 });
    const updateNodeInternals = useUpdateNodeInternals();

    const handleAngleSelect = (newAngle: CameraAngle) => {
        setAngle(newAngle);
        data.onSettingsChange?.(id, { angle: newAngle });
    };

    const handleMediaLoad = () => {
        updateNodeInternals(id);
    };

    const isProcessing = data.status === NodeStatus.PROCESSING || data.status === NodeStatus.QUEUED;

    return (
        <div className="relative">
            {selected && !data.isPreview && (
                <NodeToolbar
                    nodeId={id}
                    onRun={() => data.onRun?.(id, ExecutionMode.WORKFLOW)}
                    onRunLocal={() => data.onRun?.(id, ExecutionMode.LOCAL)}
                    runDisabled={isProcessing || !data.inputImageUrl}
                    onDelete={() => data.onDelete?.(id)}
                    onDuplicate={data.onDuplicate}
                    onSettings={data.onSettings}
                />
            )}

            <BaseNode
                id={id}
                title="Camera Control"
                selected={selected}
                status={data.status}
                onDelete={data.onDelete}
                isPreview={data.isPreview}
            >
                <div className={cn("bg-muted/30 overflow-hidden flex", data.isPreview ? "w-[140px] flex-col" : "w-[400px]")}>

                    {/* Visualizer / Preview (Left Side) */}
                    <div className={cn(
                        "relative bg-background flex items-center justify-center overflow-hidden border-r border-border",
                        data.isPreview ? "w-full h-[80px] border-r-0 border-b" : "w-[200px] h-[240px]"
                    )}>
                        {isProcessing && (
                            <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center">
                                <Loader2 className="w-6 h-6 text-white animate-spin mb-2" />
                                <span className="text-[10px] text-white/60 uppercase tracking-widest">Adjusting...</span>
                            </div>
                        )}

                        {data.previewUrl ? (
                            <img
                                src={data.previewUrl}
                                alt="Preview"
                                className="w-full h-full object-cover"
                                onLoad={handleMediaLoad}
                            />
                        ) : data.inputImageUrl ? (
                            <img
                                src={data.inputImageUrl}
                                alt="Input"
                                className="w-full h-full object-cover opacity-50 grayscale"
                                onLoad={handleMediaLoad}
                            />
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-muted-foreground/30">
                                <Camera className="w-8 h-8" />
                                <span className="text-[10px]">No Image</span>
                            </div>
                        )}

                        {/* Angle Overlay Indicator */}
                        <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded text-[9px] text-white/80 font-mono">
                            {ANGLES.find(a => a.id === angle)?.name}
                        </div>
                    </div>

                    {/* Controls (Right Side) */}
                    {!data.isPreview && (
                        <div className="flex-1 p-4 flex flex-col gap-4">
                            <div className="space-y-2">
                                <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Presets</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {ANGLES.map((a) => {
                                        const Icon = a.icon;
                                        return (
                                            <button
                                                key={a.id}
                                                onClick={() => handleAngleSelect(a.id)}
                                                className={cn(
                                                    "flex items-center gap-2 px-2 py-2 rounded-lg border transition-all text-xs",
                                                    angle === a.id
                                                        ? "bg-accent border-border text-foreground"
                                                        : "bg-transparent border-transparent text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                                                )}
                                            >
                                                <Icon className="w-3.5 h-3.5" />
                                                {a.name}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="mt-auto">
                                <button
                                    onClick={() => data.onRun?.(id, ExecutionMode.LOCAL)}
                                    disabled={isProcessing || !data.inputImageUrl}
                                    className="w-full py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-xs text-white font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                                    Update View
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <Handle
                    type="target"
                    position={Position.Left}
                    id="input"
                    className={cn(
                        "!w-3 !h-3 !border-2 !border-background !bg-blue-500 z-50 transform -translate-x-1.5",
                        data.isPreview && "scale-50 opacity-0"
                    )}
                />

                <Handle
                    type="source"
                    position={Position.Right}
                    className={cn(
                        "!w-3 !h-3 !border-2 !border-background !bg-foreground/50 z-50 transform translate-x-1.5",
                        data.isPreview && "scale-50 opacity-0"
                    )}
                />
            </BaseNode>
        </div>
    );
}
