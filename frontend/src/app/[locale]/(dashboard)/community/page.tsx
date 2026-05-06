import { InspirationGallery } from '@/components/gallery/InspirationGallery';
import { CommunityMarketplacePanel } from '@/components/community/CommunityMarketplacePanel';

export default function CommunityPage() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="mx-auto max-w-[1800px] px-6 py-8">
                <div className="mb-10 space-y-4 text-center">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                        Community Marketplace
                    </p>
                    <h1 className="text-3xl font-semibold text-foreground md:text-4xl">
                        A place to sell templates for credits and grow the creator loop
                    </h1>
                    <p className="mx-auto max-w-3xl text-sm text-muted-foreground md:text-base">
                        Upload a polished preview, price your prompt pack or workflow, and let other creators buy it with credits. Sellers earn, buyers save time, and the platform keeps the spread.
                    </p>
                </div>

                <CommunityMarketplacePanel />

                <div className="pb-20 pt-16">
                    <div className="mb-6">
                        <h2 className="text-xl font-semibold">Community spotlight</h2>
                        <p className="text-sm text-muted-foreground">
                            Keep the inspiration feed for browsing while the marketplace handles the credits flow.
                        </p>
                    </div>
                    <InspirationGallery />
                </div>
            </div>
        </div>
    );
}
