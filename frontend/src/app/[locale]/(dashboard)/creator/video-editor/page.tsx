'use client';

import { useReducer } from 'react';
import { useGenerationStore } from '@/stores/generation-store';
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

interface Track {
    id: string;
    name: string;
    type: 'video' | 'audio' | 'text' | 'effect';
    clips: { id: string; name: string; start: number; duration: number; color: string }[];
}

const mockTracks: Track[] = [
    {
        id: 'v1',
        name: 'Video 1',
        type: 'video',
        clips: [
            { id: 'c1', name: 'Intro.mp4', start: 0, duration: 5, color: 'bg-blue-500/30 border-blue-500/50' },
            { id: 'c2', name: 'Main.mp4', start: 6, duration: 15, color: 'bg-blue-500/30 border-blue-500/50' },
            { id: 'c3', name: 'Outro.mp4', start: 22, duration: 4, color: 'bg-blue-500/30 border-blue-500/50' },
        ],
    },
    {
        id: 'a1',
        name: 'Audio 1',
        type: 'audio',
        clips: [
            { id: 'c4', name: 'BGM.mp3', start: 0, duration: 26, color: 'bg-green-500/30 border-green-500/50' },
        ],
    },
    {
        id: 't1',
        name: 'Text 1',
        type: 'text',
        clips: [
            { id: 'c5', name: 'Title Card', start: 0, duration: 4, color: 'bg-yellow-500/30 border-yellow-500/50' },
            { id: 'c6', name: 'Lower Third', start: 8, duration: 6, color: 'bg-yellow-500/30 border-yellow-500/50' },
        ],
    },
    {
        id: 'e1',
        name: 'Effects',
        type: 'effect',
        clips: [
            { id: 'c7', name: 'Fade In', start: 0, duration: 2, color: 'bg-purple-500/30 border-purple-500/50' },
            { id: 'c8', name: 'Fade Out', start: 24, duration: 2, color: 'bg-purple-500/30 border-purple-500/50' },
        ],
    },
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
};

type VideoEditorAction =
    | { type: 'setSelectedClipId'; selectedClipId: string | null }
    | { type: 'setActivePanel'; activePanel: VideoEditorState['activePanel'] }
    | { type: 'setZoom'; zoom: number }
    | { type: 'togglePlaying' }
    | { type: 'setProcessing'; isProcessing: boolean };

const initialState: VideoEditorState = {
    tracks: mockTracks,
    isPlaying: false,
    currentTime: 0,
    selectedClipId: null,
    activePanel: 'media',
    zoom: 100,
    isProcessing: false,
};

function reducer(state: VideoEditorState, action: VideoEditorAction): VideoEditorState {
    switch (action.type) {
        case 'setSelectedClipId':
            return { ...state, selectedClipId: action.selectedClipId };
        case 'setActivePanel':
            return { ...state, activePanel: action.activePanel };
        case 'setZoom':
            return { ...state, zoom: action.zoom };
        case 'togglePlaying':
            return { ...state, isPlaying: !state.isPlaying };
        case 'setProcessing':
            return { ...state, isProcessing: action.isProcessing };
        default:
            return state;
    }
}

