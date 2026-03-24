'use client';

import { useState, useRef } from 'react';
import { useGenerationStore } from '@/stores/generation-store';
import {
    Camera,
    Upload,
    Download,
    Sparkles,
    Loader2,
    RotateCcw,
    Eye,
    MoveUp,
    MoveDown,
    MoveLeft,
    MoveRight,
    ZoomIn,
    ZoomOut,
    Folder,
    ArrowUp,
    ArrowDown,
    ArrowLeft,
    ArrowRight,
    Target,
    Maximize
} from 'lucide-react';
import { Button } from '@/ui/button';
import { Slider } from '@/ui/slider';
import { Label } from '@/ui/label';
import { cn } from '@/lib/utils';

const cameraAngles = [
    { id: 'front', label: 'Front View', icon: '🎯' },
    { id: 'side-left', label: 'Left Side', icon: '⬅️' },
    { id: 'side-right', label: 'Right Side', icon: '➡️' },
    { id: 'top-down', label: 'Top Down', icon: '⬇️' },
    { id: 'low-angle', label: 'Low Angle', icon: '⬆️' },
    { id: 'birds-eye', label: "Bird's Eye", icon: '🦅' },
    { id: '3-quarter', label: '3/4 View', icon: '📐' },
    { id: 'back', label: 'Back View', icon: '🔄' },
    { id: 'dutch', label: 'Dutch Angle', icon: '📏' },
    { id: 'close-up', label: 'Close Up', icon: '🔍' },
    { id: 'wide', label: 'Wide Shot', icon: '🌄' },
    { id: 'macro', label: 'Macro', icon: '🔬' },
];

const focalLengths = [
    { value: '14mm', label: '14mm Ultra Wide' },
    { value: '24mm', label: '24mm Wide' },
    { value: '35mm', label: '35mm Standard' },
    { value: '50mm', label: '50mm Normal' },
    { value: '85mm', label: '85mm Portrait' },
    { value: '135mm', label: '135mm Telephoto' },
    { value: '200mm', label: '200mm Super Tele' },
];

