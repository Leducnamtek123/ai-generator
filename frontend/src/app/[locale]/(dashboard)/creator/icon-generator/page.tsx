'use client';

import Image from 'next/image';
import { Suspense, useEffect, useReducer, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { useGenerationStore } from '@/stores/generation-store';
import { useGenerationProviders } from '@/hooks/useGenerationProviders';
import { projectApi } from '@/services/projectApi';
import {
    Shapes,
    Download,
    Loader2,
    Folder,
    Copy,
    Square,
    Circle,
} from 'lucide-react';
import { Button } from '@/ui/button';
import { Slider } from '@/ui/slider';
import { Label } from '@/ui/label';
import { cn } from '@/lib/utils';
import { CreatorWorkspaceShell } from '@/components/layouts/CreatorWorkspaceShell';

const iconStyles = [
    { id: 'flat', label: 'Flat', description: 'Clean flat design' },
    { id: '3d', label: '3D', description: 'Realistic 3D rendering' },
    { id: 'gradient', label: 'Gradient', description: 'Modern gradient style' },
    { id: 'outline', label: 'Outline', description: 'Line icon style' },
    { id: 'glyph', label: 'Glyph', description: 'Solid monochrome' },
    { id: 'isometric', label: 'Isometric', description: 'Isometric 3D view' },
    { id: 'clay', label: 'Clay', description: 'Soft clay 3D look' },
    { id: 'pixel', label: 'Pixel', description: 'Pixel art retro' },
];

const shapes = [
    { id: 'square', label: 'Square', icon: Square },
    { id: 'rounded', label: 'Rounded', icon: Square },
    { id: 'circle', label: 'Circle', icon: Circle },
    { id: 'squircle', label: 'Squircle', icon: Square },
];

const colorPalettes = [
    { id: 'vibrant', colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'] },
    { id: 'pastel', colors: ['#FFB5E8', '#B5DEFF', '#E7FFAC', '#FFC9DE'] },
    { id: 'dark', colors: ['#2D2D2D', '#3D3D3D', '#4D4D4D', '#1A1A2E'] },
    { id: 'gradient', colors: ['#667EEA', '#764BA2', '#F093FB', '#F5576C'] },
    { id: 'earth', colors: ['#A0522D', '#DEB887', '#8B7355', '#556B2F'] },
    { id: 'neon', colors: ['#39FF14', '#FF073A', '#01CDFE', '#FFFF00'] },
];

const sizes = ['16x16', '32x32', '64x64', '128x128', '256x256', '512x512', '1024x1024'];

type IconGeneratorState = {
    prompt: string;
    selectedStyle: string;
    selectedShape: string;
    selectedPalette: string;
    selectedSize: string;
    count: number;
    cornerRadius: number;
    isGenerating: boolean;
    results: string[];
    error: string | null;
};

type IconSnapshot = {
    prompt: string;
    selectedStyle: string;
    selectedShape: string;
    selectedPalette: string;
    selectedSize: string;
    count: number;
    cornerRadius: number;
    results: string[];
    selectedProvider: string;
};

type IconProjectPayload = {
    version: number;
    savedAt: string;
    snapshot: Partial<IconSnapshot>;
};

type IconGeneratorAction =
    | { type: 'setPrompt'; prompt: string }
    | { type: 'setSelectedStyle'; selectedStyle: string }
    | { type: 'setSelectedShape'; selectedShape: string }
    | { type: 'setSelectedPalette'; selectedPalette: string }
    | { type: 'setSelectedSize'; selectedSize: string }
    | { type: 'setCount'; count: number }
    | { type: 'setCornerRadius'; cornerRadius: number }
    | { type: 'setGenerating'; isGenerating: boolean }
    | { type: 'setResults'; results: string[] }
    | { type: 'setError'; error: string | null }
    | { type: 'resetAll' };

const initialState: IconGeneratorState = {
    prompt: '',
    selectedStyle: 'flat',
    selectedShape: 'rounded',
    selectedPalette: 'vibrant',
    selectedSize: '512x512',
    count: 4,
    cornerRadius: 20,
    isGenerating: false,
    results: [],
    error: null,
};

const normalizeIconSnapshot = (value: unknown): Partial<IconSnapshot> => {
    const raw = (value ?? {}) as Record<string, unknown>;
    const snapshot = (raw.snapshot && typeof raw.snapshot === 'object' ? raw.snapshot : raw) as Record<string, unknown>;

    return {
        prompt: typeof snapshot.prompt === 'string' ? snapshot.prompt : '',
        selectedStyle: typeof snapshot.selectedStyle === 'string' ? snapshot.selectedStyle : initialState.selectedStyle,
        selectedShape: typeof snapshot.selectedShape === 'string' ? snapshot.selectedShape : initialState.selectedShape,
        selectedPalette: typeof snapshot.selectedPalette === 'string' ? snapshot.selectedPalette : initialState.selectedPalette,
        selectedSize: typeof snapshot.selectedSize === 'string' ? snapshot.selectedSize : initialState.selectedSize,
        count: typeof snapshot.count === 'number' ? snapshot.count : initialState.count,
        cornerRadius: typeof snapshot.cornerRadius === 'number' ? snapshot.cornerRadius : initialState.cornerRadius,
        results: Array.isArray(snapshot.results) ? snapshot.results.filter((value): value is string => typeof value === 'string') : [],
        selectedProvider: typeof snapshot.selectedProvider === 'string' ? snapshot.selectedProvider : '',
    };
};

function reducer(state: IconGeneratorState, action: IconGeneratorAction): IconGeneratorState {
    switch (action.type) {
        case 'setPrompt':
            return { ...state, prompt: action.prompt };
        case 'setSelectedStyle':
            return { ...state, selectedStyle: action.selectedStyle };
        case 'setSelectedShape':
            return { ...state, selectedShape: action.selectedShape };
        case 'setSelectedPalette':
            return { ...state, selectedPalette: action.selectedPalette };
        case 'setSelectedSize':
            return { ...state, selectedSize: action.selectedSize };
        case 'setCount':
            return { ...state, count: action.count };
        case 'setCornerRadius':
            return { ...state, cornerRadius: action.cornerRadius };
        case 'setGenerating':
            return { ...state, isGenerating: action.isGenerating };
        case 'setResults':
            return { ...state, results: action.results };
        case 'setError':
            return { ...state, error: action.error };
        case 'resetAll':
            return initialState;
        default:
            return state;
    }
}

export default function IconGeneratorPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-background text-foreground" />}>
            <IconGeneratorPageContent />
        </Suspense>
    );
}

