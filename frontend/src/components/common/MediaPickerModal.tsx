'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Search, Heart, Clock, Upload, Download, Folder,
    Camera, Video as VideoIcon, Filter, Check
} from 'lucide-react';
import { mediaApi } from '@/services/mediaApi';
import { MediaItem, MediaFolder } from '@/types/media';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/ui/dialog';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';

interface MediaPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (media: MediaItem) => void;
    mediaType?: 'any' | 'image' | 'video';
}

export function MediaPickerModal({
    isOpen,
    onClose,
    onSelect,
    mediaType = 'any'
}: MediaPickerModalProps) {
    const [search, setSearch] = useState('');
    const [activeFolder, setActiveFolder] = useState<string>('uploads');
    const [items, setItems] = useState<MediaItem[]>([]);
    const [folders, setFolders] = useState<MediaFolder[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [dragOver, setDragOver] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Load media library
    useEffect(() => {
        if (isOpen) {
            loadMedia();
        }
    }, [isOpen, activeFolder]);

    const loadMedia = async () => {
        setLoading(true);
        try {
            const response = await mediaApi.getMediaLibrary(activeFolder);
            setItems(response.items);
            setFolders(response.folders);
        } catch (error) {
            console.error('Failed to load media:', error);
        }
        setLoading(false);
    };

    // Filter items by type and search
    const filteredItems = items.filter(item => {
        // Type filter
        if (mediaType !== 'any' && item.type !== mediaType) {
            return false;
        }
        // Search filter
        if (search && !item.name.toLowerCase().includes(search.toLowerCase())) {
            return false;
        }
        return true;
    });

    // Handle file upload
    const handleFileUpload = useCallback(async (files: FileList | null) => {
        if (!files || files.length === 0) return;

        const file = files[0];

        // Validate file type
        if (mediaType === 'image' && !file.type.startsWith('image/')) {
            toast.error('Please select an image file');
            return;
        }
        if (mediaType === 'video' && !file.type.startsWith('video/')) {
            toast.error('Please select a video file');
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);

        try {
            const uploadedMedia = await mediaApi.uploadMedia(file, (progress) => {
                setUploadProgress(progress);
            });

            if (uploadedMedia) {
                setItems(prev => [uploadedMedia, ...prev]);
                setSelectedItem(uploadedMedia);
            }
        } catch (error) {
            console.error('Upload failed:', error);
            toast.error('Upload failed');
        }

        setIsUploading(false);
        setUploadProgress(0);
    }, [mediaType]);

    // Handle drag and drop
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = () => {
        setDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        handleFileUpload(e.dataTransfer.files);
    };

    // Folder icon mapping
    const getFolderIcon = (iconType: string) => {
        switch (iconType) {
            case 'favorites': return Heart;
            case 'history': return Clock;
            case 'uploads': return Upload;
            case 'downloads': return Download;
            default: return Folder;
        }
    };

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-4xl h-[600px] p-0 shadow-2xl flex flex-col overflow-hidden gap-0">
                <DialogHeader className="px-6 py-4 border-b border-border space-y-0">
                    <DialogTitle className="text-lg font-semibold">Add media</DialogTitle>
                </DialogHeader>

                {/* Content */}
                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar - Folders */}
                    <div className="w-48 border-r border-border p-4 space-y-1">
                        {/* Workspace Selector */}
                        <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-accent text-sm mb-4">
                            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground">P</div>
                            <span>Personal</span>
                        </button>

                        {/* Folder List */}
                        {folders.map(folder => {
                            const Icon = getFolderIcon(folder.icon);
                            return (
                                <button
                                    key={folder.id}
                                    onClick={() => setActiveFolder(folder.id)}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-left",
                                        activeFolder === folder.id
                                            ? "bg-accent text-accent-foreground"
                                            : "text-muted-foreground hover:text-foreground hover:bg-accent"
                                    )}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span>{folder.name}</span>
                                </button>
                            );
                        })}

                        <div className="pt-4 border-t border-border mt-4">
                            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                                <Search className="w-4 h-4" />
                                <span>Find inspiration</span>
                            </button>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 flex flex-col">
                        {/* Search Bar */}
                        <div className="p-4 border-b border-border flex items-center gap-4">
                            <div className="flex-1">
                                <span className="text-sm font-medium capitalize">{activeFolder}</span>
                                <span className="text-xs text-muted-foreground ml-2">February 2026</span>
                            </div>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Search..."
                                    className="w-48 pl-9 pr-3 py-1 h-auto"
                                />
                            </div>
                            <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors">
                                <Filter className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Media Grid */}
                        <div className="flex-1 overflow-y-auto p-4">
                            {loading ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="w-8 h-8 border-2 border-muted border-t-primary rounded-full animate-spin" />
                                </div>
                            ) : filteredItems.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center">
                                    <Upload className="w-12 h-12 text-muted-foreground/30 mb-4" />
                                    <p className="text-sm text-muted-foreground">No media found</p>
                                    <p className="text-xs text-muted-foreground/60 mt-1">Upload some files to get started</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-4 gap-3">
                                    {filteredItems.map(item => (
                                        <button
                                            key={item.id}
                                            onClick={() => setSelectedItem(item)}
                                            className={cn(
                                                "aspect-square rounded-lg overflow-hidden border-2 transition-all relative group",
                                                selectedItem?.id === item.id
                                                    ? "border-primary ring-2 ring-primary/30"
                                                    : "border-transparent hover:border-border"
                                            )}
                                        >
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={item.thumbnailUrl}
                                                alt={item.name}
                                                className="w-full h-full object-cover"
                                            />

                                            {/* Video indicator */}
                                            {item.type === 'video' && (
                                                <div className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-black/60 rounded text-[10px] text-white flex items-center gap-1">
                                                    <VideoIcon className="w-3 h-3" />
                                                    {item.duration}s
                                                </div>
                                            )}

                                            {/* Selection indicator */}
                                            {selectedItem?.id === item.id && (
                                                <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                                                    <Check className="w-4 h-4 text-primary-foreground" />
                                                </div>
                                            )}

                                            {/* Hover overlay */}
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Panel - Upload Area */}
                    <div className="w-64 border-l border-border p-4 flex flex-col">
                        {/* Drop Zone */}
                        <div
                            className={cn(
                                "flex-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-4 transition-colors",
                                dragOver
                                    ? "border-primary bg-primary/10"
                                    : "border-border"
                            )}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                        >
                            {isUploading ? (
                                <>
                                    <div className="w-16 h-16 rounded-full border-4 border-muted flex items-center justify-center relative">
                                        <div
                                            className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"
                                        />
                                        <span className="text-sm font-medium">{uploadProgress}%</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">Uploading...</p>
                                </>
                            ) : (
                                <>
                                    <Upload className="w-8 h-8 text-muted-foreground/50" />
                                    <div className="text-center">
                                        <p className="text-sm text-muted-foreground">Drop an image or upload your</p>
                                        <p className="text-sm text-muted-foreground">own media</p>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Upload Options */}
                        <div className="mt-4 space-y-2">
                            <Button
                                variant="secondary"
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full gap-2"
                            >
                                <Upload className="w-4 h-4" />
                                Upload media
                            </Button>
                            <Button variant="secondary" className="w-full gap-2">
                                <Camera className="w-4 h-4" />
                                Take photo
                            </Button>
                            <Button variant="secondary" className="w-full gap-2">
                                <VideoIcon className="w-4 h-4" />
                                Record video
                            </Button>
                        </div>

                        {/* Hidden file input */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept={mediaType === 'video' ? 'video/*' : mediaType === 'image' ? 'image/*' : 'image/*,video/*'}
                            onChange={e => handleFileUpload(e.target.files)}
                            className="hidden"
                        />
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={() => {
                            if (selectedItem) {
                                onSelect(selectedItem);
                                onClose();
                            }
                        }}
                        disabled={!selectedItem}
                    >
                        Add media
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
