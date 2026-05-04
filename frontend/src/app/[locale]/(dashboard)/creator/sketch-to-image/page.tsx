'use client';

import Image from 'next/image';
import { useReducer, useRef, useEffect, useCallback } from 'react';
import { useGenerationStore } from '@/stores/generation-store';
import {
    PenTool,
    Sparkles,
    Loader2,
    Eraser,
    Trash2,
    Folder,
    Download,
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

type State = {
    isDrawing: boolean;
    brushSize: number;
    brushColor: string;
    tool: 'pen' | 'eraser';
    prompt: string;
    selectedStyle: string;
    strength: number;
    canvasInitialized: boolean;
};

type Action =
    | { type: 'setIsDrawing'; isDrawing: boolean }
    | { type: 'setBrushSize'; brushSize: number }
    | { type: 'setBrushColor'; brushColor: string }
    | { type: 'setTool'; tool: 'pen' | 'eraser' }
    | { type: 'setPrompt'; prompt: string }
    | { type: 'setSelectedStyle'; selectedStyle: string }
    | { type: 'setStrength'; strength: number }
    | { type: 'setCanvasInitialized'; canvasInitialized: boolean };

const initialState: State = {
    isDrawing: false,
    brushSize: 5,
    brushColor: '#000000',
    tool: 'pen',
    prompt: '',
    selectedStyle: 'realistic',
    strength: 75,
    canvasInitialized: false,
};

function reducer(state: State, action: Action): State {
    switch (action.type) {
        case 'setIsDrawing':
            return { ...state, isDrawing: action.isDrawing };
        case 'setBrushSize':
            return { ...state, brushSize: action.brushSize };
        case 'setBrushColor':
            return { ...state, brushColor: action.brushColor };
        case 'setTool':
            return { ...state, tool: action.tool };
        case 'setPrompt':
            return { ...state, prompt: action.prompt };
        case 'setSelectedStyle':
            return { ...state, selectedStyle: action.selectedStyle };
        case 'setStrength':
            return { ...state, strength: action.strength };
        case 'setCanvasInitialized':
            return { ...state, canvasInitialized: action.canvasInitialized };
        default:
            return state;
    }
}

export default function SketchToImagePage() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [state, dispatch] = useReducer(reducer, initialState);
    const { sketchToImage, isGenerating, currentGeneration } = useGenerationStore();
    const completedImage = currentGeneration?.status === 'completed' ? currentGeneration.resultUrl ?? null : null;

    const initCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas || state.canvasInitialized) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = 768;
        canvas.height = 512;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        dispatch({ type: 'setCanvasInitialized', canvasInitialized: true });
    }, [state.canvasInitialized]);

    useEffect(() => {
        initCanvas();
    }, [initCanvas]);

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
        ctx.strokeStyle = state.tool === 'eraser' ? '#FFFFFF' : state.brushColor;
        ctx.lineWidth = state.tool === 'eraser' ? state.brushSize * 3 : state.brushSize;
        dispatch({ type: 'setIsDrawing', isDrawing: true });
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!state.isDrawing) return;
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
        dispatch({ type: 'setIsDrawing', isDrawing: false });
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    const handleGenerate = async () => {
        if (!state.prompt.trim()) return;
        const canvas = canvasRef.current;
        const sketchUrl = canvas ? canvas.toDataURL('image/png') : '';

        await sketchToImage({
            prompt: state.prompt,
            sketchUrl,
            style: state.selectedStyle,
            fidelity: state.strength,
        });
    };

    return (
        <div className="h-full bg-background text-foreground flex overflow-hidden">
            <div className="w-[320px] border-r border-border flex flex-col shrink-0 bg-background">
                <div className="h-14 px-6 border-b border-border flex items-center shrink-0">
                    <h2 className="font-bold text-muted-foreground">Sketch to Image</h2>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Drawing Tools</h4>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => dispatch({ type: 'setTool', tool: 'pen' })}
                                className={cn(
                                    'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-medium transition-all',
                                    state.tool === 'pen' ? 'bg-accent border-primary/20 text-foreground' : 'bg-card border-border text-muted-foreground',
                                )}
                            >
                                <PenTool className="w-4 h-4" />
                                Pen
                            </button>
                            <button
                                onClick={() => dispatch({ type: 'setTool', tool: 'eraser' })}
                                className={cn(
                                    'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-medium transition-all',
                                    state.tool === 'eraser' ? 'bg-accent border-primary/20 text-foreground' : 'bg-card border-border text-muted-foreground',
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

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Brush Size</Label>
                            <span className="text-[11px] font-mono text-foreground">{state.brushSize}px</span>
                        </div>
                        <Slider min={1} max={30} step={1} value={[state.brushSize]} onValueChange={([value]) => dispatch({ type: 'setBrushSize', brushSize: value })} />
                    </div>

                    <div className="space-y-3">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Color</Label>
                        <div className="flex flex-wrap gap-2">
                            {brushColors.map((color) => (
                                <button
                                    key={color}
                                    onClick={() => dispatch({ type: 'setBrushColor', brushColor: color })}
                                    className={cn(
                                        'w-8 h-8 rounded-lg border-2 transition-all',
                                        state.brushColor === color ? 'border-primary scale-110 ring-2 ring-primary/20' : 'border-border hover:scale-105',
                                    )}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Output Style</h4>
                        <div className="grid grid-cols-2 gap-2">
                            {styles.map((style) => (
                                <button
                                    key={style.id}
                                    onClick={() => dispatch({ type: 'setSelectedStyle', selectedStyle: style.id })}
                                    className={cn(
                                        'p-3 rounded-xl border transition-all text-left',
                                        state.selectedStyle === style.id ? 'bg-accent border-primary/20 text-foreground' : 'bg-card border-border text-muted-foreground hover:border-border/80',
                                    )}
                                >
                                    <p className="text-[11px] font-medium">{style.label}</p>
                                    <p className="text-[9px] text-muted-foreground mt-0.5">{style.description}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Sketch Influence</Label>
                            <span className="text-[11px] font-mono text-foreground">{state.strength}%</span>
                        </div>
                        <Slider min={10} max={100} step={5} value={[state.strength]} onValueChange={([value]) => dispatch({ type: 'setStrength', strength: value })} />
                        <p className="text-[10px] text-muted-foreground">Higher = follows sketch more closely</p>
                    </div>

                    <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Prompt</h4>
                        <div className="bg-card rounded-xl border border-border p-2">
                            <textarea
                                value={state.prompt}
                                onChange={(e) => dispatch({ type: 'setPrompt', prompt: e.target.value })}
                                placeholder="Describe what the sketch should become..."
                                className="w-full h-24 bg-transparent text-sm placeholder:text-muted-foreground resize-none focus:outline-none p-2"
                            />
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-border bg-background space-y-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                        <span>Cost:</span>
                        <span className="font-medium text-foreground">2 Credits</span>
                    </div>
                    <Button onClick={handleGenerate} disabled={isGenerating || !state.prompt.trim()} className="w-full h-12 font-bold rounded-xl gap-2">
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

            <div className="flex-1 flex flex-col min-w-0">
                <div className="h-14 px-6 border-b border-border flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-medium">Canvas: 768 x 512</span>
                        <span>•</span>
                        <span>Style: {styles.find((style) => style.id === state.selectedStyle)?.label}</span>
                    </div>
                    {completedImage && (
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
                            ) : completedImage ? (
                                <div className="relative h-[65vh] w-full max-w-[768px] rounded-xl overflow-hidden border border-border shadow-lg">
                                    <Image src={completedImage} alt="Generated" fill className="object-contain" sizes="100vw" />
                                </div>
                            ) : (
                                <div className="w-full max-w-[768px] aspect-[3/2] rounded-xl border border-dashed border-border bg-card flex flex-col items-center justify-center gap-3 text-muted-foreground">
                                    <Sparkles className="w-8 h-8 opacity-30" />
                                    <p className="text-sm">Draw a sketch and click &quot;Transform Sketch&quot;</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
