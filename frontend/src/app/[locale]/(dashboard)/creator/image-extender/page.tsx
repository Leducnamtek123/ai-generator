'use client';

import { useState, useRef, useEffect } from 'react';
import { useGenerationStore } from '@/stores/generation-store';
import { Maximize, Upload, Download, Sparkles, Loader2, RotateCcw, Folder, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
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

export default function ImageExtenderPage() {
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [direction, setDirection] = useState('all');
    const [targetRatio, setTargetRatio] = useState('16:9');
    const [expandAmount, setExpandAmount] = useState(50);
    const [creativity, setCreativity] = useState(50);
    const [prompt, setPrompt] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { imageExtend, currentGeneration } = useGenerationStore();

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) { setUploadedImage(URL.createObjectURL(file)); setResultImage(null); }
    };

    // Watch for completed generation result
    useEffect(() => {
        if (currentGeneration?.status === 'completed' && currentGeneration.resultUrl) {
            setResultImage(currentGeneration.resultUrl);
            setIsProcessing(false);
        } else if (currentGeneration?.status === 'failed') {
            setIsProcessing(false);
        }
    }, [currentGeneration]);

    const handleExtend = async () => {
        if (!uploadedImage) return;
        setIsProcessing(true);
        await imageExtend({
            imageUrl: uploadedImage,
            direction,
            pixels: expandAmount,
            prompt: prompt || `Extend image ${direction}`,
        });
        setIsProcessing(false);
    };

    return (
        <div className="h-full bg-background text-foreground flex overflow-hidden">
            <div className="w-[320px] border-r border-border flex flex-col shrink-0 bg-background">
                <div className="h-14 px-6 border-b border-border flex items-center shrink-0">
                    <h2 className="font-bold text-muted-foreground">Image Extender</h2>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Upload */}
                    <div onClick={() => fileInputRef.current?.click()} className="group relative aspect-[4/3] rounded-2xl bg-muted border-2 border-dashed border-border hover:border-primary/30 transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center gap-3">
                        {uploadedImage ? (<img src={uploadedImage} alt="Preview" className="w-full h-full object-contain" />) : (
                            <><div className="w-14 h-14 rounded-xl bg-accent flex items-center justify-center group-hover:scale-110 transition-all"><Upload className="w-6 h-6 text-muted-foreground" /></div>
                            <div className="text-center"><p className="text-sm font-medium">Upload Image</p><p className="text-[10px] text-muted-foreground mt-1">Image to extend beyond borders</p></div></>
                        )}
                    </div>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />

                    {/* Direction */}
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Expand Direction</h4>
                        <div className="grid grid-cols-5 gap-1.5">
                            {expandDirections.map((d) => (
                                <button key={d.id} onClick={() => setDirection(d.id)} className={cn("flex flex-col items-center gap-1 p-2.5 rounded-xl border transition-all", direction === d.id ? "bg-accent border-primary/20" : "bg-card border-border")}>
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
                                <button key={r.id} onClick={() => setTargetRatio(r.id)} className={cn("px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all", targetRatio === r.id ? "bg-accent border border-primary/20" : "bg-card border border-border")}>{r.label}</button>
                            ))}
                        </div>
                    </div>

                    {/* Expand Amount */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between"><Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Expand Amount</Label><span className="text-[11px] font-mono">{expandAmount}%</span></div>
                        <Slider min={10} max={200} step={10} value={[expandAmount]} onValueChange={([v]) => setExpandAmount(v)} />
                    </div>

                    {/* Creativity */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between"><Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Creativity</Label><span className="text-[11px] font-mono">{creativity}%</span></div>
                        <Slider min={0} max={100} step={5} value={[creativity]} onValueChange={([v]) => setCreativity(v)} />
                    </div>

                    {/* Prompt */}
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Context Prompt (Optional)</h4>
                        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Describe what should appear in the extended area..." className="w-full h-20 bg-card border border-border rounded-xl p-3 text-xs resize-none outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground" />
                    </div>
                </div>
                <div className="p-4 border-t border-border space-y-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground px-1"><span>Cost:</span><span className="font-medium text-foreground">2 Credits</span></div>
                    <Button onClick={handleExtend} disabled={isProcessing || !uploadedImage} className="w-full h-12 font-bold rounded-xl gap-2">
                        {isProcessing ? (<><Loader2 className="w-5 h-5 animate-spin" /> Extending...</>) : (<><Maximize className="w-5 h-5" /> Extend Image</>)}
                    </Button>
                </div>
            </div>

            <div className="flex-1 flex flex-col min-w-0">
                {resultImage && (
                    <div className="h-14 px-6 border-b border-border flex items-center justify-end gap-2 shrink-0">
                        <Button variant="ghost" size="sm" className="gap-1.5 text-xs mr-auto" onClick={() => setResultImage(null)}><RotateCcw className="w-4 h-4" /> Reset</Button>
                        <Button variant="outline" size="sm" className="gap-2"><Folder className="w-4 h-4" /> Save</Button>
                        <Button size="sm" className="gap-2"><Download className="w-4 h-4" /> Export</Button>
                    </div>
                )}
                <div className="flex-1 flex items-center justify-center p-8">
                    {!uploadedImage ? (
                        <div className="text-center space-y-4">
                            <div className="w-20 h-20 rounded-2xl bg-muted border border-border flex items-center justify-center mx-auto"><Maximize className="w-8 h-8 text-muted-foreground" /></div>
                            <div><h3 className="font-semibold">Extend Images with AI</h3><p className="text-sm text-muted-foreground mt-1">Upload an image to expand beyond its borders with AI outpainting</p></div>
                        </div>
                    ) : isProcessing ? (
                        <div className="flex flex-col items-center gap-4"><div className="relative"><div className="w-16 h-16 rounded-full border-4 border-muted border-t-primary animate-spin" /><Maximize className="w-6 h-6 text-muted-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" /></div><p className="text-sm text-muted-foreground animate-pulse">Extending image...</p></div>
                    ) : (
                        <div className="rounded-2xl border border-border shadow-2xl overflow-hidden bg-[repeating-conic-gradient(#80808010_0%_25%,transparent_0%_50%)] bg-[length:16px_16px]">
                            <img src={resultImage || uploadedImage} alt="Result" className="max-h-[70vh] w-auto object-contain" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
