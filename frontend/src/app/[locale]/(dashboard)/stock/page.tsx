'use client';

import { useState, FormEvent } from 'react';
import { Search, ArrowRight, Download, Heart, Loader2 } from 'lucide-react';
import { Input } from '@/ui/input';
import { Button } from '@/ui/button';
import { toast } from 'sonner';

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
    const [query, setQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [results, setResults] = useState<any[]>([]);
    const [hasSearched, setHasSearched] = useState(false);

    const handleSearch = async (e?: FormEvent) => {
        if (e) e.preventDefault();
        if (!query.trim()) return;

        setIsSearching(true);
        setHasSearched(true);
        
        try {
            // Mocking a stock API search using Unsplash image IDs for realistic demo
            await new Promise(r => setTimeout(r, 1500));
            
            // Generate some random visually distinct image URLs based on the query length/chars
            const mockIds = [
                '1470071459604-3b5ec3a7fe05', '1618005182384-a83a8bd57fbe',
                '1519389950473-47ba0277781c', '1559827291-72ee739d0d9a',
                '1542204165-65bf26472b9b', '1498050108023-c5249f4df085',
                '1461696114044-204f31d600b9', '1506744626753-1fa76011a681'
            ].sort(() => Math.random() - 0.5);

            const newResults = mockIds.map(id => ({
                id,
                url: `https://images.unsplash.com/photo-${id}?w=800&q=80`,
                title: `${query} image ${Math.floor(Math.random() * 100)}`,
                author: 'Creator ' + Math.floor(Math.random() * 100),
            }));

            setResults(newResults);
        } catch (error) {
            toast.error('Failed to search stock library');
        } finally {
            setIsSearching(false);
        }
    };

    const handleDownload = (url: string) => {
        toast.info('Starting download...');
        window.open(url, '_blank');
    };

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Search Hero */}
            <div className={`relative w-full bg-gradient-to-b from-muted to-background border-b border-border flex flex-col items-center justify-center text-center px-4 transition-all duration-500 ${hasSearched ? 'h-[250px]' : 'h-[400px]'}`}>
                <div className="max-w-2xl w-full space-y-6 z-10 transition-all">
                    {!hasSearched && (
                        <>
                            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                                Free & Premium stock content made for creators
                            </h1>
                            <p className="text-lg text-muted-foreground">
                                Your all-in-one library of images, vectors, illustrations, videos, and more.
                            </p>
                        </>
                    )}

                    <form onSubmit={handleSearch} className="relative max-w-xl mx-auto w-full group">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-foreground transition-colors" />
                        </div>
                        <Input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="w-full h-14 rounded-full pl-12 pr-32 text-lg bg-background/50 backdrop-blur-sm"
                            placeholder="Search assets or start creating..."
                        />
                        <div className="absolute inset-y-2 right-2 flex items-center">
                            <Button 
                                type="submit" 
                                className="h-full rounded-full px-6" 
                                disabled={isSearching || !query.trim()}
                            >
                                {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
                            </Button>
                        </div>
                    </form>
                </div>

                {/* Background decoration */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto px-6 py-12 space-y-16">
                {hasSearched ? (
                    /* Search Results */
                    <section>
                        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
                            <h2 className="text-2xl font-semibold">Results for &quot;{query}&quot;</h2>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm">Images</Button>
                                <Button variant="ghost" size="sm">Videos</Button>
                                <Button variant="ghost" size="sm">Audio</Button>
                            </div>
                        </div>

                        {isSearching ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                    <div key={i} className="aspect-[4/3] bg-muted animate-pulse rounded-xl" />
                                ))}
                            </div>
                        ) : results.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {results.map((res) => (
                                    <div key={res.id} className="group relative aspect-[4/3] rounded-xl overflow-hidden bg-muted cursor-pointer shadow-sm hover:shadow-xl transition-all">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={res.url} alt={res.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        
                                        {/* Overlay gradient */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        
                                        {/* Actions */}
                                        <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-y-[-10px] group-hover:translate-y-0 duration-300">
                                            <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full bg-white/20 backdrop-blur-md hover:bg-white text-white hover:text-black transition-colors" onClick={(e) => { e.stopPropagation(); toast.success('Saved to collection'); }}>
                                                <Heart className="w-4 h-4" />
                                            </Button>
                                        </div>

                                        <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity translate-y-[10px] group-hover:translate-y-0 duration-300 flex items-end justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-white truncate max-w-[150px]">{res.title}</p>
                                                <p className="text-xs text-white/70">by {res.author}</p>
                                            </div>
                                            <Button size="icon" className="h-8 w-8 rounded-full bg-primary hover:bg-primary text-primary-foreground" onClick={(e) => { e.stopPropagation(); handleDownload(res.url); }}>
                                                <Download className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 text-muted-foreground">
                                No results found for &quot;{query}&quot;. Try another keyword.
                            </div>
                        )}
                    </section>
                ) : (
                    <>
                        {/* Categories */}
                        <section>
                            <h2 className="text-lg font-semibold mb-6">Explore by category</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {CATEGORIES.map((cat) => (
                                    <div key={cat.title} onClick={() => { setQuery(cat.title); handleSearch(); }} className={`h-24 rounded-xl relative overflow-hidden group cursor-pointer border border-border bg-gradient-to-br ${cat.color} opacity-80 hover:opacity-100 transition-opacity`}>
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
                                    <div key={col.id} onClick={() => { setQuery(col.title); handleSearch(); }} className="group cursor-pointer space-y-3">
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
                    </>
                )}
            </div>
        </div>
    );
}
