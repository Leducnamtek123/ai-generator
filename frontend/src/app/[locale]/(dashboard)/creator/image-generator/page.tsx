'use client';

import Image from 'next/image';
import { Suspense, useState, useEffect, useRef, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Sparkles,
    Bookmark,
    Grid3X3,
    Search,
    Loader2,
    Folder
} from 'lucide-react';
import { useInView } from 'react-intersection-observer';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { CreatorWorkspaceShell } from '@/components/layouts/CreatorWorkspaceShell';
import { useGenerationStore } from '@/stores/generation-store';
import { useCreditStore } from '@/stores/credit-store';
import { formatCredits } from '@/lib/format-credits';
import { CONTENT_TABS } from '@/components/layouts/navigation-data';
import { TemplateTypeEnum } from '@/lib/api/templates';
import { useInfiniteTemplates } from '@/hooks/useTemplates';
import { useGenerationProviders } from '@/hooks/useGenerationProviders';
import { mediaApi } from '@/services/mediaApi';
import { projectApi } from '@/services/projectApi';
import { toast } from 'sonner';

type GalleryListing = {
    id: string;
    title: string;
    thumbnail: string;
};

type GeneratedCardData = {
    prompt: string;
    resultUrl?: string;
};

type TemplateFeedItem = {
    id: string;
    title: string;
    description?: string;
    thumbnail?: string;
};

type ImageSnapshot = {
    activeContentTab: string;
    selectedModel: string;
    selectedAspectRatio: string;
    selectedQuality: 'standard' | 'hd' | '4k';
    selectedProvider: string;
    prompt: string;
    negativePrompt: string;
    seed: string;
    referenceImageUrl: string;
    searchQuery: string;
    currentTab: string;
    resultUrl: string | null;
};

type ImageProjectPayload = {
    version: number;
    savedAt: string;
    snapshot: Partial<ImageSnapshot>;
};

const IMAGE_MODELS = [
    { id: 'flux', label: 'Flux' },
    { id: 'flux-schnell', label: 'Flux Schnell' },
    { id: 'sdxl', label: 'SDXL' },
    { id: 'imagen-3', label: 'Imagen 3' },
];

const TEMPLATE_PAGE_SIZE = 12;

const normalizeImageSnapshot = (value: unknown): Partial<ImageSnapshot> => {
    const raw = (value ?? {}) as Record<string, unknown>;
    const snapshot = (raw.snapshot && typeof raw.snapshot === 'object' ? raw.snapshot : raw) as Record<string, unknown>;

    return {
        activeContentTab: typeof snapshot.activeContentTab === 'string' ? snapshot.activeContentTab : CONTENT_TABS[2],
        selectedModel: typeof snapshot.selectedModel === 'string' ? snapshot.selectedModel : IMAGE_MODELS[0].id,
        selectedAspectRatio: typeof snapshot.selectedAspectRatio === 'string' ? snapshot.selectedAspectRatio : '1:1',
        selectedQuality: snapshot.selectedQuality === 'standard' || snapshot.selectedQuality === 'hd' || snapshot.selectedQuality === '4k' ? snapshot.selectedQuality : 'hd',
        selectedProvider: typeof snapshot.selectedProvider === 'string' ? snapshot.selectedProvider : '',
        prompt: typeof snapshot.prompt === 'string' ? snapshot.prompt : '',
        negativePrompt: typeof snapshot.negativePrompt === 'string' ? snapshot.negativePrompt : '',
        seed: typeof snapshot.seed === 'string' ? snapshot.seed : '',
        referenceImageUrl: typeof snapshot.referenceImageUrl === 'string' ? snapshot.referenceImageUrl : '',
        searchQuery: typeof snapshot.searchQuery === 'string' ? snapshot.searchQuery : '',
        currentTab: typeof snapshot.currentTab === 'string' ? snapshot.currentTab : CONTENT_TABS[2],
        resultUrl: typeof snapshot.resultUrl === 'string' ? snapshot.resultUrl : null,
    };
};

export default function StudioPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-background text-foreground" />}>
            <StudioPageContent />
        </Suspense>
    );
}

