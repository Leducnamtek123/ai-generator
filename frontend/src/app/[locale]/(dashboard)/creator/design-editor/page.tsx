'use client';

import { useReducer } from 'react';
import { useGenerationStore } from '@/stores/generation-store';
import {
    Type, Image as ImageIcon, Square, Circle, Triangle, Star,
    Download, Sparkles, Loader2, Folder, Plus, Trash2, Layers,
    AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline,
    ZoomIn, ZoomOut, Undo2, Redo2, Move, MousePointer
} from 'lucide-react';
import { Button } from '@/ui/button';
import { cn } from '@/lib/utils';

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

interface DesignElement {
    id: string;
    type: 'text' | 'shape' | 'image';
    label: string;
    x: number;
    y: number;
    width: number;
    height: number;
}

type ActivePanel = 'templates' | 'elements' | 'text' | 'ai';
type ActiveTool = 'select' | 'move';

type DesignEditorState = {
    selectedSize: string;
    activePanel: ActivePanel;
    elements: DesignElement[];
    selectedElementId: string | null;
    activeTool: ActiveTool;
    aiPrompt: string;
    isGenerating: boolean;
};

type DesignEditorAction =
    | { type: 'setSelectedSize'; selectedSize: string }
    | { type: 'setActivePanel'; activePanel: ActivePanel }
    | { type: 'addElement'; element: DesignElement }
    | { type: 'deleteElement'; id: string }
    | { type: 'selectElement'; id: string | null }
    | { type: 'setActiveTool'; activeTool: ActiveTool }
    | { type: 'setAiPrompt'; aiPrompt: string }
    | { type: 'setGenerating'; isGenerating: boolean };

const initialState: DesignEditorState = {
    selectedSize: 'ig-post',
    activePanel: 'templates',
    elements: [
        { id: '1', type: 'text', label: 'Your Title Here', x: 100, y: 100, width: 300, height: 60 },
        { id: '2', type: 'shape', label: 'Background Shape', x: 50, y: 50, width: 400, height: 400 },
    ],
    selectedElementId: null,
    activeTool: 'select',
    aiPrompt: '',
    isGenerating: false,
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
            return {
                ...state,
                elements: state.elements.filter((element) => element.id !== action.id),
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
        default:
            return state;
    }
}

