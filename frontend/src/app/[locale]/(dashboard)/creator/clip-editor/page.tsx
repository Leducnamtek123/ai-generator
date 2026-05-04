'use client';

import { useReducer, useRef } from 'react';
import { Scissors, Download, Play, Pause, SkipBack, SkipForward, Folder, Plus, Trash2, Copy } from 'lucide-react';
import { Button } from '@/ui/button';
import { Slider } from '@/ui/slider';
import { cn } from '@/lib/utils';

interface Clip {
    id: string;
    name: string;
    duration: number;
    startTime: number;
    color: string;
}

const mockClips: Clip[] = [
    { id: '1', name: 'Intro Scene', duration: 5.2, startTime: 0, color: 'bg-blue-500/30 border-blue-500/50' },
    { id: '2', name: 'Main Content', duration: 12.8, startTime: 5.2, color: 'bg-purple-500/30 border-purple-500/50' },
    { id: '3', name: 'B-Roll', duration: 4.5, startTime: 18, color: 'bg-green-500/30 border-green-500/50' },
    { id: '4', name: 'Outro', duration: 3.0, startTime: 22.5, color: 'bg-orange-500/30 border-orange-500/50' },
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
};

type ClipEditorAction =
    | { type: 'addClip'; clip: Clip }
    | { type: 'selectClip'; clipId: string | null }
    | { type: 'togglePlaying' }
    | { type: 'setCurrentTime'; currentTime: number }
    | { type: 'setVolume'; volume: number }
    | { type: 'setVideoFile'; videoFile: string | null }
    | { type: 'setTrimStart'; trimStart: number }
    | { type: 'setTrimEnd'; trimEnd: number }
    | { type: 'renameClip'; clipId: string; name: string }
    | { type: 'deleteClip'; clipId: string };

const initialState: ClipEditorState = {
    clips: mockClips,
    selectedClipId: null,
    isPlaying: false,
    currentTime: 0,
    volume: 80,
    videoFile: null,
    trimStart: 0,
    trimEnd: 100,
};

function reducer(state: ClipEditorState, action: ClipEditorAction): ClipEditorState {
    switch (action.type) {
        case 'addClip':
            return { ...state, clips: [...state.clips, action.clip] };
        case 'selectClip':
            return { ...state, selectedClipId: action.clipId };
        case 'togglePlaying':
            return { ...state, isPlaying: !state.isPlaying };
        case 'setCurrentTime':
            return { ...state, currentTime: action.currentTime };
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
        case 'deleteClip':
            return {
                ...state,
                clips: state.clips.filter((clip) => clip.id !== action.clipId),
                selectedClipId: state.selectedClipId === action.clipId ? null : state.selectedClipId,
            };
        default:
            return state;
    }
}

