'use client';

import { useState } from 'react';
import { useGenerationStore } from '@/stores/generation-store';
import {
    Shapes,
    Download,
    Sparkles,
    Loader2,
    Grid3X3,
    Folder,
    Copy,
    Check,
    Palette,
    Square,
    Circle,
    Triangle,
    Hexagon
} from 'lucide-react';
import { Button } from '@/ui/button';
import { Slider } from '@/ui/slider';
import { Label } from '@/ui/label';
import { cn } from '@/lib/utils';

const iconStyles = [
    { id: 'flat', label: 'Flat', description: 'Clean flat design' },
    { id: '3d', label: '3D', description: 'Realistic 3D rendering' },
    { id: 'gradient', label: 'Gradient', description: 'Modern gradient style' },
    { id: 'outline', label: 'Outline', description: 'Line icon style' },
    { id: 'glyph', label: 'Glyph', description: 'Solid monochrome' },
    { id: 'isometric', label: 'Isometric', description: 'Isometric 3D view' },
    { id: 'clay', label: 'Clay', description: 'Soft clay 3D look' },
    { id: 'pixel', label: 'Pixel', description: 'Pixel art retro' },
];

const shapes = [
    { id: 'square', label: 'Square', icon: Square },
    { id: 'rounded', label: 'Rounded', icon: Square },
    { id: 'circle', label: 'Circle', icon: Circle },
    { id: 'squircle', label: 'Squircle', icon: Square },
];

