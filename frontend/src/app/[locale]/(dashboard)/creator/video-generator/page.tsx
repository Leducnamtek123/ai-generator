'use client';

import Image from 'next/image';
import { useReducer, useRef } from 'react';
import { useGenerationStore } from '@/stores/generation-store';
import {
    ChevronDown,
    Upload,
    Sparkles,
    Grid3X3,
    Play,
    Globe,
    LayoutGrid,
    Loader2,
    Download,
    Folder,
    Video,
    Clock,
    Repeat,
} from 'lucide-react';
import { Button } from '@/ui/button';
import { Slider } from '@/ui/slider';
import { Label } from '@/ui/label';
import { cn } from '@/lib/utils';

const contentTabs = ['Personal', 'Community', 'Templates', 'Tutorials'];

const models = [
    { id: 'auto', label: 'Auto', description: 'Best model for your prompt' },
    { id: 'sora', label: 'Sora 2', description: 'OpenAI cinematic video' },
    { id: 'runway', label: 'Runway Gen-3', description: 'High quality video gen' },
    { id: 'kling', label: 'Kling 1.6', description: 'Fast video generation' },
    { id: 'minimax', label: 'MiniMax', description: 'Creative video synthesis' },
];

const durations = [
    { value: '4', label: '4s' },
    { value: '5', label: '5s' },
    { value: '8', label: '8s' },
    { value: '10', label: '10s' },
];

const aspectRatios = [
    { value: '16:9', label: '16:9' },
    { value: '9:16', label: '9:16' },
    { value: '1:1', label: '1:1' },
    { value: '4:3', label: '4:3' },
];

const tutorials = [
    {
        id: 't1',
        title: 'Generate a video',
        thumbnail: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&h=400&fit=crop',
        type: 'tutorial'
    },
    {
        id: 't2',
        title: 'Generate an image',
        thumbnail: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=400&fit=crop',
        type: 'tutorial'
    },
];

