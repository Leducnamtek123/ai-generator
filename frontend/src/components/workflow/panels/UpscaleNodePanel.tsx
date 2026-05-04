'use client';

import * as React from 'react';
import Image from 'next/image';
import { Scan, Loader2 } from 'lucide-react';
import { Button } from '@/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ConnectionInfo } from './ConnectionInfo';
import { NodePanelProps } from '../NodePanels';
import { UpscaleFactor, UpscaleMode } from '../types';

export function UpscaleNodePanel({ nodeData, onChange, isGenerating, handlers }: NodePanelProps) {
    return (
        <div className="space-y-4">
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                <div className="flex items-start gap-2">
                    <Scan className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-xs text-indigo-300 font-medium">AI Upscaler</p>
                        <p className="text-[10px] text-indigo-300/60 mt-1">Uses Magnific AI technology for enhanced 2x/4x upscaling.</p>
                    </div>
                </div>
            </div>

            {nodeData.previewUrl ? (
                <div className="aspect-video rounded-lg bg-gray-950/20 overflow-hidden relative">
                    <Image src={nodeData.previewUrl as string} alt="Upscaled preview" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 320px" />
                </div>
            ) : (
                <div className="aspect-video rounded-lg bg-gray-950/20 flex flex-col items-center justify-center gap-2 border border-dashed border-white/10">
                    <Scan className="w-8 h-8 text-white/20" />
                    <p className="text-xs text-white/30">Waiting for image...</p>
                </div>
            )}

            <div className="space-y-2">
                <div className="text-xs font-medium text-white/60">Scale Factor</div>
                <div className="grid grid-cols-2 gap-2">
                    <Button
                        variant={(nodeData.scale || UpscaleFactor.TWO_X) === UpscaleFactor.TWO_X ? 'default' : 'outline'}
                        onClick={() => onChange('scale', UpscaleFactor.TWO_X)}
                        className={cn(
                            "h-12 text-sm font-medium gap-2",
                            (nodeData.scale || UpscaleFactor.TWO_X) === UpscaleFactor.TWO_X ? "bg-indigo-600 hover:bg-indigo-500 border-none" : "bg-white/5 border-white/10 hover:bg-white/10 text-white/60"
                        )}
                    >
                        <Scan className="w-4 h-4" /> 2x
                    </Button>
                    <Button
                        variant={nodeData.scale === UpscaleFactor.FOUR_X ? 'default' : 'outline'}
                        onClick={() => onChange('scale', UpscaleFactor.FOUR_X)}
                        className={cn(
                            "h-12 text-sm font-medium gap-2",
                            nodeData.scale === UpscaleFactor.FOUR_X ? "bg-indigo-600 hover:bg-indigo-500 border-none" : "bg-white/5 border-white/10 hover:bg-white/10 text-white/60"
                        )}
                    >
                        <Scan className="w-4 h-4" /> 4x Pro
                    </Button>
                </div>
            </div>

            <div className="space-y-2">
                <div className="text-xs font-medium text-white/60">Enhancement Mode</div>
                <select
                    value={(nodeData.enhanceMode as string) || UpscaleMode.CREATIVE}
                    onChange={(e) => onChange('enhanceMode', e.target.value)}
                    className="w-full bg-gray-950/20 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-indigo-500/50"
                >
                    <option value={UpscaleMode.CREATIVE}>Creative (Add Details)</option>
                    <option value={UpscaleMode.FAITHFUL}>Faithful (Preserve Original)</option>
                    <option value={UpscaleMode.BALANCED}>Balanced (Best of Both)</option>
                </select>
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
                    className="w-full h-11 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 rounded-xl text-sm font-medium text-white shadow-lg shadow-indigo-500/20"
                >
                    {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scan className="w-4 h-4" />}
                    {isGenerating ? 'Upscaling...' : `Upscale ${String(nodeData.scale) || '2x'}`}
                </Button>
            </div>
        </div>
    );
}
