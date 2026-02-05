'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    X, Search, Heart, Clock, Upload, Download, Folder,
    Camera, Video as VideoIcon, Filter, Plus, Check
} from 'lucide-react';
import { workflowApi } from './services/workflowApi';
import { MediaItem, MediaFolder } from './types';
import { cn } from '@/lib/utils';

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
            const response = await workflowApi.getMediaLibrary(activeFolder);
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
            alert('Please select an image file');
            return;
        }
        if (mediaType === 'video' && !file.type.startsWith('video/')) {
            alert('Please select a video file');
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);

        try {
            const uploadedMedia = await workflowApi.uploadMedia(file, (progress) => {
                setUploadProgress(progress);
            });

            if (uploadedMedia) {
                setItems(prev => [uploadedMedia, ...prev]);
                setSelectedItem(uploadedMedia);
            }
        } catch (error) {
            console.error('Upload failed:', error);
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
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-4xl h-[600px] bg-[#151619] rounded-2xl border border-white/10 shadow-2xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                    <h2 className="text-lg font-semibold text-white">Add media</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar - Folders */}
                    <div className="w-48 border-r border-white/5 p-4 space-y-1">
                        {/* Workspace Selector */}
                        <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 text-sm text-white mb-4">
                            <div className="w-6 h-6 rounded bg-orange-500 flex items-center justify-center text-xs font-bold">P</div>
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
                                            ? "bg-white/10 text-white"
                                            : "text-white/60 hover:text-white hover:bg-white/5"
                                    )}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span>{folder.name}</span>
                                </button>
                            );
                        })}

                        <div className="pt-4 border-t border-white/5 mt-4">
                            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors">
                                <Search className="w-4 h-4" />
                                <span>Find inspiration</span>
                            </button>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 flex flex-col">
                        {/* Search Bar */}
                        <div className="p-4 border-b border-white/5 flex items-center gap-4">
                            <div className="flex-1">
                                <span className="text-sm font-medium text-white capitalize">{activeFolder}</span>
                                <span className="text-xs text-white/40 ml-2">February 2026</span>
                            </div>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Search..."
                                    className="w-48 pl-9 pr-3 py-1.5 bg-black/20 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/20"
                                />
                            </div>
                            <button className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                                <Filter className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Media Grid */}
                        <div className="flex-1 overflow-y-auto p-4">
                            {loading ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                </div>
                            ) : filteredItems.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center">
                                    <Upload className="w-12 h-12 text-white/20 mb-4" />
                                    <p className="text-sm text-white/40">No media found</p>
                                    <p className="text-xs text-white/20 mt-1">Upload some files to get started</p>
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
                                                    ? "border-cyan-500 ring-2 ring-cyan-500/30"
                                                    : "border-transparent hover:border-white/20"
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
                                                <div className="absolute top-2 right-2 w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center">
                                                    <Check className="w-4 h-4 text-white" />
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
                    <div className="w-64 border-l border-white/5 p-4 flex flex-col">
                        {/* Drop Zone */}
                        <div
                            className={cn(
                                "flex-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-4 transition-colors",
                                dragOver
                                    ? "border-cyan-500 bg-cyan-500/10"
                                    : "border-white/10"
                            )}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                        >
                            {isUploading ? (
                                <>
                                    <div className="w-16 h-16 rounded-full border-4 border-white/10 flex items-center justify-center relative">
                                        <div
                                            className="absolute inset-0 rounded-full border-4 border-cyan-500 border-t-transparent animate-spin"
                                        />
                                        <span className="text-sm font-medium text-white">{uploadProgress}%</span>
                                    </div>
                                    <p className="text-xs text-white/40">Uploading...</p>
                                </>
                            ) : (
                                <>
                                    <Upload className="w-8 h-8 text-white/30" />
                                    <div className="text-center">
                                        <p className="text-sm text-white/60">Drop an image or upload your</p>
                                        <p className="text-sm text-white/60">own media</p>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Upload Options */}
                        <div className="mt-4 space-y-2">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-white transition-colors"
                            >
                                <Upload className="w-4 h-4" />
                                Upload media
                            </button>
                            <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-white transition-colors">
                                <Camera className="w-4 h-4" />
                                Take photo
                            </button>
                            <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-white transition-colors">
                                <VideoIcon className="w-4 h-4" />
                                Record video
                            </button>
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

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm text-white/60 hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            if (selectedItem) {
                                onSelect(selectedItem);
                                onClose();
                            }
                        }}
                        disabled={!selectedItem}
                        className={cn(
                            "px-6 py-2 rounded-lg text-sm font-medium transition-all",
                            selectedItem
                                ? "bg-cyan-600 text-white hover:bg-cyan-500"
                                : "bg-white/10 text-white/30 cursor-not-allowed"
                        )}
                    >
                        Add media
                    </button>
                </div>
            </div>
        </div>
    );
}
