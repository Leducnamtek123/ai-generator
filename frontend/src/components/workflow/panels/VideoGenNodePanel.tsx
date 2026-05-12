'use client';

import * as React from 'react';
import { Video, Play, Loader2 } from 'lucide-react';
import { Button } from '@/ui/button';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ConnectionInfo } from './ConnectionInfo';
import { NodePanelProps } from '../NodePanels';
import { VideoModel, AspectRatio, VideoDuration } from '../types';

export function VideoGenNodePanel({ nodeData, onChange, isGenerating, handlers }: NodePanelProps) {
    return (
        <div className="space-y-4">
            <div className="rounded-lg border border-purple-500/20 bg-purple-500/10 p-3">
                <div className="flex items-start gap-2">
                    <Video className="size-4 text-purple-400 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-xs text-purple-300 font-medium">Video Generator</p>
                        <p className="text-[10px] text-purple-300/60 mt-1">Generate AI videos from text or images.</p>
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                    <div className="text-xs font-medium text-muted-foreground">Video Model</div>
                <Select value={(nodeData.model as string) || VideoModel.RUNWAY} onValueChange={(value) => onChange('model', value)}>
                    <SelectTrigger className="h-11 w-full rounded-lg border border-border bg-background/60 px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-purple-500/50">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={VideoModel.RUNWAY}>Runway Gen-3 ⭐</SelectItem>
                        <SelectItem value={VideoModel.SORA}>OpenAI Sora</SelectItem>
                        <SelectItem value={VideoModel.PIKA}>Pika Labs</SelectItem>
                        <SelectItem value={VideoModel.KLING}>Kling AI</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                    <div className="text-xs font-medium text-muted-foreground">Duration</div>
                <div className="grid grid-cols-4 gap-2">
                    {[VideoDuration.FOUR_S, VideoDuration.EIGHT_S, VideoDuration.SIXTEEN_S, VideoDuration.TWENTY_FOUR_S].map((duration) => (
                        <Button
                            key={duration}
                            variant={(nodeData.duration || VideoDuration.EIGHT_S) === duration ? 'default' : 'outline'}
                            onClick={() => onChange('duration', duration)}
                            className={cn(
                                "h-9 text-xs font-medium",
                                (nodeData.duration || VideoDuration.EIGHT_S) === duration ? "bg-purple-600 hover:bg-purple-500 border-none" : "bg-background/60 border-border hover:bg-accent text-muted-foreground"
                            )}
                        >
                            {duration}
                        </Button>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                    <div className="text-xs font-medium text-muted-foreground">Aspect Ratio</div>
                <div className="grid grid-cols-3 gap-2">
                    {[AspectRatio.WIDESCREEN, AspectRatio.PORTRAIT_WIDE, AspectRatio.SQUARE].map((ratio) => (
                        <Button
                            key={ratio}
                            variant={(nodeData.aspectRatio || AspectRatio.WIDESCREEN) === ratio ? 'default' : 'outline'}
                            onClick={() => onChange('aspectRatio', ratio)}
                            className={cn(
                                "h-9 text-xs font-medium",
                                (nodeData.aspectRatio || AspectRatio.WIDESCREEN) === ratio ? "bg-purple-600 hover:bg-purple-500 border-none" : "bg-background/60 border-border hover:bg-accent text-muted-foreground"
                            )}
                        >
                            {ratio}
                        </Button>
                    ))}
                </div>
            </div>

            <ConnectionInfo accepts={['Text', 'Enhanced Text', 'Image']} outputs="Video" />

            <div className="space-y-2 pt-2">
                <Button
                    onClick={async () => {
                        const prompt = (nodeData.inputPrompt as string) || 'A cinematic scene';
                        if (handlers?.handleGenerateVideo) {
                            await handlers.handleGenerateVideo({
                                prompt,
                                model: (nodeData.model as VideoModel) || VideoModel.RUNWAY,
                                duration: (nodeData.duration as VideoDuration) || VideoDuration.EIGHT_S,
                                aspectRatio: (nodeData.aspectRatio as AspectRatio) || AspectRatio.WIDESCREEN,
                                startImageUrl: nodeData.startImageUrl as string,
                                endImageUrl: nodeData.endImageUrl as string,
                            });
                        }
                    }}
                    disabled={isGenerating}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 rounded-xl text-sm font-medium text-white shadow-lg shadow-purple-500/20 disabled:opacity-50"
                >
                    {isGenerating ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
                    {isGenerating ? 'Generating...' : 'Generate Video'}
                </Button>
            </div>
        </div>
    );
}
