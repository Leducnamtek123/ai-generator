'use client';

import { Suspense, useEffect, useReducer, useRef, useState, useMemo } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { projectApi } from '@/services/projectApi';
import { useGenerationStore } from '@/stores/generation-store';
import {
    Type, Image as ImageIcon, Square, Circle, Triangle, Star,
    Download, Sparkles, Loader2, Folder, Plus, Trash2, Layers,
    AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline,
    ZoomIn, ZoomOut, Undo2, Redo2, Move, MousePointer, RotateCcw
} from 'lucide-react';
import { Button } from '@/ui/button';
import { cn } from '@/lib/utils';
import { CreatorWorkspaceShell } from '@/components/layouts/CreatorWorkspaceShell';

const canvasSizes = [
    { id: 'ig-post', label: 'Instagram Post', size: '1080×1080' },
    { id: 'ig-story', label: 'Instagram Story', size: '1080×1920' },
    { id: 'fb-cover', label: 'Facebook Cover', size: '820×312' },
    { id: 'yt-thumb', label: 'YouTube Thumb', size: '1280×720' },
    { id: 'twitter', label: 'Twitter Post', size: '1200×675' },
    { id: 'linkedin', label: 'LinkedIn Banner', size: '1584×396' },
    { id: 'poster', label: 'Poster', size: '2480×3508' },
    { id: 'custom', label: 'Custom Size', size: 'Custom' },
];

const elementTools = [
    { id: 'text', icon: Type, label: 'Text' },
    { id: 'shape', icon: Square, label: 'Shape' },
    { id: 'image', icon: ImageIcon, label: 'Image' },
    { id: 'ai', icon: Sparkles, label: 'AI Generate' },
];

const shapes = [
    { id: 'rect', icon: Square, label: 'Rectangle' },
    { id: 'circle', icon: Circle, label: 'Circle' },
    { id: 'triangle', icon: Triangle, label: 'Triangle' },
    { id: 'star', icon: Star, label: 'Star' },
];

const CANVAS_WIDTH = 500;
const MIN_ELEMENT_SIZE = 24;
const SNAP_THRESHOLD = 6;

interface DesignElement {
    id: string;
    type: 'text' | 'shape' | 'image';
    label: string;
    x: number;
    y: number;
    width: number;
    height: number;
    fontWeight?: number;
    fontStyle?: 'normal' | 'italic';
    textDecoration?: 'none' | 'underline';
    textAlign?: 'left' | 'center' | 'right';
}

type ActivePanel = 'templates' | 'elements' | 'text' | 'ai';
type ActiveTool = 'select' | 'move';
type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

type AlignmentGuide = {
    orientation: 'vertical' | 'horizontal';
    position: number;
};

type CanvasInteraction = {
    mode: 'drag' | 'resize';
    elementId: string;
    handle?: ResizeHandle;
    startPointer: { x: number; y: number };
    startElements: DesignElement[];
    canvasBounds: { width: number; height: number };
    zoomScale: number;
};

type DesignEditorState = {
    selectedSize: string;
    activePanel: ActivePanel;
    elements: DesignElement[];
    selectedElementId: string | null;
    activeTool: ActiveTool;
    aiPrompt: string;
    isGenerating: boolean;
    canvasZoom: number;
};

type DesignEditorSnapshot = {
    selectedSize: string;
    activePanel: ActivePanel;
    elements: DesignElement[];
    selectedElementId: string | null;
    activeTool: ActiveTool;
    aiPrompt: string;
    isGenerating: boolean;
    canvasZoom: number;
};

type DesignEditorAction =
    | { type: 'setSelectedSize'; selectedSize: string }
    | { type: 'setActivePanel'; activePanel: ActivePanel }
    | { type: 'addElement'; element: DesignElement }
    | { type: 'deleteElement'; id: string }
    | { type: 'selectElement'; id: string | null }
    | { type: 'setActiveTool'; activeTool: ActiveTool }
    | { type: 'setAiPrompt'; aiPrompt: string }
    | { type: 'setGenerating'; isGenerating: boolean }
    | { type: 'setCanvasZoom'; canvasZoom: number }
    | { type: 'updateElementFrame'; id: string; patch: Partial<Pick<DesignElement, 'x' | 'y' | 'width' | 'height'>> }
    | { type: 'updateElementStyle'; id: string; patch: Partial<Pick<DesignElement, 'fontWeight' | 'fontStyle' | 'textDecoration' | 'textAlign'>> }
    | { type: 'restoreSnapshot'; snapshot: DesignEditorSnapshot }
    | { type: 'resetAll' };

