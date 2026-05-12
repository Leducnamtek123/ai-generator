'use client';

import Image from 'next/image';
import { Suspense, useEffect, useState, useRef, useMemo, useReducer } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useGenerationStore } from '@/stores/generation-store';
import { mediaApi } from '@/services/mediaApi';
import { projectApi } from '@/services/projectApi';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/ui/select';
import { Slider } from '@/ui/slider';
import { Label } from '@/ui/label';
import {
    Upload,
    Sparkles,
    Info,
    History,
    Download,
    Settings,
    Loader2,
    Image as ImageIcon,
    Target,
    Grid3X3,
    Clock,
    Repeat,
    FileText,
    Video,
    Save,
    ChevronDown,
    Folder
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';
import { Button } from '@/ui/button';
import { cn } from '@/lib/utils';
import { CreatorWorkspaceShell } from '@/components/layouts/CreatorWorkspaceShell';
import {
    UpscaleMode,
    UpscaleModel,
    UpscaleScale,
    UpscaleOptimization,
    UpscaleEngine,
    UpscaleParams
} from '@/types/upscaler';
import { MediaPickerModal } from '@/components/common/MediaPickerModal';
import { MediaItem } from '@/types/media';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';
import { PersonalGallery } from '@/components/upscaler/PersonalGallery';
import { getUserFacingErrorMessage } from '@/lib/async-operation';
const PRESETS = [
    { label: 'Subtle', value: 'subtle' },
    { label: 'Balanced', value: 'balanced' },
    { label: 'Strong', value: 'strong' },
    { label: 'Creative', value: 'creative' },
];

const initialParams: UpscaleParams = {
    mode: UpscaleMode.CREATIVE,
    model: UpscaleModel.MAGNIFIC,
    scale: UpscaleScale.X2,
    optimization: UpscaleOptimization.STANDARD_ULTRA,
    creativity: -3,
    hdr: 0,
    resemblance: 5,
    fractality: 0,
    engine: UpscaleEngine.AUTOMATIC,
    prompt: '',
};

type ImageUpscalerSnapshot = {
    uploadedImage: string | null;
    previewImage: string | null;
    resultImage: string | null;
    params: UpscaleParams;
};

type ImageUpscalerProjectPayload = {
    version: number;
    savedAt: string;
    snapshot: Partial<ImageUpscalerSnapshot>;
};

type ImageUpscalerLocalState = {
    params: UpscaleParams;
    uploadedImage: string | null;
    previewImage: string | null;
    restoredResultImage: string | null;
};

type ImageUpscalerLocalAction =
    | { type: 'hydrate'; snapshot: Partial<ImageUpscalerSnapshot> }
    | { type: 'set-params'; params: UpscaleParams }
    | { type: 'set-uploaded-image'; uploadedImage: string | null }
    | { type: 'set-preview-image'; previewImage: string | null }
    | { type: 'set-restored-result-image'; restoredResultImage: string | null }
    | { type: 'reset' };

const initialLocalState: ImageUpscalerLocalState = {
    params: initialParams,
    uploadedImage: null,
    previewImage: null,
    restoredResultImage: null,
};

function localReducer(state: ImageUpscalerLocalState, action: ImageUpscalerLocalAction): ImageUpscalerLocalState {
    switch (action.type) {
        case 'hydrate':
            return {
                params: { ...initialParams, ...(action.snapshot.params ?? {}) },
                uploadedImage: action.snapshot.uploadedImage ?? null,
                previewImage: action.snapshot.previewImage ?? action.snapshot.uploadedImage ?? null,
                restoredResultImage: action.snapshot.resultImage ?? null,
            };
        case 'set-params':
            return { ...state, params: action.params };
        case 'set-uploaded-image':
            return { ...state, uploadedImage: action.uploadedImage };
        case 'set-preview-image':
            return { ...state, previewImage: action.previewImage };
        case 'set-restored-result-image':
            return { ...state, restoredResultImage: action.restoredResultImage };
        case 'reset':
            return initialLocalState;
        default:
            return state;
    }
}

type ImageUpscalerUiState = {
    projectId: string | null;
    isProjectLoading: boolean;
    isProjectSaving: boolean;
    projectError: string | null;
    isMediaModalOpen: boolean;
};

type ImageUpscalerUiAction =
    | { type: 'set-project-id'; projectId: string | null }
    | { type: 'set-project-loading'; isLoading: boolean }
    | { type: 'set-project-saving'; isSaving: boolean }
    | { type: 'set-project-error'; error: string | null }
    | { type: 'set-media-modal-open'; isOpen: boolean };

const initialUiState: ImageUpscalerUiState = {
    projectId: null,
    isProjectLoading: false,
    isProjectSaving: false,
    projectError: null,
    isMediaModalOpen: false,
};

function uiReducer(state: ImageUpscalerUiState, action: ImageUpscalerUiAction): ImageUpscalerUiState {
    switch (action.type) {
        case 'set-project-id':
            return { ...state, projectId: action.projectId };
        case 'set-project-loading':
            return { ...state, isProjectLoading: action.isLoading };
        case 'set-project-saving':
            return { ...state, isProjectSaving: action.isSaving };
        case 'set-project-error':
            return { ...state, projectError: action.error };
        case 'set-media-modal-open':
            return { ...state, isMediaModalOpen: action.isOpen };
        default:
            return state;
    }
}

const normalizeImageUpscalerSnapshot = (value: unknown): Partial<ImageUpscalerSnapshot> => {
    const raw = (value ?? {}) as Record<string, unknown>;
    const snapshot = (raw.snapshot && typeof raw.snapshot === 'object' ? raw.snapshot : raw) as Record<string, unknown>;

    return {
        uploadedImage: typeof snapshot.uploadedImage === 'string' ? snapshot.uploadedImage : null,
        previewImage: typeof snapshot.previewImage === 'string' ? snapshot.previewImage : null,
        resultImage: typeof snapshot.resultImage === 'string' ? snapshot.resultImage : null,
        params: (snapshot.params && typeof snapshot.params === 'object' ? snapshot.params : initialParams) as UpscaleParams,
    };
};

export default function ImageUpscalerPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-background text-foreground" />}>
            <ImageUpscalerPageContent />
        </Suspense>
    );
}

