'use client';

import { useState, useRef } from 'react';
import { useGenerationStore } from '@/stores/generation-store';
import {
    Edit3,
    Upload,
    Download,
    Sparkles,
    Loader2,
    Crop,
    Palette,
    Layers,
    Type,
    Eraser,
    RotateCcw,
    RotateCw,
    FlipHorizontal,
    FlipVertical,
    Sun,
    Contrast,
    Droplets,
    Eye,
    ZoomIn,
    ZoomOut,
    Undo2,
    Redo2,
    Move,
    Square,
    Circle,
    Minus,
    Grid3X3,
    Folder,
    Wand2,
    Brush,
    MousePointer
} from 'lucide-react';
import { Button } from '@/ui/button';
import { Slider } from '@/ui/slider';
import { Label } from '@/ui/label';
import { cn } from '@/lib/utils';

const tools = [
    { id: 'select', icon: MousePointer, label: 'Select' },
    { id: 'move', icon: Move, label: 'Move' },
    { id: 'crop', icon: Crop, label: 'Crop' },
    { id: 'brush', icon: Brush, label: 'Brush' },
    { id: 'eraser', icon: Eraser, label: 'Eraser' },
    { id: 'text', icon: Type, label: 'Text' },
    { id: 'shape', icon: Square, label: 'Shapes' },
    { id: 'ai', icon: Wand2, label: 'AI Edit' },
];

const aiTools = [
    { id: 'remove-object', label: 'Remove Object', description: 'Click on any object to remove it', icon: Eraser },
    { id: 'replace-bg', label: 'Replace Background', description: 'AI-generated backgrounds', icon: Layers },
    { id: 'enhance', label: 'Enhance Quality', description: 'Upscale and sharpen image', icon: Sparkles },
    { id: 'colorize', label: 'Colorize', description: 'Add color to B&W photos', icon: Palette },
    { id: 'expand', label: 'Expand Image', description: 'AI outpainting to extend', icon: Grid3X3 },
];

const filters = [
    { id: 'none', label: 'None' },
    { id: 'vivid', label: 'Vivid' },
    { id: 'warm', label: 'Warm' },
    { id: 'cool', label: 'Cool' },
    { id: 'bw', label: 'B&W' },
    { id: 'vintage', label: 'Vintage' },
    { id: 'cinema', label: 'Cinema' },
    { id: 'dramatic', label: 'Dramatic' },
];