const resizeHandles: Array<{ id: ResizeHandle; className: string; cursor: string }> = [
    { id: 'nw', className: '-left-1.5 -top-1.5', cursor: 'cursor-nwse-resize' },
    { id: 'n', className: 'left-1/2 -top-1.5 -translate-x-1/2', cursor: 'cursor-ns-resize' },
    { id: 'ne', className: '-right-1.5 -top-1.5', cursor: 'cursor-nesw-resize' },
    { id: 'e', className: '-right-1.5 top-1/2 -translate-y-1/2', cursor: 'cursor-ew-resize' },
    { id: 'se', className: '-right-1.5 -bottom-1.5', cursor: 'cursor-nwse-resize' },
    { id: 's', className: 'left-1/2 -bottom-1.5 -translate-x-1/2', cursor: 'cursor-ns-resize' },
    { id: 'sw', className: '-left-1.5 -bottom-1.5', cursor: 'cursor-nesw-resize' },
    { id: 'w', className: '-left-1.5 top-1/2 -translate-y-1/2', cursor: 'cursor-ew-resize' },
];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const getCanvasHeight = (selectedSize: string) => {
    if (selectedSize === 'ig-post') return CANVAS_WIDTH;
    if (selectedSize === 'ig-story') return CANVAS_WIDTH * (16 / 9);
    if (selectedSize === 'yt-thumb') return CANVAS_WIDTH * (9 / 16);
    if (selectedSize === 'fb-cover') return CANVAS_WIDTH * (312 / 820);
    return CANVAS_WIDTH * (3 / 4);
};

const getSnapTargets = (
    element: DesignElement,
    elements: DesignElement[],
    canvasBounds: { width: number; height: number },
) => {
    const verticalTargets = [
        { value: 0, guide: 0 },
        { value: canvasBounds.width / 2, guide: canvasBounds.width / 2 },
        { value: canvasBounds.width, guide: canvasBounds.width },
    ];
    const horizontalTargets = [
        { value: 0, guide: 0 },
        { value: canvasBounds.height / 2, guide: canvasBounds.height / 2 },
        { value: canvasBounds.height, guide: canvasBounds.height },
    ];

    for (const other of elements) {
        if (other.id === element.id) continue;
        verticalTargets.push(
            { value: other.x, guide: other.x },
            { value: other.x + other.width / 2, guide: other.x + other.width / 2 },
            { value: other.x + other.width, guide: other.x + other.width },
        );
        horizontalTargets.push(
            { value: other.y, guide: other.y },
            { value: other.y + other.height / 2, guide: other.y + other.height / 2 },
            { value: other.y + other.height, guide: other.y + other.height },
        );
    }

    return { verticalTargets, horizontalTargets };
};

const snapFrame = (
    frame: Pick<DesignElement, 'x' | 'y' | 'width' | 'height'>,
    element: DesignElement,
    elements: DesignElement[],
    canvasBounds: { width: number; height: number },
) => {
    const guides: AlignmentGuide[] = [];
    const { verticalTargets, horizontalTargets } = getSnapTargets(element, elements, canvasBounds);
    const verticalCandidates = [
        { value: frame.x, apply: (next: number) => ({ x: next }) },
        { value: frame.x + frame.width / 2, apply: (next: number) => ({ x: next - frame.width / 2 }) },
        { value: frame.x + frame.width, apply: (next: number) => ({ x: next - frame.width }) },
    ];
    const horizontalCandidates = [
        { value: frame.y, apply: (next: number) => ({ y: next }) },
        { value: frame.y + frame.height / 2, apply: (next: number) => ({ y: next - frame.height / 2 }) },
        { value: frame.y + frame.height, apply: (next: number) => ({ y: next - frame.height }) },
    ];

    let nextFrame = { ...frame };
    let bestVertical: { distance: number; target: number; apply: (next: number) => { x: number } } | null = null;
    let bestHorizontal: { distance: number; target: number; apply: (next: number) => { y: number } } | null = null;

    for (const candidate of verticalCandidates) {
        for (const target of verticalTargets) {
            const distance = Math.abs(candidate.value - target.value);
            if (distance <= SNAP_THRESHOLD && (!bestVertical || distance < bestVertical.distance)) {
                bestVertical = { distance, target: target.guide, apply: candidate.apply };
            }
        }
    }

    for (const candidate of horizontalCandidates) {
        for (const target of horizontalTargets) {
            const distance = Math.abs(candidate.value - target.value);
            if (distance <= SNAP_THRESHOLD && (!bestHorizontal || distance < bestHorizontal.distance)) {
                bestHorizontal = { distance, target: target.guide, apply: candidate.apply };
            }
        }
    }

    if (bestVertical) {
        nextFrame = { ...nextFrame, ...bestVertical.apply(bestVertical.target) };
        guides.push({ orientation: 'vertical', position: bestVertical.target });
    }

    if (bestHorizontal) {
        nextFrame = { ...nextFrame, ...bestHorizontal.apply(bestHorizontal.target) };
        guides.push({ orientation: 'horizontal', position: bestHorizontal.target });
    }

    return { frame: nextFrame, guides };
};