export default function DesignEditorPage() {
    const [state, dispatch] = useReducer(reducer, initialState);
    const { startGeneration } = useGenerationStore();

    const addElement = (type: 'text' | 'shape' | 'image') => {
        const nextIndex = state.elements.length;
        const newEl: DesignElement = {
            id: crypto.randomUUID(),
            type,
            label: type === 'text' ? 'New Text' : type === 'shape' ? 'Shape' : 'Image',
            x: 50 + (nextIndex % 4) * 40,
            y: 50 + (nextIndex % 3) * 40,
            width: type === 'text' ? 200 : 150,
            height: type === 'text' ? 40 : 150,
        };
        dispatch({ type: 'addElement', element: newEl });
    };

    const deleteElement = (id: string) => {
        dispatch({ type: 'deleteElement', id });
    };

    const handleAiGenerate = async () => {
        if (!state.aiPrompt.trim()) return;
        dispatch({ type: 'setGenerating', isGenerating: true });
        await startGeneration('/generations/image', { prompt: state.aiPrompt });
        dispatch({ type: 'setGenerating', isGenerating: false });
    };

    const currentSize = canvasSizes.find((s) => s.id === state.selectedSize);

    return (
        <div className="h-full bg-background text-foreground flex overflow-hidden">
            {/* Left Panel */}
            <div className="w-[300px] border-r border-border flex flex-col shrink-0 bg-background">
                <div className="h-14 px-4 border-b border-border flex items-center shrink-0">
                    <h2 className="font-bold text-muted-foreground">Design Editor</h2>
                </div>

                {/* Panel Tabs */}
                <div className="px-2 pt-2 flex gap-1 border-b border-border pb-2">
                    {([['templates', 'Templates'], ['elements', 'Elements'], ['text', 'Text'], ['ai', 'AI']] as const).map(([id, label]) => (
                        <button key={id} onClick={() => dispatch({ type: 'setActivePanel', activePanel: id })} className={cn("flex-1 py-1.5 text-[10px] font-medium rounded-lg transition-colors", state.activePanel === id ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground")}>{label}</button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {state.activePanel === 'templates' && (
                        <>
                            {/* Canvas Size */}
                            <div className="space-y-3">
                                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Canvas Size</h4>
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
                                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Templates</h4>
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
                                        <tool.icon className="w-5 h-5" />
                                        <span className="text-[10px] font-medium">{tool.label}</span>
                                    </button>
                                ))}
                            </div>
                            <div className="space-y-3">
                                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Shapes</h4>
                                <div className="grid grid-cols-4 gap-2">
                                    {shapes.map((s) => (
                                        <button key={s.id} onClick={() => addElement('shape')} className="flex flex-col items-center gap-1 p-3 bg-card rounded-xl border border-border hover:border-primary/20 transition-all">
                                            <s.icon className="w-5 h-5" />
                                            <span className="text-[8px]">{s.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {/* Layers */}
                            <div className="space-y-3">
                                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em] flex items-center gap-2"><Layers className="w-3 h-3" /> Layers</h4>
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
                                            {el.type === 'text' ? <Type className="w-3 h-3" /> : el.type === 'shape' ? <Square className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                                            <span className="flex-1 text-left truncate">{el.label}</span>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteElement(el.id);
                                                }}
                                                className="opacity-0 group-hover:opacity-100 hover:text-destructive"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {state.activePanel === 'text' && (
                        <div className="space-y-4">
                            <Button onClick={() => addElement('text')} variant="outline" className="w-full gap-2"><Plus className="w-4 h-4" /> Add Text</Button>
                            <div className="space-y-3">
                                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Text Styles</h4>
                                {['Title', 'Subtitle', 'Body', 'Caption'].map((style) => (
                                    <button key={style} onClick={() => addElement('text')} className="w-full text-left px-4 py-3 bg-card rounded-xl border border-border hover:border-primary/20 transition-all">
                                        <p className={cn("font-medium", style === 'Title' ? 'text-lg' : style === 'Subtitle' ? 'text-sm' : style === 'Body' ? 'text-xs' : 'text-[10px] text-muted-foreground')}>{style}</p>
                                    </button>
                                ))}
                            </div>
                            <div className="flex items-center gap-1 pt-2">
                                <Button variant="ghost" size="icon" className="w-8 h-8"><Bold className="w-4 h-4" /></Button>
                                <Button variant="ghost" size="icon" className="w-8 h-8"><Italic className="w-4 h-4" /></Button>
                                <Button variant="ghost" size="icon" className="w-8 h-8"><Underline className="w-4 h-4" /></Button>
                                <div className="w-px h-6 bg-border mx-1" />
                                <Button variant="ghost" size="icon" className="w-8 h-8"><AlignLeft className="w-4 h-4" /></Button>
                                <Button variant="ghost" size="icon" className="w-8 h-8"><AlignCenter className="w-4 h-4" /></Button>
                                <Button variant="ghost" size="icon" className="w-8 h-8"><AlignRight className="w-4 h-4" /></Button>
                            </div>
                        </div>
                    )}

                    {state.activePanel === 'ai' && (
                        <div className="space-y-4">
                            <div className="space-y-3">
                                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">AI Design Assistant</h4>
                                <textarea value={state.aiPrompt} onChange={(e) => dispatch({ type: 'setAiPrompt', aiPrompt: e.target.value })} placeholder="Describe the design you want to create..." className="w-full h-32 bg-card border border-border rounded-xl p-3 text-xs resize-none outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground" />
                            </div>
                            <Button onClick={handleAiGenerate} disabled={state.isGenerating || !state.aiPrompt.trim()} className="w-full h-10 gap-2">
                                {state.isGenerating ? (<><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>) : (<><Sparkles className="w-4 h-4" /> Generate Design</>)}
                            </Button>
                            <div className="space-y-2">
                                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Quick Prompts</h4>
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
                        <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => dispatch({ type: 'setActiveTool', activeTool: 'select' })}><MousePointer className={cn("w-4 h-4", state.activeTool === 'select' && "text-primary")} /></Button>
                        <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => dispatch({ type: 'setActiveTool', activeTool: 'move' })}><Move className={cn("w-4 h-4", state.activeTool === 'move' && "text-primary")} /></Button>
                        <div className="w-px h-6 bg-border mx-1" />
                        <Button variant="ghost" size="icon" className="w-8 h-8"><Undo2 className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" className="w-8 h-8"><Redo2 className="w-4 h-4" /></Button>
                        <div className="w-px h-6 bg-border mx-1" />
                        <Button variant="ghost" size="icon" className="w-8 h-8"><ZoomIn className="w-4 h-4" /></Button>
                        <span className="text-xs text-muted-foreground px-1">100%</span>
                        <Button variant="ghost" size="icon" className="w-8 h-8"><ZoomOut className="w-4 h-4" /></Button>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{currentSize?.label} ({currentSize?.size})</span>
                        <Button variant="outline" size="sm" className="gap-2"><Folder className="w-4 h-4" /> Save</Button>
                        <Button size="sm" className="gap-2"><Download className="w-4 h-4" /> Export</Button>
                    </div>
                </div>

                {/* Canvas */}
                <div className="flex-1 flex items-center justify-center p-8 bg-muted/30 overflow-auto">
                    <div className="bg-white shadow-2xl border border-border" style={{ width: '500px', aspectRatio: state.selectedSize === 'ig-post' ? '1/1' : state.selectedSize === 'ig-story' ? '9/16' : state.selectedSize === 'yt-thumb' ? '16/9' : state.selectedSize === 'fb-cover' ? '820/312' : '4/3' }}>
                        {/* Canvas elements rendered here */}
                        <div className="w-full h-full relative overflow-hidden">
                            {state.elements.map((el) => (
                                <div
                                    key={el.id}
                                    onClick={() => dispatch({ type: 'selectElement', id: el.id })}
                                    className={cn(
                                        "absolute cursor-move transition-all",
                                        state.selectedElementId === el.id && "ring-2 ring-primary ring-offset-2"
                                    )}
                                    style={{ left: el.x, top: el.y, width: el.width, height: el.height }}
                                >
                                    {el.type === 'text' ? (
                                        <div className="w-full h-full flex items-center justify-center text-black font-semibold text-sm">{el.label}</div>
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-blue-200 to-purple-200 rounded-lg" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
