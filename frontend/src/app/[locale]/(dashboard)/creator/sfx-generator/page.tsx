'use client';

import { useReducer, useEffect, useState } from 'react';
import { useGenerationStore } from '@/stores/generation-store';
import { useTemplateStore } from '@/stores/template-store';
import { TemplateTypeEnum } from '@/lib/api/templates';
import { CONTENT_TABS, COMMUNITY_TAB, TEMPLATES_TAB } from '@/components/layouts/navigation-data';
import { Zap, Download, Loader2, Play, Pause, Folder, Leaf, Cog, Bomb, User, Smartphone, Rocket, Waves, Music2, Search, Sparkles } from 'lucide-react';
import { Button } from '@/ui/button';
import { Slider } from '@/ui/slider';
import { Label } from '@/ui/label';
import { Input } from '@/ui/input';
import { cn } from '@/lib/utils';
import Image from 'next/image';

const sfxCategories = [
    { id: 'nature', label: 'Nature', icon: Leaf, examples: ['Rain', 'Thunder', 'Wind', 'Ocean'] },
    { id: 'mechanical', label: 'Mechanical', icon: Cog, examples: ['Engine', 'Click', 'Beep', 'Motor'] },
    { id: 'impact', label: 'Impact', icon: Bomb, examples: ['Explosion', 'Crash', 'Hit', 'Break'] },
    { id: 'human', label: 'Human', icon: User, examples: ['Footsteps', 'Breathing', 'Clap', 'Crowd'] },
    { id: 'ui', label: 'UI/UX', icon: Smartphone, examples: ['Notification', 'Click', 'Swoosh', 'Pop'] },
    { id: 'scifi', label: 'Sci-Fi', icon: Rocket, examples: ['Laser', 'Warp', 'Robot', 'Energy'] },
    { id: 'ambient', label: 'Ambient', icon: Waves, examples: ['City', 'Forest', 'Space', 'Room'] },
    { id: 'musical', label: 'Musical', icon: Music2, examples: ['Stinger', 'Jingle', 'Whoosh', 'Riser'] },
];

const durations = ['0.5s', '1s', '2s', '3s', '5s', '10s', '15s', '30s'];

type SfxState = {
    prompt: string;
    selectedCategory: string | null;
    duration: string;
    variations: number;
    intensity: number;
    playingId: string | null;
    activeContentTab: string;
};

type SfxAction =
    | { type: 'setPrompt'; prompt: string }
    | { type: 'toggleCategory'; categoryId: string }
    | { type: 'setDuration'; duration: string }
    | { type: 'setVariations'; variations: number }
    | { type: 'setIntensity'; intensity: number }
    | { type: 'togglePlaying'; playingId: string }
    | { type: 'setActiveContentTab'; tab: string };

const initialState: SfxState = {
    prompt: '',
    selectedCategory: null,
    duration: '2s',
    variations: 4,
    intensity: 50,
    playingId: null,
    activeContentTab: TEMPLATES_TAB,
};

function reducer(state: SfxState, action: SfxAction): SfxState {
    switch (action.type) {
        case 'setPrompt':
            return { ...state, prompt: action.prompt };
        case 'toggleCategory':
            return {
                ...state,
                selectedCategory: state.selectedCategory === action.categoryId ? null : action.categoryId,
            };
        case 'setDuration':
            return { ...state, duration: action.duration };
        case 'setVariations':
            return { ...state, variations: action.variations };
        case 'setIntensity':
            return { ...state, intensity: action.intensity };
        case 'togglePlaying':
            return { ...state, playingId: state.playingId === action.playingId ? null : action.playingId };
        case 'setActiveContentTab':
            return { ...state, activeContentTab: action.tab };
        default:
            return state;
    }
}

