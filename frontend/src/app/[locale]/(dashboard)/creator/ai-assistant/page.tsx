'use client';

import { useState, useRef, useEffect } from 'react';
import { useGenerationStore } from '@/stores/generation-store';
import {
    Sparkles,
    Image as ImageIcon,
    Plus,
    Send,
    Bot,
    User,
    Loader2,
    Download,
    Copy,
    RefreshCcw,
    Paperclip,
    Video,
    Music,
    Palette,
    Wand2,
    MessageSquare,
    ThumbsUp,
    ThumbsDown
} from 'lucide-react';
import { Button } from '@/ui/button';
import { cn } from '@/lib/utils';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    attachments?: { type: 'image' | 'video'; url: string }[];
    generatedImages?: string[];
}

const quickActions = [
    { id: 'image', icon: ImageIcon, label: 'Generate Image', color: 'text-blue-400' },
    { id: 'video', icon: Video, label: 'Generate Video', color: 'text-purple-400' },
    { id: 'music', icon: Music, label: 'Create Music', color: 'text-green-400' },
    { id: 'design', icon: Palette, label: 'Design', color: 'text-orange-400' },
    { id: 'edit', icon: Wand2, label: 'Edit Image', color: 'text-pink-400' },
];

const templates = [
    { label: 'Product Photography', prompt: 'Create a professional product photo of a sleek smartwatch on a marble surface with soft studio lighting' },
    { label: 'Character Design', prompt: 'Design a futuristic cyberpunk character with neon accents, detailed armor, and a confident pose' },
    { label: 'Video Prompts', prompt: 'Generate a cinematic video of a sunrise over mountain peaks with fog rolling through the valleys' },
    { label: 'Logo Design', prompt: 'Create a minimalist logo for a tech startup called "NovaByte" using geometric shapes' },
    { label: 'Social Media', prompt: 'Design an eye-catching Instagram post for a summer fashion collection' },
    { label: 'Illustration', prompt: 'Create a whimsical children\'s book illustration of a friendly dragon in a flower garden' },
];

const mockConversation: Message[] = [];

export default function AssistantPage() {
    const [messages, setMessages] = useState<Message[]>(mockConversation);
    const [input, setInput] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedAction, setSelectedAction] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const { startGeneration } = useGenerationStore();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() && !selectedAction) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMsg]);
        setInput('');
        setSelectedAction(null);
        setIsGenerating(true);

        // Call API for generation
        await startGeneration('/generations/image', { prompt: input });

        const assistantMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: `I've processed your request: "${userMsg.content}". Here's what I generated for you. You can download, copy, or request modifications.`,
            timestamp: new Date(),
            generatedImages: [
                'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=500&fit=crop',
                'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=500&fit=crop',
            ],
        };

        setMessages((prev) => [...prev, assistantMsg]);
        setIsGenerating(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const isEmpty = messages.length === 0;

    return (
        <div className="h-full flex flex-col bg-background text-foreground overflow-hidden">
            {isEmpty ? (
                /* Empty State - Welcome Screen */
                <div className="flex-1 flex flex-col items-center justify-center -mt-10 px-6">
                    <div className="max-w-3xl w-full text-center space-y-8">
                        <div className="space-y-3">
                            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                                <Sparkles className="w-8 h-8 text-primary" />
                            </div>
                            <h1 className="text-4xl font-semibold text-foreground tracking-tight">
                                What do you want to create?
                            </h1>
                            <p className="text-muted-foreground text-lg">
                                I can generate images, videos, music, and more. Just describe what you need.
                            </p>
                        </div>

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
                                    <action.icon className={cn("w-4 h-4", action.color)} />
                                    {action.label}
                                </button>
                            ))}
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
                                        <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground hover:text-foreground">
                                            <Paperclip className="w-4 h-4 mr-1.5" />
                                            Attach
                                        </Button>
                                        <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground hover:text-foreground">
                                            <ImageIcon className="w-4 h-4 mr-1.5" />
                                            Templates
                                        </Button>
                                    </div>
                                    <Button
                                        size="icon"
                                        className="h-9 w-9 rounded-full"
                                        onClick={handleSend}
                                        disabled={!input.trim()}
                                    >
                                        <Send className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Templates */}
                        <div className="pt-4">
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
                            {messages.map((msg) => (
                                <div key={msg.id} className={cn("flex gap-3", msg.role === 'user' ? 'justify-end' : '')}>
                                    {msg.role === 'assistant' && (
                                        <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-1">
                                            <Bot className="w-4 h-4 text-primary" />
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
                                                    <div key={i} className="group relative rounded-xl overflow-hidden border border-border">
                                                        <img src={url} alt={`Generated ${i + 1}`} className="w-full aspect-square object-cover" />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                            <Button size="icon" variant="secondary" className="w-8 h-8"><Download className="w-4 h-4" /></Button>
                                                            <Button size="icon" variant="secondary" className="w-8 h-8"><Copy className="w-4 h-4" /></Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {msg.role === 'assistant' && (
                                            <div className="flex items-center gap-1 pt-1">
                                                <Button variant="ghost" size="icon" className="w-7 h-7 text-muted-foreground"><ThumbsUp className="w-3.5 h-3.5" /></Button>
                                                <Button variant="ghost" size="icon" className="w-7 h-7 text-muted-foreground"><ThumbsDown className="w-3.5 h-3.5" /></Button>
                                                <Button variant="ghost" size="icon" className="w-7 h-7 text-muted-foreground"><Copy className="w-3.5 h-3.5" /></Button>
                                                <Button variant="ghost" size="icon" className="w-7 h-7 text-muted-foreground"><RefreshCcw className="w-3.5 h-3.5" /></Button>
                                            </div>
                                        )}
                                    </div>
                                    {msg.role === 'user' && (
                                        <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shrink-0 mt-1">
                                            <User className="w-4 h-4 text-muted-foreground" />
                                        </div>
                                    )}
                                </div>
                            ))}
                            {isGenerating && (
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                                        <Bot className="w-4 h-4 text-primary" />
                                    </div>
                                    <div className="px-4 py-3 bg-card border border-border rounded-2xl rounded-tl-md">
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
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
                                        <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground"><Paperclip className="w-4 h-4" /></Button>
                                        <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground"><ImageIcon className="w-4 h-4" /></Button>
                                    </div>
                                    <Button size="icon" className="h-8 w-8 rounded-full" onClick={handleSend} disabled={!input.trim() || isGenerating}>
                                        <Send className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