export default function VideoEditorPage() {
    const [state, dispatch] = useReducer(reducer, initialState);
    const { startGeneration } = useGenerationStore();
    const totalDuration = 26;

    const handleAiFeature = async (featureId: string) => {
        dispatch({ type: 'setProcessing', isProcessing: true });
        await startGeneration('/generations/video', {
            prompt: `Apply ${featureId} to video`,
        });
        dispatch({ type: 'setProcessing', isProcessing: false });
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
        <div className="h-full bg-background text-foreground flex flex-col overflow-hidden">
            <div className="h-14 px-4 border-b border-border flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <h2 className="font-bold text-muted-foreground">Video Editor</h2>
                    <div className="w-px h-6 bg-border" />
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="w-8 h-8"><Undo2 className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" className="w-8 h-8"><Redo2 className="w-4 h-4" /></Button>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="gap-2"><Folder className="w-4 h-4" /> Save Project</Button>
                    <Button size="sm" className="gap-2"><Download className="w-4 h-4" /> Export Video</Button>
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
                                {tab === 'ai' ? <span className="inline-flex items-center gap-1"><Sparkles className="w-3 h-3" />AI</span> : tab}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {state.activePanel === 'media' && (
                            <>
                                <Button variant="outline" className="w-full gap-2"><Upload className="w-4 h-4" /> Import Media</Button>
                                <div className="grid grid-cols-2 gap-2">
                                    {Array.from({ length: 4 }).map((_, i) => (
                                        <div key={i} className="aspect-video rounded-lg bg-muted border border-border flex items-center justify-center cursor-pointer hover:border-primary/30 transition-all">
                                            <Film className="w-4 h-4 text-muted-foreground" />
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {state.activePanel === 'ai' && (
                            <div className="space-y-2">
                                {aiFeatures.map((feature) => (
                                    <button
                                        key={feature.id}
                                        onClick={() => handleAiFeature(feature.id)}
                                        disabled={state.isProcessing}
                                        className="w-full flex items-start gap-3 px-3 py-3 bg-card rounded-xl border border-border hover:border-primary/20 transition-all text-left disabled:opacity-50"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shrink-0">
                                            <feature.icon className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium">{feature.label}</p>
                                            <p className="text-[9px] text-muted-foreground">{feature.description}</p>
                                        </div>
                                    </button>
                                ))}
                                {state.isProcessing && (
                                    <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-lg">
                                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                        <span className="text-xs text-primary">AI processing...</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {(state.activePanel === 'text' || state.activePanel === 'audio' || state.activePanel === 'effects') && (
                            <div className="text-center py-8 text-muted-foreground">
                                <p className="text-sm font-medium capitalize">{state.activePanel}</p>
                                <p className="text-xs mt-1">Click to add {state.activePanel} elements</p>
                                <Button variant="outline" size="sm" className="mt-4 gap-2">
                                    <Plus className="w-4 h-4" />
                                    Add {state.activePanel}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-1 flex items-center justify-center bg-gray-950/95 p-6">
                    <div className="w-full max-w-2xl aspect-video bg-muted/10 rounded-xl border border-border/30 flex items-center justify-center relative overflow-hidden">
                        <p className="text-muted-foreground/50 text-sm">Video Preview</p>
                        {state.isProcessing && (
                            <div className="absolute inset-0 bg-gray-950/60 flex flex-col items-center justify-center gap-3">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                <p className="text-white text-sm">Processing...</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="h-12 border-t border-border flex items-center justify-center gap-4 px-6 shrink-0">
                <Button variant="ghost" size="icon" className="w-8 h-8"><SkipBack className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full" onClick={() => dispatch({ type: 'togglePlaying' })}>
                    {state.isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
                </Button>
                <Button variant="ghost" size="icon" className="w-8 h-8"><SkipForward className="w-4 h-4" /></Button>
                <span className="text-xs font-mono text-muted-foreground">{state.currentTime.toFixed(1)}s / {totalDuration}s</span>
                <div className="ml-auto flex items-center gap-2">
                    <ZoomOut className="w-3 h-3 text-muted-foreground" />
                    <Slider
                        min={50}
                        max={200}
                        step={10}
                        value={[state.zoom]}
                        onValueChange={([v]) => dispatch({ type: 'setZoom', zoom: v })}
                        className="w-24"
                    />
                    <ZoomIn className="w-3 h-3 text-muted-foreground" />
                </div>
            </div>

            <div className="h-44 border-t border-border bg-muted/20 shrink-0 flex flex-col">
                <div className="h-5 border-b border-border flex items-end px-24">
                    {Array.from({ length: totalDuration + 1 }).map((_, i) => (
                        <div key={i} className="flex-1 text-[7px] text-muted-foreground/40 pl-0.5">{i}s</div>
                    ))}
                </div>
                <div className="flex-1 overflow-y-auto">
                    {state.tracks.map((track) => {
                        const Icon = trackIcon(track.type);
                        return (
                            <div key={track.id} className="flex h-9 border-b border-border/50">
                                <div className="w-24 shrink-0 px-2 flex items-center gap-1.5 border-r border-border/50 bg-background">
                                    <Icon className="w-3 h-3 text-muted-foreground" />
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
                                        >
                                            {clip.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
