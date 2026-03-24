'use client';

import { useState } from 'react';
import { useGenerationStore } from '@/stores/generation-store';
import { Zap, Download, Sparkles, Loader2, Play, Pause, Volume2, Clock, Folder } from 'lucide-react';
import { Button } from '@/ui/button';
import { Slider } from '@/ui/slider';
import { Label } from '@/ui/label';
import { cn } from '@/lib/utils';

const sfxCategories = [
    { id: 'nature', label: 'Nature', emoji: '🌿', examples: ['Rain', 'Thunder', 'Wind', 'Ocean'] },
    { id: 'mechanical', label: 'Mechanical', emoji: '⚙️', examples: ['Engine', 'Click', 'Beep', 'Motor'] },
    { id: 'impact', label: 'Impact', emoji: '💥', examples: ['Explosion', 'Crash', 'Hit', 'Break'] },
    { id: 'human', label: 'Human', emoji: '👤', examples: ['Footsteps', 'Breathing', 'Clap', 'Crowd'] },
    { id: 'ui', label: 'UI/UX', emoji: '📱', examples: ['Notification', 'Click', 'Swoosh', 'Pop'] },
    { id: 'scifi', label: 'Sci-Fi', emoji: '🚀', examples: ['Laser', 'Warp', 'Robot', 'Energy'] },
    { id: 'ambient', label: 'Ambient', emoji: '🌊', examples: ['City', 'Forest', 'Space', 'Room'] },
    { id: 'musical', label: 'Musical', emoji: '🎵', examples: ['Stinger', 'Jingle', 'Whoosh', 'Riser'] },
];

const durations = ['0.5s', '1s', '2s', '3s', '5s', '10s', '15s', '30s'];

const mockResults = [
    { id: '1', name: 'Thunder Strike', duration: '2.3s', category: 'Nature' },
    { id: '2', name: 'Distant Rumble', duration: '3.1s', category: 'Nature' },
    { id: '3', name: 'Rain on Roof', duration: '5.0s', category: 'Nature' },
    { id: '4', name: 'Lightning Crack', duration: '1.2s', category: 'Impact' },
];

