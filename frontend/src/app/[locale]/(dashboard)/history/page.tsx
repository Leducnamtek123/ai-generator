import { Search, FolderPlus, Film, LayoutGrid } from 'lucide-react';
import { Button } from '@/ui/button';

export default function HistoryPage() {
    return (
        <div className="min-h-screen bg-[#0B0C0E] text-white">
            <div className="max-w-[1600px] mx-auto px-6 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <h1 className="text-2xl font-semibold">History</h1>
                        <Button variant="outline" size="sm" className="h-8 border-white/10 bg-transparent text-white hover:bg-white/5 font-normal">
                            <FolderPlus className="w-4 h-4 mr-2" />
                            Create a folder
                        </Button>
                    </div>

                    <div className="flex items-center bg-[#151619] border border-white/10 rounded-lg p-1">
                        <Button variant="ghost" size="sm" className="h-7 text-xs bg-[#2C2D31] text-white shadow-sm">All</Button>
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-white/50 hover:text-white">Likes</Button>
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-white/50 hover:text-white">Archives</Button>
                    </div>
                </div>

                {/* Content List */}
                <div className="space-y-12">
                    {/* Section: Today */}
                    <section>
                        <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                            <span className="text-sm font-medium text-white/60">Today</span>
                        </div>

                        <div className="space-y-3">
                            {[1, 2].map((i) => (
                                <HistoryItem key={i} title={`Untitled Studio ${i}`} type="Studio" time="2h ago" />
                            ))}
                        </div>
                    </section>

                    {/* Section: This Week */}
                    <section>
                        <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-2">
                            <div className="w-2 h-2 rounded-full bg-purple-500" />
                            <span className="text-sm font-medium text-white/60">This week</span>
                        </div>

                        <div className="space-y-3">
                            {[3, 4, 5].map((i) => (
                                <HistoryItem key={i} title={`Project Alpha ${i}`} type="Video" time="2 days ago" />
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}

function HistoryItem({ title, type, time }: { title: string, type: string, time: string }) {
    return (
        <div className="h-24 bg-[#151619] hover:bg-[#1A1B1F] border border-white/5 hover:border-white/10 rounded-xl flex items-center p-4 gap-6 group cursor-pointer transition-all">
            {/* Thumbnail Placeholder */}
            <div className="w-32 h-full rounded-lg bg-[#222] flex items-center justify-center text-white/20">
                {type === 'Studio' ? <LayoutGrid className="w-6 h-6" /> : <Film className="w-6 h-6" />}
            </div>

            <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] uppercase font-bold text-white/40 tracking-wider border border-white/10 px-1.5 py-0.5 rounded">{type}</span>
                </div>
                <h3 className="text-base font-medium text-white group-hover:text-blue-400 transition-colors">{title}</h3>
                <p className="text-xs text-white/40 mt-1">Edited {time}</p>
            </div>

            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full p-0 text-white/40 hover:text-white hover:bg-white/10">...</Button>
            </div>
        </div>
    );
}
