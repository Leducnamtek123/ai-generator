'use client';

import Image from 'next/image';
import { Suspense, useEffect, useReducer, useRef, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useGenerationStore } from '@/stores/generation-store';
import {
    Upload,
    Download,
    Sparkles,
    Loader2,
    Crop,
    Palette,
    Layers,
    Type,
    Eraser,
    RotateCcw,
    RotateCw,
    FlipHorizontal,
    FlipVertical,
    Sun,
    Contrast,
    Droplets,
    Eye,
    ZoomIn,
    ZoomOut,
    Undo2,
    Redo2,
    Move,
    Square,
    Grid3X3,
    Folder,
    Wand2,
    Brush,
    MousePointer,
} from 'lucide-react';
import { Button } from '@/ui/button';
import { Slider } from '@/ui/slider';
import { Label } from '@/ui/label';
import { cn } from '@/lib/utils';
import { CreatorWorkspaceShell } from '@/components/layouts/CreatorWorkspaceShell';
import { uploadFileWithToast } from '@/lib/upload';
import { projectApi } from '@/services/projectApi';
import { toast } from 'sonner';

const tools = [
    { id: 'select', icon: MousePointer, label: 'Select' },
    { id: 'move', icon: Move, label: 'Move' },
    { id: 'crop', icon: Crop, label: 'Crop' },
    { id: 'brush', icon: Brush, label: 'Brush' },
    { id: 'eraser', icon: Eraser, label: 'Eraser' },
    { id: 'text', icon: Type, label: 'Text' },
    { id: 'shape', icon: Square, label: 'Shapes' },
    { id: 'ai', icon: Wand2, label: 'AI Edit' },
];

const aiTools = [
    { id: 'remove-object', label: 'Remove Object', description: 'Click on any object to remove it', icon: Eraser },
    { id: 'replace-bg', label: 'Replace Background', description: 'AI-generated backgrounds', icon: Layers },
    { id: 'enhance', label: 'Enhance Quality', description: 'Upscale and sharpen image', icon: Sparkles },
    { id: 'colorize', label: 'Colorize', description: 'Add color to B&W photos', icon: Palette },
    { id: 'expand', label: 'Expand Image', description: 'AI outpainting to extend', icon: Grid3X3 },
];

const filters = [
    { id: 'none', label: 'None' },
    { id: 'vivid', label: 'Vivid' },
    { id: 'warm', label: 'Warm' },
    { id: 'cool', label: 'Cool' },
    { id: 'bw', label: 'B&W' },
    { id: 'vintage', label: 'Vintage' },
    { id: 'cinema', label: 'Cinema' },
    { id: 'dramatic', label: 'Dramatic' },
];

const adjustmentControls = [
    { key: 'brightness', label: 'Brightness', icon: Sun, min: -100, max: 100 },
    { key: 'contrast', label: 'Contrast', icon: Contrast, min: -100, max: 100 },
    { key: 'saturation', label: 'Saturation', icon: Droplets, min: -100, max: 100 },
    { key: 'sharpness', label: 'Sharpness', icon: Eye, min: 0, max: 100 },
    { key: 'temperature', label: 'Temperature', icon: Sun, min: -100, max: 100 },
] as const;

type AdjustmentKey = 'brightness' | 'contrast' | 'saturation' | 'sharpness' | 'blur' | 'temperature';
type PanelTab = 'adjust' | 'filters' | 'ai';

type ImageEditorSnapshot = {
    uploadedImage: string | null;
    activeTool: string;
    activePanel: PanelTab;
    selectedFilter: string;
    zoom: number;
    rotation: number;
    flipX: boolean;
    flipY: boolean;
    adjustments: Record<AdjustmentKey, number>;
};

type ImageEditorProjectPayload = {
    version: number;
    savedAt: string;
    snapshot: ImageEditorSnapshot;
};

type ImageEditorState = {
    uploadedImage: string | null;
    activeTool: string;
    activePanel: PanelTab;
    isProcessing: boolean;
    selectedFilter: string;
    zoom: number;
    rotation: number;
    flipX: boolean;
    flipY: boolean;
    adjustments: Record<AdjustmentKey, number>;
};

