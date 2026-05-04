'use client';

import Image from 'next/image';
import { useReducer, useRef } from 'react';
import { useGenerationStore } from '@/stores/generation-store';
import { Sparkles, Upload, Download, Loader2, RotateCcw, Eye, EyeOff, Folder, Droplets, SunMedium, Palette, TimerReset, Zap } from 'lucide-react';
import { Button } from '@/ui/button';
import { Slider } from '@/ui/slider';
import { Label } from '@/ui/label';
import { cn } from '@/lib/utils';

const enhancementModes = [
    { id: 'natural', label: 'Natural', description: 'Subtle, realistic enhancement' },
    { id: 'beauty', label: 'Beauty', description: 'Glamorous beauty retouch' },
    { id: 'professional', label: 'Professional', description: 'Studio-quality result' },
    { id: 'editorial', label: 'Editorial', description: 'Magazine-ready finish' },
];

const presets = [
    { id: 'clear-skin', label: 'Clear Skin', icon: Sparkles },
    { id: 'smooth', label: 'Smooth', icon: Droplets },
    { id: 'bright', label: 'Brighten', icon: SunMedium },
    { id: 'tone-even', label: 'Even Tone', icon: Palette },
    { id: 'anti-aging', label: 'Anti-aging', icon: TimerReset },
    { id: 'glow', label: 'Glow', icon: Zap },
];

type SkinEnhancerState = {
    uploadedImage: string | null;
    mode: string;
    selectedPresets: string[];
    smoothness: number;
    brightness: number;
    blemishRemoval: number;
    wrinkleReduction: number;
    eyeEnhance: number;
    showOriginal: boolean;
};

type SkinEnhancerAction =
    | { type: 'setUploadedImage'; uploadedImage: string | null }
    | { type: 'setMode'; mode: string }
    | { type: 'togglePreset'; presetId: string }
    | { type: 'setSmoothness'; smoothness: number }
    | { type: 'setBrightness'; brightness: number }
    | { type: 'setBlemishRemoval'; blemishRemoval: number }
    | { type: 'setWrinkleReduction'; wrinkleReduction: number }
    | { type: 'setEyeEnhance'; eyeEnhance: number }
    | { type: 'toggleShowOriginal' };

const initialState: SkinEnhancerState = {
    uploadedImage: null,
    mode: 'natural',
    selectedPresets: ['clear-skin'],
    smoothness: 50,
    brightness: 30,
    blemishRemoval: 70,
    wrinkleReduction: 40,
    eyeEnhance: 30,
    showOriginal: false,
};

function reducer(state: SkinEnhancerState, action: SkinEnhancerAction): SkinEnhancerState {
    switch (action.type) {
        case 'setUploadedImage':
            return { ...state, uploadedImage: action.uploadedImage };
        case 'setMode':
            return { ...state, mode: action.mode };
        case 'togglePreset':
            return {
                ...state,
                selectedPresets: state.selectedPresets.includes(action.presetId)
                    ? state.selectedPresets.filter((preset) => preset !== action.presetId)
                    : [...state.selectedPresets, action.presetId],
            };
        case 'setSmoothness':
            return { ...state, smoothness: action.smoothness };
        case 'setBrightness':
            return { ...state, brightness: action.brightness };
        case 'setBlemishRemoval':
            return { ...state, blemishRemoval: action.blemishRemoval };
        case 'setWrinkleReduction':
            return { ...state, wrinkleReduction: action.wrinkleReduction };
        case 'setEyeEnhance':
            return { ...state, eyeEnhance: action.eyeEnhance };
        case 'toggleShowOriginal':
            return { ...state, showOriginal: !state.showOriginal };
        default:
            return state;
    }
}

