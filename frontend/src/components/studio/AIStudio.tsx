'use client';

import { Sparkles, Wand2, Download, Maximize2, RefreshCw } from 'lucide-react';
import { GlassCard } from '@/ui/glass-card';
import { Button } from '@/ui/button';

export function AIStudio() {
    return (
        <div className="grid h-full grid-cols-1 gap-6 lg:grid-cols-4">
            {/* Parameters Sidebar */}
            <GlassCard variant="morphism" className="lg:col-span-1 space-y-6 overflow-y-auto border-border">
                <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Model Settings</h3>

                    <div className="space-y-2">
                        <label className="text-[10px] text-muted-foreground">Base Model</label>
                        <Button variant="outline" className="w-full justify-between text-xs">
                            Stable Diffusion XL
                            <Wand2 className="h-3 w-3" />
                        </Button>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] text-muted-foreground">Aspect Ratio</label>
                        <div className="grid grid-cols-3 gap-2">
                            {['1:1', '16:9', '4:5'].map((ratio) => (
                                <Button
                                    key={ratio}
                                    variant="outline"
                                    className={ratio === '1:1' ? 'border-primary bg-primary/10 text-xs' : 'text-xs'}
                                >
                                    {ratio}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-border">
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <label className="text-[10px] text-muted-foreground">Steps</label>
                                <span className="text-[10px] text-primary">30</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-muted" />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <label className="text-[10px] text-muted-foreground">Guidance Scale</label>
                                <span className="text-[10px] text-primary">7.5</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-muted" />
                        </div>
                    </div>
                </div>

                <Button className="w-full gap-2 font-bold">
                    <Wand2 className="h-4 w-4" />
                    Generate
                </Button>
            </GlassCard>

            {/* Main Studio Canvas */}
            <GlassCard variant="default" className="lg:col-span-3 flex min-h-[500px] flex-col overflow-hidden p-0 border-border bg-background/50">
                <div className="flex items-center justify-between border-b border-border px-6 py-3">
                    <span className="text-xs font-medium text-muted-foreground">Preview Canvas</span>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Maximize2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="flex flex-1 items-center justify-center p-8">
                    <div className="relative aspect-square w-full max-w-md overflow-hidden rounded-2xl border border-border bg-muted shadow-2xl">
                        <img
                            src="https://images.unsplash.com/photo-1614726365636-dd49de8410c1?w=800&h=800&fit=crop"
                            className="h-full w-full object-cover opacity-50 grayscale"
                            alt="Studio Preview"
                        />
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px]">
                            <Sparkles className="mb-2 h-8 w-8 text-primary animate-pulse" />
                            <p className="text-sm font-medium">Ready to create</p>
                            <p className="text-[10px] text-muted-foreground">Set your parameters and hit Generate</p>
                        </div>
                    </div>
                </div>

                <div className="border-t border-border px-6 py-4 flex justify-center gap-4">
                    <Button variant="outline" className="gap-2 text-xs">
                        <RefreshCw className="h-3 w-3" />
                        Vary (Strong)
                    </Button>
                    <Button variant="outline" className="gap-2 text-xs">
                        <Maximize2 className="h-3 w-3" />
                        Upscale (2x)
                    </Button>
                    <Button variant="outline" className="gap-2 text-xs text-chart-4 border-chart-4/20 bg-chart-4/5">
                        <Download className="h-3 w-3" />
                        Download
                    </Button>
                </div>
            </GlassCard>
        </div>
    );
}
