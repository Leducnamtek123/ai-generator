'use client';

import * as React from 'react';
import Image from 'next/image';
import { Scan, Loader2 } from 'lucide-react';
import { Button } from '@/ui/button';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ConnectionInfo } from './ConnectionInfo';
import { NodePanelProps } from '../NodePanels';
import { UpscaleFactor, UpscaleMode } from '../types';

export function UpscaleNodePanel({ nodeData, onChange, isGenerating, handlers }: NodePanelProps) {
    return (
        <div className="space-y-4">
            <div className="rounded-lg border border-violet-500/20 bg-violet-500/10 p-3">
                <div className="flex items-start gap-2">
                    <Scan className="size-4 text-violet-400 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-xs text-violet-300 font-medium">AI Upscaler</p>
                        <p className="text-[10px] text-violet-300/60 mt-1">Uses Magnific AI technology for enhanced 2x/4x upscaling.</p>
                    </div>
                </div>
            </div>

            {nodeData.previewUrl ? (
                <div className="relative aspect-video overflow-hidden rounded-lg bg-background/60">
                    <Image src={nodeData.previewUrl as string} alt="Upscaled preview" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 320px" />
                </div>
            ) : (
                <div className="flex aspect-video flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/30">
                    <Scan className="size-8 text-muted-foreground/40" />
                    <p className="text-xs text-muted-foreground">Waiting for image?</p>
                </div>
            )}

            <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">Scale Factor</div>
                <div className="grid grid-cols-2 gap-2">
                    <Button
                        variant={(nodeData.scale || UpscaleFactor.TWO_X) === UpscaleFactor.TWO_X ? 'default' : 'outline'}
                        onClick={() => onChange('scale', UpscaleFactor.TWO_X)}
                        className={cn(
                            "h-12 text-sm font-medium gap-2",
                            (nodeData.scale || UpscaleFactor.TWO_X) === UpscaleFactor.TWO_X ? "bg-indigo-600 hover:bg-indigo-500 border-none" : "bg-background/60 border-border hover:bg-accent text-muted-foreground"
                        )}
                    >
                        <Scan className="size-4" /> 2x
                    </Button>
                    <Button
                        variant={nodeData.scale === UpscaleFactor.FOUR_X ? 'default' : 'outline'}
                        onClick={() => onChange('scale', UpscaleFactor.FOUR_X)}
                        className={cn(
                            "h-12 text-sm font-medium gap-2",
                            nodeData.scale === UpscaleFactor.FOUR_X ? "bg-indigo-600 hover:bg-indigo-500 border-none" : "bg-background/60 border-border hover:bg-accent text-muted-foreground"
                        )}
                    >
                        <Scan className="size-4" /> 4x Pro
                    </Button>
                </div>
            </div>

            <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">Enhancement Mode</div>
                <Select value={(nodeData.enhanceMode as string) || UpscaleMode.CREATIVE} onValueChange={(value) => onChange('enhanceMode', value)}>
                    <SelectTrigger className="w-full rounded-lg border border-border bg-background/60 p-2 text-sm text-foreground focus:border-violet-500/50 focus:outline-none">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={UpscaleMode.CREATIVE}>Creative (Add Details)</SelectItem>
                        <SelectItem value={UpscaleMode.FAITHFUL}>Faithful (Preserve Original)</SelectItem>
                        <SelectItem value={UpscaleMode.BALANCED}>Balanced (Best of Both)</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <ConnectionInfo accepts={['Image']} outputs="Upscaled Image" />

            <div className="space-y-2 pt-2">
                <Button
                    onClick={async () => {
                        const imageUrl = (nodeData.inputImageUrl as string) || (nodeData.previewUrl as string);
                        if (!imageUrl || !handlers?.handleUpscaleImage) return;
                        const scale = Number(nodeData.scale) === UpscaleFactor.FOUR_X ? 4 : 2;
                        const result = await handlers.handleUpscaleImage({
                            imageUrl,
                            scale: scale as 2 | 4,
                            enhanceMode: (nodeData.enhanceMode as UpscaleMode) || UpscaleMode.CREATIVE,
                        });
                        if (result) {
                            onChange('generationId', result.id);
                            onChange('status', result.status);
                            toast.success('Upscaling started');
                        }
                    }}
                    disabled={isGenerating}
                    className="h-11 w-full rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 text-sm font-medium text-white shadow-lg shadow-violet-500/20 hover:from-violet-500 hover:to-violet-400"
                >
                    {isGenerating ? <Loader2 className="size-4 animate-spin" /> : <Scan className="size-4" />}
                    {isGenerating ? 'Upscaling...' : `Upscale ${String(nodeData.scale) || '2x'}`}
                </Button>
            </div>
        </div>
    );
}
