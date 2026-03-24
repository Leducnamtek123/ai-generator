'use client';

import { useState, useRef } from 'react';
import { useGenerationStore } from '@/stores/generation-store';
import {
    Film, Scissors, Upload, Download, Loader2, Play, Pause, SkipBack, SkipForward,
    Volume2, Type, Music, Image as ImageIcon, Sparkles, Plus, Trash2, Layers,
    ZoomIn, ZoomOut, Undo2, Redo2, Folder, Copy, Settings, Wand2
} from 'lucide-react';
import { Button } from '@/ui/button';
import { Slider } from '@/ui/slider';
import { Label } from '@/ui/label';
import { cn } from '@/lib/utils';

interface Track {
    id: string;
    name: string;
    type: 'video' | 'audio' | 'text' | 'effect';
    clips: { id: string; name: string; start: number; duration: number; color: string }[];
}

const mockTracks: Track[] = [
    {
        id: 'v1', name: 'Video 1', type: 'video',
        clips: [
            { id: 'c1', name: 'Intro.mp4', start: 0, duration: 5, color: 'bg-blue-500/30 border-blue-500/50' },
            { id: 'c2', name: 'Main.mp4', start: 6, duration: 15, color: 'bg-blue-500/30 border-blue-500/50' },
            { id: 'c3', name: 'Outro.mp4', start: 22, duration: 4, color: 'bg-blue-500/30 border-blue-500/50' },
        ]
    },
    {
        id: 'a1', name: 'Audio 1', type: 'audio',
        clips: [
            { id: 'c4', name: 'BGM.mp3', start: 0, duration: 26, color: 'bg-green-500/30 border-green-500/50' },
        ]
    },
    {
        id: 't1', name: 'Text 1', type: 'text',
        clips: [
            { id: 'c5', name: 'Title Card', start: 0, duration: 4, color: 'bg-yellow-500/30 border-yellow-500/50' },
            { id: 'c6', name: 'Lower Third', start: 8, duration: 6, color: 'bg-yellow-500/30 border-yellow-500/50' },
        ]
    },
    {
        id: 'e1', name: 'Effects', type: 'effect',
        clips: [
            { id: 'c7', name: 'Fade In', start: 0, duration: 2, color: 'bg-purple-500/30 border-purple-500/50' },
            { id: 'c8', name: 'Fade Out', start: 24, duration: 2, color: 'bg-purple-500/30 border-purple-500/50' },
        ]
    },
];

const aiFeatures = [
    { id: 'auto-cut', label: 'Auto Cut', description: 'AI removes silence and mistakes', icon: Scissors },
    { id: 'auto-caption', label: 'Auto Caption', description: 'Generate subtitles from speech', icon: Type },
    { id: 'ai-bgm', label: 'AI Background Music', description: 'Generate matching soundtrack', icon: Music },
    { id: 'enhance', label: 'Enhance Video', description: 'Color correction & stabilization', icon: Sparkles },
    { id: 'ai-broll', label: 'AI B-Roll', description: 'Generate relevant B-roll clips', icon: Film },
];

