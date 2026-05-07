'use client';

import { ToolCard } from '@/components/dashboard/ToolCard';
import { CREATOR_TOOL_HIGHLIGHTS } from '@/components/layouts/navigation-data';

export default function CreatorPage() {
    return (
        <div className="min-h-screen bg-background text-foreground pt-8 px-8 max-w-[1600px] mx-auto">
            <h1 className="text-2xl font-semibold mb-2 animate-in fade-in duration-500">Creator Tools</h1>
            <p className="text-muted-foreground mb-8 text-sm animate-in fade-in duration-500 delay-100">Select a tool to start creating</p>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 animate-in fade-in duration-700 delay-200">
                {CREATOR_TOOL_HIGHLIGHTS.map((tool) => (
                    <ToolCard
                        key={tool.label}
                        icon={tool.icon}
                        label={tool.label}
                        href={tool.href}
                        isNew={tool.isNew}
                        color={tool.color}
                    />
                ))}
            </div>
        </div>
    );
}
