'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useGenerationStore } from '@/stores/generation-store';
import {
    PenTool,
    Upload,
    Download,
    Sparkles,
    Loader2,
    RotateCcw,
    Eraser,
    Minus,
    Palette,
    Undo2,
    Redo2,
    Folder,
    ChevronDown,
    Trash2,
    Circle
} from 'lucide-react';
import { Button } from '@/ui/button';
import { Slider } from '@/ui/slider';
import { Label } from '@/ui/label';
import { cn } from '@/lib/utils';

const brushColors = [
    '#000000', '#FFFFFF', '#EF4444', '#F97316', '#EAB308',
    '#22C55E', '#3B82F6', '#8B5CF6', '#EC4899', '#6B7280',
];

const styles = [
    { id: 'realistic', label: 'Realistic', description: 'Photorealistic rendering' },
    { id: 'anime', label: 'Anime', description: 'Japanese animation style' },
    { id: 'watercolor', label: 'Watercolor', description: 'Soft watercolor painting' },
    { id: 'oil-painting', label: 'Oil Paint', description: 'Classic oil painting' },
    { id: '3d-render', label: '3D Render', description: 'Modern 3D rendering' },
    { id: 'pixel-art', label: 'Pixel Art', description: 'Retro pixel art style' },
    { id: 'comic', label: 'Comic', description: 'Comic book illustration' },
    { id: 'concept-art', label: 'Concept', description: 'Professional concept art' },
];

