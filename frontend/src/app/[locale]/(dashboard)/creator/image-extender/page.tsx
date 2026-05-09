'use client';

import Image from 'next/image';
import { Suspense, useEffect, useReducer, useRef, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { useGenerationStore } from '@/stores/generation-store';
import { mediaApi } from '@/services/mediaApi';
import { projectApi } from '@/services/projectApi';
import { Maximize, Upload, Download, Loader2, RotateCcw, Folder, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/ui/button';
import { Slider } from '@/ui/slider';
import { Label } from '@/ui/label';
import { cn } from '@/lib/utils';
import { CreatorWorkspaceShell } from '@/components/layouts/CreatorWorkspaceShell';

const expandDirections = [
    { id: 'all', label: 'All Sides', icon: Maximize },
    { id: 'left', label: 'Left', icon: ArrowLeft },
    { id: 'right', label: 'Right', icon: ArrowRight },
    { id: 'up', label: 'Up', icon: ArrowUp },
    { id: 'down', label: 'Down', icon: ArrowDown },
];

const targetRatios = [
    { id: '1:1', label: '1:1 Square' },
    { id: '16:9', label: '16:9 Wide' },
    { id: '9:16', label: '9:16 Tall' },
    { id: '4:3', label: '4:3 Standard' },
    { id: '3:2', label: '3:2 Photo' },
    { id: '21:9', label: '21:9 Ultra Wide' },
    { id: 'custom', label: 'Custom' },
];

type ImageExtenderState = {
    uploadedImage: string | null;
    direction: string;
    targetRatio: string;
    expandAmount: number;
    creativity: number;
    prompt: string;
};

type ImageExtenderSnapshot = {
    uploadedImage: string | null;
    resultImage: string | null;
    direction: string;
    targetRatio: string;
    expandAmount: number;
    creativity: number;
    prompt: string;
};

type ImageExtenderProjectPayload = {
    version: number;
    savedAt: string;
    snapshot: Partial<ImageExtenderSnapshot>;
};

const normalizeImageExtenderSnapshot = (value: unknown): Partial<ImageExtenderSnapshot> => {
    const raw = (value ?? {}) as Record<string, unknown>;
    const snapshot = (raw.snapshot && typeof raw.snapshot === 'object' ? raw.snapshot : raw) as Record<string, unknown>;
    const stringValue = (input: unknown, fallback = '') => (typeof input === 'string' ? input : fallback);
    const numberValue = (input: unknown, fallback: number) => (typeof input === 'number' ? input : fallback);

    return {
        uploadedImage: typeof snapshot.uploadedImage === 'string' ? snapshot.uploadedImage : null,
        resultImage: typeof snapshot.resultImage === 'string' ? snapshot.resultImage : null,
        direction: stringValue(snapshot.direction, initialState.direction),
        targetRatio: stringValue(snapshot.targetRatio, initialState.targetRatio),
        expandAmount: numberValue(snapshot.expandAmount, initialState.expandAmount),
        creativity: numberValue(snapshot.creativity, initialState.creativity),
        prompt: stringValue(snapshot.prompt, initialState.prompt),
    };
};

type ImageExtenderAction =
    | { type: 'setUploadedImage'; uploadedImage: string | null }
    | { type: 'setDirection'; direction: string }
    | { type: 'setTargetRatio'; targetRatio: string }
    | { type: 'setExpandAmount'; expandAmount: number }
    | { type: 'setCreativity'; creativity: number }
    | { type: 'setPrompt'; prompt: string };

const initialState: ImageExtenderState = {
    uploadedImage: null,
    direction: 'all',
    targetRatio: '16:9',
    expandAmount: 50,
    creativity: 50,
    prompt: '',
};

function reducer(state: ImageExtenderState, action: ImageExtenderAction): ImageExtenderState {
    switch (action.type) {
        case 'setUploadedImage':
            return { ...state, uploadedImage: action.uploadedImage };
        case 'setDirection':
            return { ...state, direction: action.direction };
        case 'setTargetRatio':
            return { ...state, targetRatio: action.targetRatio };
        case 'setExpandAmount':
            return { ...state, expandAmount: action.expandAmount };
        case 'setCreativity':
            return { ...state, creativity: action.creativity };
        case 'setPrompt':
            return { ...state, prompt: action.prompt };
        default:
            return state;
    }
}

export default function ImageExtenderPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-background text-foreground" />}>
            <ImageExtenderPageContent />
        </Suspense>
    );
}

