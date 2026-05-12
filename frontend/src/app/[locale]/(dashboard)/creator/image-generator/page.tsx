'use client';

import Image from 'next/image';
import { Suspense, useEffect, useReducer, useRef, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    ChevronDown,
    Sparkles,
    Bookmark,
    Grid3X3,
    Search,
    Loader2,
    Upload
} from 'lucide-react';
import { useInView } from 'react-intersection-observer';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { CreatorWorkspaceShell } from '@/components/layouts/CreatorWorkspaceShell';
import { MediaPickerModal } from '@/components/common/MediaPickerModal';
import { TemplateExplorerModal } from '@/components/gallery/TemplateExplorerModal';
import { useGenerationStore } from '@/stores/generation-store';
import { useCreditStore } from '@/stores/credit-store';
import { CONTENT_TABS } from '@/components/layouts/navigation-data';
import { TemplateTypeEnum } from '@/lib/api/templates';
import { useInfiniteTemplates } from '@/hooks/useTemplates';
import type { MediaItem } from '@/types/media';
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
    prompt: string;
    negativePrompt: string;
    seed: string;
    referenceImageUrl: string;
    referenceImageError: string | null;
    isReferenceImageUploading: boolean;
    referenceImageUploadError: string | null;
    referenceImageUploadProgress: number;
    searchQuery: string;
    currentTab: string;
    resultUrl: string | null;
};

type ImageProjectPayload = {
    version: number;
    savedAt: string;
    snapshot: Partial<ImageSnapshot>;
};

type StudioState = {
    activeContentTab: string;
    selectedModel: string;
    showModelPicker: boolean;
    selectedAspectRatio: string;
    selectedQuality: 'standard' | 'hd' | '4k';
    prompt: string;
    negativePrompt: string;
    seed: string;
    referenceImageUrl: string;
    referenceImageError: string | null;
    isReferenceImageUploading: boolean;
    referenceImageUploadError: string | null;
    referenceImageUploadProgress: number;
    isReferencePickerOpen: boolean;
    searchQuery: string;
    communityListings: GalleryListing[];
    isCommunityLoading: boolean;
    projectId: string | null;
    isProjectLoading: boolean;
    isProjectSaving: boolean;
    projectError: string | null;
};

type StudioAction =
    | { type: 'setActiveContentTab'; activeContentTab: string }
    | { type: 'setSelectedModel'; selectedModel: string }
    | { type: 'setShowModelPicker'; showModelPicker: boolean }
    | { type: 'setSelectedAspectRatio'; selectedAspectRatio: string }
    | { type: 'setSelectedQuality'; selectedQuality: 'standard' | 'hd' | '4k' }
    | { type: 'setPrompt'; prompt: string }
    | { type: 'setNegativePrompt'; negativePrompt: string }
    | { type: 'setSeed'; seed: string }
    | { type: 'setReferenceImageUrl'; referenceImageUrl: string }
    | { type: 'setReferenceImageError'; referenceImageError: string | null }
    | { type: 'setReferenceImageUploading'; isReferenceImageUploading: boolean }
    | { type: 'setReferenceImageUploadError'; referenceImageUploadError: string | null }
    | { type: 'setReferenceImageUploadProgress'; referenceImageUploadProgress: number }
    | { type: 'setReferencePickerOpen'; isReferencePickerOpen: boolean }
    | { type: 'setSearchQuery'; searchQuery: string }
    | { type: 'setCommunityListings'; communityListings: GalleryListing[] }
    | { type: 'setIsCommunityLoading'; isCommunityLoading: boolean }
    | { type: 'setProjectId'; projectId: string | null }
    | { type: 'setIsProjectLoading'; isProjectLoading: boolean }
    | { type: 'setIsProjectSaving'; isProjectSaving: boolean }
    | { type: 'setProjectError'; projectError: string | null }
    | { type: 'applySnapshot'; snapshot: Partial<ImageSnapshot> }
    | { type: 'resetForm' };

const initialStudioState: StudioState = {
    activeContentTab: CONTENT_TABS[2],
    selectedModel: 'sd_xl_base_1.0.safetensors',
    showModelPicker: false,
    selectedAspectRatio: '1:1',
    selectedQuality: 'hd',
    prompt: '',
    negativePrompt: '',
    seed: '',
    referenceImageUrl: '',
    referenceImageError: null,
    isReferenceImageUploading: false,
    referenceImageUploadError: null,
    referenceImageUploadProgress: 0,
    isReferencePickerOpen: false,
    searchQuery: '',
    communityListings: [],
    isCommunityLoading: false,
    projectId: null,
    isProjectLoading: false,
    isProjectSaving: false,
    projectError: null,
};

