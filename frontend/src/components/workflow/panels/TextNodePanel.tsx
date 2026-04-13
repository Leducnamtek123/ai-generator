'use client';

import * as React from 'react';
import { Type } from 'lucide-react';
import { Button } from '@/ui/button';
import { ConnectionInfo } from './ConnectionInfo';
import { NodePanelProps } from '../NodePanels';

export function TextNodePanel({ nodeData, onChange }: NodePanelProps) {
    return (
        <div className="space-y-4">
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="flex items-start gap-2">
                    <Type className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-xs text-green-300 font-medium">Text Prompt</p>
                        <p className="text-[10px] text-green-300/60 mt-1">
                            Enter a description that will be used to generate images or videos.
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-medium text-white/60">Prompt Text</label>
                <textarea
                    value={(nodeData.text as string) || ''}
                    onChange={(e) => onChange('text', e.target.value)}
                    className="w-full h-32 bg-black/20 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-green-500/50 resize-none"
                    placeholder="Describe what you want to create..."
                />
                <div className="flex items-center justify-between">
                    <p className="text-[10px] text-white/30">{((nodeData.text as string) || '').length} characters</p>
                    <button onClick={() => onChange('text', '')} className="text-[10px] text-white/40 hover:text-white transition-colors">
                        Clear
                    </button>
                </div>
            </div>

            <ConnectionInfo accepts={['None (Input Node)']} outputs="Text Prompt" />

            <div className="space-y-2">
                <label className="text-xs font-medium text-white/60">Quick Starters</label>
                <div className="grid grid-cols-2 gap-2">
                    {['Portrait photo of a person', 'Beautiful landscape scene', 'Professional product shot', 'Abstract art composition'].map((p) => (
                        <Button
                            key={p}
                            variant="outline"
                            onClick={() => onChange('text', p)}
                            className="h-auto py-2 bg-white/5 hover:bg-white/10 border-white/10 rounded-lg text-xs text-white/60 hover:text-white transition-colors justify-start text-left whitespace-normal"
                        >
                            {p}
                        </Button>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-medium text-white/60">Style Presets</label>
                <div className="flex flex-wrap gap-2">
                    {['Photorealistic', 'Cinematic', 'Anime', 'Digital Art', '3D Render', 'Watercolor'].map((style) => (
                        <Button
                            key={style}
                            variant="ghost"
                            size="sm"
                            onClick={() => onChange('text', `${(nodeData.text as string) || ''}, ${style.toLowerCase()} style`)}
                            className="h-7 px-2 bg-white/5 hover:bg-green-500/20 hover:text-green-400 rounded text-[10px] text-white/60 transition-colors"
                        >
                            {style}
                        </Button>
                    ))}
                </div>
            </div>
        </div>
    );
}
