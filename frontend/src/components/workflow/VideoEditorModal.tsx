import React, { useState, useRef, useEffect } from 'react';
import {
    X, Send, Wand2, Scissors, Crop, Maximize2,
    MoreHorizontal, Play, Pause, Volume2, VolumeX,
    Zap, Hand, Type, Music, Sparkles
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/ui/dialog';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';

interface VideoEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    videoUrl: string;
    onSave?: (newUrl: string) => void;
}

export function VideoEditorModal({ isOpen, onClose, videoUrl, onSave }: VideoEditorModalProps) {
    const [prompt, setPrompt] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (isOpen && videoRef.current) {
            videoRef.current.currentTime = 0;
            setIsPlaying(false);
        }
    }, [isOpen]);

    const handleTogglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
        }
    };

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration);
        }
    };

    const handleEdit = async () => {
        if (!prompt.trim()) return;
        setIsProcessing(true);
        // Simulate edit
        await new Promise(r => setTimeout(r, 3000));
        setIsProcessing(false);
        setPrompt('');
        toast.success("Video edit simulation: Clip would be processed based on prompt.");
    };

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[100vw] w-screen h-screen m-0 p-0 bg-black/95 border-none flex flex-col gap-0 z-[100] outline-none">
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

                {/* Main Content Area */}
                <div className="flex-1 relative flex flex-col items-center justify-center p-8 overflow-hidden bg-[#050505]">
                    {/* Video Area */}
                    <div className="relative w-full max-w-4xl aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-white/5 flex items-center justify-center group">
                        <video
                            ref={videoRef}
                            src={videoUrl}
                            className="max-w-full max-h-full object-contain"
                            muted={isMuted}
                            onTimeUpdate={handleTimeUpdate}
                            onLoadedMetadata={handleLoadedMetadata}
                            onClick={handleTogglePlay}
                            loop
                        />

                        {/* Play Overlay */}
                        {!isPlaying && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                                <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                                    <Play className="w-8 h-8 text-white fill-white ml-1" />
                                </div>
                            </div>
                        )}

                        {/* Processing Overlay */}
                        {isProcessing && (
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-20">
                                <div className="flex flex-col items-center gap-4 text-center">
                                    <div className="relative">
                                        <Wand2 className="w-12 h-12 text-blue-500 animate-[pulse_1.5s_ease-in-out_infinite]" />
                                        <div className="absolute -inset-4 border-2 border-blue-500/20 rounded-full animate-[ping_2s_linear_infinite]" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-semibold text-lg">AI Video Processing</h3>
                                        <p className="text-white/40 text-sm mt-1 max-w-xs">Enhancing lighting, atmosphere, and textures based on your prompt...</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Premium Plan Overlay (Mockup as seen in screenshot) */}
                        {/* <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
                            <div className="bg-[#1A1B1F]/90 p-8 rounded-3xl border border-white/10 flex flex-col items-center text-center max-w-sm">
                                <div className="w-12 h-12 rounded-2xl bg-yellow-500/20 flex items-center justify-center mb-4">
                                    <Lightning className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Upgrade to Premium</h3>
                                <p className="text-white/50 text-sm mb-6">Continue editing with advanced AI features and higher resolution output.</p>
                                <Button className="bg-white text-black hover:bg-gray-200 rounded-full px-8">See plans</Button>
                            </div>
                        </div> */}
                    </div>

                    {/* Timeline & Controls (Freepik style) */}
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-3xl flex flex-col gap-4">

                        {/* Range/Timeline Visualizer */}
                        <div className="bg-[#151619]/90 border border-white/10 rounded-2xl p-4 backdrop-blur-xl">
                            <div className="flex items-center justify-between mb-3 px-1">
                                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Range selected</span>
                                <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">{formatTime(duration)}</span>
                            </div>

                            {/* Film Strip */}
                            <div className="h-10 w-full bg-black/40 rounded-lg relative overflow-hidden border border-white/5 flex gap-1 p-1">
                                {Array.from({ length: 12 }).map((_, i) => (
                                    <div key={i} className="flex-1 h-full bg-white/5 rounded-sm overflow-hidden border border-white/5 relative">
                                        <img src={videoUrl} alt="" className="w-full h-full object-cover opacity-30 blur-[1px]" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                                    </div>
                                ))}

                                {/* Selected Range Highlight */}
                                <div className="absolute top-0 bottom-0 left-[10%] right-[10%] border-2 border-white rounded-lg z-10">
                                    <div className="absolute top-1/2 -translate-y-1/2 -left-1 w-2 h-4 bg-white rounded-sm cursor-col-resize" />
                                    <div className="absolute top-1/2 -translate-y-1/2 -right-1 w-2 h-4 bg-white rounded-sm cursor-col-resize" />
                                </div>

                                {/* Current Time Indicator */}
                                <div
                                    className="absolute top-0 bottom-0 w-0.5 bg-blue-500 z-20 shadow-[0_0_8px_rgba(59,130,246,0.8)]"
                                    style={{ left: `${(currentTime / duration) * 100 || 0}%` }}
                                />
                            </div>
                        </div>

                        {/* AI Input & Toolbar */}
                        <div className="bg-[#1A1B1F]/90 border border-white/10 rounded-3xl shadow-2xl p-3 flex flex-col gap-3 backdrop-blur-2xl">
                            {/* Prompt Input */}
                            <div className="relative">
                                <Input
                                    placeholder="Describe what you want to do with your video"
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    className="w-full bg-black/30 border border-white/5 rounded-2xl pl-4 pr-12 py-7 text-sm text-white focus:ring-1 focus:ring-blue-500/50 placeholder:text-white/20 h-auto"
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

                            {/* Tools Row (Bottom Strip) */}
                            <div className="flex items-center justify-between px-2">
                                <div className="flex items-center gap-0.5">
                                    <VideoToolButton icon={Sparkles} label="Magic" active />
                                    <VideoToolButton icon={Play} label="Preview" onClick={handleTogglePlay} />
                                    <VideoToolButton icon={Crop} label="Crop" />
                                    <VideoToolButton icon={Wand2} label="Relight" />
                                    <VideoToolButton icon={Scissors} label="Trim" />
                                    <VideoToolButton icon={Type} label="Text" />
                                    <VideoToolButton icon={Music} label="Audio" />
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="h-4 w-px bg-white/10 mx-2" />
                                    <VideoToolButton icon={isMuted ? VolumeX : Volume2} onClick={() => setIsMuted(!isMuted)} />
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

function VideoToolButton({ icon: Icon, label, active, onClick }: { icon: any, label?: string, active?: boolean, onClick?: () => void }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all group",
                active ? "bg-white/10 text-white" : "hover:bg-white/5 text-white/40 hover:text-white"
            )}
        >
            <Icon className={cn("w-4 h-4 transition-transform group-hover:scale-110", active && "scale-110")} />
            {label && <span className="text-[9px] font-medium tracking-tight h-0 opacity-0 group-hover:h-auto group-hover:opacity-100 transition-all">{label}</span>}
        </button>
    );
}