export default function CameraChangePage() {
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [selectedAngle, setSelectedAngle] = useState('front');
    const [focalLength, setFocalLength] = useState('50mm');
    const [rotation, setRotation] = useState(0);
    const [tilt, setTilt] = useState(0);
    const [zoom, setZoom] = useState(100);
    const [dof, setDof] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { startGeneration } = useGenerationStore();

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setUploadedImage(URL.createObjectURL(file));
            setResultImage(null);
        }
    };

    const handleProcess = async () => {
        if (!uploadedImage) return;
        setIsProcessing(true);
        await startGeneration('/generations/image', {
            prompt: `Camera angle change to ${selectedAngle}, focal length ${focalLength}`,
            imageUrl: uploadedImage,
        });
        setResultImage(uploadedImage);
        setIsProcessing(false);
    };

    return (
        <div className="h-full bg-background text-foreground flex overflow-hidden">
            {/* Left Control Panel */}
            <div className="w-[320px] border-r border-border flex flex-col shrink-0 bg-background">
                <div className="h-14 px-6 border-b border-border flex items-center justify-between shrink-0">
                    <h2 className="font-bold text-muted-foreground">Camera Change</h2>
                    <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-primary/10 border border-primary/20 rounded-full text-primary text-[10px] font-bold">
                        <Sparkles className="w-2.5 h-2.5" /> New
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Upload */}
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="group relative aspect-[4/3] rounded-2xl bg-muted border-2 border-dashed border-border hover:border-primary/30 transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center gap-3"
                    >
                        {uploadedImage ? (
                            <img src={uploadedImage} alt="Preview" className="w-full h-full object-contain" />
                        ) : (
                            <>
                                <div className="w-14 h-14 rounded-xl bg-accent flex items-center justify-center group-hover:scale-110 transition-all">
                                    <Upload className="w-6 h-6 text-muted-foreground" />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-medium">Upload Image</p>
                                    <p className="text-[10px] text-muted-foreground mt-1">Upload the image to change perspective</p>
                                </div>
                            </>
                        )}
                    </div>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />

                    {/* Camera Angle */}
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Camera Angle</h4>
                        <div className="grid grid-cols-3 gap-1.5">
                            {cameraAngles.map((angle) => (
                                <button
                                    key={angle.id}
                                    onClick={() => setSelectedAngle(angle.id)}
                                    className={cn(
                                        "flex flex-col items-center gap-1 p-2.5 rounded-xl border transition-all",
                                        selectedAngle === angle.id
                                            ? "bg-accent border-primary/20 text-foreground"
                                            : "bg-card border-border text-muted-foreground hover:border-border/80"
                                    )}
                                >
                                    <span className="text-base">{angle.icon}</span>
                                    <span className="text-[9px] font-medium truncate w-full text-center">{angle.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Focal Length */}
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Focal Length</h4>
                        <div className="flex flex-wrap gap-1.5">
                            {focalLengths.map((fl) => (
                                <button
                                    key={fl.value}
                                    onClick={() => setFocalLength(fl.value)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all",
                                        focalLength === fl.value
                                            ? "bg-accent border border-primary/20 text-foreground"
                                            : "bg-card border border-border text-muted-foreground"
                                    )}
                                >
                                    {fl.value}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Fine Controls */}
                    <div className="space-y-5">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Rotation</Label>
                                <span className="text-[11px] font-mono text-foreground">{rotation}°</span>
                            </div>
                            <Slider min={-180} max={180} step={5} value={[rotation]} onValueChange={([v]) => setRotation(v)} />
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Tilt</Label>
                                <span className="text-[11px] font-mono text-foreground">{tilt}°</span>
                            </div>
                            <Slider min={-90} max={90} step={5} value={[tilt]} onValueChange={([v]) => setTilt(v)} />
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Zoom</Label>
                                <span className="text-[11px] font-mono text-foreground">{zoom}%</span>
                            </div>
                            <Slider min={50} max={200} step={5} value={[zoom]} onValueChange={([v]) => setZoom(v)} />
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Depth of Field</Label>
                                <span className="text-[11px] font-mono text-foreground">{dof}</span>
                            </div>
                            <Slider min={0} max={100} step={5} value={[dof]} onValueChange={([v]) => setDof(v)} />
                        </div>
                    </div>
                </div>

                {/* Generate */}
                <div className="p-4 border-t border-border bg-background space-y-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                        <span>Cost:</span>
                        <span className="font-medium text-foreground">2 Credits</span>
                    </div>
                    <Button onClick={handleProcess} disabled={isProcessing || !uploadedImage} className="w-full h-12 font-bold rounded-xl gap-2">
                        {isProcessing ? (<><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>) : (<><Camera className="w-5 h-5" /> Change Camera</>)}
                    </Button>
                </div>
            </div>

            {/* Main Content - Before/After */}
            <div className="flex-1 flex flex-col min-w-0">
                {resultImage && (
                    <div className="h-14 px-6 border-b border-border flex items-center justify-end gap-2 shrink-0">
                        <Button variant="ghost" size="sm" className="gap-1.5 text-xs mr-auto" onClick={() => { setResultImage(null); }}>
                            <RotateCcw className="w-4 h-4" /> Reset
                        </Button>
                        <Button variant="outline" size="sm" className="gap-2"><Folder className="w-4 h-4" /> Save</Button>
                        <Button size="sm" className="gap-2"><Download className="w-4 h-4" /> Export</Button>
                    </div>
                )}
                <div className="flex-1 flex overflow-hidden">
                    {/* Original */}
                    <div className="flex-1 flex items-center justify-center p-6 bg-muted/10">
                        {uploadedImage ? (
                            <div className="flex flex-col items-center gap-2">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Original</p>
                                <div className="rounded-xl border border-border shadow-lg overflow-hidden"><img src={uploadedImage} alt="Original" className="max-h-[65vh] w-auto object-contain" /></div>
                            </div>
                        ) : (
                            <div className="text-center space-y-4">
                                <div className="w-20 h-20 rounded-2xl bg-muted border border-border flex items-center justify-center mx-auto"><Camera className="w-8 h-8 text-muted-foreground" /></div>
                                <div><h3 className="font-semibold">Change Camera Perspective</h3><p className="text-sm text-muted-foreground mt-1">Upload an image to transform its camera angle</p></div>
                            </div>
                        )}
                    </div>
                    {/* Result */}
                    <div className="flex-1 flex items-center justify-center p-6 border-l border-border bg-muted/5">
                        <div className="flex flex-col items-center gap-2">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Result</p>
                            {isProcessing ? (
                                <div className="w-full max-w-md aspect-[4/3] rounded-xl border border-border bg-card flex flex-col items-center justify-center gap-4">
                                    <div className="relative"><div className="w-16 h-16 rounded-full border-4 border-muted border-t-primary animate-spin" /><Camera className="w-6 h-6 text-muted-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" /></div>
                                    <p className="text-sm text-muted-foreground animate-pulse">Changing perspective...</p>
                                </div>
                            ) : resultImage ? (
                                <div className="rounded-xl border border-border shadow-lg overflow-hidden"><img src={resultImage} alt="Result" className="max-h-[65vh] w-auto object-contain" /></div>
                            ) : (
                                <div className="w-full max-w-md aspect-[4/3] rounded-xl border border-dashed border-border bg-card flex flex-col items-center justify-center gap-3 text-muted-foreground">
                                    <Target className="w-8 h-8 opacity-30" /><p className="text-sm">Select angle and click "Change Camera"</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
