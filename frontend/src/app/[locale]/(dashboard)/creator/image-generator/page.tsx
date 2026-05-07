'use client';

import Image from 'next/image';
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
import { formatCredits } from '@/lib/format-credits';
import { CONTENT_TABS, IMAGE_GENERATOR_PRESET_TEMPLATES } from '@/components/layouts/navigation-data';
import { TemplateTypeEnum } from '@/lib/api/templates';

type GalleryListing = {
    id: string;
    title: string;
    thumbnail: string;
};

type GeneratedCardData = {
    prompt: string;
    resultUrl?: string;
};

export default function StudioPage() {
    const [activeContentTab, setActiveContentTab] = useState<string>(CONTENT_TABS[2]);
    const [selectedModel] = useState('flux');
    const [prompt, setPrompt] = useState('');
    const [communityListings, setCommunityListings] = useState<GalleryListing[]>([]);
    const [isCommunityLoading, setIsCommunityLoading] = useState(false);

    const { generateImage, isGenerating, currentGeneration, error, generations, fetchGenerations, isLoading: isGenerationsLoading } = useGenerationStore();
    const { templates, fetchTemplates, isLoading: isTemplatesLoading } = useTemplateStore();
    const { balance, fetchBalance } = useCreditStore();

    useEffect(() => {
        fetchBalance();
    }, [fetchBalance]);

    useEffect(() => {
        if (activeContentTab === CONTENT_TABS[0]) { // Personal
            fetchGenerations({ type: TemplateTypeEnum.IMAGE_GENERATOR, limit: 20 });
        } else if (activeContentTab === CONTENT_TABS[1]) { // Community
            const fetchCommunity = async () => {
                setIsCommunityLoading(true);
                try {
                    const res = await import('@/lib/api').then((m) => m.get<{ data: GalleryListing[] }>(`/community-marketplace/listings?type=${TemplateTypeEnum.IMAGE_GENERATOR}&limit=20`));
                    setCommunityListings(res.data || []);
                } catch (err) {
                    console.error('Failed to fetch community listings', err);
                } finally {
                    setIsCommunityLoading(false);
                }
            };
            fetchCommunity();
        } else if (activeContentTab === CONTENT_TABS[2]) { // Templates
            fetchTemplates(TemplateTypeEnum.IMAGE_GENERATOR);
        }
    }, [activeContentTab, fetchGenerations, fetchTemplates]);

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

    const displayTemplates = templates.length > 0 ? templates : IMAGE_GENERATOR_PRESET_TEMPLATES.new;
    const featuredTemplates = templates.length > 0 ? templates.slice(0, 6) : IMAGE_GENERATOR_PRESET_TEMPLATES.featured;

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
                        <span>{formatCredits(balance)} Credits</span>
                    </div>
                </div>

                {/* Control Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {/* Browse Templates Button */}
                    <button 
                        onClick={() => setActiveContentTab(CONTENT_TABS[2])}
                        className="flex items-center justify-between w-full px-4 py-3 bg-card rounded-xl border border-border hover:border-border/80 transition-colors group"
                    >
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
            <div className="flex-1 overflow-y-auto bg-background flex flex-col">
                {/* Generation Result View */}
                {currentGeneration && (
                    <div className="p-6 pb-0">
                        <h2 className="text-lg font-semibold mb-4">Current Generation</h2>
                        <div className="w-full aspect-[16/9] bg-card rounded-2xl border border-border flex items-center justify-center relative overflow-hidden group">
                            {currentGeneration.status === 'completed' && currentGeneration.resultUrl ? (
                                <Image
                                    src={currentGeneration.resultUrl}
                                    alt={currentGeneration.prompt}
                                    fill
                                    className="object-contain"
                                    sizes="(max-width: 1024px) 100vw, 50vw"
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
                        {CONTENT_TABS.map((tab) => (
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
                                placeholder="Search"
                                className="w-56 h-9 pl-10 pr-4"
                            />
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="p-6 flex-1">
                    {activeContentTab === CONTENT_TABS[0] && ( // Personal
                        <section className="space-y-6">
                            <h2 className="text-lg font-semibold">Your History</h2>
                            {isGenerationsLoading ? (
                                <LoadingGrid />
                            ) : generations.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                    {generations.map((gen) => (
                                        <GenerationCard key={gen.id} generation={gen} />
                                    ))}
                                </div>
                            ) : (
                                <EmptyState message="No generations yet. Start creating!" />
                            )}
                        </section>
                    )}

                    {activeContentTab === CONTENT_TABS[1] && ( // Community
                        <section className="space-y-6">
                            <h2 className="text-lg font-semibold">Community Creations</h2>
                            {isCommunityLoading ? (
                                <LoadingGrid />
                            ) : communityListings.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                    {communityListings.map((listing) => (
                                        <TemplateCard key={listing.id} template={listing} onClick={() => setPrompt(listing.title)} />
                                    ))}
                                </div>
                            ) : (
                                <EmptyState message="Community is quiet today." />
                            )}
                        </section>
                    )}

                    {activeContentTab === CONTENT_TABS[2] && ( // Templates
                        <div className="space-y-8">
                            <section>
                                <h2 className="text-lg font-semibold mb-4">New Templates</h2>
                                {isTemplatesLoading ? (
                                    <LoadingGrid />
                                ) : (
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                        {displayTemplates.map((template) => (
                                            <TemplateCard key={template.id} template={template} onClick={() => setPrompt(template.title)} />
                                        ))}
                                    </div>
                                )}
                            </section>

                            <section>
                                <h2 className="text-lg font-semibold mb-4">Featured</h2>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                    {featuredTemplates.map((template) => (
                                        <TemplateCard key={template.id} template={template} onClick={() => setPrompt(template.title)} />
                                    ))}
                                </div>
                            </section>
                        </div>
                    )}

                    {activeContentTab === CONTENT_TABS[3] && ( // Tutorials
                        <section className="space-y-6">
                            <h2 className="text-lg font-semibold">Tutorials & Help</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="rounded-2xl bg-card border border-border p-6 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold">Quick start</h3>
                                        <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">3 steps</span>
                                    </div>
                                    <ol className="space-y-3 text-sm text-muted-foreground">
                                        <li className="flex gap-3">
                                            <span className="font-semibold text-foreground">1.</span>
                                            Pick a template or start from a blank prompt.
                                        </li>
                                        <li className="flex gap-3">
                                            <span className="font-semibold text-foreground">2.</span>
                                            Add style, model, and aspect-ratio details.
                                        </li>
                                        <li className="flex gap-3">
                                            <span className="font-semibold text-foreground">3.</span>
                                            Generate, review the result, then save it to your library.
                                        </li>
                                    </ol>
                                </div>
                                <div className="rounded-2xl bg-card border border-border p-6 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold">Production tips</h3>
                                        <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Best practice</span>
                                    </div>
                                    <ul className="space-y-3 text-sm text-muted-foreground">
                                        <li>Use a specific subject, lighting, and composition to reduce retries.</li>
                                        <li>Keep the prompt focused and use negative prompts for unwanted artifacts.</li>
                                        <li>Review generations in Personal, then promote the best ones to Community or Templates.</li>
                                    </ul>
                                </div>
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
}

function LoadingGrid() {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="aspect-[3/4] rounded-xl bg-muted animate-pulse" />
            ))}
        </div>
    );
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-muted-foreground/30" />
            </div>
            <p className="text-muted-foreground">{message}</p>
        </div>
    );
}

function GenerationCard({ generation }: { generation: GeneratedCardData }) {
    return (
        <div className="group text-left">
            <div className="aspect-[3/4] rounded-xl overflow-hidden bg-card border border-border group-hover:border-border/80 transition-all relative">
                {generation.resultUrl ? (
                    <Image
                        src={generation.resultUrl}
                        alt={generation.prompt}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                        sizes="(max-width: 1024px) 100vw, 20vw"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-950/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="mt-2 text-xs text-muted-foreground group-hover:text-foreground transition-colors line-clamp-1">
                {generation.prompt}
            </p>
        </div>
    );
}

function TemplateCard({ template, onClick }: { template: { id: string; title: string; thumbnail: string }, onClick?: () => void }) {
    return (
        <button type="button" className="group text-left cursor-pointer" onClick={onClick}>
            <div className="aspect-[3/4] rounded-xl overflow-hidden bg-card border border-border group-hover:border-border/80 transition-all relative">
                <Image
                    src={template.thumbnail}
                    alt={template.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                    sizes="(max-width: 1024px) 100vw, 20vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-950/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="mt-2 text-xs text-muted-foreground group-hover:text-foreground transition-colors line-clamp-1">
                {template.title}
            </p>
        </button>
    );
}
