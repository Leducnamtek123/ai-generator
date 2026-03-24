import { Search, ArrowRight } from 'lucide-react';
import { Input } from '@/ui/input';

const CATEGORIES = [
    { title: 'Vectors', color: 'from-chart-1/20 to-chart-1/10' },
    { title: 'Photos', color: 'from-chart-2/20 to-chart-2/10' },
    { title: 'AI Images', color: 'from-chart-3/20 to-chart-3/10' },
    { title: 'Icons', color: 'from-chart-4/20 to-chart-4/10' },
    { title: 'Videos', color: 'from-chart-5/20 to-chart-5/10' },
    { title: 'PSD', color: 'from-chart-1/20 to-chart-1/10' },
    { title: '3D', color: 'from-chart-5/20 to-chart-5/10' },
    { title: 'Fonts', color: 'from-muted to-muted/50' },
];

const FEATURED_COLLECTIONS = [
    { id: '1', title: 'Summer Vibes', count: 120, image: 'https://images.unsplash.com/photo-1559827291-72ee739d0d9a?w=800&q=80' },
    { id: '2', title: 'Tech Startups', count: 85, image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&q=80' },
    { id: '3', title: 'Abstract 3D', count: 240, image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80' },
    { id: '4', title: 'Nature Textures', count: 95, image: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&q=80' },
];

export default function StockPage() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Search Hero */}
            <div className="relative h-[400px] w-full bg-gradient-to-b from-muted to-background border-b border-border flex flex-col items-center justify-center text-center px-4">
                <div className="max-w-2xl w-full space-y-6 z-10">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                        Free & Premium stock content made for creators
                    </h1>
                    <p className="text-lg text-muted-foreground">
                        Your all-in-one library of images, vectors, illustrations, videos, and more.
                    </p>

                    <div className="relative max-w-xl mx-auto w-full">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <Input
                            type="text"
                            className="w-full h-14 rounded-full pl-12 pr-4"
                            placeholder="Search assets or start creating..."
                        />
                    </div>
                </div>

                {/* Background decoration */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto px-6 py-12 space-y-16">
                {/* Categories */}
                <section>
                    <h2 className="text-lg font-semibold mb-6">Explore by category</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {CATEGORIES.map((cat) => (
                            <div key={cat.title} className={`h-24 rounded-xl relative overflow-hidden group cursor-pointer border border-border bg-gradient-to-br ${cat.color} opacity-80 hover:opacity-100 transition-opacity`}>
                                <div className="absolute inset-0 flex items-center justify-start p-6">
                                    <span className="font-semibold text-lg">{cat.title}</span>
                                </div>
                                <div className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0 duration-300">
                                    <ArrowRight className="w-5 h-5" />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Collections */}
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold">Curated collections</h2>
                        <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">Explore collections</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {FEATURED_COLLECTIONS.map((col) => (
                            <div key={col.id} className="group cursor-pointer space-y-3">
                                <div className="aspect-[4/3] rounded-xl overflow-hidden bg-muted relative">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={col.image} alt={col.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                                </div>
                                <div>
                                    <h3 className="font-medium group-hover:text-primary transition-colors">{col.title}</h3>
                                    <p className="text-xs text-muted-foreground">{col.count} assets</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
