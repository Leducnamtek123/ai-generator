import { Search, Image as ImageIcon, Video, Sparkles, LayoutGrid, Wand2, Music, Box } from 'lucide-react';
import { Button } from '@/ui/button';
import { MasonryGrid } from '@/components/gallery/MasonryGrid';
import { ToolCard } from '@/components/dashboard/ToolCard';
import { mockGalleryItems } from '@/lib/mock-data';

export default function DashboardPage() {
    return (
        <div className="min-h-screen bg-[#0B0C0E] text-white">
            {/* Hero / Search Section */}
            <section className="pt-8 pb-12 px-8 max-w-[1600px] mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-2xl font-semibold animate-in fade-in duration-500">What would you like to create today?</h1>
                    <Button variant="ghost" size="sm" className="text-white/40 hover:text-white">All tools</Button>
                </div>

                {/* Main Tools Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-12 animate-in fade-in duration-700">
                    <ToolCard icon={Search} label="Find assets" href="/stock" />
                    <ToolCard icon={LayoutGrid} label="Spaces" href="/workflow" isNew color="text-blue-400" />
                    <ToolCard icon={ImageIcon} label="Image Gen" href="/studio" color="text-purple-400" />
                    <ToolCard icon={Video} label="Video Gen" href="/video" color="text-red-400" />
                    <ToolCard icon={Wand2} label="Editor" href="/editor" />
                    <ToolCard icon={Sparkles} label="Upscaler" href="/upscale" color="text-green-400" />
                    <ToolCard icon={Box} label="3D Models" href="/stock" />
                    <ToolCard icon={Music} label="Audio" href="/audio" />
                </div>

                {/* Recent Creations (Mock) */}
                <div className="mb-16 animate-in fade-in duration-700">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-semibold text-white/90">Recent creations</h2>
                        <Button variant="ghost" size="sm" className="text-[10px] text-white/40 hover:text-white">View project &gt;</Button>
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="min-w-[200px] h-[140px] bg-[#151619] rounded-xl border border-white/5 flex flex-col justify-end p-4 relative group cursor-pointer hover:border-white/10 transition-colors">
                                <div className="absolute inset-0 flex items-center justify-center opacity-30 group-hover:opacity-50 transition-opacity">
                                    <LayoutGrid className="w-8 h-8" />
                                </div>
                                <div className="relative z-10">
                                    <div className="text-xs font-medium text-white">Untitled Space</div>
                                    <div className="text-[10px] text-white/40">Today</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Inspiration Gallery */}
                <div className="animate-in fade-in duration-1000">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold">Get Inspired</h2>
                        <div className="flex gap-2">
                            {['Templates', 'Community', 'Tutorials'].map(tag => (
                                <button key={tag} className="px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-xs text-white/70 hover:bg-white/10 hover:text-white transition-colors">
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>

                    <MasonryGrid items={mockGalleryItems} />
                </div>
            </section>
        </div>
    );
}
