import { CommunityMyListingsPanel } from '@/components/community/CommunityMyListingsPanel';

export default function CommunityMyListingsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-[1800px] px-6 py-8">
        <div className="mb-8 max-w-4xl space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-5xl">
              Keep your own listings separate from the browse surface
            </h1>
        </div>

        <CommunityMyListingsPanel />
      </div>
    </div>
  );
}
