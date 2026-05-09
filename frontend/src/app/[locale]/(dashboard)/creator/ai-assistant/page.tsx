'use client';

import Image from 'next/image';
import { Suspense, useEffect, useMemo, useReducer, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { useGenerationStore } from '@/stores/generation-store';
import { uploadFileWithToast } from '@/lib/upload';
import {
    Sparkles,
    Image as ImageIcon,
    Send,
    Bot,
    User,
    Loader2,
    Download,
    Copy,
    RefreshCcw,
    Folder,
    Paperclip,
    Video,
    Music,
    Palette,
    Wand2,
    ThumbsUp,
    ThumbsDown
} from 'lucide-react';
import { Button } from '@/ui/button';
import { cn } from '@/lib/utils';
import { CreatorWorkspaceShell } from '@/components/layouts/CreatorWorkspaceShell';
import { useGenerationProviders } from '@/hooks/useGenerationProviders';
import { projectApi } from '@/services/projectApi';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    attachments?: { type: 'image' | 'video'; url: string }[];
    generatedImages?: string[];
}

type AssistantSnapshot = {
    messages: Array<Omit<Message, 'timestamp'> & { timestamp: string }>;
    input: string;
    selectedAction: string | null;
    selectedProvider: string;
    pendingAttachments: Array<{ type: 'image' | 'video'; url: string }>;
};

type AssistantProjectPayload = {
    version: number;
    savedAt: string;
    snapshot: AssistantSnapshot;
};

type AssistantState = {
    messages: Message[];
    input: string;
    isGenerating: boolean;
    errorMessage: string | null;
    selectedAction: string | null;
    selectedProvider: string;
    pendingAttachments: Array<{ type: 'image' | 'video'; url: string }>;
    projectId: string | null;
    isProjectLoading: boolean;
    isProjectSaving: boolean;
    projectError: string | null;
};

type AssistantAction =
    | { type: 'set-messages'; messages: Message[] }
    | { type: 'append-message'; message: Message }
    | { type: 'set-input'; input: string }
    | { type: 'set-generating'; isGenerating: boolean }
    | { type: 'set-error'; errorMessage: string | null }
    | { type: 'set-selected-action'; selectedAction: string | null }
    | { type: 'set-selected-provider'; selectedProvider: string }
    | { type: 'set-pending-attachments'; pendingAttachments: Array<{ type: 'image' | 'video'; url: string }>; }
    | { type: 'set-project-id'; projectId: string | null }
    | { type: 'set-project-loading'; isProjectLoading: boolean }
    | { type: 'set-project-saving'; isProjectSaving: boolean }
    | { type: 'set-project-error'; projectError: string | null }
    | { type: 'reset-conversation' };

const initialAssistantState: AssistantState = {
    messages: [],
    input: '',
    isGenerating: false,
    errorMessage: null,
    selectedAction: null,
    selectedProvider: '',
    pendingAttachments: [],
    projectId: null,
    isProjectLoading: false,
    isProjectSaving: false,
    projectError: null,
};

const assistantReducer = (state: AssistantState, action: AssistantAction): AssistantState => {
    switch (action.type) {
        case 'set-messages':
            return { ...state, messages: action.messages };
        case 'append-message':
            return { ...state, messages: [...state.messages, action.message] };
        case 'set-input':
            return { ...state, input: action.input };
        case 'set-generating':
            return { ...state, isGenerating: action.isGenerating };
        case 'set-error':
            return { ...state, errorMessage: action.errorMessage };
        case 'set-selected-action':
            return { ...state, selectedAction: action.selectedAction };
        case 'set-selected-provider':
            return { ...state, selectedProvider: action.selectedProvider };
        case 'set-pending-attachments':
            return { ...state, pendingAttachments: action.pendingAttachments };
        case 'set-project-id':
            return { ...state, projectId: action.projectId };
        case 'set-project-loading':
            return { ...state, isProjectLoading: action.isProjectLoading };
        case 'set-project-saving':
            return { ...state, isProjectSaving: action.isProjectSaving };
        case 'set-project-error':
            return { ...state, projectError: action.projectError };
        case 'reset-conversation':
            return {
                ...initialAssistantState,
                messages: [],
                selectedProvider: state.selectedProvider,
                projectId: state.projectId,
                projectError: state.projectError,
            };
        default:
            return state;
    }
};