type ImageEditorAction =
    | { type: 'setUploadedImage'; uploadedImage: string | null }
    | { type: 'setActiveTool'; activeTool: string }
    | { type: 'setActivePanel'; activePanel: PanelTab }
    | { type: 'setProcessing'; isProcessing: boolean }
    | { type: 'setSelectedFilter'; selectedFilter: string }
    | { type: 'setAdjustment'; key: AdjustmentKey; value: number }
    | { type: 'setZoom'; zoom: number }
    | { type: 'setRotation'; rotation: number }
    | { type: 'setFlipX'; flipX: boolean }
    | { type: 'setFlipY'; flipY: boolean }
    | {
          type: 'restoreSnapshot';
          snapshot: {
              uploadedImage: string | null;
              activeTool: string;
              activePanel: PanelTab;
              selectedFilter: string;
              zoom: number;
              rotation: number;
              flipX: boolean;
              flipY: boolean;
              adjustments: Record<AdjustmentKey, number>;
          };
      }
    | { type: 'resetAdjustments' };

const initialState: ImageEditorState = {
    uploadedImage: null,
    activeTool: 'select',
    activePanel: 'adjust',
    isProcessing: false,
    selectedFilter: 'none',
    zoom: 100,
    rotation: 0,
    flipX: false,
    flipY: false,
    adjustments: {
        brightness: 0,
        contrast: 0,
        saturation: 0,
        sharpness: 0,
        blur: 0,
        temperature: 0,
    },
};

const normalizeImageEditorSnapshot = (value: unknown): ImageEditorSnapshot => {
    const raw = (value ?? {}) as Record<string, unknown>;
    const snapshot = (raw.snapshot && typeof raw.snapshot === 'object' ? raw.snapshot : raw) as Record<string, unknown>;
    const adjustments = (snapshot.adjustments && typeof snapshot.adjustments === 'object' ? snapshot.adjustments : {}) as Record<string, unknown>;

    return {
        uploadedImage: typeof snapshot.uploadedImage === 'string' ? snapshot.uploadedImage : null,
        activeTool: typeof snapshot.activeTool === 'string' ? snapshot.activeTool : 'select',
        activePanel: snapshot.activePanel === 'adjust' || snapshot.activePanel === 'filters' || snapshot.activePanel === 'ai' ? snapshot.activePanel : 'adjust',
        selectedFilter: typeof snapshot.selectedFilter === 'string' ? snapshot.selectedFilter : 'none',
        zoom: typeof snapshot.zoom === 'number' ? snapshot.zoom : 100,
        rotation: typeof snapshot.rotation === 'number' ? snapshot.rotation : 0,
        flipX: typeof snapshot.flipX === 'boolean' ? snapshot.flipX : false,
        flipY: typeof snapshot.flipY === 'boolean' ? snapshot.flipY : false,
        adjustments: {
            brightness: typeof adjustments.brightness === 'number' ? adjustments.brightness : 0,
            contrast: typeof adjustments.contrast === 'number' ? adjustments.contrast : 0,
            saturation: typeof adjustments.saturation === 'number' ? adjustments.saturation : 0,
            sharpness: typeof adjustments.sharpness === 'number' ? adjustments.sharpness : 0,
            blur: typeof adjustments.blur === 'number' ? adjustments.blur : 0,
            temperature: typeof adjustments.temperature === 'number' ? adjustments.temperature : 0,
        },
    };
};

