'use client';

import { useReducer, useRef } from 'react';
import { useGenerationStore } from '@/stores/generation-store';
import { ZoomIn, Download, Loader2, Folder, Video, Check } from 'lucide-react';
import { Button } from '@/ui/button';
import { Slider } from '@/ui/slider';
import { Label } from '@/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/select';
import { cn } from '@/lib/utils';

const resolutions = [
    { id: '720p', label: '720p HD', description: '1280x720' },
    { id: '1080p', label: '1080p Full HD', description: '1920x1080' },
    { id: '2k', label: '2K QHD', description: '2560x1440' },
    { id: '4k', label: '4K Ultra HD', description: '3840x2160' },
];

const models = [
    { id: 'fast', label: 'Fast', description: 'Quick processing, good quality' },
    { id: 'balanced', label: 'Balanced', description: 'Best quality/speed ratio' },
    { id: 'quality', label: 'Ultra Quality', description: 'Maximum quality, slower' },
];

type State = {
    videoFile: string | null;
    videoName: string;
    targetResolution: string;
    model: string;
    denoise: number;
    sharpen: number;
    fpsBoost: boolean;
    colorCorrection: boolean;
    progress: number;
};

type Action =
    | { type: 'setVideo'; videoFile: string; videoName: string }
    | { type: 'setTargetResolution'; targetResolution: string }
    | { type: 'setModel'; model: string }
    | { type: 'setDenoise'; denoise: number }
    | { type: 'setSharpen'; sharpen: number }
    | { type: 'toggleFpsBoost' }
    | { type: 'toggleColorCorrection' }
    | { type: 'setProgress'; progress: number }
    | { type: 'resetProgress' };

const initialState: State = {
    videoFile: null,
    videoName: '',
    targetResolution: '4k',
    model: 'balanced',
    denoise: 30,
    sharpen: 50,
    fpsBoost: false,
    colorCorrection: true,
    progress: 0,
};

function reducer(state: State, action: Action): State {
    switch (action.type) {
        case 'setVideo':
            return {
                ...state,
                videoFile: action.videoFile,
                videoName: action.videoName,
                progress: 0,
            };
        case 'setTargetResolution':
            return { ...state, targetResolution: action.targetResolution };
        case 'setModel':
            return { ...state, model: action.model };
        case 'setDenoise':
            return { ...state, denoise: action.denoise };
        case 'setSharpen':
            return { ...state, sharpen: action.sharpen };
        case 'toggleFpsBoost':
            return { ...state, fpsBoost: !state.fpsBoost };
        case 'toggleColorCorrection':
            return { ...state, colorCorrection: !state.colorCorrection };
        case 'setProgress':
            return { ...state, progress: action.progress };
        case 'resetProgress':
            return { ...state, progress: 0 };
        default:
            return state;
    }
}

