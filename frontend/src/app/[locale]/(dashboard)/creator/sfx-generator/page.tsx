'use client';

import { Suspense, useReducer, useEffect, useState, useRef, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useGenerationStore } from '@/stores/generation-store';
import { useTemplateStore } from '@/stores/template-store';
import { MediaPickerModal } from '@/components/common/MediaPickerModal';
import { TemplateTypeEnum } from '@/lib/api/templates';
import { CONTENT_TABS, COMMUNITY_TAB, TEMPLATES_TAB } from '@/components/layouts/navigation-data';
import { Zap, Download, Loader2, Play, Pause, Folder, Leaf, Cog, Bomb, User, Smartphone, Rocket, Waves, Music2, Search, Sparkles, Upload } from 'lucide-react';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { createSfxFilename, getSfxPreviewUrl, type SfxTrackLike } from '@/lib/sfx-track';
import { CreatorWorkspaceShell } from '@/components/layouts/CreatorWorkspaceShell';
import { uploadFileWithToast } from '@/lib/upload';
import type { MediaItem } from '@/types/media';
import { getUserFacingErrorMessage } from '@/lib/async-operation';
import { projectApi } from '@/services/projectApi';

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
    | { type: 'setCategory'; categoryId: string | null }
    | { type: 'toggleCategory'; categoryId: string }
    | { type: 'setDuration'; duration: string }
    | { type: 'setVariations'; variations: number }
    | { type: 'setIntensity'; intensity: number }
    | { type: 'togglePlaying'; playingId: string }
    | { type: 'setActiveContentTab'; tab: string }
    | { type: 'reset' };

type SfxSnapshot = {
    prompt: string;
    selectedCategory: string | null;
    duration: string;
    variations: number;
    intensity: number;
    activeContentTab: string;
    sampleUrl: string | null;
    sampleName: string;
};

type SfxProjectPayload = {
    version: number;
    savedAt: string;
    snapshot: Partial<SfxSnapshot>;
};

type SfxGenerationCard = SfxTrackLike & {
    status: string;
};

const initialState: SfxState = {
    prompt: '',
    selectedCategory: null,
    duration: '2s',
    variations: 4,
    intensity: 50,
    playingId: null,
    activeContentTab: TEMPLATES_TAB,
};

const normalizeSfxSnapshot = (value: unknown): Partial<SfxSnapshot> => {
    const raw = (value ?? {}) as Record<string, unknown>;
    const snapshot = (raw.snapshot && typeof raw.snapshot === 'object' ? raw.snapshot : raw) as Record<string, unknown>;

    return {
        prompt: typeof snapshot.prompt === 'string' ? snapshot.prompt : '',
        selectedCategory: typeof snapshot.selectedCategory === 'string' ? snapshot.selectedCategory : null,
        duration: typeof snapshot.duration === 'string' ? snapshot.duration : initialState.duration,
        variations: typeof snapshot.variations === 'number' ? snapshot.variations : initialState.variations,
        intensity: typeof snapshot.intensity === 'number' ? snapshot.intensity : initialState.intensity,
        activeContentTab: typeof snapshot.activeContentTab === 'string' ? snapshot.activeContentTab : initialState.activeContentTab,
        sampleUrl: typeof snapshot.sampleUrl === 'string' ? snapshot.sampleUrl : null,
        sampleName: typeof snapshot.sampleName === 'string' ? snapshot.sampleName : '',
    };
};

function reducer(state: SfxState, action: SfxAction): SfxState {
    switch (action.type) {
        case 'setPrompt':
            return { ...state, prompt: action.prompt };
        case 'setCategory':
            return { ...state, selectedCategory: action.categoryId };
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
        case 'reset':
            return initialState;
        default:
            return state;
    }
}

export default function SfxGeneratorPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-background text-foreground" />}>
            <SfxGeneratorPageContent />
        </Suspense>
    );
}

