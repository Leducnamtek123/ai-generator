'use client';

import { Suspense, useReducer, useRef, useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { useGenerationStore } from '@/stores/generation-store';
import { useTemplateStore } from '@/stores/template-store';
import { MediaPickerModal } from '@/components/common/MediaPickerModal';
import { CONTENT_TABS, COMMUNITY_TAB, TEMPLATES_TAB } from '@/components/layouts/navigation-data';
import { TemplateTypeEnum } from '@/lib/api/templates';
import type { MediaItem } from '@/types/media';
import { Mic, Download, Loader2, Video, Folder, FileAudio, CircleCheckBig, Search, Sparkles } from 'lucide-react';
import { Button } from '@/ui/button';
import { Slider } from '@/ui/slider';
import { Label } from '@/ui/label';
import { Input } from '@/ui/input';
import { cn } from '@/lib/utils';
import { CreatorWorkspaceShell } from '@/components/layouts/CreatorWorkspaceShell';
import Image from 'next/image';
import { uploadFileWithToast } from '@/lib/upload';
import { projectApi } from '@/services/projectApi';

const syncModes = [
    { id: 'full', label: 'Full Face', description: 'Complete face animation with lip sync' },
    { id: 'lips-only', label: 'Lips Only', description: 'Only animate the lips area' },
    { id: 'expressive', label: 'Expressive', description: 'Lips + facial expressions' },
];

type LipSyncState = {
    videoFile: string | null;
    audioFile: string | null;
    audioFileName: string;
    syncMode: string;
    accuracy: number;
    smoothing: number;
    faceDetection: boolean;
    activeContentTab: string;
};

type LipSyncSnapshot = {
    videoFile: string | null;
    audioFile: string | null;
    audioFileName: string;
    syncMode: string;
    accuracy: number;
    smoothing: number;
    faceDetection: boolean;
    activeContentTab: string;
    resultVideo: string | null;
};

type LipSyncProjectPayload = {
    version: number;
    savedAt: string;
    snapshot: Partial<LipSyncSnapshot>;
};

const normalizeLipSyncSnapshot = (value: unknown): Partial<LipSyncSnapshot> => {
    const raw = (value ?? {}) as Record<string, unknown>;
    const snapshot = (raw.snapshot && typeof raw.snapshot === 'object' ? raw.snapshot : raw) as Record<string, unknown>;
    return {
        videoFile: typeof snapshot.videoFile === 'string' ? snapshot.videoFile : null,
        audioFile: typeof snapshot.audioFile === 'string' ? snapshot.audioFile : null,
        audioFileName: typeof snapshot.audioFileName === 'string' ? snapshot.audioFileName : '',
        syncMode: typeof snapshot.syncMode === 'string' ? snapshot.syncMode : initialState.syncMode,
        accuracy: typeof snapshot.accuracy === 'number' ? snapshot.accuracy : initialState.accuracy,
        smoothing: typeof snapshot.smoothing === 'number' ? snapshot.smoothing : initialState.smoothing,
        faceDetection: typeof snapshot.faceDetection === 'boolean' ? snapshot.faceDetection : initialState.faceDetection,
        activeContentTab: typeof snapshot.activeContentTab === 'string' ? snapshot.activeContentTab : initialState.activeContentTab,
        resultVideo: typeof snapshot.resultVideo === 'string' ? snapshot.resultVideo : null,
    };
};

type LipSyncAction =
    | { type: 'setVideoFile'; videoFile: string | null }
    | { type: 'setAudioFile'; audioFile: string | null }
    | { type: 'setAudioFileName'; audioFileName: string }
    | { type: 'setSyncMode'; syncMode: string }
    | { type: 'setAccuracy'; accuracy: number }
    | { type: 'setSmoothing'; smoothing: number }
    | { type: 'toggleFaceDetection' }
    | { type: 'setActiveContentTab'; tab: string }
    | { type: 'reset' };

const initialState: LipSyncState = {
    videoFile: null,
    audioFile: null,
    audioFileName: '',
    syncMode: 'full',
    accuracy: 80,
    smoothing: 50,
    faceDetection: true,
    activeContentTab: TEMPLATES_TAB,
};

function reducer(state: LipSyncState, action: LipSyncAction): LipSyncState {
    switch (action.type) {
        case 'setVideoFile':
            return { ...state, videoFile: action.videoFile };
        case 'setAudioFile':
            return { ...state, audioFile: action.audioFile };
        case 'setAudioFileName':
            return { ...state, audioFileName: action.audioFileName };
        case 'setSyncMode':
            return { ...state, syncMode: action.syncMode };
        case 'setAccuracy':
            return { ...state, accuracy: action.accuracy };
        case 'setSmoothing':
            return { ...state, smoothing: action.smoothing };
        case 'toggleFaceDetection':
            return { ...state, faceDetection: !state.faceDetection };
        case 'setActiveContentTab':
            return { ...state, activeContentTab: action.tab };
        case 'reset':
            return initialState;
        default:
            return state;
    }
}

export default function LipSyncPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-background text-foreground" />}>
            <LipSyncPageContent />
        </Suspense>
    );
}

