'use client';

import { useReducer, useRef } from 'react';
import { useGenerationStore } from '@/stores/generation-store';
import { Mic, Download, Loader2, Video, Folder, FileAudio, CircleCheckBig } from 'lucide-react';
import { Button } from '@/ui/button';
import { Slider } from '@/ui/slider';
import { Label } from '@/ui/label';
import { cn } from '@/lib/utils';

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
};

type LipSyncAction =
    | { type: 'setVideoFile'; videoFile: string | null }
    | { type: 'setAudioFile'; audioFile: string | null }
    | { type: 'setAudioFileName'; audioFileName: string }
    | { type: 'setSyncMode'; syncMode: string }
    | { type: 'setAccuracy'; accuracy: number }
    | { type: 'setSmoothing'; smoothing: number }
    | { type: 'toggleFaceDetection' };

const initialState: LipSyncState = {
    videoFile: null,
    audioFile: null,
    audioFileName: '',
    syncMode: 'full',
    accuracy: 80,
    smoothing: 50,
    faceDetection: true,
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
        default:
            return state;
    }
}

export default function LipSyncPage() {
    const [state, dispatch] = useReducer(reducer, initialState);
    const videoInputRef = useRef<HTMLInputElement>(null);
    const audioInputRef = useRef<HTMLInputElement>(null);
    const { lipSync, currentGeneration, reset, isGenerating } = useGenerationStore();
    const resultVideo = currentGeneration?.status === 'completed' ? currentGeneration.resultUrl ?? null : null;
    const isProcessing = isGenerating;

    const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            reset();
            dispatch({ type: 'setVideoFile', videoFile: URL.createObjectURL(file) });
        }
    };

    const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            dispatch({ type: 'setAudioFile', audioFile: URL.createObjectURL(file) });
            dispatch({ type: 'setAudioFileName', audioFileName: file.name });
        }
    };

    const handleProcess = async () => {
        if (!state.videoFile || !state.audioFile) return;
        await lipSync({
            videoUrl: state.videoFile,
            audioUrl: state.audioFile,
            syncMode: state.syncMode,
            accuracy: state.accuracy,
            smoothing: state.smoothing,
        });
        // Result will come through currentGeneration.resultUrl via polling
    };

    return (
        <div className="h-full bg-background text-foreground flex overflow-hidden">
            <div className="w-[320px] border-r border-border flex flex-col shrink-0 bg-background">
                <div className="h-14 px-6 border-b border-border flex items-center shrink-0">
                    <h2 className="font-bold text-muted-foreground">Lip Sync</h2>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Video Upload */}
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Source Video</h4>
                        <button type="button" onClick={() => videoInputRef.current?.click()} className="group relative aspect-video rounded-2xl bg-muted border-2 border-dashed border-border hover:border-primary/30 transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center gap-3">
                            {state.videoFile ? (
                                <video src={state.videoFile} className="w-full h-full object-cover" muted />
                            ) : (
                                <><div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center group-hover:scale-110 transition-all"><Video className="w-5 h-5 text-muted-foreground" /></div>
                                <div className="text-center"><p className="text-xs font-medium">Upload Video</p><p className="text-[10px] text-muted-foreground mt-1">MP4, MOV with a visible face</p></div></>
                            )}
                        </button>
                        <input type="file" ref={videoInputRef} className="hidden" accept="video/*" onChange={handleVideoUpload} />
                    </div>

                    {/* Audio Upload */}
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Audio Track</h4>
                        <button type="button" onClick={() => audioInputRef.current?.click()} className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed transition-all cursor-pointer", state.audioFile ? "bg-accent border-primary/20" : "bg-muted border-border hover:border-primary/30")}>
                            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                <FileAudio className="w-5 h-5 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                                {state.audioFile ? (<><p className="text-xs font-medium truncate">{state.audioFileName}</p><p className="text-[10px] text-muted-foreground">Click to change</p></>) : (<><p className="text-xs font-medium">Upload Audio</p><p className="text-[10px] text-muted-foreground">MP3, WAV, M4A</p></>)}
                            </div>
                        </button>
                        <input type="file" ref={audioInputRef} className="hidden" accept="audio/*" onChange={handleAudioUpload} />
                    </div>

                    {/* Sync Mode */}
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Sync Mode</h4>
                        <div className="space-y-1.5">
                            {syncModes.map((m) => (
                                <button key={m.id} onClick={() => dispatch({ type: 'setSyncMode', syncMode: m.id })} className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all text-left", state.syncMode === m.id ? "bg-accent border-primary/20" : "bg-card border-border")}>
                                    <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", state.syncMode === m.id ? "border-primary" : "border-muted-foreground/30")}>
                                        {state.syncMode === m.id && <div className="w-2 h-2 rounded-full bg-primary" />}
                                    </div>
                                    <div><p className="text-xs font-medium">{m.label}</p><p className="text-[9px] text-muted-foreground">{m.description}</p></div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="space-y-5">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between"><Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Accuracy</Label><span className="text-[11px] font-mono">{state.accuracy}%</span></div>
                            <Slider min={50} max={100} step={5} value={[state.accuracy]} onValueChange={([v]) => dispatch({ type: 'setAccuracy', accuracy: v })} />
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between"><Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Smoothing</Label><span className="text-[11px] font-mono">{state.smoothing}%</span></div>
                            <Slider min={0} max={100} step={5} value={[state.smoothing]} onValueChange={([v]) => dispatch({ type: 'setSmoothing', smoothing: v })} />
                        </div>
                    </div>

                    {/* Auto Face Detection */}
                    <button onClick={() => dispatch({ type: 'toggleFaceDetection' })} className="w-full flex items-center justify-between px-4 py-3 bg-card rounded-xl border border-border">
                        <span className="text-xs font-medium">Auto Face Detection</span>
                        <div className={cn("w-9 h-5 rounded-full transition-colors flex items-center px-0.5", state.faceDetection ? "bg-primary" : "bg-muted-foreground/20")}>
                            <div className={cn("w-4 h-4 rounded-full bg-white shadow-sm transition-transform", state.faceDetection ? "translate-x-4" : "translate-x-0")} />
                        </div>
                    </button>
                </div>
                <div className="p-4 border-t border-border space-y-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground px-1"><span>Cost:</span><span className="font-medium text-foreground">5 Credits</span></div>
                    <Button onClick={handleProcess} disabled={isProcessing || !state.videoFile || !state.audioFile} className="w-full h-12 font-bold rounded-xl gap-2">
                        {isProcessing ? (<><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>) : (<><Mic className="w-5 h-5" /> Sync Lips</>)}
                    </Button>
                </div>
            </div>

            {/* Preview */}
            <div className="flex-1 flex flex-col min-w-0">
                {resultVideo && (
                    <div className="h-14 px-6 border-b border-border flex items-center justify-end gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground mr-auto inline-flex items-center gap-1"><CircleCheckBig className="w-3.5 h-3.5 text-emerald-500" /> Lip sync complete</span>
                        <Button variant="outline" size="sm" className="gap-2"><Folder className="w-4 h-4" /> Save</Button>
                        <Button size="sm" className="gap-2"><Download className="w-4 h-4" /> Export</Button>
                    </div>
                )}
                <div className="flex-1 flex items-center justify-center p-8">
                    {!state.videoFile ? (
                        <div className="text-center space-y-4">
                            <div className="w-20 h-20 rounded-2xl bg-muted border border-border flex items-center justify-center mx-auto"><Mic className="w-8 h-8 text-muted-foreground" /></div>
                            <div><h3 className="font-semibold">AI Lip Sync</h3><p className="text-sm text-muted-foreground mt-1">Upload a video and audio track to create perfectly synced lip movements</p></div>
                        </div>
                    ) : isProcessing ? (
                        <div className="flex flex-col items-center gap-6">
                            <div className="relative"><div className="w-20 h-20 rounded-full border-4 border-muted border-t-primary animate-spin" /><Mic className="w-8 h-8 text-muted-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" /></div>
                            <div className="text-center"><p className="font-medium">Processing lip sync...</p><p className="text-sm text-muted-foreground mt-1">This may take 1-2 minutes</p></div>
                            <div className="w-64 h-2 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full animate-pulse" style={{ width: '60%' }} /></div>
                        </div>
                    ) : (
                        <div className="rounded-2xl overflow-hidden border border-border shadow-2xl max-w-2xl animate-in fade-in zoom-in-95 duration-500">
                            <video src={resultVideo || state.videoFile} controls className="w-full max-h-[70vh]" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