function reducer(state: ImageEditorState, action: ImageEditorAction): ImageEditorState {
    switch (action.type) {
        case 'setUploadedImage':
            return { ...state, uploadedImage: action.uploadedImage };
        case 'setActiveTool':
            return { ...state, activeTool: action.activeTool };
        case 'setActivePanel':
            return { ...state, activePanel: action.activePanel };
        case 'setProcessing':
            return { ...state, isProcessing: action.isProcessing };
        case 'setSelectedFilter':
            return { ...state, selectedFilter: action.selectedFilter };
        case 'setAdjustment':
            return {
                ...state,
                adjustments: { ...state.adjustments, [action.key]: action.value },
            };
        case 'setZoom':
            return { ...state, zoom: action.zoom };
        case 'setRotation':
            return { ...state, rotation: action.rotation };
        case 'setFlipX':
            return { ...state, flipX: action.flipX };
        case 'setFlipY':
            return { ...state, flipY: action.flipY };
        case 'restoreSnapshot':
            return {
                ...state,
                uploadedImage: action.snapshot.uploadedImage,
                activeTool: action.snapshot.activeTool,
                activePanel: action.snapshot.activePanel,
                selectedFilter: action.snapshot.selectedFilter,
                zoom: action.snapshot.zoom,
                rotation: action.snapshot.rotation,
                flipX: action.snapshot.flipX,
                flipY: action.snapshot.flipY,
                adjustments: { ...action.snapshot.adjustments },
                isProcessing: false,
            };
        case 'resetAdjustments':
            return {
                ...state,
                adjustments: {
                    brightness: 0,
                    contrast: 0,
                    saturation: 0,
                    sharpness: 0,
                    blur: 0,
                    temperature: 0,
                },
            };
        default:
            return state;
    }
}

export default function ImageEditorPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-background text-foreground" />}>
            <ImageEditorPageContent />
        </Suspense>
    );
}

