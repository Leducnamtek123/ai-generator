'use client';

import { useState, useRef } from 'react';
import { Scissors, Upload, Download, Loader2, Play, Pause, SkipBack, SkipForward, Volume2, Folder, Plus, Trash2, Copy, ChevronLeft, ChevronRight } from 'lucide-react';
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

export default function ClipEditorPage() {
    const [clips, setClips] = useState<Clip[]>(mockClips);
    const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [volume, setVolume] = useState(80);
    const [videoFile, setVideoFile] = useState<string | null>(null);
    const [trimStart, setTrimStart] = useState(0);
    const [trimEnd, setTrimEnd] = useState(100);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const totalDuration = clips.reduce((sum, c) => sum + c.duration, 0);
    const selectedClip = clips.find(c => c.id === selectedClipId);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setVideoFile(URL.createObjectURL(file));
            setClips([...clips, { id: Date.now().toString(), name: file.name.split('.')[0], duration: 10, startTime: totalDuration, color: 'bg-pink-500/30 border-pink-500/50' }]);
        }
    };

    const deleteClip = (id: string) => {
        setClips(clips.filter(c => c.id !== id));
        if (selectedClipId === id) setSelectedClipId(null);
    };

    return (
        <div className="h-full bg-background text-foreground flex flex-col overflow-hidden">
            {/* Top Toolbar */}
            <div className="h-14 px-6 border-b border-border flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <h2 className="font-bold text-muted-foreground">Clip Editor</h2>
                    <div className="w-px h-6 bg-border" />
                    <span className="text-xs text-muted-foreground">{clips.length} clips • {totalDuration.toFixed(1)}s</span>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="gap-2"><Plus className="w-4 h-4" /> Add Clip</Button>
                    <input type="file" ref={fileInputRef} className="hidden" accept="video/*" onChange={handleFileUpload} />
                    <Button variant="outline" size="sm" className="gap-2"><Folder className="w-4 h-4" /> Save</Button>
                    <Button size="sm" className="gap-2"><Download className="w-4 h-4" /> Export</Button>
                </div>
            </div>

            {/* Preview Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Video Preview */}
                <div className="flex-1 flex items-center justify-center bg-black/95 relative">
                    {clips.length > 0 ? (
                        <div className="w-full max-w-3xl aspect-video bg-muted/10 rounded-xl border border-border/30 flex items-center justify-center">
                            {videoFile ? (
                                <video src={videoFile} className="w-full h-full object-contain rounded-xl" />
                            ) : (
                                <p className="text-muted-foreground text-sm">Preview</p>
                            )}
                        </div>
                    ) : (
                        <div className="text-center space-y-4">
                            <div className="w-20 h-20 rounded-2xl bg-muted/20 flex items-center justify-center mx-auto"><Scissors className="w-8 h-8 text-muted-foreground" /></div>
                            <div><h3 className="font-semibold text-white">Clip Editor</h3><p className="text-sm text-muted-foreground/80 mt-1">Add video clips to start editing</p></div>
                        </div>
                    )}
                </div>

                {/* Right Properties Panel */}
                {selectedClip && (
                    <div className="w-[260px] border-l border-border flex flex-col shrink-0 bg-background animate-in slide-in-from-right-4 duration-200">
                        <div className="p-4 border-b border-border">
                            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Clip Properties</h4>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Name</label>
                                <input value={selectedClip.name} onChange={(e) => setClips(clips.map(c => c.id === selectedClipId ? { ...c, name: e.target.value } : c))} className="w-full h-9 bg-muted border border-border rounded-lg px-3 text-xs outline-none focus:ring-2 focus:ring-ring" />
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between"><label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Trim Start</label><span className="text-[11px] font-mono">{trimStart}%</span></div>
                                <Slider min={0} max={100} step={1} value={[trimStart]} onValueChange={([v]) => setTrimStart(v)} />
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between"><label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Trim End</label><span className="text-[11px] font-mono">{trimEnd}%</span></div>
                                <Slider min={0} max={100} step={1} value={[trimEnd]} onValueChange={([v]) => setTrimEnd(v)} />
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between"><label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Volume</label><span className="text-[11px] font-mono">{volume}%</span></div>
                                <Slider min={0} max={100} step={5} value={[volume]} onValueChange={([v]) => setVolume(v)} />
                            </div>
                            <div className="pt-2 flex gap-2">
                                <Button variant="outline" size="sm" className="flex-1 gap-1 text-xs"><Copy className="w-3 h-3" /> Duplicate</Button>
                                <Button variant="outline" size="sm" className="text-destructive text-xs" onClick={() => deleteClip(selectedClipId!)}>
                                    <Trash2 className="w-3 h-3" />
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Transport Controls */}
            <div className="h-14 border-t border-border flex items-center justify-center gap-4 shrink-0 px-6">
                <Button variant="ghost" size="icon" className="w-8 h-8"><SkipBack className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full" onClick={() => setIsPlaying(!isPlaying)}>
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
                </Button>
                <Button variant="ghost" size="icon" className="w-8 h-8"><SkipForward className="w-4 h-4" /></Button>
                <span className="text-xs font-mono text-muted-foreground ml-2">{currentTime.toFixed(1)}s / {totalDuration.toFixed(1)}s</span>
            </div>

            {/* Timeline */}
            <div className="h-32 border-t border-border bg-muted/30 shrink-0">
                {/* Time Ruler */}
                <div className="h-6 border-b border-border flex items-end px-2">
                    {Array.from({ length: Math.ceil(totalDuration) + 1 }).map((_, i) => (
                        <div key={i} className="flex-1 text-[8px] text-muted-foreground/50 pl-1">{i}s</div>
                    ))}
                </div>
                {/* Clip Track */}
                <div className="flex-1 p-2 flex gap-1 items-stretch h-[calc(100%-24px)]">
                    {clips.map((clip) => (
                        <button
                            key={clip.id}
                            onClick={() => setSelectedClipId(selectedClipId === clip.id ? null : clip.id)}
                            className={cn(
                                "rounded-lg border px-3 flex items-center gap-2 transition-all min-w-[80px]",
                                clip.color,
                                selectedClipId === clip.id ? "ring-2 ring-primary" : "hover:brightness-110"
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
                    {clips.length === 0 && (
                        <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground border border-dashed border-border rounded-lg">
                            Click "Add Clip" to get started
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