const initialState: DesignEditorState = {
    selectedSize: 'ig-post',
    activePanel: 'templates',
    elements: [
        { id: '1', type: 'text', label: 'Your Title Here', x: 100, y: 100, width: 300, height: 60, fontWeight: 700, fontStyle: 'normal', textDecoration: 'none', textAlign: 'left' },
        { id: '2', type: 'shape', label: 'Background Shape', x: 50, y: 50, width: 400, height: 400 },
    ],
    selectedElementId: null,
    activeTool: 'select',
    aiPrompt: '',
    isGenerating: false,
    canvasZoom: 100,
};

function reducer(state: DesignEditorState, action: DesignEditorAction): DesignEditorState {
    switch (action.type) {
        case 'setSelectedSize':
            return { ...state, selectedSize: action.selectedSize };
        case 'setActivePanel':
            return { ...state, activePanel: action.activePanel };
        case 'addElement':
            return {
                ...state,
                elements: [...state.elements, action.element],
                selectedElementId: action.element.id,
            };
        case 'deleteElement':
            const nextElements = [];

            for (const element of state.elements) {
                if (element.id !== action.id) {
                    nextElements.push(element);
                }
            }

            return {
                ...state,
                elements: nextElements,
                selectedElementId: state.selectedElementId === action.id ? null : state.selectedElementId,
            };
        case 'selectElement':
            return { ...state, selectedElementId: action.id };
        case 'setActiveTool':
            return { ...state, activeTool: action.activeTool };
        case 'setAiPrompt':
            return { ...state, aiPrompt: action.aiPrompt };
        case 'setGenerating':
            return { ...state, isGenerating: action.isGenerating };
        case 'setCanvasZoom':
            return { ...state, canvasZoom: action.canvasZoom };
        case 'updateElementFrame':
            return {
                ...state,
                elements: state.elements.map((element) =>
                    element.id === action.id ? { ...element, ...action.patch } : element,
                ),
            };
        case 'updateElementStyle':
            return {
                ...state,
                elements: state.elements.map((element) =>
                    element.id === action.id ? { ...element, ...action.patch } : element,
                ),
            };
        case 'restoreSnapshot':
            return {
                ...state,
                ...action.snapshot,
            };
        case 'resetAll':
            return initialState;
        default:
            return state;
    }
}

export default function DesignEditorPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-background text-foreground" />}>
            <DesignEditorPageContent />
        </Suspense>
    );
}

