import { Button } from '@/ui/button';
import { Sparkles, MessageSquare, Image as ImageIcon, Plus } from 'lucide-react';

export default function AssistantPage() {
    return (
        <div className="h-full flex flex-col items-center justify-center -mt-20">
            {/* Center Content */}
            <div className="max-w-3xl w-full px-6 text-center space-y-8">

                <div className="space-y-2">
                    <h2 className="text-xl font-medium text-white/60">Good night,</h2>
                    <h1 className="text-4xl font-semibold text-white tracking-tight">What do you want to create?</h1>
                </div>

                {/* Main Input */}
                <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative bg-[#151619] border border-white/10 rounded-2xl p-4 shadow-2xl transition-all focus-within:border-white/20">
                        <textarea
                            placeholder="Describe your creation..."
                            className="w-full bg-transparent border-none outline-none text-lg text-white placeholder:text-white/20 min-h-[80px] resize-none"
                        />

                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                            <div className="flex gap-2">
                                <Button variant="ghost" size="sm" className="h-8 px-2 text-white/40 hover:text-white">
                                    <Plus className="w-4 h-4 mr-1.5" />
                                    Add Reference
                                </Button>
                                <Button variant="ghost" size="sm" className="h-8 px-2 text-white/40 hover:text-white">
                                    <ImageIcon className="w-4 h-4 mr-1.5" />
                                    Templates
                                </Button>
                            </div>
                            <Button size="icon" className="h-8 w-8 rounded-full bg-white text-black hover:bg-white/90">
                                <Sparkles className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Quick Templates */}
                <div className="pt-8">
                    <div className="flex items-center justify-center gap-2 mb-6">
                        <span className="text-sm font-medium text-white/40">Explore templates</span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: 'Product Photography', color: 'from-orange-500 to-red-500' },
                            { label: 'Character Design', color: 'from-blue-500 to-cyan-500' },
                            { label: 'Video Prompts', color: 'from-purple-500 to-pink-500' },
                            { label: 'Sora 2 Styles', color: 'from-amber-500 to-yellow-500' },
                        ].map((t) => (
                            <div key={t.label} className="h-24 rounded-xl relative overflow-hidden group cursor-pointer border border-white/5 bg-[#1A1B1F] hover:bg-[#222]">
                                {/* Background Gradient */}
                                <div className={`absolute inset-0 bg-gradient-to-br ${t.color} opacity-10 group-hover:opacity-20 transition-opacity`} />

                                <div className="absolute bottom-3 left-3 right-3">
                                    <span className="text-xs font-semibold text-white/90 block leading-tight">{t.label}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
