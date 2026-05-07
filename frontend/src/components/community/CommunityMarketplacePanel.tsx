'use client';

import React from 'react';
import Image from 'next/image';
import axios from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  CreditCard,
  Loader2,
  Search,
  Sparkles,
  Tag,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useCreditStore } from '@/stores/credit-store';
import { TemplateTypeEnum } from '@/lib/api/templates';
import {
  communityMarketplaceApi,
  type CommunityMarketplaceListing,
  type CreateListingPayload,
} from '@/services/communityMarketplaceApi';

const TEMPLATE_TYPES = [
  { value: 'all', label: 'All' },
  { value: TemplateTypeEnum.IMAGE_GENERATOR, label: 'Image' },
  { value: TemplateTypeEnum.VIDEO_GENERATOR, label: 'Video' },
  { value: TemplateTypeEnum.WORKFLOW_EDITOR, label: 'Workflow' },
  { value: TemplateTypeEnum.MUSIC_GENERATOR, label: 'Music' },
  { value: TemplateTypeEnum.VOICE_GENERATOR, label: 'Voice' },
  { value: TemplateTypeEnum.AI_ASSISTANT, label: 'Assistant' },
  { value: TemplateTypeEnum.DESIGN_EDITOR, label: 'Design' },
] as const;

const TOOL_ROUTES: Partial<Record<TemplateTypeEnum, string>> = {
  [TemplateTypeEnum.IMAGE_GENERATOR]: '/creator/image-generator',
  [TemplateTypeEnum.VIDEO_GENERATOR]: '/creator/video-generator',
  [TemplateTypeEnum.WORKFLOW_EDITOR]: '/creator/workflow-editor',
  [TemplateTypeEnum.DESIGN_EDITOR]: '/creator/image-editor',
  [TemplateTypeEnum.IMAGE_UPSCALER]: '/creator/image-upscaler',
  [TemplateTypeEnum.VIDEO_UPSCALER]: '/creator/video-generator',
  [TemplateTypeEnum.MUSIC_GENERATOR]: '/creator/music-generator',
  [TemplateTypeEnum.VOICE_GENERATOR]: '/creator/voice-generator',
};

const getToolRoute = (type: TemplateTypeEnum) => TOOL_ROUTES[type] ?? '/creator/image-generator';

const formatType = (type: string) =>
  type.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());

const parseTags = (value: string) =>
  value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 12);

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data as
      | {
          message?: string | string[];
          error?: string;
          errors?: Record<string, unknown>;
        }
      | undefined;

    if (typeof responseData?.message === 'string') {
      return responseData.message;
    }

    if (Array.isArray(responseData?.message) && responseData.message.length > 0) {
      return responseData.message.join(', ');
    }

    if (typeof responseData?.error === 'string') {
      return responseData.error;
    }

    if (responseData?.errors && typeof responseData.errors === 'object') {
      const flattened = Object.values(responseData.errors)
        .flatMap((value) => (Array.isArray(value) ? value : [value]))
        .filter((value): value is string => typeof value === 'string' && value.trim().length > 0);

      if (flattened.length > 0) {
        return flattened.join(', ');
      }
    }

    return error.message || fallback;
  }

  if (error instanceof Error) {
    return error.message || fallback;
  }

  return fallback;
};

