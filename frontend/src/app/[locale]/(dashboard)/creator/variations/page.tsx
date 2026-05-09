'use client';

import Image from 'next/image';
import { Suspense, useEffect, useReducer, useRef, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { useGenerationStore } from '@/stores/generation-store';
import { mediaApi } from '@/services/mediaApi';
import { projectApi } from '@/services/projectApi';
import { Copy, Upload, Download, Sparkles, Loader2, Folder, Shuffle } from 'lucide-react';
import { Button } from '@/ui/button';
import { Slider } from '@/ui/slider';
import { Label } from '@/ui/label';
import { cn } from '@/lib/utils';
import { CreatorWorkspaceShell } from '@/components/layouts/CreatorWorkspaceShell';
import { getUserFacingErrorMessage } from '@/lib/async-operation';

const variationTypes = [
    { id: 'style', label: 'Style Transfer', description: 'Same composition, different art styles' },
    { id: 'color', label: 'Color Variations', description: 'Different color schemes & palettes' },
    { id: 'composition', label: 'Composition', description: 'Alternative layouts and framing' },
    { id: 'mood', label: 'Mood Shift', description: 'Different emotional tones' },
    { id: 'detail', label: 'Detail Level', description: 'From minimal to highly detailed' },
    { id: 'reimagine', label: 'Reimagine', description: 'Creative reinterpretation' },
];

type VariationsState = {
    uploadedImage: string | null;
    variationType: string;
    count: number;
    strength: number;
    creativity: number;
    prompt: string;
    isGenerating: boolean;
    results: string[];
    selectedResult: number | null;
};

type VariationsSnapshot = {
    uploadedImage: string | null;
    variationType: string;
    count: number;
    strength: number;
    creativity: number;
    prompt: string;
    results: string[];
    selectedResult: number | null;
};

type VariationsProjectPayload = {
    version: number;
    savedAt: string;
    snapshot: Partial<VariationsSnapshot>;
};

type VariationsAction =
    | { type: 'setUploadedImage'; uploadedImage: string | null }
    | { type: 'setVariationType'; variationType: string }
    | { type: 'setCount'; count: number }
    | { type: 'setStrength'; strength: number }
    | { type: 'setCreativity'; creativity: number }
    | { type: 'setPrompt'; prompt: string }
    | { type: 'setGenerating'; isGenerating: boolean }
    | { type: 'setResults'; results: string[] }
    | { type: 'clearResults' }
    | { type: 'toggleSelectedResult'; index: number }
    | { type: 'resetSelection' }
    | { type: 'resetAll' };

const initialState: VariationsState = {
    uploadedImage: null,
    variationType: 'style',
    count: 4,
    strength: 50,
    creativity: 50,
    prompt: '',
    isGenerating: false,
    results: [],
    selectedResult: null,
};

const normalizeVariationsSnapshot = (value: unknown): Partial<VariationsSnapshot> => {
    const raw = (value ?? {}) as Record<string, unknown>;
    const snapshot = (raw.snapshot && typeof raw.snapshot === 'object' ? raw.snapshot : raw) as Record<string, unknown>;
    return {
        uploadedImage: typeof snapshot.uploadedImage === 'string' ? snapshot.uploadedImage : null,
        variationType: typeof snapshot.variationType === 'string' ? snapshot.variationType : initialState.variationType,
        count: typeof snapshot.count === 'number' ? snapshot.count : initialState.count,
        strength: typeof snapshot.strength === 'number' ? snapshot.strength : initialState.strength,
        creativity: typeof snapshot.creativity === 'number' ? snapshot.creativity : initialState.creativity,
        prompt: typeof snapshot.prompt === 'string' ? snapshot.prompt : initialState.prompt,
        results: Array.isArray(snapshot.results) ? snapshot.results.filter((item): item is string => typeof item === 'string') : initialState.results,
        selectedResult: typeof snapshot.selectedResult === 'number' ? snapshot.selectedResult : initialState.selectedResult,
    };
};

function variationsReducer(state: VariationsState, action: VariationsAction): VariationsState {
    switch (action.type) {
        case 'setUploadedImage':
            return { ...state, uploadedImage: action.uploadedImage };
        case 'setVariationType':
            return { ...state, variationType: action.variationType };
        case 'setCount':
            return { ...state, count: action.count };
        case 'setStrength':
            return { ...state, strength: action.strength };
        case 'setCreativity':
            return { ...state, creativity: action.creativity };
        case 'setPrompt':
            return { ...state, prompt: action.prompt };
        case 'setGenerating':
            return { ...state, isGenerating: action.isGenerating };
        case 'setResults':
            return { ...state, results: action.results };
        case 'clearResults':
            return { ...state, results: [], selectedResult: null };
        case 'toggleSelectedResult':
            return {
                ...state,
                selectedResult: state.selectedResult === action.index ? null : action.index,
            };
        case 'resetSelection':
            return { ...state, selectedResult: null };
        case 'resetAll':
            return initialState;
        default:
            return state;
    }
}

export default function VariationsPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-background text-foreground" />}>
            <VariationsPageContent />
        </Suspense>
    );
}

