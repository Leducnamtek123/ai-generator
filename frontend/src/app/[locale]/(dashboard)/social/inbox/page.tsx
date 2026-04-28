'use client';

import React from 'react';
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
import { motion, AnimatePresence } from 'framer-motion';
import { useSocialSocket } from '@/providers/SocketProvider';
import { cn } from '@/lib/utils';
import { socialHubApi, type SocialInteraction } from '@/services/socialHubApi';

export default function InboxPage() {
    const [interactions, setInteractions] = React.useState<SocialInteraction[]>([]);
    const [selectedId, setSelectedId] = React.useState<number | string | null>(null);

    const { socket } = useSocialSocket();

    React.useEffect(() => {
        const fetchInbox = async () => {
            try {
                const data = await socialHubApi.getInbox();
                setInteractions(data);
                if (data.length > 0) setSelectedId(data[0].id);
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
            setInteractions(prev => [
                {
                    id: `new_${Date.now()}`,
                    platform: newInteraction.platform,
                    type: newInteraction.type || 'mention',
                    user: newInteraction.user || 'Live User',
                    content: newInteraction.content || 'New interaction received',
                    time: newInteraction.time || 'Just now',
                    isNew: true
                },
                ...prev
            ]);
        });

        return () => {
            socket.off('interaction:created');
        };
    }, [socket]);

    const selectedInteraction = interactions.find(i => i.id === selectedId);

    return (
        <div className="flex h-full overflow-hidden">
            {/* Sidebar / List Pane */}
            <div className="w-[450px] border-r border-border bg-sidebar flex flex-col h-full">
                <div className="p-6 border-b border-border space-y-4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold">Social Inbox</h1>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><Filter className="w-4 h-4" /></Button>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input 
                            className="w-full bg-muted/50 border-none rounded-lg py-2 pl-10 pr-4 text-sm focus:ring-1 focus:ring-primary"
                            placeholder="Search interactions..."
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-auto bg-sidebar p-4">
                    <div className="space-y-4">
                        <AnimatePresence initial={false}>
                            {interactions.map((item) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, x: -20, height: 0 }}
                                    animate={{ opacity: 1, x: 0, height: 'auto' }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    onClick={() => setSelectedId(item.id)}
                                    className={cn(
                                        "p-6 cursor-pointer border transition-all hover:bg-muted/30 relative rounded-xl",
                                        selectedId === item.id ? "bg-primary/5 border-primary" : "border-border"
                                    )}
                                >
                                    {item.isNew && (
                                        <span className="absolute -top-1 -right-1 bg-primary text-[10px] px-1.5 py-0.5 rounded-full text-white font-bold animate-pulse">
                                            LIVE
                                        </span>
                                    )}
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                                <User className="w-4 h-4 text-muted-foreground" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold">{item.user}</h4>
                                                <div className="flex items-center gap-1.5">
                                                    {item.platform === 'facebook' && <Facebook className="w-3 h-3 text-[#1877F2]" />}
                                                    {item.platform === 'twitter' && <Twitter className="w-3 h-3 text-foreground" />}
                                                    {item.platform === 'linkedin' && <Linkedin className="w-3 h-3 text-[#0A66C2]" />}
                                                    <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-tighter">{item.type}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <span className="text-[10px] text-muted-foreground font-medium">{item.time}</span>
                                    </div>
                                    <p className="text-sm line-clamp-2 text-muted-foreground font-medium">
                                        {item.content}
                                    </p>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Content Pane */}
            <div className="flex-1 flex flex-col bg-background/50 relative">
                <AnimatePresence mode="wait">
                    {selectedInteraction ? (
                        <motion.div 
                            key={selectedInteraction.id}
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="flex-1 flex flex-col h-full"
                        >
                            {/* Header */}
                            <div className="p-6 border-b border-border bg-white/[0.02] flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <h3 className="text-lg font-bold">Conversation with {selectedInteraction.user}</h3>
                                    <Button variant="outline" size="sm" className="h-7 text-[10px] uppercase font-bold tracking-wider">
                                        View on {selectedInteraction.platform}
                                        <ArrowUpRight className="w-3 h-3 ml-1.5" />
                                    </Button>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="icon" className="h-9 w-9 text-green-500"><CheckCircle className="w-5 h-5" /></Button>
                                    <Button variant="ghost" size="icon" className="h-9 w-9"><MoreHorizontal className="w-5 h-5" /></Button>
                                </div>
                            </div>

                            {/* Message Area */}
                            <div className="flex-1 p-8 overflow-auto space-y-6">
                                <div className="flex gap-4 max-w-2xl">
                                    <div className="w-10 h-10 rounded-full bg-muted shrink-0" />
                                    <GlassCard variant="morphism" className="border border-white/5 bg-white/5 p-6 rounded-2xl rounded-tl-none">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-bold text-sm">{selectedInteraction.user}</span>
                                            <span className="text-[10px] text-muted-foreground">{selectedInteraction.time}</span>
                                        </div>
                                        <p className="text-sm leading-relaxed">{selectedInteraction.content}</p>
                                    </GlassCard>
                                </div>

                                <div className="flex gap-4 max-w-2xl ml-auto flex-row-reverse">
                                    <div className="w-10 h-10 rounded-full bg-primary/20 shrink-0" />
                                    <div className="bg-primary text-primary-foreground p-6 rounded-2xl rounded-tr-none shadow-lg shadow-primary/20">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-bold text-sm">PaintAI Assistant</span>
                                            <span className="text-[10px] opacity-70">Just now</span>
                                        </div>
                                        <p className="text-sm leading-relaxed italic opacity-80">Replying as AI...</p>
                                    </div>
                                </div>
                            </div>

                            {/* Input Area */}
                            <div className="p-6 border-t border-border bg-white/[0.02]">
                                <GlassCard variant="morphism" className="p-4 border border-white/10 flex flex-col gap-4">
                                    <textarea 
                                        className="w-full bg-transparent border-none focus:ring-0 text-sm resize-none min-h-[100px]"
                                        placeholder={`Reply to ${selectedInteraction.user}...`}
                                    />
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1">
                                            <Button variant="ghost" size="icon" className="h-8 w-8"><Plus className="w-4 h-4" /></Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8"><Smile className="w-4 h-4" /></Button>
                                        </div>
                                        <Button size="sm">
                                            <Reply className="w-4 h-4 mr-2" />
                                            Send Response
                                        </Button>
                                    </div>
                                </GlassCard>
                            </div>
                        </motion.div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center overflow-hidden relative">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="relative z-10 flex flex-col items-center"
                            >
                                <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center mb-6 relative">
                                    <MessageSquare className="w-12 h-12 text-primary" />
                                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-background border-2 border-primary flex items-center justify-center animate-bounce">
                                         <Plus className="w-4 h-4 text-primary" />
                                    </div>
                                </div>
                                <h3 className="text-2xl font-bold mb-2">Select a Conversation</h3>
                                <p className="text-muted-foreground max-w-sm text-sm">
                                    Click on an interaction from the sidebar to view the conversation details and reply across all your social channels.
                                </p>
                            </motion.div>
                            
                            {/* Decorative background blur */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
