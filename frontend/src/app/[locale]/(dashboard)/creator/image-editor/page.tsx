'use client';

import Image from 'next/image';
import { useReducer, useRef } from 'react';
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

type ImageEditorState = {
    uploadedImage: string | null;
    activeTool: string;
    activePanel: PanelTab;
    isProcessing: boolean;
    selectedFilter: string;
    adjustments: Record<AdjustmentKey, number>;
};

type ImageEditorAction =
    | { type: 'setUploadedImage'; uploadedImage: string | null }
    | { type: 'setActiveTool'; activeTool: string }
    | { type: 'setActivePanel'; activePanel: PanelTab }
    | { type: 'setProcessing'; isProcessing: boolean }
    | { type: 'setSelectedFilter'; selectedFilter: string }
    | { type: 'setAdjustment'; key: AdjustmentKey; value: number }
    | { type: 'resetAdjustments' };

const initialState: ImageEditorState = {
    uploadedImage: null,
    activeTool: 'select',
    activePanel: 'adjust',
    isProcessing: false,
    selectedFilter: 'none',
    adjustments: {
        brightness: 0,
        contrast: 0,
        saturation: 0,
        sharpness: 0,
        blur: 0,
        temperature: 0,
    },
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
    const [state, dispatch] = useReducer(reducer, initialState);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { startGeneration } = useGenerationStore();

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            dispatch({ type: 'setUploadedImage', uploadedImage: url });
        }
    };

    const handleAiTool = async (toolId: string) => {
        dispatch({ type: 'setProcessing', isProcessing: true });
        await startGeneration('/generations/image', {
            prompt: `Apply ${toolId} to image`,
            imageUrl: state.uploadedImage,
        });
        dispatch({ type: 'setProcessing', isProcessing: false });
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
        return { filter };
    };

    return (
        <div className="h-full bg-background text-foreground flex overflow-hidden">
            <div className="w-14 border-r border-border flex flex-col items-center py-4 gap-1 bg-background shrink-0">
                {tools.map((tool) => (
                    <button
                        key={tool.id}
                        onClick={() => dispatch({ type: 'setActiveTool', activeTool: tool.id })}
                        title={tool.label}
                        className={cn(
                            'w-10 h-10 rounded-lg flex items-center justify-center transition-all',
                            state.activeTool === tool.id
                                ? 'bg-accent text-foreground'
                                : 'text-muted-foreground hover:text-foreground hover:bg-accent/50',
                        )}
                    >
                        <tool.icon className="w-4.5 h-4.5" />
                    </button>
                ))}
            </div>

            <div className="flex-1 flex flex-col min-w-0">
                <div className="h-14 px-4 border-b border-border flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="w-8 h-8" title="Undo">
                            <Undo2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="w-8 h-8" title="Redo">
                            <Redo2 className="w-4 h-4" />
                        </Button>
                        <div className="w-px h-6 bg-border mx-2" />
                        <Button variant="ghost" size="icon" className="w-8 h-8" title="Rotate Left">
                            <RotateCcw className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="w-8 h-8" title="Rotate Right">
                            <RotateCw className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="w-8 h-8" title="Flip Horizontal">
                            <FlipHorizontal className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="w-8 h-8" title="Flip Vertical">
                            <FlipVertical className="w-4 h-4" />
                        </Button>
                        <div className="w-px h-6 bg-border mx-2" />
                        <Button variant="ghost" size="icon" className="w-8 h-8" title="Zoom In">
                            <ZoomIn className="w-4 h-4" />
                        </Button>
                        <span className="text-xs text-muted-foreground font-medium px-2">100%</span>
                        <Button variant="ghost" size="icon" className="w-8 h-8" title="Zoom Out">
                            <ZoomOut className="w-4 h-4" />
                        </Button>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="gap-2">
                            <Folder className="w-4 h-4" />
                            Save
                        </Button>
                        <Button size="sm" className="gap-2">
                            <Download className="w-4 h-4" />
                            Export
                        </Button>
                    </div>
                </div>

                <div className="flex-1 flex items-center justify-center p-8 bg-muted/30 overflow-auto">
                    {!state.uploadedImage ? (
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full max-w-lg aspect-[4/3] rounded-2xl border-2 border-dashed border-border hover:border-primary/30 transition-all cursor-pointer flex flex-col items-center justify-center gap-4 bg-background"
                        >
                            <div className="w-16 h-16 rounded-xl bg-accent flex items-center justify-center">
                                <Upload className="w-7 h-7 text-muted-foreground" />
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
                                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                                    <p className="text-sm font-medium">AI is processing...</p>
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

                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {state.activePanel === 'adjust' && (
                        <>
                            {adjustmentControls.map((adj) => (
                                <div key={adj.key} className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em] flex items-center gap-2">
                                            <adj.icon className="w-3 h-3" />
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
                                <RotateCcw className="w-3 h-3 mr-2" />
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
                                    <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center shrink-0 mt-0.5">
                                        <tool.icon className="w-4 h-4 text-muted-foreground" />
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
        </div>
    );
}
