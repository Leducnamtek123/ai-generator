'use client';

import React, { useReducer, useCallback, useRef } from 'react';
import Image from 'next/image';
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

type MediaPickerState = {
    search: string;
    activeFolder: string;
    items: MediaItem[];
    folders: MediaFolder[];
    loading: boolean;
    selectedItem: MediaItem | null;
    isUploading: boolean;
    uploadProgress: number;
    dragOver: boolean;
};

type MediaPickerAction =
    | { type: 'setSearch'; search: string }
    | { type: 'setActiveFolder'; activeFolder: string }
    | { type: 'setItems'; items: MediaItem[] }
    | { type: 'setFolders'; folders: MediaFolder[] }
    | { type: 'setLoading'; loading: boolean }
    | { type: 'setSelectedItem'; selectedItem: MediaItem | null }
    | { type: 'setIsUploading'; isUploading: boolean }
    | { type: 'setUploadProgress'; uploadProgress: number }
    | { type: 'setDragOver'; dragOver: boolean }
    | { type: 'prependItem'; item: MediaItem };

const initialState: MediaPickerState = {
    search: '',
    activeFolder: 'uploads',
    items: [],
    folders: [],
    loading: false,
    selectedItem: null,
    isUploading: false,
    uploadProgress: 0,
    dragOver: false,
};

function reducer(state: MediaPickerState, action: MediaPickerAction): MediaPickerState {
    switch (action.type) {
        case 'setSearch':
            return { ...state, search: action.search };
        case 'setActiveFolder':
            return { ...state, activeFolder: action.activeFolder };
        case 'setItems':
            return { ...state, items: action.items };
        case 'setFolders':
            return { ...state, folders: action.folders };
        case 'setLoading':
            return { ...state, loading: action.loading };
        case 'setSelectedItem':
            return { ...state, selectedItem: action.selectedItem };
        case 'setIsUploading':
            return { ...state, isUploading: action.isUploading };
        case 'setUploadProgress':
            return { ...state, uploadProgress: action.uploadProgress };
        case 'setDragOver':
            return { ...state, dragOver: action.dragOver };
        case 'prependItem':
            return { ...state, items: [action.item, ...state.items], selectedItem: action.item };
        default:
            return state;
    }
}

export function MediaPickerModal({
    isOpen,
    onClose,
    onSelect,
    mediaType = 'any'
}: MediaPickerModalProps) {
    const [state, dispatch] = useReducer(reducer, initialState);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const loadMedia = useCallback(async (folderId: string) => {
        dispatch({ type: 'setLoading', loading: true });
        try {
            const response = await mediaApi.getMediaLibrary(folderId);
            dispatch({ type: 'setItems', items: response.items });
            dispatch({ type: 'setFolders', folders: response.folders });
        } catch (error) {
            console.error('Failed to load media:', error);
        }
        dispatch({ type: 'setLoading', loading: false });
    }, []);

    // Filter items by type and search
    const filteredItems = state.items.filter(item => {
        // Type filter
        if (mediaType !== 'any' && item.type !== mediaType) {
            return false;
        }
        // Search filter
        if (state.search && !item.name.toLowerCase().includes(state.search.toLowerCase())) {
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

        dispatch({ type: 'setIsUploading', isUploading: true });
        dispatch({ type: 'setUploadProgress', uploadProgress: 0 });

        try {
            const uploadedMedia = await mediaApi.uploadMedia(file, (progress) => {
                dispatch({ type: 'setUploadProgress', uploadProgress: progress });
            });

            if (uploadedMedia) {
                dispatch({ type: 'prependItem', item: uploadedMedia });
            }
        } catch (error) {
            console.error('Upload failed:', error);
            toast.error('Upload failed');
        }

        dispatch({ type: 'setIsUploading', isUploading: false });
        dispatch({ type: 'setUploadProgress', uploadProgress: 0 });
    }, [mediaType]);

    // Handle drag and drop
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        dispatch({ type: 'setDragOver', dragOver: true });
    };

    const handleDragLeave = () => {
        dispatch({ type: 'setDragOver', dragOver: false });
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        dispatch({ type: 'setDragOver', dragOver: false });
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
        <Dialog
            open={isOpen}
            onOpenChange={(open) => {
                if (!open) {
                    onClose();
                    return;
                }

                void loadMedia(state.activeFolder);
            }}
        >
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
                        {state.folders.map(folder => {
                            const Icon = getFolderIcon(folder.icon);
                            return (
                                <button
                                    key={folder.id}
                                    onClick={() => {
                                        dispatch({ type: 'setActiveFolder', activeFolder: folder.id });
                                        void loadMedia(folder.id);
                                    }}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-left",
                                        state.activeFolder === folder.id
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
                                <span className="text-sm font-medium capitalize">{state.activeFolder}</span>
                                <span className="text-xs text-muted-foreground ml-2">February 2026</span>
                            </div>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    value={state.search}
                                    onChange={(e) => dispatch({ type: 'setSearch', search: e.target.value })}
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
                            {state.loading ? (
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
                                            onClick={() => dispatch({ type: 'setSelectedItem', selectedItem: item })}
                                            className={cn(
                                                "aspect-square rounded-lg overflow-hidden border-2 transition-all relative group",
                                                state.selectedItem?.id === item.id
                                                    ? "border-primary ring-2 ring-primary/30"
                                                    : "border-transparent hover:border-border"
                                            )}
                                        >
                                            <Image
                                                src={item.thumbnailUrl}
                                                alt={item.name}
                                                fill
                                                className="object-cover"
                                                sizes="(max-width: 1024px) 25vw, 12vw"
                                            />

                                            {/* Video indicator */}
                                            {item.type === 'video' && (
                                                <div className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-gray-950/60 rounded text-[10px] text-white flex items-center gap-1">
                                                    <VideoIcon className="w-3 h-3" />
                                                    {item.duration}s
                                                </div>
                                            )}

                                            {/* Selection indicator */}
                                            {state.selectedItem?.id === item.id && (
                                                <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                                                    <Check className="w-4 h-4 text-primary-foreground" />
                                                </div>
                                            )}

                                            {/* Hover overlay */}
                                            <div className="absolute inset-0 bg-gray-950/40 opacity-0 group-hover:opacity-100 transition-opacity" />
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
                                state.dragOver
                                    ? "border-primary bg-primary/10"
                                    : "border-border"
                            )}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                        >
                            {state.isUploading ? (
                                <>
                                    <div className="w-16 h-16 rounded-full border-4 border-muted flex items-center justify-center relative">
                                        <div
                                            className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"
                                        />
                                        <span className="text-sm font-medium">{state.uploadProgress}%</span>
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
                                if (state.selectedItem) {
                                    onSelect(state.selectedItem);
                                    onClose();
                                }
                            }}
                            disabled={!state.selectedItem}
                        >
                            Add media
                        </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
