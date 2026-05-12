'use client';

import * as React from 'react';
import { Wand2 } from 'lucide-react';
import { Button } from '@/ui/button';
import { cn } from '@/lib/utils';
import { NodePanelProps } from '../NodePanels';
import { ToolType } from '../types';

const TOOL_OPTIONS: Array<{ value: ToolType; label: string; description: string }> = [
    { value: ToolType.IMAGE_GEN, label: 'Image', description: 'Text to image' },
    { value: ToolType.VIDEO_GEN, label: 'Video', description: 'Text or image to video' },
    { value: ToolType.UPSCALE, label: 'Upscale', description: 'Image enhancement' },
    { value: ToolType.ASSISTANT, label: 'Assistant', description: 'Prompt enhancement' },
    { value: ToolType.MUSIC, label: 'Music', description: 'Text to music' },
    { value: ToolType.SFX, label: 'SFX', description: 'Text to sound effects' },
    { value: ToolType.VOICE, label: 'Voice', description: 'Text to speech' },
    { value: ToolType.LIP_SYNC, label: 'Lip Sync', description: 'Sync video and audio' },
    { value: ToolType.VIDEO_UPSCALE, label: 'Video Upscale', description: 'Enhance videos' },
    { value: ToolType.BG_REMOVE, label: 'BG Remove', description: 'Remove backgrounds' },
    { value: ToolType.SKETCH_TO_IMAGE, label: 'Sketch', description: 'Sketch to image' },
    { value: ToolType.VARIATIONS, label: 'Variations', description: 'Generate image variations' },
    { value: ToolType.CAMERA_CHANGE, label: 'Camera', description: 'Change viewpoint' },
    { value: ToolType.ICON_GEN, label: 'Icon', description: 'Generate icons' },
    { value: ToolType.IMAGE_EXTEND, label: 'Extend', description: 'Outpaint images' },
    { value: ToolType.MOCKUP, label: 'Mockup', description: 'Design mockups' },
    { value: ToolType.SKIN_ENHANCE, label: 'Skin', description: 'Portrait enhancement' },
];

export function ToolNodePanel({ nodeData, onChange }: NodePanelProps) {
    return (
        <div className="space-y-4">
            <div className="rounded-lg border border-fuchsia-500/20 bg-fuchsia-500/10 p-3">
                <div className="flex items-start gap-2">
                    <Wand2 className="size-4 text-fuchsia-300 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-xs text-fuchsia-200 font-medium">Tool Node</p>
                        <p className="text-[10px] text-fuchsia-200/60 mt-1">
                            Choose any generation tool and run it with real backend endpoints.
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">Tool Type</div>
                <div className="grid grid-cols-2 gap-2">
                    {TOOL_OPTIONS.map((tool) => (
                        <Button
                            key={tool.value}
                            variant={(nodeData.toolType as string) === tool.value ? 'default' : 'outline'}
                            onClick={() => onChange('toolType', tool.value)}
                            className={cn(
                                'h-auto py-2 px-3 text-left flex flex-col items-start gap-1',
                                (nodeData.toolType as string) === tool.value
                                    ? 'bg-fuchsia-600 hover:bg-fuchsia-500 border-none'
                                    : 'bg-background/60 border-border hover:bg-accent text-muted-foreground',
                            )}
                        >
                            <span className="text-xs font-medium">{tool.label}</span>
                            <span className="text-[10px] opacity-70">{tool.description}</span>
                        </Button>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">Prompt / Text</div>
                <textarea
                    value={(nodeData.prompt as string) || ''}
                    onChange={(e) => onChange('prompt', e.target.value)}
                    className="min-h-[92px] w-full resize-none rounded-lg border border-border bg-background/60 p-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-fuchsia-500/50"
                    placeholder="Describe what you want to create?"
                />
            </div>

            <div className="grid grid-cols-1 gap-2">
                <div className="space-y-2">
                    <div className="text-xs font-medium text-muted-foreground">Primary URL</div>
                    <input
                        value={(nodeData.primaryUrl as string) || ''}
                        onChange={(e) => onChange('primaryUrl', e.target.value)}
                        className="h-11 w-full rounded-lg border border-border bg-background/60 px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-fuchsia-500/50"
                        placeholder="Image / video / design / audio URL"
                    />
                </div>

                <div className="space-y-2">
                    <div className="text-xs font-medium text-muted-foreground">Secondary URL</div>
                    <input
                        value={(nodeData.secondaryUrl as string) || ''}
                        onChange={(e) => onChange('secondaryUrl', e.target.value)}
                        className="h-11 w-full rounded-lg border border-border bg-background/60 px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-fuchsia-500/50"
                        placeholder="Audio / end frame / extra input URL"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">Advanced Params JSON</div>
                <textarea
                    value={(nodeData.advancedParams as string) || '{}'}
                    onChange={(e) => onChange('advancedParams', e.target.value)}
                    className="min-h-[120px] w-full resize-none rounded-lg border border-border bg-background/60 p-3 font-mono text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-fuchsia-500/50"
                    placeholder='{"model":"seedream"}'
                />
            </div>
        </div>
    );
}
