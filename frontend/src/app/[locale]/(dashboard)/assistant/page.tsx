'use client';

import { Suspense, useEffect, useMemo, useReducer } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/ui/button';
import { Sparkles, Image as ImageIcon, Plus, Folder, RefreshCcw } from 'lucide-react';
import { projectApi } from '@/services/projectApi';

const templates = [
    { label: 'Product Photography', prompt: 'Create a professional product photo of a sleek smartwatch on a marble surface with soft studio lighting.' },
    { label: 'Character Design', prompt: 'Design a futuristic cyberpunk character with neon accents, detailed armor, and a confident pose.' },
    { label: 'Video Prompts', prompt: 'Generate a cinematic video of a sunrise over mountain peaks with fog rolling through the valleys.' },
    { label: 'Sora 2 Styles', prompt: 'Create a cinematic, high-fidelity video concept with dynamic motion and atmospheric lighting.' },
];

type AssistantSnapshot = {
    prompt: string;
    selectedTemplate: string;
};

type AssistantProjectPayload = {
    version: number;
    savedAt: string;
    snapshot: AssistantSnapshot;
};

type AssistantState = {
    prompt: string;
    selectedTemplate: string;
    projectId: string | null;
    isProjectLoading: boolean;
    isProjectSaving: boolean;
    projectError: string | null;
};

type AssistantAction =
    | { type: 'set-prompt'; prompt: string }
    | { type: 'set-selected-template'; selectedTemplate: string }
    | { type: 'set-project-id'; projectId: string | null }
    | { type: 'set-project-loading'; isProjectLoading: boolean }
    | { type: 'set-project-saving'; isProjectSaving: boolean }
    | { type: 'set-project-error'; projectError: string | null }
    | { type: 'reset' };

const initialAssistantState: AssistantState = {
    prompt: '',
    selectedTemplate: '',
    projectId: null,
    isProjectLoading: false,
    isProjectSaving: false,
    projectError: null,
};

const assistantReducer = (state: AssistantState, action: AssistantAction): AssistantState => {
    switch (action.type) {
        case 'set-prompt':
            return { ...state, prompt: action.prompt };
        case 'set-selected-template':
            return { ...state, selectedTemplate: action.selectedTemplate };
        case 'set-project-id':
            return { ...state, projectId: action.projectId };
        case 'set-project-loading':
            return { ...state, isProjectLoading: action.isProjectLoading };
        case 'set-project-saving':
            return { ...state, isProjectSaving: action.isProjectSaving };
        case 'set-project-error':
            return { ...state, projectError: action.projectError };
        case 'reset':
            return {
                ...initialAssistantState,
                projectId: state.projectId,
            };
        default:
            return state;
    }
};

const normalizeSnapshot = (value: unknown): Partial<AssistantSnapshot> => {
    const raw = (value ?? {}) as Record<string, unknown>;
    const snapshot = (raw.snapshot && typeof raw.snapshot === 'object' ? raw.snapshot : raw) as Record<string, unknown>;

    return {
        prompt: typeof snapshot.prompt === 'string' ? snapshot.prompt : '',
        selectedTemplate: typeof snapshot.selectedTemplate === 'string' ? snapshot.selectedTemplate : '',
    };
};

export default function AssistantPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-background text-foreground" />}>
            <AssistantPageContent />
        </Suspense>
    );
}