export function CommunityMarketplacePanel() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { balance, fetchBalance } = useCreditStore();
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState('');
  const [typeFilter, setTypeFilter] = React.useState<'all' | TemplateTypeEnum>('all');
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [thumbnail, setThumbnail] = React.useState('');
  const [templateType, setTemplateType] = React.useState<TemplateTypeEnum>(TemplateTypeEnum.IMAGE_GENERATOR);
  const [prompt, setPrompt] = React.useState('');
  const [priceCredits, setPriceCredits] = React.useState(25);
  const [platformFeeBps, setPlatformFeeBps] = React.useState(1500);
  const [tags, setTags] = React.useState('prompt,community,template');

  React.useEffect(() => {
    void fetchBalance();
  }, [fetchBalance]);

  const listingsQuery = useQuery({
    queryKey: ['community-marketplace', page, search, typeFilter],
    queryFn: () =>
      communityMarketplaceApi.getListings({
        page,
        limit: 12,
        q: search,
        type: typeFilter,
      }),
    placeholderData: (previousData) => previousData,
  });

  const myListingsQuery = useQuery({
    queryKey: ['community-marketplace-mine'],
    queryFn: () => communityMarketplaceApi.getMyListings({ page: 1, limit: 6 }),
    placeholderData: (previousData) => previousData,
  });

  const listings = listingsQuery.data?.data ?? [];
  const myListings = myListingsQuery.data?.data ?? [];
  const hasNextPage = listingsQuery.data?.hasNextPage ?? false;

  const createListingMutation = useMutation({
    mutationFn: (payload: CreateListingPayload) =>
      communityMarketplaceApi.createListing(payload),
    onSuccess: async () => {
      toast.success('Template listed on the community marketplace');
      setTitle('');
      setDescription('');
      setThumbnail('');
      setPrompt('');
      setPriceCredits(25);
      setTags('prompt,community,template');
      await queryClient.invalidateQueries({ queryKey: ['community-marketplace'] });
      await queryClient.invalidateQueries({ queryKey: ['community-marketplace-mine'] });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Failed to create listing'));
    },
  });

  const purchaseListingMutation = useMutation({
    mutationFn: (listingId: string) => communityMarketplaceApi.purchaseListing(listingId),
    onSuccess: async (result) => {
      toast.success(
        `Purchased for ${result.marketplace.marketplace.priceCredits} credits. Creator receives ${result.marketplace.marketplace.creatorPayoutCredits}.`,
      );
      await fetchBalance();
      await queryClient.invalidateQueries({ queryKey: ['community-marketplace'] });
      await queryClient.invalidateQueries({ queryKey: ['community-marketplace-mine'] });
      router.push(`${getToolRoute(result.purchasedTemplate.type)}?templateId=${result.purchasedTemplate.id}`);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Unable to purchase template'));
    },
  });

  const submitListing = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!title.trim() || !prompt.trim()) {
      toast.error('Add a title and a prompt before listing');
      return;
    }

    createListingMutation.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
      thumbnail: thumbnail.trim() || undefined,
      type: templateType,
      priceCredits,
      platformFeeBps,
      tags: parseTags(tags),
      listed: true,
      content: {
        prompt: prompt.trim(),
        marketplacePitch: description.trim() || title.trim(),
        thumbnail: thumbnail.trim() || undefined,
      },
    });
  };

  const renderListingCard = (listing: CommunityMarketplaceListing) => {
    const canAfford = (balance ?? 0) >= listing.marketplace.priceCredits;

    return (
      <Card key={listing.id} className="overflow-hidden border-border/70 bg-card/90">
        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
          {listing.thumbnail ? (
            <Image
              src={listing.thumbnail}
              alt={listing.title}
              fill
              unoptimized
              className="object-cover transition-transform duration-700 hover:scale-105"
              sizes="(max-width: 1024px) 100vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-muted via-muted/80 to-muted/40">
              <Sparkles className="h-10 w-10 text-muted-foreground/30" />
            </div>
          )}

          <div className="absolute left-3 top-3 rounded-full bg-gray-950/70 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
            {listing.marketplace.priceCredits} credits
          </div>
          <div className="absolute right-3 top-3 rounded-full bg-background/90 px-3 py-1 text-[11px] font-medium text-foreground backdrop-blur-sm">
            {formatType(listing.type)}
          </div>
        </div>

        <CardHeader className="pb-0">
          <CardTitle className="text-base">{listing.title}</CardTitle>
          <CardDescription className="line-clamp-2">
            {listing.description || 'Community template'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <BadgeCheck className="h-3.5 w-3.5 text-primary" />
              {listing.author?.firstName || listing.author?.email || 'Creator'}
            </span>
            <span>{listing.usageCount} uses</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {listing.marketplace.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[11px] text-muted-foreground"
              >
                <Tag className="h-3 w-3" />
                {tag}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 rounded-xl border border-border/70 bg-muted/20 p-3 text-xs">
            <div>
              <p className="text-muted-foreground">Creator gets</p>
              <p className="mt-1 font-semibold text-foreground">
                {listing.marketplace.creatorPayoutCredits} credits
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Core spread</p>
              <p className="mt-1 font-semibold text-foreground">
                {listing.marketplace.platformFeeCredits} credits
              </p>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground">
            {canAfford ? 'Ready to buy' : 'Need more credits'}
          </div>
          <Button
            size="sm"
            className="rounded-full gap-2"
            disabled={purchaseListingMutation.isPending || !canAfford}
            onClick={() => purchaseListingMutation.mutate(listing.id)}
          >
            {purchaseListingMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowRight className="h-4 w-4" />
            )}
            Buy & open
          </Button>
        </CardFooter>
      </Card>
    );
  };

  const currentStats = {
    count: listings.length,
    avgPrice:
      listings.length > 0
        ? Math.round(
            listings.reduce((sum, item) => sum + item.marketplace.priceCredits, 0) /
              listings.length,
          )
        : 0,
    myListings: myListings.length,
    coreSpread: listings.reduce((sum, item) => sum + item.marketplace.platformFeeCredits, 0),
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
      <section className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="border-border/70 bg-card/80">
            <CardHeader className="pb-2">
              <CardDescription>Listings live</CardDescription>
              <CardTitle className="text-3xl">{currentStats.count}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-border/70 bg-card/80">
            <CardHeader className="pb-2">
              <CardDescription>Average price</CardDescription>
              <CardTitle className="text-3xl">{currentStats.avgPrice}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-border/70 bg-card/80">
            <CardHeader className="pb-2">
              <CardDescription>Your listings</CardDescription>
              <CardTitle className="text-3xl">{currentStats.myListings}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-border/70 bg-card/80">
            <CardHeader className="pb-2">
              <CardDescription>Core spread</CardDescription>
              <CardTitle className="text-3xl">{currentStats.coreSpread}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card className="border-border/70 bg-card/95">
          <CardHeader className="gap-4 border-b border-border/70 pb-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="text-xl">Discover and trade templates</CardTitle>
                <CardDescription>
                  Sell prompt packs, workflow presets, and creative kits. Buyers keep the copy, creators earn credits, and the platform keeps the spread.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-border/70 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                <CreditCard className="h-4 w-4 text-pricing" />
                Balance: {balance ?? '...'} credits
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {TEMPLATE_TYPES.map((option) => (
                <button
                  type="button"
                  key={option.value}
                  onClick={() => {
                    setTypeFilter(option.value);
                    setPage(1);
                  }}
                  className={cn(
                    'rounded-full border px-4 py-2 text-sm transition-colors',
                    typeFilter === option.value
                      ? 'border-foreground bg-foreground text-background'
                      : 'border-border bg-background text-muted-foreground hover:border-foreground/40 hover:text-foreground',
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Search prompts, workflow packs, and creators"
                className="pl-10"
              />
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            {listingsQuery.isLoading ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : listings.length === 0 ? (
              <div className="flex h-40 flex-col items-center justify-center gap-2 text-center text-muted-foreground">
                <BookOpen className="h-8 w-8" />
                <p>No community listings yet. Be the first to publish one.</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                {listings.map(renderListingCard)}
              </div>
            )}
          </CardContent>

          <CardFooter className="justify-between border-t border-border/70 pt-6">
            <p className="text-sm text-muted-foreground">Showing page {page}</p>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPage((current) => current + 1)}
                disabled={!hasNextPage}
              >
                Next
              </Button>
            </div>
          </CardFooter>
        </Card>
      </section>

      <aside className="space-y-6">
        <Card className="border-border/70 bg-card/95">
          <CardHeader className="border-b border-border/70 pb-6">
            <div className="flex items-center gap-2">
              <Upload className="h-4 w-4 text-primary" />
              <CardTitle className="text-lg">List a template</CardTitle>
            </div>
            <CardDescription>
              Upload a polished preview, add your prompt body, choose a price, and let the community buy it with credits.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <form onSubmit={submitListing} className="space-y-4">
              <Input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Template title"
              />
              <Textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Short description"
                className="min-h-24"
              />
              <Input
                value={thumbnail}
                onChange={(event) => setThumbnail(event.target.value)}
                placeholder="Cover image URL"
              />
              <Textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="Prompt / instructions / template content"
                className="min-h-28"
              />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Type
                  </label>
                  <select
                    value={templateType}
                    onChange={(event) => setTemplateType(event.target.value as TemplateTypeEnum)}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {TEMPLATE_TYPES.filter((option) => option.value !== 'all').map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Credits
                  </label>
                  <Input
                    type="number"
                    min={1}
                    value={priceCredits}
                    onChange={(event) => setPriceCredits(Number(event.target.value))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Platform fee bps
                </label>
                <Input
                  type="number"
                  min={0}
                  value={platformFeeBps}
                  onChange={(event) => setPlatformFeeBps(Number(event.target.value))}
                />
              </div>
              <Input
                value={tags}
                onChange={(event) => setTags(event.target.value)}
                placeholder="Tags, separated by commas"
              />
              <Button
                type="submit"
                className="w-full gap-2"
                disabled={createListingMutation.isPending}
              >
                {createListingMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Publish listing
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/95">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Your listings</CardTitle>
            <CardDescription>Quick access to items you already published.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {myListingsQuery.isLoading ? (
              <div className="flex h-24 items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : myListings.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
                No published templates yet.
              </div>
            ) : (
              myListings.map((listing) => (
                <div
                  key={listing.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border/70 px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium">{listing.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {listing.marketplace.priceCredits} credits
                    </p>
                  </div>
                  <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] text-muted-foreground">
                    {listing.marketplace.listed ? 'Live' : 'Draft'}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/95">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">How the split works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>1. Creator posts a template with a cover image and a credit price.</p>
            <p>2. Buyer pays in credits and gets a private copy in their library.</p>
            <p>3. Credits split automatically: creator earns most of it, platform keeps the fee.</p>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
