'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
    X, Send, Wand2, Scissors, Crop,
    Play, Volume2, VolumeX, Type, Music, Sparkles, MoreHorizontal,
} from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/ui/dialog';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { useVideoPlayer } from './hooks/useVideoPlayer';
import { VideoToolButton } from './components/VideoToolButton';

interface VideoEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    videoUrl: string;
    onSave?: (newUrl: string) => void;
}

export function VideoEditorModal({ isOpen, onClose, videoUrl }: VideoEditorModalProps) {
    const [prompt, setPrompt] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const {
        videoRef, isPlaying, isMuted, currentTime, duration,
        togglePlay, toggleMute, handleTimeUpdate, handleLoadedMetadata, handlePlay, handlePause, formatTime,
    } = useVideoPlayer(isOpen);

    const handleEdit = async () => {
        if (!prompt.trim()) return;
        setIsProcessing(true);
        await new Promise(r => setTimeout(r, 3000));
        setIsProcessing(false);
        setPrompt('');
        toast.success("Video edit simulation: Clip would be processed based on prompt.");
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="z-[100] m-0 flex h-screen w-screen max-w-[100vw] flex-col gap-0 border-none bg-background/95 p-0 outline-none">
                {/* Header */}
                <DialogHeader className="flex h-14 flex-row items-center justify-between border-b border-border bg-card/80 px-6 gap-y-0">
                    <div className="flex items-center gap-4">
                        <button onClick={onClose} className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
                            <X className="size-5" />
                        </button>
                        <DialogTitle className="text-sm font-medium text-foreground">Clip Editor</DialogTitle>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={onClose} className="text-muted-foreground hover:text-foreground">Cancel</Button>
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-500">Save Changes</Button>
                    </div>
                </DialogHeader>

                {/* Video Area */}
                <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-background p-8">
                    <div className="group relative flex aspect-video w-full max-w-4xl items-center justify-center overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
                        <video
                            ref={videoRef}
                            src={videoUrl}
                            className="max-w-full max-h-full object-contain"
                            muted={isMuted}
                            onTimeUpdate={handleTimeUpdate}
                            onLoadedMetadata={handleLoadedMetadata}
                            onPlay={handlePlay}
                            onPause={handlePause}
                            onClick={togglePlay}
                            loop
                        />

                        {/* Play Overlay */}
                        {!isPlaying && (
                            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-background/20">
                                <div className="flex size-16 items-center justify-center rounded-full border border-border/60 bg-background/70 backdrop-blur-md">
                                    <Play className="ml-1 size-8 fill-current text-foreground" />
                                </div>
                            </div>
                        )}

                        {/* Processing Overlay */}
                        {isProcessing && (
                            <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/60 backdrop-blur-md">
                                <div className="flex flex-col items-center gap-4 text-center">
                                    <div className="relative">
                                        <Wand2 className="size-12 text-blue-500 animate-[pulse_1.5s_ease-in-out_infinite]" />
                                        <div className="absolute -inset-4 border-2 border-blue-500/20 rounded-full animate-[ping_2s_linear_infinite]" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-foreground">AI Video Processing</h3>
                                        <p className="mt-1 max-w-xs text-sm text-muted-foreground">Enhancing lighting, atmosphere, and textures?</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Timeline & Controls */}
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-3xl flex flex-col gap-4">
                        {/* Range/Timeline */}
                        <div className="rounded-2xl border border-border bg-card/90 p-4 backdrop-blur-xl">
                            <div className="flex items-center justify-between mb-3 px-1">
                                <span className="text-[10px] font-medium text-muted-foreground">Range selected</span>
                                <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">{formatTime(duration)}</span>
                            </div>
                            <div className="relative flex h-10 w-full gap-1 overflow-hidden rounded-lg border border-border bg-background/60 p-1">
                                {Array.from({ length: 12 }).map((_, i) => (
                                    <div key={i} className="relative h-full flex-1 overflow-hidden rounded-sm border border-border bg-muted/30">
                                        <Image src={videoUrl} alt="" fill className="object-cover opacity-30 blur-[1px]" sizes="8vw" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
                                    </div>
                                ))}
                                <div className="absolute top-0 bottom-0 left-[10%] right-[10%] z-10 rounded-lg border-2 border-foreground">
                                    <div className="absolute top-1/2 -left-1 h-4 w-2 -translate-y-1/2 cursor-col-resize rounded-sm bg-foreground" />
                                    <div className="absolute top-1/2 -right-1 h-4 w-2 -translate-y-1/2 cursor-col-resize rounded-sm bg-foreground" />
                                </div>
                                <div
                                    className="absolute top-0 bottom-0 w-0.5 bg-blue-500 z-20 shadow-[0_0_8px_rgba(59,130,246,0.8)]"
                                    style={{ left: `${(currentTime / duration) * 100 || 0}%` }}
                                />
                            </div>
                        </div>

                        {/* AI Input & Tools */}
                        <div className="flex flex-col gap-3 rounded-3xl border border-border bg-card/90 p-3 shadow-2xl backdrop-blur-2xl">
                            <div className="relative">
                                <Input
                                    placeholder="Describe what you want to do with your video"
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    className="h-auto w-full rounded-2xl border border-border bg-background/60 py-7 pl-4 pr-12 text-sm text-foreground placeholder:text-muted-foreground/60 focus:ring-1 focus:ring-blue-500/50"
                                    onKeyDown={(e) => e.key === 'Enter' && handleEdit()}
                                />
                                <div className="pointer-events-none absolute -top-3 left-4 flex items-center gap-1.5 px-2">
                                    <Wand2 className="size-3 text-blue-400" />
                                    <span className="bg-card px-1 text-[10px] font-medium text-blue-400/80">Action</span>
                                </div>
                                <Button
                                    size="icon"
                                    onClick={handleEdit}
                                    disabled={!prompt.trim() || isProcessing}
                                    className="absolute right-3 top-1/2 size-10 -translate-y-1/2 rounded-xl bg-blue-600 shadow-lg transition-transform active:scale-95 hover:bg-blue-500"
                                >
                                    <Send className="size-4" />
                                </Button>
                            </div>
                            <div className="flex items-center justify-between px-2">
                                <div className="flex items-center gap-0.5">
                                    <VideoToolButton icon={Sparkles} label="Magic" active />
                                    <VideoToolButton icon={Play} label="Preview" onClick={togglePlay} />
                                    <VideoToolButton icon={Crop} label="Crop" />
                                    <VideoToolButton icon={Wand2} label="Relight" />
                                    <VideoToolButton icon={Scissors} label="Trim" />
                                    <VideoToolButton icon={Type} label="Text" />
                                    <VideoToolButton icon={Music} label="Audio" />
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="mx-2 h-4 w-px bg-border" />
                                    <VideoToolButton icon={isMuted ? VolumeX : Volume2} onClick={toggleMute} />
                                    <VideoToolButton icon={MoreHorizontal} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
