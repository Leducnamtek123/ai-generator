import React from 'react';
import { cn } from '@/lib/utils';
import { Play } from 'lucide-react';

interface GettingStartedCardProps {
    title: string;
    description?: string;
    image: string;
    color?: string;
    fullWidth?: boolean;
}

export function GettingStartedCard({ title, description, image, color = "bg-card", fullWidth }: GettingStartedCardProps) {
    return (
        <div className={cn(
            "group relative rounded-2xl overflow-hidden cursor-pointer border border-border",
            fullWidth ? "col-span-2 aspect-[2/1]" : "aspect-[16/9]"
        )}>
            {/* Background Image */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={image}
                alt={title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />

            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-90" />

            {/* Content */}
            <div className="absolute inset-0 p-6 flex flex-col justify-end items-start">
                <div className="bg-foreground/10 backdrop-blur-md rounded-full w-12 h-12 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Play className="w-5 h-5 fill-white text-white ml-1" />
                </div>

                <p className="text-xs font-medium text-white/70 mb-1">Tutorials</p>
                <h3 className="text-2xl font-semibold text-white mb-1">{title}</h3>
                {description && <p className="text-sm text-white/60 line-clamp-2">{description}</p>}
            </div>
        </div>
    );
}