export default function SfxGeneratorPage() {
    const [prompt, setPrompt] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [duration, setDuration] = useState('2s');
    const [variations, setVariations] = useState(4);
    const [intensity, setIntensity] = useState(50);
    const [isGenerating, setIsGenerating] = useState(false);
    const [results, setResults] = useState<typeof mockResults>([]);
    const [playingId, setPlayingId] = useState<string | null>(null);
    const [contentTab, setContentTab] = useState<'results' | 'library'>('results');
    const { generateSfx, currentGeneration, error: storeError } = useGenerationStore();

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setIsGenerating(true);
        await generateSfx({
            prompt,
            category: selectedCategory || undefined,
            duration: parseFloat(duration),
        });
        setResults(mockResults);
        setIsGenerating(false);
    };

    return (
        <div className="h-full bg-background text-foreground flex overflow-hidden">
            <div className="w-[320px] border-r border-border flex flex-col shrink-0 bg-background">
                <div className="h-14 px-6 border-b border-border flex items-center shrink-0">
                    <h2 className="font-bold text-muted-foreground">SFX Generator</h2>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Prompt */}
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Describe the Sound</h4>
                        <div className="bg-card rounded-xl border border-border p-2">
                            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="e.g., Heavy rain on a tin roof, thunder rumbling in the distance..." className="w-full h-28 bg-transparent text-sm placeholder:text-muted-foreground resize-none focus:outline-none p-2" />
                        </div>
                    </div>

                    {/* Categories */}
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Category</h4>
                        <div className="grid grid-cols-4 gap-1.5">
                            {sfxCategories.map((cat) => (
                                <button key={cat.id} onClick={() => { setSelectedCategory(cat.id === selectedCategory ? null : cat.id); if (!prompt) setPrompt(cat.examples[0]); }}
                                    className={cn("flex flex-col items-center gap-1 p-2 rounded-xl border transition-all", selectedCategory === cat.id ? "bg-accent border-primary/20" : "bg-card border-border hover:border-border/80")}>
                                    <span className="text-base">{cat.emoji}</span>
                                    <span className="text-[8px] font-medium">{cat.label}</span>
                                </button>
                            ))}
                        </div>
                        {selectedCategory && (
                            <div className="flex flex-wrap gap-1.5">
                                {sfxCategories.find(c => c.id === selectedCategory)?.examples.map((ex) => (
                                    <button key={ex} onClick={() => setPrompt(ex)} className="px-2.5 py-1 rounded-lg bg-muted border border-border text-[10px] font-medium hover:bg-accent transition-colors">{ex}</button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Duration */}
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Duration</h4>
                        <div className="flex flex-wrap gap-1.5">
                            {durations.map((d) => (
                                <button key={d} onClick={() => setDuration(d)} className={cn("px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all", duration === d ? "bg-accent border border-primary/20" : "bg-card border border-border")}>{d}</button>
                            ))}
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="space-y-5">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between"><Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Variations</Label><span className="text-[11px] font-mono">{variations}</span></div>
                            <Slider min={1} max={8} step={1} value={[variations]} onValueChange={([v]) => setVariations(v)} />
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between"><Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Intensity</Label><span className="text-[11px] font-mono">{intensity}%</span></div>
                            <Slider min={0} max={100} step={5} value={[intensity]} onValueChange={([v]) => setIntensity(v)} />
                        </div>
                    </div>
                </div>
                <div className="p-4 border-t border-border space-y-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground px-1"><span>Cost:</span><span className="font-medium text-foreground">{variations} Credits</span></div>
                    <Button onClick={handleGenerate} disabled={isGenerating || !prompt.trim()} className="w-full h-12 font-bold rounded-xl gap-2">
                        {isGenerating ? (<><Loader2 className="w-5 h-5 animate-spin" /> Generating...</>) : (<><Zap className="w-5 h-5" /> Generate SFX</>)}
                    </Button>
                </div>
            </div>

            {/* Results */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="h-14 px-6 border-b border-border flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-1">
                        {(['results', 'library'] as const).map((tab) => (
                            <button key={tab} onClick={() => setContentTab(tab)} className={cn("px-4 py-2 text-sm font-medium rounded-full transition-colors capitalize", contentTab === tab ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground")}>{tab === 'results' ? 'Generated' : 'Sound Library'}</button>
                        ))}
                    </div>
                    {results.length > 0 && <Button size="sm" className="gap-2"><Download className="w-4 h-4" /> Export All</Button>}
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                    {isGenerating ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4"><div className="relative"><div className="w-16 h-16 rounded-full border-4 border-muted border-t-primary animate-spin" /><Zap className="w-6 h-6 text-muted-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" /></div><p className="text-sm text-muted-foreground animate-pulse">Generating sound effects...</p></div>
                    ) : results.length > 0 ? (
                        <div className="space-y-3 max-w-3xl mx-auto">
                            {results.map((sfx) => (
                                <div key={sfx.id} className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border hover:border-border/80 transition-colors group">
                                    <button onClick={() => setPlayingId(playingId === sfx.id ? null : sfx.id)} className="w-12 h-12 rounded-full bg-muted flex items-center justify-center hover:bg-accent transition-colors shrink-0">
                                        {playingId === sfx.id ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
                                    </button>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium">{sfx.name}</p>
                                        <p className="text-xs text-muted-foreground">{sfx.category} • {sfx.duration}</p>
                                    </div>
                                    <div className="hidden md:flex items-center gap-[2px] h-8">
                                        {Array.from({ length: 40 }).map((_, i) => (
                                            <div key={i} className={cn("w-[2px] rounded-full transition-colors", playingId === sfx.id ? "bg-primary" : "bg-muted-foreground/20")} style={{ height: `${Math.random() * 24 + 4}px` }} />
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="icon" className="w-8 h-8"><Download className="w-4 h-4" /></Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                            <div className="w-20 h-20 rounded-2xl bg-muted border border-border flex items-center justify-center"><Zap className="w-8 h-8 text-muted-foreground" /></div>
                            <div><h3 className="font-semibold">Generate Sound Effects</h3><p className="text-sm text-muted-foreground mt-1">Describe any sound and AI will create it for you</p></div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
