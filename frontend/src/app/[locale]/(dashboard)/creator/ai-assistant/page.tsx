'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
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

const normalizeAssistantSnapshot = (value: unknown): Partial<AssistantSnapshot> => {
    const raw = (value ?? {}) as Record<string, unknown>;
    const snapshot = (raw.snapshot && typeof raw.snapshot === 'object' ? raw.snapshot : raw) as Record<string, unknown>;

    const messages = Array.isArray(snapshot.messages)
        ? snapshot.messages
              .map((message) => message as Record<string, unknown>)
              .filter((message) => typeof message.id === 'string' && (message.role === 'user' || message.role === 'assistant') && typeof message.content === 'string')
              .map((message) => ({
                  id: message.id as string,
                  role: message.role as 'user' | 'assistant',
                  content: message.content as string,
                  timestamp: typeof message.timestamp === 'string' ? message.timestamp : new Date().toISOString(),
                  attachments: Array.isArray(message.attachments)
                      ? message.attachments.filter((attachment): attachment is { type: 'image' | 'video'; url: string } => {
                            const item = attachment as Record<string, unknown>;
                            return (item.type === 'image' || item.type === 'video') && typeof item.url === 'string';
                        })
                      : undefined,
                  generatedImages: Array.isArray(message.generatedImages)
                      ? message.generatedImages.filter((url): url is string => typeof url === 'string')
                      : undefined,
              }))
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
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [selectedAction, setSelectedAction] = useState<string | null>(null);
    const [selectedProvider, setSelectedProvider] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const attachmentInputRef = useRef<HTMLInputElement>(null);
    const messageIdRef = useRef(0);
    const pendingPromptRef = useRef<string | null>(null);
    const pendingActionRef = useRef<string | null>(null);
    const pendingGenerationIdRef = useRef<string | null>(null);
    const [pendingAttachments, setPendingAttachments] = useState<Array<{ type: 'image' | 'video'; url: string }>>([]);
    const [projectId, setProjectId] = useState<string | null>(null);
    const [isProjectLoading, setIsProjectLoading] = useState(false);
    const [isProjectSaving, setIsProjectSaving] = useState(false);
    const [projectError, setProjectError] = useState<string | null>(null);
    const { startGeneration, currentGeneration, error, reset } = useGenerationStore();
    const { providers: generationProviders } = useGenerationProviders();
    const router = useRouter();
    const searchParams = useSearchParams();
    const providerOptions = useMemo(
        () => generationProviders.filter((provider) => provider.capabilities.some((capability) => capability in actionCapabilityMap || capability === 'image-generation' || capability === 'video-generation' || capability === 'audio-music' || capability === 'audio-sfx')),
        [generationProviders],
    );
    const isProjectBusy = isProjectLoading || isProjectSaving;

    const resolveProviderForAction = (actionId?: string | null) => {
        const capability = actionId ? actionCapabilityMap[actionId] : 'image-generation';
        const compatibleProviders = generationProviders.filter((provider) =>
            provider.capabilities.includes(capability),
        );

        if (compatibleProviders.length === 0) {
            return selectedProvider || '';
        }

        if (selectedProvider && compatibleProviders.some((provider) => provider.name === selectedProvider)) {
            return selectedProvider;
        }

        return compatibleProviders[0].name;
    };

    useEffect(() => {
        const requestedProjectId = searchParams.get('projectId');
        setProjectId(requestedProjectId);

        const applySnapshot = (snapshot: Partial<AssistantSnapshot>) => {
            setMessages(
                snapshot.messages?.map((message) => ({
                    ...message,
                    timestamp: new Date(message.timestamp),
                })) ?? [],
            );
            setInput(snapshot.input ?? '');
            setSelectedAction(snapshot.selectedAction ?? null);
            setSelectedProvider(snapshot.selectedProvider ?? '');
            setPendingAttachments(snapshot.pendingAttachments ?? []);
            setProjectError(null);
            pendingPromptRef.current = null;
            pendingActionRef.current = null;
            pendingGenerationIdRef.current = null;
            messageIdRef.current = snapshot.messages?.length ?? 0;
        };

        const loadDraft = () => {
            const draftRaw = localStorage.getItem('assistant:draft');
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
        setIsProjectLoading(true);

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
        if (!generationProviders.length) {
            return;
        }

        if (!selectedProvider || !generationProviders.some((provider) => provider.name === selectedProvider)) {
            const defaultProvider = resolveProviderForAction(selectedAction);
            setSelectedProvider(defaultProvider || generationProviders[0].name);
        }
    }, [generationProviders, selectedAction, selectedProvider]);

    useEffect(() => {
        if (!selectedAction || !generationProviders.length) {
            return;
        }

        const resolvedProvider = resolveProviderForAction(selectedAction);
        if (resolvedProvider && resolvedProvider !== selectedProvider) {
            setSelectedProvider(resolvedProvider);
        }
    }, [generationProviders, selectedAction, selectedProvider]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (!isGenerating) {
            return;
        }

        if (!currentGeneration) {
            return;
        }

        if (!pendingGenerationIdRef.current || pendingGenerationIdRef.current !== currentGeneration.id) {
            pendingGenerationIdRef.current = currentGeneration.id;
        }

        if (currentGeneration.status === 'completed') {
            const prompt = pendingPromptRef.current || input;
            const actionKey = pendingActionRef.current;
            const actionLabel = actionKey ? actionConfig[actionKey]?.successLabel : null;
            messageIdRef.current += 1;
            setMessages((prev) => [
                ...prev,
                {
                    id: `msg_${messageIdRef.current}`,
                    role: 'assistant',
                    content: prompt
                        ? `I processed your ${actionLabel || 'request'}: "${prompt}". Here is the generated result.`
                        : `I processed your ${actionLabel || 'request'} and generated a result.`,
                    timestamp: new Date(),
                    generatedImages: currentGeneration.resultUrl ? [currentGeneration.resultUrl] : undefined,
                },
            ]);
            pendingPromptRef.current = null;
            pendingActionRef.current = null;
            pendingGenerationIdRef.current = null;
            setIsGenerating(false);
            setErrorMessage(null);
        } else if (currentGeneration.status === 'failed') {
            pendingPromptRef.current = null;
            pendingActionRef.current = null;
            pendingGenerationIdRef.current = null;
            setIsGenerating(false);
            setErrorMessage(currentGeneration.error || error || 'Generation failed. Please try again.');
        }
    }, [currentGeneration, error, input, isGenerating]);

    const handleSaveProject = async () => {
        const snapshot: AssistantSnapshot = {
            messages: messages.map((message) => ({
                ...message,
                timestamp: message.timestamp.toISOString(),
            })),
            input,
            selectedAction,
            selectedProvider,
            pendingAttachments,
        };

        localStorage.setItem('assistant:draft', JSON.stringify(snapshot));
        setIsProjectSaving(true);
        setProjectError(null);

        try {
            if (projectId) {
                await projectApi.update(projectId, {
                    name: 'AI Assistant Session',
                    content: { version: 1, savedAt: new Date().toISOString(), snapshot } satisfies AssistantProjectPayload,
                });
            } else {
                const created = await projectApi.create({
                    name: 'AI Assistant Session',
                    content: { version: 1, savedAt: new Date().toISOString(), snapshot } satisfies AssistantProjectPayload,
                });
                setProjectId(created.project.id);
                router.replace(`${window.location.pathname}?projectId=${created.project.id}`);
            }
            toast.success('Assistant project saved.');
        } catch (saveError) {
            console.error('Failed to save assistant project', saveError);
            setProjectError('Saved locally, but backend project save failed.');
            toast.error('Assistant project saved locally, backend save failed.');
        } finally {
            setIsProjectSaving(false);
        }
    };

    const handleSend = async () => {
        if (!input.trim() && !selectedAction) return;
        messageIdRef.current += 1;
        const userMessageId = `msg_${messageIdRef.current}`;
        const action = selectedAction ? actionConfig[selectedAction] : null;
        const promptText = input.trim() || action?.prompt || 'Create something new.';
        const provider = resolveProviderForAction(selectedAction);

        if (!provider) {
            setErrorMessage('No compatible provider is available for this action.');
            return;
        }

        const userMsg: Message = {
            id: userMessageId,
            role: 'user',
            content: promptText,
            timestamp: new Date(),
            attachments: pendingAttachments.length > 0 ? pendingAttachments : undefined,
        };

        setMessages((prev) => [...prev, userMsg]);
        setErrorMessage(null);
        setInput('');
        setSelectedAction(null);
        setPendingAttachments([]);
        setIsGenerating(true);
        pendingPromptRef.current = userMsg.content;
        pendingActionRef.current = selectedAction;

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
            setIsGenerating(false);
            setErrorMessage('Failed to start generation. Please try again.');
        }
    };

    const handleResetConversation = () => {
        reset();
        setMessages([]);
        setInput('');
        setErrorMessage(null);
        setSelectedAction(null);
        setSelectedProvider('');
        setIsGenerating(false);
        setPendingAttachments([]);
        setProjectError(null);
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

        setPendingAttachments((current) => [
            ...(current ?? []),
            {
                type: file.type.startsWith('video/') ? 'video' : 'image',
                url: uploaded.url,
            },
        ]);
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
        setInput(text);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const isEmpty = messages.length === 0;
    const canSend = Boolean((input.trim() || selectedAction) && !isGenerating);

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

                        {errorMessage && (
                            <div className="mx-auto max-w-2xl rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive text-left">
                                {errorMessage}
                            </div>
                        )}

                        {/* Quick Actions */}
                        <div className="flex items-center justify-center gap-3 pt-2">
                            {quickActions.map((action) => (
                                <button
                                    key={action.id}
                                        onClick={() => {
                                            setSelectedAction(action.id);
                                            textareaRef.current?.focus();
                                        }}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2.5 rounded-full border transition-all text-sm",
                                        selectedAction === action.id
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
                                disabled={messages.length === 0 && !input && !selectedAction}
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
                                {isProjectSaving ? 'Saving...' : 'Save Project'}
                            </Button>
                        </div>

                        {projectError && (
                            <div className="mx-auto max-w-2xl rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-600 text-left">
                                {projectError}
                            </div>
                        )}

                        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-left">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Provider</p>
                                <p className="text-sm text-muted-foreground">Use a live provider that supports the selected action.</p>
                            </div>
                            <select
                                value={selectedProvider}
                                onChange={(event) => setSelectedProvider(event.target.value)}
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
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Describe your creation..."
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
                                        className="h-9 w-9 rounded-full"
                                        onClick={handleSend}
                                        disabled={!canSend || isGenerating || !resolveProviderForAction(selectedAction)}
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
                                        onClick={() => { setInput(t.prompt); textareaRef.current?.focus(); }}
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
                        <div className="max-w-4xl mx-auto py-6 px-6 space-y-6">
                            <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
                                <div>
                                    Provider: <span className="font-medium text-foreground">{selectedProvider || 'backend default'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="gap-2"
                                        onClick={handleResetConversation}
                                        disabled={messages.length === 0 && !input && !selectedAction}
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
                                        {isProjectSaving ? 'Saving...' : 'Save Project'}
                                    </Button>
                                </div>
                            </div>
                            {projectError && (
                                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-600">
                                    {projectError}
                                </div>
                            )}
                            {messages.map((msg) => (
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
                                                {msg.generatedImages.map((url, i) => (
                                                    <div key={url} className="group relative aspect-square rounded-xl overflow-hidden border border-border">
                                                        <Image src={url} alt={`Generated ${i + 1}`} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
                                                        <div className="absolute inset-0 bg-gray-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
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
                            {isGenerating && (
                                <div className="flex gap-3">
                                    <div className="size-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                                        <Bot className="size-4 text-primary" />
                                    </div>
                                    <div className="px-4 py-3 bg-card border border-border rounded-2xl rounded-tl-md">
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="size-4 animate-spin text-primary" />
                                            <span className="text-sm text-muted-foreground">Creating...</span>
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
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Type a message..."
                                    className="w-full bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground/50 min-h-[40px] max-h-[120px] resize-none"
                                    rows={1}
                                />
                                <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="icon" className="size-8 text-muted-foreground" onClick={() => attachmentInputRef.current?.click()}><Paperclip className="size-4" /></Button>
                                        <Button variant="ghost" size="icon" className="size-8 text-muted-foreground" onClick={() => document.getElementById('assistant-templates')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}><ImageIcon className="size-4" /></Button>
                                    </div>
                                    <Button size="icon" className="h-8 w-8 rounded-full" onClick={handleSend} disabled={!canSend || isGenerating || !resolveProviderForAction(selectedAction)}>
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
