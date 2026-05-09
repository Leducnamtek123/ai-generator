'use client';

import React from 'react';
import Link from 'next/link';
import { AnimatePresence, LazyMotion, domAnimation, m } from 'framer-motion';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { 
    Search, 
    Filter, 
    MessageSquare, 
    Facebook, 
    Twitter, 
    Linkedin, 
    MoreHorizontal,
    Reply,
    CheckCircle,
    User,
    ArrowUpRight,
    Plus,
    Smile
} from 'lucide-react';
import { useSocialSocket } from '@/providers/SocketProvider';
import { cn } from '@/lib/utils';
import { socialHubApi, type SocialInteraction } from '@/services/socialHubApi';
import { toast } from 'sonner';

type InboxFilter = 'all' | 'mention' | 'comment' | 'dm';

type InboxState = {
    interactions: SocialInteraction[];
    selectedId: number | string | null;
    searchQuery: string;
    replyText: string;
    typeFilter: InboxFilter;
    handledInteractionIds: string[];
    isReplying: boolean;
};

type InboxAction =
    | { type: 'setInteractions'; interactions: SocialInteraction[] }
    | { type: 'prependInteraction'; interaction: SocialInteraction }
    | { type: 'setSelectedId'; selectedId: number | string | null }
    | { type: 'setSearchQuery'; searchQuery: string }
    | { type: 'setReplyText'; replyText: string }
    | { type: 'setTypeFilter'; typeFilter: InboxFilter }
    | { type: 'markHandled'; interaction: SocialInteraction }
    | { type: 'removeInteraction'; interaction: SocialInteraction }
    | { type: 'patchInteraction'; interaction: SocialInteraction; patch: Partial<SocialInteraction> }
    | { type: 'setIsReplying'; isReplying: boolean };

const initialInboxState: InboxState = {
    interactions: [],
    selectedId: null,
    searchQuery: '',
    replyText: '',
    typeFilter: 'all',
    handledInteractionIds: [],
    isReplying: false,
};

const getInteractionKey = (item: SocialInteraction) => {
    const accountId = item.accountId ?? 'global';
    return `${accountId}:${String(item.id)}`;
};

const inboxReducer = (state: InboxState, action: InboxAction): InboxState => {
    switch (action.type) {
        case 'setInteractions':
            return { ...state, interactions: action.interactions };
        case 'prependInteraction':
            return { ...state, interactions: [action.interaction, ...state.interactions] };
        case 'setSelectedId':
            return { ...state, selectedId: action.selectedId };
        case 'setSearchQuery':
            return { ...state, searchQuery: action.searchQuery };
        case 'setReplyText':
            return { ...state, replyText: action.replyText };
        case 'setTypeFilter':
            return { ...state, typeFilter: action.typeFilter };
        case 'markHandled': {
            const key = getInteractionKey(action.interaction);
            return {
                ...state,
                handledInteractionIds: state.handledInteractionIds.includes(key)
                    ? state.handledInteractionIds
                    : [...state.handledInteractionIds, key],
                interactions: state.interactions.filter((entry) => getInteractionKey(entry) !== key),
                selectedId: state.selectedId === action.interaction.id ? null : state.selectedId,
            };
        }
        case 'removeInteraction': {
            const key = getInteractionKey(action.interaction);
            return {
                ...state,
                handledInteractionIds: state.handledInteractionIds.includes(key)
                    ? state.handledInteractionIds
                    : [...state.handledInteractionIds, key],
                interactions: state.interactions.filter((entry) => getInteractionKey(entry) !== key),
                selectedId: state.selectedId === action.interaction.id ? null : state.selectedId,
            };
        }
        case 'patchInteraction': {
            const key = getInteractionKey(action.interaction);
            return {
                ...state,
                interactions: state.interactions.map((entry) =>
                    getInteractionKey(entry) === key ? { ...entry, ...action.patch } : entry,
                ),
            };
        }
        case 'setIsReplying':
            return { ...state, isReplying: action.isReplying };
        default:
            return state;
    }
};

