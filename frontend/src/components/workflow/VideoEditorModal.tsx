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
        togglePlay, toggleMute, handleTimeUpdate, handleLoadedMetadata, formatTime,
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
            <DialogContent className="max-w-[100vw] w-screen h-screen m-0 p-0 bg-gray-950/95 border-none flex flex-col gap-0 z-[100] outline-none">
                {/* Header */}
                <DialogHeader className="h-14 px-6 flex flex-row items-center justify-between border-b border-white/5 bg-[#0F1014] space-y-0">
                    <div className="flex items-center gap-4">
                        <button onClick={onClose} className="p-1 hover:bg-white/5 rounded-lg text-white/60 hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                        <DialogTitle className="text-sm font-medium text-white">Clip Editor</DialogTitle>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={onClose} className="text-white/60 hover:text-white">Cancel</Button>
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-500">Save Changes</Button>
                    </div>
                </DialogHeader>

                {/* Video Area */}
                <div className="flex-1 relative flex flex-col items-center justify-center p-8 overflow-hidden bg-[#050505]">
                    <div className="relative w-full max-w-4xl aspect-video bg-gray-950 rounded-xl overflow-hidden shadow-2xl border border-white/5 flex items-center justify-center group">
                        <video
                            ref={videoRef}
                            src={videoUrl}
                            className="max-w-full max-h-full object-contain"
                            muted={isMuted}
                            onTimeUpdate={handleTimeUpdate}
                            onLoadedMetadata={handleLoadedMetadata}
                            onClick={togglePlay}
                            loop
                        />

                        {/* Play Overlay */}
                        {!isPlaying && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-950/20 pointer-events-none">
                                <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                                    <Play className="w-8 h-8 text-white fill-white ml-1" />
                                </div>
                            </div>
                        )}

                        {/* Processing Overlay */}
                        {isProcessing && (
                            <div className="absolute inset-0 bg-gray-950/60 backdrop-blur-md flex items-center justify-center z-20">
                                <div className="flex flex-col items-center gap-4 text-center">
                                    <div className="relative">
                                        <Wand2 className="w-12 h-12 text-blue-500 animate-[pulse_1.5s_ease-in-out_infinite]" />
                                        <div className="absolute -inset-4 border-2 border-blue-500/20 rounded-full animate-[ping_2s_linear_infinite]" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-semibold text-lg">AI Video Processing</h3>
                                        <p className="text-white/40 text-sm mt-1 max-w-xs">Enhancing lighting, atmosphere, and textures...</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Timeline & Controls */}
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-3xl flex flex-col gap-4">
                        {/* Range/Timeline */}
                        <div className="bg-[#151619]/90 border border-white/10 rounded-2xl p-4 backdrop-blur-xl">
                            <div className="flex items-center justify-between mb-3 px-1">
                                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Range selected</span>
                                <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">{formatTime(duration)}</span>
                            </div>
                            <div className="h-10 w-full bg-gray-950/40 rounded-lg relative overflow-hidden border border-white/5 flex gap-1 p-1">
                                {Array.from({ length: 12 }).map((_, i) => (
                                    <div key={i} className="flex-1 h-full bg-white/5 rounded-sm overflow-hidden border border-white/5 relative">
                                        <Image src={videoUrl} alt="" fill className="object-cover opacity-30 blur-[1px]" sizes="8vw" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-gray-950/40 to-transparent" />
                                    </div>
                                ))}
                                <div className="absolute top-0 bottom-0 left-[10%] right-[10%] border-2 border-white rounded-lg z-10">
                                    <div className="absolute top-1/2 -translate-y-1/2 -left-1 w-2 h-4 bg-white rounded-sm cursor-col-resize" />
                                    <div className="absolute top-1/2 -translate-y-1/2 -right-1 w-2 h-4 bg-white rounded-sm cursor-col-resize" />
                                </div>
                                <div
                                    className="absolute top-0 bottom-0 w-0.5 bg-blue-500 z-20 shadow-[0_0_8px_rgba(59,130,246,0.8)]"
                                    style={{ left: `${(currentTime / duration) * 100 || 0}%` }}
                                />
                            </div>
                        </div>

                        {/* AI Input & Tools */}
                        <div className="bg-[#1A1B1F]/90 border border-white/10 rounded-3xl shadow-2xl p-3 flex flex-col gap-3 backdrop-blur-2xl">
                            <div className="relative">
                                <Input
                                    placeholder="Describe what you want to do with your video"
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    className="w-full bg-gray-950/30 border border-white/5 rounded-2xl pl-4 pr-12 py-7 text-sm text-white focus:ring-1 focus:ring-blue-500/50 placeholder:text-white/20 h-auto"
                                    onKeyDown={(e) => e.key === 'Enter' && handleEdit()}
                                />
                                <div className="absolute left-4 -top-3 px-2 flex items-center gap-1.5 pointer-events-none">
                                    <Wand2 className="w-3 h-3 text-blue-400" />
                                    <span className="text-[10px] font-bold text-blue-400/80 uppercase tracking-widest bg-[#1A1B1F] px-1">AI Action</span>
                                </div>
                                <Button
                                    size="icon"
                                    onClick={handleEdit}
                                    disabled={!prompt.trim() || isProcessing}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg transition-transform active:scale-95"
                                >
                                    <Send className="w-4 h-4" />
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
                                    <div className="h-4 w-px bg-white/10 mx-2" />
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
