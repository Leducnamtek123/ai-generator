'use client';

import React, { useState, useRef, useCallback } from 'react';
import { BaseNode } from './BaseNode';
import { Handle, Position, useUpdateNodeInternals } from '@xyflow/react';
import { Upload, X, Plus, Loader2, Link2, FolderOpen } from 'lucide-react';
import { NodeToolbar } from '../NodeToolbar';
import { cn } from '@/lib/utils';

interface MediaNodeProps {
    id: string;
    data: {
        label?: string;
        mediaType?: 'image' | 'video' | 'any';
        mediaUrl?: string;
        mediaName?: string;
        mediaThumbnail?: string;
        status?: 'idle' | 'uploading' | 'error' | 'success';
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
        let thumbnail = url;
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
            >
                <div className={cn("bg-[#151619] border-t border-white/5 relative group", data.isPreview ? "w-[120px] min-h-[60px]" : "w-[300px] min-h-[100px]")}>
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
                        </div>
                    ) : (
                        <div className={cn("aspect-video w-full flex flex-col items-center justify-center p-4 bg-black/20", data.isPreview && "p-2")}>
                            {isUploading ? (
                                <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                            ) : (
                                <Upload className={cn("text-white/20", data.isPreview ? "w-4 h-4" : "w-8 h-8")} />
                            )}
                        </div>
                    )}
                </div>

                <Handle
                    type="source"
                    position={Position.Right}
                    className={cn("!h-3 !w-3 !border-2 !border-[#0B0C0E] !bg-cyan-500 z-50 transform translate-x-1.5", data.isPreview && "scale-50 opacity-0")}
                />
            </BaseNode>
        </>
    );
}
