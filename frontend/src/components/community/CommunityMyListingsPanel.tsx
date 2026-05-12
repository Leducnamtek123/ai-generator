'use client';

import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { BadgeCheck, BookOpen, Tag } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { communityMarketplaceApi, type CommunityMarketplaceListing } from '@/services/communityMarketplaceApi';
import { ListingSummarySkeletonList } from '@/components/common/loading-skeletons';
import { Link } from '@/i18n/navigation';

const getCreatorName = (listing: CommunityMarketplaceListing) => {
  const parts = [listing.author?.firstName, listing.author?.lastName].filter(
    (part): part is string => Boolean(part && part.trim()),
  );

  return parts.join(' ').trim() || listing.author?.email || 'Creator';
};

function ListingThumb({ listing }: { listing: CommunityMarketplaceListing }) {
  return (
    <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-gradient-to-br from-zinc-950 via-zinc-950 to-zinc-900">
      {listing.thumbnail ? (
        <Image src={listing.thumbnail} alt={listing.title} fill unoptimized className="object-cover" />
      ) : (
        <div className="flex h-full items-end p-4">
          <p className="max-w-[90%] text-sm leading-relaxed text-foreground/80">
            Add a cover image to make the listing easier to scan.
          </p>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
      <div className="absolute left-3 top-3 rounded-full bg-background/80 px-3 py-1 text-[11px] font-semibold text-foreground backdrop-blur-sm">
        {listing.marketplace.priceCredits} credits
      </div>
      <div className="absolute right-3 top-3 rounded-full bg-background/90 px-3 py-1 text-[11px] font-medium text-foreground backdrop-blur-sm">
        {listing.marketplace.listed ? 'Live' : 'Draft'}
      </div>
    </div>
  );
}

export function CommunityMyListingsPanel() {
  const myListingsQuery = useQuery({
    queryKey: ['community-marketplace-mine'],
    queryFn: () => communityMarketplaceApi.getMyListings({ limit: 24 }),
    select: (page) => page.data,
  });

  const listings = myListingsQuery.data ?? [];

  return (
    <Card className="border-border/70 bg-card/95">
      <CardHeader className="gap-4 border-b border-border/70 pb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-xl">My listings</CardTitle>
            <CardDescription>
              Review your drafts and live listings without scrolling through the full marketplace.
            </CardDescription>
          </div>
          <div className="rounded-full border border-border/70 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            {listings.length} items
          </div>
        </div>
      </CardHeader>

          <CardContent className="pt-6">
            {myListingsQuery.isLoading ? (
          <ListingSummarySkeletonList count={4} />
        ) : myListingsQuery.isError ? (
          <div className="flex h-52 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-destructive/40 bg-destructive/5 px-6 text-center">
            <p className="font-medium text-foreground">Failed to load your listings</p>
            <p className="text-sm text-muted-foreground">
              Try again in a moment or open the marketplace page.
            </p>
            <Button variant="outline" size="sm" onClick={() => myListingsQuery.refetch()}>
              Retry
            </Button>
          </div>
        ) : listings.length === 0 ? (
          <div className="flex h-52 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/70 bg-muted/20 px-6 text-center">
            <BookOpen className="size-9 text-muted-foreground" />
            <div className="space-y-1">
              <p className="font-medium text-foreground">No listings yet</p>
              <p className="text-sm text-muted-foreground">
                Publish your first template, then it will appear here.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {listings.map((listing) => (
              <div
                key={listing.id}
                className="overflow-hidden rounded-2xl border border-border/70 bg-background/60"
              >
                <ListingThumb listing={listing} />
                <div className="space-y-3 p-4">
                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-semibold leading-tight text-foreground">{listing.title}</h3>
                      <span className="rounded-full border border-border/70 bg-muted/30 px-2 py-1 text-[11px] text-muted-foreground">
                        {listing.marketplace.listed ? 'Live' : 'Draft'}
                      </span>
                    </div>
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {listing.description?.trim() || 'No description yet.'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <BadgeCheck className="size-3.5 text-primary" />
                      {getCreatorName(listing)}
                    </span>
                    <span>{listing.usageCount} uses</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {listing.marketplace.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[11px] text-muted-foreground"
                      >
                        <Tag className="size-3" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-between gap-3 border-t border-border/70 pt-6">
        <p className="text-sm text-muted-foreground">
          Use this page to review live vs draft status before editing.
        </p>
        <Button asChild variant="outline" size="sm">
          <Link href="/community/marketplace">Open marketplace</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
