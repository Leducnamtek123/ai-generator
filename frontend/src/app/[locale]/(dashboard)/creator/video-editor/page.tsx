'use client';

import Image from 'next/image';
import { Suspense, useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { useGenerationStore } from '@/stores/generation-store';
import { MediaPickerModal } from '@/components/common/MediaPickerModal';
import type { MediaItem } from '@/types/media';
import { projectApi } from '@/services/projectApi';
import {
    Film,
    Scissors,
    Upload,
    Download,
    Loader2,
    Play,
    Pause,
    SkipBack,
    SkipForward,
    Volume2,
    Type,
    Music,
    Sparkles,
    Plus,
    ZoomIn,
    ZoomOut,
    Undo2,
    Redo2,
    Folder,
} from 'lucide-react';
import { Button } from '@/ui/button';
import { Slider } from '@/ui/slider';
import { cn } from '@/lib/utils';
import { CreatorWorkspaceShell } from '@/components/layouts/CreatorWorkspaceShell';

interface Track {
    id: string;
    name: string;
    type: 'video' | 'audio' | 'text' | 'effect';
    clips: EditorClip[];
}

interface EditorClip {
    id: string;
    name: string;
    start: number;
    duration: number;
    color: string;
    mediaId?: string;
    mediaType?: MediaItem['type'];
    mediaUrl?: string;
    thumbnailUrl?: string;
}

type VideoEditorSnapshot = {
    tracks: Track[];
    isPlaying: boolean;
    currentTime: number;
    selectedClipId: string | null;
    activePanel: VideoEditorState['activePanel'];
    zoom: number;
    isProcessing: boolean;
    selectedMediaId: string | null;
};

type VideoEditorProjectPayload = {
    version: number;
    savedAt: string;
    snapshot: Partial<VideoEditorSnapshot>;
};

const createEmptyTracks = (): Track[] => [
    { id: 'v1', name: 'Video 1', type: 'video', clips: [] },
    { id: 'a1', name: 'Audio 1', type: 'audio', clips: [] },
    { id: 't1', name: 'Text 1', type: 'text', clips: [] },
    { id: 'e1', name: 'Effects', type: 'effect', clips: [] },
];

const aiFeatures = [
    { id: 'auto-cut', label: 'Auto Cut', description: 'AI removes silence and mistakes', icon: Scissors },
    { id: 'auto-caption', label: 'Auto Caption', description: 'Generate subtitles from speech', icon: Type },
    { id: 'ai-bgm', label: 'AI Background Music', description: 'Generate matching soundtrack', icon: Music },
    { id: 'enhance', label: 'Enhance Video', description: 'Color correction & stabilization', icon: Sparkles },
    { id: 'ai-broll', label: 'AI B-Roll', description: 'Generate relevant B-roll clips', icon: Film },
];

type VideoEditorState = {
    tracks: Track[];
    isPlaying: boolean;
    currentTime: number;
    selectedClipId: string | null;
    activePanel: 'media' | 'text' | 'audio' | 'effects' | 'ai';
    zoom: number;
    isProcessing: boolean;
    selectedMediaId: string | null;
    past: VideoEditorSnapshot[];
    future: VideoEditorSnapshot[];
};

type VideoEditorAction =
    | { type: 'setSelectedClipId'; selectedClipId: string | null }
    | { type: 'setActivePanel'; activePanel: VideoEditorState['activePanel'] }
    | { type: 'setZoom'; zoom: number }
    | { type: 'setCurrentTime'; currentTime: number }
    | { type: 'setPlaying'; isPlaying: boolean }
    | { type: 'togglePlaying' }
    | { type: 'setProcessing'; isProcessing: boolean }
    | { type: 'setSelectedMediaId'; selectedMediaId: string | null }
    | { type: 'appendClip'; trackId: string; clip: EditorClip }
    | { type: 'hydrateSnapshot'; snapshot: VideoEditorSnapshot }
    | { type: 'undo' }
    | { type: 'redo' }
    | { type: 'reset' };

const initialState: VideoEditorState = {
    tracks: createEmptyTracks(),
    isPlaying: false,
    currentTime: 0,
    selectedClipId: null,
    activePanel: 'media',
    zoom: 100,
    isProcessing: false,
    selectedMediaId: null,
    past: [],
    future: [],
};

const snapshotState = (state: VideoEditorState): VideoEditorSnapshot => ({
    tracks: state.tracks,
    isPlaying: state.isPlaying,
    currentTime: state.currentTime,
    selectedClipId: state.selectedClipId,
    activePanel: state.activePanel,
    zoom: state.zoom,
    isProcessing: state.isProcessing,
    selectedMediaId: state.selectedMediaId,
});

const restoreSnapshot = (snapshot: VideoEditorSnapshot): VideoEditorState => ({
    ...snapshot,
    past: [],
    future: [],
});

function reducer(state: VideoEditorState, action: VideoEditorAction): VideoEditorState {
    const commit = (next: Partial<VideoEditorSnapshot>): VideoEditorState => ({
        ...state,
        ...next,
        past: [...state.past, snapshotState(state)],
        future: [],
    });

    switch (action.type) {
        case 'setSelectedClipId':
            return commit({ selectedClipId: action.selectedClipId });
        case 'setActivePanel':
            return commit({ activePanel: action.activePanel });
        case 'setZoom':
            return commit({ zoom: action.zoom });
        case 'setCurrentTime':
            return { ...state, currentTime: action.currentTime };
        case 'setPlaying':
            return { ...state, isPlaying: action.isPlaying };
        case 'togglePlaying':
            return commit({ isPlaying: !state.isPlaying });
        case 'setProcessing':
            return commit({ isProcessing: action.isProcessing });
        case 'setSelectedMediaId':
            return commit({ selectedMediaId: action.selectedMediaId });
        case 'appendClip':
            return {
                ...state,
                tracks: state.tracks.map((track) =>
                    track.id === action.trackId
                        ? { ...track, clips: [...track.clips, action.clip] }
                        : track,
                ),
                past: [...state.past, snapshotState(state)],
                future: [],
            };
        case 'hydrateSnapshot':
            return {
                ...action.snapshot,
                past: [],
                future: [],
            };
        case 'undo': {
            if (!state.past.length) {
                return state;
            }

            const previous = state.past[state.past.length - 1];
            return {
                ...restoreSnapshot(previous),
                past: state.past.slice(0, -1),
                future: [snapshotState(state), ...state.future],
            };
        }
        case 'redo': {
            if (!state.future.length) {
                return state;
            }

            const [next, ...rest] = state.future;
            return {
                ...restoreSnapshot(next),
                past: [...state.past, snapshotState(state)],
                future: rest,
            };
        }
        case 'reset':
            return initialState;
        default:
            return state;
    }
}

const getTrackEnd = (track: Track) => {
    if (track.clips.length === 0) {
        return 0;
    }

    return Math.max(...track.clips.map((clip) => clip.start + clip.duration));
};

const getMediaDuration = (media: MediaItem) => {
    if (typeof media.duration === 'number' && media.duration > 0) {
        return media.duration;
    }

    return media.type === 'video' ? 8 : 5;
};

const createClipFromMedia = (media: MediaItem, track: Track): EditorClip => {
    const duration = getMediaDuration(media);
    const start = getTrackEnd(track) > 0 ? getTrackEnd(track) + 1 : 0;

    return {
        id: `clip_${media.id}_${Date.now()}`,
        name: media.name,
        start,
        duration,
        color: media.type === 'video'
            ? 'bg-blue-500/30 border-blue-500/50'
            : 'bg-emerald-500/30 border-emerald-500/50',
        mediaId: media.id,
        mediaType: media.type,
        mediaUrl: media.url,
        thumbnailUrl: media.thumbnailUrl,
    };
};

export default function VideoEditorPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-background text-foreground" />}>
            <VideoEditorPageContent />
        </Suspense>
    );
}