export default function VideoUpscalerPage() {
    const [state, dispatch] = useReducer(reducer, initialState);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { upscaleVideo, currentGeneration, reset, isGenerating } = useGenerationStore();
    const resultVideo = currentGeneration?.status === 'completed' ? currentGeneration.resultUrl ?? null : null;
    const isProcessing = isGenerating;

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        reset();
        dispatch({
            type: 'setVideo',
            videoFile: URL.createObjectURL(file),
            videoName: file.name,
        });
    };

    const handleUpscale = async () => {
        if (!state.videoFile) return;

        dispatch({ type: 'setProgress', progress: 0 });
        await upscaleVideo({
            videoUrl: state.videoFile,
            targetResolution: state.targetResolution,
            model: state.model,
            denoise: state.denoise,
            sharpen: state.sharpen,
            fpsBoost: state.fpsBoost,
        });
        dispatch({ type: 'setProgress', progress: 100 });
    };

    const selectedResolution = resolutions.find((resolution) => resolution.id === state.targetResolution);

    return (
        <div className="h-full bg-background text-foreground flex overflow-hidden">
            <div className="w-[320px] border-r border-border flex flex-col shrink-0 bg-background">
                <div className="h-14 px-6 border-b border-border flex items-center shrink-0">
                    <h2 className="font-bold text-muted-foreground">Video Upscaler</h2>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Source Video</h4>
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="group relative aspect-video rounded-2xl bg-muted border-2 border-dashed border-border hover:border-primary/30 transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center gap-3"
                        >
                            {state.videoFile ? (
                                <>
                                    <video src={state.videoFile} className="w-full h-full object-cover" muted />
                                    <div className="absolute bottom-2 left-2 right-2 px-2 py-1 bg-background/80 backdrop-blur-sm rounded-lg text-[10px] font-medium truncate">
                                        {state.videoName}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center group-hover:scale-110 transition-all">
                                        <Video className="w-5 h-5 text-muted-foreground" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs font-medium">Upload Video</p>
                                        <p className="text-[10px] text-muted-foreground mt-1">MP4, MOV, WebM up to 500MB</p>
                                    </div>
                                </>
                            )}
                        </button>
                        <input type="file" ref={fileInputRef} className="hidden" accept="video/*" onChange={handleFileUpload} />
                    </div>

                    <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Target Resolution</h4>
                        <div className="grid grid-cols-2 gap-1.5">
                            {resolutions.map((resolution) => (
                                <button
                                    key={resolution.id}
                                    onClick={() => dispatch({ type: 'setTargetResolution', targetResolution: resolution.id })}
                                    className={cn(
                                        'p-3 rounded-xl border transition-all text-left',
                                        state.targetResolution === resolution.id ? 'bg-accent border-primary/20' : 'bg-card border-border',
                                    )}
                                >
                                    <p className="text-[11px] font-bold">{resolution.label}</p>
                                    <p className="text-[9px] text-muted-foreground">{resolution.description}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Processing Mode</h4>
                        <Select value={state.model} onValueChange={(value) => dispatch({ type: 'setModel', model: value })}>
                            <SelectTrigger>
                                <SelectValue placeholder="Choose mode" />
                            </SelectTrigger>
                            <SelectContent>
                                {models.map((model) => (
                                    <SelectItem key={model.id} value={model.id}>
                                        {model.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-5">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Denoise</Label>
                                <span className="text-[11px] font-mono">{state.denoise}%</span>
                            </div>
                            <Slider min={0} max={100} step={5} value={[state.denoise]} onValueChange={([value]) => dispatch({ type: 'setDenoise', denoise: value })} />
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Sharpen</Label>
                                <span className="text-[11px] font-mono">{state.sharpen}%</span>
                            </div>
                            <Slider min={0} max={100} step={5} value={[state.sharpen]} onValueChange={([value]) => dispatch({ type: 'setSharpen', sharpen: value })} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <button
                            onClick={() => dispatch({ type: 'toggleFpsBoost' })}
                            className="w-full flex items-center justify-between px-4 py-3 bg-card rounded-xl border border-border"
                        >
                            <div>
                                <span className="text-xs font-medium block">FPS Boost</span>
                                <span className="text-[9px] text-muted-foreground">Interpolate to 60fps</span>
                            </div>
                            <div className={cn('w-9 h-5 rounded-full transition-colors flex items-center px-0.5', state.fpsBoost ? 'bg-primary' : 'bg-muted-foreground/20')}>
                                <div className={cn('w-4 h-4 rounded-full bg-white shadow-sm transition-transform', state.fpsBoost ? 'translate-x-4' : 'translate-x-0')} />
                            </div>
                        </button>

                        <button
                            onClick={() => dispatch({ type: 'toggleColorCorrection' })}
                            className="w-full flex items-center justify-between px-4 py-3 bg-card rounded-xl border border-border"
                        >
                            <div>
                                <span className="text-xs font-medium block">Auto Color Correction</span>
                                <span className="text-[9px] text-muted-foreground">Optimize colors & contrast</span>
                            </div>
                            <div className={cn('w-9 h-5 rounded-full transition-colors flex items-center px-0.5', state.colorCorrection ? 'bg-primary' : 'bg-muted-foreground/20')}>
                                <div className={cn('w-4 h-4 rounded-full bg-white shadow-sm transition-transform', state.colorCorrection ? 'translate-x-4' : 'translate-x-0')} />
                            </div>
                        </button>
                    </div>
                </div>

                <div className="p-4 border-t border-border space-y-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                        <span>Cost:</span>
                        <span className="font-medium text-foreground">5 Credits/min</span>
                    </div>
                    <Button onClick={handleUpscale} disabled={isProcessing || !state.videoFile} className="w-full h-12 font-bold rounded-xl gap-2">
                        {isProcessing ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Processing {state.progress}%
                            </>
                        ) : (
                            <>
                                <ZoomIn className="w-5 h-5" />
                                Upscale Video
                            </>
                        )}
                    </Button>
                </div>
            </div>

            <div className="flex-1 flex flex-col min-w-0">
                {resultVideo && (
                    <div className="h-14 px-6 border-b border-border flex items-center justify-between shrink-0 animate-in fade-in">
                        <div className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-green-500" />
                            <span className="text-sm font-medium">
                                Upscale complete - {selectedResolution?.label}
                            </span>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="gap-2"><Folder className="w-4 h-4" /> Save</Button>
                            <Button size="sm" className="gap-2"><Download className="w-4 h-4" /> Export</Button>
                        </div>
                    </div>
                )}

                <div className="flex-1 flex items-center justify-center p-8">
                    {!state.videoFile ? (
                        <div className="text-center space-y-4">
                            <div className="w-20 h-20 rounded-2xl bg-muted border border-border flex items-center justify-center mx-auto">
                                <ZoomIn className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <div>
                                <h3 className="font-semibold">Video Upscaler</h3>
                                <p className="text-sm text-muted-foreground mt-1">Upscale videos to 4K or higher with AI enhancement</p>
                            </div>
                            <div className="flex flex-wrap justify-center gap-2 pt-2">
                                {['4K Upscale', 'Denoise', 'FPS Boost', 'Color Fix'].map((tag) => (
                                    <span key={tag} className="px-3 py-1.5 rounded-full bg-muted border border-border text-xs text-muted-foreground">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ) : isProcessing ? (
                        <div className="flex flex-col items-center gap-6 w-full max-w-md">
                            <div className="relative">
                                <div className="w-20 h-20 rounded-full border-4 border-muted border-t-primary animate-spin" />
                                <ZoomIn className="w-8 h-8 text-muted-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                            </div>
                            <div className="text-center">
                                <p className="font-medium">Upscaling to {selectedResolution?.label}...</p>
                                <p className="text-sm text-muted-foreground mt-1">This may take several minutes</p>
                            </div>
                            <div className="w-full space-y-2">
                                <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                                    <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${state.progress}%` }} />
                                </div>
                                <p className="text-xs text-muted-foreground text-center">{state.progress}% complete</p>
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-2xl overflow-hidden border border-border shadow-2xl max-w-3xl w-full animate-in fade-in zoom-in-95 duration-500">
                            <video src={resultVideo || state.videoFile} controls className="w-full max-h-[70vh]" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