function studioReducer(state: StudioState, action: StudioAction): StudioState {
    switch (action.type) {
        case 'setActiveContentTab':
            return { ...state, activeContentTab: action.activeContentTab };
        case 'setSelectedModel':
            return { ...state, selectedModel: action.selectedModel };
        case 'setShowModelPicker':
            return { ...state, showModelPicker: action.showModelPicker };
        case 'setSelectedAspectRatio':
            return { ...state, selectedAspectRatio: action.selectedAspectRatio };
        case 'setSelectedQuality':
            return { ...state, selectedQuality: action.selectedQuality };
        case 'setPrompt':
            return { ...state, prompt: action.prompt };
        case 'setNegativePrompt':
            return { ...state, negativePrompt: action.negativePrompt };
        case 'setSeed':
            return { ...state, seed: action.seed };
        case 'setReferenceImageUrl':
            return { ...state, referenceImageUrl: action.referenceImageUrl, referenceImageError: null };
        case 'setReferenceImageError':
            return { ...state, referenceImageError: action.referenceImageError };
        case 'setReferenceImageUploading':
            return { ...state, isReferenceImageUploading: action.isReferenceImageUploading };
        case 'setReferenceImageUploadError':
            return { ...state, referenceImageUploadError: action.referenceImageUploadError };
        case 'setReferenceImageUploadProgress':
            return { ...state, referenceImageUploadProgress: action.referenceImageUploadProgress };
        case 'setReferencePickerOpen':
            return { ...state, isReferencePickerOpen: action.isReferencePickerOpen };
        case 'setSearchQuery':
            return { ...state, searchQuery: action.searchQuery };
        case 'setCommunityListings':
            return { ...state, communityListings: action.communityListings };
        case 'setIsCommunityLoading':
            return { ...state, isCommunityLoading: action.isCommunityLoading };
        case 'setProjectId':
            return { ...state, projectId: action.projectId };
        case 'setIsProjectLoading':
            return { ...state, isProjectLoading: action.isProjectLoading };
        case 'setIsProjectSaving':
            return { ...state, isProjectSaving: action.isProjectSaving };
        case 'setProjectError':
            return { ...state, projectError: action.projectError };
        case 'applySnapshot':
            return {
                ...state,
                activeContentTab: action.snapshot.currentTab ?? action.snapshot.activeContentTab ?? state.activeContentTab,
                selectedModel: action.snapshot.selectedModel ?? state.selectedModel,
                showModelPicker: false,
                selectedAspectRatio: action.snapshot.selectedAspectRatio ?? state.selectedAspectRatio,
                selectedQuality: action.snapshot.selectedQuality ?? state.selectedQuality,
                prompt: action.snapshot.prompt ?? state.prompt,
                negativePrompt: action.snapshot.negativePrompt ?? state.negativePrompt,
                seed: action.snapshot.seed ?? state.seed,
                referenceImageUrl: action.snapshot.referenceImageUrl ?? state.referenceImageUrl,
                referenceImageError: null,
                referenceImageUploadError: null,
                isReferencePickerOpen: false,
                searchQuery: action.snapshot.searchQuery ?? state.searchQuery,
                projectError: null,
            };
        case 'resetForm':
            return {
                ...initialStudioState,
                communityListings: state.communityListings,
                projectId: state.projectId,
            };
        default:
            return state;
    }
}

const IMAGE_MODELS = [
    { id: '4o-image', label: '4o Image' },
    { id: 'flux-kontext', label: 'Flux Kontext' },
    { id: 'nano-banana', label: 'Nano Banana' },
    { id: 'seedream-4.5', label: 'Seedream 4.5' },
    { id: 'sd_xl_base_1.0.safetensors', label: 'SDXL Base 1.0' },
    { id: 'z_image_turbo_bf16.safetensors', label: 'Z-Image-Turbo' },
];

const TEMPLATE_PAGE_SIZE = 12;

const IMAGE_MODEL_ALIASES: Record<string, string> = {
    flux: IMAGE_MODELS[1].id,
    'flux-schnell': IMAGE_MODELS[1].id,
    'flux-kontext': IMAGE_MODELS[1].id,
    'z-image-turbo': IMAGE_MODELS[5].id,
    zimage: IMAGE_MODELS[5].id,
    sdxl: IMAGE_MODELS[4].id,
    'sd-xl': IMAGE_MODELS[4].id,
    'sd_xl': IMAGE_MODELS[4].id,
    '4o': IMAGE_MODELS[0].id,
    '4o-image': IMAGE_MODELS[0].id,
    'nano-banana': IMAGE_MODELS[2].id,
    'seedream-4.5': IMAGE_MODELS[3].id,
};

type PromptRecipe = {
    title: string;
    prompt: string;
    negativePrompt: string;
    aspectRatio: '1:1' | '4:3' | '16:9' | '9:16';
    quality: 'standard' | 'hd' | '4k';
    model?: string;
    hint: string;
};

