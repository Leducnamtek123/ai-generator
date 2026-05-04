'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { X, Send, Wand2, Eraser, Crop, Maximize2, MoreHorizontal } from 'lucide-react';

import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/ui/dialog';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';


interface ImageEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    imageUrl: string;
    onSave?: (newUrl: string) => void;
}

export function ImageEditorModal({ isOpen, onClose, imageUrl, onSave }: ImageEditorModalProps) {
    const [prompt, setPrompt] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    if (!isOpen) return null;

    const handleEdit = async () => {
        if (!prompt.trim()) return;
        setIsProcessing(true);
        // Simulate edit
        await new Promise(r => setTimeout(r, 2000));
        setIsProcessing(false);
        setPrompt('');
        toast.success("Edit simulation: Image would be updated based on prompt.");
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[100vw] w-screen h-screen m-0 p-0 bg-gray-950/95 border-none flex flex-col gap-0 z-[100]">
                <DialogHeader className="h-14 px-6 flex flex-row items-center justify-between border-b border-white/5 bg-[#0F1014] space-y-0">
                    <DialogTitle className="text-sm font-medium text-white">Image Editor</DialogTitle>
                </DialogHeader>

                {/* Main Canvas */}
                <div className="flex-1 relative flex items-center justify-center p-8 overflow-hidden bg-[#050505]">
                    {/* Image Container */}
                    <div className="relative w-full max-w-5xl h-[80vh] shadow-2xl">
                        <Image
                            src={imageUrl}
                            alt="Editing"
                            fill
                            className="object-contain rounded-lg border border-white/5"
                            sizes="100vw"
                        />

                        {/* Processing Overlay */}
                        {isProcessing && (
                            <div className="absolute inset-0 bg-gray-950/50 backdrop-blur-sm flex items-center justify-center rounded-lg">
                                <div className="flex flex-col items-center gap-3">
                                    <Wand2 className="w-8 h-8 text-blue-500 animate-pulse" />
                                    <span className="text-sm text-white font-medium">Generating details...</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Bottom Floating Bar (Freepik style) */}
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-xl">
                        <div className="bg-[#1A1B1F] border border-white/10 rounded-2xl shadow-2xl p-3 flex flex-col gap-3 backdrop-blur-xl">
                            {/* Prompt Input */}
                            <div className="relative">
                                <Input
                                    placeholder="What do you want to change?"
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    className="w-full bg-gray-950/30 border border-white/5 rounded-xl pl-4 pr-12 py-6 text-sm text-white focus:ring-1 focus:ring-blue-500/50 placeholder:text-white/30 h-auto"
                                    onKeyDown={(e) => e.key === 'Enter' && handleEdit()}
                                />
                                <Button
                                    size="icon"
                                    onClick={handleEdit}
                                    disabled={!prompt.trim() || isProcessing}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 bg-blue-600 hover:bg-blue-500 rounded-lg"
                                >
                                    <Send className="w-4 h-4" />
                                </Button>
                            </div>

                            {/* Tools */}
                            <div className="flex items-center gap-1 justify-between px-1">
                                <div className="flex items-center gap-1">
                                    <ToolButton icon={Wand2} label="Inpaint" active />
                                    <ToolButton icon={Eraser} label="Remove" />
                                    <ToolButton icon={Crop} label="Crop" />
                                </div>
                                <div className="w-px h-4 bg-white/10 mx-2" />
                                <div className="flex items-center gap-1">
                                    <ToolButton icon={Maximize2} label="Upscale" />
                                    <ToolButton icon={MoreHorizontal} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function ToolButton({ icon: Icon, label, active, onClick }: { icon: any, label?: string, active?: boolean, onClick?: () => void }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                active ? "bg-blue-500/10 text-blue-400" : "hover:bg-white/5 text-white/60 hover:text-white"
            )}
        >
            <Icon className="w-3.5 h-3.5" />
            {label && <span>{label}</span>}
        </button>
    );
}