function ImageExtenderPageContent() {
    const [state, dispatch] = useReducer(reducer, initialState);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [projectId, setProjectId] = useState<string | null>(null);
    const [isProjectLoading, setIsProjectLoading] = useState(false);
    const [isProjectSaving, setIsProjectSaving] = useState(false);
    const [projectError, setProjectError] = useState<string | null>(null);
    const [restoredResultImage, setRestoredResultImage] = useState<string | null>(null);
    const { imageExtend, currentGeneration, reset, isGenerating } = useGenerationStore();
    const { replace } = useRouter();
    const searchParams = useSearchParams();
    const searchParamsSnapshot = useMemo(() => new URLSearchParams(searchParams), [searchParams]);
    const resultImage = currentGeneration?.status === 'completed'
        ? currentGeneration.resultUrl ?? null
        : restoredResultImage;
    const isProcessing = isGenerating;

    useEffect(() => {
        const queryProjectId = searchParamsSnapshot.get('projectId');
        if (queryProjectId) {
            setProjectId(queryProjectId);
        }
    }, [searchParams]);

    useEffect(() => {
        let cancelled = false;

        const hydrateFromSnapshot = (snapshot: Partial<ImageExtenderSnapshot>) => {
            dispatch({ type: 'setUploadedImage', uploadedImage: snapshot.uploadedImage ?? initialState.uploadedImage });
            dispatch({ type: 'setDirection', direction: snapshot.direction ?? initialState.direction });
            dispatch({ type: 'setTargetRatio', targetRatio: snapshot.targetRatio ?? initialState.targetRatio });
            dispatch({ type: 'setExpandAmount', expandAmount: snapshot.expandAmount ?? initialState.expandAmount });
            dispatch({ type: 'setCreativity', creativity: snapshot.creativity ?? initialState.creativity });
            dispatch({ type: 'setPrompt', prompt: snapshot.prompt ?? initialState.prompt });
            setRestoredResultImage(snapshot.resultImage ?? null);
        };

        const loadProject = async () => {
            if (!projectId) {
                try {
                    const raw = localStorage.getItem('image-extender:draft:v1');
                    if (raw) {
                        hydrateFromSnapshot(normalizeImageExtenderSnapshot(JSON.parse(raw)));
                    }
                } catch (loadError) {
                    console.error('Failed to restore image extender draft', loadError);
                }
                return;
            }

            setIsProjectLoading(true);
            setProjectError(null);
            try {
                const project = await projectApi.get(projectId);
                const rawContent = project.content as string | Record<string, unknown> | null | undefined;
                const parsed = typeof rawContent === 'string'
                    ? JSON.parse(rawContent)
                    : ((rawContent && typeof rawContent === 'object' && 'snapshot' in rawContent
                        ? (rawContent as { snapshot?: Partial<ImageExtenderProjectPayload> }).snapshot
                        : rawContent) ?? {});
                if (!cancelled) {
                    hydrateFromSnapshot(normalizeImageExtenderSnapshot(parsed));
                }
            } catch (loadError) {
                console.error('Failed to restore image extender project', loadError);
                if (!cancelled) {
                    setProjectError('Could not load the saved image extender project. Falling back to a local draft.');
                    try {
                        const raw = localStorage.getItem('image-extender:draft:v1');
                        if (raw) {
                            hydrateFromSnapshot(normalizeImageExtenderSnapshot(JSON.parse(raw)));
                        }
                    } catch (fallbackError) {
                        console.error('Failed to restore image extender fallback', fallbackError);
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

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            reset();
            setRestoredResultImage(null);
            const uploaded = await mediaApi.uploadMedia(file);
            if (!uploaded?.url) {
                toast.error('Failed to upload image');
                return;
            }
            dispatch({ type: 'setUploadedImage', uploadedImage: uploaded.url });
        }
    };

    const handleExtend = async () => {
        if (!state.uploadedImage) return;
        try {
            await imageExtend({
                imageUrl: state.uploadedImage,
                direction: state.direction,
                pixels: state.expandAmount,
                prompt: state.prompt || `Extend image ${state.direction}`,
            });
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to extend image');
        }
    };

    const handleSave = () => {
        if (!resultImage && !state.uploadedImage) return;

        const snapshot: Partial<ImageExtenderSnapshot> = {
            uploadedImage: state.uploadedImage,
            resultImage,
            direction: state.direction,
            targetRatio: state.targetRatio,
            expandAmount: state.expandAmount,
            creativity: state.creativity,
            prompt: state.prompt,
        };
        const payload: ImageExtenderProjectPayload = {
            version: 1,
            savedAt: new Date().toISOString(),
            snapshot,
        };

        localStorage.setItem('image-extender:draft:v1', JSON.stringify(payload));

        const persistProject = async () => {
            setIsProjectSaving(true);
            try {
                if (projectId) {
                    await projectApi.update(projectId, {
                        name: 'Image Extender Draft',
                        description: 'Image extender draft',
                        content: payload,
                    });
                } else {
                    const created = await projectApi.create({
                        name: 'Image Extender Draft',
                        description: 'Image extender draft',
                        content: payload,
                    });
                    setProjectId(created.project.id);
                    replace(`${window.location.pathname}?projectId=${created.project.id}`);
                }

                toast.success('Image extender saved to your projects.');
            } catch (saveError) {
                console.error('Failed to persist image extender project', saveError);
                toast.error('Saved locally, but backend project save failed.');
            } finally {
                setIsProjectSaving(false);
            }
        };

        void persistProject();
    };

    const handleExport = () => {
        if (!resultImage && !state.uploadedImage) return;

        const payload = {
            version: 1,
            exportedAt: new Date().toISOString(),
            uploadedImage: state.uploadedImage,
            resultImage,
            settings: {
                direction: state.direction,
                targetRatio: state.targetRatio,
                expandAmount: state.expandAmount,
                creativity: state.creativity,
                prompt: state.prompt,
            },
        };

        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'image-extender-export.json';
        link.click();
        URL.revokeObjectURL(url);
        toast.success('Image extender export created.');
    };

    const handleReset = () => {
        reset();
        dispatch({ type: 'setUploadedImage', uploadedImage: null });
        dispatch({ type: 'setDirection', direction: 'all' });
        dispatch({ type: 'setTargetRatio', targetRatio: '16:9' });
        dispatch({ type: 'setExpandAmount', expandAmount: 50 });
        dispatch({ type: 'setCreativity', creativity: 50 });
        dispatch({ type: 'setPrompt', prompt: '' });
        setRestoredResultImage(null);
        setProjectError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <CreatorWorkspaceShell>
            <div className="w-[320px] border-r border-border flex flex-col shrink-0 bg-background">
                <div className="h-14 px-6 border-b border-border flex items-center shrink-0">
                    <h2 className="font-semibold text-muted-foreground">Image Extender</h2>
                    <span className="ml-auto text-xs text-muted-foreground">
                        {isProjectLoading ? 'Loading project...' : projectError ?? ''}
                    </span>
                </div>
                <div className="flex-1 overflow-y-auto p-6  gap-y-6">
                    {/* Upload */}
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="group relative aspect-[4/3] rounded-2xl bg-muted border-2 border-dashed border-border hover:border-primary/30 transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center gap-3">
                        {state.uploadedImage ? (<div className="relative h-full w-full"><Image src={state.uploadedImage} alt="Preview" fill className="object-contain" sizes="320px" /></div>) : (
                            <><div className="size-14 rounded-xl bg-accent flex items-center justify-center group-hover:scale-110 transition-all"><Upload className="size-6 text-muted-foreground" /></div>
                            <div className="text-center"><p className="text-sm font-medium">Upload Image</p><p className="text-[10px] text-muted-foreground mt-1">Image to extend beyond borders</p></div></>
                        )}
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />

                    {/* Direction */}
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.1em]">Expand Direction</h4>
                        <div className="grid grid-cols-5 gap-1.5">
                            {expandDirections.map((d) => (
                                <button key={d.id} onClick={() => dispatch({ type: 'setDirection', direction: d.id })} className={cn("flex flex-col items-center gap-1 p-2.5 rounded-xl border transition-all", state.direction === d.id ? "bg-accent border-primary/20" : "bg-card border-border")}>
                                    <d.icon className="size-4" />
                                    <span className="text-[8px] font-medium">{d.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Target Ratio */}
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.1em]">Target Ratio</h4>
                        <div className="flex flex-wrap gap-1.5">
                            {targetRatios.map((r) => (
                                <button key={r.id} onClick={() => dispatch({ type: 'setTargetRatio', targetRatio: r.id })} className={cn("px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all", state.targetRatio === r.id ? "bg-accent border border-primary/20" : "bg-card border border-border")}>{r.label}</button>
                            ))}
                        </div>
                    </div>

                    {/* Expand Amount */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between"><Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Expand Amount</Label><span className="text-[11px] font-mono">{state.expandAmount}%</span></div>
                        <Slider min={10} max={200} step={10} value={[state.expandAmount]} onValueChange={([v]) => dispatch({ type: 'setExpandAmount', expandAmount: v })} />
                    </div>

                    {/* Creativity */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between"><Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Creativity</Label><span className="text-[11px] font-mono">{state.creativity}%</span></div>
                        <Slider min={0} max={100} step={5} value={[state.creativity]} onValueChange={([v]) => dispatch({ type: 'setCreativity', creativity: v })} />
                    </div>

                    {/* Prompt */}
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.1em]">Context Prompt (Optional)</h4>
                        <textarea value={state.prompt} onChange={(e) => dispatch({ type: 'setPrompt', prompt: e.target.value })} placeholder="Describe what should appear in the extended area?" className="w-full h-20 bg-card border border-border rounded-xl p-3 text-xs resize-none outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground" />
                    </div>
                </div>
                <div className="p-4 border-t border-border space-y-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground px-1"><span>Cost:</span><span className="font-medium text-foreground">2 Credits</span></div>
                    <Button onClick={handleExtend} disabled={isProcessing || !state.uploadedImage || isProjectLoading || isProjectSaving} className="w-full h-12 font-bold rounded-xl gap-2">
                        {isProcessing ? (<><Loader2 className="size-5 animate-spin" /> Extending?</>) : (<><Maximize className="size-5" /> Extend Image</>)}
                    </Button>
                </div>
            </div>

            <div className="flex-1 flex flex-col min-w-0">
                {resultImage && (
                    <div className="h-14 px-6 border-b border-border flex items-center justify-end gap-2 shrink-0">
                        <Button variant="ghost" size="sm" className="gap-1.5 text-xs mr-auto" onClick={handleReset}><RotateCcw className="size-4" /> Reset</Button>
                        <Button variant="outline" size="sm" className="gap-2" onClick={handleSave}><Folder className="size-4" /> Save</Button>
                        <Button size="sm" className="gap-2" onClick={handleExport}><Download className="size-4" /> Export</Button>
                    </div>
                )}
                <div className="flex-1 flex items-center justify-center p-8">
                    {!state.uploadedImage ? (
                        <div className="text-center space-y-4">
                            <div className="size-20 rounded-2xl bg-muted border border-border flex items-center justify-center mx-auto"><Maximize className="size-8 text-muted-foreground" /></div>
                            <div><h3 className="font-semibold">Extend Images with AI</h3><p className="text-sm text-muted-foreground mt-1">Upload an image to expand beyond its borders with AI outpainting</p></div>
                        </div>
                    ) : isProcessing ? (
                        <div className="flex flex-col items-center gap-4"><div className="relative"><div className="size-16 rounded-full border-4 border-muted border-t-primary animate-spin" /><Maximize className="size-6 text-muted-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" /></div><p className="text-sm text-muted-foreground animate-pulse">Extending image?</p></div>
                    ) : (
                        <div className="relative h-[70vh] w-full max-w-5xl rounded-2xl border border-border shadow-2xl overflow-hidden bg-[repeating-conic-gradient(#80808010_0%_25%,transparent_0%_50%)] bg-[length:16px_16px]">
                            <Image src={resultImage || state.uploadedImage} alt="Result" fill className="object-contain" sizes="100vw" />
                        </div>
                    )}
                </div>
            </div>
        </CreatorWorkspaceShell>
    );
}
