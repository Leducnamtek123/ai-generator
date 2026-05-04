'use client';

import Image from 'next/image';
import { useReducer, useRef } from 'react';
import { useGenerationStore } from '@/stores/generation-store';
import { Maximize, Upload, Download, Loader2, RotateCcw, Folder, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/ui/button';
import { Slider } from '@/ui/slider';
import { Label } from '@/ui/label';
import { cn } from '@/lib/utils';

const expandDirections = [
    { id: 'all', label: 'All Sides', icon: Maximize },
    { id: 'left', label: 'Left', icon: ArrowLeft },
    { id: 'right', label: 'Right', icon: ArrowRight },
    { id: 'up', label: 'Up', icon: ArrowUp },
    { id: 'down', label: 'Down', icon: ArrowDown },
];

const targetRatios = [
    { id: '1:1', label: '1:1 Square' },
    { id: '16:9', label: '16:9 Wide' },
    { id: '9:16', label: '9:16 Tall' },
    { id: '4:3', label: '4:3 Standard' },
    { id: '3:2', label: '3:2 Photo' },
    { id: '21:9', label: '21:9 Ultra Wide' },
    { id: 'custom', label: 'Custom' },
];

type ImageExtenderState = {
    uploadedImage: string | null;
    direction: string;
    targetRatio: string;
    expandAmount: number;
    creativity: number;
    prompt: string;
};

type ImageExtenderAction =
    | { type: 'setUploadedImage'; uploadedImage: string | null }
    | { type: 'setDirection'; direction: string }
    | { type: 'setTargetRatio'; targetRatio: string }
    | { type: 'setExpandAmount'; expandAmount: number }
    | { type: 'setCreativity'; creativity: number }
    | { type: 'setPrompt'; prompt: string };

const initialState: ImageExtenderState = {
    uploadedImage: null,
    direction: 'all',
    targetRatio: '16:9',
    expandAmount: 50,
    creativity: 50,
    prompt: '',
};

function reducer(state: ImageExtenderState, action: ImageExtenderAction): ImageExtenderState {
    switch (action.type) {
        case 'setUploadedImage':
            return { ...state, uploadedImage: action.uploadedImage };
        case 'setDirection':
            return { ...state, direction: action.direction };
        case 'setTargetRatio':
            return { ...state, targetRatio: action.targetRatio };
        case 'setExpandAmount':
            return { ...state, expandAmount: action.expandAmount };
        case 'setCreativity':
            return { ...state, creativity: action.creativity };
        case 'setPrompt':
            return { ...state, prompt: action.prompt };
        default:
            return state;
    }
}

export default function ImageExtenderPage() {
    const [state, dispatch] = useReducer(reducer, initialState);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { imageExtend, currentGeneration, reset, isGenerating } = useGenerationStore();
    const resultImage = currentGeneration?.status === 'completed' ? currentGeneration.resultUrl ?? null : null;
    const isProcessing = isGenerating;

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            reset();
            dispatch({ type: 'setUploadedImage', uploadedImage: URL.createObjectURL(file) });
        }
    };

    const handleExtend = async () => {
        if (!state.uploadedImage) return;
        await imageExtend({
            imageUrl: state.uploadedImage,
            direction: state.direction,
            pixels: state.expandAmount,
            prompt: state.prompt || `Extend image ${state.direction}`,
        });
    };

    return (
        <div className="h-full bg-background text-foreground flex overflow-hidden">
            <div className="w-[320px] border-r border-border flex flex-col shrink-0 bg-background">
                <div className="h-14 px-6 border-b border-border flex items-center shrink-0">
                    <h2 className="font-bold text-muted-foreground">Image Extender</h2>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Upload */}
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="group relative aspect-[4/3] rounded-2xl bg-muted border-2 border-dashed border-border hover:border-primary/30 transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center gap-3">
                        {state.uploadedImage ? (<div className="relative h-full w-full"><Image src={state.uploadedImage} alt="Preview" fill className="object-contain" sizes="320px" /></div>) : (
                            <><div className="w-14 h-14 rounded-xl bg-accent flex items-center justify-center group-hover:scale-110 transition-all"><Upload className="w-6 h-6 text-muted-foreground" /></div>
                            <div className="text-center"><p className="text-sm font-medium">Upload Image</p><p className="text-[10px] text-muted-foreground mt-1">Image to extend beyond borders</p></div></>
                        )}
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />

                    {/* Direction */}
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Expand Direction</h4>
                        <div className="grid grid-cols-5 gap-1.5">
                            {expandDirections.map((d) => (
                                <button key={d.id} onClick={() => dispatch({ type: 'setDirection', direction: d.id })} className={cn("flex flex-col items-center gap-1 p-2.5 rounded-xl border transition-all", state.direction === d.id ? "bg-accent border-primary/20" : "bg-card border-border")}>
                                    <d.icon className="w-4 h-4" />
                                    <span className="text-[8px] font-medium">{d.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Target Ratio */}
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Target Ratio</h4>
                        <div className="flex flex-wrap gap-1.5">
                            {targetRatios.map((r) => (
                                <button key={r.id} onClick={() => dispatch({ type: 'setTargetRatio', targetRatio: r.id })} className={cn("px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all", state.targetRatio === r.id ? "bg-accent border border-primary/20" : "bg-card border border-border")}>{r.label}</button>
                            ))}
                        </div>
                    </div>

                    {/* Expand Amount */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between"><Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Expand Amount</Label><span className="text-[11px] font-mono">{state.expandAmount}%</span></div>
                        <Slider min={10} max={200} step={10} value={[state.expandAmount]} onValueChange={([v]) => dispatch({ type: 'setExpandAmount', expandAmount: v })} />
                    </div>

                    {/* Creativity */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between"><Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Creativity</Label><span className="text-[11px] font-mono">{state.creativity}%</span></div>
                        <Slider min={0} max={100} step={5} value={[state.creativity]} onValueChange={([v]) => dispatch({ type: 'setCreativity', creativity: v })} />
                    </div>

                    {/* Prompt */}
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Context Prompt (Optional)</h4>
                        <textarea value={state.prompt} onChange={(e) => dispatch({ type: 'setPrompt', prompt: e.target.value })} placeholder="Describe what should appear in the extended area..." className="w-full h-20 bg-card border border-border rounded-xl p-3 text-xs resize-none outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground" />
                    </div>
                </div>
                <div className="p-4 border-t border-border space-y-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground px-1"><span>Cost:</span><span className="font-medium text-foreground">2 Credits</span></div>
                    <Button onClick={handleExtend} disabled={isProcessing || !state.uploadedImage} className="w-full h-12 font-bold rounded-xl gap-2">
                        {isProcessing ? (<><Loader2 className="w-5 h-5 animate-spin" /> Extending...</>) : (<><Maximize className="w-5 h-5" /> Extend Image</>)}
                    </Button>
                </div>
            </div>

            <div className="flex-1 flex flex-col min-w-0">
                {resultImage && (
                    <div className="h-14 px-6 border-b border-border flex items-center justify-end gap-2 shrink-0">
                        <Button variant="ghost" size="sm" className="gap-1.5 text-xs mr-auto" onClick={() => reset()}><RotateCcw className="w-4 h-4" /> Reset</Button>
                        <Button variant="outline" size="sm" className="gap-2"><Folder className="w-4 h-4" /> Save</Button>
                        <Button size="sm" className="gap-2"><Download className="w-4 h-4" /> Export</Button>
                    </div>
                )}
                <div className="flex-1 flex items-center justify-center p-8">
                    {!state.uploadedImage ? (
                        <div className="text-center space-y-4">
                            <div className="w-20 h-20 rounded-2xl bg-muted border border-border flex items-center justify-center mx-auto"><Maximize className="w-8 h-8 text-muted-foreground" /></div>
                            <div><h3 className="font-semibold">Extend Images with AI</h3><p className="text-sm text-muted-foreground mt-1">Upload an image to expand beyond its borders with AI outpainting</p></div>
                        </div>
                    ) : isProcessing ? (
                        <div className="flex flex-col items-center gap-4"><div className="relative"><div className="w-16 h-16 rounded-full border-4 border-muted border-t-primary animate-spin" /><Maximize className="w-6 h-6 text-muted-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" /></div><p className="text-sm text-muted-foreground animate-pulse">Extending image...</p></div>
                    ) : (
                        <div className="relative h-[70vh] w-full max-w-5xl rounded-2xl border border-border shadow-2xl overflow-hidden bg-[repeating-conic-gradient(#80808010_0%_25%,transparent_0%_50%)] bg-[length:16px_16px]">
                            <Image src={resultImage || state.uploadedImage} alt="Result" fill className="object-contain" sizes="100vw" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
