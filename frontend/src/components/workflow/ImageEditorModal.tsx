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
            <DialogContent className="z-[100] m-0 flex h-screen w-screen max-w-[100vw] flex-col gap-0 border-none bg-background/95 p-0">
                <DialogHeader className="flex h-14 flex-row items-center justify-between border-b border-border bg-card/80 px-6 gap-y-0">
                    <DialogTitle className="text-sm font-medium text-foreground">Image Editor</DialogTitle>
                </DialogHeader>

                {/* Main Canvas */}
                <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-background p-8">
                    {/* Image Container */}
                    <div className="relative w-full max-w-5xl h-[80vh] shadow-2xl">
                        <Image
                            src={imageUrl}
                            alt="Editing"
                            fill
                            className="object-contain rounded-lg border border-border"
                            sizes="100vw"
                        />

                        {/* Processing Overlay */}
                        {isProcessing && (
                            <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-background/70 backdrop-blur-sm">
                                <div className="flex flex-col items-center gap-3">
                                    <Wand2 className="size-8 text-blue-500 animate-pulse" />
                                    <span className="text-sm font-medium text-foreground">Generating details?</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Bottom Floating Bar (Freepik style) */}
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-xl">
                        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card/90 p-3 shadow-2xl backdrop-blur-xl">
                            {/* Prompt Input */}
                            <div className="relative">
                                <Input
                                    placeholder="What do you want to change?"
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    className="h-auto w-full rounded-xl border border-border bg-background/60 py-6 pl-4 pr-12 text-sm text-foreground placeholder:text-muted-foreground/60 focus:ring-1 focus:ring-blue-500/50"
                                    onKeyDown={(e) => e.key === 'Enter' && handleEdit()}
                                />
                                <Button
                                    size="icon"
                                    onClick={handleEdit}
                                    disabled={!prompt.trim() || isProcessing}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 size-9 bg-blue-600 hover:bg-blue-500 rounded-lg"
                                >
                                    <Send className="size-4" />
                                </Button>
                            </div>

                            {/* Tools */}
                            <div className="flex items-center gap-1 justify-between px-1">
                                <div className="flex items-center gap-1">
                                    <ToolButton icon={Wand2} label="Inpaint" active />
                                    <ToolButton icon={Eraser} label="Remove" />
                                    <ToolButton icon={Crop} label="Crop" />
                                </div>
                                <div className="mx-2 h-4 w-px bg-border" />
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

function ToolButton({ icon: Icon, label, active, onClick }: { icon: React.ComponentType<{ className?: string }>; label?: string; active?: boolean; onClick?: () => void }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                active ? "bg-blue-500/10 text-blue-500" : "hover:bg-accent text-muted-foreground hover:text-foreground"
            )}
        >
            <Icon className="size-3.5" />
            {label && <span>{label}</span>}
        </button>
    );
}