const normalizeAssistantSnapshot = (value: unknown): Partial<AssistantSnapshot> => {
    const raw = (value ?? {}) as Record<string, unknown>;
    const snapshot = (raw.snapshot && typeof raw.snapshot === 'object' ? raw.snapshot : raw) as Record<string, unknown>;

    const messages = Array.isArray(snapshot.messages)
        ? snapshot.messages.reduce<
              Array<{
                  id: string;
                  role: 'user' | 'assistant';
                  content: string;
                  timestamp: string;
                  attachments?: Array<{ type: 'image' | 'video'; url: string }>;
                  generatedImages?: string[];
              }>
          >((items, message) => {
              const rawMessage = message as Record<string, unknown>;
              if (
                  typeof rawMessage.id !== 'string' ||
                  (rawMessage.role !== 'user' && rawMessage.role !== 'assistant') ||
                  typeof rawMessage.content !== 'string'
              ) {
                  return items;
              }

              const attachments = Array.isArray(rawMessage.attachments)
                  ? rawMessage.attachments.flatMap((attachment) => {
                        const item = attachment as Record<string, unknown>;
                        if (
                            (item.type === 'image' || item.type === 'video') &&
                            typeof item.url === 'string'
                        ) {
                            return [{ type: item.type as 'image' | 'video', url: item.url }];
                        }
                        return [];
                    })
                  : undefined;

              const generatedImages = Array.isArray(rawMessage.generatedImages)
                  ? rawMessage.generatedImages.flatMap((url) => (typeof url === 'string' ? [url] : []))
                  : undefined;

              items.push({
                  id: rawMessage.id,
                  role: rawMessage.role,
                  content: rawMessage.content,
                  timestamp:
                      typeof rawMessage.timestamp === 'string'
                          ? rawMessage.timestamp
                          : new Date().toISOString(),
                  attachments,
                  generatedImages,
              });
              return items;
          }, [])
        : [];

    return {
        messages,
        input: typeof snapshot.input === 'string' ? snapshot.input : '',
        selectedAction: typeof snapshot.selectedAction === 'string' ? snapshot.selectedAction : null,
        selectedProvider: typeof snapshot.selectedProvider === 'string' ? snapshot.selectedProvider : '',
        pendingAttachments: Array.isArray(snapshot.pendingAttachments)
            ? snapshot.pendingAttachments.filter((attachment): attachment is { type: 'image' | 'video'; url: string } => {
                  const item = attachment as Record<string, unknown>;
                  return (item.type === 'image' || item.type === 'video') && typeof item.url === 'string';
              })
            : [],
    };
};

const quickActions = [
    { id: 'image', icon: ImageIcon, label: 'Generate Image', color: 'text-blue-400' },
    { id: 'video', icon: Video, label: 'Generate Video', color: 'text-purple-400' },
    { id: 'music', icon: Music, label: 'Create Music', color: 'text-green-400' },
    { id: 'design', icon: Palette, label: 'Design', color: 'text-orange-400' },
    { id: 'edit', icon: Wand2, label: 'Edit Image', color: 'text-pink-400' },
];

const actionConfig: Record<string, { endpoint: string; prompt: string; successLabel: string }> = {
    image: {
        endpoint: '/generations/image',
        prompt: 'Generate a high quality image based on my request.',
        successLabel: 'image',
    },
    video: {
        endpoint: '/generations/video',
        prompt: 'Generate a high quality video based on my request.',
        successLabel: 'video',
    },
    music: {
        endpoint: '/generations/music',
        prompt: 'Generate music based on my request.',
        successLabel: 'music',
    },
    design: {
        endpoint: '/generations/image',
        prompt: 'Create a polished design based on my request.',
        successLabel: 'design',
    },
    edit: {
        endpoint: '/generations/image',
        prompt: 'Edit the image based on my request.',
        successLabel: 'edit',
    },
};

const actionCapabilityMap: Record<string, string> = {
    image: 'image-generation',
    video: 'video-generation',
    music: 'audio-music',
    design: 'image-generation',
    edit: 'image-generation',
};

