'use client';

import { useReducer, useRef, useEffect, useState } from 'react';
import { useGenerationStore } from '@/stores/generation-store';
import { useTemplateStore } from '@/stores/template-store';
import { CONTENT_TABS, COMMUNITY_TAB, TEMPLATES_TAB } from '@/components/layouts/navigation-data';
import { TemplateTypeEnum } from '@/lib/api/templates';
import { Mic, Download, Loader2, Video, Folder, FileAudio, CircleCheckBig, Search, Sparkles } from 'lucide-react';
import { Button } from '@/ui/button';
import { Slider } from '@/ui/slider';
import { Label } from '@/ui/label';
import { Input } from '@/ui/input';
import { cn } from '@/lib/utils';
import Image from 'next/image';

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

type LipSyncAction =
    | { type: 'setVideoFile'; videoFile: string | null }
    | { type: 'setAudioFile'; audioFile: string | null }
    | { type: 'setAudioFileName'; audioFileName: string }
    | { type: 'setSyncMode'; syncMode: string }
    | { type: 'setAccuracy'; accuracy: number }
    | { type: 'setSmoothing'; smoothing: number }
    | { type: 'toggleFaceDetection' }
    | { type: 'setActiveContentTab'; tab: string };

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
        default:
            return state;
    }
}

export default function LipSyncPage() {
    const [state, dispatch] = useReducer(reducer, initialState);
    const videoInputRef = useRef<HTMLInputElement>(null);
    const audioInputRef = useRef<HTMLInputElement>(null);
    const { lipSync, currentGeneration, reset, isGenerating, generations, fetchGenerations, isLoading: isGenerationsLoading } = useGenerationStore();
    const { templates, fetchTemplates, isLoading: isTemplatesLoading } = useTemplateStore();
    const [communityListings, setCommunityListings] = useState<any[]>([]);
    const [isCommunityLoading, setIsCommunityLoading] = useState(false);

    useEffect(() => {
        if (state.activeContentTab === CONTENT_TABS[0]) { // Personal
            fetchGenerations({ type: 'lip-sync', limit: 12 });
        } else if (state.activeContentTab === COMMUNITY_TAB) { // Community
            const fetchCommunity = async () => {
                setIsCommunityLoading(true);
                try {
                    const res = await import('@/lib/api').then(m => m.get<{ data: any[] }>('/community-marketplace/listings?type=lip-sync&limit=12'));
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

    const resultVideo = currentGeneration?.status === 'completed' ? currentGeneration.resultUrl ?? null : null;

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
    };

    return (
        <div className="h-full bg-background text-foreground flex overflow-hidden">
            <div className="w-[320px] border-r border-border flex flex-col shrink-0 bg-background">
                <div className="h-14 px-6 border-b border-border flex items-center shrink-0">
                    <h2 className="font-bold text-muted-foreground">Lip Sync</h2>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-6 text-left">
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Source Video</h4>
                        <button type="button" onClick={() => videoInputRef.current?.click()} className="group relative aspect-video rounded-2xl bg-muted border-2 border-dashed border-border hover:border-primary/30 transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center gap-3">
                            {state.videoFile ? (
                                <video src={state.videoFile} className="w-full h-full object-cover" muted />
                            ) : (
                                <><div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center group-hover:scale-110 transition-all"><Video className="w-5 h-5 text-muted-foreground" /></div>
                                <div className="text-center"><p className="text-xs font-medium">Upload Video</p><p className="text-[10px] text-muted-foreground mt-1">MP4, MOV</p></div></>
                            )}
                        </button>
                        <input type="file" ref={videoInputRef} className="hidden" accept="video/*" onChange={handleVideoUpload} />
                    </div>

                    <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Audio Track</h4>
                        <button type="button" onClick={() => audioInputRef.current?.click()} className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed transition-all cursor-pointer", state.audioFile ? "bg-accent border-primary/20" : "bg-muted border-border hover:border-primary/30")}>
                            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                <FileAudio className="w-5 h-5 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                                {state.audioFile ? (<><p className="text-xs font-medium truncate">{state.audioFileName}</p></>) : (<><p className="text-xs font-medium">Upload Audio</p></>)}
                            </div>
                        </button>
                        <input type="file" ref={audioInputRef} className="hidden" accept="audio/*" onChange={handleAudioUpload} />
                    </div>

                    <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Sync Mode</h4>
                        <div className="space-y-1.5">
                            {syncModes.map((m) => (
                                <button key={m.id} onClick={() => dispatch({ type: 'setSyncMode', syncMode: m.id })} className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all text-left", state.syncMode === m.id ? "bg-accent border-primary/20" : "bg-card border-border")}>
                                    <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", state.syncMode === m.id ? "border-primary" : "border-muted-foreground/30")}>
                                        {state.syncMode === m.id && <div className="w-2 h-2 rounded-full bg-primary" />}
                                    </div>
                                    <div><p className="text-xs font-medium">{m.label}</p></div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="p-4 border-t border-border space-y-3">
                    <Button onClick={handleProcess} disabled={isGenerating || !state.videoFile || !state.audioFile} className="w-full h-12 font-bold rounded-xl gap-2">
                        {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mic className="w-5 h-5" />}
                        {isGenerating ? 'Processing...' : 'Sync Lips'}
                    </Button>
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
                                                <Button size="icon" variant="secondary" className="rounded-full"><Download className="w-4 h-4" /></Button>
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
                                            <Image src={template.thumbnail} alt={template.title} fill className="object-cover" />
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
        </div>
    );
}

function LoadingGrid() {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
                <div key={i} className="aspect-video rounded-xl bg-muted animate-pulse" />
            ))}
        </div>
    );
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-muted-foreground/30" />
            </div>
            <p className="text-muted-foreground">{message}</p>
        </div>
    );
}
