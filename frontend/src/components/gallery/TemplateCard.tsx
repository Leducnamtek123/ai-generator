'use client';

import React from 'react';
import { Template, TemplateTypeEnum } from '@/lib/api/templates';
import { Sparkles, Play } from 'lucide-react';
import { Button } from '@/ui/button';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface TemplateCardProps {
    template: Template;
    className?: string;
}

const TOOL_ROUTES: Record<string, string> = {
    [TemplateTypeEnum.IMAGE_GENERATOR]: '/creator/image-generator',
    [TemplateTypeEnum.VIDEO_GENERATOR]: '/creator/video-generator',
    [TemplateTypeEnum.WORKFLOW_EDITOR]: '/creator/workflow-editor',
    [TemplateTypeEnum.DESIGN_EDITOR]: '/creator/image-editor',
    [TemplateTypeEnum.IMAGE_UPSCALER]: '/creator/image-upscaler',
    [TemplateTypeEnum.VIDEO_UPSCALER]: '/creator/video-generator',
    [TemplateTypeEnum.MUSIC_GENERATOR]: '/creator/music-generator',
    [TemplateTypeEnum.VOICE_GENERATOR]: '/creator/voice-generator',
    'default': '/creator/image-generator'
};

export function TemplateCard({ template, className }: TemplateCardProps) {
    const router = useRouter();

    const handleUseTemplate = (e: React.MouseEvent) => {
        e.stopPropagation();
        const route = TOOL_ROUTES[template.type] || TOOL_ROUTES['default'];
        router.push(`${route}?templateId=${template.id}`);
    };

    const isVideo = template.type.includes('video');
    const isAudio = template.type.includes('music') || template.type.includes('voice') || template.type.includes('sfx');
    const isMedia = isVideo || isAudio;

    return (
        <div className={cn("group flex flex-col gap-2 cursor-pointer", className)}>
            {/* Thumbnail Container */}
            <div className="relative aspect-[16/10] rounded-lg overflow-hidden bg-muted ring-1 ring-border group-hover:ring-border/80 transition-all">
                {template.thumbnail ? (
                    <img
                        src={template.thumbnail}
                        alt={template.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                        <Sparkles className="w-8 h-8 text-muted-foreground/30" />
                    </div>
                )}

                {/* Duration Badge (Top Left) */}
                {isMedia && (
                    <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/50 backdrop-blur-[2px] flex items-center gap-1">
                        <span className="text-[10px] font-medium text-white/90">02:00</span>
                    </div>
                )}

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

                {/* Use Button - Bottom Center */}
                <div className="absolute inset-x-0 bottom-4 flex justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 ease-out z-10">
                    <Button
                        onClick={handleUseTemplate}
                        className="h-8 px-4 rounded-full gap-1.5 text-xs font-semibold shadow-lg"
                    >
                        <Play className="w-3 h-3 fill-current" />
                        Use
                    </Button>
                </div>
            </div>

            {/* Content */}
            <div className="flex flex-col px-0.5">
                <h3 className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors" title={template.title}>
                    {template.title}
                </h3>
                {template.author?.firstName && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                        {template.author.firstName}
                    </p>
                )}
            </div>
        </div>
    );
}
