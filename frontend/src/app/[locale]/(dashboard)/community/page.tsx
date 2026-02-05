import { MasonryGrid } from '@/components/gallery/MasonryGrid';
import { mockGalleryItems } from '@/lib/mock-data';
import { Search, Filter } from 'lucide-react';

export default function CommunityPage() {
    return (
        <div className="min-h-screen bg-[#0B0C0E] text-white">
            <div className="pt-8 px-6 max-w-[1800px] mx-auto">

                {/* Header */}
                <div className="text-center space-y-4 mb-12">
                    <h1 className="text-3xl font-semibold bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
                        Get inspired by hundreds of amazing community artists
                    </h1>

                    {/* Filters */}
                    <div className="flex justify-center gap-2 mt-6">
                        {['All', 'Image', 'Video', 'Styles', 'Top Creators'].map((filter, i) => (
                            <button
                                key={filter}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${i === 0 ? 'bg-white text-black' : 'bg-[#1A1B1F] text-white border border-white/10 hover:border-white/30'}`}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Gallery */}
                <MasonryGrid items={[...mockGalleryItems, ...mockGalleryItems]} className="pb-20" />
            </div>
        </div>
    );
}