export default function SfxGeneratorPage() {
    const [state, dispatch] = useReducer(reducer, initialState);
    const { generateSfx, currentGeneration, isGenerating, generations, fetchGenerations, isLoading: isGenerationsLoading } = useGenerationStore();
    const { templates, fetchTemplates, isLoading: isTemplatesLoading } = useTemplateStore();
    const [communityListings, setCommunityListings] = useState<any[]>([]);
    const [isCommunityLoading, setIsCommunityLoading] = useState(false);

    useEffect(() => {
        if (state.activeContentTab === CONTENT_TABS[0]) { // Personal
            fetchGenerations({ type: TemplateTypeEnum.SOUND_EFFECT_GENERATOR, limit: 12 });
        } else if (state.activeContentTab === COMMUNITY_TAB) { // Community
            const fetchCommunity = async () => {
                setIsCommunityLoading(true);
                try {
                    const res = await import('@/lib/api').then(m => m.get<{ data: any[] }>(`/community-marketplace/listings?type=${TemplateTypeEnum.SOUND_EFFECT_GENERATOR}&limit=12`));
                    setCommunityListings(res.data || []);
                } catch (err) {
                    console.error('Failed to fetch community listings', err);
                } finally {
                    setIsCommunityLoading(false);
                }
            };
            fetchCommunity();
        } else if (state.activeContentTab === TEMPLATES_TAB) { // Templates
            fetchTemplates(TemplateTypeEnum.SOUND_EFFECT_GENERATOR);
        }
    }, [state.activeContentTab, fetchGenerations, fetchTemplates]);

    const handleGenerate = async () => {
        if (!state.prompt.trim()) return;
        await generateSfx({
            prompt: state.prompt,
            category: state.selectedCategory || undefined,
            duration: parseFloat(state.duration),
        });
    };

    return (
        <div className="h-full bg-background text-foreground flex overflow-hidden">
            <div className="w-[320px] border-r border-border flex flex-col shrink-0 bg-background">
                <div className="h-14 px-6 border-b border-border flex items-center shrink-0">
                    <h2 className="font-bold text-muted-foreground">SFX Generator</h2>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 text-left">
                    <div className="space-y-3 text-left">
                        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Describe the Sound</h4>
                        <div className="bg-card rounded-xl border border-border p-2">
                            <textarea
                                value={state.prompt}
                                onChange={(e) => dispatch({ type: 'setPrompt', prompt: e.target.value })}
                                placeholder="e.g., Heavy rain on a tin roof..."
                                className="w-full h-28 bg-transparent text-sm placeholder:text-muted-foreground resize-none focus:outline-none p-2"
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Category</h4>
                        <div className="grid grid-cols-4 gap-1.5">
                            {sfxCategories.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => {
                                        dispatch({ type: 'toggleCategory', categoryId: cat.id });
                                        if (!state.prompt) dispatch({ type: 'setPrompt', prompt: cat.examples[0] });
                                    }}
                                    className={cn(
                                        'flex flex-col items-center gap-1 p-2 rounded-xl border transition-all',
                                        state.selectedCategory === cat.id ? 'bg-accent border-primary/20' : 'bg-card border-border hover:border-border/80',
                                    )}
                                >
                                    <cat.icon className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-[8px] font-medium">{cat.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Duration</h4>
                        <div className="flex flex-wrap gap-1.5">
                            {durations.map((d) => (
                                <button
                                    key={d}
                                    onClick={() => dispatch({ type: 'setDuration', duration: d })}
                                    className={cn(
                                        'px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all',
                                        state.duration === d ? 'bg-accent border border-primary/20' : 'bg-card border border-border',
                                    )}
                                >
                                    {d}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-border space-y-3">
                    <Button onClick={handleGenerate} disabled={isGenerating || !state.prompt.trim()} className="w-full h-12 font-bold rounded-xl gap-2">
                        {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                        {isGenerating ? 'Generating...' : 'Generate SFX'}
                    </Button>
                </div>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="h-14 px-6 border-b border-border flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                        {CONTENT_TABS.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => dispatch({ type: 'setActiveContentTab', tab })}
                                className={cn(
                                    'px-4 py-2 text-sm font-medium rounded-full transition-colors',
                                    state.activeContentTab === tab ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground',
                                )}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input placeholder="Search" className="w-56 h-9 pl-10 pr-4" />
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {state.activeContentTab === CONTENT_TABS[0] && ( // Personal
                        <section className="space-y-6">
                            <h2 className="text-lg font-semibold text-left">Your History</h2>
                            {isGenerationsLoading ? (
                                <LoadingGrid />
                            ) : generations.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                    {generations.map((gen) => (
                                        <GenerationCard key={gen.id} generation={gen} onPlay={() => dispatch({ type: 'togglePlaying', playingId: gen.id })} isPlaying={state.playingId === gen.id} />
                                    ))}
                                </div>
                            ) : (
                                <EmptyState message="No sound effects yet. Start creating!" />
                            )}
                        </section>
                    )}

                    {state.activeContentTab === COMMUNITY_TAB && ( // Community
                        <section className="space-y-6">
                            <h2 className="text-lg font-semibold text-left">Community SFX</h2>
                            {isCommunityLoading ? (
                                <LoadingGrid />
                            ) : communityListings.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                    {communityListings.map((listing) => (
                                        <TemplateCard key={listing.id} template={listing} />
                                    ))}
                                </div>
                            ) : (
                                <EmptyState message="No community sound effects found." />
                            )}
                        </section>
                    )}

                    {state.activeContentTab === TEMPLATES_TAB && ( // Templates
                        <section className="space-y-6">
                            <h2 className="text-lg font-semibold text-left">SFX Presets</h2>
                            {isTemplatesLoading ? (
                                <LoadingGrid />
                            ) : templates.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                    {templates.map((template) => (
                                        <TemplateCard key={template.id} template={template} onClick={() => dispatch({ type: 'setPrompt', prompt: template.title })} />
                                    ))}
                                </div>
                            ) : (
                                <EmptyState message="No sound effect templates available." />
                            )}
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

function GenerationCard({ generation, onPlay, isPlaying }: { generation: any; onPlay: () => void; isPlaying: boolean }) {
    return (
        <div className="group text-left p-4 bg-card rounded-xl border border-border hover:border-border/80 transition-all relative">
            <div className="flex items-center gap-3">
                <button
                    onClick={onPlay}
                    className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-accent transition-colors shrink-0"
                >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                </button>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{generation.prompt}</p>
                    <p className="text-[10px] text-muted-foreground capitalize">{generation.status}</p>
                </div>
            </div>
        </div>
    );
}

function TemplateCard({ template, onClick }: { template: any; onClick?: () => void }) {
    return (
        <button type="button" className="group text-left cursor-pointer p-4 bg-card rounded-xl border border-border group-hover:border-border/80 transition-all relative w-full" onClick={onClick}>
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <Waves className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{template.title}</p>
                    <p className="text-[10px] text-muted-foreground line-clamp-1">{template.description || 'Sound effect preset'}</p>
                </div>
            </div>
        </button>
    );
}