function AssistantPageContent() {
    const [state, dispatch] = useReducer(assistantReducer, initialAssistantState);
    const { replace } = useRouter();
    const searchParams = useSearchParams();
    const searchParamsSnapshot = useMemo(() => new URLSearchParams(searchParams), [searchParams]);

    useEffect(() => {
        const requestedProjectId = searchParamsSnapshot.get('projectId');
        dispatch({ type: 'set-project-id', projectId: requestedProjectId });

        const applySnapshot = (snapshot: Partial<AssistantSnapshot>) => {
            dispatch({ type: 'set-prompt', prompt: snapshot.prompt ?? '' });
            dispatch({ type: 'set-selected-template', selectedTemplate: snapshot.selectedTemplate ?? '' });
            dispatch({ type: 'set-project-error', projectError: null });
        };

        const loadDraft = () => {
            const draftRaw = localStorage.getItem('assistant-home:draft:v1');
            if (!draftRaw) {
                return;
            }

            try {
                applySnapshot(normalizeSnapshot(JSON.parse(draftRaw)));
            } catch (error) {
                console.error('Failed to load assistant draft', error);
            }
        };

        if (!requestedProjectId) {
            loadDraft();
            return;
        }

        let cancelled = false;
        dispatch({ type: 'set-project-loading', isProjectLoading: true });

        void (async () => {
            try {
                const project = await projectApi.get(requestedProjectId);
                if (cancelled) {
                    return;
                }

                applySnapshot(normalizeSnapshot(project.content));
            } catch (error) {
                console.error('Failed to load assistant project', error);
                if (!cancelled) {
                    dispatch({ type: 'set-project-error', projectError: 'Loaded local draft because backend project load failed.' });
                    loadDraft();
                }
            } finally {
                if (!cancelled) {
                    dispatch({ type: 'set-project-loading', isProjectLoading: false });
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [searchParams]);

    const handleSaveProject = async () => {
        const snapshot: AssistantSnapshot = {
            prompt: state.prompt,
            selectedTemplate: state.selectedTemplate,
        };

        localStorage.setItem('assistant-home:draft:v1', JSON.stringify(snapshot));
        dispatch({ type: 'set-project-saving', isProjectSaving: true });
        dispatch({ type: 'set-project-error', projectError: null });

        try {
            if (state.projectId) {
                await projectApi.update(state.projectId, {
                    name: state.prompt.trim() ? `Assistant: ${state.prompt.trim().slice(0, 48)}` : 'Assistant Draft',
                    content: { version: 1, savedAt: new Date().toISOString(), snapshot } satisfies AssistantProjectPayload,
                });
            } else {
                const created = await projectApi.create({
                    name: state.prompt.trim() ? `Assistant: ${state.prompt.trim().slice(0, 48)}` : 'Assistant Draft',
                    content: { version: 1, savedAt: new Date().toISOString(), snapshot } satisfies AssistantProjectPayload,
                });
                dispatch({ type: 'set-project-id', projectId: created.project.id });
                replace(`${window.location.pathname}?projectId=${created.project.id}`);
            }
            toast.success('Assistant project saved.');
        } catch (error) {
            console.error('Failed to save assistant project', error);
            dispatch({ type: 'set-project-error', projectError: 'Saved locally, but backend project save failed.' });
            toast.error('Assistant project saved locally, backend save failed.');
        } finally {
            dispatch({ type: 'set-project-saving', isProjectSaving: false });
        }
    };

    const handleReset = () => {
        dispatch({ type: 'reset' });
    };

    return (
        <div className="h-full flex flex-col items-center justify-center -mt-20">
            <div className="max-w-3xl w-full px-6 text-center space-y-8">
                <div className="space-y-2">
                    <h2 className="text-xl font-medium text-muted-foreground">Good night,</h2>
                    <h1 className="text-4xl font-semibold text-foreground tracking-tight">What do you want to create?</h1>
                </div>

                <div className="flex items-center justify-center gap-3">
                    <Button variant="ghost" size="sm" className="gap-2" onClick={handleReset} disabled={!state.prompt && !state.selectedTemplate}>
                        <RefreshCcw className="size-4" />
                        Reset
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2" onClick={handleSaveProject} disabled={state.isProjectLoading || state.isProjectSaving}>
                        <Folder className="size-4" />
                        {state.isProjectSaving ? 'Saving...' : 'Save Project'}
                    </Button>
                </div>

                {state.projectError && (
                    <div className="mx-auto max-w-2xl rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-600 text-left">
                        {state.projectError}
                    </div>
                )}

                <div className="relative group">
                    <div className="relative bg-card border border-border rounded-2xl p-4 shadow-lg transition-all focus-within:border-ring">
                        <textarea
                            value={state.prompt}
                            onChange={(event) => dispatch({ type: 'set-prompt', prompt: event.target.value })}
                            placeholder="Describe your creation?"
                            className="w-full bg-transparent border-none outline-none text-lg text-foreground placeholder:text-muted-foreground/50 min-h-[80px] resize-none"
                        />

                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                            <div className="flex gap-2">
                                <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground hover:text-foreground">
                                    <Plus className="size-4 mr-1.5" />
                                    Add Reference
                                </Button>
                                <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground hover:text-foreground">
                                    <ImageIcon className="size-4 mr-1.5" />
                                    Templates
                                </Button>
                            </div>
                            <Button size="icon" className="size-8 rounded-full">
                                <Sparkles className="size-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="pt-8">
                    <div className="flex items-center justify-center gap-2 mb-6">
                        <span className="text-sm font-medium text-muted-foreground">Explore templates</span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {templates.map((template) => (
                            <button
                                key={template.label}
                                type="button"
                                onClick={() => {
                                    dispatch({ type: 'set-selected-template', selectedTemplate: template.label });
                                    dispatch({ type: 'set-prompt', prompt: template.prompt });
                                }}
                                className="h-24 rounded-xl relative overflow-hidden group cursor-pointer border border-border bg-card hover:bg-accent transition-colors text-left"
                            >
                                <div className="absolute bottom-3 left-3 right-3">
                                    <span className="text-xs font-semibold text-foreground/90 block leading-tight">{template.label}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
