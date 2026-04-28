'use client';

import React from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { 
    Send, 
    Calendar, 
    Image as ImageIcon, 
    Video, 
    Link as LinkIcon,
    Smile,
    Trash2,
    Facebook,
    Twitter,
    Linkedin,
    Instagram,
    Eye,
    Wand2,
    CheckCircle2
    ,MessageCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { SocialFeedPreview } from './components/social-feed-preview';
import { AiAssistantModal } from './components/ai-assistant-modal';
import { socialHubApi, type SocialChannel } from '@/services/socialHubApi';

const PLATFORM_META: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; label: string }> = {
    facebook: { icon: Facebook, color: '#1877F2', label: 'Facebook' },
    twitter: { icon: Twitter, color: '#000000', label: 'X (Twitter)' },
    x: { icon: Twitter, color: '#000000', label: 'X (Twitter)' },
    instagram: { icon: Instagram, color: '#E4405F', label: 'Instagram' },
    linkedin: { icon: Linkedin, color: '#0A66C2', label: 'LinkedIn' },
};

export default function PublishPage() {
    const [accounts, setAccounts] = React.useState<SocialChannel[]>([]);
    const [isLoadingAccounts, setIsLoadingAccounts] = React.useState(true);
    const [selectedAccountIds, setSelectedAccountIds] = React.useState<number[]>([]);
    const [content, setContent] = React.useState('');
    const [previewPlatform, setPreviewPlatform] = React.useState('facebook');
    const [isScheduling, setIsScheduling] = React.useState(false);
    const [scheduledAt, setScheduledAt] = React.useState('');
    const [isAiModalOpen, setIsAiModalOpen] = React.useState(false);
    const [isPublishing, setIsPublishing] = React.useState(false);

    React.useEffect(() => {
        const fetchChannels = async () => {
            try {
                const data = await socialHubApi.getChannels();
                setAccounts(data);
                if (data.length > 0) {
                    setSelectedAccountIds([data[0].id]);
                    setPreviewPlatform(data[0].platform);
                }
            } catch (error) {
                console.error('Failed to load social channels', error);
                toast.error('Failed to load connected channels.');
            } finally {
                setIsLoadingAccounts(false);
            }
        };
        void fetchChannels();
    }, []);

    const selectedAccounts = accounts.filter((account) => selectedAccountIds.includes(account.id));

    const toggleAccount = (account: SocialChannel) => {
        setSelectedAccountIds((prev) => {
            const next = prev.includes(account.id)
                ? prev.filter((id) => id !== account.id)
                : [...prev, account.id];
            if (next.length > 0) {
                const firstSelected = accounts.find((item) => item.id === next[0]);
                if (firstSelected) {
                    setPreviewPlatform(firstSelected.platform);
                }
            }
            return next;
        });
    };

    const handlePublish = async () => {
        if (!content) {
            toast.error('Please enter some content first!');
            return;
        }
        if (selectedAccountIds.length === 0) {
            toast.error('Select at least one connected channel.');
            return;
        }
        if (isScheduling && !scheduledAt) {
            toast.error('Please select a date and time for scheduling.');
            return;
        }

        setIsPublishing(true);
        toast.promise(
            socialHubApi.createPost({
                content, 
                scheduledAt: isScheduling ? new Date(scheduledAt).toISOString() : null,
                socialAccountIds: selectedAccountIds,
            }),
            {
                loading: isScheduling ? 'Scheduling posts...' : 'Publishing to selected channels...',
                success: () => {
                    setIsPublishing(false);
                    setContent('');
                    if (isScheduling) {
                        setScheduledAt('');
                    }
                    return `Successfully processed for ${selectedAccountIds.length} channels!`;
                },
                error: (err) => {
                    setIsPublishing(false);
                    return `Failed to publish: ${err.message || 'Unknown error'}`;
                },
            }
        );
    };

    return (
        <div className="p-8 max-w-[1600px] mx-auto h-full flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-bold tracking-tight">Create Post</h1>
                    <p className="text-muted-foreground text-sm">Draft, preview and schedule your content across multiple networks.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={() => {
                            setIsScheduling((prev) => !prev);
                            if (isScheduling) {
                                setScheduledAt('');
                            } else {
                                const oneHourLater = new Date(Date.now() + 60 * 60 * 1000);
                                setScheduledAt(oneHourLater.toISOString().slice(0, 16));
                            }
                        }}
                    >
                        <Calendar className="w-4 h-4 mr-2" />
                        {isScheduling ? 'Schedule' : 'Post Now'}
                    </Button>
                    <Button 
                        onClick={handlePublish}
                        disabled={isPublishing}
                        className="bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-shadow"
                    >
                        <Send className="w-4 h-4 mr-2" />
                        {isPublishing ? 'Publishing...' : 'Publish'}
                    </Button>
                </div>
            </div>

            {isScheduling && (
                <GlassCard variant="morphism" className="p-4 border border-white/10">
                    <label className="text-xs uppercase tracking-wider text-muted-foreground block mb-2">
                        Scheduled Time
                    </label>
                    <input
                        type="datetime-local"
                        value={scheduledAt}
                        onChange={(e) => setScheduledAt(e.target.value)}
                        className="h-10 w-full md:w-[320px] rounded-md border border-border bg-background px-3 text-sm"
                    />
                </GlassCard>
            )}

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 overflow-hidden pt-4">
                {/* Editor Section */}
                <div className="lg:col-span-7 flex flex-col gap-6 overflow-auto pr-2 scrollbar-thin">
                    {/* Platform Selector */}
                    <GlassCard variant="morphism" className="p-6 border border-white/10">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest text-primary/80">Select Channels</p>
                            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                                {selectedAccountIds.length} Selected
                            </span>
                        </div>
                        {isLoadingAccounts ? (
                            <p className="text-sm text-muted-foreground">Loading connected channels...</p>
                        ) : accounts.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                No connected channel yet. Please connect from Social Channels first.
                            </p>
                        ) : (
                            <div className="flex flex-wrap gap-4">
                                {accounts.map((account) => {
                                const meta = PLATFORM_META[account.platform] ?? { icon: MessageCircle, color: '#6b7280', label: account.platform };
                                const Icon = meta.icon;
                                const isSelected = selectedAccountIds.includes(account.id);
                                return (
                                    <button
                                        key={account.id}
                                        onClick={() => toggleAccount(account)}
                                        className={cn(
                                            "relative w-auto min-w-[120px] h-14 px-3 rounded-2xl flex items-center gap-2 transition-all duration-300 border-2",
                                            isSelected 
                                                ? "border-primary scale-105 shadow-xl shadow-primary/20" 
                                                : "border-transparent grayscale opacity-40 hover:opacity-100 hover:grayscale-0 hover:border-white/20"
                                        )}
                                        style={{ backgroundColor: isSelected ? meta.color : 'rgba(255,255,255,0.05)' }}
                                    >
                                        <Icon className={cn("w-6 h-6", isSelected ? "text-white" : "text-foreground")} />
                                        <span className={cn("text-xs font-semibold truncate", isSelected ? "text-white" : "text-foreground")}>
                                            {account.name || meta.label}
                                        </span>
                                        {isSelected && (
                                            <motion.div 
                                                layoutId="check-badge"
                                                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary border-2 border-background flex items-center justify-center"
                                            >
                                                <CheckCircle2 className="w-4 h-4 text-primary-foreground" />
                                            </motion.div>
                                        )}
                                    </button>
                                );
                                })}
                            </div>
                        )}
                    </GlassCard>

                    {/* Content Editor */}
                    <GlassCard variant="morphism" className="flex-1 flex flex-col p-0 border border-white/10 overflow-hidden relative group">
                        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.03]">
                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10 transition-colors"><ImageIcon className="w-4 h-4" /></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10 transition-colors"><Video className="w-4 h-4" /></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10 transition-colors"><LinkIcon className="w-4 h-4" /></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10 transition-colors"><Smile className="w-4 h-4" /></Button>
                                <div className="h-4 w-px bg-white/10 mx-2" />
                                <Button 
                                    variant="secondary" 
                                    size="sm" 
                                    className="h-8 gap-2 bg-primary/20 text-primary border border-primary/20 hover:bg-primary/30 transition-all font-bold group/ai"
                                    onClick={() => setIsAiModalOpen(true)}
                                >
                                    <Wand2 className="w-4 h-4 group-hover/ai:rotate-12 transition-transform" />
                                    AI Assistant
                                </Button>
                            </div>
                            <span className={cn(
                                "text-[10px] font-mono",
                                content.length > 280 ? "text-red-500 font-bold" : "text-muted-foreground"
                            )}>
                                {content.length} / 280
                            </span>
                        </div>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Type your creative post here or use the AI Assistant magic..."
                            className="flex-1 w-full bg-transparent p-8 resize-none focus:outline-none text-xl leading-relaxed placeholder:text-muted-foreground/20 font-medium selection:bg-primary/30"
                        />
                        <div className="p-4 bg-white/[0.02] border-t border-white/5 flex justify-end">
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all"
                                onClick={() => {
                                    if(content && confirm('Are you sure you want to clear the draft?')) {
                                        setContent('');
                                    }
                                }}
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Clear Draft
                            </Button>
                        </div>
                    </GlassCard>
                </div>

                {/* Preview Section */}
                <div className="lg:col-span-5 flex flex-col gap-4">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-2">
                            <Eye className="w-4 h-4 text-primary" />
                            <h3 className="font-bold text-sm uppercase tracking-wide">Live Preview</h3>
                        </div>
                        <div className="flex gap-1.5 p-1 bg-white/5 rounded-lg border border-white/10">
                            {selectedAccounts.map((account) => (
                                <button
                                    key={account.id}
                                    onClick={() => setPreviewPlatform(account.platform)}
                                    className={cn(
                                        "px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all",
                                        previewPlatform === account.platform ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                                    )}
                                >
                                    {account.platform}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={previewPlatform}
                                initial={{ opacity: 0, scale: 0.98, x: 10 }}
                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.98, x: -10 }}
                                transition={{ duration: 0.2 }}
                                className="h-full flex items-start justify-center pt-8"
                            >
                                <SocialFeedPreview 
                                    platform={previewPlatform}
                                    content={content}
                                />
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            <AiAssistantModal 
                isOpen={isAiModalOpen}
                onClose={() => setIsAiModalOpen(false)}
                onApply={(text) => setContent(text)}
            />
        </div>
    );
}