export default function SkinEnhancerPage() {
    const [state, dispatch] = useReducer(reducer, initialState);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { skinEnhance, currentGeneration, reset, isGenerating } = useGenerationStore();
    const resultImage = currentGeneration?.status === 'completed' ? currentGeneration.resultUrl ?? null : null;
    const isProcessing = isGenerating;

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            reset();
            dispatch({ type: 'setUploadedImage', uploadedImage: URL.createObjectURL(file) });
        }
    };

    const togglePreset = (id: string) => {
        dispatch({ type: 'togglePreset', presetId: id });
    };

    const handleEnhance = async () => {
        if (!state.uploadedImage) return;
        await skinEnhance({
            imageUrl: state.uploadedImage,
            level: state.smoothness,
            mode: state.mode,
            preserveDetails: true,
        });
    };

    return (
        <div className="h-full bg-background text-foreground flex overflow-hidden">
            <div className="w-[320px] border-r border-border flex flex-col shrink-0 bg-background">
                <div className="h-14 px-6 border-b border-border flex items-center shrink-0">
                    <h2 className="font-bold text-muted-foreground">Skin Enhancer</h2>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Upload */}
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="group relative aspect-[3/4] rounded-2xl bg-muted border-2 border-dashed border-border hover:border-primary/30 transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center gap-3">
                        {state.uploadedImage ? (
                            <Image src={state.uploadedImage} alt="Portrait" fill className="object-cover" sizes="(max-width: 768px) 100vw, 320px" />
                        ) : (
                            <><div className="w-14 h-14 rounded-xl bg-accent flex items-center justify-center group-hover:scale-110 transition-all"><Upload className="w-6 h-6 text-muted-foreground" /></div>
                            <div className="text-center"><p className="text-sm font-medium">Upload Portrait</p><p className="text-[10px] text-muted-foreground mt-1">Best with close-up face photos</p></div></>
                        )}
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />

                    {/* Mode */}
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Enhancement Mode</h4>
                        <div className="grid grid-cols-2 gap-1.5">
                            {enhancementModes.map((m) => (
                                <button key={m.id} onClick={() => dispatch({ type: 'setMode', mode: m.id })} className={cn("p-3 rounded-xl border transition-all text-left", state.mode === m.id ? "bg-accent border-primary/20" : "bg-card border-border")}>
                                    <p className="text-[11px] font-medium">{m.label}</p>
                                    <p className="text-[8px] text-muted-foreground">{m.description}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Quick Presets */}
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Quick Presets</h4>
                        <div className="flex flex-wrap gap-1.5">
                            {presets.map((p) => (
                                <button key={p.id} onClick={() => togglePreset(p.id)} className={cn("px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all inline-flex items-center gap-1.5", state.selectedPresets.includes(p.id) ? "bg-accent border border-primary/20 text-foreground" : "bg-card border border-border text-muted-foreground")}>
                                    <p.icon className="w-3 h-3" />
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Fine Controls */}
                    <div className="space-y-5">
                            {[
                            { label: 'Smoothness', value: state.smoothness, setValue: (value: number) => dispatch({ type: 'setSmoothness', smoothness: value }) },
                            { label: 'Brightness', value: state.brightness, setValue: (value: number) => dispatch({ type: 'setBrightness', brightness: value }) },
                            { label: 'Blemish Removal', value: state.blemishRemoval, setValue: (value: number) => dispatch({ type: 'setBlemishRemoval', blemishRemoval: value }) },
                            { label: 'Wrinkle Reduction', value: state.wrinkleReduction, setValue: (value: number) => dispatch({ type: 'setWrinkleReduction', wrinkleReduction: value }) },
                            { label: 'Eye Enhancement', value: state.eyeEnhance, setValue: (value: number) => dispatch({ type: 'setEyeEnhance', eyeEnhance: value }) },
                        ].map((ctrl) => (
                            <div key={ctrl.label} className="space-y-3">
                                <div className="flex items-center justify-between"><Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">{ctrl.label}</Label><span className="text-[11px] font-mono">{ctrl.value}%</span></div>
                                <Slider min={0} max={100} step={5} value={[ctrl.value]} onValueChange={([v]) => ctrl.setValue(v)} />
                            </div>
                        ))}
                    </div>
                </div>
                <div className="p-4 border-t border-border space-y-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground px-1"><span>Cost:</span><span className="font-medium text-foreground">1 Credit</span></div>
                    <Button onClick={handleEnhance} disabled={isProcessing || !state.uploadedImage} className="w-full h-12 font-bold rounded-xl gap-2">
                        {isProcessing ? (<><Loader2 className="w-5 h-5 animate-spin" /> Enhancing...</>) : (<><Sparkles className="w-5 h-5" /> Enhance Skin</>)}
                    </Button>
                </div>
            </div>

            {/* Main Preview */}
            <div className="flex-1 flex flex-col min-w-0">
                {resultImage && (
                    <div className="h-14 px-6 border-b border-border flex items-center justify-between shrink-0 animate-in fade-in">
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={() => dispatch({ type: 'toggleShowOriginal' })}>
                                {state.showOriginal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                {state.showOriginal ? 'Show Enhanced' : 'Show Original'}
                            </Button>
                            <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={() => reset()}><RotateCcw className="w-4 h-4" /> Reset</Button>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" className="gap-2"><Folder className="w-4 h-4" /> Save</Button>
                            <Button size="sm" className="gap-2"><Download className="w-4 h-4" /> Export</Button>
                        </div>
                    </div>
                )}
                <div className="flex-1 flex items-center justify-center p-8">
                    {!state.uploadedImage ? (
                        <div className="text-center space-y-4">
                            <div className="w-20 h-20 rounded-2xl bg-muted border border-border flex items-center justify-center mx-auto"><Sparkles className="w-8 h-8 text-muted-foreground" /></div>
                            <div><h3 className="font-semibold">AI Skin Enhancement</h3><p className="text-sm text-muted-foreground mt-1">Upload a portrait photo for natural-looking skin retouching</p></div>
                            <div className="flex flex-wrap justify-center gap-2 pt-2">{['Portraits', 'Selfies', 'Headshots', 'Fashion'].map(t => (<span key={t} className="px-3 py-1.5 rounded-full bg-muted border border-border text-xs text-muted-foreground">{t}</span>))}</div>
                        </div>
                    ) : isProcessing ? (
                        <div className="flex flex-col items-center gap-4"><div className="relative"><div className="w-16 h-16 rounded-full border-4 border-muted border-t-primary animate-spin" /><Sparkles className="w-6 h-6 text-muted-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" /></div><p className="text-sm text-muted-foreground animate-pulse">Enhancing skin...</p></div>
                    ) : (
                        <div className="relative rounded-2xl overflow-hidden border border-border shadow-2xl animate-in fade-in zoom-in-95 duration-500">
                            <Image src={state.showOriginal ? state.uploadedImage! : (resultImage || state.uploadedImage!)} alt="Preview" width={1600} height={1600} className="max-h-[70vh] w-auto object-contain" />
                            {resultImage && <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-background/80 backdrop-blur-md rounded-full border border-border text-xs font-medium">{state.showOriginal ? 'Original' : 'Enhanced'}</div>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