function LipSyncPageContent() {
    const [state, dispatch] = useReducer(reducer, initialState);
    const videoInputRef = useRef<HTMLInputElement>(null);
    const audioInputRef = useRef<HTMLInputElement>(null);
    const [projectId, setProjectId] = useState<string | null>(null);
    const [isProjectLoading, setIsProjectLoading] = useState(false);
    const [isProjectSaving, setIsProjectSaving] = useState(false);
    const [projectError, setProjectError] = useState<string | null>(null);
    const [restoredResultVideo, setRestoredResultVideo] = useState<string | null>(null);
    const { lipSync, currentGeneration, reset, isGenerating, generations, fetchGenerations, isLoading: isGenerationsLoading } = useGenerationStore();
    const { templates, fetchTemplates, isLoading: isTemplatesLoading } = useTemplateStore();
    const [communityListings, setCommunityListings] = useState<Array<{ id: string; title: string; description?: string }>>([]);
    const [isCommunityLoading, setIsCommunityLoading] = useState(false);
    const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
    const [mediaPickerType, setMediaPickerType] = useState<'video' | 'audio'>('video');
    const { replace } = useRouter();
    const searchParams = useSearchParams();
    const searchParamsSnapshot = useMemo(() => new URLSearchParams(searchParams), [searchParams]);
    const isProjectBusy = isProjectLoading || isProjectSaving;

    useEffect(() => {
        if (state.activeContentTab === CONTENT_TABS[0]) { // Personal
            fetchGenerations({ type: 'lip-sync', limit: 12 });
        } else if (state.activeContentTab === COMMUNITY_TAB) { // Community
            const fetchCommunity = async () => {
                setIsCommunityLoading(true);
                try {
                    const res = await import('@/lib/api').then(m => m.get<{ data: Array<{ id: string; title: string; description?: string }> }>('/community-marketplace/listings?type=lip-sync&limit=12'));
                    setCommunityListings(res.data || []);
                } catch (err) {
                    console.error('Failed to fetch community listings', err);
                } finally {
                    setIsCommunityLoading(false);
                }
            };
            fetchCommunity();
        } else if (state.activeContentTab === TEMPLATES_TAB) { // Templates
            fetchTemplates(TemplateTypeEnum.VIDEO_GENERATOR);
        }
    }, [state.activeContentTab, fetchGenerations, fetchTemplates]);

    const resultVideo = currentGeneration?.status === 'completed' ? currentGeneration.resultUrl ?? null : restoredResultVideo;

    useEffect(() => {
        const queryProjectId = searchParamsSnapshot.get('projectId');
        if (queryProjectId) {
            setProjectId(queryProjectId);
        }
    }, [searchParams]);

    useEffect(() => {
        let cancelled = false;

        const hydrateFromSnapshot = (snapshot: Partial<LipSyncSnapshot>) => {
            if (typeof snapshot.videoFile === 'string') {
                dispatch({ type: 'setVideoFile', videoFile: snapshot.videoFile });
            }
            if (typeof snapshot.audioFile === 'string') {
                dispatch({ type: 'setAudioFile', audioFile: snapshot.audioFile });
            }
            dispatch({ type: 'setAudioFileName', audioFileName: snapshot.audioFileName ?? '' });
            dispatch({ type: 'setSyncMode', syncMode: snapshot.syncMode ?? initialState.syncMode });
            dispatch({ type: 'setAccuracy', accuracy: snapshot.accuracy ?? initialState.accuracy });
            dispatch({ type: 'setSmoothing', smoothing: snapshot.smoothing ?? initialState.smoothing });
            if ((snapshot.faceDetection ?? initialState.faceDetection) !== initialState.faceDetection) {
                dispatch({ type: 'toggleFaceDetection' });
            }
            dispatch({ type: 'setActiveContentTab', tab: snapshot.activeContentTab ?? initialState.activeContentTab });
            setRestoredResultVideo(snapshot.resultVideo ?? null);
        };

        const loadProject = async () => {
            if (!projectId) {
                try {
                    const draftKey = 'lip-sync:draft:v1';
                    const raw = localStorage.getItem(draftKey);
                    if (raw) {
                        hydrateFromSnapshot(normalizeLipSyncSnapshot(JSON.parse(raw)));
                    }
                } catch (loadError) {
                    console.error('Failed to restore lip sync draft', loadError);
                }
                return;
            }

            setIsProjectLoading(true);
            setProjectError(null);
            try {
                const project = await projectApi.get(projectId);
                const rawContent = project.content as string | Record<string, unknown> | null | undefined;
                const parsed = typeof rawContent === 'string' ? JSON.parse(rawContent) : rawContent;
                if (!cancelled) {
                    hydrateFromSnapshot(normalizeLipSyncSnapshot(parsed));
                }
            } catch (loadError) {
                console.error('Failed to restore lip sync project', loadError);
                if (!cancelled) {
                    setProjectError('Could not load the saved lip sync project. Falling back to a local draft.');
                    try {
                        const draftKey = 'lip-sync:draft:v1';
                        const raw = localStorage.getItem(draftKey);
                        if (raw) {
                            hydrateFromSnapshot(normalizeLipSyncSnapshot(JSON.parse(raw)));
                        }
                    } catch (fallbackError) {
                        console.error('Failed to restore lip sync fallback', fallbackError);
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

    const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            reset();
            const uploaded = await uploadFileWithToast(file, file.name);
            if (!uploaded?.url) return;

            dispatch({ type: 'setVideoFile', videoFile: uploaded.url });
        }
    };

    const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const uploaded = await uploadFileWithToast(file, file.name);
            if (!uploaded?.url) return;

            dispatch({ type: 'setAudioFile', audioFile: uploaded.url });
            dispatch({ type: 'setAudioFileName', audioFileName: file.name });
        }
    };

    const openMediaPicker = (type: 'video' | 'audio') => {
        setMediaPickerType(type);
        setIsMediaPickerOpen(true);
    };

    const handleMediaSelect = (media: MediaItem) => {
        if (media.type === 'audio') {
            dispatch({ type: 'setAudioFile', audioFile: media.url });
            dispatch({ type: 'setAudioFileName', audioFileName: media.name });
            return;
        }

        dispatch({ type: 'setVideoFile', videoFile: media.url });
    };

    const handleProcess = async () => {
        if (!state.videoFile || !state.audioFile) return;
        try {
            await lipSync({
                videoUrl: state.videoFile,
                audioUrl: state.audioFile,
                syncMode: state.syncMode,
                accuracy: state.accuracy,
                smoothing: state.smoothing,
            });
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to sync lips');
        }
    };

    const handleReset = () => {
        reset();
        dispatch({ type: 'reset' });
        setRestoredResultVideo(null);
        setProjectError(null);
    };

    const handleDownloadResult = (url: string, filename: string) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.target = '_blank';
        link.rel = 'noreferrer';
        link.click();
    };

    const handleSave = () => {
        const payload: LipSyncProjectPayload = {
            version: 1,
            savedAt: new Date().toISOString(),
            snapshot: {
                videoFile: state.videoFile,
                audioFile: state.audioFile,
                audioFileName: state.audioFileName,
                syncMode: state.syncMode,
                accuracy: state.accuracy,
                smoothing: state.smoothing,
                faceDetection: state.faceDetection,
                activeContentTab: state.activeContentTab,
                resultVideo,
            },
        };

        localStorage.setItem('lip-sync:draft:v1', JSON.stringify(payload));

        const persistProject = async () => {
            setIsProjectSaving(true);
            try {
                if (projectId) {
                    await projectApi.update(projectId, {
                        name: 'Lip Sync Draft',
                        description: 'Lip sync draft',
                        content: payload,
                    });
                } else {
                    const created = await projectApi.create({
                        name: 'Lip Sync Draft',
                        description: 'Lip sync draft',
                        content: payload,
                    });
                    setProjectId(created.project.id);
                    replace(`${window.location.pathname}?projectId=${created.project.id}`);
                }

                toast.success('Lip sync saved to your projects.');
            } catch (saveError) {
                console.error('Failed to persist lip sync project', saveError);
                toast.error('Saved locally, but backend project save failed.');
            } finally {
                setIsProjectSaving(false);
            }
        };

        void persistProject();
    };

    return (
        <CreatorWorkspaceShell>
            <div className="w-[320px] border-r border-border flex flex-col shrink-0 bg-background">
                <div className="h-14 px-6 border-b border-border flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <h2 className="font-semibold text-muted-foreground">Lip Sync</h2>
                        {(isProjectLoading || isProjectSaving || projectError) && (
                            <span className={cn(
                                'text-[10px] px-2 py-1 rounded-full border',
                                projectError
                                    ? 'border-amber-500/30 text-amber-500'
                                    : 'border-muted-foreground/20 text-muted-foreground',
                            )}>
                                {isProjectLoading ? 'Loading project' : isProjectSaving ? 'Saving project' : 'Draft restored'}
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-6  gap-y-6 text-left">
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.1em]">Source Video</h4>
                        <button type="button" onClick={() => videoInputRef.current?.click()} className="group relative aspect-video rounded-2xl bg-muted border-2 border-dashed border-border hover:border-primary/30 transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center gap-3">
                            {state.videoFile ? (
                                <video src={state.videoFile} className="w-full h-full object-cover" muted />
                            ) : (
                                <><div className="size-12 rounded-xl bg-accent flex items-center justify-center group-hover:scale-110 transition-all"><Video className="size-5 text-muted-foreground" /></div>
                                <div className="text-center"><p className="text-xs font-medium">Upload Video</p><p className="text-[10px] text-muted-foreground mt-1">MP4, MOV</p></div></>
                            )}
                        </button>
                        <input type="file" ref={videoInputRef} className="hidden" accept="video/*" onChange={handleVideoUpload} />
                        <Button type="button" variant="outline" size="sm" className="w-full gap-2" onClick={() => openMediaPicker('video')}>
                            <Folder className="size-4" />
                            Choose from uploads
                        </Button>
                    </div>

                    <div className="space-y-3">
                        <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.1em]">Audio Track</h4>
                        <button type="button" onClick={() => audioInputRef.current?.click()} className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed transition-all cursor-pointer", state.audioFile ? "bg-accent border-primary/20" : "bg-muted border-border hover:border-primary/30")}>
                            <div className="size-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                <FileAudio className="size-5 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                                {state.audioFile ? (<><p className="text-xs font-medium truncate">{state.audioFileName}</p></>) : (<><p className="text-xs font-medium">Upload Audio</p></>)}
                            </div>
                        </button>
                        <input type="file" ref={audioInputRef} className="hidden" accept="audio/*" onChange={handleAudioUpload} />
                        <Button type="button" variant="outline" size="sm" className="w-full gap-2" onClick={() => openMediaPicker('audio')}>
                            <Folder className="size-4" />
                            Choose from uploads
                        </Button>
                    </div>

                    <div className="space-y-3">
                        <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.1em]">Sync Mode</h4>
                        <div className="space-y-1.5">
                            {syncModes.map((m) => (
                                <button key={m.id} onClick={() => dispatch({ type: 'setSyncMode', syncMode: m.id })} className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all text-left", state.syncMode === m.id ? "bg-accent border-primary/20" : "bg-card border-border")}>
                                    <div className={cn("size-4 rounded-full border-2 flex items-center justify-center", state.syncMode === m.id ? "border-primary" : "border-muted-foreground/30")}>
                                        {state.syncMode === m.id && <div className="size-2 rounded-full bg-primary" />}
                                    </div>
                                    <div><p className="text-xs font-medium">{m.label}</p></div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="p-4 border-t border-border space-y-3">
                    <Button onClick={handleProcess} disabled={isGenerating || isProjectBusy || !state.videoFile || !state.audioFile} className="w-full h-12 font-bold rounded-xl gap-2">
                        {isGenerating ? <Loader2 className="size-5 animate-spin" /> : <Mic className="size-5" />}
                        {isGenerating ? 'Processing...' : 'Sync Lips'}
                    </Button>
                    <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" onClick={handleReset} disabled={isProjectBusy} className="h-11 rounded-xl gap-2">
                            Reset
                        </Button>
                        <Button variant="outline" onClick={handleSave} disabled={isProjectBusy} className="h-11 rounded-xl gap-2">
                            {isProjectSaving ? <Loader2 className="size-4 animate-spin" /> : null}
                            Save
                        </Button>
                    </div>
                    {projectError && (
                        <p className="text-xs text-amber-500/90 leading-relaxed">{projectError}</p>
                    )}
                </div>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="h-14 px-6 border-b border-border flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                        {CONTENT_TABS.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => dispatch({ type: 'setActiveContentTab', tab })}
                                className={cn(
                                    'px-4 py-2 text-sm font-medium rounded-full transition-colors',
                                    state.activeContentTab === tab ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground',
                                )}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {state.activeContentTab === CONTENT_TABS[0] && ( // Personal
                        <section className="space-y-6">
                            <h2 className="text-lg font-semibold text-left">Your History</h2>
                            {isGenerationsLoading ? (
                                <LoadingGrid />
                            ) : generations.length > 0 ? (
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                    {generations.map((gen) => (
                                        <div key={gen.id} className="aspect-video rounded-xl overflow-hidden bg-card border border-border group relative">
                                            <video src={gen.resultUrl} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <Button size="icon" variant="secondary" className="rounded-full" onClick={() => handleDownloadResult(gen.resultUrl!, `lip-sync-${gen.id}.mp4`) }><Download className="size-4" /></Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <EmptyState message="No lip sync generations yet." />
                            )}
                        </section>
                    )}

                    {state.activeContentTab === COMMUNITY_TAB && ( // Community
                        <section className="space-y-6">
                            <h2 className="text-lg font-semibold text-left">Community Showcases</h2>
                            {isCommunityLoading ? <LoadingGrid /> : <EmptyState message="No community lip sync found." />}
                        </section>
                    )}

                    {state.activeContentTab === TEMPLATES_TAB && ( // Templates
                        <section className="space-y-6 text-left">
                            <h2 className="text-lg font-semibold">Video Samples</h2>
                            {isTemplatesLoading ? (
                                <LoadingGrid />
                            ) : templates.length > 0 ? (
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                    {templates.map((template) => (
                                        <button key={template.id} onClick={() => dispatch({ type: 'setVideoFile', videoFile: template.thumbnail })} className="aspect-video rounded-xl overflow-hidden border border-border hover:border-primary/40 transition-all relative group">
                                            <Image src={template.thumbnail} alt={template.title} fill sizes="200px" className="object-cover" />
                                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-all" />
                                            <p className="absolute bottom-2 left-2 text-[10px] font-medium text-white line-clamp-1">{template.title}</p>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <EmptyState message="No video samples available." />
                            )}
                        </section>
                    )}
                </div>
            </div>

            <MediaPickerModal
                isOpen={isMediaPickerOpen}
                onClose={() => setIsMediaPickerOpen(false)}
                onSelect={handleMediaSelect}
                mediaType={mediaPickerType}
            />
        </CreatorWorkspaceShell>
    );
}

function LoadingGrid() {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[
                { id: 'lip-sync-skel-1' },
                { id: 'lip-sync-skel-2' },
                { id: 'lip-sync-skel-3' },
            ].map((item) => (
                <div key={item.id} className="aspect-video rounded-xl bg-muted animate-pulse" />
            ))}
        </div>
    );
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="size-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Sparkles className="size-8 text-muted-foreground/30" />
            </div>
            <p className="text-muted-foreground">{message}</p>
        </div>
    );
}
