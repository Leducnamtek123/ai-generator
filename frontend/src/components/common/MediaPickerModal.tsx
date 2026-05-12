'use client';

import React, { useReducer, useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import {
    Search, Heart, Clock, Upload, Download, Folder,
    Camera, Video as VideoIcon, Filter, Check, Music2, Image as ImageIcon
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
    mediaType?: 'any' | 'image' | 'video' | 'audio';
}
type MediaPickerState = {
    search: string;
    activeFolder: string;
    typeFilter: 'all' | 'image' | 'video' | 'audio';
    items: MediaItem[];
    folders: MediaFolder[];
    loading: boolean;
    isLoadingMore: boolean;
    page: number;
    hasMore: boolean;
    selectedItem: MediaItem | null;
    isUploading: boolean;
    uploadProgress: number;
    dragOver: boolean;
};

type MediaPickerAction =
    | { type: 'setSearch'; search: string }
    | { type: 'setActiveFolder'; activeFolder: string }
    | { type: 'setTypeFilter'; typeFilter: MediaPickerState['typeFilter'] }
    | { type: 'setItems'; items: MediaItem[] }
    | { type: 'setFolders'; folders: MediaFolder[] }
    | { type: 'setLoading'; loading: boolean }
    | { type: 'setIsLoadingMore'; isLoadingMore: boolean }
    | { type: 'setPage'; page: number }
    | { type: 'setHasMore'; hasMore: boolean }
    | { type: 'setSelectedItem'; selectedItem: MediaItem | null }
    | { type: 'setIsUploading'; isUploading: boolean }
    | { type: 'setUploadProgress'; uploadProgress: number }
    | { type: 'setDragOver'; dragOver: boolean }
    | { type: 'appendItems'; items: MediaItem[] }
    | { type: 'prependItem'; item: MediaItem }
    | { type: 'reset' };

const initialState: MediaPickerState = {
    search: '',
    activeFolder: 'uploads',
    typeFilter: 'all',
    items: [],
    folders: [],
    loading: false,
    isLoadingMore: false,
    page: 1,
    hasMore: false,
    selectedItem: null,
    isUploading: false,
    uploadProgress: 0,
    dragOver: false,
};

function formatFileSize(size: number) {
    if (!Number.isFinite(size) || size <= 0) {
        return 'Unknown size';
    }

    const units = ['B', 'KB', 'MB', 'GB'];
    let value = size;
    let unitIndex = 0;

    while (value >= 1024 && unitIndex < units.length - 1) {
        value /= 1024;
        unitIndex += 1;
    }

    return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}
function reducer(state: MediaPickerState, action: MediaPickerAction): MediaPickerState {
    switch (action.type) {
        case 'setSearch':
            return { ...state, search: action.search };
        case 'setActiveFolder':
            return {
                ...state,
                activeFolder: action.activeFolder,
                page: 1,
                hasMore: false,
                selectedItem: null,
            };
        case 'setTypeFilter':
            return { ...state, typeFilter: action.typeFilter };
        case 'setItems':
            return { ...state, items: action.items, selectedItem: null };
        case 'setFolders':
            return { ...state, folders: action.folders };
        case 'setLoading':
            return { ...state, loading: action.loading };
        case 'setIsLoadingMore':
            return { ...state, isLoadingMore: action.isLoadingMore };
        case 'setPage':
            return { ...state, page: action.page };
        case 'setHasMore':
            return { ...state, hasMore: action.hasMore };
        case 'setSelectedItem':
            return { ...state, selectedItem: action.selectedItem };
        case 'setIsUploading':
            return { ...state, isUploading: action.isUploading };
        case 'setUploadProgress':
            return { ...state, uploadProgress: action.uploadProgress };
        case 'setDragOver':
            return { ...state, dragOver: action.dragOver };
        case 'appendItems':
            return { ...state, items: [...state.items, ...action.items] };
        case 'prependItem':
            return { ...state, items: [action.item, ...state.items], selectedItem: action.item };
        case 'reset':
            return initialState;
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
    const [captureMode, setCaptureMode] = useState<'photo' | 'video' | null>(null);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [cameraReady, setCameraReady] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingSeconds, setRecordingSeconds] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraVideoRef = useRef<HTMLVideoElement>(null);
    const cameraStreamRef = useRef<MediaStream | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recordingChunksRef = useRef<Blob[]>([]);
    const recordingTimerRef = useRef<number | null>(null);
    const acceptTypes = mediaType === 'video'
        ? 'video/*'
        : mediaType === 'image'
            ? 'image/*'
            : mediaType === 'audio'
                ? 'audio/*'
                : 'image/*,video/*,audio/*';

    const stopRecordingTimer = useCallback(() => {
        if (recordingTimerRef.current) {
            window.clearInterval(recordingTimerRef.current);
            recordingTimerRef.current = null;
        }
    }, []);

    const stopCameraStream = useCallback(() => {
        const stream = cameraStreamRef.current;
        if (stream) {
            stream.getTracks().forEach((track) => track.stop());
            cameraStreamRef.current = null;
        }
        if (cameraVideoRef.current) {
            cameraVideoRef.current.srcObject = null;
        }
    }, []);

    const closeCameraCapture = useCallback(() => {
        stopRecordingTimer();
        const recorder = mediaRecorderRef.current;
        if (recorder && recorder.state !== 'inactive') {
            recorder.stop();
        }
        setIsRecording(false);
        setRecordingSeconds(0);
        mediaRecorderRef.current = null;
        recordingChunksRef.current = [];
        stopCameraStream();
        setCameraReady(false);
        setCameraError(null);
        setCaptureMode(null);
    }, [stopCameraStream, stopRecordingTimer]);

    const uploadCapturedFile = useCallback(async (file: File) => {
        const uploadedMedia = await mediaApi.uploadMedia(file, (progress) => {
            dispatch({ type: 'setUploadProgress', uploadProgress: progress });
        });

        if (uploadedMedia) {
            dispatch({ type: 'prependItem', item: uploadedMedia });
        }

        return uploadedMedia;
    }, []);

    const uploadCapturedBlob = useCallback(async (blob: Blob, fileName: string) => {
        const file = new File([blob], fileName, { type: blob.type || 'application/octet-stream' });
        dispatch({ type: 'setIsUploading', isUploading: true });
        dispatch({ type: 'setUploadProgress', uploadProgress: 0 });

        try {
            await uploadCapturedFile(file);
        } catch (error) {
            console.error('Capture upload failed:', error);
            toast.error('Upload failed');
        } finally {
            dispatch({ type: 'setIsUploading', isUploading: false });
            dispatch({ type: 'setUploadProgress', uploadProgress: 0 });
        }
    }, [dispatch, uploadCapturedFile]);

    const startCapture = useCallback((mode: 'photo' | 'video') => {
        setCaptureMode(mode);
        setCameraError(null);
    }, []);

    useEffect(() => {
        if (!captureMode) {
            return;
        }

        let cancelled = false;

        void (async () => {
            if (!navigator.mediaDevices?.getUserMedia) {
                setCameraError('Camera capture is not supported in this browser.');
                setCaptureMode(null);
                return;
            }

            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment' },
                    audio: captureMode === 'video',
                });

                if (cancelled) {
                    stream.getTracks().forEach((track) => track.stop());
                    return;
                }

                cameraStreamRef.current = stream;
                if (cameraVideoRef.current) {
                    cameraVideoRef.current.srcObject = stream;
                    await cameraVideoRef.current.play().catch(() => undefined);
                }

                setCameraReady(true);
            } catch (error) {
                console.error('Failed to start camera capture:', error);
                setCameraError('Could not access the camera.');
                setCaptureMode(null);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [captureMode]);

    useEffect(() => {
        if (!isOpen) {
            closeCameraCapture();
        }
    }, [closeCameraCapture, isOpen]);

    useEffect(() => () => {
        stopRecordingTimer();
        stopCameraStream();
    }, [stopCameraStream, stopRecordingTimer]);

    const loadMedia = useCallback(async (folderId: string, page = 1, append = false) => {
        if (page === 1) {
            dispatch({ type: 'setLoading', loading: true });
        } else {
            dispatch({ type: 'setIsLoadingMore', isLoadingMore: true });
        }
        try {
            const response = await mediaApi.getMediaLibrary(folderId, page);
            dispatch({ type: append ? 'appendItems' : 'setItems', items: response.items });
            dispatch({ type: 'setFolders', folders: response.folders });
            dispatch({ type: 'setHasMore', hasMore: response.hasMore });
            dispatch({ type: 'setPage', page });
        } catch (error) {
            console.error('Failed to load media:', error);
            toast.error('Failed to load media assets');
        }
        if (page === 1) {
            dispatch({ type: 'setLoading', loading: false });
        } else {
            dispatch({ type: 'setIsLoadingMore', isLoadingMore: false });
        }
    }, []);

    useEffect(() => {
        if (!isOpen) {
            dispatch({ type: 'reset' });
            return;
        }

        void loadMedia(state.activeFolder, 1, false);
    }, [isOpen, loadMedia, state.activeFolder]);

    // Filter items by type and search
    const effectiveTypeFilter = mediaType === 'any' ? state.typeFilter : mediaType;

    const filteredItems = state.items.filter(item => {
        // Type filter
        if (effectiveTypeFilter !== 'all' && item.type !== effectiveTypeFilter) {
            return false;
        }
        // Search filter
        if (state.search && !item.name.toLowerCase().includes(state.search.toLowerCase())) {
            return false;
        }
        return true;
    });

    const selectedFolder = state.folders.find(folder => folder.id === state.activeFolder);
    const selectedItem = state.selectedItem;

    const handleLoadMore = useCallback(() => {
        if (state.loading || state.isLoadingMore || !state.hasMore) {
            return;
        }

        void loadMedia(state.activeFolder, state.page + 1, true);
    }, [loadMedia, state.activeFolder, state.hasMore, state.isLoadingMore, state.loading, state.page]);

    const handleUseSelected = useCallback(() => {
        if (!selectedItem) {
            return;
        }

        onSelect(selectedItem);
        onClose();
    }, [onClose, onSelect, selectedItem]);

    const handleCopySelectedUrl = useCallback(async () => {
        if (!selectedItem) {
            return;
        }

        try {
            await navigator.clipboard.writeText(selectedItem.url);
            toast.success('Media URL copied');
        } catch {
            toast.error('Could not copy media URL');
        }
    }, [selectedItem]);

    const handleOpenSelected = useCallback(() => {
        if (!selectedItem) {
            return;
        }

        window.open(selectedItem.url, '_blank', 'noopener,noreferrer');
    }, [selectedItem]);

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
        if (mediaType === 'audio' && !file.type.startsWith('audio/')) {
            toast.error('Please select an audio file');
            return;
        }

        dispatch({ type: 'setIsUploading', isUploading: true });
        dispatch({ type: 'setUploadProgress', uploadProgress: 0 });

        try {
            await uploadCapturedFile(file);
        } catch (error) {
            console.error('Upload failed:', error);
            toast.error('Upload failed');
        } finally {
            dispatch({ type: 'setIsUploading', isUploading: false });
            dispatch({ type: 'setUploadProgress', uploadProgress: 0 });
        }
    }, [mediaType, uploadCapturedFile]);

    const handleOpenPhotoCapture = useCallback(() => {
        closeCameraCapture();
        startCapture('photo');
    }, [closeCameraCapture, startCapture]);

    const handleOpenVideoCapture = useCallback(() => {
        closeCameraCapture();
        startCapture('video');
    }, [closeCameraCapture, startCapture]);

    const capturePhotoFromCamera = useCallback(async () => {
        const video = cameraVideoRef.current;
        if (!video || !video.videoWidth || !video.videoHeight) {
            toast.error('Camera is not ready yet');
            return;
        }

        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        if (!context) {
            toast.error('Could not capture photo');
            return;
        }

        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const blob = await new Promise<Blob | null>((resolve) => {
            canvas.toBlob((result) => resolve(result), 'image/png');
        });

        if (!blob) {
            toast.error('Could not capture photo');
            return;
        }

        await uploadCapturedBlob(blob, `camera-photo-${Date.now()}.png`);
        closeCameraCapture();
    }, [closeCameraCapture, uploadCapturedBlob]);

    const stopVideoRecording = useCallback(() => {
        const recorder = mediaRecorderRef.current;
        if (recorder && recorder.state !== 'inactive') {
            recorder.stop();
        }
    }, []);

    const startVideoRecording = useCallback(() => {
        const stream = cameraStreamRef.current;
        if (!stream) {
            toast.error('Camera stream is not ready');
            return;
        }
        if (typeof MediaRecorder === 'undefined') {
            toast.error('Video recording is not supported in this browser');
            return;
        }

        recordingChunksRef.current = [];
        const preferredMimeTypes = [
            'video/webm;codecs=vp9,opus',
            'video/webm;codecs=vp8,opus',
            'video/webm',
        ];
        const mimeType = preferredMimeTypes.find((type) => MediaRecorder.isTypeSupported(type));
        const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordingChunksRef.current.push(event.data);
            }
        };

        recorder.onstop = async () => {
            const blob = new Blob(recordingChunksRef.current, {
                type: recorder.mimeType || 'video/webm',
            });
            recordingChunksRef.current = [];
            stopRecordingTimer();
            setIsRecording(false);
            setRecordingSeconds(0);
            await uploadCapturedBlob(blob, `camera-recording-${Date.now()}.webm`);
            closeCameraCapture();
        };

        recorder.start();
        setIsRecording(true);
        setRecordingSeconds(0);
        stopRecordingTimer();
        recordingTimerRef.current = window.setInterval(() => {
            setRecordingSeconds((value) => value + 1);
        }, 1000);
    }, [closeCameraCapture, stopRecordingTimer, uploadCapturedBlob]);

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
                            <div className="size-6 rounded bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground">P</div>
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
                                    }}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-left",
                                        state.activeFolder === folder.id
                                            ? "bg-accent text-accent-foreground"
                                            : "text-muted-foreground hover:text-foreground hover:bg-accent"
                                    )}
                                >
                                    <Icon className="size-4" />
                                    <span className="flex-1 text-left">{folder.name}</span>
                                    <span className="text-[10px] text-muted-foreground tabular-nums">{folder.count}</span>
                                </button>
                            );
                        })}

                        <div className="pt-4 border-t border-border mt-4">
                            <button
                                type="button"
                                onClick={() => {
                                    dispatch({ type: 'setSearch', search: '' });
                                    dispatch({ type: 'setTypeFilter', typeFilter: 'all' });
                                    const inspirationFolder = state.folders.find(folder => folder.id === 'favorites') ?? state.folders[0];
                                    if (inspirationFolder) {
                                        dispatch({ type: 'setActiveFolder', activeFolder: inspirationFolder.id });
                                    }
                                }}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                            >
                                <Search className="size-4" />
                                <span>Find inspiration</span>
                            </button>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 flex flex-col">
                        {/* Search Bar */}
                        <div className="p-4 border-b border-border space-y-3">
                            <div className="flex items-center gap-4">
                                <div className="flex-1">
                                    <span className="text-sm font-medium capitalize">
                                        {selectedFolder?.name || state.activeFolder}
                                    </span>
                                    <span className="text-xs text-muted-foreground ml-2">February 2026</span>
                                </div>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                    <Input
                                        value={state.search}
                                        onChange={(e) => dispatch({ type: 'setSearch', search: e.target.value })}
                                        placeholder="Search media"
                                        className="w-52 pl-9 pr-16 py-1 h-auto"
                                    />
                                    {state.search && (
                                        <button
                                            type="button"
                                            onClick={() => dispatch({ type: 'setSearch', search: '' })}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-1.5 py-0.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent"
                                        >
                                            Clear
                                        </button>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        dispatch({ type: 'setSearch', search: '' });
                                        dispatch({ type: 'setTypeFilter', typeFilter: 'all' });
                                    }}
                                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
                                    aria-label="Reset filters"
                                >
                                    <Filter className="size-4" />
                                </button>
                            </div>

                            {mediaType === 'any' && (
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        { id: 'all', label: 'All', icon: Folder },
                                        { id: 'image', label: 'Images', icon: ImageIcon },
                                        { id: 'video', label: 'Videos', icon: VideoIcon },
                                        { id: 'audio', label: 'Audio', icon: Music2 },
                                    ].map((filter) => {
                                        const Icon = filter.icon;
                                        const active = effectiveTypeFilter === filter.id;
                                        return (
                                            <button
                                                key={filter.id}
                                                type="button"
                                                onClick={() => dispatch({ type: 'setTypeFilter', typeFilter: filter.id as MediaPickerState['typeFilter'] })}
                                                className={cn(
                                                    'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                                                    active
                                                        ? 'bg-accent border-primary/20 text-foreground'
                                                        : 'bg-background border-border text-muted-foreground hover:text-foreground hover:bg-accent',
                                                )}
                                            >
                                                <Icon className="size-3.5" />
                                                {filter.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Media Grid */}
                        <div className="flex-1 overflow-y-auto p-4">
                            {state.loading ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="size-8 border-2 border-muted border-t-primary rounded-full animate-spin" />
                                </div>
                            ) : filteredItems.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center">
                                    <Upload className="size-12 text-muted-foreground/30 mb-4" />
                                    <p className="text-sm text-muted-foreground">
                                        {state.search
                                            ? `No media found for "${state.search}"`
                                            : 'No media found'}
                                    </p>
                                    <p className="text-xs text-muted-foreground/60 mt-1">
                                        {state.search
                                            ? 'Try another folder, file type, or clear search.'
                                            : 'Upload some files to get started'}
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
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
                                                {item.type === 'audio' ? (
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-card">
                                                        <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                                                            <Music2 className="size-6" />
                                                        </div>
                                                        <div className="px-2 text-center">
                                                            <p className="text-[10px] font-medium line-clamp-2">{item.name}</p>
                                                            <p className="mt-1 text-[10px] font-medium text-muted-foreground">Audio</p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <Image
                                                        src={item.thumbnailUrl}
                                                        alt={item.name}
                                                        fill
                                                        className="object-cover"
                                                        sizes="(max-width: 1024px) 25vw, 12vw"
                                                    />
                                                )}

                                                {/* Video indicator */}
                                                {item.type === 'video' && (
                                                    <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded bg-background/80 px-1.5 py-0.5 text-[10px] text-foreground backdrop-blur-sm">
                                                        <VideoIcon className="size-3" />
                                                        {item.duration}s
                                                    </div>
                                                )}
                                                {item.type === 'audio' && (
                                                    <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded bg-background/80 px-1.5 py-0.5 text-[10px] text-foreground backdrop-blur-sm">
                                                        <Music2 className="size-3" />
                                                        Audio
                                                    </div>
                                                )}

                                                {/* Selection indicator */}
                                                {state.selectedItem?.id === item.id && (
                                                    <div className="absolute top-2 right-2 size-6 bg-primary rounded-full flex items-center justify-center">
                                                        <Check className="size-4 text-primary-foreground" />
                                                    </div>
                                                )}

                                                {/* Hover overlay */}
                                                <div className="absolute inset-0 bg-background/30 opacity-0 transition-opacity group-hover:opacity-100" />
                                            </button>
                                        ))}
                                    </div>
                                    {(state.hasMore || state.isLoadingMore) && (
                                        <div className="flex justify-center">
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                className="gap-2"
                                                onClick={handleLoadMore}
                                                disabled={state.isLoadingMore}
                                            >
                                                {state.isLoadingMore ? (
                                                    <>
                                                        <div className="size-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                                                        Loading more
                                                    </>
                                                ) : (
                                                    'Load more'
                                                )}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Panel - Upload Area */}
                    <div className="w-72 border-l border-border p-4 flex flex-col">
                        {captureMode && (
                            <div className="mb-4 space-y-3 rounded-xl border border-border bg-card/70 p-3">
                                <div className="flex items-center justify-between gap-2">
                                    <div>
                                        <p className="text-sm font-medium">
                                            {captureMode === 'photo' ? 'Camera photo' : 'Video recorder'}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {cameraReady
                                                ? 'Camera ready'
                                                : cameraError || 'Starting camera...'}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={closeCameraCapture}
                                        className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-accent"
                                    >
                                        Close
                                    </button>
                                </div>

                                <div className="overflow-hidden rounded-lg border border-border bg-background">
                                    <video
                                        ref={cameraVideoRef}
                                        autoPlay
                                        muted={captureMode === 'photo'}
                                        playsInline
                                        className="h-48 w-full object-cover"
                                    />
                                </div>

                                {captureMode === 'video' && (
                                    <p className="text-xs text-muted-foreground">
                                        {isRecording ? `Recording ${recordingSeconds}s` : 'Ready to record'}
                                    </p>
                                )}

                                <div className="flex gap-2">
                                    {captureMode === 'photo' ? (
                                        <Button
                                            type="button"
                                            className="flex-1 gap-2"
                                            onClick={capturePhotoFromCamera}
                                            disabled={!cameraReady || state.isUploading}
                                        >
                                            <Camera className="size-4" />
                                            Capture photo
                                        </Button>
                                    ) : (
                                        <Button
                                            type="button"
                                            className="flex-1 gap-2"
                                            onClick={isRecording ? stopVideoRecording : startVideoRecording}
                                            disabled={!cameraReady || state.isUploading}
                                        >
                                            <VideoIcon className="size-4" />
                                            {isRecording ? 'Stop recording' : 'Start recording'}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Drop Zone */}
                        <div
                            className={cn(
                                "min-h-[200px] border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-4 transition-colors",
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
                                    <div className="size-16 rounded-full border-4 border-muted flex items-center justify-center relative">
                                        <div
                                            className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"
                                        />
                                        <span className="text-sm font-medium">{state.uploadProgress}%</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">Uploading...</p>
                                </>
                            ) : (
                                <>
                                    <Upload className="size-8 text-muted-foreground/50" />
                                    <div className="text-center">
                                        <p className="text-sm text-muted-foreground">Drop an image or upload your</p>
                                        <p className="text-sm text-muted-foreground">own media</p>
                                    </div>
                                </>
                            )}
                        </div>

                        {selectedItem ? (
                            <div className="mt-4 space-y-3 rounded-xl border border-border bg-card/60 p-3">
                                <div className="flex items-center justify-between gap-2">
                                    <div>
                                        <p className="text-sm font-medium">Selected item</p>
                                        <p className="text-xs text-muted-foreground">Ready to insert into the creator.</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => dispatch({ type: 'setSelectedItem', selectedItem: null })}
                                        className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-accent"
                                    >
                                        Clear
                                    </button>
                                </div>

                                <div className="relative aspect-square overflow-hidden rounded-lg border border-border bg-muted">
                                    {selectedItem.type === 'audio' ? (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center">
                                            <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                                                <Music2 className="size-7" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium line-clamp-2">{selectedItem.name}</p>
                                                <p className="text-xs text-muted-foreground mt-1">Audio preview</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <Image
                                            src={selectedItem.thumbnailUrl}
                                            alt={selectedItem.name}
                                            fill
                                            className="object-cover"
                                            sizes="240px"
                                        />
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <p className="text-sm font-medium line-clamp-1">{selectedItem.name}</p>
                                    <p className="text-xs text-muted-foreground capitalize">
                                        {selectedItem.type}
                                        {selectedItem.type !== 'audio' && selectedItem.width && selectedItem.height
                                            ? `  -  ${selectedItem.width}x${selectedItem.height}`
                                            : ''}
                                        {selectedItem.type === 'audio' && selectedItem.duration
                                            ? `  -  ${selectedItem.duration}s`
                                            : ''}
                                    </p>
                                    <p className="text-xs text-muted-foreground">{formatFileSize(selectedItem.size)}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <Button type="button" onClick={handleUseSelected} className="w-full">
                                        Use selected
                                    </Button>
                                    <Button type="button" variant="secondary" onClick={handleCopySelectedUrl} className="w-full">
                                        Copy URL
                                    </Button>
                                </div>

                                <Button type="button" variant="ghost" onClick={handleOpenSelected} className="w-full">
                                    Open in new tab
                                </Button>
                            </div>
                        ) : (
                            <div className="mt-4 rounded-xl border border-border bg-card/60 p-3 text-center">
                                <p className="text-sm font-medium">No item selected</p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Pick a media item to preview or add it to the canvas.
                                </p>
                            </div>
                        )}

                        {/* Upload Options */}
                        <div className="mt-4 space-y-2">
                            <Button
                                variant="secondary"
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full gap-2"
                            >
                                <Upload className="size-4" />
                            {mediaType === 'audio' ? 'Upload audio' : 'Upload media'}
                            </Button>
                            {(mediaType === 'image' || mediaType === 'any') && (
                                <Button variant="secondary" onClick={handleOpenPhotoCapture} className="w-full gap-2">
                                    <Camera className="size-4" />
                                    Take photo
                                </Button>
                            )}
                            {(mediaType === 'video' || mediaType === 'any') && (
                                <Button variant="secondary" onClick={handleOpenVideoCapture} className="w-full gap-2">
                                    <VideoIcon className="size-4" />
                                    Record video
                                </Button>
                            )}
                        </div>

                        {/* Hidden file input */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept={acceptTypes}
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