function SfxGeneratorPageContent() {
    const [state, dispatch] = useReducer(reducer, initialState);
    const { generateSfx, isGenerating, generations, fetchGenerations, isLoading: isGenerationsLoading } = useGenerationStore();
    const { templates, fetchTemplates, isLoading: isTemplatesLoading } = useTemplateStore();
    const { replace } = useRouter();
    const searchParams = useSearchParams();
    const searchParamsSnapshot = useMemo(() => new URLSearchParams(searchParams), [searchParams]);
    const [communityListings, setCommunityListings] = useState<Array<{ id: string; title: string; description?: string }>>([]);
    const [isCommunityLoading, setIsCommunityLoading] = useState(false);
    const [sampleUrl, setSampleUrl] = useState<string | null>(null);
    const [sampleName, setSampleName] = useState('');
    const [isAudioPickerOpen, setIsAudioPickerOpen] = useState(false);
    const [projectId, setProjectId] = useState<string | null>(null);
    const [isProjectLoading, setIsProjectLoading] = useState(false);
    const [isProjectSaving, setIsProjectSaving] = useState(false);
    const [projectError, setProjectError] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const isProjectBusy = isProjectLoading || isProjectSaving;

    useEffect(() => {
        if (state.activeContentTab === CONTENT_TABS[0]) { // Personal
            fetchGenerations({ type: TemplateTypeEnum.SOUND_EFFECT_GENERATOR, limit: 12 });
        } else if (state.activeContentTab === COMMUNITY_TAB) { // Community
            const fetchCommunity = async () => {
                setIsCommunityLoading(true);
                try {
                    const res = await import('@/lib/api').then(m => m.get<{ data: Array<{ id: string; title: string; description?: string }> }>(`/community-marketplace/listings?type=${TemplateTypeEnum.SOUND_EFFECT_GENERATOR}&limit=12`));
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

    useEffect(() => {
        const requestedProjectId = searchParamsSnapshot.get('projectId');
        setProjectId(requestedProjectId);

        const applySnapshot = (snapshot: Partial<SfxSnapshot>) => {
            dispatch({ type: 'setPrompt', prompt: snapshot.prompt ?? '' });
            dispatch({ type: 'setCategory', categoryId: snapshot.selectedCategory ?? null });
            dispatch({ type: 'setDuration', duration: snapshot.duration ?? initialState.duration });
            dispatch({ type: 'setVariations', variations: snapshot.variations ?? initialState.variations });
            dispatch({ type: 'setIntensity', intensity: snapshot.intensity ?? initialState.intensity });
            dispatch({ type: 'setActiveContentTab', tab: snapshot.activeContentTab ?? initialState.activeContentTab });
            setSampleUrl(snapshot.sampleUrl ?? null);
            setSampleName(snapshot.sampleName ?? '');
            setProjectError(null);
        };

        const loadDraft = () => {
            const draftRaw = localStorage.getItem('sfx-generator:draft:v1');
            if (!draftRaw) return;

            try {
                const snapshot = normalizeSfxSnapshot(JSON.parse(draftRaw));
                applySnapshot(snapshot);
            } catch (error) {
                console.error('Failed to load sfx draft', error);
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

                const snapshot = normalizeSfxSnapshot(project.content);
                applySnapshot(snapshot);
            } catch (error) {
                console.error('Failed to load sfx project', error);
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

    const handleGenerate = async () => {
        if (!state.prompt.trim() || isProjectBusy) return;
        try {
            await generateSfx({
                prompt: state.prompt,
                category: state.selectedCategory || undefined,
                duration: parseFloat(state.duration),
            });
        } catch (error) {
            toast.error(getUserFacingErrorMessage(error, 'Failed to generate sound effect'));
        }
    };

    const handleSampleUpload = async (file: File) => {
        const uploaded = await uploadFileWithToast(file, file.name);
        if (!uploaded?.url) return;

        setSampleUrl(uploaded.url);
        setSampleName(file.name);
    };

    const handleSampleSelect = (media: MediaItem) => {
        setSampleUrl(media.url);
        setSampleName(media.name);
    };

    const handleReset = () => {
        dispatch({ type: 'reset' });
        setSampleUrl(null);
        setSampleName('');
        setIsAudioPickerOpen(false);
        setProjectError(null);
    };

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) {
            return;
        }

        if (!state.playingId) {
            audio.pause();
            audio.removeAttribute('src');
            audio.load();
            return;
        }

        const currentGeneration = generations.find((item) => item.id === state.playingId) ?? null;
        const previewUrl = getSfxPreviewUrl(currentGeneration ?? { resultUrl: null });

        if (!previewUrl) {
            audio.pause();
            return;
        }

        audio.src = previewUrl;
        audio.currentTime = 0;

        void audio.play().catch(() => {
            dispatch({ type: 'togglePlaying', playingId: state.playingId as string });
            toast.error('Unable to preview this sound effect right now.');
        });
    }, [state.playingId, generations]);

    const downloadJson = (filename: string, payload: unknown) => {
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleGenerationDownload = async (generation: SfxGenerationCard) => {
        const previewUrl = getSfxPreviewUrl(generation);

        if (previewUrl) {
            try {
                const response = await fetch(previewUrl);
                if (!response.ok) {
                    throw new Error(`Failed to fetch preview (${response.status})`);
                }

                const blob = await response.blob();
                const mimeType = blob.type || 'audio/wav';
                const extension = mimeType.split('/')[1]?.split('+')[0] || 'wav';
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = createSfxFilename(generation, extension);
                link.click();
                URL.revokeObjectURL(url);
                toast.success(`Downloaded ${generation.prompt}.`);
                return;
            } catch (error) {
                console.error('Failed to download audio preview, falling back to JSON export', error);
            }
        }

        downloadJson(createSfxFilename(generation, 'json'), generation);
        toast.success(`Downloaded ${generation.prompt} metadata.`);
    };

    const handleSaveProject = () => {
        const payload: SfxProjectPayload = {
            version: 1,
            savedAt: new Date().toISOString(),
            snapshot: {
                prompt: state.prompt,
                selectedCategory: state.selectedCategory,
                duration: state.duration,
                variations: state.variations,
                intensity: state.intensity,
                activeContentTab: state.activeContentTab,
                sampleUrl,
                sampleName,
            },
        };

        localStorage.setItem('sfx-generator:draft:v1', JSON.stringify(payload));

        const persistProject = async () => {
            setIsProjectSaving(true);
            try {
                if (projectId) {
                    await projectApi.update(projectId, {
                        name: 'SFX Generator Draft',
                        description: 'SFX generator draft',
                        content: payload,
                    });
                } else {
                    const created = await projectApi.create({
                        name: 'SFX Generator Draft',
                        description: 'SFX generator draft',
                        content: payload,
                    });
                    setProjectId(created.project.id);
                    replace(`${window.location.pathname}?projectId=${created.project.id}`);
                }

                setProjectError(null);
                toast.success('Sound effect saved to your projects.');
            } catch (error) {
                console.error('Failed to persist sfx project', error);
                setProjectError('Saved locally, but backend project save failed.');
                toast.error('Saved locally, but backend project save failed.');
            } finally {
                setIsProjectSaving(false);
            }
        };

        void persistProject();
    };

    return (
        <CreatorWorkspaceShell>
            <div className="w-[320px] border-r border-border flex flex-col shrink-0 bg-background">
                <div className="h-14 px-6 border-b border-border flex items-center shrink-0">
                    <h2 className="font-semibold text-muted-foreground">SFX Generator</h2>
                </div>

                <div className="flex-1 overflow-y-auto p-6  gap-y-6 text-left">
                    <div className="space-y-3 text-left">
                        <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.1em]">Describe the Sound</h4>
                        <div className="bg-card rounded-xl border border-border p-2">
                            <textarea
                                value={state.prompt}
                                onChange={(e) => dispatch({ type: 'setPrompt', prompt: e.target.value })}
                                placeholder="e.g., Heavy rain on a tin roof?"
                                className="w-full h-28 bg-transparent text-sm placeholder:text-muted-foreground resize-none focus:outline-none p-2"
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.1em]">Category</h4>
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
                                    <cat.icon className="size-4 text-muted-foreground" />
                                    <span className="text-[8px] font-medium">{cat.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.1em]">Duration</h4>
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

                    <div className="space-y-3">
                        <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.1em]">Reference Sample (Optional)</h4>
                        <button
                            type="button"
                            onClick={() => setIsAudioPickerOpen(true)}
                            className="w-full rounded-xl bg-muted border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary/30 transition-all gap-2 px-4 py-8"
                        >
                            <Upload className="size-6 text-muted-foreground/50" />
                            <div className="text-center">
                                <p className="text-xs font-medium">{sampleName || 'Upload Sample'}</p>
                                <p className="text-[10px] text-muted-foreground">Drop audio or click</p>
                            </div>
                        </button>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="flex-1 gap-2" onClick={() => setIsAudioPickerOpen(true)}>
                                <Folder className="size-4" />
                                Choose from uploads
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 gap-2"
                                onClick={() => {
                                    const input = document.createElement('input');
                                    input.type = 'file';
                                    input.accept = 'audio/*';
                                    input.onchange = async () => {
                                        const file = input.files?.[0];
                                        if (file) {
                                            await handleSampleUpload(file);
                                        }
                                    };
                                    input.click();
                                }}
                            >
                                <Upload className="size-4" />
                                Upload file
                            </Button>
                        </div>
                        {sampleUrl && <audio className="w-full" controls src={sampleUrl} />}
                    </div>
                </div>

                <div className="p-4 border-t border-border space-y-3">
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleReset} disabled={isProjectBusy} className="h-12 flex-1 font-bold rounded-xl gap-2">
                            <Folder className="size-5" />
                            Reset
                        </Button>
                        <Button variant="outline" onClick={handleSaveProject} disabled={isProjectBusy || isGenerating} className="h-12 flex-1 font-bold rounded-xl gap-2">
                            {isProjectSaving ? <Loader2 className="size-5 animate-spin" /> : <Folder className="size-5" />}
                            Save
                        </Button>
                        <Button onClick={handleGenerate} disabled={isGenerating || isProjectBusy || !state.prompt.trim()} className="h-12 flex-[2] font-bold rounded-xl gap-2">
                            {isGenerating ? <Loader2 className="size-5 animate-spin" /> : <Zap className="size-5" />}
                            {isGenerating ? 'Generating...' : 'Generate SFX'}
                        </Button>
                    </div>
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
                        <div className="relative ml-3">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <Input placeholder="Search" className="w-56 h-9 pl-10 pr-4" />
                        </div>
                        <Button variant="outline" size="sm" onClick={handleSaveProject} disabled={isProjectBusy || isGenerating} className="gap-2">
                            {isProjectSaving ? <Loader2 className="size-4 animate-spin" /> : <Folder className="size-4" />}
                            Save project
                        </Button>
                    </div>
                </div>

                {projectError && (
                    <div className="px-6 pt-4">
                        <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                            {projectError}
                        </div>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto p-6">
                    {state.activeContentTab === CONTENT_TABS[0] && ( // Personal
                        <section className="space-y-6">
                            <h2 className="text-lg font-semibold text-left">Your History</h2>
                            {isGenerationsLoading ? (
                                <LoadingGrid />
                            ) : generations.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                    {generations.map((gen) => (
                                        <GenerationCard
                                            key={gen.id}
                                            generation={gen as SfxGenerationCard}
                                            onPlay={() => dispatch({ type: 'togglePlaying', playingId: gen.id })}
                                            onDownload={() => handleGenerationDownload(gen as SfxGenerationCard)}
                                            isPlaying={state.playingId === gen.id}
                                        />
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

            <audio
                ref={audioRef}
                className="hidden"
                preload="none"
                onEnded={() => dispatch({ type: 'togglePlaying', playingId: state.playingId ?? '' })}
            />

            <MediaPickerModal
                isOpen={isAudioPickerOpen}
                onClose={() => setIsAudioPickerOpen(false)}
                onSelect={handleSampleSelect}
                mediaType="audio"
            />
        </CreatorWorkspaceShell>
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
            <div className="size-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Sparkles className="size-8 text-muted-foreground/30" />
            </div>
            <p className="text-muted-foreground">{message}</p>
        </div>
    );
}

function GenerationCard({ generation, onPlay, onDownload, isPlaying }: { generation: SfxGenerationCard; onPlay: () => void; onDownload: () => void; isPlaying: boolean }) {
    return (
        <div className="group text-left p-4 bg-card rounded-xl border border-border hover:border-border/80 transition-all relative">
            <div className="flex items-center gap-3">
                <button
                    onClick={onPlay}
                    className="size-10 rounded-full bg-muted flex items-center justify-center hover:bg-accent transition-colors shrink-0"
                >
                    {isPlaying ? <Pause className="size-4" /> : <Play className="size-4 fill-current" />}
                </button>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{generation.prompt}</p>
                    <p className="text-[10px] text-muted-foreground capitalize">{generation.status}</p>
                </div>
                <Button variant="outline" size="icon" className="size-8" onClick={onDownload} title="Download sound effect">
                    <Download className="size-4" />
                </Button>
            </div>
        </div>
    );
}

function TemplateCard({ template, onClick }: { template: { title: string; description?: string }; onClick?: () => void }) {
    return (
        <button type="button" className="group text-left cursor-pointer p-4 bg-card rounded-xl border border-border group-hover:border-border/80 transition-all relative w-full" onClick={onClick}>
            <div className="flex items-center gap-3">
                <div className="size-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <Waves className="size-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{template.title}</p>
                    <p className="text-[10px] text-muted-foreground line-clamp-1">{template.description || 'Sound effect preset'}</p>
                </div>
            </div>
        </button>
    );
}