export default function ClipEditorPage() {
    const [state, dispatch] = useReducer(reducer, initialState);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const totalDuration = state.clips.reduce((sum, clip) => sum + clip.duration, 0);
    const selectedClip = state.clips.find((clip) => clip.id === state.selectedClipId) ?? null;

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        dispatch({ type: 'setVideoFile', videoFile: URL.createObjectURL(file) });
        dispatch({
            type: 'addClip',
            clip: {
                id: crypto.randomUUID(),
                name: file.name.split('.')[0],
                duration: 10,
                startTime: totalDuration,
                color: 'bg-pink-500/30 border-pink-500/50',
            },
        });
    };

    const deleteClip = (id: string) => {
        dispatch({ type: 'deleteClip', clipId: id });
    };

    return (
        <div className="h-full bg-background text-foreground flex flex-col overflow-hidden">
            <div className="h-14 px-6 border-b border-border flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <h2 className="font-bold text-muted-foreground">Clip Editor</h2>
                    <div className="w-px h-6 bg-border" />
                    <span className="text-xs text-muted-foreground">
                        {state.clips.length} clips • {totalDuration.toFixed(1)}s
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="gap-2">
                        <Plus className="w-4 h-4" /> Add Clip
                    </Button>
                    <input type="file" ref={fileInputRef} className="hidden" accept="video/*" onChange={handleFileUpload} />
                    <Button variant="outline" size="sm" className="gap-2">
                        <Folder className="w-4 h-4" /> Save
                    </Button>
                    <Button size="sm" className="gap-2">
                        <Download className="w-4 h-4" /> Export
                    </Button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 flex items-center justify-center bg-gray-950/95 relative">
                    {state.clips.length > 0 ? (
                        <div className="w-full max-w-3xl aspect-video bg-muted/10 rounded-xl border border-border/30 flex items-center justify-center">
                            {state.videoFile ? (
                                <video src={state.videoFile} className="w-full h-full object-contain rounded-xl" />
                            ) : (
                                <p className="text-muted-foreground text-sm">Preview</p>
                            )}
                        </div>
                    ) : (
                        <div className="text-center space-y-4">
                            <div className="w-20 h-20 rounded-2xl bg-muted/20 flex items-center justify-center mx-auto">
                                <Scissors className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white">Clip Editor</h3>
                                <p className="text-sm text-muted-foreground/80 mt-1">Add video clips to start editing</p>
                            </div>
                        </div>
                    )}
                </div>

                {selectedClip && (
                    <div className="w-[260px] border-l border-border flex flex-col shrink-0 bg-background animate-in slide-in-from-right-4 duration-200">
                        <div className="p-4 border-b border-border">
                            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Clip Properties</h4>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-5">
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
                                    <span className="text-[11px] font-mono">{state.trimStart}%</span>
                                </div>
                                <Slider min={0} max={100} step={1} value={[state.trimStart]} onValueChange={([value]) => dispatch({ type: 'setTrimStart', trimStart: value })} />
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Trim End</div>
                                    <span className="text-[11px] font-mono">{state.trimEnd}%</span>
                                </div>
                                <Slider min={0} max={100} step={1} value={[state.trimEnd]} onValueChange={([value]) => dispatch({ type: 'setTrimEnd', trimEnd: value })} />
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Volume</div>
                                    <span className="text-[11px] font-mono">{state.volume}%</span>
                                </div>
                                <Slider min={0} max={100} step={5} value={[state.volume]} onValueChange={([value]) => dispatch({ type: 'setVolume', volume: value })} />
                            </div>
                            <div className="pt-2 flex gap-2">
                                <Button variant="outline" size="sm" className="flex-1 gap-1 text-xs">
                                    <Copy className="w-3 h-3" /> Duplicate
                                </Button>
                                <Button variant="outline" size="sm" className="text-destructive text-xs" onClick={() => deleteClip(selectedClip.id)}>
                                    <Trash2 className="w-3 h-3" />
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="h-14 border-t border-border flex items-center justify-center gap-4 shrink-0 px-6">
                <Button variant="ghost" size="icon" className="w-8 h-8">
                    <SkipBack className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full" onClick={() => dispatch({ type: 'togglePlaying' })}>
                    {state.isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
                </Button>
                <Button variant="ghost" size="icon" className="w-8 h-8">
                    <SkipForward className="w-4 h-4" />
                </Button>
                <span className="text-xs font-mono text-muted-foreground ml-2">
                    {state.currentTime.toFixed(1)}s / {totalDuration.toFixed(1)}s
                </span>
            </div>

            <div className="h-32 border-t border-border bg-muted/30 shrink-0">
                <div className="h-6 border-b border-border flex items-end px-2">
                    {Array.from({ length: Math.ceil(totalDuration) + 1 }).map((_, i) => (
                        <div key={i} className="flex-1 text-[8px] text-muted-foreground/50 pl-1">
                            {i}s
                        </div>
                    ))}
                </div>
                <div className="flex-1 p-2 flex gap-1 items-stretch h-[calc(100%-24px)]">
                    {state.clips.map((clip) => (
                        <button
                            key={clip.id}
                            onClick={() => dispatch({ type: 'selectClip', clipId: state.selectedClipId === clip.id ? null : clip.id })}
                            className={cn(
                                'rounded-lg border px-3 flex items-center gap-2 transition-all min-w-[80px]',
                                clip.color,
                                state.selectedClipId === clip.id ? 'ring-2 ring-primary' : 'hover:brightness-110',
                            )}
                            style={{ flex: clip.duration }}
                        >
                            <Scissors className="w-3 h-3 shrink-0 opacity-50" />
                            <div className="min-w-0">
                                <p className="text-[10px] font-medium truncate">{clip.name}</p>
                                <p className="text-[8px] opacity-60">{clip.duration.toFixed(1)}s</p>
                            </div>
                        </button>
                    ))}
                    {state.clips.length === 0 && (
                        <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground border border-dashed border-border rounded-lg">
                            Click &quot;Add Clip&quot; to get started
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
