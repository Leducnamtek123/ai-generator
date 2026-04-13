'use client';

import { useState, useRef } from 'react';
import { useGenerationStore } from '@/stores/generation-store';
import { Box, Upload, Download, Sparkles, Loader2, Folder, Smartphone, Monitor, Tablet, Watch } from 'lucide-react';
import { Button } from '@/ui/button';
import { Slider } from '@/ui/slider';
import { Label } from '@/ui/label';
import { cn } from '@/lib/utils';

const mockupCategories = [
    { id: 'phone', label: 'Phone', icon: Smartphone, items: ['iPhone 15 Pro', 'Samsung S24', 'Pixel 8', 'iPhone SE'] },
    { id: 'laptop', label: 'Laptop', icon: Monitor, items: ['MacBook Pro 16"', 'MacBook Air', 'Dell XPS', 'Surface Pro'] },
    { id: 'tablet', label: 'Tablet', icon: Tablet, items: ['iPad Pro', 'iPad Air', 'Galaxy Tab', 'Surface Go'] },
    { id: 'watch', label: 'Watch', icon: Watch, items: ['Apple Watch', 'Galaxy Watch', 'Pixel Watch'] },
    { id: 'desktop', label: 'Desktop', icon: Monitor, items: ['iMac 27"', 'Studio Display', 'Dell Monitor', 'LG Ultrawide'] },
];

const scenes = [
    { id: 'minimal', label: 'Minimal', description: 'Clean white background' },
    { id: 'office', label: 'Office', description: 'Professional desk setup' },
    { id: 'cafe', label: 'Café', description: 'Cozy coffee shop' },
    { id: 'outdoor', label: 'Outdoor', description: 'Natural environment' },
    { id: 'dark', label: 'Dark Mode', description: 'Dark premium look' },
    { id: 'gradient', label: 'Gradient', description: 'Colorful gradient bg' },
    { id: 'floating', label: 'Floating', description: '3D floating in space' },
    { id: 'hand', label: 'Hand-held', description: 'Person holding device' },
];

const mockResults = [
    'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?q=80&w=500&fit=crop',
    'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=500&fit=crop',
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=500&fit=crop',
];

