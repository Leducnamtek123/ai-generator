'use client';

import { useState, useEffect } from 'react';
import {
    ChevronDown,
    Plus,
    Upload,
    Sparkles,
    User,
    Globe,
    Image as ImageIcon,
    Bookmark,
    Grid3X3,
    Search,
    ArrowRight,
    Loader2
} from 'lucide-react';
import { Button } from '@/ui/button';
import { cn } from '@/lib/utils';
import { useGenerationStore } from '@/stores/generation-store';
import { useTemplateStore } from '@/stores/template-store';

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

    useEffect(() => {
        fetchTemplates();
    }, [fetchTemplates]);

    const handleGenerate = () => {
        if (!prompt.trim()) return;
        generateImage({
            prompt,
            model: selectedModel,
            aspectRatio: '1:1', // Default
        });
    };

    const displayTemplates = templates.length > 0 ? templates : mockTemplates.new;

    return (
        <div className="min-h-screen bg-[#0B0C0E] text-white flex">
            {/* Left Control Panel */}
            <div className="w-80 border-r border-white/5 flex flex-col shrink-0">
                {/* Tabs */}
                <div className="flex border-b border-white/5">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "flex-1 py-3 text-sm font-medium transition-colors border-b-2 -mb-px",
                                activeTab === tab
                                    ? "text-white border-white"
                                    : "text-white/40 border-transparent hover:text-white/60"
                            )}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Control Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {/* Browse Templates Button */}
                    <button className="flex items-center justify-between w-full px-4 py-3 bg-[#151619] rounded-xl border border-white/5 hover:border-white/10 transition-colors group">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500/20 to-pink-500/20 flex items-center justify-center">
                                <Grid3X3 className="w-5 h-5 text-orange-400" />
                            </div>
                            <span className="text-sm font-medium">Browse templates</span>
                        </div>
                        <Bookmark className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
                    </button>

                    {/* MODEL */}
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-medium text-white/40 uppercase tracking-wider">Model</h4>
                        <button className="flex items-center justify-between w-full px-4 py-3 bg-[#151619] rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                            <div className="flex items-center gap-3">
                                <Sparkles className="w-5 h-5 text-white/60" />
                                <span className="text-sm capitalize">{selectedModel}</span>
                            </div>
                            <ChevronDown className="w-4 h-4 text-white/40" />
                        </button>
                    </div>

                    {/* PROMPT */}
                    <div className="space-y-3 flex-1 flex flex-col">
                        <h4 className="text-[10px] font-medium text-white/40 uppercase tracking-wider">Prompt</h4>
                        <div className="bg-[#151619] rounded-xl border border-white/5 p-2 flex-1">
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Describe what you want to create..."
                                className="w-full h-40 bg-transparent text-sm text-white placeholder:text-white/20 resize-none focus:outline-none p-2"
                            />
                        </div>
                    </div>
                </div>

                {/* Generate Button */}
                <div className="p-4 border-t border-white/5">
                    <Button
                        onClick={handleGenerate}
                        disabled={isGenerating || !prompt.trim()}
                        className={cn(
                            "w-full h-12 text-white font-semibold rounded-xl gap-2 transition-all",
                            isGenerating ? "bg-blue-600/50 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                        )}
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
                        <p className="mt-2 text-xs text-red-500 text-center">{error}</p>
                    )}
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="flex-1 overflow-y-auto bg-[#0B0C0E]">
                {/* Generation Result View */}
                {currentGeneration && (
                    <div className="p-6 pb-0">
                        <h2 className="text-lg font-semibold mb-4">Current Generation</h2>
                        <div className="w-full aspect-[16/9] bg-[#151619] rounded-2xl border border-white/10 flex items-center justify-center relative overflow-hidden group">
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
                                        <div className="w-16 h-16 rounded-full border-4 border-white/10 border-t-blue-500 animate-spin" />
                                        <Sparkles className="w-6 h-6 text-white/40 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                    </div>
                                    <p className="text-white/40 animate-pulse">
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

                {/* Content Header (Visible below result or if no result) */}
                <div className="sticky top-0 z-10 bg-[#0B0C0E]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-white/5">
                    <div className="flex items-center gap-1">
                        {contentTabs.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveContentTab(tab)}
                                className={cn(
                                    "px-4 py-2 text-sm font-medium rounded-full transition-colors flex items-center gap-2",
                                    activeContentTab === tab
                                        ? "bg-white/10 text-white"
                                        : "text-white/40 hover:text-white/60"
                                )}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                            <input
                                type="text"
                                placeholder="Search templates"
                                className="w-56 h-9 pl-10 pr-4 bg-[#151619] border border-white/5 rounded-lg text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-white/20"
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
            <div className="aspect-[3/4] rounded-xl overflow-hidden bg-[#151619] border border-white/5 group-hover:border-white/20 transition-all relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={template.thumbnail}
                    alt={template.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="mt-2 text-xs text-white/60 group-hover:text-white transition-colors line-clamp-1">
                {template.title}
            </p>
        </div>
    );
}
