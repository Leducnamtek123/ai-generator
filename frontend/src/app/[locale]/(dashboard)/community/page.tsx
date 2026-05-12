import { InspirationGallery } from '@/components/gallery/InspirationGallery';

export default function CommunityPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-[1800px] px-4 py-4 md:px-6 md:py-5">
        <div className="mb-4 flex justify-center">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-[-0.05em] text-foreground md:text-4xl">
              Get inspired by the community
            </h1>
          </div>
        </div>

        <InspirationGallery />
      </div>
    </div>
  );
}