function ImageUpscalerPageContent() {
    const { upscaleImage, isGenerating, currentGeneration, reset } = useGenerationStore();
    const [localState, dispatchLocal] = useReducer(localReducer, initialLocalState);
    const [uiState, dispatchUi] = useReducer(uiReducer, initialUiState);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const previewObjectUrlRef = useRef<string | null>(null);
    const { replace } = useRouter();
    const searchParams = useSearchParams();
    const searchParamsSnapshot = useMemo(() => new URLSearchParams(searchParams), [searchParams]);
    const { params, uploadedImage, previewImage } = localState;
    const localUpscaledImage = currentGeneration?.status === 'completed' ? currentGeneration.resultUrl ?? null : null;
    const resultImage = localUpscaledImage ?? localState.restoredResultImage;

    useEffect(() => {
        return () => {
            if (previewObjectUrlRef.current?.startsWith('blob:')) {
                URL.revokeObjectURL(previewObjectUrlRef.current);
            }
        };
    }, []);

    useEffect(() => {
        dispatchUi({ type: 'set-project-id', projectId: searchParamsSnapshot.get('projectId') });
    }, [searchParamsSnapshot]);

    useEffect(() => {
        let cancelled = false;

        const hydrateFromSnapshot = (snapshot: Partial<ImageUpscalerSnapshot>) => {
            dispatchLocal({ type: 'hydrate', snapshot });
        };

        const loadProject = async () => {
            if (!uiState.projectId) {
                try {
                    const raw = localStorage.getItem('image-upscaler:draft:v1');
                    if (raw) {
                        hydrateFromSnapshot(normalizeImageUpscalerSnapshot(JSON.parse(raw)));
                    }
                } catch (loadError) {
                    console.error('Failed to restore image upscaler draft', loadError);
                }
                return;
            }

            dispatchUi({ type: 'set-project-loading', isLoading: true });
            dispatchUi({ type: 'set-project-error', error: null });
            try {
                const project = await projectApi.get(uiState.projectId);
                const rawContent = project.content as string | Record<string, unknown> | null | undefined;
                const parsed = typeof rawContent === 'string' ? JSON.parse(rawContent) : rawContent;
                if (!cancelled) {
                    hydrateFromSnapshot(normalizeImageUpscalerSnapshot(parsed));
                }
            } catch (loadError) {
                console.error('Failed to restore image upscaler project', loadError);
                if (!cancelled) {
                    dispatchUi({ type: 'set-project-error', error: 'Could not load the saved image upscaler project. Falling back to a local draft.' });
                    try {
                        const draftKey = 'image-upscaler:draft:v1';
                        const raw = localStorage.getItem(draftKey);
                        if (raw) {
                            hydrateFromSnapshot(normalizeImageUpscalerSnapshot(JSON.parse(raw)));
                        }
                    } catch (fallbackError) {
                        console.error('Failed to restore image upscaler fallback', fallbackError);
                    }
                }
            } finally {
                if (!cancelled) {
                    dispatchUi({ type: 'set-project-loading', isLoading: false });
                }
            }
        };

        void loadProject();

        return () => {
            cancelled = true;
        };
    }, [uiState.projectId]);

    const setPreviewSource = (nextPreview: string | null) => {
        if (previewObjectUrlRef.current?.startsWith('blob:')) {
            URL.revokeObjectURL(previewObjectUrlRef.current);
        }

        previewObjectUrlRef.current = nextPreview?.startsWith('blob:') ? nextPreview : null;
        dispatchLocal({ type: 'set-preview-image', previewImage: nextPreview });
    };

    const updateParam = <K extends keyof UpscaleParams>(key: K, value: UpscaleParams[K]) => {
        dispatchLocal({ type: 'set-params', params: { ...localState.params, [key]: value } });
    };

    const handleSelectImage = (media: MediaItem) => {
        dispatchLocal({ type: 'set-uploaded-image', uploadedImage: media.url });
        setPreviewSource(media.url);
        reset(); // Reset previous generation
        dispatchUi({ type: 'set-media-modal-open', isOpen: false });
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            reset();
            void (async () => {
                const localPreviewUrl = URL.createObjectURL(file);
                setPreviewSource(localPreviewUrl);
                const uploaded = await mediaApi.uploadMedia(file);
                if (!uploaded?.url) {
                    toast.error('Upload failed. Please try again.');
                    if (previewObjectUrlRef.current === localPreviewUrl) {
                        setPreviewSource(null);
                    }
                    return;
                }
                dispatchLocal({ type: 'set-uploaded-image', uploadedImage: uploaded.url });
            })();
        }
    };

    const handleUpscale = async () => {
        if (!uploadedImage) return;

        try {
            await upscaleImage({
                imageUrl: uploadedImage,
                scale: Number(localState.params.scale) || 2,
                creativity: localState.params.creativity,
                hdr: localState.params.hdr,
                resemblance: localState.params.resemblance,
                model: localState.params.model,
                optimization: localState.params.optimization,
                engine: localState.params.engine,
                mode: localState.params.mode,
                prompt: localState.params.prompt?.trim() || undefined,
                fractality: localState.params.fractality,
            });
        } catch (error) {
            toast.error(getUserFacingErrorMessage(error, 'Failed to upscale image'));
        }
    };

    const handleSave = () => {
        const snapshot: Partial<ImageUpscalerSnapshot> = {
            uploadedImage,
            previewImage: localState.previewImage,
            resultImage,
            params: localState.params,
        };
        const payload: ImageUpscalerProjectPayload = {
            version: 1,
            savedAt: new Date().toISOString(),
            snapshot,
        };

        localStorage.setItem('image-upscaler:draft:v1', JSON.stringify(payload));

        const persistProject = async () => {
            dispatchUi({ type: 'set-project-saving', isSaving: true });
            try {
                if (uiState.projectId) {
                    await projectApi.update(uiState.projectId, {
                        name: 'Image Upscaler Draft',
                        description: 'Image upscaler draft',
                        content: payload,
                    });
                } else {
                    const created = await projectApi.create({
                        name: 'Image Upscaler Draft',
                        description: 'Image upscaler draft',
                        content: payload,
                    });
                    dispatchUi({ type: 'set-project-id', projectId: created.project.id });
                    replace(`${window.location.pathname}?projectId=${created.project.id}`);
                }

                toast.success('Image upscaler saved to your projects.');
            } catch (saveError) {
                console.error('Failed to persist image upscaler project', saveError);
                toast.error('Saved locally, but backend project save failed.');
            } finally {
                dispatchUi({ type: 'set-project-saving', isSaving: false });
            }
        };

        void persistProject();
    };

    const handleExport = () => {
        const payload = {
            version: 1,
            exportedAt: new Date().toISOString(),
            uploadedImage,
            previewImage,
            resultImage: localUpscaledImage,
            params,
        };

        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'image-upscaler-export.json';
        link.click();
        URL.revokeObjectURL(url);
        toast.success('Image upscaler export created.');
    };

    const handleReset = () => {
        reset();
        dispatchLocal({ type: 'reset' });
        setPreviewSource(null);
        dispatchLocal({ type: 'set-restored-result-image', restoredResultImage: null });
        dispatchUi({ type: 'set-project-error', error: null });
    };

    const triggerUpload = () => {
        fileInputRef.current?.click();
    };

    return (
        <CreatorWorkspaceShell>
            {/* Left Control Panel */}
            <div className="w-[340px] border-r border-border flex flex-col shrink-0 bg-background">
                {/* Header - Aligned height h-14 */}
                <div className="h-14 px-6 border-b border-border flex items-center justify-between shrink-0">
                    <h2 className="font-semibold text-muted-foreground">Image Upscaler</h2>
                    <span className="text-xs text-muted-foreground">
                        {uiState.isProjectLoading ? 'Loading project...' : uiState.projectError ?? ''}
                    </span>
                </div>

                {/* Control Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6  gap-y-8">
                    {/* ... (Keep existing control content) ... */}
                    {/* Mode Selector */}
                    <div className="grid grid-cols-2 p-1 bg-muted rounded-xl border border-border">
                        <button
                            onClick={() => updateParam('mode', UpscaleMode.CREATIVE)}
                            className={cn(
                                "py-2 text-[11px] font-medium rounded-lg transition-all",
                                params.mode === UpscaleMode.CREATIVE
                                    ? "bg-background text-foreground shadow-lg border border-border"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            Creative
                        </button>
                        <button
                            onClick={() => updateParam('mode', UpscaleMode.PRECISION)}
                            className={cn(
                                "py-2 text-[11px] font-medium rounded-lg transition-all",
                                params.mode === UpscaleMode.PRECISION
                                    ? "bg-background text-foreground shadow-lg border border-border"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            Precision
                        </button>
                    </div>

                    <div className="space-y-3">
                        <div
                            onClick={triggerUpload}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    triggerUpload();
                                }
                            }}
                            className="group relative aspect-[4/3] rounded-2xl bg-muted border border-dashed border-border hover:border-primary/30 transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center gap-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            {previewImage ? (
                                <Image src={previewImage} alt="Preview" fill className="object-cover" sizes="(max-width: 768px) 100vw, 340px" unoptimized />
                            ) : (
                                <>
                                    <div className="size-12 rounded-xl bg-accent flex items-center justify-center group-hover:scale-110 transition-all">
                                        <Upload className="size-6 text-muted-foreground group-hover:text-foreground" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs font-medium text-foreground">Source Image</p>
                                        <p className="text-[10px] text-muted-foreground mt-1">Drop or click here</p>
                                    </div>
                                </>
                            )}

                            {/* Library Overlay */}
                            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                    type="button"
                                    size="icon"
                                    variant="secondary"
                                    className="size-8 rounded-lg"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        dispatchUi({ type: 'set-media-modal-open', isOpen: true });
                                    }}
                                >
                                    <Grid3X3 className="size-4" />
                                </Button>
                            </div>
                        </div>

                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileUpload}
                        />
                    </div>

                    {/* Tool Parameters */}
                    <div className="space-y-6">
                        {/* Model & Preset Row */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <Sparkles className="size-3" />
                                    Model
                                </Label>
                                <Select
                                    value={params.model}
                                    onValueChange={(val) => updateParam('model', val as UpscaleModel)}
                                >
                                    <SelectTrigger className="w-full h-11 bg-muted border-border rounded-xl px-4 text-xs font-medium">
                                        <SelectValue placeholder="Select model" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.values(UpscaleModel).map(m => (
                                            <SelectItem key={m} value={m}>
                                                {m.charAt(0).toUpperCase() + m.slice(1).replace('-', ' ')}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-muted-foreground">Presets</Label>
                                <Select defaultValue="subtle">
                                    <SelectTrigger className="w-full h-11 bg-muted border-border rounded-xl px-4 text-xs font-medium">
                                        <SelectValue placeholder="Select preset" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {PRESETS.map(p => (
                                            <SelectItem key={p.value} value={p.value}>
                                                {p.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Scale & Optimized For Row */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-muted-foreground">Scale Factor</Label>
                                <Select
                                    value={params.scale.toString()}
                                    onValueChange={(val) => updateParam('scale', Number(val) as UpscaleScale)}
                                >
                                    <SelectTrigger className="w-full h-10 bg-muted border-border rounded-xl px-3 text-xs font-bold">
                                        <SelectValue placeholder="Scale" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="2">2x</SelectItem>
                                        <SelectItem value="4">4x</SelectItem>
                                        <SelectItem value="8">8x</SelectItem>
                                        <SelectItem value="16">16x</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-muted-foreground">Optimized For</Label>
                                <Select
                                    value={params.optimization}
                                    onValueChange={(val) => updateParam('optimization', val as UpscaleOptimization)}
                                >
                                    <SelectTrigger className="w-full h-10 bg-muted border-border rounded-xl px-3 text-xs font-bold">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.values(UpscaleOptimization).map(o => (
                                            <SelectItem key={o} value={o}>
                                                {o.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Sliders Section */}
                        <div className="space-y-5 pt-2">
                            {/* Creativity Slider */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-medium text-muted-foreground">Creativity</span>
                                        <Info className="size-3 text-muted-foreground" />
                                    </div>
                                    <span className="text-[11px] font-mono text-foreground">{params.creativity}</span>
                                </div>
                                <Slider
                                    min={-10} max={10} step={1}
                                    value={[params.creativity]}
                                    onValueChange={([val]) => updateParam('creativity', val)}
                                />
                            </div>

                            {/* HDR Slider */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-medium text-muted-foreground">HDR</span>
                                        <Info className="size-3 text-muted-foreground" />
                                    </div>
                                    <span className="text-[11px] font-mono text-foreground">{params.hdr}</span>
                                </div>
                                <Slider
                                    min={0} max={10} step={1}
                                    value={[params.hdr]}
                                    onValueChange={([val]) => updateParam('hdr', val)}
                                />
                            </div>

                            {/* Resemblance Slider */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-medium text-muted-foreground">Resemblance</span>
                                        <Info className="size-3 text-muted-foreground" />
                                    </div>
                                    <span className="text-[11px] font-mono text-foreground">{params.resemblance}</span>
                                </div>
                                <Slider
                                    min={0} max={10} step={1}
                                    value={[params.resemblance]}
                                    onValueChange={([val]) => updateParam('resemblance', val)}
                                />
                            </div>
                        </div>

                        {/* Engine Selection */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-muted-foreground">Engine</Label>
                            <Select
                                value={params.engine}
                                onValueChange={(val) => updateParam('engine', val as UpscaleEngine)}
                            >
                                <SelectTrigger className="w-full h-11 bg-muted border-border rounded-xl px-4 text-xs font-medium">
                                    <SelectValue placeholder="Select engine" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={UpscaleEngine.AUTOMATIC}>Automatic Stable</SelectItem>
                                    <SelectItem value={UpscaleEngine.ENGINE_V1}>High Performance V1</SelectItem>
                                    <SelectItem value={UpscaleEngine.ENGINE_V2}>Extreme Detail V2</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Prompt Guidance */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-muted-foreground">Prompt Guidance</Label>
                            <textarea
                                placeholder="Describe details to enhance?"
                                value={params.prompt}
                                onChange={(e) => updateParam('prompt', e.target.value)}
                                className="w-full h-24 bg-muted border border-border rounded-xl p-3 text-xs font-medium resize-none outline-none focus:ring-2 focus:ring-ring transition-all placeholder:text-muted-foreground"
                            />
                        </div>
                    </div>
                </div>

                {/* Upscale Action - Pinned to Sidebar Bottom */}
                <div className="p-4 border-t border-border bg-background">
                        <Button
                            onClick={handleUpscale}
                            disabled={isGenerating || !uploadedImage || uiState.isProjectLoading || uiState.isProjectSaving}
                            className="w-full h-12 font-bold rounded-xl gap-2 shadow-sm"
                        >
                        {isGenerating ? (
                            <>
                                <Loader2 className="size-5 animate-spin" />
                                Upscaling?
                            </>
                        ) : (
                            <>
                                <Sparkles className="size-5" />
                                Upscale
                            </>
                        )}
                    </Button>
                </div>
            </div>



            {/* Main Preview Area */}
            <div className="flex-1 flex flex-col bg-background relative min-w-0">
                {/* Post-Upscale Header */}
                {(localUpscaledImage || currentGeneration?.status === 'completed') && (
                    <div className="h-14 px-6 border-b border-border flex items-center justify-end gap-2 shrink-0 animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center gap-2 mr-auto text-xs text-muted-foreground">
                            <Clock className="size-3.5" />
                            <span>Just now</span>
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="secondary" size="sm" className="gap-2">
                                    <Repeat className="size-4" />
                                    Reuse
                                    <ChevronDown className="size-3.5 opacity-50" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>Reuse Image As</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                    <FileText className="size-4 mr-2" />
                                    <span>Prompt</span>
                                    <span className="ml-auto text-xs text-muted-foreground">Get prompt</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <Repeat className="size-4 mr-2" />
                                    <span>Reimagine</span>
                                    <span className="ml-auto text-xs text-muted-foreground">Variations</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <Sparkles className="size-4 mr-2" />
                                    <span>Style Reference</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <Video className="size-4 mr-2" />
                                    <span>Video</span>
                                    <span className="ml-auto text-xs text-muted-foreground">Img2Vid</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Button variant="ghost" size="sm" className="gap-2" onClick={handleReset}>
                            Reset
                        </Button>
                        <Button variant="outline" size="sm" className="gap-2" onClick={handleSave} disabled={uiState.isProjectLoading || uiState.isProjectSaving}>
                            <Folder className="size-4" />
                            Save
                        </Button>
                        <Button size="sm" className="gap-2" onClick={handleExport}>
                            <Download className="size-4" />
                            Export
                        </Button>
                    </div>
                )}

                {/* Content Area with Split View */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Show Gallery until the Upscaled Result is ready */}
                    {!localUpscaledImage && (
                        <PersonalGallery />
                    )}

                    {/* Show Result only when Upscaled Image is available */}
                    {resultImage && (
                        <div className="flex-1 flex items-center justify-center p-8 animate-in fade-in zoom-in-95 duration-500">
                            <ReactCompareSlider
                                itemOne={
                                    <ReactCompareSliderImage
                                        src={uploadedImage || ''}
                                        alt="Original"
                                    />
                                }
                                itemTwo={
                                    <ReactCompareSliderImage
                                        src={resultImage}
                                        alt="Upscaled"
                                    />
                                }
                                position={50}
                                className="rounded-xl overflow-hidden border border-border shadow-2xl max-h-[80vh] w-auto h-full"
                            />
                        </div>
                    )}
                </div>
            </div>

            <MediaPickerModal
                isOpen={uiState.isMediaModalOpen}
                onClose={() => dispatchUi({ type: 'set-media-modal-open', isOpen: false })}
                onSelect={handleSelectImage}
                mediaType="image"
            />
        </CreatorWorkspaceShell>
    );
}
