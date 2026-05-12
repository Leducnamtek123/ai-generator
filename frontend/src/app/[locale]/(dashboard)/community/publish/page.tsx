import { CommunityPublishPanel } from '@/components/community/CommunityPublishPanel';

export default function CommunityPublishPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-[1800px] px-6 py-8">
        <div className="mb-8 max-w-4xl space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-5xl">
              Put the publishing flow on its own page
            </h1>
        </div>

        <CommunityPublishPanel />
      </div>
    </div>
  );
}
