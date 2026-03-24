'use client';

import { useState, useEffect } from 'react';
import {
    ChevronDown,
    Sparkles,
    Bookmark,
    Grid3X3,
    Search,
    Loader2
} from 'lucide-react';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { cn } from '@/lib/utils';
import { useGenerationStore } from '@/stores/generation-store';
import { useTemplateStore } from '@/stores/template-store';
import { useCreditStore } from '@/stores/credit-store';

// Mock template data (kept for UI completeness)
const mockTemplates = {
    new: [
        { id: '1', title: 'Create funny Valentine costume', thumbnail: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=400&fit=crop' },
        { id: '2', title: 'Create Valentine photobooth...', thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop' },
        { id: '3', title: 'Create a close-up confession', thumbnail: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=400&fit=crop' },
        { id: '4', title: 'Create a thriller scene', thumbnail: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=400&fit=crop' },
        { id: '5', title: 'Capture an epic wide shot', thumbnail: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=400&fit=crop' },
        { id: '6', title: 'Frame an over-the-shoulder d...', thumbnail: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&h=400&fit=crop' },
    ],
    featured: [
        { id: 'f1', title: 'Turn character into realistic p...', thumbnail: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=400&fit=crop' },
        { id: 'f2', title: 'Turn product image into a ca...', thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop' },
        { id: 'f3', title: 'Create analog-style photos', thumbnail: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&h=400&fit=crop' },
        { id: 'f4', title: 'Swap character', thumbnail: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&h=400&fit=crop' },
        { id: 'f5', title: 'Create cinematic frame', thumbnail: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=400&fit=crop' },
        { id: 'f6', title: 'Reveal scene behind the shot', thumbnail: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&h=400&fit=crop' },
    ],
};

const tabs = ['Image', 'Video', 'Audio', 'Tools'];
const contentTabs = ['Personal', 'Community', 'Templates', 'Tutorials'];

export default function StudioPage() {
    const [activeTab, setActiveTab] = useState('Image');
    const [activeContentTab, setActiveContentTab] = useState('Templates');
    const [selectedModel, setSelectedModel] = useState('flux');
    const [prompt, setPrompt] = useState('');

    const { generateImage, isGenerating, currentGeneration, error } = useGenerationStore();
    const { templates, fetchTemplates } = useTemplateStore();
    const { balance, fetchBalance } = useCreditStore();

    useEffect(() => {
        fetchTemplates();
        fetchBalance();
    }, [fetchTemplates, fetchBalance]);

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        await generateImage({
            prompt,
            model: selectedModel,
            aspectRatio: '1:1', // Default
        });
        // Refresh balance after generation (approximate timing)
        setTimeout(() => fetchBalance(), 1000);
        setTimeout(() => fetchBalance(), 3000);
    };

    const displayTemplates = templates.length > 0 ? templates : mockTemplates.new;

    return (
        <div className="min-h-screen bg-background text-foreground flex">
            {/* Left Control Panel */}
            <div className="w-80 border-r border-border flex flex-col shrink-0">
                {/* Tabs */}
                {/* Header - Aligned height h-14 */}
                <div className="h-14 px-6 border-b border-border flex items-center justify-between shrink-0">
                    <h2 className="font-bold text-muted-foreground">Image Generator</h2>
                    <div className="flex items-center gap-2 text-xs font-medium bg-secondary/50 px-3 py-1.5 rounded-full ring-1 ring-border" title="Your Credit Balance">
                        <Sparkles className="w-3 h-3 text-primary" />
                        <span>{balance !== null ? balance : '...'} Credits</span>
                    </div>
                </div>

                {/* Control Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {/* Browse Templates Button */}
                    <button className="flex items-center justify-between w-full px-4 py-3 bg-card rounded-xl border border-border hover:border-border/80 transition-colors group">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-chart-3/20 to-chart-2/20 flex items-center justify-center">
                                <Grid3X3 className="w-5 h-5 text-chart-3" />
                            </div>
                            <span className="text-sm font-medium">Browse templates</span>
                        </div>
                        <Bookmark className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </button>

                    {/* MODEL */}
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Model</h4>
                        <button className="flex items-center justify-between w-full px-4 py-3 bg-card rounded-xl border border-border hover:border-border/80 transition-colors">
                            <div className="flex items-center gap-3">
                                <Sparkles className="w-5 h-5 text-muted-foreground" />
                                <span className="text-sm capitalize">{selectedModel}</span>
                            </div>
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        </button>
                    </div>

                    {/* PROMPT */}
                    <div className="space-y-3 flex-1 flex flex-col">
                        <h4 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Prompt</h4>
                        <div className="bg-card rounded-xl border border-border p-2 flex-1">
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Describe what you want to create..."
                                className="w-full h-40 bg-transparent text-sm placeholder:text-muted-foreground resize-none focus:outline-none p-2"
                            />
                        </div>
                    </div>
                </div>

                {/* Generate Button */}
                <div className="p-4 border-t border-border space-y-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                        <span>Cost:</span>
                        <span className="font-medium text-foreground">1 Credit</span>
                    </div>
                    <Button
                        onClick={handleGenerate}
                        disabled={isGenerating || !prompt.trim() || (balance !== null && balance < 1)}
                        className="w-full h-12 font-semibold rounded-xl gap-2"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                Generate
                                <Sparkles className="w-4 h-4" />
                            </>
                        )}
                    </Button>
                    {error && (
                        <p className="mt-2 text-xs text-destructive text-center">{error}</p>
                    )}
                    {balance !== null && balance < 1 && (
                        <p className="mt-2 text-xs text-destructive text-center">Insufficient credits</p>
                    )}
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="flex-1 overflow-y-auto bg-background">
                {/* Generation Result View */}
                {currentGeneration && (
                    <div className="p-6 pb-0">
                        <h2 className="text-lg font-semibold mb-4">Current Generation</h2>
                        <div className="w-full aspect-[16/9] bg-card rounded-2xl border border-border flex items-center justify-center relative overflow-hidden group">
                            {currentGeneration.status === 'completed' && currentGeneration.resultUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={currentGeneration.resultUrl}
                                    alt={currentGeneration.prompt}
                                    className="w-full h-full object-contain"
                                />
                            ) : (
                                <div className="flex flex-col items-center gap-4">
                                    <div className="relative">
                                        <div className="w-16 h-16 rounded-full border-4 border-muted border-t-primary animate-spin" />
                                        <Sparkles className="w-6 h-6 text-muted-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                    </div>
                                    <p className="text-muted-foreground animate-pulse">
                                        {currentGeneration.status === 'pending' ? 'Queued...' : 'Processing...'}
                                    </p>
                                </div>
                            )}

                            {/* Overlay Info */}
                            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                                <p className="text-white font-medium line-clamp-1">{currentGeneration.prompt}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Content Header */}
                <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md px-6 h-14 flex items-center justify-between border-b border-border">
                    <div className="flex items-center gap-1">
                        {contentTabs.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveContentTab(tab)}
                                className={cn(
                                    "px-4 py-2 text-sm font-medium rounded-full transition-colors flex items-center gap-2",
                                    activeContentTab === tab
                                        ? "bg-accent text-accent-foreground"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Search templates"
                                className="w-56 h-9 pl-10 pr-4"
                            />
                        </div>
                    </div>
                </div>

                {/* Templates Grid */}
                <div className="p-6 space-y-8">
                    {/* New Section */}
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold">New Templates</h2>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {displayTemplates.map((template) => (
                                <TemplateCard key={template.id} template={template} onClick={() => setPrompt(template.title)} />
                            ))}
                        </div>
                    </section>

                    {/* Featured Section */}
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold">Featured</h2>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {mockTemplates.featured.map((template) => (
                                <TemplateCard key={template.id} template={template} onClick={() => setPrompt(template.title)} />
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}

function TemplateCard({ template, onClick }: { template: { id: string; title: string; thumbnail: string }, onClick?: () => void }) {
    return (
        <div className="group cursor-pointer" onClick={onClick}>
            <div className="aspect-[3/4] rounded-xl overflow-hidden bg-card border border-border group-hover:border-border/80 transition-all relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={template.thumbnail}
                    alt={template.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="mt-2 text-xs text-muted-foreground group-hover:text-foreground transition-colors line-clamp-1">
                {template.title}
            </p>
        </div>
    );
}
