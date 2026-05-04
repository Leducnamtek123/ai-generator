'use client';

import { useReducer } from 'react';
import { useGenerationStore } from '@/stores/generation-store';
import { Zap, Download, Loader2, Play, Pause, Folder, Leaf, Cog, Bomb, User, Smartphone, Rocket, Waves, Music2 } from 'lucide-react';
import { Button } from '@/ui/button';
import { Slider } from '@/ui/slider';
import { Label } from '@/ui/label';
import { cn } from '@/lib/utils';

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
    contentTab: 'results' | 'library';
};

type SfxAction =
    | { type: 'setPrompt'; prompt: string }
    | { type: 'toggleCategory'; categoryId: string }
    | { type: 'setDuration'; duration: string }
    | { type: 'setVariations'; variations: number }
    | { type: 'setIntensity'; intensity: number }
    | { type: 'togglePlaying'; playingId: string }
    | { type: 'setContentTab'; contentTab: 'results' | 'library' };

const initialState: SfxState = {
    prompt: '',
    selectedCategory: null,
    duration: '2s',
    variations: 4,
    intensity: 50,
    playingId: null,
    contentTab: 'results',
};

function reducer(state: SfxState, action: SfxAction): SfxState {
    switch (action.type) {
        case 'setPrompt':
            return { ...state, prompt: action.prompt };
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
        case 'setContentTab':
            return { ...state, contentTab: action.contentTab };
        default:
            return state;
    }
}

export default function SfxGeneratorPage() {
    const [state, dispatch] = useReducer(reducer, initialState);
    const { generateSfx, currentGeneration, isGenerating } = useGenerationStore();
    const isProcessing = isGenerating;

    const handleGenerate = async () => {
        if (!state.prompt.trim()) return;
        await generateSfx({
            prompt: state.prompt,
            category: state.selectedCategory || undefined,
            duration: parseFloat(state.duration),
        });
    };

    const generatedResult = currentGeneration?.status === 'completed' ? currentGeneration : null;

    return (
        <div className="h-full bg-background text-foreground flex overflow-hidden">
            <div className="w-[320px] border-r border-border flex flex-col shrink-0 bg-background">
                <div className="h-14 px-6 border-b border-border flex items-center shrink-0">
                    <h2 className="font-bold text-muted-foreground">SFX Generator</h2>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Describe the Sound</h4>
                        <div className="bg-card rounded-xl border border-border p-2">
                            <textarea
                                value={state.prompt}
                                onChange={(e) => dispatch({ type: 'setPrompt', prompt: e.target.value })}
                                placeholder="e.g., Heavy rain on a tin roof, thunder rumbling in the distance..."
                                className="w-full h-28 bg-transparent text-sm placeholder:text-muted-foreground resize-none focus:outline-none p-2"
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Category</h4>
                        <div className="grid grid-cols-4 gap-1.5">
                            {sfxCategories.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => {
                                        dispatch({ type: 'toggleCategory', categoryId: cat.id });
                                        if (!state.prompt) {
                                            dispatch({ type: 'setPrompt', prompt: cat.examples[0] });
                                        }
                                    }}
                                    className={cn(
                                        'flex flex-col items-center gap-1 p-2 rounded-xl border transition-all',
                                        state.selectedCategory === cat.id ? 'bg-accent border-primary/20' : 'bg-card border-border hover:border-border/80',
                                    )}
                                >
                                    <cat.icon className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-[8px] font-medium">{cat.label}</span>
                                </button>
                            ))}
                        </div>
                        {state.selectedCategory && (
                            <div className="flex flex-wrap gap-1.5">
                                {sfxCategories.find((c) => c.id === state.selectedCategory)?.examples.map((ex) => (
                                    <button
                                        key={ex}
                                        onClick={() => dispatch({ type: 'setPrompt', prompt: ex })}
                                        className="px-2.5 py-1 rounded-lg bg-muted border border-border text-[10px] font-medium hover:bg-accent transition-colors"
                                    >
                                        {ex}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Duration</h4>
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

                    <div className="space-y-5">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Variations</Label>
                                <span className="text-[11px] font-mono">{state.variations}</span>
                            </div>
                            <Slider min={1} max={8} step={1} value={[state.variations]} onValueChange={([v]) => dispatch({ type: 'setVariations', variations: v })} />
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Intensity</Label>
                                <span className="text-[11px] font-mono">{state.intensity}%</span>
                            </div>
                            <Slider min={0} max={100} step={5} value={[state.intensity]} onValueChange={([v]) => dispatch({ type: 'setIntensity', intensity: v })} />
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-border space-y-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                        <span>Cost:</span>
                        <span className="font-medium text-foreground">{state.variations} Credits</span>
                    </div>
                    <Button onClick={handleGenerate} disabled={isGenerating || !state.prompt.trim()} className="w-full h-12 font-bold rounded-xl gap-2">
                        {isGenerating ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Zap className="w-5 h-5" />
                                Generate SFX
                            </>
                        )}
                    </Button>
                </div>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="h-14 px-6 border-b border-border flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-1">
                        {(['results', 'library'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => dispatch({ type: 'setContentTab', contentTab: tab })}
                                className={cn(
                                    'px-4 py-2 text-sm font-medium rounded-full transition-colors capitalize',
                                    state.contentTab === tab ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground',
                                )}
                            >
                                {tab === 'results' ? 'Generated' : 'Sound Library'}
                            </button>
                        ))}
                    </div>
                    {generatedResult && <Button size="sm" className="gap-2"><Download className="w-4 h-4" /> Export All</Button>}
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {isProcessing ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4">
                            <div className="relative">
                                <div className="w-16 h-16 rounded-full border-4 border-muted border-t-primary animate-spin" />
                                <Zap className="w-6 h-6 text-muted-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                            </div>
                            <p className="text-sm text-muted-foreground animate-pulse">Generating sound effects...</p>
                        </div>
                    ) : generatedResult ? (
                        <div className="space-y-3 max-w-3xl mx-auto">
                            {[{
                                id: generatedResult.id,
                                name: state.prompt.slice(0, 30) || 'Generated SFX',
                                duration: state.duration,
                                category: state.selectedCategory || 'Custom',
                            }].map((sfx) => (
                                <div key={sfx.id} className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border hover:border-border/80 transition-colors group">
                                    <button
                                        onClick={() => dispatch({ type: 'togglePlaying', playingId: sfx.id })}
                                        className="w-12 h-12 rounded-full bg-muted flex items-center justify-center hover:bg-accent transition-colors shrink-0"
                                    >
                                        {state.playingId === sfx.id ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
                                    </button>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium">{sfx.name}</p>
                                        <p className="text-xs text-muted-foreground">{sfx.category} • {sfx.duration}</p>
                                    </div>
                                    <div className="hidden md:flex items-center gap-[2px] h-8">
                                        {Array.from({ length: 40 }).map((_, i) => (
                                            <div
                                                key={i}
                                                className={cn('w-[2px] rounded-full transition-colors', state.playingId === sfx.id ? 'bg-primary' : 'bg-muted-foreground/20')}
                                                style={{ height: `${6 + (i % 8) * 2}px` }}
                                            />
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="icon" className="w-8 h-8"><Download className="w-4 h-4" /></Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                            <div className="w-20 h-20 rounded-2xl bg-muted border border-border flex items-center justify-center">
                                <Folder className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <div>
                                <h3 className="font-semibold">Generate Sound Effects</h3>
                                <p className="text-sm text-muted-foreground mt-1">Describe any sound and AI will create it for you</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