export default function VideoEditorPage() {
    const [tracks, setTracks] = useState<Track[]>(mockTracks);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
    const [activePanel, setActivePanel] = useState<'media' | 'text' | 'audio' | 'effects' | 'ai'>('media');
    const [zoom, setZoom] = useState(100);
    const [isProcessing, setIsProcessing] = useState(false);
    const { startGeneration } = useGenerationStore();

    const totalDuration = 26;

    const handleAiFeature = async (featureId: string) => {
        setIsProcessing(true);
        await startGeneration('/generations/video', {
            prompt: `Apply ${featureId} to video`,
        });
        setIsProcessing(false);
    };

    const trackIcon = (type: string) => {
        switch (type) {
            case 'video': return Film;
            case 'audio': return Volume2;
            case 'text': return Type;
            case 'effect': return Sparkles;
            default: return Film;
        }
    };

    return (
        <div className="h-full bg-background text-foreground flex flex-col overflow-hidden">
            {/* Top Toolbar */}
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

            {/* Main Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Panel */}
                <div className="w-[280px] border-r border-border flex flex-col shrink-0">
                    <div className="flex gap-1 p-2 border-b border-border">
                        {(['media', 'text', 'audio', 'effects', 'ai'] as const).map((tab) => (
                            <button key={tab} onClick={() => setActivePanel(tab)} className={cn("flex-1 py-1.5 text-[9px] font-medium rounded-lg transition-colors capitalize", activePanel === tab ? "bg-accent text-accent-foreground" : "text-muted-foreground")}>{tab === 'ai' ? 'AI ✨' : tab}</button>
                        ))}
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {activePanel === 'media' && (
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
                        {activePanel === 'ai' && (
                            <div className="space-y-2">
                                {aiFeatures.map((f) => (
                                    <button key={f.id} onClick={() => handleAiFeature(f.id)} disabled={isProcessing} className="w-full flex items-start gap-3 px-3 py-3 bg-card rounded-xl border border-border hover:border-primary/20 transition-all text-left disabled:opacity-50">
                                        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shrink-0"><f.icon className="w-4 h-4" /></div>
                                        <div><p className="text-xs font-medium">{f.label}</p><p className="text-[9px] text-muted-foreground">{f.description}</p></div>
                                    </button>
                                ))}
                                {isProcessing && (
                                    <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-lg"><Loader2 className="w-4 h-4 animate-spin text-primary" /><span className="text-xs text-primary">AI processing...</span></div>
                                )}
                            </div>
                        )}
                        {(activePanel === 'text' || activePanel === 'audio' || activePanel === 'effects') && (
                            <div className="text-center py-8 text-muted-foreground">
                                <p className="text-sm font-medium capitalize">{activePanel}</p>
                                <p className="text-xs mt-1">Click to add {activePanel} elements</p>
                                <Button variant="outline" size="sm" className="mt-4 gap-2"><Plus className="w-4 h-4" /> Add {activePanel}</Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Video Preview */}
                <div className="flex-1 flex items-center justify-center bg-black/95 p-6">
                    <div className="w-full max-w-2xl aspect-video bg-muted/10 rounded-xl border border-border/30 flex items-center justify-center relative overflow-hidden">
                        <p className="text-muted-foreground/50 text-sm">Video Preview</p>
                        {isProcessing && (
                            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                <p className="text-white text-sm">Processing...</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Transport Controls */}
            <div className="h-12 border-t border-border flex items-center justify-center gap-4 px-6 shrink-0">
                <Button variant="ghost" size="icon" className="w-8 h-8"><SkipBack className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full" onClick={() => setIsPlaying(!isPlaying)}>
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
                </Button>
                <Button variant="ghost" size="icon" className="w-8 h-8"><SkipForward className="w-4 h-4" /></Button>
                <span className="text-xs font-mono text-muted-foreground">{currentTime.toFixed(1)}s / {totalDuration}s</span>
                <div className="ml-auto flex items-center gap-2">
                    <ZoomOut className="w-3 h-3 text-muted-foreground" />
                    <Slider min={50} max={200} step={10} value={[zoom]} onValueChange={([v]) => setZoom(v)} className="w-24" />
                    <ZoomIn className="w-3 h-3 text-muted-foreground" />
                </div>
            </div>

            {/* Timeline */}
            <div className="h-44 border-t border-border bg-muted/20 shrink-0 flex flex-col">
                {/* Time Ruler */}
                <div className="h-5 border-b border-border flex items-end px-24">
                    {Array.from({ length: totalDuration + 1 }).map((_, i) => (
                        <div key={i} className="flex-1 text-[7px] text-muted-foreground/40 pl-0.5">{i}s</div>
                    ))}
                </div>
                {/* Tracks */}
                <div className="flex-1 overflow-y-auto">
                    {tracks.map((track) => {
                        const Icon = trackIcon(track.type);
                        return (
                            <div key={track.id} className="flex h-9 border-b border-border/50">
                                {/* Track Label */}
                                <div className="w-24 shrink-0 px-2 flex items-center gap-1.5 border-r border-border/50 bg-background">
                                    <Icon className="w-3 h-3 text-muted-foreground" />
                                    <span className="text-[9px] font-medium text-muted-foreground truncate">{track.name}</span>
                                </div>
                                {/* Track Clips */}
                                <div className="flex-1 relative px-1">
                                    {track.clips.map((clip) => (
                                        <button
                                            key={clip.id}
                                            onClick={() => setSelectedClipId(clip.id)}
                                            className={cn(
                                                "absolute top-1 bottom-1 rounded border px-2 flex items-center text-[8px] font-medium truncate transition-all",
                                                clip.color,
                                                selectedClipId === clip.id && "ring-1 ring-primary"
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