function DesignEditorPageContent() {
    const [state, dispatch] = useReducer(reducer, initialState);
    const { startGeneration } = useGenerationStore();
    const { replace } = useRouter();
    const searchParams = useSearchParams();
    const searchParamsSnapshot = useMemo(() => new URLSearchParams(searchParams), [searchParams]);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [pastSnapshots, setPastSnapshots] = useState<DesignEditorSnapshot[]>([]);
    const [futureSnapshots, setFutureSnapshots] = useState<DesignEditorSnapshot[]>([]);
    const [projectId, setProjectId] = useState<string | null>(null);
    const [isProjectLoading, setIsProjectLoading] = useState(false);
    const [isProjectSaving, setIsProjectSaving] = useState(false);
    const canvasRef = useRef<HTMLDivElement | null>(null);
    const interactionHistoryRecordedRef = useRef(false);
    const [interaction, setInteraction] = useState<CanvasInteraction | null>(null);
    const [alignmentGuides, setAlignmentGuides] = useState<AlignmentGuide[]>([]);

    useEffect(() => {
        const queryProjectId = searchParamsSnapshot.get('projectId');
        if (queryProjectId) {
            setProjectId(queryProjectId);
        }
    }, [searchParams]);

    useEffect(() => {
        let cancelled = false;

        const restoreFromPayload = (payload: Partial<DesignEditorSnapshot> & { canvasZoom?: number }) => {
            dispatch({
                type: 'restoreSnapshot',
                snapshot: {
                    selectedSize: payload.selectedSize ?? initialState.selectedSize,
                    activePanel: payload.activePanel ?? initialState.activePanel,
                    elements: Array.isArray(payload.elements) ? payload.elements : initialState.elements,
                    selectedElementId: payload.selectedElementId ?? initialState.selectedElementId,
                    activeTool: payload.activeTool ?? initialState.activeTool,
                    aiPrompt: payload.aiPrompt ?? initialState.aiPrompt,
                    isGenerating: payload.isGenerating ?? initialState.isGenerating,
                    canvasZoom: payload.canvasZoom ?? initialState.canvasZoom,
                },
            });
        };

        const loadProject = async () => {
            if (!projectId) {
                try {
                    const raw = localStorage.getItem('design-editor:draft:v1');
                    if (!raw) {
                        return;
                    }

                    const parsed = JSON.parse(raw) as Partial<DesignEditorSnapshot> & { canvasZoom?: number };
                    restoreFromPayload(parsed);
                } catch (error) {
                    console.error('Failed to restore design draft', error);
                }
                return;
            }

            setIsProjectLoading(true);
            try {
                const project = await projectApi.get(projectId);
                const rawContent = project.content as
                    | string
                    | Record<string, unknown>
                    | null
                    | undefined;
                const parsed = typeof rawContent === 'string'
                    ? (JSON.parse(rawContent) as Partial<DesignEditorSnapshot> & { canvasZoom?: number })
                    : ((rawContent && typeof rawContent === 'object' && 'snapshot' in rawContent
                        ? (rawContent as { snapshot?: Partial<DesignEditorSnapshot> & { canvasZoom?: number } }).snapshot
                        : rawContent) ?? {}) as Partial<DesignEditorSnapshot> & { canvasZoom?: number };
                if (!cancelled) {
                    restoreFromPayload(parsed);
                }
            } catch (error) {
                console.error('Failed to restore design project', error);
                if (!cancelled) {
                    setErrorMessage('Could not load the saved design project. Falling back to a blank canvas.');
                    try {
                        const raw = localStorage.getItem('design-editor:draft:v1');
                        if (raw) {
                            const parsed = JSON.parse(raw) as Partial<DesignEditorSnapshot> & { canvasZoom?: number };
                            restoreFromPayload(parsed);
                        }
                    } catch (fallbackError) {
                        console.error('Failed to restore design draft fallback', fallbackError);
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

    const snapshotState = (): DesignEditorSnapshot => ({
        selectedSize: state.selectedSize,
        activePanel: state.activePanel,
        elements: state.elements.map((element) => ({ ...element })),
        selectedElementId: state.selectedElementId,
        activeTool: state.activeTool,
        aiPrompt: state.aiPrompt,
        isGenerating: state.isGenerating,
        canvasZoom: state.canvasZoom,
    });

    const recordHistory = () => {
        setPastSnapshots((current) => [...current, snapshotState()]);
        setFutureSnapshots([]);
    };

    const addElement = (type: 'text' | 'shape' | 'image') => {
        recordHistory();
        const nextIndex = state.elements.length;
        const newEl: DesignElement = {
            id: crypto.randomUUID(),
            type,
            label: type === 'text' ? 'New Text' : type === 'shape' ? 'Shape' : 'Image',
            x: 50 + (nextIndex % 4) * 40,
            y: 50 + (nextIndex % 3) * 40,
            width: type === 'text' ? 200 : 150,
            height: type === 'text' ? 40 : 150,
            fontWeight: 700,
            fontStyle: 'normal',
            textDecoration: 'none',
            textAlign: 'left',
        };
        dispatch({ type: 'addElement', element: newEl });
    };

    const deleteElement = (id: string) => {
        recordHistory();
        dispatch({ type: 'deleteElement', id });
    };

    const selectedTextElement = state.elements.find((element) => element.id === state.selectedElementId && element.type === 'text') ?? null;
    const selectedElement = state.elements.find((element) => element.id === state.selectedElementId) ?? null;

    useEffect(() => {
        if (!interaction) {
            return undefined;
        }

        const handlePointerMove = (event: PointerEvent) => {
            const element = interaction.startElements.find((item) => item.id === interaction.elementId);
            if (!element) {
                return;
            }

            const deltaX = (event.clientX - interaction.startPointer.x) / interaction.zoomScale;
            const deltaY = (event.clientY - interaction.startPointer.y) / interaction.zoomScale;
            if (!interactionHistoryRecordedRef.current && (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1)) {
                recordHistory();
                interactionHistoryRecordedRef.current = true;
            }

            let frame: Pick<DesignElement, 'x' | 'y' | 'width' | 'height'> = {
                x: element.x,
                y: element.y,
                width: element.width,
                height: element.height,
            };

            if (interaction.mode === 'drag') {
                frame = {
                    ...frame,
                    x: clamp(element.x + deltaX, 0, interaction.canvasBounds.width - element.width),
                    y: clamp(element.y + deltaY, 0, interaction.canvasBounds.height - element.height),
                };
            } else {
                const handle = interaction.handle ?? 'se';
                let nextX = element.x;
                let nextY = element.y;
                let nextWidth = element.width;
                let nextHeight = element.height;

                if (handle.includes('e')) {
                    nextWidth = clamp(element.width + deltaX, MIN_ELEMENT_SIZE, interaction.canvasBounds.width - element.x);
                }
                if (handle.includes('s')) {
                    nextHeight = clamp(element.height + deltaY, MIN_ELEMENT_SIZE, interaction.canvasBounds.height - element.y);
                }
                if (handle.includes('w')) {
                    const right = element.x + element.width;
                    nextX = clamp(element.x + deltaX, 0, right - MIN_ELEMENT_SIZE);
                    nextWidth = right - nextX;
                }
                if (handle.includes('n')) {
                    const bottom = element.y + element.height;
                    nextY = clamp(element.y + deltaY, 0, bottom - MIN_ELEMENT_SIZE);
                    nextHeight = bottom - nextY;
                }

                frame = { x: nextX, y: nextY, width: nextWidth, height: nextHeight };
            }

            const snapped = snapFrame(frame, element, interaction.startElements, interaction.canvasBounds);
            const nextFrame = {
                x: clamp(Math.round(snapped.frame.x), 0, interaction.canvasBounds.width - Math.round(snapped.frame.width)),
                y: clamp(Math.round(snapped.frame.y), 0, interaction.canvasBounds.height - Math.round(snapped.frame.height)),
                width: Math.round(snapped.frame.width),
                height: Math.round(snapped.frame.height),
            };

            dispatch({ type: 'updateElementFrame', id: interaction.elementId, patch: nextFrame });
            setAlignmentGuides(snapped.guides);
        };

        const handlePointerUp = () => {
            setInteraction(null);
            setAlignmentGuides([]);
            interactionHistoryRecordedRef.current = false;
        };

        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp, { once: true });

        return () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
        };
    }, [interaction]);

    const updateSelectedText = (patch: Partial<Pick<DesignElement, 'fontWeight' | 'fontStyle' | 'textDecoration' | 'textAlign'>>) => {
        if (!selectedTextElement) {
            toast.error('Select a text element first.');
            return;
        }

        recordHistory();
        dispatch({ type: 'updateElementStyle', id: selectedTextElement.id, patch });
    };

    const beginElementInteraction = (
        event: ReactPointerEvent<HTMLDivElement | HTMLButtonElement>,
        element: DesignElement,
        mode: CanvasInteraction['mode'],
        handle?: ResizeHandle,
    ) => {
        if (event.button !== 0 || !canvasRef.current) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        const canvasRect = canvasRef.current.getBoundingClientRect();
        const zoomScale = state.canvasZoom / 100;
        const canvasBounds = {
            width: CANVAS_WIDTH,
            height: Math.round(canvasRect.height / zoomScale) || getCanvasHeight(state.selectedSize),
        };

        interactionHistoryRecordedRef.current = false;
        dispatch({ type: 'selectElement', id: element.id });
        setInteraction({
            mode,
            elementId: element.id,
            handle,
            startPointer: { x: event.clientX, y: event.clientY },
            startElements: state.elements.map((item) => ({ ...item })),
            canvasBounds,
            zoomScale,
        });
    };

    const handleUndo = () => {
        setPastSnapshots((currentPast) => {
            if (!currentPast.length) {
                toast.info('Nothing to undo.');
                return currentPast;
            }

            const previous = currentPast[currentPast.length - 1];
            setFutureSnapshots((currentFuture) => [snapshotState(), ...currentFuture]);
            dispatch({ type: 'restoreSnapshot', snapshot: previous });
            return currentPast.slice(0, -1);
        });
    };

    const handleRedo = () => {
        setFutureSnapshots((currentFuture) => {
            if (!currentFuture.length) {
                toast.info('Nothing to redo.');
                return currentFuture;
            }

            const [next, ...rest] = currentFuture;
            setPastSnapshots((currentPast) => [...currentPast, snapshotState()]);
            dispatch({ type: 'restoreSnapshot', snapshot: next });
            return rest;
        });
    };

    const handleZoom = (direction: 'in' | 'out') => {
        recordHistory();
        const nextZoom = Math.min(200, Math.max(50, state.canvasZoom + (direction === 'in' ? 10 : -10)));
        dispatch({ type: 'setCanvasZoom', canvasZoom: nextZoom });
    };

    const handleAiGenerate = async () => {
        if (!state.aiPrompt.trim()) return;
        dispatch({ type: 'setGenerating', isGenerating: true });
        setErrorMessage(null);

        try {
            await startGeneration('/generations/image', { prompt: state.aiPrompt });
            toast.success('Design generation started.');
        } catch (error) {
            console.error('Failed to generate design', error);
            setErrorMessage('AI generation failed to start.');
            toast.error('Failed to start design generation.');
        } finally {
            dispatch({ type: 'setGenerating', isGenerating: false });
        }
    };

    const handleReset = () => {
        dispatch({ type: 'resetAll' });
        setPastSnapshots([]);
        setFutureSnapshots([]);
        setErrorMessage(null);
        toast.success('Design canvas reset.');
    };

    const handleSave = () => {
        const snapshot = {
            selectedSize: state.selectedSize,
            activePanel: state.activePanel,
            elements: state.elements,
            selectedElementId: state.selectedElementId,
            activeTool: state.activeTool,
            aiPrompt: state.aiPrompt,
            canvasZoom: state.canvasZoom,
        };

        localStorage.setItem('design-editor:draft:v1', JSON.stringify(snapshot));

        const persistProject = async () => {
            setIsProjectSaving(true);
            try {
                const description = JSON.stringify({
                    version: 1,
                    savedAt: new Date().toISOString(),
                    snapshot,
                });

                if (projectId) {
                    await projectApi.update(projectId, {
                        name: 'Design Editor Draft',
                        description: 'Design editor draft',
                        content: JSON.parse(description),
                    });
                } else {
                    const created = await projectApi.create({
                        name: 'Design Editor Draft',
                        description: 'Design editor draft',
                        content: JSON.parse(description),
                    });
                    setProjectId(created.project.id);
                    replace(`${window.location.pathname}?projectId=${created.project.id}`);
                }

                toast.success('Design saved to your projects.');
            } catch (error) {
                console.error('Failed to persist design project', error);
                toast.error('Saved locally, but backend project save failed.');
            } finally {
                setIsProjectSaving(false);
            }
        };

        void persistProject();
    };

    const handleExport = () => {
        const payload = {
            version: 1,
            exportedAt: new Date().toISOString(),
            selectedSize: state.selectedSize,
            elements: state.elements,
            canvasZoom: state.canvasZoom,
        };

        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'design-editor-export.json';
        link.click();
        URL.revokeObjectURL(url);
        toast.success('Design exported.');
    };

    const currentSize = canvasSizes.find((s) => s.id === state.selectedSize);

    return (
        <CreatorWorkspaceShell>
            {/* Left Panel */}
            <div className="w-[300px] border-r border-border flex flex-col shrink-0 bg-background">
                <div className="h-14 px-4 border-b border-border flex items-center shrink-0">
                    <h2 className="font-semibold text-muted-foreground">Design Editor</h2>
                </div>

                {/* Panel Tabs */}
                <div className="px-2 pt-2 flex gap-1 border-b border-border pb-2">
                    {([['templates', 'Templates'], ['elements', 'Elements'], ['text', 'Text'], ['ai', 'AI']] as const).map(([id, label]) => (
                        <button key={id} onClick={() => dispatch({ type: 'setActivePanel', activePanel: id })} className={cn("flex-1 py-1.5 text-[10px] font-medium rounded-lg transition-colors", state.activePanel === id ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground")}>{label}</button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto p-4  gap-y-4">
                    {state.activePanel === 'templates' && (
                        <>
                            {/* Canvas Size */}
                            <div className="space-y-3">
                                <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.1em]">Canvas Size</h4>
                                <div className="space-y-1.5">
                                    {canvasSizes.map((size) => (
                                        <button key={size.id} onClick={() => dispatch({ type: 'setSelectedSize', selectedSize: size.id })} className={cn("w-full flex items-center justify-between px-3 py-2 rounded-lg border text-xs transition-all", state.selectedSize === size.id ? "bg-accent border-primary/20" : "bg-card border-border")}>
                                            <span className="font-medium">{size.label}</span>
                                            <span className="text-muted-foreground text-[10px]">{size.size}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {/* Template Grid */}
                            <div className="space-y-3">
                                <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.1em]">Templates</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    {Array.from({ length: 6 }).map((_, i) => (
                                        <div key={i} className="aspect-square rounded-xl bg-gradient-to-br from-muted to-accent border border-border cursor-pointer hover:border-primary/30 transition-all flex items-center justify-center">
                                            <span className="text-[10px] text-muted-foreground">Template {i + 1}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {state.activePanel === 'elements' && (
                        <>
                            <div className="grid grid-cols-2 gap-2">
                                    {elementTools.map((tool) => (
                                    <button key={tool.id} onClick={() => tool.id !== 'ai' ? addElement(tool.id as 'text' | 'shape' | 'image') : dispatch({ type: 'setActivePanel', activePanel: 'ai' })} className="flex flex-col items-center gap-2 p-4 bg-card rounded-xl border border-border hover:border-primary/20 transition-all">
                                        <tool.icon className="size-5" />
                                        <span className="text-[10px] font-medium">{tool.label}</span>
                                    </button>
                                ))}
                            </div>
                            <div className="space-y-3">
                                <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.1em]">Shapes</h4>
                                <div className="grid grid-cols-4 gap-2">
                                    {shapes.map((s) => (
                                        <button key={s.id} onClick={() => addElement('shape')} className="flex flex-col items-center gap-1 p-3 bg-card rounded-xl border border-border hover:border-primary/20 transition-all">
                                            <s.icon className="size-5" />
                                            <span className="text-[8px]">{s.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {/* Layers */}
                            <div className="space-y-3">
                                <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.1em] flex items-center gap-2"><Layers className="size-3" /> Layers</h4>
                                <div className="space-y-1">
                                    {state.elements.map((el) => (
                                        <button
                                            key={el.id}
                                            onClick={() => dispatch({ type: 'selectElement', id: el.id })}
                                            className={cn(
                                                "group w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all",
                                                state.selectedElementId === el.id ? "bg-accent border border-primary/20" : "bg-card border border-border",
                                            )}
                                        >
                                            {el.type === 'text' ? <Type className="size-3" /> : el.type === 'shape' ? <Square className="size-3" /> : <ImageIcon className="size-3" />}
                                            <span className="flex-1 text-left truncate">{el.label}</span>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteElement(el.id);
                                                }}
                                                className="opacity-0 group-hover:opacity-100 hover:text-destructive"
                                            >
                                                <Trash2 className="size-3" />
                                            </button>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {state.activePanel === 'text' && (
                        <div className="space-y-4">
                            <Button onClick={() => addElement('text')} variant="outline" className="w-full gap-2"><Plus className="size-4" /> Add Text</Button>
                            <div className="space-y-3">
                                <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.1em]">Text Styles</h4>
                                {['Title', 'Subtitle', 'Body', 'Caption'].map((style) => (
                                    <button key={style} onClick={() => addElement('text')} className="w-full text-left px-4 py-3 bg-card rounded-xl border border-border hover:border-primary/20 transition-all">
                                        <p className={cn("font-medium", style === 'Title' ? 'text-lg' : style === 'Subtitle' ? 'text-sm' : style === 'Body' ? 'text-xs' : 'text-[10px] text-muted-foreground')}>{style}</p>
                                    </button>
                                ))}
                            </div>
                            <div className="flex items-center gap-1 pt-2">
                                <Button variant="ghost" size="icon" className="size-8" onClick={() => updateSelectedText({ fontWeight: selectedTextElement?.fontWeight === 700 ? 400 : 700 })}><Bold className="size-4" /></Button>
                                <Button variant="ghost" size="icon" className="size-8" onClick={() => updateSelectedText({ fontStyle: selectedTextElement?.fontStyle === 'italic' ? 'normal' : 'italic' })}><Italic className="size-4" /></Button>
                                <Button variant="ghost" size="icon" className="size-8" onClick={() => updateSelectedText({ textDecoration: selectedTextElement?.textDecoration === 'underline' ? 'none' : 'underline' })}><Underline className="size-4" /></Button>
                                <div className="w-px h-6 bg-border mx-1" />
                                <Button variant="ghost" size="icon" className="size-8" onClick={() => updateSelectedText({ textAlign: 'left' })}><AlignLeft className="size-4" /></Button>
                                <Button variant="ghost" size="icon" className="size-8" onClick={() => updateSelectedText({ textAlign: 'center' })}><AlignCenter className="size-4" /></Button>
                                <Button variant="ghost" size="icon" className="size-8" onClick={() => updateSelectedText({ textAlign: 'right' })}><AlignRight className="size-4" /></Button>
                            </div>
                        </div>
                    )}

                    {state.activePanel === 'ai' && (
                        <div className="space-y-4">
                            <div className="space-y-3">
                                <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.1em]">AI Design Assistant</h4>
                                <textarea value={state.aiPrompt} onChange={(e) => dispatch({ type: 'setAiPrompt', aiPrompt: e.target.value })} placeholder="Describe the design you want to create?" className="w-full h-32 bg-card border border-border rounded-xl p-3 text-xs resize-none outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground" />
                            </div>
                            <Button onClick={handleAiGenerate} disabled={state.isGenerating || !state.aiPrompt.trim()} className="w-full h-10 gap-2">
                                {state.isGenerating ? (<><Loader2 className="size-4 animate-spin" /> Generating?</>) : (<><Sparkles className="size-4" /> Generate Design</>)}
                            </Button>
                            <div className="space-y-2">
                                <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.1em]">Quick Prompts</h4>
                                {['Modern tech startup banner', 'Elegant wedding invitation', 'Bold sale announcement', 'Minimalist logo design'].map((p) => (
                                    <button key={p} onClick={() => dispatch({ type: 'setAiPrompt', aiPrompt: p })} className="w-full text-left px-3 py-2 bg-card rounded-lg border border-border text-[10px] hover:bg-accent transition-colors">{p}</button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Canvas Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Canvas Toolbar */}
                <div className="h-14 px-4 border-b border-border flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="size-8" onClick={() => dispatch({ type: 'setActiveTool', activeTool: 'select' })}><MousePointer className={cn("size-4", state.activeTool === 'select' && "text-primary")} /></Button>
                        <Button variant="ghost" size="icon" className="size-8" onClick={() => dispatch({ type: 'setActiveTool', activeTool: 'move' })}><Move className={cn("size-4", state.activeTool === 'move' && "text-primary")} /></Button>
                        <div className="w-px h-6 bg-border mx-1" />
                        <Button variant="ghost" size="icon" className="size-8" onClick={handleUndo} disabled={!pastSnapshots.length}><Undo2 className="size-4" /></Button>
                        <Button variant="ghost" size="icon" className="size-8" onClick={handleRedo} disabled={!futureSnapshots.length}><Redo2 className="size-4" /></Button>
                        <div className="w-px h-6 bg-border mx-1" />
                        <Button variant="ghost" size="icon" className="size-8" onClick={() => handleZoom('in')}><ZoomIn className="size-4" /></Button>
                        <span className="text-xs text-muted-foreground px-1">{state.canvasZoom}%</span>
                        <Button variant="ghost" size="icon" className="size-8" onClick={() => handleZoom('out')}><ZoomOut className="size-4" /></Button>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                            {isProjectLoading ? 'Loading project...' : `${currentSize?.label} (${currentSize?.size})`}
                        </span>
                        <Button variant="ghost" size="sm" className="gap-2" onClick={handleReset}><RotateCcw className="size-4" /> Reset</Button>
                        <Button variant="outline" size="sm" className="gap-2" onClick={handleSave} disabled={isProjectSaving || isProjectLoading}>
                            <Folder className="size-4" />
                            {isProjectSaving ? 'Saving...' : 'Save'}
                        </Button>
                        <Button size="sm" className="gap-2" onClick={handleExport}><Download className="size-4" /> Export</Button>
                    </div>
                </div>

                {/* Canvas */}
                <div className="flex-1 flex items-center justify-center p-8 bg-muted/30 overflow-auto">
                    {errorMessage && (
                        <div className="absolute top-4 left-1/2 z-20 -translate-x-1/2 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-2 text-sm text-destructive">
                            {errorMessage}
                        </div>
                    )}
                    <div
                        ref={canvasRef}
                        className="bg-white shadow-2xl border border-border"
                        style={{ width: '500px', aspectRatio: state.selectedSize === 'ig-post' ? '1/1' : state.selectedSize === 'ig-story' ? '9/16' : state.selectedSize === 'yt-thumb' ? '16/9' : state.selectedSize === 'fb-cover' ? '820/312' : '4/3', transform: `scale(${state.canvasZoom / 100})`, transformOrigin: 'center center' }}
                    >
                        {/* Canvas elements rendered here */}
                        <div
                            className="w-full h-full relative overflow-hidden"
                            onPointerDown={() => dispatch({ type: 'selectElement', id: null })}
                        >
                            {alignmentGuides.map((guide) => (
                                <div
                                    key={`${guide.orientation}-${guide.position}`}
                                    className="pointer-events-none absolute z-30 bg-sky-500/80"
                                    style={guide.orientation === 'vertical'
                                        ? { left: guide.position, top: 0, width: 1, height: '100%' }
                                        : { top: guide.position, left: 0, height: 1, width: '100%' }}
                                />
                            ))}
                            {state.elements.map((el) => (
                                <div
                                    key={el.id}
                                    onPointerDown={(event) => beginElementInteraction(event, el, 'drag')}
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        dispatch({ type: 'selectElement', id: el.id });
                                    }}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter' || event.key === ' ') {
                                            event.preventDefault();
                                            dispatch({ type: 'selectElement', id: el.id });
                                        }
                                    }}
                                    role="button"
                                    tabIndex={0}
                                    className={cn(
                                        "absolute touch-none select-none",
                                        state.activeTool === 'move' || state.selectedElementId === el.id ? "cursor-move" : "cursor-pointer",
                                        state.selectedElementId === el.id && "ring-2 ring-primary ring-offset-2"
                                    )}
                                    style={{ left: el.x, top: el.y, width: el.width, height: el.height }}
                                >
                                    {el.type === 'text' ? (
                                        <div
                                            className="w-full h-full flex items-center justify-center text-black font-semibold text-sm"
                                            style={{
                                                fontWeight: el.fontWeight,
                                                fontStyle: el.fontStyle,
                                                textDecoration: el.textDecoration,
                                                textAlign: el.textAlign,
                                            }}
                                        >
                                            {el.label}
                                        </div>
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-blue-200 to-purple-200 rounded-lg" />
                                    )}
                                    {selectedElement?.id === el.id && (
                                        <>
                                            <div className="pointer-events-none absolute -left-0.5 -top-5 rounded bg-primary px-1.5 py-0.5 text-[9px] font-semibold text-primary-foreground">
                                                {Math.round(el.x)}, {Math.round(el.y)} · {Math.round(el.width)}×{Math.round(el.height)}
                                            </div>
                                            {resizeHandles.map((handle) => (
                                                <button
                                                    key={handle.id}
                                                    aria-label={`Resize ${handle.id}`}
                                                    type="button"
                                                    onPointerDown={(event) => beginElementInteraction(event, el, 'resize', handle.id)}
                                                    className={cn(
                                                        "absolute z-20 h-3 w-3 rounded-full border border-primary bg-white shadow-sm",
                                                        handle.className,
                                                        handle.cursor,
                                                    )}
                                                />
                                            ))}
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </CreatorWorkspaceShell>
    );
}