const IMAGE_PROMPT_RECIPES: PromptRecipe[] = [
    {
        title: 'Product hero',
        prompt: 'Create a premium product hero image of a matte black smart speaker on a stone pedestal, studio lighting, soft shadow, clean background, high contrast',
        negativePrompt: 'blurry, low detail, text, watermark, extra objects, distorted geometry',
        aspectRatio: '16:9',
        quality: 'hd',
        hint: 'Good for landing pages, ads, and app headers.',
    },
    {
        title: 'Character portrait',
        prompt: 'Create a cinematic portrait of a confident creative director wearing a white shirt and dark jacket, shallow depth of field, dramatic rim light, realistic skin texture',
        negativePrompt: 'blurry face, extra fingers, duplicated features, text, watermark, plastic skin',
        aspectRatio: '1:1',
        quality: '4k',
        model: 'z_image_turbo_bf16.safetensors',
        hint: 'Good for avatars, profiles, and personal branding.',
    },
    {
        title: 'Editorial scene',
        prompt: 'Create an editorial-style workspace scene with a laptop, notebook, coffee cup, and warm window light, composed for a magazine cover, realistic shadows, refined color grading',
        negativePrompt: 'messy composition, unreadable text, watermark, low contrast, extra hands',
        aspectRatio: '4:3',
        quality: 'hd',
        hint: 'Good for blog visuals, case studies, and feature cards.',
    },
    {
        title: 'Social story',
        prompt: 'Create a vertical social story image with a founder standing in a modern studio, bold typography space on top, soft gradient lighting, polished campaign aesthetic',
        negativePrompt: 'blurry, cropped head, watermark, unreadable text, extra fingers, low contrast',
        aspectRatio: '9:16',
        quality: 'standard',
        hint: 'Good for short-form social posts, stories, and reels covers.',
    },
];

const normalizeImageModel = (value: unknown): string => {
    if (typeof value !== 'string') {
        return IMAGE_MODELS[0].id;
    }

    const trimmed = value.trim();
    if (!trimmed) {
        return IMAGE_MODELS[0].id;
    }

    if (IMAGE_MODELS.some((model) => model.id === trimmed)) {
        return trimmed;
    }

    return IMAGE_MODEL_ALIASES[trimmed.toLowerCase()] || IMAGE_MODELS[0].id;
};

