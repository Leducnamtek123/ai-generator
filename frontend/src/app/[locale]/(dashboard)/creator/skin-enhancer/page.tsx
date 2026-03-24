'use client';

import { useState, useRef } from 'react';
import { useGenerationStore } from '@/stores/generation-store';
import { Sparkles, Upload, Download, Loader2, RotateCcw, Eye, EyeOff, Folder, Sliders } from 'lucide-react';
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
    { id: 'clear-skin', label: '✨ Clear Skin' },
    { id: 'smooth', label: '🧴 Smooth' },
    { id: 'bright', label: '☀️ Brighten' },
    { id: 'tone-even', label: '🎨 Even Tone' },
    { id: 'anti-aging', label: '⏰ Anti-aging' },
    { id: 'glow', label: '💫 Glow' },
];

export default function SkinEnhancerPage() {
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [mode, setMode] = useState('natural');
    const [selectedPresets, setSelectedPresets] = useState<string[]>(['clear-skin']);
    const [smoothness, setSmoothness] = useState(50);
    const [brightness, setBrightness] = useState(30);
    const [blemishRemoval, setBlemishRemoval] = useState(70);
    const [wrinkleReduction, setWrinkleReduction] = useState(40);
    const [eyeEnhance, setEyeEnhance] = useState(30);
    const [showOriginal, setShowOriginal] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { startGeneration } = useGenerationStore();

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) { setUploadedImage(URL.createObjectURL(file)); setResultImage(null); }
    };

    const togglePreset = (id: string) => {
        setSelectedPresets(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
    };

    const handleEnhance = async () => {
        if (!uploadedImage) return;
        setIsProcessing(true);
        await startGeneration('/generations/image', {
            prompt: `Skin enhancement: ${mode}, presets: ${selectedPresets.join(', ')}`,
            imageUrl: uploadedImage,
        });
        setResultImage(uploadedImage);
        setIsProcessing(false);
    };

    return (
        <div className="h-full bg-background text-foreground flex overflow-hidden">
            <div className="w-[320px] border-r border-border flex flex-col shrink-0 bg-background">
                <div className="h-14 px-6 border-b border-border flex items-center shrink-0">
                    <h2 className="font-bold text-muted-foreground">Skin Enhancer</h2>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Upload */}
                    <div onClick={() => fileInputRef.current?.click()} className="group relative aspect-[3/4] rounded-2xl bg-muted border-2 border-dashed border-border hover:border-primary/30 transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center gap-3">
                        {uploadedImage ? (<img src={uploadedImage} alt="Portrait" className="w-full h-full object-cover" />) : (
                            <><div className="w-14 h-14 rounded-xl bg-accent flex items-center justify-center group-hover:scale-110 transition-all"><Upload className="w-6 h-6 text-muted-foreground" /></div>
                            <div className="text-center"><p className="text-sm font-medium">Upload Portrait</p><p className="text-[10px] text-muted-foreground mt-1">Best with close-up face photos</p></div></>
                        )}
                    </div>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />

                    {/* Mode */}
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Enhancement Mode</h4>
                        <div className="grid grid-cols-2 gap-1.5">
                            {enhancementModes.map((m) => (
                                <button key={m.id} onClick={() => setMode(m.id)} className={cn("p-3 rounded-xl border transition-all text-left", mode === m.id ? "bg-accent border-primary/20" : "bg-card border-border")}>
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
                                <button key={p.id} onClick={() => togglePreset(p.id)} className={cn("px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all", selectedPresets.includes(p.id) ? "bg-accent border border-primary/20 text-foreground" : "bg-card border border-border text-muted-foreground")}>{p.label}</button>
                            ))}
                        </div>
                    </div>

                    {/* Fine Controls */}
                    <div className="space-y-5">
                        {[
                            { label: 'Smoothness', value: smoothness, setValue: setSmoothness },
                            { label: 'Brightness', value: brightness, setValue: setBrightness },
                            { label: 'Blemish Removal', value: blemishRemoval, setValue: setBlemishRemoval },
                            { label: 'Wrinkle Reduction', value: wrinkleReduction, setValue: setWrinkleReduction },
                            { label: 'Eye Enhancement', value: eyeEnhance, setValue: setEyeEnhance },
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
                    <Button onClick={handleEnhance} disabled={isProcessing || !uploadedImage} className="w-full h-12 font-bold rounded-xl gap-2">
                        {isProcessing ? (<><Loader2 className="w-5 h-5 animate-spin" /> Enhancing...</>) : (<><Sparkles className="w-5 h-5" /> Enhance Skin</>)}
                    </Button>
                </div>
            </div>

            {/* Main Preview */}
            <div className="flex-1 flex flex-col min-w-0">
                {resultImage && (
                    <div className="h-14 px-6 border-b border-border flex items-center justify-between shrink-0 animate-in fade-in">
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={() => setShowOriginal(!showOriginal)}>
                                {showOriginal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                {showOriginal ? 'Show Enhanced' : 'Show Original'}
                            </Button>
                            <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={() => setResultImage(null)}><RotateCcw className="w-4 h-4" /> Reset</Button>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" className="gap-2"><Folder className="w-4 h-4" /> Save</Button>
                            <Button size="sm" className="gap-2"><Download className="w-4 h-4" /> Export</Button>
                        </div>
                    </div>
                )}
                <div className="flex-1 flex items-center justify-center p-8">
                    {!uploadedImage ? (
                        <div className="text-center space-y-4">
                            <div className="w-20 h-20 rounded-2xl bg-muted border border-border flex items-center justify-center mx-auto"><Sparkles className="w-8 h-8 text-muted-foreground" /></div>
                            <div><h3 className="font-semibold">AI Skin Enhancement</h3><p className="text-sm text-muted-foreground mt-1">Upload a portrait photo for natural-looking skin retouching</p></div>
                            <div className="flex flex-wrap justify-center gap-2 pt-2">{['Portraits', 'Selfies', 'Headshots', 'Fashion'].map(t => (<span key={t} className="px-3 py-1.5 rounded-full bg-muted border border-border text-xs text-muted-foreground">{t}</span>))}</div>
                        </div>
                    ) : isProcessing ? (
                        <div className="flex flex-col items-center gap-4"><div className="relative"><div className="w-16 h-16 rounded-full border-4 border-muted border-t-primary animate-spin" /><Sparkles className="w-6 h-6 text-muted-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" /></div><p className="text-sm text-muted-foreground animate-pulse">Enhancing skin...</p></div>
                    ) : (
                        <div className="relative rounded-2xl overflow-hidden border border-border shadow-2xl animate-in fade-in zoom-in-95 duration-500">
                            <img src={showOriginal ? uploadedImage : (resultImage || uploadedImage)} alt="Preview" className="max-h-[70vh] w-auto object-contain" />
                            {resultImage && <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-background/80 backdrop-blur-md rounded-full border border-border text-xs font-medium">{showOriginal ? '🖼️ Original' : '✨ Enhanced'}</div>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
