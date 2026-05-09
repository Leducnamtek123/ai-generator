'use client';

import { Suspense, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Scissors, Download, Play, Pause, SkipBack, SkipForward, Folder, Trash2, Copy, ChevronLeft, ChevronRight, Upload } from 'lucide-react';
import { Button } from '@/ui/button';
import { Slider } from '@/ui/slider';
import { cn } from '@/lib/utils';
import { CreatorWorkspaceShell } from '@/components/layouts/CreatorWorkspaceShell';
import { uploadFileWithToast } from '@/lib/upload';
import { projectApi } from '@/services/projectApi';

interface Clip {
    id: string;
    name: string;
    duration: number;
    startTime: number;
    color: string;
    trimStart: number;
    trimEnd: number;
    mediaUrl?: string | null;
}

type ClipEditorSnapshot = {
    clips: Clip[];
    selectedClipId: string | null;
    isPlaying: boolean;
    currentTime: number;
    volume: number;
    videoFile: string | null;
    trimStart: number;
    trimEnd: number;
};

const sampleClips: Clip[] = [
    { id: '1', name: 'Intro Scene', duration: 5.2, startTime: 0, color: 'bg-blue-500/30 border-blue-500/50', trimStart: 0, trimEnd: 100 },
    { id: '2', name: 'Main Content', duration: 12.8, startTime: 5.2, color: 'bg-purple-500/30 border-purple-500/50', trimStart: 0, trimEnd: 100 },
    { id: '3', name: 'B-Roll', duration: 4.5, startTime: 18, color: 'bg-green-500/30 border-green-500/50', trimStart: 0, trimEnd: 100 },
    { id: '4', name: 'Outro', duration: 3.0, startTime: 22.5, color: 'bg-orange-500/30 border-orange-500/50', trimStart: 0, trimEnd: 100 },
];

type ClipEditorState = {
    clips: Clip[];
    selectedClipId: string | null;
    isPlaying: boolean;
    currentTime: number;
    volume: number;
    videoFile: string | null;
    trimStart: number;
    trimEnd: number;
    projectId: string | null;
    isProjectLoading: boolean;
    isProjectSaving: boolean;
    errorMessage: string | null;
};

type ClipEditorAction =
    | { type: 'addClip'; clip: Clip }
    | { type: 'selectClip'; clipId: string | null }
    | { type: 'setPlaying'; isPlaying: boolean }
    | { type: 'togglePlaying' }
    | { type: 'setCurrentTime'; currentTime: number }
    | { type: 'setVolume'; volume: number }
    | { type: 'setVideoFile'; videoFile: string | null }
    | { type: 'setTrimStart'; trimStart: number }
    | { type: 'setTrimEnd'; trimEnd: number }
    | { type: 'renameClip'; clipId: string; name: string }
    | { type: 'deleteClip'; clipId: string }
    | { type: 'moveClip'; clipId: string; delta: number }
    | { type: 'adjustClipTrim'; clipId: string; trimStart?: number; trimEnd?: number }
    | { type: 'adjustClipStart'; clipId: string; startTime: number }
    | { type: 'hydrateDraft'; draft: Partial<ClipEditorState> }
    | { type: 'setProjectId'; projectId: string | null }
    | { type: 'setProjectLoading'; isProjectLoading: boolean }
    | { type: 'setProjectSaving'; isProjectSaving: boolean }
    | { type: 'setErrorMessage'; errorMessage: string | null }
    | { type: 'resetAll' };