function ImageEditorPageContent() {
    const [state, dispatch] = useReducer(reducer, initialState);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { startGeneration, reset } = useGenerationStore();
    const { replace } = useRouter();
    const searchParams = useSearchParams();
    const searchParamsSnapshot = useMemo(() => new URLSearchParams(searchParams), [searchParams]);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [projectId, setProjectId] = useState<string | null>(null);
    const [isProjectLoading, setIsProjectLoading] = useState(false);
    const [isProjectSaving, setIsProjectSaving] = useState(false);
    const [projectError, setProjectError] = useState<string | null>(null);
    const [pastSnapshots, setPastSnapshots] = useState<Array<{
        uploadedImage: string | null;
        activeTool: string;
        activePanel: PanelTab;
        selectedFilter: string;
        zoom: number;
        rotation: number;
        flipX: boolean;
        flipY: boolean;
        adjustments: Record<AdjustmentKey, number>;
    }>>([]);
    const [futureSnapshots, setFutureSnapshots] = useState<Array<{
        uploadedImage: string | null;
        activeTool: string;
        activePanel: PanelTab;
        selectedFilter: string;
        zoom: number;
        rotation: number;
        flipX: boolean;
        flipY: boolean;
        adjustments: Record<AdjustmentKey, number>;
        }>>([]);

    const isProjectBusy = isProjectLoading || isProjectSaving;

    const buildSnapshot = () => ({
        uploadedImage: state.uploadedImage,
        activeTool: state.activeTool,
        activePanel: state.activePanel,
        selectedFilter: state.selectedFilter,
        zoom: state.zoom,
        rotation: state.rotation,
        flipX: state.flipX,
        flipY: state.flipY,
        adjustments: { ...state.adjustments },
    });

    const pushHistory = () => {
        setPastSnapshots((current) => [...current, buildSnapshot()]);
        setFutureSnapshots([]);
    };

    useEffect(() => {
        const requestedProjectId = searchParamsSnapshot.get('projectId');
        setProjectId(requestedProjectId);

        const applySnapshot = (snapshot: ImageEditorSnapshot) => {
            dispatch({ type: 'restoreSnapshot', snapshot });
            setProjectError(null);
        };

        const loadDraft = () => {
            const saved = window.localStorage.getItem('image-editor:draft');
            if (!saved) {
                return;
            }
            try {
                applySnapshot(normalizeImageEditorSnapshot(JSON.parse(saved)));
            } catch (error) {
                console.error('Failed to restore image editor draft', error);
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

                applySnapshot(normalizeImageEditorSnapshot(project.content));
            } catch (error) {
                console.error('Failed to load image editor project', error);
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
        return () => {
            setErrorMessage(null);
        };
    }, []);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            pushHistory();
            setErrorMessage(null);
            const uploaded = await uploadFileWithToast(file, file.name);
            if (!uploaded?.url) return;

            dispatch({ type: 'setUploadedImage', uploadedImage: uploaded.url });
        }
    };

    const handleAiTool = async (toolId: string) => {
        if (!state.uploadedImage) {
            setErrorMessage('Upload an image before using AI tools.');
            return;
        }

        pushHistory();
        dispatch({ type: 'setProcessing', isProcessing: true });
        setErrorMessage(null);

        try {
            await startGeneration('/generations/image', {
                prompt: `Apply ${toolId} to image`,
                imageUrl: state.uploadedImage,
            });
        } catch (error) {
            console.error('Failed to run image AI tool', error);
            setErrorMessage('AI tool failed to start. Please try again.');
        } finally {
            dispatch({ type: 'setProcessing', isProcessing: false });
        }
    };

    const buildFilterString = () => {
        const b = state.adjustments.brightness;
        const c = state.adjustments.contrast;
        const s = state.adjustments.saturation;
        let filter = `brightness(${1 + b / 100}) contrast(${1 + c / 100}) saturate(${1 + s / 100})`;
        if (state.adjustments.blur > 0) filter += ` blur(${state.adjustments.blur / 10}px)`;

        switch (state.selectedFilter) {
            case 'bw':
                filter += ' grayscale(1)';
                break;
            case 'vivid':
                filter += ' saturate(1.5) contrast(1.1)';
                break;
            case 'warm':
                filter += ' sepia(0.2)';
                break;
            case 'cool':
                filter += ' hue-rotate(20deg) saturate(0.9)';
                break;
            case 'vintage':
                filter += ' sepia(0.4) contrast(0.9) brightness(1.1)';
                break;
            case 'cinema':
                filter += ' contrast(1.2) saturate(0.8)';
                break;
            case 'dramatic':
                filter += ' contrast(1.4) saturate(1.2) brightness(0.9)';
                break;
        }

        return filter;
    };

    const handleReset = () => {
        pushHistory();
        reset();
        dispatch({ type: 'resetAdjustments' });
        dispatch({ type: 'setSelectedFilter', selectedFilter: 'none' });
        dispatch({ type: 'setActiveTool', activeTool: 'select' });
        dispatch({ type: 'setActivePanel', activePanel: 'adjust' });
        dispatch({ type: 'setUploadedImage', uploadedImage: null });
        dispatch({ type: 'setZoom', zoom: 100 });
        dispatch({ type: 'setRotation', rotation: 0 });
        dispatch({ type: 'setFlipX', flipX: false });
        dispatch({ type: 'setFlipY', flipY: false });
        setErrorMessage(null);
        setProjectError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSave = () => {
        const payload: ImageEditorProjectPayload = {
            version: 1,
            savedAt: new Date().toISOString(),
            snapshot: buildSnapshot(),
        };

        window.localStorage.setItem('image-editor:draft', JSON.stringify(payload));
        setErrorMessage(null);

        const persistProject = async () => {
            setIsProjectSaving(true);
            try {
                if (projectId) {
                    await projectApi.update(projectId, {
                        name: 'Image Editor Draft',
                        description: 'Image editor draft',
                        content: payload,
                    });
                } else {
                    const created = await projectApi.create({
                        name: 'Image Editor Draft',
                        description: 'Image editor draft',
                        content: payload,
                    });
                    setProjectId(created.project.id);
                    replace(`${window.location.pathname}?projectId=${created.project.id}`);
                }

                setProjectError(null);
                toast.success('Image editor draft saved to your projects.');
            } catch (error) {
                console.error('Failed to persist image editor project', error);
                setProjectError('Saved locally, but backend project save failed.');
                toast.error('Saved locally, but backend project save failed.');
            } finally {
                setIsProjectSaving(false);
            }
        };

        void persistProject();
    };

    const handleUndo = () => {
        setPastSnapshots((currentPast) => {
            if (!currentPast.length) return currentPast;
            const previous = currentPast[currentPast.length - 1];
            setFutureSnapshots((currentFuture) => [buildSnapshot(), ...currentFuture]);
            dispatch({ type: 'restoreSnapshot', snapshot: previous });
            return currentPast.slice(0, -1);
        });
        setErrorMessage(null);
    };

    const handleRedo = () => {
        setFutureSnapshots((currentFuture) => {
            if (!currentFuture.length) return currentFuture;
            const [next, ...rest] = currentFuture;
            setPastSnapshots((currentPast) => [...currentPast, buildSnapshot()]);
            dispatch({ type: 'restoreSnapshot', snapshot: next });
            return rest;
        });
        setErrorMessage(null);
    };

    const handleRotate = (direction: 'left' | 'right') => {
        pushHistory();
        dispatch({
            type: 'setRotation',
            rotation: (state.rotation + (direction === 'left' ? -90 : 90) + 360) % 360,
        });
        setErrorMessage(null);
    };

    const handleFlip = (axis: 'horizontal' | 'vertical') => {
        pushHistory();
        if (axis === 'horizontal') {
            dispatch({ type: 'setFlipX', flipX: !state.flipX });
        } else {
            dispatch({ type: 'setFlipY', flipY: !state.flipY });
        }
        setErrorMessage(null);
    };

    const handleZoom = (direction: 'in' | 'out') => {
        pushHistory();
        const nextZoom = Math.min(400, Math.max(25, state.zoom + (direction === 'in' ? 10 : -10)));
        dispatch({ type: 'setZoom', zoom: nextZoom });
        setErrorMessage(null);
    };

    const handleExport = async () => {
        if (!state.uploadedImage) {
            setErrorMessage('Upload an image before exporting.');
            return;
        }

        setIsExporting(true);
        setErrorMessage(null);

        try {
            const img = new window.Image();
            img.crossOrigin = 'anonymous';
            img.src = state.uploadedImage;
            await img.decode();

            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth || img.width;
            canvas.height = img.naturalHeight || img.height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                throw new Error('Canvas context unavailable');
            }

            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            ctx.translate(centerX, centerY);
            ctx.rotate((state.rotation * Math.PI) / 180);
            ctx.scale(state.flipX ? -1 : 1, state.flipY ? -1 : 1);
            ctx.scale(state.zoom / 100, state.zoom / 100);
            ctx.filter = buildFilterString();
            ctx.drawImage(img, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);

            const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
            if (!blob) {
                throw new Error('Failed to render export');
            }

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'image-editor-export.png';
            link.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to export edited image', error);
            setErrorMessage('Could not export the edited image.');
        } finally {
            setIsExporting(false);
        }
    };

    const getFilterStyle = (): React.CSSProperties => {
        const b = state.adjustments.brightness;
        const c = state.adjustments.contrast;
        const s = state.adjustments.saturation;
        let filter = `brightness(${1 + b / 100}) contrast(${1 + c / 100}) saturate(${1 + s / 100})`;
        if (state.adjustments.blur > 0) filter += ` blur(${state.adjustments.blur / 10}px)`;

        switch (state.selectedFilter) {
            case 'bw':
                filter += ' grayscale(1)';
                break;
            case 'vivid':
                filter += ' saturate(1.5) contrast(1.1)';
                break;
            case 'warm':
                filter += ' sepia(0.2)';
                break;
            case 'cool':
                filter += ' hue-rotate(20deg) saturate(0.9)';
                break;
            case 'vintage':
                filter += ' sepia(0.4) contrast(0.9) brightness(1.1)';
                break;
            case 'cinema':
                filter += ' contrast(1.2) saturate(0.8)';
                break;
            case 'dramatic':
                filter += ' contrast(1.4) saturate(1.2) brightness(0.9)';
                break;
        }
        return {
            filter,
            transform: `scale(${state.zoom / 100}) rotate(${state.rotation}deg) scaleX(${state.flipX ? -1 : 1}) scaleY(${state.flipY ? -1 : 1})`,
        };
    };

    return (
        <CreatorWorkspaceShell>
            <div className="w-14 border-r border-border flex flex-col items-center py-4 gap-1 bg-background shrink-0">
                {tools.map((tool) => (
                    <button
                        key={tool.id}
                        onClick={() => dispatch({ type: 'setActiveTool', activeTool: tool.id })}
                        title={tool.label}
                        className={cn(
                            'size-10 rounded-lg flex items-center justify-center transition-all',
                            state.activeTool === tool.id
                                ? 'bg-accent text-foreground'
                                : 'text-muted-foreground hover:text-foreground hover:bg-accent/50',
                        )}
                    >
                        <tool.icon className="size-4.5" />
                    </button>
                ))}
            </div>

            <div className="flex-1 flex flex-col min-w-0">
                <div className="h-14 px-4 border-b border-border flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="size-8" title="Undo" onClick={handleUndo} disabled={!pastSnapshots.length}>
                            <Undo2 className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="size-8" title="Redo" onClick={handleRedo} disabled={!futureSnapshots.length}>
                            <Redo2 className="size-4" />
                        </Button>
                        <div className="w-px h-6 bg-border mx-2" />
                        <Button variant="ghost" size="icon" className="size-8" title="Rotate Left" onClick={() => handleRotate('left')} disabled={!state.uploadedImage}>
                            <RotateCcw className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="size-8" title="Rotate Right" onClick={() => handleRotate('right')} disabled={!state.uploadedImage}>
                            <RotateCw className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="size-8" title="Flip Horizontal" onClick={() => handleFlip('horizontal')} disabled={!state.uploadedImage}>
                            <FlipHorizontal className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="size-8" title="Flip Vertical" onClick={() => handleFlip('vertical')} disabled={!state.uploadedImage}>
                            <FlipVertical className="size-4" />
                        </Button>
                        <div className="w-px h-6 bg-border mx-2" />
                        <Button variant="ghost" size="icon" className="size-8" title="Zoom In" onClick={() => handleZoom('in')} disabled={!state.uploadedImage}>
                            <ZoomIn className="size-4" />
                        </Button>
                        <span className="text-xs text-muted-foreground font-medium px-2">{state.zoom}%</span>
                        <Button variant="ghost" size="icon" className="size-8" title="Zoom Out" onClick={() => handleZoom('out')} disabled={!state.uploadedImage}>
                            <ZoomOut className="size-4" />
                        </Button>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="gap-2" onClick={handleReset}>
                            <RotateCcw className="size-4" />
                            Reset
                        </Button>
                        <Button variant="outline" size="sm" className="gap-2" onClick={handleSave} disabled={isProjectBusy}>
                            <Folder className="size-4" />
                            {isProjectSaving ? 'Saving...' : 'Save Project'}
                        </Button>
                        <Button size="sm" className="gap-2" onClick={handleExport} disabled={isExporting || isProjectBusy}>
                            <Download className="size-4" />
                            {isExporting ? 'Exporting...' : 'Export'}
                        </Button>
                    </div>
                </div>

                <div className="flex-1 flex items-center justify-center p-8 bg-muted/30 overflow-auto">
                    {projectError && (
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-sm text-amber-700 dark:text-amber-300">
                            {projectError}
                        </div>
                    )}
                    {errorMessage && (
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-2 text-sm text-destructive">
                            {errorMessage}
                        </div>
                    )}
                    {!state.uploadedImage ? (
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full max-w-lg aspect-[4/3] rounded-2xl border-2 border-dashed border-border hover:border-primary/30 transition-all cursor-pointer flex flex-col items-center justify-center gap-4 bg-background"
                        >
                            <div className="size-16 rounded-xl bg-accent flex items-center justify-center">
                                <Upload className="size-7 text-muted-foreground" />
                            </div>
                            <div className="text-center">
                                <p className="font-medium">Open an image to edit</p>
                                <p className="text-sm text-muted-foreground mt-1">Drag & drop or click to browse</p>
                            </div>
                        </button>
                    ) : (
                        <div className="relative rounded-lg border border-border shadow-2xl overflow-hidden bg-[repeating-conic-gradient(#80808010_0%_25%,transparent_0%_50%)] bg-[length:16px_16px]">
                            <Image
                                src={state.uploadedImage}
                                alt="Editing"
                                width={1600}
                                height={1200}
                                className="max-h-[70vh] w-auto object-contain transition-all"
                                style={getFilterStyle()}
                            />
                            {state.isProcessing && (
                                <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-10">
                                    <Loader2 className="size-10 animate-spin text-primary" />
                                    <p className="text-sm font-medium">AI is processing?</p>
                                </div>
                            )}
                        </div>
                    )}
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                </div>
            </div>

            <div className="w-[280px] border-l border-border flex flex-col shrink-0 bg-background">
                <div className="h-14 px-2 border-b border-border flex items-center gap-1 shrink-0">
                    {(['adjust', 'filters', 'ai'] as const).map((panel) => (
                        <button
                            key={panel}
                            onClick={() => dispatch({ type: 'setActivePanel', activePanel: panel })}
                            className={cn(
                                'flex-1 py-2 text-xs font-medium rounded-lg transition-colors capitalize',
                                state.activePanel === panel
                                    ? 'bg-accent text-accent-foreground'
                                    : 'text-muted-foreground hover:text-foreground',
                            )}
                        >
                            {panel === 'ai' ? 'AI Tools' : panel}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto p-4  gap-y-6">
                    {state.activePanel === 'adjust' && (
                        <>
                            {adjustmentControls.map((adj) => (
                                <div key={adj.key} className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em] flex items-center gap-2">
                                            <adj.icon className="size-3" />
                                            {adj.label}
                                        </Label>
                                        <span className="text-[11px] font-mono text-foreground">
                                            {state.adjustments[adj.key]}
                                        </span>
                                    </div>
                                    <Slider
                                        min={adj.min}
                                        max={adj.max}
                                        step={1}
                                        value={[state.adjustments[adj.key]]}
                                        onValueChange={([val]) =>
                                            dispatch({ type: 'setAdjustment', key: adj.key, value: val })
                                        }
                                    />
                                </div>
                            ))}

                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full text-xs"
                                onClick={() => dispatch({ type: 'resetAdjustments' })}
                            >
                                <RotateCcw className="size-3 mr-2" />
                                Reset All
                            </Button>
                        </>
                    )}

                    {state.activePanel === 'filters' && (
                        <div className="grid grid-cols-2 gap-2">
                            {filters.map((f) => (
                                <button
                                    key={f.id}
                                    onClick={() => dispatch({ type: 'setSelectedFilter', selectedFilter: f.id })}
                                    className={cn(
                                        'aspect-square rounded-xl border-2 transition-all overflow-hidden flex items-end p-2 bg-muted',
                                        state.selectedFilter === f.id
                                            ? 'border-primary ring-2 ring-primary/20'
                                            : 'border-border hover:border-muted-foreground/50',
                                    )}
                                >
                                    <span className="text-[10px] font-bold">{f.label}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {state.activePanel === 'ai' && (
                        <div className="space-y-2">
                            {aiTools.map((tool) => (
                                <button
                                    key={tool.id}
                                    onClick={() => handleAiTool(tool.id)}
                                    disabled={state.isProcessing || !state.uploadedImage}
                                    className="w-full flex items-start gap-3 px-4 py-3 bg-card rounded-xl border border-border hover:border-primary/20 transition-all text-left disabled:opacity-50"
                                >
                                    <div className="size-9 rounded-lg bg-accent flex items-center justify-center shrink-0 mt-0.5">
                                        <tool.icon className="size-4 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium">{tool.label}</p>
                                        <p className="text-[10px] text-muted-foreground mt-0.5">{tool.description}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </CreatorWorkspaceShell>
    );
}
