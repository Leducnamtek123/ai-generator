'use client';

import Image from 'next/image';
import React, { useState } from 'react';
import { X, Undo2, Redo2, Trash2, Maximize2, MoveHorizontal, Settings2, ArrowUp, Eraser, PenLine, Paperclip, ChevronDown, Check } from 'lucide-react';
import { Button } from '@/ui/button';
import { cn } from '@/lib/utils';
import { GalleryItem } from '@/types/gallery';

interface ImageEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    image: GalleryItem | null;
}

export function ImageEditorModal({ isOpen, onClose, image }: ImageEditorModalProps) {
    const [brushSize, setBrushSize] = useState(20);
    const [mode, setMode] = useState<'replace' | 'erase'>('replace');

    if (!isOpen || !image) return null;

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#0B0C0E] animate-in fade-in duration-200">
            {/* Top Bar */}
            <div className="h-14 flex items-center justify-between px-4 border-b border-white/5 bg-[#0B0C0E]">
                <div className="text-sm font-semibold text-white">Edit image</div>

                {/* Center Controls */}
                <div className="flex items-center gap-1 bg-[#151619] rounded-lg p-1 border border-white/5">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-white/60 hover:text-white rounded-md">
                        <Undo2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-white/60 hover:text-white rounded-md">
                        <Redo2 className="w-4 h-4" />
                    </Button>
                    <div className="w-px h-4 bg-white/10 mx-1" />
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-white/60 hover:text-white rounded-md">
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>

                {/* Right Controls */}
                <div className="flex items-center gap-2">
                    <Button variant="ghost" className="h-8 text-xs text-white/60 hover:text-white gap-2">
                        <Maximize2 className="w-3 h-3" />
                        Images
                        <ChevronDown className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-white/60 hover:text-white" onClick={onClose}>
                        <X className="w-5 h-5" />
                    </Button>
                </div>
            </div>

            {/* Main Canvas Area */}
            <div className="flex-1 relative flex items-center justify-center bg-[#070809] overflow-hidden p-8">
                <div className="relative max-h-full max-w-full aspect-[4/3] shadow-2xl rounded-sm overflow-hidden border border-white/5 group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <Image
                        src={image.url}
                        alt="Editing"
                        fill
                        className="object-contain"
                        sizes="100vw"
                    />

                    {/* Mock Pink Brush Overlay (static for visual) */}
                    <div className="absolute inset-0 pointer-events-none opacity-80 mix-blend-screen">
                        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <path
                                d="M 40,30 Q 50,10 60,30 T 40,50"
                                stroke="#FF69B4"
                                strokeWidth="2"
                                fill="rgba(255, 105, 180, 0.2)"
                                className="animate-in fade-in duration-700"
                            />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Bottom Floating Bar */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4">
                <div className="bg-[#151619] border border-white/10 rounded-2xl shadow-2xl p-3 space-y-3">
                    {/* Input Area */}
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Draw a selection and describe what you want to change"
                            className="w-full bg-transparent border-none outline-none text-sm text-white placeholder:text-white/40 h-10 px-2"
                        />
                    </div>

                    {/* Controls Row */}
                    <div className="flex items-center justify-between pt-2 border-t border-white/5">

                        {/* Mode & Brush */}
                        <div className="flex items-center gap-4">
                            <div className="flex bg-[#0B0C0E] rounded-lg p-0.5 border border-white/5">
                                <button
                                    onClick={() => setMode('replace')}
                                    className={cn(
                                        "px-3 py-1.5 rounded-md text-[10px] font-medium transition-colors flex items-center gap-1.5",
                                        mode === 'replace' ? "bg-white/10 text-white" : "text-white/40 hover:text-white hover:bg-white/5"
                                    )}
                                >
                                    <PenLine className="w-3 h-3" />
                                    Replace
                                </button>
                                <button
                                    onClick={() => setMode('erase')}
                                    className={cn(
                                        "px-3 py-1.5 rounded-md text-[10px] font-medium transition-colors flex items-center gap-1.5",
                                        mode === 'erase' ? "bg-white/10 text-white" : "text-white/40 hover:text-white hover:bg-white/5"
                                    )}
                                >
                                    <Eraser className="w-3 h-3" />
                                    Erase
                                </button>
                            </div>

                            <div className="h-6 w-px bg-white/10" />

                            {/* Brush Size Slider */}
                            <div className="flex items-center gap-2 group">
                                <div className="w-2 h-2 rounded-full bg-white/40" />
                                <input
                                    type="range"
                                    min="1"
                                    max="100"
                                    value={brushSize}
                                    onChange={(e) => setBrushSize(parseInt(e.target.value))}
                                    className="w-24 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500"
                                />
                                <span className="text-[10px] text-white/40 w-4">{brushSize}</span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-white/40 hover:text-white rounded-full">
                                <Paperclip className="w-4 h-4" />
                            </Button>
                            <div className="h-6 w-px bg-white/10 mx-1" />

                            <div className="flex items-center gap-2">
                                <button className="text-[10px] font-medium text-white/60 hover:text-white flex items-center gap-1">
                                    <Settings2 className="w-3 h-3" />
                                    Auto
                                    <ChevronDown className="w-3 h-3" />
                                </button>

                                <Button size="sm" className="h-8 bg-white text-black hover:bg-white/90 rounded-lg px-3 text-xs font-semibold">
                                    <ArrowUp className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Meta Controls (Bottom Right) */}
                <div className="absolute -bottom-10 right-4 flex items-center gap-4 text-[10px] text-white/40 font-mono">
                    <span>28%</span>
                    <ChevronDown className="w-3 h-3 -ml-3" />
                    <span>2400×1792 px</span>
                </div>
            </div>
        </div>
    );
}
