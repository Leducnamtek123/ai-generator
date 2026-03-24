'use client';

import { useState, useRef } from 'react';
import { useGenerationStore } from '@/stores/generation-store';
import { ZoomIn, Upload, Download, Sparkles, Loader2, RotateCcw, Folder, Video, Settings, Check } from 'lucide-react';
import { Button } from '@/ui/button';
import { Slider } from '@/ui/slider';
import { Label } from '@/ui/label';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/ui/select';
import { cn } from '@/lib/utils';

const resolutions = [
    { id: '720p', label: '720p HD', description: '1280×720' },
    { id: '1080p', label: '1080p Full HD', description: '1920×1080' },
    { id: '2k', label: '2K QHD', description: '2560×1440' },
    { id: '4k', label: '4K Ultra HD', description: '3840×2160' },
];

const models = [
    { id: 'fast', label: 'Fast', description: 'Quick processing, good quality' },
    { id: 'balanced', label: 'Balanced', description: 'Best quality/speed ratio' },
    { id: 'quality', label: 'Ultra Quality', description: 'Maximum quality, slower' },
];

export default function VideoUpscalerPage() {
    const [videoFile, setVideoFile] = useState<string | null>(null);
    const [videoName, setVideoName] = useState('');
    const [resultVideo, setResultVideo] = useState<string | null>(null);
    const [targetResolution, setTargetResolution] = useState('4k');
    const [model, setModel] = useState('balanced');
    const [denoise, setDenoise] = useState(30);
    const [sharpen, setSharpen] = useState(50);
    const [fpsBoost, setFpsBoost] = useState(false);
    const [colorCorrection, setColorCorrection] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { upscaleVideo, currentGeneration, error: storeError } = useGenerationStore();

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setVideoFile(URL.createObjectURL(file));
            setVideoName(file.name);
            setResultVideo(null);
            setProgress(0);
        }
    };

    const handleUpscale = async () => {
        if (!videoFile) return;
        setIsProcessing(true);
        setProgress(0);
        // Start API call
        await upscaleVideo({
            videoUrl: videoFile,
            targetResolution,
            model,
            denoise,
            sharpen,
            fpsBoost,
        });
        setProgress(100);
        setResultVideo(videoFile);
        setIsProcessing(false);
    };

    return (
        <div className="h-full bg-background text-foreground flex overflow-hidden">
            <div className="w-[320px] border-r border-border flex flex-col shrink-0 bg-background">
                <div className="h-14 px-6 border-b border-border flex items-center shrink-0">
                    <h2 className="font-bold text-muted-foreground">Video Upscaler</h2>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Upload */}
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Source Video</h4>
                        <div onClick={() => fileInputRef.current?.click()} className="group relative aspect-video rounded-2xl bg-muted border-2 border-dashed border-border hover:border-primary/30 transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center gap-3">
                            {videoFile ? (
                                <><video src={videoFile} className="w-full h-full object-cover" muted /><div className="absolute bottom-2 left-2 right-2 px-2 py-1 bg-background/80 backdrop-blur-sm rounded-lg text-[10px] font-medium truncate">{videoName}</div></>
                            ) : (
                                <><div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center group-hover:scale-110 transition-all"><Video className="w-5 h-5 text-muted-foreground" /></div>
                                <div className="text-center"><p className="text-xs font-medium">Upload Video</p><p className="text-[10px] text-muted-foreground mt-1">MP4, MOV, WebM up to 500MB</p></div></>
                            )}
                        </div>
                        <input type="file" ref={fileInputRef} className="hidden" accept="video/*" onChange={handleFileUpload} />
                    </div>

                    {/* Target Resolution */}
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Target Resolution</h4>
                        <div className="grid grid-cols-2 gap-1.5">
                            {resolutions.map((res) => (
                                <button key={res.id} onClick={() => setTargetResolution(res.id)} className={cn("p-3 rounded-xl border transition-all text-left", targetResolution === res.id ? "bg-accent border-primary/20" : "bg-card border-border")}>
                                    <p className="text-[11px] font-bold">{res.label}</p>
                                    <p className="text-[9px] text-muted-foreground">{res.description}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Model */}
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Processing Mode</h4>
                        <div className="space-y-1.5">
                            {models.map((m) => (
                                <button key={m.id} onClick={() => setModel(m.id)} className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all text-left", model === m.id ? "bg-accent border-primary/20" : "bg-card border-border")}>
                                    <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", model === m.id ? "border-primary" : "border-muted-foreground/30")}>
                                        {model === m.id && <div className="w-2 h-2 rounded-full bg-primary" />}
                                    </div>
                                    <div><p className="text-xs font-medium">{m.label}</p><p className="text-[9px] text-muted-foreground">{m.description}</p></div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Enhancement Controls */}
                    <div className="space-y-5">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between"><Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Denoise</Label><span className="text-[11px] font-mono">{denoise}%</span></div>
                            <Slider min={0} max={100} step={5} value={[denoise]} onValueChange={([v]) => setDenoise(v)} />
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between"><Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Sharpen</Label><span className="text-[11px] font-mono">{sharpen}%</span></div>
                            <Slider min={0} max={100} step={5} value={[sharpen]} onValueChange={([v]) => setSharpen(v)} />
                        </div>
                    </div>

                    {/* Toggles */}
                    <div className="space-y-2">
                        <button onClick={() => setFpsBoost(!fpsBoost)} className="w-full flex items-center justify-between px-4 py-3 bg-card rounded-xl border border-border">
                            <div><span className="text-xs font-medium block">FPS Boost</span><span className="text-[9px] text-muted-foreground">Interpolate to 60fps</span></div>
                            <div className={cn("w-9 h-5 rounded-full transition-colors flex items-center px-0.5", fpsBoost ? "bg-primary" : "bg-muted-foreground/20")}>
                                <div className={cn("w-4 h-4 rounded-full bg-white shadow-sm transition-transform", fpsBoost ? "translate-x-4" : "translate-x-0")} />
                            </div>
                        </button>
                        <button onClick={() => setColorCorrection(!colorCorrection)} className="w-full flex items-center justify-between px-4 py-3 bg-card rounded-xl border border-border">
                            <div><span className="text-xs font-medium block">Auto Color Correction</span><span className="text-[9px] text-muted-foreground">Optimize colors & contrast</span></div>
                            <div className={cn("w-9 h-5 rounded-full transition-colors flex items-center px-0.5", colorCorrection ? "bg-primary" : "bg-muted-foreground/20")}>
                                <div className={cn("w-4 h-4 rounded-full bg-white shadow-sm transition-transform", colorCorrection ? "translate-x-4" : "translate-x-0")} />
                            </div>
                        </button>
                    </div>
                </div>
                <div className="p-4 border-t border-border space-y-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground px-1"><span>Cost:</span><span className="font-medium text-foreground">5 Credits/min</span></div>
                    <Button onClick={handleUpscale} disabled={isProcessing || !videoFile} className="w-full h-12 font-bold rounded-xl gap-2">
                        {isProcessing ? (<><Loader2 className="w-5 h-5 animate-spin" /> Processing {progress}%</>) : (<><ZoomIn className="w-5 h-5" /> Upscale Video</>)}
                    </Button>
                </div>
            </div>

            {/* Preview */}
            <div className="flex-1 flex flex-col min-w-0">
                {resultVideo && (
                    <div className="h-14 px-6 border-b border-border flex items-center justify-between shrink-0 animate-in fade-in">
                        <div className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /><span className="text-sm font-medium">Upscale complete — {resolutions.find(r => r.id === targetResolution)?.label}</span></div>
                        <div className="flex gap-2"><Button variant="outline" size="sm" className="gap-2"><Folder className="w-4 h-4" /> Save</Button><Button size="sm" className="gap-2"><Download className="w-4 h-4" /> Export</Button></div>
                    </div>
                )}
                <div className="flex-1 flex items-center justify-center p-8">
                    {!videoFile ? (
                        <div className="text-center space-y-4">
                            <div className="w-20 h-20 rounded-2xl bg-muted border border-border flex items-center justify-center mx-auto"><ZoomIn className="w-8 h-8 text-muted-foreground" /></div>
                            <div><h3 className="font-semibold">Video Upscaler</h3><p className="text-sm text-muted-foreground mt-1">Upscale videos to 4K or higher with AI enhancement</p></div>
                            <div className="flex flex-wrap justify-center gap-2 pt-2">{['4K Upscale', 'Denoise', 'FPS Boost', 'Color Fix'].map(t => (<span key={t} className="px-3 py-1.5 rounded-full bg-muted border border-border text-xs text-muted-foreground">{t}</span>))}</div>
                        </div>
                    ) : isProcessing ? (
                        <div className="flex flex-col items-center gap-6 w-full max-w-md">
                            <div className="relative"><div className="w-20 h-20 rounded-full border-4 border-muted border-t-primary animate-spin" /><ZoomIn className="w-8 h-8 text-muted-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" /></div>
                            <div className="text-center"><p className="font-medium">Upscaling to {resolutions.find(r => r.id === targetResolution)?.label}...</p><p className="text-sm text-muted-foreground mt-1">This may take several minutes</p></div>
                            <div className="w-full space-y-2">
                                <div className="w-full h-3 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${progress}%` }} /></div>
                                <p className="text-xs text-muted-foreground text-center">{progress}% complete</p>
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-2xl overflow-hidden border border-border shadow-2xl max-w-3xl w-full animate-in fade-in zoom-in-95 duration-500">
                            <video src={resultVideo || videoFile} controls className="w-full max-h-[70vh]" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
