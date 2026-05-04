'use client';

import * as React from 'react';
import { Image as ImageIcon, Play, Loader2 } from 'lucide-react';
import { Button } from '@/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ConnectionInfo } from './ConnectionInfo';
import { NodePanelProps } from '../NodePanels';
import { ImageModel, AspectRatio, ImageQuality } from '../types';

export function ImageGenNodePanel({ nodeData, onChange, isGenerating, handlers }: NodePanelProps) {
    return (
        <div className="space-y-4">
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="flex items-start gap-2">
                    <ImageIcon className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-xs text-blue-300 font-medium">Image Generator</p>
                        <p className="text-[10px] text-blue-300/60 mt-1">
                            Generate high-quality images from text prompts.
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <div className="text-xs font-medium text-white/60">AI Model</div>
                <select
                    value={(nodeData.model as string) || 'seedream'}
                    onChange={(e) => onChange('model', e.target.value)}
                    className="w-full h-11 bg-gray-950/20 border border-white/10 rounded-lg px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50 appearance-none"
                >
                    <option value="seedream">Seedream 4 4K ⭐</option>
                    <option value="flux">Flux Schnell</option>
                    <option value="imagen3">Google Imagen 3</option>
                    <option value="midjourney">Midjourney v6</option>
                    <option value="dalle3">DALL-E 3</option>
                    <option value="stable">Stable Diffusion XL</option>
                </select>
            </div>

            <div className="space-y-2">
                <div className="text-xs font-medium text-white/60">Aspect Ratio</div>
                <div className="grid grid-cols-4 gap-2">
                    {['1:1', '4:3', '16:9', '9:16'].map((ratio) => (
                        <Button
                            key={ratio}
                            variant={(nodeData.aspectRatio || '1:1') === ratio ? 'default' : 'outline'}
                            onClick={() => onChange('aspectRatio', ratio)}
                            className={cn(
                                "h-9 text-xs font-medium",
                                (nodeData.aspectRatio || '1:1') === ratio ? "bg-blue-600 hover:bg-blue-500 border-none" : "bg-white/5 border-white/10 hover:bg-white/10 text-white/60"
                            )}
                        >
                            {ratio}
                        </Button>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <div className="text-xs font-medium text-white/60">Quality</div>
                <div className="grid grid-cols-3 gap-2">
                    {['standard', 'hd', '4k'].map((quality) => (
                        <button
                            key={quality}
                            onClick={() => onChange('quality', quality)}
                            className={`p-2 rounded-lg text-xs font-medium uppercase transition-all ${(nodeData.quality || 'hd') === quality ? 'bg-blue-600 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}
                        >
                            {quality}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <div className="text-xs font-medium text-white/60">Negative Prompt (Optional)</div>
                <textarea
                    value={(nodeData.negativePrompt as string) || ''}
                    onChange={(e) => onChange('negativePrompt', e.target.value)}
                    className="w-full h-20 bg-gray-950/20 border border-white/10 rounded-lg p-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50 resize-none"
                    placeholder="What to avoid in generation..."
                />
            </div>

            <ConnectionInfo accepts={['Text', 'Enhanced Text']} outputs="Image" />

            <div className="space-y-2 pt-2">
                <Button
                    onClick={async () => {
                        const prompt = (nodeData.inputPrompt as string) || 'A beautiful landscape';
                        if (handlers?.handleGenerateImage) {
                            const result = await handlers.handleGenerateImage({
                                prompt,
                                model: (nodeData.model as ImageModel) || ImageModel.SEEDREAM,
                                aspectRatio: (nodeData.aspectRatio as AspectRatio) || AspectRatio.SQUARE,
                                quality: (nodeData.quality as ImageQuality) || ImageQuality.HD,
                                negativePrompt: nodeData.negativePrompt as string,
                            });
                            if (result) {
                                onChange('generationId', result.id);
                                onChange('status', result.status);
                                toast.success('Generation started');
                            }
                        }
                    }}
                    disabled={isGenerating}
                    className="w-full h-11 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 rounded-xl text-sm font-medium text-white shadow-lg shadow-blue-500/20"
                >
                    {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    {isGenerating ? 'Generating...' : 'Generate Image'}
                </Button>
            </div>

            {(nodeData.usedPrompt as string) && (
                <div className="space-y-2">
                    <div className="text-xs font-medium text-white/60">Last Used Prompt</div>
                    <div className="p-3 bg-gray-950/20 rounded-lg text-xs text-white/60 max-h-20 overflow-y-auto">
                        {nodeData.usedPrompt as string}
                    </div>
                </div>
            )}
        </div>
    );
}