const initialState: ClipEditorState = {
    clips: [],
    selectedClipId: null,
    isPlaying: false,
    currentTime: 0,
    volume: 80,
    videoFile: null,
    trimStart: 0,
    trimEnd: 100,
    projectId: null,
    isProjectLoading: false,
    isProjectSaving: false,
    errorMessage: null,
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const getEffectiveDuration = (clip: Clip) => {
    const trimRange = Math.max(0.1, (clip.trimEnd ?? 100) - (clip.trimStart ?? 0));
    return Math.max(0.1, clip.duration * (trimRange / 100));
};

const normalizeClips = (clips: Clip[]) =>
    clips.toSorted((a, b) => a.startTime - b.startTime || a.name.localeCompare(b.name));

const getTimelineEnd = (clips: Clip[]) =>
    clips.reduce((max, clip) => Math.max(max, clip.startTime + getEffectiveDuration(clip)), 0);

function reducer(state: ClipEditorState, action: ClipEditorAction): ClipEditorState {
    switch (action.type) {
        case 'addClip':
            return { ...state, clips: normalizeClips([...state.clips, action.clip]), selectedClipId: action.clip.id };
        case 'selectClip':
            return { ...state, selectedClipId: action.clipId };
        case 'setPlaying':
            return { ...state, isPlaying: action.isPlaying };
        case 'togglePlaying':
            return { ...state, isPlaying: !state.isPlaying };
        case 'setCurrentTime':
            return { ...state, currentTime: Math.max(0, action.currentTime) };
        case 'setVolume':
            return { ...state, volume: action.volume };
        case 'setVideoFile':
            return { ...state, videoFile: action.videoFile };
        case 'setTrimStart':
            return { ...state, trimStart: action.trimStart };
        case 'setTrimEnd':
            return { ...state, trimEnd: action.trimEnd };
        case 'renameClip':
            return {
                ...state,
                clips: state.clips.map((clip) => (clip.id === action.clipId ? { ...clip, name: action.name } : clip)),
            };
        case 'deleteClip': {
            const nextClips = state.clips.filter((clip) => clip.id !== action.clipId);
            return {
                ...state,
                clips: nextClips,
                selectedClipId: state.selectedClipId === action.clipId ? null : state.selectedClipId,
                currentTime: clamp(state.currentTime, 0, getTimelineEnd(nextClips)),
            };
        }
        case 'moveClip': {
            const index = state.clips.findIndex((clip) => clip.id === action.clipId);
            if (index < 0) return state;

            const nextClips = [...state.clips];
            const targetIndex = clamp(index + action.delta, 0, nextClips.length - 1);
            if (targetIndex === index) return state;

            const [clip] = nextClips.splice(index, 1);
            nextClips.splice(targetIndex, 0, clip);

            let cursor = 0;
            const reordered = nextClips.map((item) => {
                const nextItem = { ...item, startTime: cursor };
                cursor += getEffectiveDuration(nextItem) + 0.5;
                return nextItem;
            });

            return { ...state, clips: reordered };
        }
        case 'adjustClipTrim':
            return {
                ...state,
                clips: state.clips.map((clip) => {
                    if (clip.id !== action.clipId) return clip;
                    const trimStart = action.trimStart ?? clip.trimStart;
                    const trimEnd = action.trimEnd ?? clip.trimEnd;
                    return { ...clip, trimStart: Math.min(trimStart, trimEnd - 1), trimEnd: Math.max(trimEnd, trimStart + 1) };
                }),
            };
        case 'adjustClipStart':
            return {
                ...state,
                clips: normalizeClips(
                    state.clips.map((clip) => (clip.id === action.clipId ? { ...clip, startTime: Math.max(0, action.startTime) } : clip)),
                ),
            };
        case 'hydrateDraft':
            return {
                ...state,
                ...action.draft,
                clips: Array.isArray(action.draft.clips) ? normalizeClips(action.draft.clips) : state.clips,
            };
        case 'setProjectId':
            return { ...state, projectId: action.projectId };
        case 'setProjectLoading':
            return { ...state, isProjectLoading: action.isProjectLoading };
        case 'setProjectSaving':
            return { ...state, isProjectSaving: action.isProjectSaving };
        case 'setErrorMessage':
            return { ...state, errorMessage: action.errorMessage };
        case 'resetAll':
            return initialState;
        default:
            return state;
    }
}

export default function ClipEditorPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-background text-foreground" />}>
            <ClipEditorPageContent />
        </Suspense>
    );
}