const colorPalettes = [
    { id: 'vibrant', colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'] },
    { id: 'pastel', colors: ['#FFB5E8', '#B5DEFF', '#E7FFAC', '#FFC9DE'] },
    { id: 'dark', colors: ['#2D2D2D', '#3D3D3D', '#4D4D4D', '#1A1A2E'] },
    { id: 'gradient', colors: ['#667EEA', '#764BA2', '#F093FB', '#F5576C'] },
    { id: 'earth', colors: ['#A0522D', '#DEB887', '#8B7355', '#556B2F'] },
    { id: 'neon', colors: ['#39FF14', '#FF073A', '#01CDFE', '#FFFF00'] },
];

const sizes = ['16x16', '32x32', '64x64', '128x128', '256x256', '512x512', '1024x1024'];

const mockResults = [
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1633167606207-d840b5070fc2?q=80&w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1605721911519-3dfeb3be25e7?q=80&w=200&h=200&fit=crop',
];

export default function IconGeneratorPage() {
    const [prompt, setPrompt] = useState('');
    const [selectedStyle, setSelectedStyle] = useState('flat');
    const [selectedShape, setSelectedShape] = useState('rounded');
    const [selectedPalette, setSelectedPalette] = useState('vibrant');
    const [selectedSize, setSelectedSize] = useState('512x512');
    const [count, setCount] = useState(4);
    const [cornerRadius, setCornerRadius] = useState(20);
    const [isGenerating, setIsGenerating] = useState(false);
    const [results, setResults] = useState<string[]>([]);
    const { iconGenerator } = useGenerationStore();

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setIsGenerating(true);
        await iconGenerator({
            prompt,
            style: selectedStyle,
            size: selectedSize.split('x')[0],
            color: colorPalettes.find(p => p.id === selectedPalette)?.colors[0],
        });
        setIsGenerating(false);
    };

    return (
        <div className="h-full bg-background text-foreground flex overflow-hidden">
            {/* Left Control Panel */}
            <div className="w-[320px] border-r border-border flex flex-col shrink-0 bg-background">
                <div className="h-14 px-6 border-b border-border flex items-center shrink-0">
                    <h2 className="font-bold text-muted-foreground">Icon Generator</h2>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Prompt */}
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Describe your icon</h4>
                        <div className="bg-card rounded-xl border border-border p-2">
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="e.g., A rocket launching from a laptop, tech startup..."
                                className="w-full h-24 bg-transparent text-sm placeholder:text-muted-foreground resize-none focus:outline-none p-2"
                            />
                        </div>
                    </div>

                    {/* Style */}
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Style</h4>
                        <div className="grid grid-cols-2 gap-2">
                            {iconStyles.map((style) => (
                                <button
                                    key={style.id}
                                    onClick={() => setSelectedStyle(style.id)}
                                    className={cn(
                                        "p-3 rounded-xl border transition-all text-left",
                                        selectedStyle === style.id ? "bg-accent border-primary/20" : "bg-card border-border hover:border-border/80"
                                    )}
                                >
                                    <p className="text-[11px] font-medium">{style.label}</p>
                                    <p className="text-[9px] text-muted-foreground">{style.description}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Shape */}
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Shape</h4>
                        <div className="grid grid-cols-4 gap-2">
                            {shapes.map((shape) => (
                                <button
                                    key={shape.id}
                                    onClick={() => setSelectedShape(shape.id)}
                                    className={cn(
                                        "flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all",
                                        selectedShape === shape.id ? "bg-accent border-primary/20" : "bg-card border-border"
                                    )}
                                >
                                    <shape.icon className={cn("w-5 h-5", shape.id === 'rounded' && 'rounded')} />
                                    <span className="text-[9px] font-medium">{shape.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Color Palette */}
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Color Palette</h4>
                        <div className="space-y-2">
                            {colorPalettes.map((palette) => (
                                <button
                                    key={palette.id}
                                    onClick={() => setSelectedPalette(palette.id)}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all",
                                        selectedPalette === palette.id ? "bg-accent border-primary/20" : "bg-card border-border"
                                    )}
                                >
                                    <div className="flex gap-1">
                                        {palette.colors.map((c, i) => (
                                            <div key={i} className="w-5 h-5 rounded-md" style={{ backgroundColor: c }} />
                                        ))}
                                    </div>
                                    <span className="text-xs font-medium capitalize">{palette.id}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Corner Radius */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Corner Radius</Label>
                            <span className="text-[11px] font-mono text-foreground">{cornerRadius}%</span>
                        </div>
                        <Slider min={0} max={50} step={1} value={[cornerRadius]} onValueChange={([v]) => setCornerRadius(v)} />
                    </div>

                    {/* Size */}
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Size</h4>
                        <div className="flex flex-wrap gap-1.5">
                            {sizes.map((size) => (
                                <button
                                    key={size}
                                    onClick={() => setSelectedSize(size)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all",
                                        selectedSize === size ? "bg-accent border border-primary/20" : "bg-card border border-border"
                                    )}
                                >
                                    {size}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Count */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Variations</Label>
                            <span className="text-[11px] font-mono text-foreground">{count}</span>
                        </div>
                        <Slider min={1} max={8} step={1} value={[count]} onValueChange={([v]) => setCount(v)} />
                    </div>
                </div>

                {/* Generate */}
                <div className="p-4 border-t border-border bg-background space-y-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                        <span>Cost:</span>
                        <span className="font-medium text-foreground">{count} Credits</span>
                    </div>
                    <Button onClick={handleGenerate} disabled={isGenerating || !prompt.trim()} className="w-full h-12 font-bold rounded-xl gap-2">
                        {isGenerating ? (<><Loader2 className="w-5 h-5 animate-spin" /> Generating...</>) : (<><Shapes className="w-5 h-5" /> Generate Icons</>)}
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="h-14 px-6 border-b border-border flex items-center justify-between shrink-0">
                    <span className="text-sm font-medium">{results.length > 0 ? `${results.length} icons generated` : 'Generated Icons'}</span>
                    {results.length > 0 && (
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="gap-2"><Folder className="w-4 h-4" /> Save All</Button>
                            <Button size="sm" className="gap-2"><Download className="w-4 h-4" /> Export All</Button>
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-8">
                    {isGenerating ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4">
                            <div className="relative"><div className="w-16 h-16 rounded-full border-4 border-muted border-t-primary animate-spin" /><Shapes className="w-6 h-6 text-muted-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" /></div>
                            <p className="text-sm text-muted-foreground animate-pulse">Generating {count} icon variations...</p>
                        </div>
                    ) : results.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
                            {results.map((url, i) => (
                                <div key={i} className="group relative">
                                    <div className="aspect-square rounded-2xl border border-border overflow-hidden bg-[repeating-conic-gradient(#80808010_0%_25%,transparent_0%_50%)] bg-[length:16px_16px] shadow-lg">
                                        <img src={url} alt={`Icon ${i + 1}`} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <Button size="icon" variant="secondary" className="w-9 h-9 rounded-lg"><Download className="w-4 h-4" /></Button>
                                        <Button size="icon" variant="secondary" className="w-9 h-9 rounded-lg"><Copy className="w-4 h-4" /></Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                            <div className="w-20 h-20 rounded-2xl bg-muted border border-border flex items-center justify-center"><Shapes className="w-8 h-8 text-muted-foreground" /></div>
                            <div><h3 className="font-semibold">Generate Custom Icons</h3><p className="text-sm text-muted-foreground mt-1">Describe your icon and choose a style to get started</p></div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
