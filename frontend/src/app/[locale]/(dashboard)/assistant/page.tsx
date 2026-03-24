import { Button } from '@/ui/button';
import { Sparkles, Image as ImageIcon, Plus } from 'lucide-react';

const templates = [
    { label: 'Product Photography' },
    { label: 'Character Design' },
    { label: 'Video Prompts' },
    { label: 'Sora 2 Styles' },
];

export default function AssistantPage() {
    return (
        <div className="h-full flex flex-col items-center justify-center -mt-20">
            {/* Center Content */}
            <div className="max-w-3xl w-full px-6 text-center space-y-8">

                <div className="space-y-2">
                    <h2 className="text-xl font-medium text-muted-foreground">Good night,</h2>
                    <h1 className="text-4xl font-semibold text-foreground tracking-tight">What do you want to create?</h1>
                </div>

                {/* Main Input */}
                <div className="relative group">
                    <div className="relative bg-card border border-border rounded-2xl p-4 shadow-lg transition-all focus-within:border-ring">
                        <textarea
                            placeholder="Describe your creation..."
                            className="w-full bg-transparent border-none outline-none text-lg text-foreground placeholder:text-muted-foreground/50 min-h-[80px] resize-none"
                        />

                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                            <div className="flex gap-2">
                                <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground hover:text-foreground">
                                    <Plus className="w-4 h-4 mr-1.5" />
                                    Add Reference
                                </Button>
                                <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground hover:text-foreground">
                                    <ImageIcon className="w-4 h-4 mr-1.5" />
                                    Templates
                                </Button>
                            </div>
                            <Button size="icon" className="h-8 w-8 rounded-full">
                                <Sparkles className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Quick Templates */}
                <div className="pt-8">
                    <div className="flex items-center justify-center gap-2 mb-6">
                        <span className="text-sm font-medium text-muted-foreground">Explore templates</span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {templates.map((t) => (
                            <div key={t.label} className="h-24 rounded-xl relative overflow-hidden group cursor-pointer border border-border bg-card hover:bg-accent transition-colors">
                                <div className="absolute bottom-3 left-3 right-3">
                                    <span className="text-xs font-semibold text-foreground/90 block leading-tight">{t.label}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