function VariationsPageContent() {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [state, dispatch] = useReducer(variationsReducer, initialState);
    const [projectId, setProjectId] = useState<string | null>(null);
    const [isProjectLoading, setIsProjectLoading] = useState(false);
    const [isProjectSaving, setIsProjectSaving] = useState(false);
    const [projectError, setProjectError] = useState<string | null>(null);
    const { imageVariations } = useGenerationStore();
    const { replace } = useRouter();
    const searchParams = useSearchParams();
    const searchParamsSnapshot = useMemo(() => new URLSearchParams(searchParams), [searchParams]);
    const isProjectBusy = isProjectLoading || isProjectSaving;

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const uploaded = await mediaApi.uploadMedia(file);
                if (!uploaded?.url) {
                    toast.error('Failed to upload image');
                    return;
                }
                dispatch({ type: 'setUploadedImage', uploadedImage: uploaded.url });
                dispatch({ type: 'clearResults' });
            } catch (error) {
                toast.error(getUserFacingErrorMessage(error, 'Failed to upload image'));
            }
        }
    };

    const handleGenerate = async () => {
        if (!state.uploadedImage) return;
        dispatch({ type: 'setGenerating', isGenerating: true });
        try {
            await imageVariations({
                imageUrl: state.uploadedImage,
                prompt: state.prompt || `Generate ${state.variationType} variations`,
                strength: state.strength,
                count: state.count,
            });
        } catch (error) {
            toast.error(getUserFacingErrorMessage(error, 'Failed to generate variations'));
        } finally {
            dispatch({ type: 'setGenerating', isGenerating: false });
        }
    };

    const handleReset = () => {
        dispatch({ type: 'resetAll' });
        setProjectError(null);
    };

    const downloadVariation = (url: string, filename: string) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.target = '_blank';
        link.rel = 'noreferrer';
        link.click();
    };

    const copyVariationUrl = async (url: string) => {
        try {
            await navigator.clipboard.writeText(url);
            toast.success('Variation URL copied to clipboard.');
        } catch {
            toast.error('Failed to copy variation URL.');
        }
    };

    const handleSaveAll = () => {
        const payload: VariationsProjectPayload = {
            version: 1,
            savedAt: new Date().toISOString(),
            snapshot: {
                uploadedImage: state.uploadedImage,
                variationType: state.variationType,
                count: state.count,
                strength: state.strength,
                creativity: state.creativity,
                prompt: state.prompt,
                results: state.results,
                selectedResult: state.selectedResult,
            },
        };

        localStorage.setItem('variations:draft:v1', JSON.stringify(payload));

        const persistProject = async () => {
            setIsProjectSaving(true);
            try {
                if (projectId) {
                    await projectApi.update(projectId, {
                        name: 'Variations Draft',
                        description: 'Image variations draft',
                        content: payload,
                    });
                } else {
                    const created = await projectApi.create({
                        name: 'Variations Draft',
                        description: 'Image variations draft',
                        content: payload,
                    });
                    setProjectId(created.project.id);
                    replace(`${window.location.pathname}?projectId=${created.project.id}`);
                }

                toast.success('Variations saved to your projects.');
            } catch (saveError) {
                console.error('Failed to persist variations project', saveError);
                toast.error('Saved locally, but backend project save failed.');
            } finally {
                setIsProjectSaving(false);
            }
        };

        void persistProject();
    };

    const handleExportAll = () => {
        const payload = {
            version: 1,
            exportedAt: new Date().toISOString(),
            uploadedImage: state.uploadedImage,
            variationType: state.variationType,
            count: state.count,
            strength: state.strength,
            creativity: state.creativity,
            prompt: state.prompt,
            results: state.results,
            selectedResult: state.selectedResult,
        };

        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'variations-export.json';
        link.click();
        URL.revokeObjectURL(url);
        toast.success('Variations export created.');
    };

    useEffect(() => {
        const queryProjectId = searchParamsSnapshot.get('projectId');
        if (queryProjectId) {
            setProjectId(queryProjectId);
        }
    }, [searchParams]);

    useEffect(() => {
        let cancelled = false;

        const hydrate = (snapshot: Partial<VariationsSnapshot>) => {
            dispatch({ type: 'setUploadedImage', uploadedImage: snapshot.uploadedImage ?? null });
            dispatch({ type: 'setVariationType', variationType: snapshot.variationType ?? initialState.variationType });
            dispatch({ type: 'setCount', count: snapshot.count ?? initialState.count });
            dispatch({ type: 'setStrength', strength: snapshot.strength ?? initialState.strength });
            dispatch({ type: 'setCreativity', creativity: snapshot.creativity ?? initialState.creativity });
            dispatch({ type: 'setPrompt', prompt: snapshot.prompt ?? initialState.prompt });
            dispatch({ type: 'setResults', results: snapshot.results ?? initialState.results });
            if (typeof snapshot.selectedResult === 'number') {
                dispatch({ type: 'toggleSelectedResult', index: snapshot.selectedResult });
            }
        };

        const loadProject = async () => {
            const draftRaw = localStorage.getItem('variations:draft:v1');

            if (!projectId) {
                try {
                    if (draftRaw) {
                        hydrate(normalizeVariationsSnapshot(JSON.parse(draftRaw)));
                    }
                } catch (loadError) {
                    console.error('Failed to restore variations draft', loadError);
                }
                return;
            }

            setIsProjectLoading(true);
            setProjectError(null);
            try {
                const project = await projectApi.get(projectId);
                const rawContent = project.content as string | Record<string, unknown> | null | undefined;
                const parsed = typeof rawContent === 'string' ? JSON.parse(rawContent) : rawContent;
                if (!cancelled) {
                    hydrate(normalizeVariationsSnapshot(parsed));
                }
            } catch (loadError) {
                console.error('Failed to restore variations project', loadError);
                if (!cancelled) {
                    setProjectError('Could not load the saved variations project. Falling back to a local draft.');
                    try {
                        if (draftRaw) {
                            hydrate(normalizeVariationsSnapshot(JSON.parse(draftRaw)));
                        }
                    } catch (fallbackError) {
                        console.error('Failed to restore variations fallback', fallbackError);
                    }
                }
            } finally {
                if (!cancelled) {
                    setIsProjectLoading(false);
                }
            }
        };

        void loadProject();

        return () => {
            cancelled = true;
        };
    }, [projectId]);

    return (
        <CreatorWorkspaceShell>
            <div className="w-[320px] border-r border-border flex flex-col shrink-0 bg-background">
                <div className="h-14 px-6 border-b border-border flex items-center justify-between shrink-0">
                    <h2 className="font-semibold text-muted-foreground">Variations</h2>
                    <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-primary/10 border border-primary/20 rounded-full text-primary text-[10px] font-bold">
                        <Sparkles className="size-2.5" /> New
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-6  gap-y-6">
                    {/* Upload */}
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="group relative aspect-square rounded-2xl bg-muted border-2 border-dashed border-border hover:border-primary/30 transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center gap-3"
                    >
                        {state.uploadedImage ? (
                            <Image src={state.uploadedImage} alt="Source" fill className="object-cover" sizes="(max-width: 768px) 100vw, 320px" />
                        ) : (
                            <><div className="size-14 rounded-xl bg-accent flex items-center justify-center group-hover:scale-110 transition-all"><Upload className="size-6 text-muted-foreground" /></div>
                            <div className="text-center"><p className="text-sm font-medium">Source Image</p><p className="text-[10px] text-muted-foreground mt-1">Upload the image to create variations</p></div></>
                        )}
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />

                    {/* Variation Type */}
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.1em]">Variation Type</h4>
                        <div className="space-y-1.5">
                            {variationTypes.map((t) => (
                                <button key={t.id} onClick={() => dispatch({ type: 'setVariationType', variationType: t.id })} className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all text-left", state.variationType === t.id ? "bg-accent border-primary/20" : "bg-card border-border hover:border-border/80")}>
                                    <div className={cn("size-4 rounded-full border-2 flex items-center justify-center", state.variationType === t.id ? "border-primary" : "border-muted-foreground/30")}>
                                        {state.variationType === t.id && <div className="size-2 rounded-full bg-primary" />}
                                    </div>
                                    <div><p className="text-xs font-medium">{t.label}</p><p className="text-[9px] text-muted-foreground">{t.description}</p></div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="space-y-5">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between"><Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Count</Label><span className="text-[11px] font-mono">{state.count}</span></div>
                            <Slider min={2} max={8} step={1} value={[state.count]} onValueChange={([v]) => dispatch({ type: 'setCount', count: v })} />
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between"><Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Variation Strength</Label><span className="text-[11px] font-mono">{state.strength}%</span></div>
                            <Slider min={10} max={100} step={5} value={[state.strength]} onValueChange={([v]) => dispatch({ type: 'setStrength', strength: v })} />
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between"><Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Creativity</Label><span className="text-[11px] font-mono">{state.creativity}%</span></div>
                            <Slider min={0} max={100} step={5} value={[state.creativity]} onValueChange={([v]) => dispatch({ type: 'setCreativity', creativity: v })} />
                        </div>
                    </div>

                    {/* Prompt Guidance */}
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.1em]">Guidance (Optional)</h4>
                        <textarea value={state.prompt} onChange={(e) => dispatch({ type: 'setPrompt', prompt: e.target.value })} placeholder="Guide the variation direction?" className="w-full h-20 bg-card border border-border rounded-xl p-3 text-xs resize-none outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground" />
                    </div>
                </div>
                <div className="p-4 border-t border-border space-y-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground px-1"><span>Cost:</span><span className="font-medium text-foreground">{state.count} Credits</span></div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleReset} disabled={isProjectBusy} className="h-12 flex-1 font-bold rounded-xl gap-2">
                            <Folder className="size-5" />
                            Reset
                        </Button>
                        <Button onClick={handleGenerate} disabled={state.isGenerating || isProjectBusy || !state.uploadedImage} className="h-12 flex-[2] font-bold rounded-xl gap-2">
                            {state.isGenerating ? (<><Loader2 className="size-5 animate-spin" /> Generating?</>) : (<><Shuffle className="size-5" /> Generate Variations</>)}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Results */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {state.results.length > 0 && (
                    <div className="h-14 px-6 border-b border-border flex items-center justify-between shrink-0">
                        <span className="text-sm font-medium">{state.results.length} variations</span>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="gap-2" onClick={handleSaveAll} disabled={isProjectBusy}><Folder className="size-4" /> {isProjectSaving ? 'Saving...' : 'Save All'}</Button>
                            <Button size="sm" className="gap-2" onClick={handleExportAll}><Download className="size-4" /> Export All</Button>
                        </div>
                    </div>
                )}
                <div className="flex-1 overflow-y-auto p-6">
                    {state.isGenerating ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4"><div className="relative"><div className="size-16 rounded-full border-4 border-muted border-t-primary animate-spin" /><Shuffle className="size-6 text-muted-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" /></div><p className="text-sm text-muted-foreground animate-pulse">Creating {state.count} variations?</p></div>
                    ) : state.results.length > 0 ? (
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
                            {/* Source Image */}
                            <div className="relative">
                                <div className="relative aspect-square rounded-2xl border-2 border-primary/30 overflow-hidden shadow-lg">
                                    <Image src={state.uploadedImage!} alt="Source" fill className="object-cover" sizes="(max-width: 768px) 100vw, 400px" />
                                </div>
                                <div className="absolute top-3 left-3 px-2 py-1 bg-primary text-primary-foreground rounded-md text-[10px] font-bold">SOURCE</div>
                            </div>
                            {state.results.map((url, i) => (
                                <div
                                    key={url}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            dispatch({ type: 'toggleSelectedResult', index: i });
                                        }
                                    }}
                                    className="group relative cursor-pointer"
                                    onClick={() => dispatch({ type: 'toggleSelectedResult', index: i })}
                                >
                                    <div className={cn("aspect-square rounded-2xl border overflow-hidden shadow-lg transition-all", state.selectedResult === i ? "border-primary ring-2 ring-primary/20 scale-[1.02]" : "border-border hover:border-primary/30")}>
                                        <Image src={url} alt={`Variation ${i + 1}`} fill className="object-cover" sizes="(max-width: 768px) 100vw, 400px" />
                                    </div>
                                    <div className="absolute inset-0 rounded-2xl bg-zinc-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <Button size="icon" variant="secondary" className="size-9" onClick={() => downloadVariation(url, `variation-${i + 1}.png`)}><Download className="size-4" /></Button>
                                        <Button size="icon" variant="secondary" className="size-9" onClick={() => copyVariationUrl(url)}><Copy className="size-4" /></Button>
                                    </div>
                                    <div className="absolute top-3 left-3 px-2 py-1 bg-background/80 backdrop-blur-sm rounded-md text-[10px] font-bold">V{i + 1}</div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                            <div className="size-20 rounded-2xl bg-muted border border-border flex items-center justify-center"><Copy className="size-8 text-muted-foreground" /></div>
                            <div><h3 className="font-semibold">Create Image Variations</h3><p className="text-sm text-muted-foreground mt-1">Upload an image to generate multiple creative variations</p></div>
                        </div>
                    )}
                    {projectError && (
                        <p className="mt-4 text-sm text-amber-500/90 text-center">{projectError}</p>
                    )}
                </div>
            </div>
        </CreatorWorkspaceShell>
    );
}