function StudioPageContent() {
    const [activeContentTab, setActiveContentTab] = useState<string>(CONTENT_TABS[2]);
    const [selectedModel, setSelectedModel] = useState(IMAGE_MODELS[0].id);
    const [selectedAspectRatio, setSelectedAspectRatio] = useState('1:1');
    const [selectedQuality, setSelectedQuality] = useState<'standard' | 'hd' | '4k'>('hd');
    const [selectedProvider, setSelectedProvider] = useState('');
    const [prompt, setPrompt] = useState('');
    const [negativePrompt, setNegativePrompt] = useState('');
    const [seed, setSeed] = useState('');
    const [referenceImageUrl, setReferenceImageUrl] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [communityListings, setCommunityListings] = useState<GalleryListing[]>([]);
    const [isCommunityLoading, setIsCommunityLoading] = useState(false);
    const [projectId, setProjectId] = useState<string | null>(null);
    const [isProjectLoading, setIsProjectLoading] = useState(false);
    const [isProjectSaving, setIsProjectSaving] = useState(false);
    const [projectError, setProjectError] = useState<string | null>(null);

    const { startGeneration, reset, isGenerating, currentGeneration, error, generations, fetchGenerations, isLoading: isGenerationsLoading } = useGenerationStore();
    const { balance, fetchBalance } = useCreditStore();
    const { providers: imageProviders, isLoading: isProvidersLoading } = useGenerationProviders('image-generation');
    const contentScrollRef = useRef<HTMLDivElement | null>(null);
    const referenceImageInputRef = useRef<HTMLInputElement | null>(null);
    const { replace } = useRouter();
    const searchParams = useSearchParams();
    const searchParamsSnapshot = useMemo(() => new URLSearchParams(searchParams), [searchParams]);
    const isProjectBusy = isProjectLoading || isProjectSaving;

    useEffect(() => {
        fetchBalance();
    }, [fetchBalance]);

    useEffect(() => {
        const requestedProjectId = searchParamsSnapshot.get('projectId');
        setProjectId(requestedProjectId);

        const applySnapshot = (snapshot: Partial<ImageSnapshot>) => {
            setActiveContentTab(snapshot.activeContentTab ?? CONTENT_TABS[2]);
            setSelectedModel(snapshot.selectedModel ?? IMAGE_MODELS[0].id);
            setSelectedAspectRatio(snapshot.selectedAspectRatio ?? '1:1');
            setSelectedQuality(snapshot.selectedQuality ?? 'hd');
            setSelectedProvider(snapshot.selectedProvider ?? '');
            setPrompt(snapshot.prompt ?? '');
            setNegativePrompt(snapshot.negativePrompt ?? '');
            setSeed(snapshot.seed ?? '');
            setReferenceImageUrl(snapshot.referenceImageUrl ?? '');
            setSearchQuery(snapshot.searchQuery ?? '');
            setProjectError(null);
            if (snapshot.currentTab) {
                setActiveContentTab(snapshot.currentTab);
            }
        };

        const loadDraft = () => {
            const draftRaw = localStorage.getItem('image-generator:draft:v1');
            if (!draftRaw) return;

            try {
                applySnapshot(normalizeImageSnapshot(JSON.parse(draftRaw)));
            } catch (error) {
                console.error('Failed to load image draft', error);
            }
        };

        if (!requestedProjectId) {
            loadDraft();
            return;
        }

        let cancelled = false;
        setIsProjectLoading(true);

        void (async () => {
            try {
                const project = await projectApi.get(requestedProjectId);
                if (cancelled) return;

                applySnapshot(normalizeImageSnapshot(project.content));
            } catch (error) {
                console.error('Failed to load image project', error);
                if (!cancelled) {
                    setProjectError('Loaded local draft because backend project load failed.');
                    loadDraft();
                }
            } finally {
                if (!cancelled) {
                    setIsProjectLoading(false);
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [searchParams]);

    useEffect(() => {
        if (!imageProviders.length) {
            return;
        }

        if (!selectedProvider || !imageProviders.some((provider) => provider.name === selectedProvider)) {
            setSelectedProvider(imageProviders[0].name);
        }
    }, [imageProviders, selectedProvider]);

    useEffect(() => {
        if (activeContentTab === CONTENT_TABS[0]) { // Personal
            const handle = window.setTimeout(() => {
                fetchGenerations({
                    type: TemplateTypeEnum.IMAGE_GENERATOR,
                    limit: 20,
                    search: searchQuery.trim() || undefined,
                });
            }, 250);

            return () => window.clearTimeout(handle);
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
        }
    }, [activeContentTab, fetchGenerations, searchQuery]);

    useEffect(() => {
        contentScrollRef.current?.scrollTo({ top: 0 });
    }, [activeContentTab]);

    const handleGenerate = async () => {
        if (!prompt.trim() || isProjectBusy) return;
        await startGeneration('/generations/image', {
            prompt,
            model: selectedModel,
            aspectRatio: selectedAspectRatio,
            quality: selectedQuality,
            negativePrompt: negativePrompt.trim() || undefined,
            seed: seed.trim() ? Number(seed) : undefined,
            referenceImageUrl: referenceImageUrl.trim() || undefined,
            provider: selectedProvider || undefined,
        });
        // Refresh balance after generation (approximate timing)
        setTimeout(() => fetchBalance(), 1000);
        setTimeout(() => fetchBalance(), 3000);
    };

    const handleReferenceImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }

        if (!file.type.startsWith('image/')) {
            toast.error('Please upload an image file.');
            event.target.value = '';
            return;
        }

        try {
            const uploaded = await mediaApi.uploadMedia(file);
            if (uploaded?.url) {
                setReferenceImageUrl(uploaded.url);
                toast.success('Reference image uploaded.');
            } else {
                toast.error('Failed to upload reference image.');
            }
        } catch (error) {
            console.error('Reference image upload failed', error);
            toast.error('Failed to upload reference image.');
        }

        event.target.value = '';
    };

    const handleResetForm = () => {
        reset();
        setSelectedModel(IMAGE_MODELS[0].id);
        setSelectedAspectRatio('1:1');
        setSelectedQuality('hd');
        setSelectedProvider(imageProviders[0]?.name || '');
        setPrompt('');
        setNegativePrompt('');
        setSeed('');
        setReferenceImageUrl('');
        setSearchQuery('');
        setActiveContentTab(CONTENT_TABS[2]);
        setProjectError(null);
    };

    const handleSaveProject = () => {
        const payload: ImageProjectPayload = {
            version: 1,
            savedAt: new Date().toISOString(),
            snapshot: {
                activeContentTab,
                selectedModel,
                selectedAspectRatio,
                selectedQuality,
                selectedProvider,
                prompt,
                negativePrompt,
                seed,
                referenceImageUrl,
                searchQuery,
                currentTab: activeContentTab,
                resultUrl: currentGeneration?.resultUrl ?? null,
            },
        };

        localStorage.setItem('image-generator:draft:v1', JSON.stringify(payload));

        const persistProject = async () => {
            setIsProjectSaving(true);
            try {
                if (projectId) {
                    await projectApi.update(projectId, {
                        name: 'Image Generator Draft',
                        description: 'Image generator draft',
                        content: payload,
                    });
                } else {
                    const created = await projectApi.create({
                        name: 'Image Generator Draft',
                        description: 'Image generator draft',
                        content: payload,
                    });
                    setProjectId(created.project.id);
                    replace(`${window.location.pathname}?projectId=${created.project.id}`);
                }

                setProjectError(null);
                toast.success('Image generator draft saved to your projects.');
            } catch (error) {
                console.error('Failed to persist image project', error);
                setProjectError('Saved locally, but backend project save failed.');
                toast.error('Saved locally, but backend project save failed.');
            } finally {
                setIsProjectSaving(false);
            }
        };

        void persistProject();
    };

    const normalizedSearch = searchQuery.trim().toLowerCase();
    const filteredGenerations = normalizedSearch
        ? generations.filter((generation) => generation.prompt.toLowerCase().includes(normalizedSearch))
        : generations;
    const filteredCommunityListings = normalizedSearch
        ? communityListings.filter((listing) => listing.title.toLowerCase().includes(normalizedSearch))
        : communityListings;

    return (
        <CreatorWorkspaceShell>
            {/* Left Control Panel */}
            <div className="w-80 h-full min-h-0 shrink-0 border-r border-border bg-background flex flex-col">
                {/* Tabs */}
                {/* Header - Aligned height h-14 */}
                <div className="h-14 px-6 border-b border-border flex items-center justify-between shrink-0 bg-background/95 backdrop-blur">
                    <h2 className="font-semibold text-muted-foreground">Image Generator</h2>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 text-xs font-medium bg-secondary/50 px-3 py-1.5 rounded-full ring-1 ring-border" title="Your Credit Balance">
                            <Sparkles className="size-3 text-primary" />
                            <span>{formatCredits(balance)} Credits</span>
                        </div>
                        <Button variant="outline" size="sm" onClick={handleSaveProject} disabled={isProjectBusy || isGenerating} className="gap-2">
                            {isProjectSaving ? <Loader2 className="size-4 animate-spin" /> : <Folder className="size-4" />}
                            Save project
                        </Button>
                    </div>
                </div>

                {/* Control Content */}
                <div className="min-h-0 flex-1 overflow-y-auto p-4  gap-y-6">
                    {/* Browse Templates Button */}
                    <button 
                        onClick={() => setActiveContentTab(CONTENT_TABS[2])}
                        className="flex items-center justify-between w-full px-4 py-3 bg-card rounded-xl border border-border hover:border-border/80 transition-colors group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-lg bg-gradient-to-br from-chart-3/20 to-chart-2/20 flex items-center justify-center">
                                <Grid3X3 className="size-5 text-chart-3" />
                            </div>
                            <span className="text-sm font-medium">Browse templates</span>
                        </div>
                        <Bookmark className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </button>

                    {/* MODEL */}
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Model</h4>
                        <div className="bg-card rounded-xl border border-border px-4 py-3">
                            <select
                                value={selectedModel}
                                onChange={(event) => setSelectedModel(event.target.value)}
                                className="w-full bg-transparent text-sm outline-none"
                            >
                                {IMAGE_MODELS.map((model) => (
                                    <option key={model.id} value={model.id}>
                                        {model.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <p className="text-[10px] leading-4 text-muted-foreground">
                            Pick the model you want the backend to try first. Keep Flux if you want the current default path.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <h4 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Provider</h4>
                        <div className="bg-card rounded-xl border border-border px-4 py-3">
                            <select
                                value={selectedProvider}
                                onChange={(event) => setSelectedProvider(event.target.value)}
                                className="w-full bg-transparent text-sm outline-none"
                                disabled={isProvidersLoading}
                            >
                                {imageProviders.length > 0 ? (
                                    imageProviders.map((provider) => (
                                        <option key={provider.name} value={provider.name}>
                                            {provider.name}
                                        </option>
                                    ))
                                ) : (
                                    <option value="">Use backend default</option>
                                )}
                            </select>
                        </div>
                        <p className="text-[10px] leading-4 text-muted-foreground">
                            Prefer a live image provider over the backend default if the default provider is misconfigured.
                        </p>
                    </div>

                    {/* PROMPT */}
                    <div className="gap-y-3 flex-1 flex flex-col">
                        <h4 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Prompt</h4>
                        <div className="bg-card rounded-xl border border-border p-2 flex-1">
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Describe what you want to create?"
                                className="w-full h-40 bg-transparent text-sm placeholder:text-muted-foreground resize-none focus:outline-none p-2"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <h4 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Aspect ratio</h4>
                                <div className="bg-card rounded-xl border border-border px-4 py-3">
                                    <select
                                        value={selectedAspectRatio}
                                        onChange={(event) => setSelectedAspectRatio(event.target.value)}
                                        className="w-full bg-transparent text-sm outline-none"
                                    >
                                        <option value="1:1">1:1</option>
                                        <option value="4:3">4:3</option>
                                        <option value="16:9">16:9</option>
                                        <option value="9:16">9:16</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h4 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Quality</h4>
                                <div className="bg-card rounded-xl border border-border px-4 py-3">
                                    <select
                                        value={selectedQuality}
                                        onChange={(event) => setSelectedQuality(event.target.value as 'standard' | 'hd' | '4k')}
                                        className="w-full bg-transparent text-sm outline-none"
                                    >
                                        <option value="standard">Standard</option>
                                        <option value="hd">HD</option>
                                        <option value="4k">4K</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h4 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Negative prompt</h4>
                            <div className="bg-card rounded-xl border border-border p-2">
                                <textarea
                                    value={negativePrompt}
                                    onChange={(event) => setNegativePrompt(event.target.value)}
                                    placeholder="Things to avoid, e.g. blurry, text, watermark?"
                                    className="w-full h-24 bg-transparent text-sm placeholder:text-muted-foreground resize-none focus:outline-none p-2"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <h4 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Seed</h4>
                                <Input
                                    type="number"
                                    value={seed}
                                    onChange={(event) => setSeed(event.target.value)}
                                    placeholder="Optional"
                                    className="h-10"
                                />
                            </div>
                            <div className="space-y-2">
                                <h4 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Reference image URL</h4>
                                <div className="space-y-2">
                                    <Input
                                        type="url"
                                        value={referenceImageUrl}
                                        onChange={(event) => setReferenceImageUrl(event.target.value)}
                                        placeholder="https://?"
                                        className="h-10"
                                    />
                                    <div className="flex items-center gap-2">
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            className="h-8 px-3"
                                            onClick={() => referenceImageInputRef.current?.click()}
                                        >
                                            Upload image
                                        </Button>
                                        {referenceImageUrl && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 px-3"
                                                onClick={() => setReferenceImageUrl('')}
                                            >
                                                Clear
                                            </Button>
                                        )}
                                    </div>
                                    {referenceImageUrl && (
                                        <div className="relative aspect-[16/9] overflow-hidden rounded-xl border border-border bg-card">
                                            <Image
                                                src={referenceImageUrl}
                                                alt="Reference image preview"
                                                fill
                                                className="object-cover"
                                                sizes="320px"
                                                unoptimized
                                            />
                                        </div>
                                    )}
                                    <input
                                        ref={referenceImageInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleReferenceImageUpload}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Generate Button */}
                <div className="p-4 border-t border-border space-y-3">
                    <Button variant="ghost" size="sm" className="w-full gap-2" onClick={handleResetForm}>
                        Reset form
                    </Button>
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
                                <Loader2 className="size-4 animate-spin" />
                                Generating?
                            </>
                        ) : (
                            <>
                                Generate
                                <Sparkles className="size-4" />
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
            <div ref={contentScrollRef} className="min-w-0 flex-1 overflow-y-auto bg-background flex flex-col">
                {/* Generation Result View */}
                {currentGeneration && (
                    <div className="p-6 pb-0">
                        <h2 className="text-lg font-semibold mb-4">Current Generation</h2>
                        <div className="w-full aspect-[16/9] bg-card rounded-2xl border border-border flex items-center justify-center relative overflow-hidden group">
                            {currentGeneration.status === 'completed' && currentGeneration.resultUrl ? (
                                <Image
                                    src={currentGeneration.resultUrl}
                                    alt={currentGeneration.prompt || 'Current generation'}
                                    fill
                                    className="object-contain"
                                    sizes="(max-width: 1024px) 100vw, 50vw"
                                    unoptimized
                                />
                            ) : (
                                <div className="flex flex-col items-center gap-4">
                                    <div className="relative">
                                        <div className="size-16 rounded-full border-4 border-muted border-t-primary animate-spin" />
                                        <Sparkles className="size-6 text-muted-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
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
                        {projectError && <span className="text-xs text-destructive">{projectError}</span>}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <Input
                                type="text"
                                value={searchQuery}
                                onChange={(event) => setSearchQuery(event.target.value)}
                                placeholder={
                                    activeContentTab === CONTENT_TABS[0]
                                        ? 'Search your generations'
                                        : activeContentTab === CONTENT_TABS[1]
                                            ? 'Search community creations'
                                            : 'Search templates'
                                }
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
                            ) : filteredGenerations.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                    {filteredGenerations.map((gen) => (
                                        <GenerationCard key={gen.id} generation={gen} />
                                    ))}
                                </div>
                            ) : (
                                <EmptyState message={normalizedSearch ? 'No generations match your search.' : 'No generations yet. Start creating!'} />
                            )}
                        </section>
                    )}

                    {activeContentTab === CONTENT_TABS[1] && ( // Community
                        <section className="space-y-6">
                            <h2 className="text-lg font-semibold">Community Creations</h2>
                            {isCommunityLoading ? (
                                <LoadingGrid />
                            ) : filteredCommunityListings.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                    {filteredCommunityListings.map((listing) => (
                                        <TemplateCard key={listing.id} template={listing} onClick={() => setPrompt(listing.title)} />
                                    ))}
                                </div>
                            ) : (
                                <EmptyState message={normalizedSearch ? 'No community creations match your search.' : 'Community is quiet today.'} />
                            )}
                        </section>
                    )}

                    {activeContentTab === CONTENT_TABS[2] && ( // Templates
                        <TemplatesTab onSelectPrompt={setPrompt} searchTerm={searchQuery} />
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
        </CreatorWorkspaceShell>
    );
}

function LoadingGrid() {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {['image-skel-1', 'image-skel-2', 'image-skel-3', 'image-skel-4', 'image-skel-5'].map((id) => (
                <div key={id} className="aspect-[3/4] rounded-xl bg-muted animate-pulse" />
            ))}
        </div>
    );
}

function TemplatesTab({ onSelectPrompt, searchTerm }: { onSelectPrompt: (prompt: string) => void; searchTerm: string }) {
    const {
        data,
        error,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        refetch,
        status,
    } = useInfiniteTemplates({ type: TemplateTypeEnum.IMAGE_GENERATOR, limit: TEMPLATE_PAGE_SIZE });
    const { ref, inView } = useInView({ rootMargin: '400px 0px' });

    useEffect(() => {
        if (inView && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [fetchNextPage, hasNextPage, inView, isFetchingNextPage]);

    const templates = (data?.pages.flatMap((page) => page.data as TemplateFeedItem[]) || []) as TemplateFeedItem[];
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const filteredTemplates = normalizedSearch
        ? templates.filter((template) => {
            const title = template.title.toLowerCase();
            const description = template.description?.toLowerCase() ?? '';
            return title.includes(normalizedSearch) || description.includes(normalizedSearch);
        })
        : templates;
    const isInitialLoading = status === 'pending';
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch templates';

    return (
        <div className="space-y-10 pt-8">
            <section className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-semibold">New Templates</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Scroll to load more templates progressively.
                        </p>
                    </div>
                    <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                        Infinite scroll
                    </span>
                </div>

                {status === 'error' ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-destructive/40 bg-destructive/5 px-6 py-16 text-center">
                        <p className="font-medium text-foreground">Failed to load templates</p>
                        <p className="mt-1 text-sm text-muted-foreground">{errorMessage}</p>
                        <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>
                            Retry
                        </Button>
                    </div>
                ) : isInitialLoading ? (
                    <TemplateSkeletonGrid count={10} />
                ) : filteredTemplates.length > 0 ? (
                    <>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {filteredTemplates.map((template) => (
                                <TemplateCard
                                    key={template.id}
                                    template={template}
                                    onClick={() => onSelectPrompt(template.title)}
                                />
                            ))}
                        </div>
                        <div ref={ref} className="flex items-center justify-center pt-2 min-h-10">
                            {isFetchingNextPage ? (
                                <Loader2 className="size-5 animate-spin text-muted-foreground" />
                            ) : hasNextPage ? (
                                <span className="text-xs text-muted-foreground">Keep scrolling to load more</span>
                            ) : (
                                <span className="text-xs text-muted-foreground">End of templates</span>
                            )}
                        </div>
                    </>
                ) : (
                    <EmptyState message={normalizedSearch ? 'No templates match your search.' : 'No templates available yet.'} />
                )}
            </section>

            <section className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-semibold">Featured</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            A curated snapshot from the loaded template feed.
                        </p>
                    </div>
                    <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                        {Math.min(6, templates.length)} items
                    </span>
                </div>

                {isInitialLoading ? (
                    <TemplateSkeletonGrid count={6} />
                ) : filteredTemplates.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {filteredTemplates.slice(0, 6).map((template) => (
                            <TemplateCard
                                key={template.id}
                                template={template}
                                onClick={() => onSelectPrompt(template.title)}
                            />
                        ))}
                    </div>
                ) : (
                    <EmptyState message={normalizedSearch ? 'No featured templates match your search.' : 'Featured templates will appear after the first page loads.'} />
                )}
            </section>
        </div>
    );
}

function TemplateSkeletonGrid({ count }: { count: number }) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: count }).map((_, index) => (
                <div key={index} className="space-y-2">
                    <Skeleton className="aspect-[3/4] rounded-xl" />
                    <Skeleton className="h-3 w-4/5" />
                </div>
            ))}
        </div>
    );
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="size-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Sparkles className="size-8 text-muted-foreground/30" />
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
                        unoptimized
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
                        <Loader2 className="size-6 animate-spin text-muted-foreground" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="mt-2 text-xs text-muted-foreground group-hover:text-foreground transition-colors line-clamp-1">
                {generation.prompt}
            </p>
        </div>
    );
}

function TemplateCard({ template, onClick }: { template: { id: string; title: string; thumbnail?: string }, onClick?: () => void }) {
    return (
        <button type="button" className="group text-left cursor-pointer" onClick={onClick}>
            <div className="aspect-[3/4] rounded-xl overflow-hidden bg-card border border-border group-hover:border-border/80 transition-all relative">
                {template.thumbnail ? (
                    <Image
                        src={template.thumbnail}
                        alt={template.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                        sizes="(max-width: 1024px) 100vw, 20vw"
                        unoptimized
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-muted via-background to-muted">
                        <Sparkles className="size-6 text-muted-foreground/50" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="mt-2 text-xs text-muted-foreground group-hover:text-foreground transition-colors line-clamp-1">
                {template.title}
            </p>
        </button>
    );
}