export default function ImageEditorPage() {
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [activeTool, setActiveTool] = useState('select');
    const [activePanel, setActivePanel] = useState<'adjust' | 'filters' | 'ai'>('adjust');
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState('none');
    const [adjustments, setAdjustments] = useState({
        brightness: 0,
        contrast: 0,
        saturation: 0,
        sharpness: 0,
        blur: 0,
        temperature: 0,
    });
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { startGeneration } = useGenerationStore();

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setUploadedImage(url);
        }
    };

    const handleAiTool = async (toolId: string) => {
        setIsProcessing(true);
        await startGeneration('/generations/image', {
            prompt: `Apply ${toolId} to image`,
            imageUrl: uploadedImage,
        });
        setIsProcessing(false);
    };

    const getFilterStyle = (): React.CSSProperties => {
        const b = adjustments.brightness;
        const c = adjustments.contrast;
        const s = adjustments.saturation;
        let filter = `brightness(${1 + b / 100}) contrast(${1 + c / 100}) saturate(${1 + s / 100})`;
        if (adjustments.blur > 0) filter += ` blur(${adjustments.blur / 10}px)`;

        switch (selectedFilter) {
            case 'bw': filter += ' grayscale(1)'; break;
            case 'vivid': filter += ' saturate(1.5) contrast(1.1)'; break;
            case 'warm': filter += ' sepia(0.2)'; break;
            case 'cool': filter += ' hue-rotate(20deg) saturate(0.9)'; break;
            case 'vintage': filter += ' sepia(0.4) contrast(0.9) brightness(1.1)'; break;
            case 'cinema': filter += ' contrast(1.2) saturate(0.8)'; break;
            case 'dramatic': filter += ' contrast(1.4) saturate(1.2) brightness(0.9)'; break;
        }
        return { filter };
    };

    return (
        <div className="h-full bg-background text-foreground flex overflow-hidden">
            {/* Left Toolbar */}
            <div className="w-14 border-r border-border flex flex-col items-center py-4 gap-1 bg-background shrink-0">
                {tools.map((tool) => (
                    <button
                        key={tool.id}
                        onClick={() => setActiveTool(tool.id)}
                        title={tool.label}
                        className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center transition-all",
                            activeTool === tool.id
                                ? "bg-accent text-foreground"
                                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                        )}
                    >
                        <tool.icon className="w-4.5 h-4.5" />
                    </button>
                ))}
            </div>

            {/* Canvas Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top Toolbar */}
                <div className="h-14 px-4 border-b border-border flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="w-8 h-8" title="Undo">
                            <Undo2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="w-8 h-8" title="Redo">
                            <Redo2 className="w-4 h-4" />
                        </Button>
                        <div className="w-px h-6 bg-border mx-2" />
                        <Button variant="ghost" size="icon" className="w-8 h-8" title="Rotate Left">
                            <RotateCcw className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="w-8 h-8" title="Rotate Right">
                            <RotateCw className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="w-8 h-8" title="Flip Horizontal">
                            <FlipHorizontal className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="w-8 h-8" title="Flip Vertical">
                            <FlipVertical className="w-4 h-4" />
                        </Button>
                        <div className="w-px h-6 bg-border mx-2" />
                        <Button variant="ghost" size="icon" className="w-8 h-8" title="Zoom In">
                            <ZoomIn className="w-4 h-4" />
                        </Button>
                        <span className="text-xs text-muted-foreground font-medium px-2">100%</span>
                        <Button variant="ghost" size="icon" className="w-8 h-8" title="Zoom Out">
                            <ZoomOut className="w-4 h-4" />
                        </Button>
                    </div>
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
                </div>

                {/* Canvas */}
                <div className="flex-1 flex items-center justify-center p-8 bg-muted/30 overflow-auto">
                    {!uploadedImage ? (
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full max-w-lg aspect-[4/3] rounded-2xl border-2 border-dashed border-border hover:border-primary/30 transition-all cursor-pointer flex flex-col items-center justify-center gap-4 bg-background"
                        >
                            <div className="w-16 h-16 rounded-xl bg-accent flex items-center justify-center">
                                <Upload className="w-7 h-7 text-muted-foreground" />
                            </div>
                            <div className="text-center">
                                <p className="font-medium">Open an image to edit</p>
                                <p className="text-sm text-muted-foreground mt-1">Drag & drop or click to browse</p>
                            </div>
                        </div>
                    ) : (
                        <div className="relative rounded-lg border border-border shadow-2xl overflow-hidden bg-[repeating-conic-gradient(#80808010_0%_25%,transparent_0%_50%)] bg-[length:16px_16px]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={uploadedImage}
                                alt="Editing"
                                className="max-h-[70vh] w-auto object-contain transition-all"
                                style={getFilterStyle()}
                            />
                            {isProcessing && (
                                <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-10">
                                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                                    <p className="text-sm font-medium">AI is processing...</p>
                                </div>
                            )}
                        </div>
                    )}
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                </div>
            </div>

            {/* Right Panel */}
            <div className="w-[280px] border-l border-border flex flex-col shrink-0 bg-background">
                {/* Panel Tabs */}
                <div className="h-14 px-2 border-b border-border flex items-center gap-1 shrink-0">
                    {(['adjust', 'filters', 'ai'] as const).map((panel) => (
                        <button
                            key={panel}
                            onClick={() => setActivePanel(panel)}
                            className={cn(
                                "flex-1 py-2 text-xs font-medium rounded-lg transition-colors capitalize",
                                activePanel === panel
                                    ? "bg-accent text-accent-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {panel === 'ai' ? 'AI Tools' : panel}
                        </button>
                    ))}
                </div>

                {/* Panel Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {activePanel === 'adjust' && (
                        <>
                            {[
                                { key: 'brightness', label: 'Brightness', icon: Sun, min: -100, max: 100 },
                                { key: 'contrast', label: 'Contrast', icon: Contrast, min: -100, max: 100 },
                                { key: 'saturation', label: 'Saturation', icon: Droplets, min: -100, max: 100 },
                                { key: 'sharpness', label: 'Sharpness', icon: Eye, min: 0, max: 100 },
                                { key: 'temperature', label: 'Temperature', icon: Sun, min: -100, max: 100 },
                            ].map((adj) => (
                                <div key={adj.key} className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em] flex items-center gap-2">
                                            <adj.icon className="w-3 h-3" />
                                            {adj.label}
                                        </Label>
                                        <span className="text-[11px] font-mono text-foreground">{adjustments[adj.key as keyof typeof adjustments]}</span>
                                    </div>
                                    <Slider
                                        min={adj.min}
                                        max={adj.max}
                                        step={1}
                                        value={[adjustments[adj.key as keyof typeof adjustments]]}
                                        onValueChange={([val]) => setAdjustments(prev => ({ ...prev, [adj.key]: val }))}
                                    />
                                </div>
                            ))}

                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full text-xs"
                                onClick={() => setAdjustments({ brightness: 0, contrast: 0, saturation: 0, sharpness: 0, blur: 0, temperature: 0 })}
                            >
                                <RotateCcw className="w-3 h-3 mr-2" />
                                Reset All
                            </Button>
                        </>
                    )}

                    {activePanel === 'filters' && (
                        <div className="grid grid-cols-2 gap-2">
                            {filters.map((f) => (
                                <button
                                    key={f.id}
                                    onClick={() => setSelectedFilter(f.id)}
                                    className={cn(
                                        "aspect-square rounded-xl border-2 transition-all overflow-hidden flex items-end p-2 bg-muted",
                                        selectedFilter === f.id
                                            ? "border-primary ring-2 ring-primary/20"
                                            : "border-border hover:border-muted-foreground/50"
                                    )}
                                >
                                    <span className="text-[10px] font-bold">{f.label}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {activePanel === 'ai' && (
                        <div className="space-y-2">
                            {aiTools.map((tool) => (
                                <button
                                    key={tool.id}
                                    onClick={() => handleAiTool(tool.id)}
                                    disabled={isProcessing || !uploadedImage}
                                    className="w-full flex items-start gap-3 px-4 py-3 bg-card rounded-xl border border-border hover:border-primary/20 transition-all text-left disabled:opacity-50"
                                >
                                    <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center shrink-0 mt-0.5">
                                        <tool.icon className="w-4 h-4 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium">{tool.label}</p>
                                        <p className="text-[10px] text-muted-foreground mt-0.5">{tool.description}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