const templates = [
    { label: 'Product Photography', prompt: 'Create a professional product photo of a sleek smartwatch on a marble surface with soft studio lighting' },
    { label: 'Character Design', prompt: 'Design a futuristic cyberpunk character with neon accents, detailed armor, and a confident pose' },
    { label: 'Video Prompts', prompt: 'Generate a cinematic video of a sunrise over mountain peaks with fog rolling through the valleys' },
    { label: 'Logo Design', prompt: 'Create a minimalist logo for a tech startup called "NovaByte" using geometric shapes' },
    { label: 'Social Media', prompt: 'Design an eye-catching Instagram post for a summer fashion collection' },
    { label: 'Illustration', prompt: 'Create a whimsical children\'s book illustration of a friendly dragon in a flower garden' },
];

export default function AssistantPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-background text-foreground" />}>
            <AssistantPageContent />
        </Suspense>
    );
}

function AssistantPageContent() {
    const [state, dispatch] = useReducer(assistantReducer, initialAssistantState);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const attachmentInputRef = useRef<HTMLInputElement>(null);
    const messageIdRef = useRef(0);
    const pendingPromptRef = useRef<string | null>(null);
    const pendingActionRef = useRef<string | null>(null);
    const pendingGenerationIdRef = useRef<string | null>(null);
    const { startGeneration, currentGeneration, error, reset } = useGenerationStore();
    const { providers: generationProviders } = useGenerationProviders();
    const { replace } = useRouter();
    const searchParams = useSearchParams();
    const searchParamsSnapshot = useMemo(() => new URLSearchParams(searchParams), [searchParams]);
    const providerOptions = useMemo(
        () => generationProviders.filter((provider) => provider.capabilities.some((capability) => capability in actionCapabilityMap || capability === 'image-generation' || capability === 'video-generation' || capability === 'audio-music' || capability === 'audio-sfx')),
        [generationProviders],
    );
    const isProjectBusy = state.isProjectLoading || state.isProjectSaving;

    const resolveProviderForAction = (actionId?: string | null) => {
        const capability = actionId ? actionCapabilityMap[actionId] : 'image-generation';
        const compatibleProviders = generationProviders.filter((provider) =>
            provider.capabilities.includes(capability),
        );

        if (compatibleProviders.length === 0) {
            return state.selectedProvider || '';
        }

        if (state.selectedProvider && compatibleProviders.some((provider) => provider.name === state.selectedProvider)) {
            return state.selectedProvider;
        }

        return compatibleProviders[0].name;
    };

    useEffect(() => {
        const requestedProjectId = searchParamsSnapshot.get('projectId');
        dispatch({ type: 'set-project-id', projectId: requestedProjectId });

        const applySnapshot = (snapshot: Partial<AssistantSnapshot>) => {
            dispatch({
                type: 'set-messages',
                messages: snapshot.messages?.map((message) => ({
                    ...message,
                    timestamp: new Date(message.timestamp),
                })) ?? [],
            });
            dispatch({ type: 'set-input', input: snapshot.input ?? '' });
            dispatch({ type: 'set-selected-action', selectedAction: snapshot.selectedAction ?? null });
            dispatch({ type: 'set-selected-provider', selectedProvider: snapshot.selectedProvider ?? '' });
            dispatch({ type: 'set-pending-attachments', pendingAttachments: snapshot.pendingAttachments ?? [] });
            dispatch({ type: 'set-project-error', projectError: null });
            pendingPromptRef.current = null;
            pendingActionRef.current = null;
            pendingGenerationIdRef.current = null;
            messageIdRef.current = snapshot.messages?.length ?? 0;
        };

        const loadDraft = () => {
            const draftRaw = localStorage.getItem('assistant:draft:v1');
            if (!draftRaw) {
                return;
            }

            try {
                applySnapshot(normalizeAssistantSnapshot(JSON.parse(draftRaw)));
            } catch (loadError) {
                console.error('Failed to load assistant draft', loadError);
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

                applySnapshot(normalizeAssistantSnapshot(project.content));
            } catch (loadError) {
                console.error('Failed to load assistant project', loadError);
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
    }, [searchParamsSnapshot]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [state.messages]);

    useEffect(() => {
        if (!state.isGenerating) {
            return;
        }

        if (!currentGeneration) {
            return;
        }

        if (!pendingGenerationIdRef.current || pendingGenerationIdRef.current !== currentGeneration.id) {
            pendingGenerationIdRef.current = currentGeneration.id;
        }

        if (currentGeneration.status === 'completed') {
            const prompt = pendingPromptRef.current || state.input;
            const actionKey = pendingActionRef.current;
            const actionLabel = actionKey ? actionConfig[actionKey]?.successLabel : null;
            messageIdRef.current += 1;
            dispatch({
                type: 'append-message',
                message: {
                    id: `msg_${messageIdRef.current}`,
                    role: 'assistant',
                    content: prompt
                        ? `I processed your ${actionLabel || 'request'}: "${prompt}". Here is the generated result.`
                        : `I processed your ${actionLabel || 'request'} and generated a result.`,
                    timestamp: new Date(),
                    generatedImages: currentGeneration.resultUrl ? [currentGeneration.resultUrl] : undefined,
                },
            });
            pendingPromptRef.current = null;
            pendingActionRef.current = null;
            pendingGenerationIdRef.current = null;
            dispatch({ type: 'set-generating', isGenerating: false });
            dispatch({ type: 'set-error', errorMessage: null });
        } else if (currentGeneration.status === 'failed') {
            pendingPromptRef.current = null;
            pendingActionRef.current = null;
            pendingGenerationIdRef.current = null;
            dispatch({ type: 'set-generating', isGenerating: false });
            dispatch({ type: 'set-error', errorMessage: currentGeneration.error || error || 'Generation failed. Please try again.' });
        }
    }, [currentGeneration, error, state.input, state.isGenerating]);

    const handleSaveProject = async () => {
        const snapshot: AssistantSnapshot = {
            messages: state.messages.map((message) => ({
                ...message,
                timestamp: message.timestamp.toISOString(),
            })),
            input: state.input,
            selectedAction: state.selectedAction,
            selectedProvider: state.selectedProvider,
            pendingAttachments: state.pendingAttachments,
        };

        localStorage.setItem('assistant:draft:v1', JSON.stringify(snapshot));
        dispatch({ type: 'set-project-saving', isProjectSaving: true });
        dispatch({ type: 'set-project-error', projectError: null });

        try {
            if (state.projectId) {
                await projectApi.update(state.projectId, {
                    name: 'AI Assistant Session',
                    content: { version: 1, savedAt: new Date().toISOString(), snapshot } satisfies AssistantProjectPayload,
                });
            } else {
                const created = await projectApi.create({
                    name: 'AI Assistant Session',
                    content: { version: 1, savedAt: new Date().toISOString(), snapshot } satisfies AssistantProjectPayload,
                });
                dispatch({ type: 'set-project-id', projectId: created.project.id });
                replace(`${window.location.pathname}?projectId=${created.project.id}`);
            }
            toast.success('Assistant project saved.');
        } catch (saveError) {
            console.error('Failed to save assistant project', saveError);
            dispatch({ type: 'set-project-error', projectError: 'Saved locally, but backend project save failed.' });
            toast.error('Assistant project saved locally, backend save failed.');
        } finally {
            dispatch({ type: 'set-project-saving', isProjectSaving: false });
        }
    };

    const handleSend = async () => {
        if (!state.input.trim() && !state.selectedAction) return;
        messageIdRef.current += 1;
        const userMessageId = `msg_${messageIdRef.current}`;
        const action = state.selectedAction ? actionConfig[state.selectedAction] : null;
        const promptText = state.input.trim() || action?.prompt || 'Create something new.';
        const provider = resolveProviderForAction(state.selectedAction);

        if (!provider) {
            dispatch({ type: 'set-error', errorMessage: 'No compatible provider is available for this action.' });
            return;
        }

        const userMsg: Message = {
            id: userMessageId,
            role: 'user',
            content: promptText,
            timestamp: new Date(),
            attachments: state.pendingAttachments.length > 0 ? state.pendingAttachments : undefined,
        };

        dispatch({ type: 'append-message', message: userMsg });
        dispatch({ type: 'set-error', errorMessage: null });
        dispatch({ type: 'set-input', input: '' });
        dispatch({ type: 'set-selected-action', selectedAction: null });
        dispatch({ type: 'set-pending-attachments', pendingAttachments: [] });
        dispatch({ type: 'set-generating', isGenerating: true });
        pendingPromptRef.current = userMsg.content;
        pendingActionRef.current = state.selectedAction;

        try {
            await startGeneration(action?.endpoint ?? '/generations/image', {
                prompt: promptText,
                provider,
            });
        } catch (err) {
            console.error('Failed to start assistant generation', err);
            pendingPromptRef.current = null;
            pendingActionRef.current = null;
            pendingGenerationIdRef.current = null;
            dispatch({ type: 'set-generating', isGenerating: false });
            dispatch({ type: 'set-error', errorMessage: 'Failed to start generation. Please try again.' });
        }
    };

    const handleResetConversation = () => {
        reset();
        dispatch({ type: 'reset-conversation' });
        dispatch({ type: 'set-input', input: '' });
        dispatch({ type: 'set-error', errorMessage: null });
        dispatch({ type: 'set-selected-action', selectedAction: null });
        dispatch({ type: 'set-selected-provider', selectedProvider: '' });
        dispatch({ type: 'set-generating', isGenerating: false });
        dispatch({ type: 'set-pending-attachments', pendingAttachments: [] });
        dispatch({ type: 'set-project-error', projectError: null });
        pendingPromptRef.current = null;
        pendingActionRef.current = null;
        pendingGenerationIdRef.current = null;
    };

    const handleAttachmentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }

        const uploaded = await uploadFileWithToast(file, file.name);
        if (!uploaded?.url) {
            return;
        }

        dispatch({
            type: 'set-pending-attachments',
            pendingAttachments: [
                ...state.pendingAttachments,
                {
                    type: file.type.startsWith('video/') ? 'video' : 'image',
                    url: uploaded.url,
                },
            ],
        });
        toast.success('Attachment added.');
        event.target.value = '';
    };

    const handleDownloadImage = (url: string, filename: string) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.target = '_blank';
        link.rel = 'noreferrer';
        link.click();
    };

    const handleCopyText = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            toast.success('Copied to clipboard.');
        } catch {
            toast.error('Failed to copy to clipboard.');
        }
    };

    const handleFeedback = (kind: 'up' | 'down') => {
        toast.success(kind === 'up' ? 'Feedback saved.' : 'Thanks for the feedback.');
    };

    const handleReuseMessage = (text: string) => {
        dispatch({ type: 'set-input', input: text });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const isEmpty = state.messages.length === 0;
    const canSend = Boolean((state.input.trim() || state.selectedAction) && !state.isGenerating);

    return (
        <CreatorWorkspaceShell variant="stack">
            {isEmpty ? (
                /* Empty State - Welcome Screen */
                <div className="flex-1 flex flex-col items-center justify-center -mt-10 px-6">
                    <div className="max-w-3xl w-full text-center space-y-8">
                        <div className="space-y-3">
                            <div className="size-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                                <Sparkles className="size-8 text-primary" />
                            </div>
                            <h1 className="text-4xl font-semibold text-foreground tracking-tight">
                                What do you want to create?
                            </h1>
                            <p className="text-muted-foreground text-lg">
                                I can generate images, videos, music, and more. Just describe what you need.
                            </p>
                        </div>

                        {state.errorMessage && (
                            <div className="mx-auto max-w-2xl rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive text-left">
                                {state.errorMessage}
                            </div>
                        )}

                        {/* Quick Actions */}
                        <div className="flex items-center justify-center gap-3 pt-2">
                            {quickActions.map((action) => (
                                <button
                                    key={action.id}
                                    onClick={() => {
                                        dispatch({ type: 'set-selected-action', selectedAction: action.id });
                                        textareaRef.current?.focus();
                                    }}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2.5 rounded-full border transition-all text-sm",
                                        state.selectedAction === action.id
                                            ? "bg-accent border-primary/20 text-foreground"
                                            : "bg-card border-border text-muted-foreground hover:text-foreground hover:bg-accent"
                                    )}
                                >
                                    <action.icon className={cn("size-4", action.color)} />
                                    {action.label}
                                </button>
                                ))}
                        </div>

                        <div className="flex items-center justify-center">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="gap-2"
                                onClick={handleResetConversation}
                                disabled={state.messages.length === 0 && !state.input && !state.selectedAction}
                            >
                                <RefreshCcw className="size-4" />
                                Reset conversation
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-2 ml-3"
                                onClick={handleSaveProject}
                                disabled={isProjectBusy}
                            >
                                <Folder className="size-4" />
                                {state.isProjectSaving ? 'Saving...' : 'Save Project'}
                            </Button>
                        </div>

                        {state.projectError && (
                            <div className="mx-auto max-w-2xl rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-600 text-left">
                                {state.projectError}
                            </div>
                        )}

                        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-left">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Provider</p>
                                <p className="text-sm text-muted-foreground">Use a live provider that supports the selected action.</p>
                            </div>
                            <select
                                value={state.selectedProvider}
                                onChange={(event) => dispatch({ type: 'set-selected-provider', selectedProvider: event.target.value })}
                                className="min-w-44 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none"
                            >
                                {providerOptions.length > 0 ? (
                                    providerOptions.map((provider) => (
                                        <option key={provider.name} value={provider.name}>
                                            {provider.name}
                                        </option>
                                    ))
                                ) : (
                                    <option value="">Use backend default</option>
                                )}
                            </select>
                        </div>

                        {/* Main Input */}
                        <div className="relative">
                            <div className="relative bg-card border border-border rounded-2xl p-4 shadow-lg transition-all focus-within:border-ring focus-within:ring-1 focus-within:ring-ring">
                                <textarea
                                    ref={textareaRef}
                                    value={state.input}
                                    onChange={(e) => dispatch({ type: 'set-input', input: e.target.value })}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Describe your creation?"
                                    className="w-full bg-transparent border-none outline-none text-lg text-foreground placeholder:text-muted-foreground/50 min-h-[80px] resize-none"
                                />
                                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground hover:text-foreground" onClick={() => attachmentInputRef.current?.click()}>
                                            <Paperclip className="size-4 mr-1.5" />
                                            Attach
                                        </Button>
                                        <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground hover:text-foreground" onClick={() => document.getElementById('assistant-templates')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                                            <ImageIcon className="size-4 mr-1.5" />
                                            Templates
                                        </Button>
                                    </div>
                                    <Button
                                        size="icon"
                                        className="size-9 rounded-full"
                                        onClick={handleSend}
                                        disabled={!canSend || state.isGenerating || !resolveProviderForAction(state.selectedAction)}
                                    >
                                        <Send className="size-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Templates */}
                        <div className="pt-4" id="assistant-templates">
                            <p className="text-sm font-medium text-muted-foreground mb-4">Templates</p>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {templates.map((t) => (
                                    <button
                                        key={t.label}
                                        onClick={() => { dispatch({ type: 'set-input', input: t.prompt }); textareaRef.current?.focus(); }}
                                        className="text-left p-4 rounded-xl border border-border bg-card hover:bg-accent transition-colors group"
                                    >
                                        <span className="text-xs font-semibold text-foreground/90 block">{t.label}</span>
                                        <span className="text-[10px] text-muted-foreground line-clamp-2 mt-1">{t.prompt}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* Chat View */
                <>
                    <div className="flex-1 overflow-y-auto">
                        <div className="max-w-4xl mx-auto p-6 space-y-6">
                            <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
                                <div>
                                    Provider: <span className="font-medium text-foreground">{state.selectedProvider || 'backend default'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="gap-2"
                                        onClick={handleResetConversation}
                                        disabled={state.messages.length === 0 && !state.input && !state.selectedAction}
                                    >
                                        <RefreshCcw className="size-4" />
                                        Reset
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-2"
                                        onClick={handleSaveProject}
                                        disabled={isProjectBusy}
                                    >
                                        <Folder className="size-4" />
                                        {state.isProjectSaving ? 'Saving...' : 'Save Project'}
                                    </Button>
                                </div>
                            </div>
                            {state.projectError && (
                                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-600">
                                    {state.projectError}
                                </div>
                            )}
                            {state.messages.map((msg) => (
                                <div key={msg.id} className={cn("flex gap-3", msg.role === 'user' ? 'justify-end' : '')}>
                                    {msg.role === 'assistant' && (
                                        <div className="size-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-1">
                                            <Bot className="size-4 text-primary" />
                                        </div>
                                    )}
                                    <div className={cn("max-w-[75%] space-y-3", msg.role === 'user' ? 'items-end' : '')}>
                                        <div className={cn(
                                            "px-4 py-3 rounded-2xl text-sm leading-relaxed",
                                            msg.role === 'user'
                                                ? "bg-primary text-primary-foreground rounded-tr-md"
                                                : "bg-card border border-border rounded-tl-md"
                                        )}>
                                            {msg.content}
                                        </div>
                                        {msg.generatedImages && msg.generatedImages.length > 0 && (
                                            <div className="grid grid-cols-2 gap-2">
                                                {msg.generatedImages.map((url: string, i: number) => (
                                                    <div key={url} className="group relative aspect-square rounded-xl overflow-hidden border border-border">
                                                        <Image src={url} alt={`Generated ${i + 1}`} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
                                                        <div className="absolute inset-0 bg-zinc-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                            <Button size="icon" variant="secondary" className="size-8" onClick={() => handleDownloadImage(url, `assistant-image-${msg.id}-${i + 1}.png`) }><Download className="size-4" /></Button>
                                                            <Button size="icon" variant="secondary" className="size-8" onClick={() => handleCopyText(url)}><Copy className="size-4" /></Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {msg.role === 'assistant' && (
                                            <div className="flex items-center gap-1 pt-1">
                                                <Button variant="ghost" size="icon" className="size-7 text-muted-foreground" onClick={() => handleFeedback('up')}><ThumbsUp className="size-3.5" /></Button>
                                                <Button variant="ghost" size="icon" className="size-7 text-muted-foreground" onClick={() => handleFeedback('down')}><ThumbsDown className="size-3.5" /></Button>
                                                <Button variant="ghost" size="icon" className="size-7 text-muted-foreground" onClick={() => handleCopyText(msg.content)}><Copy className="size-3.5" /></Button>
                                                <Button variant="ghost" size="icon" className="size-7 text-muted-foreground" onClick={() => handleReuseMessage(msg.content)}><RefreshCcw className="size-3.5" /></Button>
                                            </div>
                                        )}
                                    </div>
                                    {msg.role === 'user' && (
                                        <div className="size-8 rounded-full bg-accent flex items-center justify-center shrink-0 mt-1">
                                            <User className="size-4 text-muted-foreground" />
                                        </div>
                                    )}
                                </div>
                            ))}
                            {state.isGenerating && (
                                <div className="flex gap-3">
                                    <div className="size-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                                        <Bot className="size-4 text-primary" />
                                    </div>
                                    <div className="px-4 py-3 bg-card border border-border rounded-2xl rounded-tl-md">
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="size-4 animate-spin text-primary" />
                                            <span className="text-sm text-muted-foreground">Creating?</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    </div>

                    {/* Input Bar */}
                    <div className="border-t border-border p-4 bg-background">
                        <div className="max-w-4xl mx-auto">
                            <div className="relative bg-card border border-border rounded-2xl p-3 focus-within:border-ring focus-within:ring-1 focus-within:ring-ring transition-all">
                                <textarea
                                    ref={textareaRef}
                                    value={state.input}
                                    onChange={(e) => dispatch({ type: 'set-input', input: e.target.value })}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Type a message?"
                                    className="w-full bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground/50 min-h-[40px] max-h-[120px] resize-none"
                                    rows={1}
                                />
                                <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="icon" className="size-8 text-muted-foreground" onClick={() => attachmentInputRef.current?.click()}><Paperclip className="size-4" /></Button>
                                        <Button variant="ghost" size="icon" className="size-8 text-muted-foreground" onClick={() => document.getElementById('assistant-templates')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}><ImageIcon className="size-4" /></Button>
                                    </div>
                                    <Button size="icon" className="size-8 rounded-full" onClick={handleSend} disabled={!canSend || state.isGenerating || !resolveProviderForAction(state.selectedAction)}>
                                        <Send className="size-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <input
                        ref={attachmentInputRef}
                        type="file"
                        className="hidden"
                        accept="image/*,video/*"
                        onChange={handleAttachmentUpload}
                    />
                </>
            )}
        </CreatorWorkspaceShell>
    );
}
