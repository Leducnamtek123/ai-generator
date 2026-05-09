import { InspirationGallery } from '@/components/gallery/InspirationGallery';
import { CommunityMarketplacePanel } from '@/components/community/CommunityMarketplacePanel';

export default function CommunityPage() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="mx-auto max-w-[1800px] px-6 py-8">
                <div className="mb-10 space-y-6 text-center">
                    <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/30 px-4 py-2 text-xs font-medium text-muted-foreground">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        Marketplace live listings, publish drafts, and credit-based purchase flow
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground">
                        Community Marketplace
                    </p>
                    <h1 className="mx-auto max-w-4xl text-3xl font-semibold tracking-tight text-foreground md:text-5xl">
                        A production marketplace for templates, prompt packs, and reusable creative systems
                    </h1>
                    <p className="mx-auto max-w-3xl text-sm leading-6 text-muted-foreground md:text-base">
                        Publish a listing with a clear type, honest preview, and credit price. Buyers can
                        search, filter, purchase, and open the template immediately; creators keep the
                        workflow reusable and easy to sell.
                    </p>
                    <div className="mx-auto grid max-w-3xl gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl border border-border/70 bg-card/60 px-4 py-3 text-left">
                            <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
                                Browse
                            </p>
                            <p className="mt-2 text-sm font-medium text-foreground">
                                Search by type, title, creator, or prompt snippet.
                            </p>
                        </div>
                        <div className="rounded-2xl border border-border/70 bg-card/60 px-4 py-3 text-left">
                            <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
                                Publish
                            </p>
                            <p className="mt-2 text-sm font-medium text-foreground">
                                Create from scratch or save a draft before going live.
                            </p>
                        </div>
                        <div className="rounded-2xl border border-border/70 bg-card/60 px-4 py-3 text-left">
                            <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
                                Convert
                            </p>
                            <p className="mt-2 text-sm font-medium text-foreground">
                                Show price split and open the purchased template immediately.
                            </p>
                        </div>
                    </div>
                </div>

                <CommunityMarketplacePanel />

                <div className="pb-20 pt-16">
                    <div className="mb-6 flex items-end justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-semibold">Community spotlight</h2>
                            <p className="text-sm text-muted-foreground">
                                Use the inspiration feed for discovery while the marketplace handles the
                                credits flow and listing metadata.
                            </p>
                        </div>
                        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                            Browse only
                        </p>
                    </div>
                    <InspirationGallery />
                </div>
            </div>
        </div>
    );
}
