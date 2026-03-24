'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { GripVertical } from 'lucide-react';

interface ImageComparisonProps {
    before: string;
    after: string;
    className?: string;
}

export function ImageComparison({ before, after, className }: ImageComparisonProps) {
    const [sliderPos, setSliderPos] = useState(50);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleMove = (clientX: number) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
        setSliderPos((x / rect.width) * 100);
    };

    const onMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        handleMove(e.clientX);
    };

    const onTouchStart = (e: React.TouchEvent) => {
        setIsDragging(true);
        handleMove(e.touches[0].clientX);
    };

    useEffect(() => {
        const onMouseMove = (e: MouseEvent) => {
            if (isDragging) handleMove(e.clientX);
        };
        const onTouchMove = (e: TouchEvent) => {
            if (isDragging) handleMove(e.touches[0].clientX);
        };
        const onEnd = () => setIsDragging(false);

        if (isDragging) {
            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onEnd);
            window.addEventListener('touchmove', onTouchMove);
            window.addEventListener('touchend', onEnd);
        }

        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onEnd);
            window.removeEventListener('touchmove', onTouchMove);
            window.removeEventListener('touchend', onEnd);
        };
    }, [isDragging]);

    return (
        <div
            ref={containerRef}
            className={cn("relative overflow-hidden select-none cursor-ew-resize", className)}
            onMouseDown={onMouseDown}
            onTouchStart={onTouchStart}
        >
            {/* After Image - base layer */}
            <img
                src={after}
                alt="After"
                className="absolute inset-0 w-full h-full object-contain"
                draggable={false}
            />

            {/* Before Image - clipped layer */}
            <div
                className="absolute inset-0 overflow-hidden"
                style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
            >
                <img
                    src={before}
                    alt="Before"
                    className="absolute inset-0 w-full h-full object-contain"
                    draggable={false}
                />
            </div>

            {/* Slider Line */}
            <div
                className="absolute top-0 bottom-0 w-0.5 bg-white z-10"
                style={{ left: `${sliderPos}%` }}
            >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center">
                    <GripVertical className="w-5 h-5 text-black" />
                </div>
            </div>
        </div>
    );
}

