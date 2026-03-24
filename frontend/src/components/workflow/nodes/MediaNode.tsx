'use client';

import React, { useState, useRef, useCallback } from 'react';
import { BaseNode } from './BaseNode';
import { Handle, Position, useUpdateNodeInternals } from '@xyflow/react';
import { Upload, Plus, Loader2, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NodeToolbar } from '../NodeToolbar';
import { cn } from '@/lib/utils';
import { NodeStatus } from '../types';

interface MediaNodeProps {
    id: string;
    data: {
        label?: string;
        mediaType?: 'image' | 'video' | 'any';
        mediaUrl?: string;
        mediaName?: string;
        mediaThumbnail?: string;
        status?: NodeStatus;
        onDelete?: (id: string) => void;
        onMediaChange?: (id: string, url: string, name: string, thumbnail?: string) => void;
        onHandleClick?: (event: any, handleId: string, handleType: 'source' | 'target') => void;
        isPreview?: boolean;
    };
    selected?: boolean;
}

export function MediaNode({ id, data, selected }: MediaNodeProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [showUrlInput, setShowUrlInput] = useState(false);
    const [urlInput, setUrlInput] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const mediaType = data.mediaType || 'any';

    const acceptTypes = {
        image: 'image/*',
        video: 'video/*',
        any: 'image/*,video/*',
    };

    const handleFileSelect = useCallback(async (file: File) => {
        setIsUploading(true);
        const url = URL.createObjectURL(file);
        const thumbnail = url;
        await new Promise(r => setTimeout(r, 1000));
        data.onMediaChange?.(id, url, file.name, thumbnail);
        setIsUploading(false);
    }, [id, data]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFileSelect(file);
    };

    const isVideo = data.mediaUrl?.includes('video') || data.mediaName?.match(/\.(mp4|webm|mov|avi)$/i);

    const updateNodeInternals = useUpdateNodeInternals();
    const handleMediaLoad = (e: React.SyntheticEvent<HTMLImageElement | HTMLVideoElement>) => {
        updateNodeInternals(id);
    };

    const handleMediaClick = () => {
        if (!data.mediaUrl || data.isPreview) return;
        if (isVideo) {
            (data as any).onOpenVideoEditor?.(data.mediaUrl);
        } else {
            (data as any).onOpenImageEditor?.(data.mediaUrl);
        }
    };

    const sideIcons = (
        <div className="flex flex-col gap-1.5 py-2">
            <div className={cn(
                "w-6 h-6 rounded-md flex items-center justify-center transition-colors",
                isVideo ? "bg-white/5 text-muted-foreground" : "bg-blue-500/20 text-blue-400"
            )}>
                <Upload className="w-3.5 h-3.5" />
            </div>
            <div className={cn(
                "w-6 h-6 rounded-md flex items-center justify-center transition-colors",
                isVideo ? "bg-green-500/20 text-green-400" : "bg-white/5 text-muted-foreground"
            )}>
                <Plus className="w-3.5 h-3.5" />
            </div>
        </div>
    );

    return (
        <>
            {selected && !data.isPreview && (
                <NodeToolbar
                    nodeId={id}
                    onDelete={() => data.onDelete?.(id)}
                />
            )}

            <BaseNode
                id={id}
                title={data.label || (mediaType === 'image' ? 'Image' : mediaType === 'video' ? 'Video' : 'Media')}
                selected={selected}
                status={data.status}
                onDelete={data.onDelete}
                isPreview={data.isPreview}
                sideActions={sideIcons}
            >
                <div
                    onClick={handleMediaClick}
                    className={cn(
                        "relative group cursor-pointer",
                        data.isPreview ? "w-[120px] min-h-[60px]" : "w-[300px] min-h-[100px]"
                    )}
                >
                    {data.mediaUrl ? (
                        <div className="relative">
                            {isVideo ? (
                                <video
                                    src={data.mediaUrl}
                                    className="w-full h-auto block object-cover"
                                    muted
                                    loop
                                    autoPlay
                                    playsInline
                                    onLoadedData={handleMediaLoad}
                                />
                            ) : (
                                <img
                                    src={data.mediaUrl}
                                    alt={data.mediaName || 'Uploaded media'}
                                    className="w-full h-auto block object-cover"
                                    onLoad={handleMediaLoad}
                                />
                            )}

                            {/* Hover Edit Overlay */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="gap-2 bg-background/20 backdrop-blur-sm border-white/20 text-white hover:bg-background/40"
                                    onClick={handleMediaClick}
                                >
                                    <Wand2 className="w-4 h-4" />
                                    Edit {isVideo ? 'Clip' : 'Image'}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className={cn("aspect-video w-full flex flex-col items-center justify-center p-4 bg-muted/50 border-2 border-dashed border-transparent hover:border-primary/50 transition-colors", data.isPreview && "p-2")}>
                            {isUploading ? (
                                <Loader2 className="w-4 h-4 text-primary animate-spin" />
                            ) : (
                                <Upload className={cn("text-muted-foreground", data.isPreview ? "w-4 h-4" : "w-8 h-8")} />
                            )}
                        </div>
                    )}
                </div>

                <Handle
                    type="source"
                    position={Position.Right}
                    onClick={(e) => data.onHandleClick?.(e, 'media-output', 'source')}
                    className={cn("!h-3 !w-3 !border-2 !border-background !bg-cyan-500 z-50 transform translate-x-1.5", data.isPreview && "scale-50 opacity-0")}
                >
                    {/* Handle Icon indicator */}
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        {isVideo ? <Plus className="w-3 h-3 text-muted-foreground" /> : <Upload className="w-3 h-3 text-muted-foreground" />}
                    </div>
                </Handle>
            </BaseNode>
        </>
    );
}