function VideoEditorPageContent() {
    const [state, dispatch] = useReducer(reducer, initialState);
    const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
    const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
    const [isAudioPickerOpen, setIsAudioPickerOpen] = useState(false);
    const [mediaLoadState, setMediaLoadState] = useState<'loading' | 'ready' | 'error'>('loading');
    const [mediaLoadError, setMediaLoadError] = useState<string | null>(null);
    const [projectId, setProjectId] = useState<string | null>(null);
    const [isProjectLoading, setIsProjectLoading] = useState(false);
    const [isProjectSaving, setIsProjectSaving] = useState(false);
    const [projectError, setProjectError] = useState<string | null>(null);
    const mediaLoadToken = useRef(0);
    const { replace } = useRouter();
    const searchParams = useSearchParams();
    const searchParamsSnapshot = useMemo(() => new URLSearchParams(searchParams), [searchParams]);
    const { startGeneration, isGenerating, error } = useGenerationStore();
    const selectedMedia = useMemo(
        () => mediaItems.find((item) => item.id === state.selectedMediaId) ?? null,
        [mediaItems, state.selectedMediaId],
    );
    const selectedClip = useMemo(() => {
        for (const track of state.tracks) {
            const clip = track.clips.find((item) => item.id === state.selectedClipId);
            if (clip) {
                return clip;
            }
        }

        return null;
    }, [state.selectedClipId, state.tracks]);
    const selectedClipMedia = useMemo(() => {
        if (!selectedClip?.mediaId) {
            return null;
        }

        return mediaItems.find((item) => item.id === selectedClip.mediaId) ?? null;
    }, [mediaItems, selectedClip]);
    const previewMedia = selectedMedia ?? selectedClipMedia;
    const totalDuration = useMemo(() => {
        const longestTrack = state.tracks.reduce((max, track) => Math.max(max, getTrackEnd(track)), 26);
        return Math.max(26, Math.ceil(longestTrack));
    }, [state.tracks]);
    const canUndo = (state.past?.length ?? 0) > 0;
    const canRedo = (state.future?.length ?? 0) > 0;

    useEffect(() => {
        const queryProjectId = searchParamsSnapshot.get('projectId');
        if (queryProjectId) {
            setProjectId(queryProjectId);
        }
    }, [searchParams]);

    useEffect(() => {
        let cancelled = false;

        const hydrateFromSnapshot = (payload: Partial<VideoEditorSnapshot>) => {
            dispatch({
                type: 'hydrateSnapshot',
                snapshot: {
                    tracks: Array.isArray(payload.tracks) ? payload.tracks : initialState.tracks,
                    isPlaying: payload.isPlaying ?? initialState.isPlaying,
                    currentTime: payload.currentTime ?? initialState.currentTime,
                    selectedClipId: payload.selectedClipId ?? initialState.selectedClipId,
                    activePanel: payload.activePanel ?? initialState.activePanel,
                    zoom: payload.zoom ?? initialState.zoom,
                    isProcessing: payload.isProcessing ?? initialState.isProcessing,
                    selectedMediaId: payload.selectedMediaId ?? initialState.selectedMediaId,
                },
            });
        };

        const loadProject = async () => {
            if (!projectId) {
                try {
                    const raw = localStorage.getItem('video-editor:project:v1');
                    if (raw) {
                        const parsed = JSON.parse(raw) as Partial<VideoEditorSnapshot>;
                        hydrateFromSnapshot(parsed);
                    }
                } catch (loadError) {
                    console.error('Failed to restore video editor draft', loadError);
                }
                return;
            }

            setIsProjectLoading(true);
            setProjectError(null);
            try {
                const project = await projectApi.get(projectId);
                const rawContent = project.content as string | Record<string, unknown> | null | undefined;
                const parsed = typeof rawContent === 'string'
                    ? (JSON.parse(rawContent) as Partial<VideoEditorProjectPayload>)
                    : ((rawContent && typeof rawContent === 'object' && 'snapshot' in rawContent
                        ? (rawContent as { snapshot?: Partial<VideoEditorProjectPayload> }).snapshot
                        : rawContent) ?? {}) as Partial<VideoEditorProjectPayload>;
                if (!cancelled) {
                    hydrateFromSnapshot(((parsed.snapshot ?? parsed) as Partial<VideoEditorSnapshot>) ?? {});
                }
            } catch (loadError) {
                console.error('Failed to restore video project', loadError);
                if (!cancelled) {
                    setProjectError('Could not load the saved video project. Falling back to a local draft.');
                    try {
                        const raw = localStorage.getItem('video-editor:project:v1');
                        if (raw) {
                            const parsed = JSON.parse(raw) as Partial<VideoEditorSnapshot>;
                            hydrateFromSnapshot(parsed);
                        }
                    } catch (fallbackError) {
                        console.error('Failed to restore video project fallback', fallbackError);
                    }
                }
            } finally {
                if (!cancelled) {
                    setIsProjectLoading(false);
                }
            }
        };

        void loadProject();

        return () => {
            cancelled = true;
        };
    }, [projectId]);

    const loadMedia = useCallback(async () => {
        const token = ++mediaLoadToken.current;
        setMediaLoadState('loading');
        setMediaLoadError(null);

        try {
            const { mediaApi } = await import('@/services/mediaApi');
            const library = await mediaApi.getMediaLibrary('uploads');

            if (mediaLoadToken.current !== token) {
                return;
            }

            setMediaItems(library.items);
            setMediaLoadState('ready');
        } catch {
            if (mediaLoadToken.current !== token) {
                return;
            }

            setMediaItems([]);
            setMediaLoadError('Unable to load media library right now.');
            setMediaLoadState('error');
        }
    }, []);

    useEffect(() => {
        void loadMedia();

        return () => {
            mediaLoadToken.current += 1;
        };
    }, [loadMedia]);

    useEffect(() => {
        if (!isGenerating && state.isProcessing) {
            dispatch({ type: 'setProcessing', isProcessing: false });
        }
    }, [isGenerating, state.isProcessing]);

    useEffect(() => {
        if (!state.isPlaying) {
            return;
        }

        if (state.currentTime >= totalDuration) {
            dispatch({ type: 'setPlaying', isPlaying: false });
            return;
        }

        const timer = window.setTimeout(() => {
            dispatch({ type: 'setCurrentTime', currentTime: Math.min(totalDuration, state.currentTime + 0.25) });
        }, 250);

        return () => window.clearTimeout(timer);
    }, [state.isPlaying, state.currentTime, totalDuration]);

    const handleAiFeature = async (featureId: string) => {
        dispatch({ type: 'setProcessing', isProcessing: true });
        try {
            await startGeneration('/generations/video', {
                prompt: `Apply ${featureId} to video`,
            });
        } catch (err) {
            console.error('Failed to start AI video action', err);
            dispatch({ type: 'setProcessing', isProcessing: false });
        }
    };

    const handleUndo = () => {
        dispatch({ type: 'undo' });
    };

    const handleRedo = () => {
        dispatch({ type: 'redo' });
    };

    const handleSeek = (delta: number) => {
        dispatch({
            type: 'setCurrentTime',
            currentTime: Math.max(0, Math.min(totalDuration, state.currentTime + delta)),
        });
    };

    const handleSaveProject = () => {
        const snapshot: Partial<VideoEditorSnapshot> = {
            tracks: state.tracks,
            isPlaying: state.isPlaying,
            currentTime: state.currentTime,
            selectedClipId: state.selectedClipId,
            activePanel: state.activePanel,
            zoom: state.zoom,
            isProcessing: state.isProcessing,
            selectedMediaId: state.selectedMediaId,
        };

        const payload = {
            version: 1,
            savedAt: new Date().toISOString(),
            snapshot,
            previewMediaId: previewMedia?.id ?? null,
            error: error ?? null,
        };

        localStorage.setItem('video-editor:project:v1', JSON.stringify(snapshot));

        const persistProject = async () => {
            setIsProjectSaving(true);
            try {
                if (projectId) {
                    await projectApi.update(projectId, {
                        name: 'Video Editor Draft',
                        description: 'Video editor draft',
                        content: payload,
                    });
                } else {
                    const created = await projectApi.create({
                        name: 'Video Editor Draft',
                        description: 'Video editor draft',
                        content: payload,
                    });
                    setProjectId(created.project.id);
                    replace(`${window.location.pathname}?projectId=${created.project.id}`);
                }

                toast.success('Video project saved to your projects.');
            } catch (saveError) {
                console.error('Failed to persist video project', saveError);
                toast.error('Saved locally, but backend project save failed.');
            } finally {
                setIsProjectSaving(false);
            }
        };

        void persistProject();
    };

    const handleExportVideo = () => {
        const payload = {
            version: 1,
            exportedAt: new Date().toISOString(),
            tracks: state.tracks,
            isPlaying: state.isPlaying,
            currentTime: state.currentTime,
            selectedClipId: state.selectedClipId,
            activePanel: state.activePanel,
            zoom: state.zoom,
            isProcessing: state.isProcessing,
            selectedMediaId: state.selectedMediaId,
            previewMediaId: previewMedia?.id ?? null,
            error: error ?? null,
        };

        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'video-editor-export.json';
        link.click();
        URL.revokeObjectURL(url);
        toast.success('Video project export created.');
    };

    const handleResetProject = () => {
        dispatch({ type: 'reset' });
        toast.success('Video editor reset.');
    };

    const handleMediaSelect = (media: MediaItem) => {
        setMediaItems((current) => {
            const exists = current.some((item) => item.id === media.id);
            return exists ? current : [media, ...current];
        });

        const targetTrack =
            media.type === 'audio'
                ? state.tracks.find((track) => track.type === 'audio') ?? state.tracks[1]
                : state.tracks.find((track) => track.type === 'video') ?? state.tracks[0];

        if (targetTrack) {
            const clip = createClipFromMedia(media, targetTrack);
            dispatch({ type: 'appendClip', trackId: targetTrack.id, clip });
            dispatch({ type: 'setSelectedClipId', selectedClipId: clip.id });
        }

        dispatch({ type: 'setSelectedMediaId', selectedMediaId: media.id });
        dispatch({ type: 'setActivePanel', activePanel: 'media' });
    };

    const trackIcon = (type: string) => {
        switch (type) {
            case 'video':
                return Film;
            case 'audio':
                return Volume2;
            case 'text':
                return Type;
            case 'effect':
                return Sparkles;
            default:
                return Film;
        }
    };

    return (
        <CreatorWorkspaceShell variant="stack">
            <div className="h-14 px-4 border-b border-border flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <h2 className="font-semibold text-muted-foreground">Video Editor</h2>
                    <div className="w-px h-6 bg-border" />
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="size-8" onClick={handleUndo} disabled={!canUndo} title="Undo">
                            <Undo2 className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="size-8" onClick={handleRedo} disabled={!canRedo} title="Redo">
                            <Redo2 className="size-4" />
                        </Button>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground hidden md:inline">
                        {isProjectLoading ? 'Loading project...' : projectError ?? ''}
                    </span>
                    <Button variant="ghost" size="sm" className="gap-2" onClick={handleResetProject}>Reset</Button>
                    <Button variant="outline" size="sm" className="gap-2" onClick={handleSaveProject} disabled={isProjectLoading || isProjectSaving}>
                        <Folder className="size-4" /> {isProjectSaving ? 'Saving...' : 'Save Project'}
                    </Button>
                    <Button size="sm" className="gap-2" onClick={handleExportVideo}><Download className="size-4" /> Export Video</Button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                <div className="w-[280px] border-r border-border flex flex-col shrink-0">
                    <div className="flex gap-1 p-2 border-b border-border">
                        {(['media', 'text', 'audio', 'effects', 'ai'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => dispatch({ type: 'setActivePanel', activePanel: tab })}
                                className={cn(
                                    'flex-1 py-1.5 text-[9px] font-medium rounded-lg transition-colors capitalize',
                                    state.activePanel === tab ? 'bg-accent text-accent-foreground' : 'text-muted-foreground',
                                )}
                            >
                                {tab === 'ai' ? <span className="inline-flex items-center gap-1"><Sparkles className="size-3" />AI</span> : tab}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 overflow-y-auto p-4  gap-y-4">
                        {state.activePanel === 'media' && (
                            <>
                                <Button
                                    variant="outline"
                                    className="w-full gap-2"
                                    onClick={() => {
                                        if (mediaLoadState === 'error') {
                                            void loadMedia();
                                            return;
                                        }

                                        setIsMediaPickerOpen(true);
                                    }}
                                >
                                    <Upload className="size-4" />
                                    {mediaLoadState === 'error' ? 'Retry Media Load' : 'Import Media'}
                                </Button>
                                {mediaLoadState === 'loading' ? (
                                    <div className="grid grid-cols-2 gap-2">
                                        {Array.from({ length: 4 }).map((_, i) => (
                                            <div key={i} className="aspect-video rounded-lg bg-muted border border-border flex items-center justify-center animate-pulse">
                                                <Film className="size-4 text-muted-foreground" />
                                            </div>
                                        ))}
                                    </div>
                                ) : mediaLoadState === 'error' ? (
                                    <div className="rounded-xl border border-dashed border-border bg-card p-4 text-center">
                                        <p className="text-sm font-medium">{mediaLoadError}</p>
                                        <p className="mt-1 text-xs text-muted-foreground">Check the media service and try again.</p>
                                    </div>
                                ) : mediaItems.length > 0 ? (
                                    <div className="grid grid-cols-2 gap-2">
                                        {mediaItems.map((item) => (
                                            <button
                                                key={item.id}
                                                onClick={() => dispatch({ type: 'setSelectedMediaId', selectedMediaId: item.id })}
                                                className={cn(
                                                    'relative aspect-video rounded-lg overflow-hidden border transition-all hover:border-primary/30',
                                                    state.selectedMediaId === item.id ? 'border-primary ring-1 ring-primary/30' : 'border-border',
                                                )}
                                            title={item.name}
                                        >
                                            {item.thumbnailUrl ? (
                                                <Image
                                                    src={item.thumbnailUrl}
                                                    alt={item.name}
                                                    fill
                                                    className="object-cover"
                                                    sizes="(max-width: 768px) 100vw, 50vw"
                                                />
                                            ) : (
                                                    <div className="flex h-full w-full items-center justify-center bg-muted">
                                                        <Film className="size-4 text-muted-foreground" />
                                                    </div>
                                                )}
                                                <div className="absolute inset-x-0 bottom-0 bg-black/55 px-2 py-1">
                                                    <p className="truncate text-[10px] font-medium text-white">{item.name}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="rounded-xl border border-dashed border-border bg-card p-6 text-center">
                                        <Film className="mx-auto size-5 text-muted-foreground" />
                                        <p className="mt-3 text-sm font-medium">No media yet</p>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Import screenshots, clips, or assets to start building a timeline.
                                        </p>
                                    </div>
                                )}
                            </>
                        )}

                        {state.activePanel === 'ai' && (
                            <div className="space-y-2">
                                {error && (
                                    <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                                        {error}
                                    </div>
                                )}
                                {aiFeatures.map((feature) => (
                                    <button
                                        key={feature.id}
                                        onClick={() => handleAiFeature(feature.id)}
                                        disabled={state.isProcessing}
                                        className="w-full flex items-start gap-3 p-3 bg-card rounded-xl border border-border hover:border-primary/20 transition-all text-left disabled:opacity-50"
                                    >
                                        <div className="size-8 rounded-lg bg-accent flex items-center justify-center shrink-0">
                                            <feature.icon className="size-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium">{feature.label}</p>
                                            <p className="text-[9px] text-muted-foreground">{feature.description}</p>
                                        </div>
                                    </button>
                                ))}
                                {state.isProcessing && (
                                    <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-lg">
                                        <Loader2 className="size-4 animate-spin text-primary" />
                                        <span className="text-xs text-primary">AI processing?</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {(state.activePanel === 'text' || state.activePanel === 'audio' || state.activePanel === 'effects') && (
                            <div className="text-center py-8 text-muted-foreground">
                                <p className="text-sm font-medium capitalize">{state.activePanel}</p>
                                <p className="text-xs mt-1">
                                    {state.activePanel === 'text'
                                        ? 'Add a text clip after importing media or creating a timeline.'
                                        : state.activePanel === 'audio'
                                            ? 'Import audio or attach a soundtrack to the timeline.'
                                            : 'Apply an effect clip after the first media item is on the timeline.'}
                                </p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="mt-4 gap-2"
                                    onClick={() => {
                                        if (state.activePanel === 'audio') {
                                            setIsAudioPickerOpen(true);
                                            return;
                                        }

                                        dispatch({ type: 'setActivePanel', activePanel: 'media' });
                                        setIsMediaPickerOpen(true);
                                    }}
                                >
                                    <Plus className="size-4" />
                                    Add {state.activePanel}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-1 flex items-center justify-center bg-zinc-950/95 p-6">
                    <div className="w-full max-w-2xl aspect-video bg-muted/10 rounded-xl border border-border/30 flex items-center justify-center relative overflow-hidden">
                        {previewMedia ? (
                            previewMedia.type === 'audio' ? (
                                <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-gradient-to-br from-card to-muted">
                                    <div className="flex size-20 items-center justify-center rounded-full bg-primary/10 text-primary shadow-lg">
                                        <Music className="size-10" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-medium">{previewMedia.name}</p>
                                        <p className="text-xs text-muted-foreground">Audio preview</p>
                                    </div>
                                </div>
                            ) : previewMedia.type === 'video' ? (
                                <video
                                    key={previewMedia.id}
                                    src={previewMedia.url}
                                    poster={previewMedia.thumbnailUrl}
                                    className="h-full w-full object-contain bg-black"
                                    controls
                                    autoPlay={false}
                                    muted
                                />
                            ) : (
                                <Image
                                    src={previewMedia.thumbnailUrl}
                                    alt={previewMedia.name}
                                    fill
                                    className="object-contain bg-black"
                                    sizes="(max-width: 1024px) 100vw, 50vw"
                                />
                            )
                        ) : (
                            <p className="text-muted-foreground/50 text-sm">Video Preview</p>
                        )}
                        {previewMedia && (
                            <div className="absolute left-4 top-4 rounded-md bg-black/60 px-3 py-2 text-xs text-white">
                                <p className="font-medium">{previewMedia.name}</p>
                                <p className="text-white/70">{previewMedia.type.toUpperCase()}</p>
                            </div>
                        )}
                        {state.isProcessing && (
                            <div className="absolute inset-0 bg-zinc-950/60 flex flex-col items-center justify-center gap-3">
                                <Loader2 className="size-8 animate-spin text-primary" />
                                <p className="text-white text-sm">Processing?</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="h-12 border-t border-border flex items-center justify-center gap-4 px-6 shrink-0">
                <Button variant="ghost" size="icon" className="size-8" onClick={() => handleSeek(-5)}><SkipBack className="size-4" /></Button>
                <Button variant="ghost" size="icon" className="size-10 rounded-full" onClick={() => dispatch({ type: 'setPlaying', isPlaying: !state.isPlaying })}>
                    {state.isPlaying ? <Pause className="size-5" /> : <Play className="size-5 fill-current" />}
                </Button>
                <Button variant="ghost" size="icon" className="size-8" onClick={() => handleSeek(5)}><SkipForward className="size-4" /></Button>
                <span className="text-xs font-mono text-muted-foreground">{state.currentTime.toFixed(1)}s / {totalDuration}s</span>
                <div className="ml-auto flex items-center gap-2">
                    <ZoomOut className="size-3 text-muted-foreground" />
                    <Slider
                        min={50}
                        max={200}
                        step={10}
                        value={[state.zoom]}
                        onValueChange={([v]) => dispatch({ type: 'setZoom', zoom: v })}
                        className="w-24"
                    />
                    <ZoomIn className="size-3 text-muted-foreground" />
                </div>
            </div>

            <div className="h-44 border-t border-border bg-muted/20 shrink-0 flex flex-col">
                <div className="h-5 border-b border-border flex items-end px-24">
                    {Array.from({ length: totalDuration + 1 }).map((_, i) => (
                        <div key={i} className="flex-1 text-[7px] text-muted-foreground/40 pl-0.5">{i}s</div>
                    ))}
                </div>
                <div className="flex-1 overflow-y-auto">
                    {state.tracks.some((track) => track.clips.length > 0) ? state.tracks.map((track) => {
                        const Icon = trackIcon(track.type);
                        return (
                            <div key={track.id} className="flex h-9 border-b border-border/50">
                                <div className="w-24 shrink-0 px-2 flex items-center gap-1.5 border-r border-border/50 bg-background">
                                    <Icon className="size-3 text-muted-foreground" />
                                    <span className="text-[9px] font-medium text-muted-foreground truncate">{track.name}</span>
                                </div>
                                <div className="flex-1 relative px-1">
                                    {track.clips.map((clip) => (
                                        <button
                                            key={clip.id}
                                            onClick={() => dispatch({ type: 'setSelectedClipId', selectedClipId: clip.id })}
                                            className={cn(
                                                'absolute top-1 bottom-1 rounded border px-2 flex items-center text-[8px] font-medium truncate transition-all',
                                                clip.color,
                                                state.selectedClipId === clip.id && 'ring-1 ring-primary',
                                            )}
                                            style={{
                                                left: `${(clip.start / totalDuration) * 100}%`,
                                                width: `${(clip.duration / totalDuration) * 100}%`,
                                            }}
                                            title={clip.mediaId ? `Imported from ${clip.name}` : clip.name}
                                        >
                                            {clip.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        );
                    }) : (
                        <div className="flex h-full items-center justify-center px-6 py-8 text-center">
                            <div className="max-w-md space-y-2">
                                <p className="text-sm font-medium">Your timeline is empty</p>
                                <p className="text-xs text-muted-foreground">
                                    Import media to create the first clip and start building a project.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <MediaPickerModal
                isOpen={isMediaPickerOpen}
                onClose={() => setIsMediaPickerOpen(false)}
                onSelect={handleMediaSelect}
                mediaType="any"
            />
            <MediaPickerModal
                isOpen={isAudioPickerOpen}
                onClose={() => setIsAudioPickerOpen(false)}
                onSelect={handleMediaSelect}
                mediaType="audio"
            />
        </CreatorWorkspaceShell>
    );
}
