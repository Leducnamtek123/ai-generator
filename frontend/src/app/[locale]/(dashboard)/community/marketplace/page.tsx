import { CommunityMarketplacePanel } from '@/components/community/CommunityMarketplacePanel';

export default function CommunityMarketplacePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-[1800px] px-6 py-8">
        <div className="mb-8 max-w-4xl space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-5xl">
              Browse the live marketplace without the publishing controls in the way
            </h1>
        </div>

        <CommunityMarketplacePanel />
      </div>
    </div>
  );
}