const moreTutorials = [
    { id: 'm1', title: 'Create mockups with Nano Banana', duration: '01:15', thumbnail: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=200&fit=crop' },
    { id: 'm2', title: 'Make products in realistic Contexts', duration: '00:56', thumbnail: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=200&fit=crop' },
    { id: 'm3', title: 'How to create cinematic videos', duration: '02:25', thumbnail: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=300&h=200&fit=crop' },
    { id: 'm4', title: 'Make consistent characters from one', duration: '01:40', thumbnail: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&h=200&fit=crop' },
];

type VideoPageState = {
    activeContentTab: string;
    selectedModel: string;
    showModelPicker: boolean;
    prompt: string;
    promptMode: 'Text' | 'Visual';
    duration: string;
    aspectRatio: string;
    startImage: string | null;
    endImage: string | null;
    enhancePrompt: boolean;
    motionIntensity: number;
};

type VideoPageAction =
    | { type: 'setActiveContentTab'; activeContentTab: string }
    | { type: 'setSelectedModel'; selectedModel: string }
    | { type: 'setShowModelPicker'; showModelPicker: boolean }
    | { type: 'setPrompt'; prompt: string }
    | { type: 'setPromptMode'; promptMode: 'Text' | 'Visual' }
    | { type: 'setDuration'; duration: string }
    | { type: 'setAspectRatio'; aspectRatio: string }
    | { type: 'setStartImage'; startImage: string | null }
    | { type: 'setEndImage'; endImage: string | null }
    | { type: 'toggleEnhancePrompt' }
    | { type: 'setMotionIntensity'; motionIntensity: number }
    | { type: 'resetImages' };

const initialState: VideoPageState = {
    activeContentTab: 'Tutorials',
    selectedModel: 'auto',
    showModelPicker: false,
    prompt: '',
    promptMode: 'Text',
    duration: '5',
    aspectRatio: '16:9',
    startImage: null,
    endImage: null,
    enhancePrompt: false,
    motionIntensity: 50,
};

function reducer(state: VideoPageState, action: VideoPageAction): VideoPageState {
    switch (action.type) {
        case 'setActiveContentTab':
            return { ...state, activeContentTab: action.activeContentTab };
        case 'setSelectedModel':
            return { ...state, selectedModel: action.selectedModel };
        case 'setShowModelPicker':
            return { ...state, showModelPicker: action.showModelPicker };
        case 'setPrompt':
            return { ...state, prompt: action.prompt };
        case 'setPromptMode':
            return { ...state, promptMode: action.promptMode };
        case 'setDuration':
            return { ...state, duration: action.duration };
        case 'setAspectRatio':
            return { ...state, aspectRatio: action.aspectRatio };
        case 'setStartImage':
            return { ...state, startImage: action.startImage };
        case 'setEndImage':
            return { ...state, endImage: action.endImage };
        case 'toggleEnhancePrompt':
            return { ...state, enhancePrompt: !state.enhancePrompt };
        case 'setMotionIntensity':
            return { ...state, motionIntensity: action.motionIntensity };
        case 'resetImages':
            return { ...state, startImage: null, endImage: null };
        default:
            return state;
    }
}

export default function VideoPage() {
    const { generateVideo, isGenerating, currentGeneration, reset } = useGenerationStore();
    const [state, dispatch] = useReducer(reducer, initialState);
    const startImageRef = useRef<HTMLInputElement>(null);
    const endImageRef = useRef<HTMLInputElement>(null);
    const resultVideo = currentGeneration?.status === 'completed' ? currentGeneration.resultUrl ?? null : null;

    const handleGenerate = async () => {
        if (!state.prompt.trim()) return;
        reset();
        await generateVideo({
            prompt: state.prompt,
            model: state.selectedModel !== 'auto' ? state.selectedModel : undefined,
            duration: state.duration,
            aspectRatio: state.aspectRatio,
            startImageUrl: state.startImage || undefined,
            endImageUrl: state.endImage || undefined,
        });
    };

    const handleImageUpload = (type: 'start' | 'end') => (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            reset();
            const url = URL.createObjectURL(file);
            if (type === 'start') dispatch({ type: 'setStartImage', startImage: url });
            else dispatch({ type: 'setEndImage', endImage: url });
        }
    };

    const currentModel = models.find(m => m.id === state.selectedModel);

    return (
        <div className="h-full bg-background text-foreground flex overflow-hidden">
            {/* Left Control Panel */}
            <div className="w-[300px] border-r border-border flex flex-col shrink-0">
                <div className="h-14 px-6 border-b border-border flex items-center shrink-0">
                    <h2 className="font-bold text-muted-foreground">Video Generator</h2>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {/* Browse Templates */}
                    <button className="flex items-center gap-3 w-full px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors">
                        <Grid3X3 className="w-5 h-5" />
                        <span>Browse templates</span>
                    </button>

                    {/* Model Selection */}
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Model</h4>
                        <div className="relative">
                            <button
                                onClick={() => dispatch({ type: 'setShowModelPicker', showModelPicker: !state.showModelPicker })}
                                className="flex items-center justify-between w-full px-4 py-3 bg-card rounded-xl border border-border hover:border-border/80 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <Sparkles className="w-5 h-5 text-muted-foreground" />
                                    <div className="text-left">
                                        <p className="text-sm font-medium">{currentModel?.label}</p>
                                        <p className="text-[10px] text-muted-foreground">{currentModel?.description}</p>
                                    </div>
                                </div>
                                <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", state.showModelPicker && "rotate-180")} />
                            </button>
                            {state.showModelPicker && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg z-10 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                                    {models.map((model) => (
                                        <button
                                            key={model.id}
                                            onClick={() => {
                                                dispatch({ type: 'setSelectedModel', selectedModel: model.id });
                                                dispatch({ type: 'setShowModelPicker', showModelPicker: false });
                                            }}
                                            className={cn("w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-accent transition-colors", state.selectedModel === model.id && "bg-accent")}
                                        >
                                            <div>
                                                <p className="text-xs font-medium">{model.label}</p>
                                                <p className="text-[10px] text-muted-foreground">{model.description}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* References */}
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">References</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col items-center gap-2">
                        <button
                            type="button"
                            onClick={() => startImageRef.current?.click()}
                            className="w-full aspect-square rounded-lg bg-muted border border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary/30 transition-colors overflow-hidden relative"
                        >
                            {state.startImage ? (
                                <Image src={state.startImage} alt="Start" fill className="object-cover" sizes="(max-width: 768px) 100vw, 300px" />
                            ) : (
                                <Upload className="w-6 h-6 text-muted-foreground/50" />
                            )}
                        </button>
                                <span className="text-[10px] text-muted-foreground">Start image</span>
                                <input type="file" ref={startImageRef} className="hidden" accept="image/*" onChange={handleImageUpload('start')} />
                            </div>
                            <div className="flex flex-col items-center gap-2">
                        <button
                            type="button"
                            onClick={() => endImageRef.current?.click()}
                            className="w-full aspect-square rounded-lg bg-muted border border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary/30 transition-colors overflow-hidden relative"
                        >
                            {state.endImage ? (
                                <Image src={state.endImage} alt="End" fill className="object-cover" sizes="(max-width: 768px) 100vw, 300px" />
                            ) : (
                                <Upload className="w-6 h-6 text-muted-foreground/50" />
                            )}
                        </button>
                                <span className="text-[10px] text-muted-foreground">End image</span>
                                <input type="file" ref={endImageRef} className="hidden" accept="image/*" onChange={handleImageUpload('end')} />
                            </div>
                        </div>
                    </div>

                    {/* Prompt */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Prompt</h4>
                            <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
                                <button onClick={() => dispatch({ type: 'setPromptMode', promptMode: 'Text' })} className={cn("px-3 py-1 text-xs rounded-md transition-colors", state.promptMode === 'Text' ? "bg-accent text-accent-foreground" : "text-muted-foreground")}>Text</button>
                                <button onClick={() => dispatch({ type: 'setPromptMode', promptMode: 'Visual' })} className={cn("px-3 py-1 text-xs rounded-md transition-colors", state.promptMode === 'Visual' ? "bg-accent text-accent-foreground" : "text-muted-foreground")}>Visual</button>
                            </div>
                        </div>
                        <textarea
                            value={state.prompt}
                            onChange={(e) => dispatch({ type: 'setPrompt', prompt: e.target.value })}
                            placeholder="Describe your video scene..."
                            className="w-full h-28 px-4 py-3 bg-card border border-border rounded-xl text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                        />
                    </div>

                    {/* Settings Row */}
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Settings</h4>
                        <div className="grid grid-cols-2 gap-2">
                            {/* Duration */}
                            <div className="space-y-2">
                                <div className="text-[9px] text-muted-foreground uppercase font-medium">Duration</div>
                                <div className="flex gap-1">
                                    {durations.map((d) => (
                                        <button key={d.value} onClick={() => dispatch({ type: 'setDuration', duration: d.value })} className={cn("flex-1 py-1.5 rounded-lg text-[10px] font-medium transition-all", state.duration === d.value ? "bg-accent border border-primary/20" : "bg-card border border-border")}>{d.label}</button>
                                    ))}
                                </div>
                            </div>
                            {/* Aspect Ratio */}
                            <div className="space-y-2">
                                <div className="text-[9px] text-muted-foreground uppercase font-medium">Ratio</div>
                                <div className="flex gap-1">
                                    {aspectRatios.map((ar) => (
                                        <button key={ar.value} onClick={() => dispatch({ type: 'setAspectRatio', aspectRatio: ar.value })} className={cn("flex-1 py-1.5 rounded-lg text-[10px] font-medium transition-all", state.aspectRatio === ar.value ? "bg-accent border border-primary/20" : "bg-card border border-border")}>{ar.label}</button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Motion Intensity */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Motion Intensity</Label>
                            <span className="text-[11px] font-mono text-foreground">{state.motionIntensity}%</span>
                        </div>
                        <Slider min={0} max={100} step={5} value={[state.motionIntensity]} onValueChange={([v]) => dispatch({ type: 'setMotionIntensity', motionIntensity: v })} />
                    </div>

                    {/* Enhance Toggle */}
                    <button onClick={() => dispatch({ type: 'toggleEnhancePrompt' })} className="w-full flex items-center justify-between px-4 py-3 bg-card rounded-xl border border-border">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-muted-foreground" />
                            <span className="text-xs font-medium">Enhance Prompt</span>
                        </div>
                        <div className={cn("w-9 h-5 rounded-full transition-colors flex items-center px-0.5", state.enhancePrompt ? "bg-primary" : "bg-muted-foreground/20")}>
                            <div className={cn("w-4 h-4 rounded-full bg-white shadow-sm transition-transform", state.enhancePrompt ? "translate-x-4" : "translate-x-0")} />
                        </div>
                    </button>

                    {/* Error Display */}
                    {currentGeneration?.error && (
                        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-xs text-destructive">
                            {currentGeneration.error}
                        </div>
                    )}
                </div>

                {/* Generate Button */}
                <div className="p-4 border-t border-border space-y-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                        <span>Cost:</span>
                        <span className="font-medium text-foreground">{parseInt(state.duration) <= 5 ? '5' : '10'} Credits</span>
                    </div>
                    <Button
                        onClick={handleGenerate}
                        disabled={isGenerating || !state.prompt.trim()}
                        className="w-full h-12 font-bold rounded-xl gap-2"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                {currentGeneration?.status === 'processing' ? 'Rendering...' : 'Starting...'}
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-5 h-5" />
                                Generate Video
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Result Header */}
                {resultVideo && (
                    <div className="h-14 px-6 border-b border-border flex items-center justify-between shrink-0 animate-in fade-in">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Just now</span>
                            <span>•</span>
                            <span>{currentModel?.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="secondary" size="sm" className="gap-2" onClick={() => reset()}>
                                <Repeat className="w-4 h-4" /> New
                            </Button>
                            <Button variant="outline" size="sm" className="gap-2"><Folder className="w-4 h-4" /> Save</Button>
                            <Button size="sm" className="gap-2"><Download className="w-4 h-4" /> Export</Button>
                        </div>
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    {/* Show video result if available */}
                    {isGenerating ? (
                        <div className="flex flex-col items-center justify-center h-full gap-6">
                            <div className="relative">
                                <div className="w-24 h-24 rounded-full border-4 border-muted border-t-primary animate-spin" />
                                <Video className="w-10 h-10 text-muted-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                            </div>
                            <div className="text-center">
                                <p className="font-semibold text-lg">Generating your video</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {currentGeneration?.status === 'processing'
                                        ? 'AI is rendering your video...'
                                        : 'Preparing generation...'}
                                </p>
                                <p className="text-xs text-muted-foreground mt-3">This typically takes 30-90 seconds</p>
                            </div>
                            <div className="w-64 h-2 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: currentGeneration?.status === 'processing' ? '60%' : '20%' }} />
                            </div>
                        </div>
                    ) : resultVideo ? (
                        <div className="flex items-center justify-center h-full p-8">
                            <div className="rounded-2xl overflow-hidden border border-border shadow-2xl max-w-3xl w-full animate-in fade-in zoom-in-95 duration-500">
                                <video src={resultVideo} controls autoPlay className="w-full max-h-[70vh]" />
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Content Header */}
                            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border px-6 h-14 flex items-center justify-between">
                                <div className="flex items-center gap-1">
                                    {contentTabs.map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => dispatch({ type: 'setActiveContentTab', activeContentTab: tab })}
                                            className={cn(
                                                "px-4 py-2 text-sm font-medium rounded-full transition-colors flex items-center gap-2",
                                                state.activeContentTab === tab
                                                    ? "bg-accent text-accent-foreground"
                                                    : "text-muted-foreground hover:text-foreground"
                                            )}
                                        >
                                            {tab === 'Community' && <Globe className="w-4 h-4" />}
                                            {tab === 'Templates' && <LayoutGrid className="w-4 h-4" />}
                                            {tab}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Tutorials Content */}
                            <div className="p-6 space-y-8">
                                <section>
                                    <h3 className="text-lg font-semibold mb-4">Getting started</h3>
                                    <div className="grid grid-cols-2 gap-6">
                                        {tutorials.map((tutorial) => (
                                            <div key={tutorial.id} className="group cursor-pointer relative rounded-2xl overflow-hidden">
                                                <div className="aspect-[16/9] relative">
                                                    <Image src={tutorial.thumbnail} alt={tutorial.title} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
                                                    <div className="absolute inset-0 bg-gray-950/40" />
                                                    <div className="absolute bottom-6 left-6">
                                                        <div className="w-12 h-12 rounded-full bg-foreground/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-foreground/30 transition-colors">
                                                            <Play className="w-6 h-6 text-white fill-white" />
                                                        </div>
                                                    </div>
                                                    <div className="absolute bottom-6 left-20">
                                                        <p className="text-xs text-white/60 mb-1">Tutorials</p>
                                                        <h4 className="text-xl font-semibold text-white">{tutorial.title}</h4>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                <section>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold">More tutorials</h3>
                                        <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                                            Featured
                                            <ChevronDown className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-4 gap-4">
                                        {moreTutorials.map((tutorial) => (
                                            <div key={tutorial.id} className="group cursor-pointer">
                                                <div className="aspect-video rounded-xl overflow-hidden relative bg-muted">
                                                    <Image src={tutorial.thumbnail} alt={tutorial.title} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 25vw" />
                                                    <div className="absolute inset-0 bg-gray-950/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <div className="w-10 h-10 rounded-full bg-foreground/20 backdrop-blur-sm flex items-center justify-center">
                                                            <Play className="w-5 h-5 text-white fill-white" />
                                                        </div>
                                                    </div>
                                                    <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-gray-950/60 rounded text-[10px] text-white">
                                                        {tutorial.duration}
                                                    </div>
                                                </div>
                                                <p className="mt-2 text-xs text-muted-foreground group-hover:text-foreground transition-colors line-clamp-2">
                                                    {tutorial.title}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