export default function MockupGeneratorPage() {
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState('phone');
    const [selectedDevice, setSelectedDevice] = useState('iPhone 15 Pro');
    const [selectedScene, setSelectedScene] = useState('minimal');
    const [angle, setAngle] = useState(0);
    const [shadow, setShadow] = useState(50);
    const [isGenerating, setIsGenerating] = useState(false);
    const [results, setResults] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { mockupGenerator } = useGenerationStore();

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) { setUploadedImage(URL.createObjectURL(file)); setResults([]); }
    };

    const handleGenerate = async () => {
        if (!uploadedImage) return;
        setIsGenerating(true);
        await mockupGenerator({
            designUrl: uploadedImage,
            template: selectedCategory,
            prompt: `${selectedDevice} mockup in ${selectedScene} scene`,
            scene: selectedScene,
        });
        setIsGenerating(false);
    };

    const currentCategory = mockupCategories.find(c => c.id === selectedCategory);

    return (
        <div className="h-full bg-background text-foreground flex overflow-hidden">
            <div className="w-[320px] border-r border-border flex flex-col shrink-0 bg-background">
                <div className="h-14 px-6 border-b border-border flex items-center shrink-0">
                    <h2 className="font-bold text-muted-foreground">Mockup Generator</h2>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Upload Screenshot */}
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Your Screenshot</h4>
                        <div onClick={() => fileInputRef.current?.click()} className="group relative aspect-video rounded-2xl bg-muted border-2 border-dashed border-border hover:border-primary/30 transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center gap-3">
                            {uploadedImage ? (<img src={uploadedImage} alt="Screenshot" className="w-full h-full object-contain" />) : (
                                <><div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center group-hover:scale-110 transition-all"><Upload className="w-5 h-5 text-muted-foreground" /></div>
                                <div className="text-center"><p className="text-xs font-medium">Upload Screenshot</p><p className="text-[10px] text-muted-foreground mt-1">App or website screenshot</p></div></>
                            )}
                        </div>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                    </div>

                    {/* Device Category */}
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Device</h4>
                        <div className="grid grid-cols-5 gap-1.5">
                            {mockupCategories.map((cat) => (
                                <button key={cat.id} onClick={() => { setSelectedCategory(cat.id); setSelectedDevice(cat.items[0]); }} className={cn("flex flex-col items-center gap-1 p-2 rounded-xl border transition-all", selectedCategory === cat.id ? "bg-accent border-primary/20" : "bg-card border-border")}>
                                    <cat.icon className="w-4 h-4" />
                                    <span className="text-[8px] font-medium">{cat.label}</span>
                                </button>
                            ))}
                        </div>
                        {/* Device Models */}
                        <div className="flex flex-wrap gap-1.5">
                            {currentCategory?.items.map((item) => (
                                <button key={item} onClick={() => setSelectedDevice(item)} className={cn("px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all", selectedDevice === item ? "bg-accent border border-primary/20" : "bg-card border border-border")}>{item}</button>
                            ))}
                        </div>
                    </div>

                    {/* Scene */}
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Scene</h4>
                        <div className="grid grid-cols-2 gap-1.5">
                            {scenes.map((s) => (
                                <button key={s.id} onClick={() => setSelectedScene(s.id)} className={cn("p-2.5 rounded-xl border transition-all text-left", selectedScene === s.id ? "bg-accent border-primary/20" : "bg-card border-border")}>
                                    <p className="text-[10px] font-medium">{s.label}</p>
                                    <p className="text-[8px] text-muted-foreground">{s.description}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Angle & Shadow */}
                    <div className="space-y-5">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between"><Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Rotation Angle</Label><span className="text-[11px] font-mono">{angle}°</span></div>
                            <Slider min={-45} max={45} step={5} value={[angle]} onValueChange={([v]) => setAngle(v)} />
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between"><Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Shadow</Label><span className="text-[11px] font-mono">{shadow}%</span></div>
                            <Slider min={0} max={100} step={5} value={[shadow]} onValueChange={([v]) => setShadow(v)} />
                        </div>
                    </div>
                </div>
                <div className="p-4 border-t border-border space-y-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground px-1"><span>Cost:</span><span className="font-medium text-foreground">2 Credits</span></div>
                    <Button onClick={handleGenerate} disabled={isGenerating || !uploadedImage} className="w-full h-12 font-bold rounded-xl gap-2">
                        {isGenerating ? (<><Loader2 className="w-5 h-5 animate-spin" /> Generating...</>) : (<><Box className="w-5 h-5" /> Generate Mockups</>)}
                    </Button>
                </div>
            </div>

            {/* Results */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {results.length > 0 && (
                    <div className="h-14 px-6 border-b border-border flex items-center justify-between shrink-0">
                        <span className="text-sm font-medium">{selectedDevice} • {scenes.find(s => s.id === selectedScene)?.label}</span>
                        <div className="flex gap-2"><Button variant="outline" size="sm" className="gap-2"><Folder className="w-4 h-4" /> Save All</Button><Button size="sm" className="gap-2"><Download className="w-4 h-4" /> Export All</Button></div>
                    </div>
                )}
                <div className="flex-1 overflow-y-auto p-8">
                    {isGenerating ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4"><div className="relative"><div className="w-16 h-16 rounded-full border-4 border-muted border-t-primary animate-spin" /><Box className="w-6 h-6 text-muted-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" /></div><p className="text-sm text-muted-foreground animate-pulse">Generating mockups...</p></div>
                    ) : results.length > 0 ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
                            {results.map((url, i) => (
                                <div key={i} className="group relative rounded-2xl border border-border overflow-hidden shadow-lg bg-card">
                                    <img src={url} alt={`Mockup ${i + 1}`} className="w-full aspect-video object-cover" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <Button size="sm" variant="secondary" className="gap-2"><Download className="w-4 h-4" /> Download</Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                            <div className="w-20 h-20 rounded-2xl bg-muted border border-border flex items-center justify-center"><Box className="w-8 h-8 text-muted-foreground" /></div>
                            <div><h3 className="font-semibold">Create Product Mockups</h3><p className="text-sm text-muted-foreground mt-1">Upload a screenshot and choose a device to create professional mockups</p></div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