const normalizeImageSnapshot = (value: unknown): Partial<ImageSnapshot> => {
    const raw = (value ?? {}) as Record<string, unknown>;
    const snapshot = (raw.snapshot && typeof raw.snapshot === 'object' ? raw.snapshot : raw) as Record<string, unknown>;

    return {
        activeContentTab: typeof snapshot.activeContentTab === 'string' ? snapshot.activeContentTab : CONTENT_TABS[2],
        selectedModel: normalizeImageModel(snapshot.selectedModel),
        selectedAspectRatio: typeof snapshot.selectedAspectRatio === 'string' ? snapshot.selectedAspectRatio : '1:1',
        selectedQuality: snapshot.selectedQuality === 'standard' || snapshot.selectedQuality === 'hd' || snapshot.selectedQuality === '4k' ? snapshot.selectedQuality : 'hd',
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
    const [state, dispatch] = useReducer(studioReducer, initialStudioState);
    const {
    activeContentTab,
    selectedModel,
    showModelPicker,
    selectedAspectRatio,
    selectedQuality,
        prompt,
        negativePrompt,
        seed,
        referenceImageUrl,
        referenceImageError,
        isReferenceImageUploading,
        referenceImageUploadError,
        referenceImageUploadProgress,
        searchQuery,
        communityListings,
        isCommunityLoading,
        projectId,
        isProjectLoading,
        isProjectSaving,
        projectError,
    } = state;

    const { startGeneration, reset, isGenerating, currentGeneration, error, generations, fetchGenerations, isLoading: isGenerationsLoading } = useGenerationStore();
    const { balance, fetchBalance } = useCreditStore();
    const contentScrollRef = useRef<HTMLDivElement | null>(null);
    const promptTextareaRef = useRef<HTMLTextAreaElement | null>(null);
    const referenceImageInputRef = useRef<HTMLInputElement | null>(null);
    const lastAutoSavedGenerationIdRef = useRef<string | null>(null);
    const currentModel = IMAGE_MODELS.find((model) => model.id === selectedModel) ?? IMAGE_MODELS[0];
    const { replace } = useRouter();
    const searchParams = useSearchParams();
    const searchParamsSnapshot = useMemo(() => new URLSearchParams(searchParams), [searchParams]);
    const isProjectBusy = isProjectLoading || isProjectSaving;

    useEffect(() => {
        fetchBalance();
    }, [fetchBalance]);

    useEffect(() => {
        const requestedProjectId = searchParamsSnapshot.get('projectId');
        dispatch({ type: 'setProjectId', projectId: requestedProjectId });

        const applySnapshot = (snapshot: Partial<ImageSnapshot>) => {
            dispatch({ type: 'applySnapshot', snapshot });
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
        dispatch({ type: 'setIsProjectLoading', isProjectLoading: true });

        void (async () => {
            try {
                const project = await projectApi.get(requestedProjectId);
                if (cancelled) return;

                applySnapshot(normalizeImageSnapshot(project.content));
            } catch (error) {
                console.error('Failed to load image project', error);
                if (!cancelled) {
                    dispatch({ type: 'setProjectError', projectError: 'Loaded local draft because backend project load failed.' });
                    loadDraft();
                }
            } finally {
                if (!cancelled) {
                    dispatch({ type: 'setIsProjectLoading', isProjectLoading: false });
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [searchParamsSnapshot]);


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
                dispatch({ type: 'setIsCommunityLoading', isCommunityLoading: true });
                try {
                    const res = await import('@/lib/api').then((m) => m.get<{ data: GalleryListing[] }>(`/community-marketplace/listings?type=${TemplateTypeEnum.IMAGE_GENERATOR}&limit=20`));
                    dispatch({ type: 'setCommunityListings', communityListings: res.data || [] });
                } catch (err) {
                    console.error('Failed to fetch community listings', err);
                } finally {
                    dispatch({ type: 'setIsCommunityLoading', isCommunityLoading: false });
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
        const parsedSeed = seed.trim() ? Number(seed) : undefined;
        if (seed.trim() && Number.isNaN(parsedSeed)) {
            toast.error('Seed must be a number.');
            return;
        }
        const trimmedReferenceImageUrl = referenceImageUrl.trim();
        if (trimmedReferenceImageUrl) {
            try {
                const parsedReferenceUrl = new URL(trimmedReferenceImageUrl);
                if (!['http:', 'https:'].includes(parsedReferenceUrl.protocol)) {
                    throw new Error('Invalid protocol');
                }
            } catch {
                toast.error('Reference image URL must be a valid http or https link.');
                return;
            }
        }
        await startGeneration('/generations/image', {
            prompt,
            model: selectedModel,
            aspectRatio: selectedAspectRatio,
            quality: selectedQuality,
            negativePrompt: negativePrompt.trim() || undefined,
            seed: parsedSeed,
            referenceImageUrl: trimmedReferenceImageUrl || undefined,
        });
        // Refresh balance after generation (approximate timing)
        setTimeout(() => fetchBalance(), 1000);
        setTimeout(() => fetchBalance(), 3000);
    };

    const handleClearSeed = () => {
        dispatch({ type: 'setSeed', seed: '' });
    };

    const handleClearReferenceImage = () => {
        dispatch({ type: 'setReferenceImageUrl', referenceImageUrl: '' });
        dispatch({ type: 'setReferenceImageUploadError', referenceImageUploadError: null });
        dispatch({ type: 'setReferenceImageUploadProgress', referenceImageUploadProgress: 0 });
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

        dispatch({ type: 'setReferenceImageUploading', isReferenceImageUploading: true });
        dispatch({ type: 'setReferenceImageUploadError', referenceImageUploadError: null });
        dispatch({ type: 'setReferenceImageUploadProgress', referenceImageUploadProgress: 0 });
        try {
            const uploaded = await mediaApi.uploadMedia(file, (progress) => {
                dispatch({ type: 'setReferenceImageUploadProgress', referenceImageUploadProgress: progress });
            });
            if (uploaded?.url) {
                dispatch({ type: 'setReferenceImageUrl', referenceImageUrl: uploaded.url });
                toast.success('Reference image uploaded.');
            } else {
                dispatch({ type: 'setReferenceImageUploadError', referenceImageUploadError: 'Failed to upload the selected reference image.' });
                toast.error('Failed to upload reference image.');
            }
        } catch (error) {
            console.error('Reference image upload failed', error);
            dispatch({ type: 'setReferenceImageUploadError', referenceImageUploadError: 'Failed to upload the selected reference image.' });
            toast.error('Failed to upload reference image.');
        } finally {
            event.target.value = '';
            dispatch({ type: 'setReferenceImageUploading', isReferenceImageUploading: false });
            dispatch({ type: 'setReferenceImageUploadProgress', referenceImageUploadProgress: 0 });
        }
    };

    const handleReferenceMediaSelect = (media: MediaItem) => {
        dispatch({ type: 'setReferenceImageUrl', referenceImageUrl: media.url });
        dispatch({ type: 'setReferencePickerOpen', isReferencePickerOpen: false });
        toast.success('Reference image selected from uploads.');
    };

    const handleResetForm = () => {
        reset();
        dispatch({
            type: 'resetForm',
        });
    };

    const handleSaveProject = useCallback(() => {
        const payload: ImageProjectPayload = {
            version: 1,
            savedAt: new Date().toISOString(),
            snapshot: {
                activeContentTab,
                selectedModel,
                selectedAspectRatio,
                selectedQuality,
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
            dispatch({ type: 'setIsProjectSaving', isProjectSaving: true });
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
                    dispatch({ type: 'setProjectId', projectId: created.project.id });
                    replace(`${window.location.pathname}?projectId=${created.project.id}`);
                }

                dispatch({ type: 'setProjectError', projectError: null });
                toast.success('Image generator draft saved to your projects.');
            } catch (error) {
                console.error('Failed to persist image project', error);
                dispatch({ type: 'setProjectError', projectError: 'Saved locally, but backend project save failed.' });
                toast.error('Saved locally, but backend project save failed.');
            } finally {
                dispatch({ type: 'setIsProjectSaving', isProjectSaving: false });
            }
        };

        void persistProject();
    }, [
        activeContentTab,
        currentGeneration?.resultUrl,
        negativePrompt,
        prompt,
        projectId,
        referenceImageUrl,
        replace,
        searchQuery,
        seed,
        selectedAspectRatio,
        selectedModel,
        selectedQuality,
    ]);

    useEffect(() => {
        if (!currentGeneration || currentGeneration.status !== 'completed') {
            return;
        }

        if (lastAutoSavedGenerationIdRef.current === currentGeneration.id) {
            return;
        }

        lastAutoSavedGenerationIdRef.current = currentGeneration.id;
        handleSaveProject();
    }, [currentGeneration, handleSaveProject]);

    const normalizedSearch = searchQuery.trim().toLowerCase();
    const filteredGenerations = normalizedSearch
        ? generations.filter((generation) => generation.prompt.toLowerCase().includes(normalizedSearch))
        : generations;
    const filteredCommunityListings = normalizedSearch
        ? communityListings.filter((listing) => listing.title.toLowerCase().includes(normalizedSearch))
        : communityListings;

    const openPromptRecipes = () => {
        dispatch({ type: 'setActiveContentTab', activeContentTab: CONTENT_TABS[3] });
        window.setTimeout(() => {
            promptTextareaRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
            promptTextareaRef.current?.focus();
        }, 0);
    };

    const handleReuseGenerationPrompt = (promptValue: string) => {
        dispatch({ type: 'setPrompt', prompt: promptValue });
        dispatch({ type: 'setActiveContentTab', activeContentTab: CONTENT_TABS[3] });
        window.setTimeout(() => {
            promptTextareaRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
            promptTextareaRef.current?.focus();
        }, 0);
        toast.success('Prompt sent to recipes');
    };

    const applyPromptRecipe = (recipe: PromptRecipe) => {
        dispatch({ type: 'setPrompt', prompt: recipe.prompt });
        dispatch({ type: 'setNegativePrompt', negativePrompt: recipe.negativePrompt });
        dispatch({ type: 'setSelectedAspectRatio', selectedAspectRatio: recipe.aspectRatio });
        dispatch({ type: 'setSelectedQuality', selectedQuality: recipe.quality });
        if (recipe.model) {
            dispatch({ type: 'setSelectedModel', selectedModel: recipe.model });
        }
        window.setTimeout(() => {
            promptTextareaRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
            promptTextareaRef.current?.focus();
        }, 0);
        toast.success(`Applied ${recipe.title} recipe`);
    };

    return (
        <CreatorWorkspaceShell>
            {/* Left Control Panel */}
            <div className="w-80 h-full min-h-0 shrink-0 border-r border-border bg-background flex flex-col">
                {/* Tabs */}
                {/* Header - Aligned height h-14 */}
                <div className="h-14 px-6 border-b border-border flex items-center shrink-0 bg-background/95 backdrop-blur">
                    <h2 className="font-semibold text-muted-foreground">Image Generator</h2>
                </div>

                {/* Control Content */}
                <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-4 pt-6 space-y-6">
                {/* Browse Templates Button */}
                    <TemplateExplorerModal
                        defaultCategory={TemplateTypeEnum.IMAGE_GENERATOR}
                        title="Image templates"
                        description="Browse live image templates from the API, search them, and reuse a prompt in one click."
                        onSelectTemplate={(template) => {
                            dispatch({ type: 'setPrompt', prompt: template.title });
                            window.setTimeout(() => {
                                promptTextareaRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
                                promptTextareaRef.current?.focus();
                            }, 0);
                            toast.success(`Applied ${template.title}`);
                        }}
                    >
                        <button
                            type="button"
                            onClick={() => {
                                dispatch({ type: 'setActiveContentTab', activeContentTab: CONTENT_TABS[2] });
                            }}
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
                    </TemplateExplorerModal>

                    {/* MODEL */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-medium text-muted-foreground">Model</h4>
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => dispatch({ type: 'setShowModelPicker', showModelPicker: !showModelPicker })}
                                className="flex items-center justify-between w-full px-4 py-3 bg-card rounded-xl border border-border hover:border-border/80 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <Sparkles className="size-5 text-muted-foreground" />
                                    <div className="text-left">
                                        <p className="text-sm font-medium">{currentModel.label}</p>
                                        <p className="text-[10px] text-muted-foreground">
                                            {currentModel.id === 'auto' ? 'Backend chooses the best match' : 'Selected model for this prompt'}
                                        </p>
                                    </div>
                                </div>
                                <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", showModelPicker && "rotate-180")} />
                            </button>
                            {showModelPicker && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg z-10 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                                    {IMAGE_MODELS.map((model) => (
                                        <button
                                            key={model.id}
                                            type="button"
                                            onClick={() => {
                                                dispatch({ type: 'setSelectedModel', selectedModel: model.id });
                                                dispatch({ type: 'setShowModelPicker', showModelPicker: false });
                                            }}
                                            className={cn(
                                                "w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-accent transition-colors",
                                                selectedModel === model.id && "bg-accent",
                                            )}
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-medium">{model.label}</p>
                                                <p className="text-[10px] text-muted-foreground truncate">
                                                    {model.id === 'auto' ? 'Backend chooses the best match' : `Generate with ${model.label}`}
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <p className="text-[10px] leading-4 text-muted-foreground">
                            Choose the model you want. The backend will route it to the right provider automatically.
                        </p>
                    </div>

                    {/* PROMPT */}
                    <div className="space-y-3 flex-1 flex flex-col">
                        <h4 className="text-sm font-medium text-muted-foreground">Prompt</h4>
                        <div className="bg-card rounded-xl border border-border p-2 flex-1">
                            <textarea
                                ref={promptTextareaRef}
                                value={prompt}
                                onChange={(e) => dispatch({ type: 'setPrompt', prompt: e.target.value })}
                                placeholder="Describe the subject, scene, style, and mood"
                                className="w-full h-40 bg-transparent text-sm placeholder:text-muted-foreground resize-none focus:outline-none p-2"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <h4 className="text-sm font-medium text-muted-foreground">Aspect ratio</h4>
                                <div className="grid grid-cols-2 gap-1.5">
                                    {[
                                        { value: '1:1', label: '1:1' },
                                        { value: '4:3', label: '4:3' },
                                        { value: '16:9', label: '16:9' },
                                        { value: '9:16', label: '9:16' },
                                    ].map((ratio) => (
                                        <button
                                            key={ratio.value}
                                            type="button"
                                            onClick={() => dispatch({ type: 'setSelectedAspectRatio', selectedAspectRatio: ratio.value })}
                                            className={cn(
                                                "py-2 rounded-lg text-[10px] font-medium transition-all border",
                                                selectedAspectRatio === ratio.value ? "bg-accent border-primary/20 text-foreground" : "bg-card border-border text-muted-foreground",
                                            )}
                                        >
                                            {ratio.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h4 className="text-sm font-medium text-muted-foreground">Quality</h4>
                                <div className="grid grid-cols-3 gap-1.5">
                                    {[
                                        { value: 'standard', label: 'Standard' },
                                        { value: 'hd', label: 'HD' },
                                        { value: '4k', label: '4K' },
                                    ].map((quality) => (
                                        <button
                                            key={quality.value}
                                            type="button"
                                            onClick={() => dispatch({ type: 'setSelectedQuality', selectedQuality: quality.value as 'standard' | 'hd' | '4k' })}
                                            className={cn(
                                                "py-2 rounded-lg text-[10px] font-medium transition-all border",
                                                selectedQuality === quality.value ? "bg-accent border-primary/20 text-foreground" : "bg-card border-border text-muted-foreground",
                                            )}
                                        >
                                            {quality.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h4 className="text-sm font-medium text-muted-foreground">Negative prompt</h4>
                            <div className="bg-card rounded-xl border border-border p-2">
                                <textarea
                                    value={negativePrompt}
                                    onChange={(event) => dispatch({ type: 'setNegativePrompt', negativePrompt: event.target.value })}
                                    placeholder="Things to avoid, e.g. blurry faces, text, watermark, extra fingers"
                                    className="w-full h-24 bg-transparent text-sm placeholder:text-muted-foreground resize-none focus:outline-none p-2"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between gap-3">
                                    <h4 className="text-sm font-medium text-muted-foreground">Seed</h4>
                                    <span className="text-[10px] text-muted-foreground">Leave blank for random</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        value={seed}
                                        onChange={(event) => dispatch({ type: 'setSeed', seed: event.target.value })}
                                        placeholder="Any whole number"
                                        className="h-10"
                                    />
                                    {seed && (
                                        <Button type="button" variant="ghost" size="sm" className="h-10 px-3" onClick={handleClearSeed}>
                                            Clear
                                        </Button>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <h4 className="text-sm font-medium text-muted-foreground">Reference image URL</h4>
                                <div className="space-y-2">
                                    <Input
                                        type="url"
                                        value={referenceImageUrl}
                                        onChange={(event) => dispatch({ type: 'setReferenceImageUrl', referenceImageUrl: event.target.value })}
                                        placeholder="Paste a valid http(s) reference URL"
                                        className="h-10"
                                    />
                                    <p className="text-[10px] leading-snug text-muted-foreground">
                                        Direct image link or upload below. Broken links fall back to a preview card.
                                    </p>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            className="h-8 px-3 whitespace-nowrap"
                                            disabled={isReferenceImageUploading}
                                            onClick={() => referenceImageInputRef.current?.click()}
                                        >
                                            {isReferenceImageUploading
                                                ? `Uploading${referenceImageUploadProgress > 0 ? ` ${referenceImageUploadProgress}%` : '...' }`
                                                : 'Upload image'}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="h-8 px-3 whitespace-nowrap"
                                            disabled={isReferenceImageUploading}
                                            onClick={() => dispatch({ type: 'setReferencePickerOpen', isReferencePickerOpen: true })}
                                        >
                                            Choose from uploads
                                        </Button>
                                        {referenceImageUrl && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 px-3 whitespace-nowrap"
                                                onClick={handleClearReferenceImage}
                                            >
                                                Clear
                                            </Button>
                                        )}
                                    </div>
                                    {referenceImageUploadError && (
                                        <p className="text-[10px] text-destructive">{referenceImageUploadError}</p>
                                    )}
                                    {isReferenceImageUploading && (
                                        <div className="space-y-1">
                                            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                                <div
                                                    className="h-full rounded-full bg-primary transition-all"
                                                    style={{ width: `${Math.max(4, referenceImageUploadProgress)}%` }}
                                                />
                                            </div>
                                            <p className="text-[10px] text-muted-foreground">Uploading reference image...</p>
                                        </div>
                                    )}
                                    {referenceImageUrl && (
                                        <div className="relative aspect-[16/9] overflow-hidden rounded-xl border border-border bg-card">
                                            {referenceImageError ? (
                                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted/40 px-4 text-center">
                                                    <div className="size-12 rounded-full bg-background flex items-center justify-center border border-border">
                                                        <Upload className="size-5 text-muted-foreground" />
                                                    </div>
                                                    <p className="text-xs font-medium text-foreground">Preview unavailable</p>
                                                    <p className="text-[10px] text-muted-foreground max-w-[200px]">{referenceImageError}</p>
                                                </div>
                                            ) : (
                                                <Image
                                                    src={referenceImageUrl}
                                                    alt="Reference image preview"
                                                    fill
                                                    className="object-cover"
                                                    sizes="320px"
                                                    unoptimized
                                                    onError={() => dispatch({ type: 'setReferenceImageError', referenceImageError: 'Could not load that reference image.' })}
                                                />
                                            )}
                                        </div>
                                    )}
                                    <input
                                        ref={referenceImageInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleReferenceImageUpload}
                                    />
                                    <MediaPickerModal
                                        isOpen={state.isReferencePickerOpen}
                                        onClose={() => dispatch({ type: 'setReferencePickerOpen', isReferencePickerOpen: false })}
                                        onSelect={handleReferenceMediaSelect}
                                        mediaType="image"
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
                                Generating image...
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
            <div ref={contentScrollRef} className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-background flex flex-col">
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
                    <div className="flex items-center gap-1 pl-1">
                        {CONTENT_TABS.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => dispatch({ type: 'setActiveContentTab', activeContentTab: tab })}
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
                                onChange={(event) => dispatch({ type: 'setSearchQuery', searchQuery: event.target.value })}
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
                                        <GenerationCard key={gen.id} generation={gen} onReuse={() => handleReuseGenerationPrompt(gen.prompt)} />
                                    ))}
                                </div>
                            ) : (
                                <EmptyState
                                    message={normalizedSearch ? 'No generations match your search.' : 'No generations yet. Start creating!'}
                                    actionLabel="Open prompt recipes"
                                    onAction={openPromptRecipes}
                                />
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
                                        <TemplateCard
                                            key={listing.id}
                                            template={listing}
                                            onClick={() => {
                                                dispatch({ type: 'setPrompt', prompt: listing.title });
                                                window.setTimeout(() => {
                                                    promptTextareaRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
                                                    promptTextareaRef.current?.focus();
                                                }, 0);
                                            }}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <EmptyState
                                    message={normalizedSearch ? 'No community creations match your search.' : 'Community is quiet today.'}
                                    actionLabel="Open prompt recipes"
                                    onAction={openPromptRecipes}
                                />
                            )}
                        </section>
                    )}

                    {activeContentTab === CONTENT_TABS[2] && ( // Templates
                        <TemplatesTab
                            onSelectPrompt={(value) => {
                                dispatch({ type: 'setPrompt', prompt: value });
                                window.setTimeout(() => {
                                    promptTextareaRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
                                    promptTextareaRef.current?.focus();
                                }, 0);
                            }}
                            onOpenRecipes={openPromptRecipes}
                            searchTerm={searchQuery}
                        />
                    )}

                    {activeContentTab === CONTENT_TABS[3] && ( // Tutorials
                        <section className="space-y-6">
                            <div className="space-y-2">
                                <h2 className="text-lg font-semibold">Prompt recipes</h2>
                                <p className="text-sm text-muted-foreground">
                                    Use one of these starting points when you want a prompt that is specific enough to produce consistent results.
                                </p>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                {IMAGE_PROMPT_RECIPES.map((recipe) => (
                                    <button
                                        key={recipe.title}
                                        type="button"
                                        onClick={() => applyPromptRecipe(recipe)}
                                        className="group rounded-2xl border border-border bg-card p-5 text-left transition-colors hover:border-primary/40 hover:bg-accent/40"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <h3 className="font-semibold">{recipe.title}</h3>
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    {recipe.aspectRatio} composition
                                                </p>
                                            </div>
                                            <span className="rounded-full border border-border px-2 py-1 text-xs font-medium text-muted-foreground group-hover:text-foreground">
                                                Use recipe
                                            </span>
                                        </div>
                                        <p className="mt-4 text-sm leading-6 text-muted-foreground">{recipe.hint}</p>
                                        <div className="mt-4 space-y-3 text-xs text-muted-foreground">
                                            <div>
                                                <span className="font-medium text-foreground">Prompt</span>
                                                <p className="mt-1 line-clamp-3">{recipe.prompt}</p>
                                            </div>
                                            <div>
                                                <span className="font-medium text-foreground">Avoid</span>
                                                <p className="mt-1 line-clamp-2">{recipe.negativePrompt}</p>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <span className="rounded-full border border-border px-2 py-1 text-xs font-medium text-muted-foreground">
                                                    {recipe.quality}
                                                </span>
                                                {recipe.model && (
                                                    <span className="rounded-full border border-border px-2 py-1 text-xs font-medium text-muted-foreground">
                                                        {recipe.model === 'z_image_turbo_bf16.safetensors' ? 'Z-Image-Turbo' : recipe.model}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="rounded-2xl bg-card border border-border p-6 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold">Quick start</h3>
                                        <span className="text-xs font-medium text-muted-foreground">3 steps</span>
                                    </div>
                                    <ol className="space-y-3 text-sm text-muted-foreground">
                                        <li className="flex gap-3">
                                            <span className="font-semibold text-foreground">1.</span>
                                            Pick a recipe above or start from a blank prompt.
                                        </li>
                                        <li className="flex gap-3">
                                            <span className="font-semibold text-foreground">2.</span>
                                            Add the subject, lighting, composition, and quality you want the backend to try first.
                                        </li>
                                        <li className="flex gap-3">
                                            <span className="font-semibold text-foreground">3.</span>
                                            Generate, review the result, then save it for later.
                                        </li>
                                    </ol>
                                </div>
                                <div className="rounded-2xl bg-card border border-border p-6 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold">Production tips</h3>
                                        <span className="text-xs font-medium text-muted-foreground">Best practice</span>
                                    </div>
                                    <ul className="space-y-3 text-sm text-muted-foreground">
                                        <li>Use a specific subject, lighting, and composition to reduce retries.</li>
                                        <li>Keep the prompt focused and use negative prompts for unwanted artifacts, extra text, or broken anatomy.</li>
                                        <li>Match quality and aspect ratio before rerunning, so you only spend credits on the right format.</li>
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

function TemplatesTab({
    onSelectPrompt,
    onOpenRecipes,
    searchTerm,
}: {
    onSelectPrompt: (prompt: string) => void;
    onOpenRecipes: () => void;
    searchTerm: string;
}) {
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
                    <span className="text-xs font-medium text-muted-foreground">
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
                    <EmptyState
                        message={normalizedSearch ? 'No templates match your search.' : 'No templates available yet.'}
                        actionLabel="Open prompt recipes"
                        onAction={onOpenRecipes}
                    />
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
                    <span className="text-xs font-medium text-muted-foreground">
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
                    <EmptyState
                        message={normalizedSearch ? 'No featured templates match your search.' : 'Featured templates will appear after the first page loads.'}
                        actionLabel="Open prompt recipes"
                        onAction={onOpenRecipes}
                    />
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

function EmptyState({
    message,
    actionLabel,
    onAction,
}: {
    message: string;
    actionLabel?: string;
    onAction?: () => void;
}) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="size-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Sparkles className="size-8 text-muted-foreground/30" />
            </div>
            <p className="text-muted-foreground">{message}</p>
            {actionLabel && onAction && (
                <Button type="button" variant="outline" size="sm" className="mt-4" onClick={onAction}>
                    {actionLabel}
                </Button>
            )}
        </div>
    );
}

function GenerationCard({
    generation,
    onReuse,
}: {
    generation: GeneratedCardData;
    onReuse: () => void;
}) {
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
            <Button type="button" variant="ghost" size="sm" className="mt-2 h-8 px-2 text-xs" onClick={onReuse}>
                Reuse prompt
            </Button>
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