const ASSIGNEES = ['Me', 'Support', 'Sales', 'Marketing'] as const;
const QUICK_LABELS = ['VIP', 'Bug', 'Lead', 'Escalation'] as const;
const SAVED_REPLIES = [
    'Thanks for reaching out. We are checking this now.',
    'Appreciate the note. We will follow up shortly.',
    'Thanks. Can you share a little more detail so we can help?',
] as const;

const FILTERS: Array<{ key: InboxFilter; label: string }> = [
    { key: 'all', label: 'All' },
    { key: 'mention', label: 'Mentions' },
    { key: 'comment', label: 'Comments' },
    { key: 'dm', label: 'DMs' },
];

export default function InboxPage() {
    const [state, dispatch] = React.useReducer(inboxReducer, initialInboxState);

    const { socket } = useSocialSocket();

    React.useEffect(() => {
        const fetchInbox = async () => {
            try {
                const data = await socialHubApi.getInbox();
                dispatch({ type: 'setInteractions', interactions: data });
                if (data.length > 0) dispatch({ type: 'setSelectedId', selectedId: data[0].id });
            } catch (err) {
                console.error('Failed to fetch inbox', err);
            }
        };
        fetchInbox();
    }, []);

    // Listen for real-time interaction events
    React.useEffect(() => {
        if (!socket) return;

        socket.on('interaction:created', (newInteraction: SocialInteraction) => {
            console.log('Real-time interaction received:', newInteraction);
            dispatch({
                type: 'prependInteraction',
                interaction: {
                    id: `new_${Date.now()}`,
                    platform: newInteraction.platform,
                    type: newInteraction.type || 'mention',
                    user: newInteraction.user || 'Live User',
                    content: newInteraction.content || 'New interaction received',
                    time: newInteraction.time || 'Just now',
                    isNew: true
                },
            });
        });

        return () => {
            socket.off('interaction:created');
        };
    }, [socket]);

    const visibleInteractions = React.useMemo(() => {
        const normalizedQuery = state.searchQuery.trim().toLowerCase();

        return state.interactions.filter((item) => {
            const matchesSearch =
                item.user.toLowerCase().includes(normalizedQuery) ||
                item.content.toLowerCase().includes(normalizedQuery);
            const matchesType =
                state.typeFilter === 'all' ? true : item.type.toLowerCase().includes(state.typeFilter);
            const isHandled = state.handledInteractionIds.includes(getInteractionKey(item));

            return matchesSearch && matchesType && !isHandled;
        });
    }, [state.handledInteractionIds, state.interactions, state.searchQuery, state.typeFilter]);

    const selectedInteraction = visibleInteractions.find((i) => i.id === state.selectedId) ?? visibleInteractions[0] ?? null;
    const openCount = state.interactions.filter((item) => !state.handledInteractionIds.includes(getInteractionKey(item))).length;
    const followUpCount = state.interactions.filter((item) => Boolean(item.followUp)).length;
    const replyableCount = state.interactions.filter((item) => item.canReply !== false && !state.handledInteractionIds.includes(getInteractionKey(item))).length;
    const selectedAssignment = selectedInteraction?.assignedTo ?? 'Unassigned';
    const selectedLabels = selectedInteraction?.labels ?? [];
    const selectedFollowUp = Boolean(selectedInteraction?.followUp);

    React.useEffect(() => {
        if (!visibleInteractions.length) {
            dispatch({ type: 'setSelectedId', selectedId: null });
            return;
        }

        if (!selectedInteraction || !visibleInteractions.some((item) => item.id === state.selectedId)) {
            dispatch({ type: 'setSelectedId', selectedId: visibleInteractions[0].id });
        }
    }, [selectedInteraction, state.selectedId, visibleInteractions]);

    const hideInteractionLocally = React.useCallback((item: SocialInteraction) => {
        dispatch({ type: 'markHandled', interaction: item });
    }, []);

    const applyInteractionPatch = React.useCallback((item: SocialInteraction, patch: Partial<SocialInteraction>) => {
        dispatch({ type: 'patchInteraction', interaction: item, patch });
    }, []);

    const toggleFollowUp = React.useCallback(async (item: SocialInteraction) => {
        if (!item.accountId) {
            toast.error('This interaction cannot be updated yet.');
            return;
        }

        const nextFollowUp = !Boolean(item.followUp);
        const previousFollowUp = Boolean(item.followUp);

        applyInteractionPatch(item, { followUp: nextFollowUp });

        try {
            await socialHubApi.updateInboxInteractionTriage({
                accountId: item.accountId,
                interactionId: String(item.id),
                followUp: nextFollowUp,
            });
        } catch (error) {
            console.error('Failed to update follow-up', error);
            applyInteractionPatch(item, { followUp: previousFollowUp });
            toast.error('Failed to update follow-up.');
        }
    }, [applyInteractionPatch, getInteractionKey]);

    const cycleAssignment = React.useCallback(async (item: SocialInteraction) => {
        if (!item.accountId) {
            toast.error('This interaction cannot be assigned yet.');
            return;
        }

        const currentIndex = ASSIGNEES.findIndex((assignee) => assignee === item.assignedTo);
        const nextAssignee = ASSIGNEES[(currentIndex + 1) % ASSIGNEES.length];
        const previousAssignee = item.assignedTo ?? null;

        applyInteractionPatch(item, { assignedTo: nextAssignee });

        try {
            await socialHubApi.updateInboxInteractionTriage({
                accountId: item.accountId,
                interactionId: String(item.id),
                assignedTo: nextAssignee,
            });
        } catch (error) {
            console.error('Failed to update assignment', error);
            applyInteractionPatch(item, { assignedTo: previousAssignee });
            toast.error('Failed to update assignment.');
        }
    }, [applyInteractionPatch]);

    const toggleLabel = React.useCallback(async (item: SocialInteraction, label: string) => {
        if (!item.accountId) {
            toast.error('This interaction cannot be labeled yet.');
            return;
        }

        const currentLabels = item.labels ?? [];
        const nextLabels = currentLabels.includes(label)
            ? currentLabels.filter((entry) => entry !== label)
            : [...currentLabels, label];

        applyInteractionPatch(item, { labels: nextLabels });

        try {
            await socialHubApi.updateInboxInteractionTriage({
                accountId: item.accountId,
                interactionId: String(item.id),
                labels: nextLabels,
            });
        } catch (error) {
            console.error('Failed to update labels', error);
            applyInteractionPatch(item, { labels: currentLabels });
            toast.error('Failed to update labels.');
        }
    }, [applyInteractionPatch]);

    const applySavedReply = (snippet: string) => {
        dispatch({
            type: 'setReplyText',
            replyText: `${state.replyText.trim().length > 0 ? `${state.replyText.trim()}\n\n` : ''}${snippet}`,
        });
    };

    const insertReplySnippet = (snippet: string) => {
        const base = state.replyText.trimEnd();
        dispatch({
            type: 'setReplyText',
            replyText: !base ? snippet : `${base}${base.endsWith('\n') ? '' : ' '}${snippet}`,
        });
    };

    const insertAttachmentPlaceholder = () => {
        insertReplySnippet('[Attachment]');
        toast.success('Attachment placeholder added to the reply draft.');
    };

    const insertEmoji = () => {
        insertReplySnippet('✨');
        toast.success('Emoji added to the reply draft.');
    };

    const handleReply = async () => {
        if (!state.replyText.trim()) {
            toast.error('Please enter a reply message.');
            return;
        }
        if (!selectedInteraction?.accountId) {
            toast.error('This interaction cannot be replied to from the inbox.');
            return;
        }
        if (selectedInteraction.canReply === false) {
            toast.error('This platform does not support direct replies yet.');
            return;
        }

        dispatch({ type: 'setIsReplying', isReplying: true });
        try {
            await socialHubApi.replyToInboxInteraction({
                accountId: selectedInteraction.accountId,
                interactionId: String(selectedInteraction.id),
                message: state.replyText.trim(),
            });
            toast.success('Response sent successfully!');
            dispatch({ type: 'setReplyText', replyText: '' });
            hideInteractionLocally(selectedInteraction);
        } catch (err) {
            console.error('Failed to send reply', err);
            toast.error('Failed to send response.');
        }
        dispatch({ type: 'setIsReplying', isReplying: false });
    };

    const handleMarkDone = async () => {
        if (!selectedInteraction?.accountId) {
            toast.error('This interaction cannot be marked done yet.');
            return;
        }

        try {
            await socialHubApi.markInboxInteractionHandled({
                accountId: selectedInteraction.accountId,
                interactionId: String(selectedInteraction.id),
            });
            toast.success('Interaction marked as done.');
            hideInteractionLocally(selectedInteraction);
        } catch (err) {
            console.error('Failed to mark interaction handled', err);
            toast.error('Failed to mark interaction as done.');
        }
    };

    const cycleFilter = () => {
        const currentIndex = FILTERS.findIndex((filter) => filter.key === state.typeFilter);
        const nextFilter = FILTERS[(currentIndex + 1) % FILTERS.length];
        dispatch({ type: 'setTypeFilter', typeFilter: nextFilter.key });
    };

    return (
        <LazyMotion features={domAnimation}>
        <div className="flex h-full overflow-hidden">
            {/* Sidebar / List Pane */}
            <div className="w-[450px] border-r border-border bg-sidebar flex flex-col h-full">
                <div className="p-6 border-b border-border space-y-4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-semibold">Social Inbox</h1>
                        <Button asChild variant="ghost" size="sm" className="h-8 px-2">
                            <Link href="/social">Hub</Link>
                        </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="rounded-xl border border-white/10 bg-background/40 p-3">
                            <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Open</p>
                            <p className="mt-2 text-2xl font-bold">{openCount}</p>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-background/40 p-3">
                            <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Replyable</p>
                            <p className="mt-2 text-2xl font-bold">{replyableCount}</p>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-background/40 p-3">
                            <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Follow-up</p>
                            <p className="mt-2 text-2xl font-bold">{followUpCount}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="size-8" onClick={cycleFilter}>
                            <Filter className="size-4" />
                        </Button>
                        <div className="text-xs text-muted-foreground">
                            Unified inbox: filter, reply, mark follow-up, and close the loop.
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {FILTERS.map((filter) => (
                            <Button
                                key={filter.key}
                                variant={state.typeFilter === filter.key ? 'default' : 'outline'}
                                size="sm"
                                className="h-8 text-xs"
                                onClick={() => dispatch({ type: 'setTypeFilter', typeFilter: filter.key })}
                            >
                                {filter.label}
                            </Button>
                        ))}
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <input 
                            className="w-full bg-muted/50 border-none rounded-lg py-2 pl-10 pr-4 text-sm focus:ring-1 focus:ring-primary"
                            placeholder="Search interactions?"
                            value={state.searchQuery}
                            onChange={(e) => dispatch({ type: 'setSearchQuery', searchQuery: e.target.value })}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-auto bg-sidebar p-4">
                    <div className="space-y-4">
                        <AnimatePresence initial={false}>
                            {visibleInteractions.map((item) => (
                                <m.div
                                    key={item.id}
                                    initial={{ opacity: 0, x: -20, height: 0 }}
                                    animate={{ opacity: 1, x: 0, height: 'auto' }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    onClick={() => dispatch({ type: 'setSelectedId', selectedId: item.id })}
                                    className={cn(
                                        "p-6 cursor-pointer border transition-all hover:bg-muted/30 relative rounded-xl",
                                        state.selectedId === item.id ? "bg-primary/5 border-primary" : "border-border"
                                    )}
                                >
                                    {item.isNew && (
                                        <span className="absolute -top-1 -right-1 bg-primary text-[10px] px-1.5 py-0.5 rounded-full text-white font-bold animate-pulse">
                                            LIVE
                                        </span>
                                    )}
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="size-8 rounded-full bg-muted flex items-center justify-center">
                                                <User className="size-4 text-muted-foreground" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-semibold">{item.user}</h4>
                                                <div className="flex items-center gap-1.5">
                                                    {item.platform === 'facebook' && <Facebook className="size-3 text-[#1877F2]" />}
                                                    {item.platform === 'twitter' && <Twitter className="size-3 text-foreground" />}
                                                    {item.platform === 'linkedin' && <Linkedin className="size-3 text-[#0A66C2]" />}
                                                    <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-tighter">{item.type}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <span className="text-[10px] text-muted-foreground font-medium">{item.time}</span>
                                    </div>
                                <p className="text-sm line-clamp-2 text-muted-foreground font-medium">
                                    {item.content}
                                </p>
                                    {item.followUp && (
                                        <div className="mt-3 inline-flex rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-400">
                                            Follow-up
                                        </div>
                                    )}
                                    {(item.assignedTo || item.labels?.length) && (
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {item.assignedTo && (
                                                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                                                    {item.assignedTo}
                                                </span>
                                            )}
                                            {(item.labels ?? []).slice(0, 2).map((label) => (
                                                <span
                                                    key={label}
                                                    className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
                                                >
                                                    {label}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </m.div>
                            ))}
                            {visibleInteractions.length === 0 && (
                                <div className="text-center text-sm text-muted-foreground p-8">
                                    No interactions found.
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Content Pane */}
            <div className="flex-1 flex flex-col bg-background/50 relative">
                <AnimatePresence mode="wait">
                    {selectedInteraction ? (
                        <m.div 
                            key={selectedInteraction.id}
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="flex-1 flex flex-col h-full"
                        >
                            {/* Header */}
                            <div className="p-6 border-b border-border bg-white/[0.02] flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <h3 className="text-lg font-semibold">Conversation with {selectedInteraction.user}</h3>
                                    <Button variant="outline" size="sm" className="h-7 text-[10px] uppercase font-bold tracking-wider">
                                        View on {selectedInteraction.platform}
                                        <ArrowUpRight className="size-3 ml-1.5" />
                                    </Button>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="icon" className="size-9 text-green-500" onClick={() => void handleMarkDone()}>
                                        <CheckCircle className="size-5" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className={cn(
                                            "h-9 w-9",
                                            selectedFollowUp && "text-amber-400",
                                        )}
                                        onClick={() => toggleFollowUp(selectedInteraction)}
                                    >
                                        <Filter className="size-5" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-9 text-xs"
                                        onClick={() => cycleAssignment(selectedInteraction)}
                                    >
                                        Assign: {selectedAssignment}
                                    </Button>
                                    <Button variant="ghost" size="icon" className="size-9" onClick={() => toast.info('More actions are available from the reply actions below.')}>
                                        <MoreHorizontal className="size-5" />
                                    </Button>
                                </div>
                            </div>

                            {/* Message Area */}
                            <div className="flex-1 p-8 overflow-auto  gap-y-6">
                                <div className="flex gap-4 max-w-2xl">
                                    <div className="size-10 rounded-full bg-muted shrink-0" />
                                    <GlassCard variant="morphism" className="border border-white/5 bg-white/5 p-6 rounded-2xl rounded-tl-none">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-bold text-sm">{selectedInteraction.user}</span>
                                            <span className="text-[10px] text-muted-foreground">{selectedInteraction.time}</span>
                                        </div>
                                        <p className="text-sm leading-relaxed">{selectedInteraction.content}</p>
                                    </GlassCard>
                                </div>

                                <div className="max-w-2xl space-y-3">
                                    <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Saved replies</p>
                                    <div className="flex flex-wrap gap-2">
                                        {SAVED_REPLIES.map((snippet) => (
                                            <Button
                                                key={snippet}
                                                variant="outline"
                                                size="sm"
                                                className="h-8 text-xs"
                                                onClick={() => applySavedReply(snippet)}
                                            >
                                                Use template
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                <div className="max-w-2xl space-y-3">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Assignment & labels</p>
                                        <span className="text-xs text-muted-foreground">Current assignee: {selectedAssignment}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {QUICK_LABELS.map((label) => {
                                            const active = selectedLabels.includes(label);
                                            return (
                                                <Button
                                                    key={label}
                                                    variant={active ? 'default' : 'outline'}
                                                    size="sm"
                                                    className="h-8 text-xs"
                                                    onClick={() => toggleLabel(selectedInteraction, label)}
                                                >
                                                    {label}
                                                </Button>
                                            );
                                        })}
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedLabels.length > 0 ? (
                                            selectedLabels.map((label) => (
                                                <span
                                                    key={label}
                                                    className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary"
                                                >
                                                    {label}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-xs text-muted-foreground">No labels assigned yet.</span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-4 max-w-2xl ml-auto flex-row-reverse">
                                    <div className="size-10 rounded-full bg-primary/20 shrink-0" />
                                    <div className="bg-primary text-primary-foreground p-6 rounded-2xl rounded-tr-none shadow-lg shadow-primary/20">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-bold text-sm">PaintAI Assistant</span>
                                            <span className="text-[10px] opacity-70">Just now</span>
                                        </div>
                                        <p className="text-sm leading-relaxed italic opacity-80">We can help you with that! Just let us know what you need.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Input Area */}
                            <div className="p-6 border-t border-border bg-white/[0.02]">
                                <GlassCard variant="morphism" className="p-4 border border-white/10 flex flex-col gap-4">
                                    <textarea 
                                        className="w-full bg-transparent border-none focus:ring-0 text-sm resize-none min-h-[100px]"
                                        placeholder={`Reply to ${selectedInteraction.user}...`}
                                        value={state.replyText}
                                        onChange={(e) => dispatch({ type: 'setReplyText', replyText: e.target.value })}
                                    />
                                    <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1">
                                        <Button variant="ghost" size="icon" className="size-8" onClick={insertAttachmentPlaceholder}>
                                            <Plus className="size-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="size-8" onClick={insertEmoji}>
                                            <Smile className="size-4" />
                                        </Button>
                                    </div>
                                    <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
                                        {selectedFollowUp ? 'Marked for follow-up' : 'Ready to send'}
                                    </div>
                                        <Button size="sm" onClick={() => void handleReply()} disabled={state.isReplying}>
                                            <Reply className="size-4 mr-2" />
                                        {state.isReplying ? 'Sending...' : 'Send Response'}
                                    </Button>
                                    </div>
                                </GlassCard>
                                <div className="text-xs text-muted-foreground">
                                    This inbox keeps the operational loop in one place: open, reply, follow up, and mark done.
                                </div>
                            </div>
                        </m.div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center overflow-hidden relative">
                            <m.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="relative z-10 flex flex-col items-center"
                            >
                                <div className="size-24 rounded-3xl bg-primary/10 flex items-center justify-center mb-6 relative">
                                    <MessageSquare className="size-12 text-primary" />
                                    <div className="absolute -top-2 -right-2 size-8 rounded-full bg-background border-2 border-primary flex items-center justify-center animate-[pulse_2.8s_ease-in-out_infinite]">
                                         <Plus className="size-4 text-primary" />
                                     </div>
                                </div>
                                <h3 className="text-2xl font-semibold mb-2">Select a Conversation</h3>
                                <p className="text-muted-foreground max-w-sm text-sm">
                                    Click on an interaction from the sidebar to view the conversation details and reply across all your social channels.
                                </p>
                            </m.div>
                            
                            {/* Decorative background blur */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
        </LazyMotion>
    );
}