function ClipEditorPageContent() {
    const [state, dispatch] = useReducer(reducer, initialState);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { replace } = useRouter();
    const searchParams = useSearchParams();
    const searchParamsSnapshot = useMemo(() => new URLSearchParams(searchParams), [searchParams]);

    useEffect(() => {
        const queryProjectId = searchParamsSnapshot.get('projectId');
        if (queryProjectId) {
            dispatch({ type: 'setProjectId', projectId: queryProjectId });
        }
    }, [searchParams]);

    useEffect(() => {
        let cancelled = false;

        const hydrate = (draft: Partial<ClipEditorSnapshot>) => {
            dispatch({
                type: 'hydrateDraft',
                draft: {
                    clips: Array.isArray(draft.clips) ? draft.clips : undefined,
                    selectedClipId: draft.selectedClipId ?? null,
                    isPlaying: draft.isPlaying ?? false,
                    currentTime: draft.currentTime ?? 0,
                    volume: draft.volume ?? 80,
                    videoFile: draft.videoFile ?? null,
                    trimStart: draft.trimStart ?? 0,
                    trimEnd: draft.trimEnd ?? 100,
                },
            });
        };

        const loadProject = async () => {
            const draftRaw = localStorage.getItem('clip-editor:draft:v1');

            if (!state.projectId) {
                try {
                    if (draftRaw) {
                        hydrate(JSON.parse(draftRaw) as Partial<ClipEditorSnapshot>);
                    }
                } catch (error) {
                    console.error('Failed to restore clip draft', error);
                }
                return;
            }

            dispatch({ type: 'setProjectLoading', isProjectLoading: true });
            try {
                const project = await projectApi.get(state.projectId);
                const rawContent = project.content as string | Record<string, unknown> | null | undefined;
                const parsed =
                    typeof rawContent === 'string'
                        ? (JSON.parse(rawContent) as Partial<ClipEditorSnapshot>)
                        : ((rawContent && typeof rawContent === 'object' && 'snapshot' in rawContent
                            ? (rawContent as { snapshot?: Partial<ClipEditorSnapshot> }).snapshot
                            : rawContent) ?? {});
                if (!cancelled) {
                    hydrate(parsed);
                }
            } catch (error) {
                console.error('Failed to restore clip project', error);
                if (!cancelled) {
                    dispatch({
                        type: 'setErrorMessage',
                        errorMessage: 'Could not load the saved clip project. Falling back to a local draft.',
                    });
                    try {
                        if (draftRaw) {
                            hydrate(JSON.parse(draftRaw) as Partial<ClipEditorSnapshot>);
                        }
                    } catch (fallbackError) {
                        console.error('Failed to restore clip draft fallback', fallbackError);
                    }
                }
            } finally {
                if (!cancelled) {
                    dispatch({ type: 'setProjectLoading', isProjectLoading: false });
                }
            }
        };

        void loadProject();

        return () => {
            cancelled = true;
        };
    }, [state.projectId]);

    const totalDuration = useMemo(() => getTimelineEnd(state.clips), [state.clips]);
    const selectedClip = state.clips.find((clip) => clip.id === state.selectedClipId) ?? null;

    useEffect(() => {
        if (!state.isPlaying) {
            return undefined;
        }

        if (state.currentTime >= totalDuration) {
            dispatch({ type: 'setPlaying', isPlaying: false });
            return undefined;
        }

        const timer = window.setTimeout(() => {
            dispatch({ type: 'setCurrentTime', currentTime: Math.min(totalDuration, state.currentTime + 0.25) });
        }, 250);

        return () => window.clearTimeout(timer);
    }, [state.isPlaying, state.currentTime, totalDuration]);

    const selectedClipTimelineStart = selectedClip?.startTime ?? 0;
    const selectedClipDuration = selectedClip ? getEffectiveDuration(selectedClip) : 0;

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const uploaded = await uploadFileWithToast(file, file.name);
        if (!uploaded?.url) return;

        const duration = file.type.startsWith('video/') ? 10 : 5;
        dispatch({ type: 'setVideoFile', videoFile: uploaded.url });
        dispatch({
            type: 'addClip',
            clip: {
                id: crypto.randomUUID(),
                name: file.name.split('.')[0],
                duration,
                startTime: totalDuration,
                color: 'bg-pink-500/30 border-pink-500/50',
                trimStart: 0,
                trimEnd: 100,
                mediaUrl: uploaded.url,
            },
        });

        e.target.value = '';
        toast.success('Clip imported.');
    };

    const duplicateClip = () => {
        if (!selectedClip) {
            toast.error('Select a clip to duplicate.');
            return;
        }

        dispatch({
            type: 'addClip',
            clip: {
                ...selectedClip,
                id: crypto.randomUUID(),
                name: `${selectedClip.name} Copy`,
                startTime: totalDuration + 0.5,
            },
        });
        toast.success('Clip duplicated.');
    };

    const deleteClip = (id: string) => dispatch({ type: 'deleteClip', clipId: id });
    const handleSeek = (delta: number) =>
        dispatch({
            type: 'setCurrentTime',
            currentTime: clamp(state.currentTime + delta, 0, totalDuration),
        });

    const handleTimelineSeek = (event: React.PointerEvent<HTMLDivElement>) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const ratio = clamp((event.clientX - rect.left) / rect.width, 0, 1);
        dispatch({ type: 'setCurrentTime', currentTime: totalDuration * ratio });
    };

    const persistSnapshot = () => ({
        clips: state.clips,
        selectedClipId: state.selectedClipId,
        isPlaying: state.isPlaying,
        currentTime: state.currentTime,
        volume: state.volume,
        videoFile: state.videoFile,
        trimStart: state.trimStart,
        trimEnd: state.trimEnd,
    });

    const handleSave = () => {
        const snapshot = persistSnapshot();
        localStorage.setItem('clip-editor:draft:v1', JSON.stringify(snapshot));

        const persistProject = async () => {
            dispatch({ type: 'setProjectSaving', isProjectSaving: true });
            try {
                const payload = {
                    version: 1,
                    savedAt: new Date().toISOString(),
                    snapshot,
                };

                if (state.projectId) {
                    await projectApi.update(state.projectId, {
                        name: 'Clip Editor Draft',
                        description: 'Clip editor draft',
                        content: payload,
                    });
                } else {
                    const created = await projectApi.create({
                        name: 'Clip Editor Draft',
                        description: 'Clip editor draft',
                        content: payload,
                    });
                    dispatch({ type: 'setProjectId', projectId: created.project.id });
                    replace(`${window.location.pathname}?projectId=${created.project.id}`);
                }

                toast.success('Clip project saved to your projects.');
            } catch (error) {
                console.error('Failed to persist clip project', error);
                toast.error('Saved locally, but backend project save failed.');
            } finally {
                dispatch({ type: 'setProjectSaving', isProjectSaving: false });
            }
        };

        void persistProject();
    };

    const handleExport = () => {
        const payload = {
            version: 1,
            exportedAt: new Date().toISOString(),
            videoFile: state.videoFile,
            clips: state.clips,
            timeline: {
                currentTime: state.currentTime,
                volume: state.volume,
                trimStart: state.trimStart,
                trimEnd: state.trimEnd,
                totalDuration,
            },
        };

        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'clip-editor-export.json';
        link.click();
        URL.revokeObjectURL(url);
        toast.success('Clip timeline exported.');
    };

    const handleLoadSampleTimeline = () => {
        dispatch({ type: 'hydrateDraft', draft: { clips: sampleClips, selectedClipId: sampleClips[0]?.id ?? null } });
        toast.success('Loaded sample timeline.');
    };

    const handleReset = () => {
        dispatch({ type: 'resetAll' });
        dispatch({ type: 'setErrorMessage', errorMessage: null });
        toast.success('Clip editor reset.');
    };

    const seekToSelectedClip = () => {
        if (!selectedClip) {
            toast.error('Select a clip first.');
            return;
        }

        dispatch({ type: 'setCurrentTime', currentTime: selectedClip.startTime });
    };

    const nudgeSelectedClip = (delta: number) => {
        if (!selectedClip) {
            toast.error('Select a clip first.');
            return;
        }

        dispatch({
            type: 'adjustClipStart',
            clipId: selectedClip.id,
            startTime: Math.max(0, selectedClip.startTime + delta),
        });
    };

    return (
        <CreatorWorkspaceShell variant="stack">
            <div className="h-14 px-6 border-b border-border flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <h2 className="font-semibold text-muted-foreground">Clip Editor</h2>
                    <div className="w-px h-6 bg-border" />
                    <span className="text-xs text-muted-foreground">
                        {state.clips.length} clips - {totalDuration.toFixed(1)}s
                    </span>
                    {state.isProjectLoading && <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Loading project</span>}
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="gap-2">
                        <Upload className="size-4" /> Add Clip
                    </Button>
                    <input type="file" ref={fileInputRef} className="hidden" accept="video/*,audio/*" onChange={handleFileUpload} />
                    <Button variant="ghost" size="sm" className="gap-2" onClick={handleLoadSampleTimeline}>
                        <Play className="size-4" /> Load Sample
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-2" onClick={handleReset}>
                        <Scissors className="size-4" /> Reset
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2" onClick={handleSave} disabled={state.isProjectLoading || state.isProjectSaving}>
                        <Folder className="size-4" /> {state.isProjectSaving ? 'Saving...' : 'Save'}
                    </Button>
                    <Button size="sm" className="gap-2" onClick={handleExport}>
                        <Download className="size-4" /> Export
                    </Button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 flex items-center justify-center bg-zinc-950/95 relative">
                    {state.errorMessage && (
                        <div className="absolute top-4 left-1/2 z-20 -translate-x-1/2 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-2 text-sm text-destructive">
                            {state.errorMessage}
                        </div>
                    )}

                    {state.clips.length > 0 ? (
                        <div className="w-full max-w-4xl aspect-video bg-muted/10 rounded-xl border border-border/30 overflow-hidden flex flex-col">
                            <div className="flex-1 flex items-center justify-center relative">
                                {state.videoFile ? (
                                    <video src={state.videoFile} className="w-full h-full object-contain bg-black/30" controls={false} />
                                ) : (
                                    <div className="text-center space-y-3">
                                        <div className="size-16 rounded-2xl bg-muted/20 flex items-center justify-center mx-auto">
                                            <Scissors className="size-8 text-muted-foreground" />
                                        </div>
                                        <p className="text-sm text-muted-foreground/80">Timeline ready. Add media to preview the clip sequence.</p>
                                    </div>
                                )}
                                <div className="absolute left-4 top-4 rounded-full bg-black/60 px-3 py-1 text-[10px] tracking-[0.16em] text-white uppercase">
                                    {state.isPlaying ? 'Playing' : 'Paused'} - {state.currentTime.toFixed(1)}s
                                </div>
                                <div className="absolute right-4 top-4 rounded-full bg-black/60 px-3 py-1 text-[10px] tracking-[0.16em] text-white uppercase">
                                    Volume {state.volume}%
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center space-y-4">
                            <div className="size-20 rounded-2xl bg-muted/20 flex items-center justify-center mx-auto">
                                <Scissors className="size-8 text-muted-foreground" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white">Clip Editor</h3>
                                <p className="text-sm text-muted-foreground/80 mt-1">Add video clips to start editing</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="w-[280px] border-l border-border flex flex-col shrink-0 bg-background">
                    <div className="p-4 border-b border-border">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Clip Properties</h4>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4  gap-y-5">
                        {selectedClip ? (
                            <>
                                <div className="space-y-2">
                                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Name</div>
                                    <input
                                        value={selectedClip.name}
                                        onChange={(e) => dispatch({ type: 'renameClip', clipId: selectedClip.id, name: e.target.value })}
                                        className="w-full h-9 bg-muted border border-border rounded-lg px-3 text-xs outline-none focus:ring-2 focus:ring-ring"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Trim Start</div>
                                        <span className="text-[11px] font-mono">{selectedClip.trimStart}%</span>
                                    </div>
                                    <Slider
                                        min={0}
                                        max={99}
                                        step={1}
                                        value={[selectedClip.trimStart]}
                                        onValueChange={([value]) => dispatch({ type: 'adjustClipTrim', clipId: selectedClip.id, trimStart: value })}
                                    />
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Trim End</div>
                                        <span className="text-[11px] font-mono">{selectedClip.trimEnd}%</span>
                                    </div>
                                    <Slider
                                        min={1}
                                        max={100}
                                        step={1}
                                        value={[selectedClip.trimEnd]}
                                        onValueChange={([value]) => dispatch({ type: 'adjustClipTrim', clipId: selectedClip.id, trimEnd: value })}
                                    />
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Volume</div>
                                        <span className="text-[11px] font-mono">{state.volume}%</span>
                                    </div>
                                    <Slider min={0} max={100} step={5} value={[state.volume]} onValueChange={([value]) => dispatch({ type: 'setVolume', volume: value })} />
                                </div>
                                <div className="space-y-2">
                                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Timeline Position</div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="sm" className="flex-1 gap-1 text-xs" onClick={() => nudgeSelectedClip(-0.5)}>
                                            <ChevronLeft className="size-3" /> Left
                                        </Button>
                                        <Button variant="outline" size="sm" className="flex-1 gap-1 text-xs" onClick={() => nudgeSelectedClip(0.5)}>
                                            Right <ChevronRight className="size-3" />
                                        </Button>
                                    </div>
                                    <Button variant="ghost" size="sm" className="w-full text-xs" onClick={seekToSelectedClip}>
                                        Seek to clip start
                                    </Button>
                                </div>
                                <div className="pt-2 flex gap-2">
                                    <Button variant="outline" size="sm" className="flex-1 gap-1 text-xs" onClick={duplicateClip}>
                                        <Copy className="size-3" /> Duplicate
                                    </Button>
                                    <Button variant="outline" size="sm" className="text-destructive text-xs" onClick={() => deleteClip(selectedClip.id)}>
                                        <Trash2 className="size-3" />
                                    </Button>
                                </div>
                                <div className="rounded-xl border border-border bg-card p-3 text-[11px] text-muted-foreground space-y-1">
                                    <div>Start: {selectedClipTimelineStart.toFixed(1)}s</div>
                                    <div>Effective length: {selectedClipDuration.toFixed(1)}s</div>
                                </div>
                            </>
                        ) : (
                            <div className="rounded-xl border border-dashed border-border bg-card p-4 text-center text-sm text-muted-foreground">
                                Select a clip to edit trim, position, or duplicate it.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="h-14 border-t border-border flex items-center justify-center gap-4 shrink-0 px-6">
                <Button variant="ghost" size="icon" className="size-8" onClick={() => handleSeek(-5)}>
                    <SkipBack className="size-4" />
                </Button>
                <Button variant="ghost" size="icon" className="size-10 rounded-full" onClick={() => dispatch({ type: 'togglePlaying' })}>
                    {state.isPlaying ? <Pause className="size-5" /> : <Play className="size-5 fill-current" />}
                </Button>
                <Button variant="ghost" size="icon" className="size-8" onClick={() => handleSeek(5)}>
                    <SkipForward className="size-4" />
                </Button>
                <span className="text-xs font-mono text-muted-foreground ml-2">
                    {state.currentTime.toFixed(1)}s / {totalDuration.toFixed(1)}s
                </span>
            </div>

            <div className="h-40 border-t border-border bg-muted/30 shrink-0">
                <div className="h-6 border-b border-border flex items-end px-2">
                    {Array.from({ length: Math.ceil(totalDuration) + 1 }).map((_, i) => (
                        <div key={i} className="flex-1 text-[8px] text-muted-foreground/50 pl-1">
                            {i}s
                        </div>
                    ))}
                </div>
                <div className="p-3 space-y-2">
                    <div
                        className="relative h-16 rounded-xl border border-border bg-card overflow-hidden cursor-pointer"
                        onPointerDown={handleTimelineSeek}
                    >
                        <div
                            className="absolute top-0 bottom-0 w-px bg-primary z-20"
                            style={{ left: `${totalDuration > 0 ? (state.currentTime / totalDuration) * 100 : 0}%` }}
                        />
                        {state.clips.map((clip) => {
                            const effectiveDuration = getEffectiveDuration(clip);
                            const left = totalDuration > 0 ? (clip.startTime / totalDuration) * 100 : 0;
                            const width = totalDuration > 0 ? (effectiveDuration / totalDuration) * 100 : 100;

                            return (
                                <button
                                    key={clip.id}
                                    onClick={() => dispatch({ type: 'selectClip', clipId: state.selectedClipId === clip.id ? null : clip.id })}
                                    className={cn(
                                        'absolute top-2 bottom-2 rounded-lg border px-3 flex items-center gap-2 transition-all min-w-[100px] text-left',
                                        clip.color,
                                        state.selectedClipId === clip.id ? 'ring-2 ring-primary' : 'hover:brightness-110',
                                    )}
                                    style={{ left: `${left}%`, width: `calc(${width}% - 4px)` }}
                                >
                                    <Scissors className="size-3 shrink-0 opacity-50" />
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-medium truncate">{clip.name}</p>
                                        <p className="text-[8px] opacity-60">
                                            {clip.startTime.toFixed(1)}s - {(clip.startTime + effectiveDuration).toFixed(1)}s
                                        </p>
                                    </div>
                                </button>
                            );
                        })}
                        {state.clips.length === 0 && (
                            <div className="absolute inset-2 flex items-center justify-center text-xs text-muted-foreground border border-dashed border-border rounded-lg">
                                Click &quot;Add Clip&quot; to get started
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </CreatorWorkspaceShell>
    );
}
