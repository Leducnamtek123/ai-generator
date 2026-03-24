import { InspirationGallery } from '@/components/gallery/InspirationGallery';
import { cn } from '@/lib/utils';

export default function CommunityPage() {
    const filters = ['All', 'Image', 'Video', 'Styles', 'Top Creators'];

    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="pt-8 px-6 max-w-[1800px] mx-auto">

                {/* Header */}
                <div className="text-center space-y-4 mb-12">
                    <h1 className="text-3xl font-semibold text-foreground">
                        Get inspired by hundreds of amazing community artists
                    </h1>

                    {/* Filters */}
                    <div className="flex justify-center gap-2 mt-6">
                        {filters.map((filter, i) => (
                            <button
                                key={filter}
                                className={cn(
                                    "px-4 py-2 rounded-full text-sm font-medium transition-all",
                                    i === 0
                                        ? "bg-foreground text-background"
                                        : "bg-muted text-muted-foreground border border-border hover:border-muted-foreground/50"
                                )}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Gallery */}
                <div className="pb-20">
                    <InspirationGallery />
                </div>
            </div>
        </div>
    );
}