export default function SketchToImagePage() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [brushSize, setBrushSize] = useState(5);
    const [brushColor, setBrushColor] = useState('#000000');
    const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
    const [prompt, setPrompt] = useState('');
    const [selectedStyle, setSelectedStyle] = useState('realistic');
    const [strength, setStrength] = useState(75);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [canvasInitialized, setCanvasInitialized] = useState(false);
    const { sketchToImage, isGenerating: storeGenerating, currentGeneration, error } = useGenerationStore();

    const initCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas || canvasInitialized) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = 768;
        canvas.height = 512;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        setCanvasInitialized(true);
    }, [canvasInitialized]);

    useEffect(() => {
        initCanvas();
    }, [initCanvas]);

    // Watch for completed generation
    useEffect(() => {
        if (currentGeneration?.status === 'completed' && currentGeneration.resultUrl) {
            setGeneratedImage(currentGeneration.resultUrl);
        }
    }, [currentGeneration]);

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.strokeStyle = tool === 'eraser' ? '#FFFFFF' : brushColor;
        ctx.lineWidth = tool === 'eraser' ? brushSize * 3 : brushSize;
        setIsDrawing(true);
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        setGeneratedImage(null);
    };

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        const canvas = canvasRef.current;
        const sketchUrl = canvas ? canvas.toDataURL('image/png') : '';
        await sketchToImage({
            prompt,
            sketchUrl,
            style: selectedStyle,
            fidelity: strength,
        });
    };

    return (
        <div className="h-full bg-background text-foreground flex overflow-hidden">
            {/* Left Control Panel */}
            <div className="w-[320px] border-r border-border flex flex-col shrink-0 bg-background">
                <div className="h-14 px-6 border-b border-border flex items-center shrink-0">
                    <h2 className="font-bold text-muted-foreground">Sketch to Image</h2>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Drawing Tools */}
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Drawing Tools</h4>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setTool('pen')}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-medium transition-all",
                                    tool === 'pen' ? "bg-accent border-primary/20 text-foreground" : "bg-card border-border text-muted-foreground"
                                )}
                            >
                                <PenTool className="w-4 h-4" />
                                Pen
                            </button>
                            <button
                                onClick={() => setTool('eraser')}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-medium transition-all",
                                    tool === 'eraser' ? "bg-accent border-primary/20 text-foreground" : "bg-card border-border text-muted-foreground"
                                )}
                            >
                                <Eraser className="w-4 h-4" />
                                Eraser
                            </button>
                            <button
                                onClick={clearCanvas}
                                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-border bg-card text-muted-foreground text-xs font-medium hover:border-destructive/30 hover:text-destructive transition-all"
                                title="Clear Canvas"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Brush Size */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Brush Size</Label>
                            <span className="text-[11px] font-mono text-foreground">{brushSize}px</span>
                        </div>
                        <Slider min={1} max={30} step={1} value={[brushSize]} onValueChange={([val]) => setBrushSize(val)} />
                    </div>

                    {/* Colors */}
                    <div className="space-y-3">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Color</Label>
                        <div className="flex flex-wrap gap-2">
                            {brushColors.map((color) => (
                                <button
                                    key={color}
                                    onClick={() => setBrushColor(color)}
                                    className={cn(
                                        "w-8 h-8 rounded-lg border-2 transition-all",
                                        brushColor === color ? "border-primary scale-110 ring-2 ring-primary/20" : "border-border hover:scale-105"
                                    )}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Style Selection */}
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Output Style</h4>
                        <div className="grid grid-cols-2 gap-2">
                            {styles.map((style) => (
                                <button
                                    key={style.id}
                                    onClick={() => setSelectedStyle(style.id)}
                                    className={cn(
                                        "p-3 rounded-xl border transition-all text-left",
                                        selectedStyle === style.id
                                            ? "bg-accent border-primary/20 text-foreground"
                                            : "bg-card border-border text-muted-foreground hover:border-border/80"
                                    )}
                                >
                                    <p className="text-[11px] font-medium">{style.label}</p>
                                    <p className="text-[9px] text-muted-foreground mt-0.5">{style.description}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Sketch Influence */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Sketch Influence</Label>
                            <span className="text-[11px] font-mono text-foreground">{strength}%</span>
                        </div>
                        <Slider min={10} max={100} step={5} value={[strength]} onValueChange={([val]) => setStrength(val)} />
                        <p className="text-[10px] text-muted-foreground">Higher = follows sketch more closely</p>
                    </div>

                    {/* Prompt */}
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Prompt</h4>
                        <div className="bg-card rounded-xl border border-border p-2">
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Describe what the sketch should become..."
                                className="w-full h-24 bg-transparent text-sm placeholder:text-muted-foreground resize-none focus:outline-none p-2"
                            />
                        </div>
                    </div>
                </div>

                {/* Generate Button */}
                <div className="p-4 border-t border-border bg-background space-y-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                        <span>Cost:</span>
                        <span className="font-medium text-foreground">2 Credits</span>
                    </div>
                    <Button
                        onClick={handleGenerate}
                        disabled={isGenerating || !prompt.trim()}
                        className="w-full h-12 font-bold rounded-xl gap-2"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-5 h-5" />
                                Transform Sketch
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Main Canvas Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Toolbar */}
                <div className="h-14 px-6 border-b border-border flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-medium">Canvas: 768 × 512</span>
                        <span>•</span>
                        <span>Style: {styles.find(s => s.id === selectedStyle)?.label}</span>
                    </div>
                    {generatedImage && (
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" className="gap-2">
                                <Folder className="w-4 h-4" />
                                Save
                            </Button>
                            <Button size="sm" className="gap-2">
                                <Download className="w-4 h-4" />
                                Export
                            </Button>
                        </div>
                    )}
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Sketch Canvas */}
                    <div className="flex-1 flex items-center justify-center p-8 bg-muted/30">
                        <div className="flex flex-col items-center gap-2">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Your Sketch</p>
                            <canvas
                                ref={canvasRef}
                                className="rounded-xl border border-border shadow-lg bg-white cursor-crosshair max-w-full max-h-[65vh]"
                                style={{ width: '100%', maxWidth: '768px', aspectRatio: '3/2' }}
                                onMouseDown={startDrawing}
                                onMouseMove={draw}
                                onMouseUp={stopDrawing}
                                onMouseLeave={stopDrawing}
                            />
                        </div>
                    </div>

                    {/* Generated Result */}
                    <div className="flex-1 flex items-center justify-center p-8 border-l border-border bg-muted/10">
                        <div className="flex flex-col items-center gap-2">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">AI Result</p>
                            {isGenerating ? (
                                <div className="w-full max-w-[768px] aspect-[3/2] rounded-xl border border-border bg-card flex flex-col items-center justify-center gap-4">
                                    <div className="relative">
                                        <div className="w-16 h-16 rounded-full border-4 border-muted border-t-primary animate-spin" />
                                        <Sparkles className="w-6 h-6 text-muted-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                    </div>
                                    <p className="text-sm text-muted-foreground animate-pulse">Transforming sketch...</p>
                                </div>
                            ) : generatedImage ? (
                                <div className="rounded-xl overflow-hidden border border-border shadow-lg">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={generatedImage} alt="Generated" className="max-h-[65vh] w-auto object-contain" />
                                </div>
                            ) : (
                                <div className="w-full max-w-[768px] aspect-[3/2] rounded-xl border border-dashed border-border bg-card flex flex-col items-center justify-center gap-3 text-muted-foreground">
                                    <Sparkles className="w-8 h-8 opacity-30" />
                                    <p className="text-sm">Draw a sketch and click "Transform Sketch"</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
