'use client';

import * as React from 'react';
import { Sparkles, Wand2, Loader2 } from 'lucide-react';
import { Button } from '@/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ConnectionInfo } from './ConnectionInfo';
import { NodePanelProps } from '../NodePanels';
import { AssistantMode, StyleEmphasis, DetailLevel } from '../types';

export function AssistantNodePanel({ nodeData, onChange, isGenerating, handlers }: NodePanelProps) {
    return (
        <div className="space-y-4">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-xs text-emerald-300 font-medium">AI Prompt Enhancer</p>
                        <p className="text-[10px] text-emerald-300/60 mt-1">Transforms simple prompts into detailed, optimized descriptions.</p>
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-medium text-white/60">Enhancement Mode</label>
                <select
                    value={(nodeData.mode as string) || AssistantMode.ENHANCE}
                    onChange={(e) => onChange('mode', e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                >
                    <option value={AssistantMode.ENHANCE}>Enhance - Improve clarity & detail</option>
                    <option value={AssistantMode.EXPAND}>Expand - Add creative details</option>
                    <option value={AssistantMode.CREATIVE}>Creative - Artistic interpretation</option>
                    <option value={AssistantMode.PROFESSIONAL}>Professional - Commercial quality</option>
                    <option value={AssistantMode.CINEMATIC}>Cinematic - Film-like descriptions</option>
                </select>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-medium text-white/60">Style Emphasis</label>
                <div className="flex flex-wrap gap-2">
                    {[StyleEmphasis.NONE, StyleEmphasis.PHOTOREALISTIC, StyleEmphasis.ARTISTIC, StyleEmphasis.ANIME, StyleEmphasis.FANTASY, StyleEmphasis.SCI_FI].map((style) => (
                        <Button
                            key={style}
                            variant={(nodeData.styleEmphasis || StyleEmphasis.NONE) === style ? 'default' : 'outline'}
                            onClick={() => onChange('styleEmphasis', style)}
                            className={cn(
                                "h-7 px-2 text-[10px] font-medium transition-all",
                                (nodeData.styleEmphasis || StyleEmphasis.NONE) === style ? "bg-emerald-600 hover:bg-emerald-500 border-none" : "bg-white/5 border-white/10 hover:bg-white/10 text-white/60"
                            )}
                        >
                            {style}
                        </Button>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-medium text-white/60">Detail Level</label>
                <div className="grid grid-cols-3 gap-2">
                    {[DetailLevel.LOW, DetailLevel.MEDIUM, DetailLevel.HIGH].map((level) => (
                        <Button
                            key={level}
                            variant={(nodeData.detailLevel || DetailLevel.MEDIUM) === level ? 'default' : 'outline'}
                            onClick={() => onChange('detailLevel', level)}
                            className={cn(
                                "h-9 text-xs font-medium capitalize",
                                (nodeData.detailLevel || DetailLevel.MEDIUM) === level ? "bg-emerald-600 hover:bg-emerald-500 border-none" : "bg-white/5 border-white/10 hover:bg-white/10 text-white/60"
                            )}
                        >
                            {level}
                        </Button>
                    ))}
                </div>
            </div>

            <ConnectionInfo accepts={['Text']} outputs="Enhanced Text" />

            {(nodeData.enhancedText as string) && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-white/60">Enhanced Output</label>
                    </div>
                    <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg text-xs text-white/80 max-h-32 overflow-y-auto">
                        {nodeData.enhancedText as string}
                    </div>
                </div>
            )}

            <div className="space-y-2 pt-2">
                <Button
                    onClick={async () => {
                        const prompt = (nodeData.inputPrompt as string);
                        if (!prompt || !handlers?.handleEnhancePrompt) return;
                        const enhanced = await handlers.handleEnhancePrompt({
                            prompt,
                            style: (nodeData.styleEmphasis as StyleEmphasis) || StyleEmphasis.PHOTOREALISTIC,
                        });
                        if (enhanced) {
                            onChange('enhancedText', enhanced);
                            toast.success('Prompt enhanced');
                        }
                    }}
                    disabled={isGenerating}
                    className="w-full h-11 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 rounded-xl text-sm font-medium text-white shadow-lg shadow-emerald-500/20"
                >
                    {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                    {isGenerating ? 'Enhancing...' : 'Enhance Prompt'}
                </Button>
            </div>
        </div>
    );
}