function IconGeneratorPageContent() {
    const [state, dispatch] = useReducer(reducer, initialState);
    const { startGeneration, currentGeneration, error, reset } = useGenerationStore();
    const { providers: iconProviders, isLoading: isProvidersLoading } = useGenerationProviders('icon-gen');
    const [selectedProvider, setSelectedProvider] = useState('');
    const [projectId, setProjectId] = useState<string | null>(null);
    const [isProjectLoading, setIsProjectLoading] = useState(false);
    const [isProjectSaving, setIsProjectSaving] = useState(false);
    const [projectError, setProjectError] = useState<string | null>(null);
    const { replace } = useRouter();
    const searchParams = useSearchParams();
    const searchParamsSnapshot = useMemo(() => new URLSearchParams(searchParams), [searchParams]);
    const isProjectBusy = isProjectLoading || isProjectSaving;

    useEffect(() => {
        if (!iconProviders.length) {
            return;
        }

        if (!selectedProvider || !iconProviders.some((provider) => provider.name === selectedProvider)) {
            setSelectedProvider(iconProviders[0].name);
        }
    }, [selectedProvider, iconProviders]);

    useEffect(() => {
        const requestedProjectId = searchParamsSnapshot.get('projectId');
        setProjectId(requestedProjectId);

        const applySnapshot = (snapshot: Partial<IconSnapshot>) => {
            dispatch({ type: 'setPrompt', prompt: snapshot.prompt ?? '' });
            dispatch({ type: 'setSelectedStyle', selectedStyle: snapshot.selectedStyle ?? initialState.selectedStyle });
            dispatch({ type: 'setSelectedShape', selectedShape: snapshot.selectedShape ?? initialState.selectedShape });
            dispatch({ type: 'setSelectedPalette', selectedPalette: snapshot.selectedPalette ?? initialState.selectedPalette });
            dispatch({ type: 'setSelectedSize', selectedSize: snapshot.selectedSize ?? initialState.selectedSize });
            dispatch({ type: 'setCount', count: snapshot.count ?? initialState.count });
            dispatch({ type: 'setCornerRadius', cornerRadius: snapshot.cornerRadius ?? initialState.cornerRadius });
            dispatch({ type: 'setResults', results: snapshot.results ?? [] });
            setSelectedProvider(snapshot.selectedProvider ?? '');
            setProjectError(null);
        };

        const loadDraft = () => {
            const draftRaw = localStorage.getItem('icon-generator:draft:v1');
            if (!draftRaw) {
                return;
            }

            try {
                applySnapshot(normalizeIconSnapshot(JSON.parse(draftRaw)));
            } catch (loadError) {
                console.error('Failed to load icon draft', loadError);
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
                if (cancelled) {
                    return;
                }

                applySnapshot(normalizeIconSnapshot(project.content));
            } catch (loadError) {
                console.error('Failed to load icon project', loadError);
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
        if (!state.prompt.trim()) return;
        reset();
        dispatch({ type: 'setGenerating', isGenerating: true });
        dispatch({ type: 'setError', error: null });
        dispatch({ type: 'setResults', results: [] });

        try {
            await startGeneration('/generations/image', {
                prompt: `Create a custom icon for: ${state.prompt}. Style: ${state.selectedStyle}. Shape: ${state.selectedShape}. Palette: ${state.selectedPalette}. Size: ${state.selectedSize}. Corner radius: ${state.cornerRadius}%. Return a clean icon with transparent or matching background.`,
                aspectRatio: '1:1',
                quality: 'hd',
                provider: selectedProvider || undefined,
                negativePrompt: 'photograph, realistic scene, landscape, people, text, watermark, clutter',
            });
        } catch (error) {
            console.error('Failed to generate icons', error);
            dispatch({ type: 'setError', error: 'Failed to start icon generation.' });
            dispatch({ type: 'setGenerating', isGenerating: false });
        }
    };

    const handleReset = () => {
        reset();
        dispatch({ type: 'resetAll' });
        setSelectedProvider(iconProviders[0]?.name || '');
        setProjectError(null);
    };

    const handleSaveProject = async () => {
        const content: IconSnapshot = {
            prompt: state.prompt,
            selectedStyle: state.selectedStyle,
            selectedShape: state.selectedShape,
            selectedPalette: state.selectedPalette,
            selectedSize: state.selectedSize,
            count: state.count,
            cornerRadius: state.cornerRadius,
            results: state.results,
            selectedProvider,
        };

        localStorage.setItem('icon-generator:draft:v1', JSON.stringify(content));
        setIsProjectSaving(true);
        setProjectError(null);

        try {
            if (projectId) {
                await projectApi.update(projectId, {
                    name: state.prompt.trim() ? `Icon: ${state.prompt.trim().slice(0, 48)}` : 'Icon Generator Project',
                    content: { version: 1, savedAt: new Date().toISOString(), snapshot: content } satisfies IconProjectPayload,
                });
            } else {
                const created = await projectApi.create({
                    name: state.prompt.trim() ? `Icon: ${state.prompt.trim().slice(0, 48)}` : 'Icon Generator Project',
                    content: { version: 1, savedAt: new Date().toISOString(), snapshot: content } satisfies IconProjectPayload,
                });
                setProjectId(created.project.id);
                replace(`${window.location.pathname}?projectId=${created.project.id}`);
            }
            toast.success('Icon project saved.');
        } catch (saveError) {
            console.error('Failed to save icon project', saveError);
            setProjectError('Saved locally, but backend project save failed.');
            toast.error('Icon project saved locally, backend save failed.');
        } finally {
            setIsProjectSaving(false);
        }
    };

    const handleExportAll = () => {
        const blob = new Blob([JSON.stringify({
            version: 1,
            exportedAt: new Date().toISOString(),
            prompt: state.prompt,
            selectedStyle: state.selectedStyle,
            selectedShape: state.selectedShape,
            selectedPalette: state.selectedPalette,
            selectedSize: state.selectedSize,
            count: state.count,
            cornerRadius: state.cornerRadius,
            results: state.results,
        }, null, 2)], { type: 'application/json' });

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'icon-generator-export.json';
        link.click();
        URL.revokeObjectURL(url);
        toast.success('Icon export created.');
    };

    const handleDownloadIcon = (url: string, index: number) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = `icon-${index + 1}.png`;
        link.click();
    };

    const handleCopyIcon = async (url: string) => {
        await navigator.clipboard.writeText(url);
        toast.success('Icon URL copied.');
    };

    useEffect(() => {
        if (!currentGeneration || !state.isGenerating || currentGeneration.type !== 'image') {
            return;
        }

        if (currentGeneration.status === 'completed') {
            dispatch({
                type: 'setResults',
                results: currentGeneration.resultUrl ? [currentGeneration.resultUrl] : [],
            });
            dispatch({ type: 'setGenerating', isGenerating: false });
            dispatch({ type: 'setError', error: null });
        } else if (currentGeneration.status === 'failed') {
            dispatch({ type: 'setError', error: currentGeneration.error || error || 'Icon generation failed.' });
            dispatch({ type: 'setGenerating', isGenerating: false });
        }
    }, [currentGeneration, error, state.isGenerating]);

    return (
        <CreatorWorkspaceShell>
            <div className="w-[320px] border-r border-border flex flex-col shrink-0 bg-background">
                <div className="h-14 px-6 border-b border-border flex items-center shrink-0">
                    <h2 className="font-semibold text-muted-foreground">Icon Generator</h2>
                </div>

                <div className="flex-1 overflow-y-auto p-6  gap-y-6">
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.1em]">Describe your icon</h4>
                        <div className="bg-card rounded-xl border border-border p-2">
                            <textarea
                                value={state.prompt}
                                onChange={(e) => dispatch({ type: 'setPrompt', prompt: e.target.value })}
                                placeholder="e.g., A rocket launching from a laptop, tech startup?"
                                className="w-full h-24 bg-transparent text-sm placeholder:text-muted-foreground resize-none focus:outline-none p-2"
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.1em]">Style</h4>
                        <div className="grid grid-cols-2 gap-2">
                            {iconStyles.map((style) => (
                                <button
                                    key={style.id}
                                    onClick={() => dispatch({ type: 'setSelectedStyle', selectedStyle: style.id })}
                                    className={cn(
                                        'p-3 rounded-xl border transition-all text-left',
                                        state.selectedStyle === style.id ? 'bg-accent border-primary/20' : 'bg-card border-border hover:border-border/80',
                                    )}
                                >
                                    <p className="text-[11px] font-medium">{style.label}</p>
                                    <p className="text-[9px] text-muted-foreground">{style.description}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.1em]">Provider</h4>
                        <div className="bg-card rounded-xl border border-border px-4 py-3">
                            <select
                                value={selectedProvider}
                                onChange={(event) => setSelectedProvider(event.target.value)}
                                className="w-full bg-transparent text-sm outline-none"
                                disabled={isProvidersLoading}
                            >
                                {iconProviders.length > 0 ? (
                                    iconProviders.map((provider) => (
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
                            Pick a live icon provider before starting the generation.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.1em]">Shape</h4>
                        <div className="grid grid-cols-4 gap-2">
                            {shapes.map((shape) => (
                                <button
                                    key={shape.id}
                                    onClick={() => dispatch({ type: 'setSelectedShape', selectedShape: shape.id })}
                                    className={cn(
                                        'flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all',
                                        state.selectedShape === shape.id ? 'bg-accent border-primary/20' : 'bg-card border-border',
                                    )}
                                >
                                    <shape.icon className={cn('size-5', shape.id === 'rounded' && 'rounded')} />
                                    <span className="text-[9px] font-medium">{shape.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.1em]">Color Palette</h4>
                        <div className="space-y-2">
                            {colorPalettes.map((palette) => (
                                <button
                                    key={palette.id}
                                    onClick={() => dispatch({ type: 'setSelectedPalette', selectedPalette: palette.id })}
                                    className={cn(
                                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all',
                                        state.selectedPalette === palette.id ? 'bg-accent border-primary/20' : 'bg-card border-border',
                                    )}
                                >
                                    <div className="flex gap-1">
                                        {palette.colors.map((color) => (
                                            <div key={color} className="size-5 rounded-md" style={{ backgroundColor: color }} />
                                        ))}
                                    </div>
                                    <span className="text-xs font-medium capitalize">{palette.id}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Corner Radius</Label>
                            <span className="text-[11px] font-mono text-foreground">{state.cornerRadius}%</span>
                        </div>
                        <Slider
                            min={0}
                            max={50}
                            step={1}
                            value={[state.cornerRadius]}
                            onValueChange={([value]) => dispatch({ type: 'setCornerRadius', cornerRadius: value })}
                        />
                    </div>

                    <div className="space-y-3">
                        <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.1em]">Size</h4>
                        <div className="flex flex-wrap gap-1.5">
                            {sizes.map((size) => (
                                <button
                                    key={size}
                                    onClick={() => dispatch({ type: 'setSelectedSize', selectedSize: size })}
                                    className={cn(
                                        'px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all',
                                        state.selectedSize === size ? 'bg-accent border border-primary/20' : 'bg-card border border-border',
                                    )}
                                >
                                    {size}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Variations</Label>
                            <span className="text-[11px] font-mono text-foreground">{state.count}</span>
                        </div>
                        <Slider
                            min={1}
                            max={8}
                            step={1}
                            value={[state.count]}
                            onValueChange={([value]) => dispatch({ type: 'setCount', count: value })}
                        />
                    </div>
                </div>

                <div className="p-4 border-t border-border bg-background space-y-3">
                    <Button variant="ghost" size="sm" className="w-full gap-2" onClick={handleReset}>
                        Reset form
                    </Button>
                    <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                        <span>Cost:</span>
                        <span className="font-medium text-foreground">{state.count} Credits</span>
                    </div>
                    <Button onClick={handleGenerate} disabled={state.isGenerating || !state.prompt.trim()} className="w-full h-12 font-bold rounded-xl gap-2">
                        {state.isGenerating ? (
                            <>
                                <Loader2 className="size-5 animate-spin" />
                                Generating?
                            </>
                        ) : (
                            <>
                                <Shapes className="size-5" />
                                Generate Icons
                            </>
                        )}
                    </Button>
                </div>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="h-14 px-6 border-b border-border flex items-center justify-between shrink-0">
                    <span className="text-sm font-medium">{state.results.length > 0 ? `${state.results.length} icons generated` : 'Generated Icons'}</span>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="gap-2" onClick={handleSaveProject} disabled={isProjectBusy}>
                            <Folder className="size-4" /> {isProjectSaving ? 'Saving...' : 'Save Project'}
                        </Button>
                        {state.results.length > 0 && (
                            <Button size="sm" className="gap-2" onClick={handleExportAll}>
                                <Download className="size-4" /> Export All
                            </Button>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8">
                    {projectError && (
                        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-600">
                            {projectError}
                        </div>
                    )}
                    {state.error && (
                        <div className="mb-6 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                            {state.error}
                        </div>
                    )}
                    {state.isGenerating ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4">
                            <div className="relative">
                                <div className="size-16 rounded-full border-4 border-muted border-t-primary animate-spin" />
                                <Shapes className="size-6 text-muted-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                            </div>
                            <p className="text-sm text-muted-foreground animate-pulse">Generating {state.count} icon variations?</p>
                        </div>
                    ) : state.results.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
                            {state.results.map((url, index) => (
                                <div key={url} className="group relative">
                                    <div className="aspect-square rounded-2xl border border-border overflow-hidden bg-[repeating-conic-gradient(#80808010_0%_25%,transparent_0%_50%)] bg-[length:16px_16px] shadow-lg">
                                        <Image src={url} alt="Generated icon" fill className="object-cover" sizes="(max-width: 1024px) 50vw, 25vw" />
                                    </div>
                                    <div className="absolute inset-0 rounded-2xl bg-zinc-950/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <Button size="icon" variant="secondary" className="size-9 rounded-lg" onClick={() => handleDownloadIcon(url, index)}>
                                            <Download className="size-4" />
                                        </Button>
                                        <Button size="icon" variant="secondary" className="size-9 rounded-lg" onClick={() => handleCopyIcon(url)}>
                                            <Copy className="size-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                            <div className="size-20 rounded-2xl bg-muted border border-border flex items-center justify-center">
                                <Shapes className="size-8 text-muted-foreground" />
                            </div>
                            <div>
                                <h3 className="font-semibold">Generate Custom Icons</h3>
                                <p className="text-sm text-muted-foreground mt-1">Describe your icon and choose a style to get started</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </CreatorWorkspaceShell>
    );
}
