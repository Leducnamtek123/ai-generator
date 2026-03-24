'use client';

import { Search, Image as ImageIcon, Video, Sparkles, LayoutGrid, Wand2, Music, Box } from 'lucide-react';
import { ToolCard } from '@/components/dashboard/ToolCard';

export default function CreatorPage() {
    return (
        <div className="min-h-screen bg-background text-foreground pt-8 px-8 max-w-[1600px] mx-auto">
            <h1 className="text-2xl font-semibold mb-2 animate-in fade-in duration-500">Creator Tools</h1>
            <p className="text-muted-foreground mb-8 text-sm animate-in fade-in duration-500 delay-100">Select a tool to start creating</p>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 animate-in fade-in duration-700 delay-200">
                <ToolCard icon={LayoutGrid} label="Spaces" href="/creator/workflow-editor" isNew color="text-chart-1" />
                <ToolCard icon={ImageIcon} label="Image Gen" href="/creator/image-generator" color="text-chart-2" />
                <ToolCard icon={Video} label="Video Gen" href="/creator/video-generator" color="text-chart-3" />
                <ToolCard icon={Wand2} label="Editor" href="/creator/image-editor" />
                <ToolCard icon={Sparkles} label="Upscaler" href="/creator/image-upscaler" color="text-chart-4" />
                <ToolCard icon={Music} label="Audio" href="/creator/music-generator" />
                {/* Add more tools as needed to match routes in creator folder */}
                <ToolCard icon={Search} label="Find assets" href="/stock" />
                <ToolCard icon={Box} label="3D Models" href="/stock" />
            </div>
        </div>
    );
}
