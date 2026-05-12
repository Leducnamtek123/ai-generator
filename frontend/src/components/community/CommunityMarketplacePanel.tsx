'use client';

import React, { useReducer } from 'react';
import Image from 'next/image';
import axios from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Box,
  CheckCircle2,
  CreditCard,
  Image as ImageIcon,
  LayoutGrid,
  Loader2,
  Mic,
  Music,
  Search,
  Sparkles,
  Tag,
  Video,
  type LucideIcon,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

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
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { TemplateTypeEnum } from '@/lib/api/templates';
import { useCreditStore } from '@/stores/credit-store';
import {
  communityMarketplaceApi,
  type CommunityMarketplaceListing,
  type CreateListingPayload,
} from '@/services/communityMarketplaceApi';
import { MarketplaceListingSkeletonGrid, ListingSummarySkeletonList } from '@/components/common/loading-skeletons';

type TemplateTypeOption = {
  value: 'all' | TemplateTypeEnum;
  label: string;
  description: string;
  icon: LucideIcon;
};

type MarketplaceContent = {
  prompt?: string;
  marketplacePitch?: string;
  summary?: string;
  note?: string;
};

type MarketplaceState = {
  page: number;
  search: string;
  typeFilter: 'all' | TemplateTypeEnum;
  title: string;
  description: string;
  thumbnail: string;
  templateType: TemplateTypeEnum;
  prompt: string;
  priceCredits: number;
  platformFeeBps: number;
  tags: string;
  listed: boolean;
};

type MarketplaceAction =
  | { type: 'setPage'; page: number }
  | { type: 'setSearch'; search: string }
  | { type: 'setTypeFilter'; typeFilter: 'all' | TemplateTypeEnum }
  | { type: 'setTitle'; title: string }
  | { type: 'setDescription'; description: string }
  | { type: 'setThumbnail'; thumbnail: string }
  | { type: 'setTemplateType'; templateType: TemplateTypeEnum }
  | { type: 'setPrompt'; prompt: string }
  | { type: 'setPriceCredits'; priceCredits: number }
  | { type: 'setPlatformFeeBps'; platformFeeBps: number }
  | { type: 'setTags'; tags: string }
  | { type: 'setListed'; listed: boolean }
  | { type: 'resetDraft' };

const initialMarketplaceState: MarketplaceState = {
  page: 1,
  search: '',
  typeFilter: 'all',
  title: '',
  description: '',
  thumbnail: '',
  templateType: TemplateTypeEnum.IMAGE_GENERATOR,
  prompt: '',
  priceCredits: 25,
  platformFeeBps: 1500,
  tags: 'prompt,community,template',
  listed: true,
};

function marketplaceReducer(state: MarketplaceState, action: MarketplaceAction): MarketplaceState {
  switch (action.type) {
    case 'setPage':
      return { ...state, page: action.page };
    case 'setSearch':
      return { ...state, search: action.search, page: 1 };
    case 'setTypeFilter':
      return { ...state, typeFilter: action.typeFilter, page: 1 };
    case 'setTitle':
      return { ...state, title: action.title };
    case 'setDescription':
      return { ...state, description: action.description };
    case 'setThumbnail':
      return { ...state, thumbnail: action.thumbnail };
    case 'setTemplateType':
      return { ...state, templateType: action.templateType };
    case 'setPrompt':
      return { ...state, prompt: action.prompt };
    case 'setPriceCredits':
      return { ...state, priceCredits: action.priceCredits };
    case 'setPlatformFeeBps':
      return { ...state, platformFeeBps: action.platformFeeBps };
    case 'setTags':
      return { ...state, tags: action.tags };
    case 'setListed':
      return { ...state, listed: action.listed };
    case 'resetDraft':
      return { ...initialMarketplaceState };
    default:
      return state;
  }
}

const BROWSE_TEMPLATE_TYPES: TemplateTypeOption[] = [
  {
    value: 'all',
    label: 'All templates',
    description: 'Show every live listing',
    icon: LayoutGrid,
  },
  {
    value: TemplateTypeEnum.IMAGE_GENERATOR,
    label: 'Image',
    description: 'Prompt packs and image workflows',
    icon: ImageIcon,
  },
  {
    value: TemplateTypeEnum.VIDEO_GENERATOR,
    label: 'Video',
    description: 'Motion prompts and video presets',
    icon: Video,
  },
  {
    value: TemplateTypeEnum.WORKFLOW_EDITOR,
    label: 'Workflow',
    description: 'Reusable node graphs and automations',
    icon: Box,
  },
  {
    value: TemplateTypeEnum.MUSIC_GENERATOR,
    label: 'Music',
    description: 'Tracks, loops, and scoring prompts',
    icon: Music,
  },
  {
    value: TemplateTypeEnum.VOICE_GENERATOR,
    label: 'Voice',
    description: 'Voice style packs and narration flows',
    icon: Mic,
  },
  {
    value: TemplateTypeEnum.AI_ASSISTANT,
    label: 'Assistant',
    description: 'Prompt helpers and quick-start guides',
    icon: Sparkles,
  },
  {
    value: TemplateTypeEnum.DESIGN_EDITOR,
    label: 'Design',
    description: 'Layouts, mockups, and creative systems',
    icon: Sparkles,
  },
];

const PUBLISH_TEMPLATE_TYPES: TemplateTypeOption[] = [
  {
    value: TemplateTypeEnum.IMAGE_GENERATOR,
    label: 'Image template',
    description: 'Prompt packs, styles, and image workflows',
    icon: ImageIcon,
  },
  {
    value: TemplateTypeEnum.VIDEO_GENERATOR,
    label: 'Video template',
    description: 'Cinematic motion prompts and presets',
    icon: Video,
  },
  {
    value: TemplateTypeEnum.WORKFLOW_EDITOR,
    label: 'Workflow template',
    description: 'Node graphs and reusable automation flows',
    icon: Box,
  },
  {
    value: TemplateTypeEnum.DESIGN_EDITOR,
    label: 'Design template',
    description: 'Mockups, layouts, and visual systems',
    icon: Sparkles,
  },
  {
    value: TemplateTypeEnum.IMAGE_UPSCALER,
    label: 'Image upscaler template',
    description: 'Sharpening and enhancement presets',
    icon: ImageIcon,
  },
  {
    value: TemplateTypeEnum.VIDEO_UPSCALER,
    label: 'Video upscaler template',
    description: 'Motion cleanup and enhancement presets',
    icon: Video,
  },
  {
    value: TemplateTypeEnum.MUSIC_GENERATOR,
    label: 'Music template',
    description: 'Loop packs, scoring patterns, and stems',
    icon: Music,
  },
  {
    value: TemplateTypeEnum.VOICE_GENERATOR,
    label: 'Voice template',
    description: 'Narration, dubbing, and voice style packs',
    icon: Mic,
  },
  {
    value: TemplateTypeEnum.AI_ASSISTANT,
    label: 'Assistant template',
    description: 'Prompt helper scripts and assistant flows',
    icon: Sparkles,
  },
  {
    value: TemplateTypeEnum.SOUND_EFFECT_GENERATOR,
    label: 'Sound effect template',
    description: 'SFX packs and sound-design prompts',
    icon: Music,
  },
  {
    value: TemplateTypeEnum.ICON_GENERATOR,
    label: 'Icon template',
    description: 'Icon systems and asset packs',
    icon: ImageIcon,
  },
  {
    value: TemplateTypeEnum.MOCKUP_GENERATOR,
    label: 'Mockup template',
    description: 'Product mockups and preview systems',
    icon: Sparkles,
  },
  {
    value: TemplateTypeEnum.BG_REMOVER,
    label: 'Background removal template',
    description: 'Cleanup and segmentation presets',
    icon: Sparkles,
  },
];

const PUBLISHING_GUIDE = [
  {
    title: 'Name the value',
    body: 'Use a title that tells buyers exactly what they get.',
  },
  {
    title: 'Explain the prompt',
    body: 'Write the prompt body or workflow notes in plain language.',
  },
  {
    title: 'Add a cover',
    body: 'Use a sharp preview image. If you skip it, the card falls back to a deliberate text preview.',
  },
  {
    title: 'Keep tags focused',
    body: 'Use short searchable tags that describe intent, format, and outcome.',
  },
] as const;

const TEMPLATE_TYPE_LABELS = new Map(
  [...BROWSE_TEMPLATE_TYPES, ...PUBLISH_TEMPLATE_TYPES].map((option) => [
    option.value,
    option.label,
  ]),
);

const TEMPLATE_TYPE_DESCRIPTIONS = new Map(
  PUBLISH_TEMPLATE_TYPES.map((option) => [option.value, option.description]),
);

const TOOL_ROUTES: Partial<Record<TemplateTypeEnum, string>> = {
  [TemplateTypeEnum.IMAGE_GENERATOR]: '/creator/image-generator',
  [TemplateTypeEnum.VIDEO_GENERATOR]: '/creator/video-generator',
  [TemplateTypeEnum.WORKFLOW_EDITOR]: '/creator/workflow-editor',
  [TemplateTypeEnum.DESIGN_EDITOR]: '/creator/design-editor',
  [TemplateTypeEnum.IMAGE_UPSCALER]: '/creator/image-upscaler',
  [TemplateTypeEnum.VIDEO_UPSCALER]: '/creator/video-upscaler',
  [TemplateTypeEnum.MUSIC_GENERATOR]: '/creator/music-generator',
  [TemplateTypeEnum.VOICE_GENERATOR]: '/creator/voice-generator',
  [TemplateTypeEnum.AI_ASSISTANT]: '/creator/ai-assistant',
  [TemplateTypeEnum.SOUND_EFFECT_GENERATOR]: '/creator/sfx-generator',
  [TemplateTypeEnum.ICON_GENERATOR]: '/creator/icon-generator',
  [TemplateTypeEnum.MOCKUP_GENERATOR]: '/creator/mockup-generator',
  [TemplateTypeEnum.BG_REMOVER]: '/creator/bg-remover',
};

const getToolRoute = (type: TemplateTypeEnum) => TOOL_ROUTES[type] ?? '/creator/image-generator';

const parseTags = (value: string) =>
  value
    .split(',')
    .flatMap((tag) => {
      const trimmed = tag.trim();
      return trimmed ? [trimmed] : [];
    })
    .slice(0, 12);

const formatType = (type: string) =>
  type.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());

const getTypeLabel = (type: string) => TEMPLATE_TYPE_LABELS.get(type as TemplateTypeEnum) ?? formatType(type);

const formatAuthorName = (firstName?: string | null, lastName?: string | null) => {
  const parts = [firstName, lastName].filter((part): part is string => Boolean(part && part.trim()));
  return parts.join(' ').trim();
};

const getListingContent = (listing: CommunityMarketplaceListing): MarketplaceContent => {
  const content = listing.content;

  if (!content || typeof content !== 'object') {
    return {};
  }

  return content as MarketplaceContent;
};

const getListingPreview = (listing: CommunityMarketplaceListing) => {
  const content = getListingContent(listing);
  return (
    content.prompt?.trim() ||
    content.marketplacePitch?.trim() ||
    content.summary?.trim() ||
    listing.description?.trim() ||
    'Add a prompt or workflow summary to make the listing feel complete.'
  );
};

const getCreatorName = (listing: CommunityMarketplaceListing) =>
  formatAuthorName(listing.author?.firstName, listing.author?.lastName) ||
  listing.author?.email ||
  'Creator';

const getFeeCredits = (priceCredits: number, platformFeeBps: number) =>
  Math.max(0, Math.floor((priceCredits * Math.max(0, platformFeeBps)) / 10000));

function MarketplaceListingThumbnail({
  listing,
  previewText,
}: {
  listing: CommunityMarketplaceListing;
  previewText: string;
}) {
  const [imageFailed, setImageFailed] = React.useState(false);
  const showImage = Boolean(listing.thumbnail) && !imageFailed;

  return (
    <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-zinc-950 via-zinc-950 to-zinc-900">
      {showImage ? (
        <Image
          src={listing.thumbnail as string}
          alt={listing.title}
          fill
          unoptimized
          onError={() => setImageFailed(true)}
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          sizes="(max-width: 1024px) 100vw, 33vw"
        />
      ) : (
        <div className="flex h-full items-end p-4">
          <div className="max-w-[90%] space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Sparkles className="size-3.5" />
              Prompt preview
            </div>
            <p className="line-clamp-3 text-sm leading-relaxed text-foreground">{previewText}</p>
          </div>
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />

      <div className="absolute left-3 top-3 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-background/80 px-3 py-1 text-[11px] font-semibold text-foreground backdrop-blur-sm">
          {listing.marketplace.priceCredits} credits
        </span>
        {listing.marketplace.featured ? (
          <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-[11px] font-semibold text-emerald-100 backdrop-blur-sm">
            Featured
          </span>
        ) : null}
      </div>

      <div className="absolute right-3 top-3 rounded-full bg-background/90 px-3 py-1 text-[11px] font-medium text-foreground backdrop-blur-sm">
        {getTypeLabel(listing.type)}
      </div>
    </div>
  );
}

function MarketplaceListingCard({
  listing,
  canAfford,
  remainingCredits,
  isPurchasing,
  onPurchase,
}: {
  listing: CommunityMarketplaceListing;
  canAfford: boolean;
  remainingCredits: number;
  isPurchasing: boolean;
  onPurchase: (listingId: string) => void;
}) {
  const previewText = getListingPreview(listing);
  const creatorName = getCreatorName(listing);
  const payoutCredits = listing.marketplace.creatorPayoutCredits;
  const platformFeeCredits = listing.marketplace.platformFeeCredits;

  return (
    <Card className="group overflow-hidden border-border/70 bg-card/95 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-border hover:shadow-xl">
      <MarketplaceListingThumbnail listing={listing} previewText={previewText} />

      <CardHeader className="pb-0 pt-5">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="text-base leading-tight">{listing.title}</CardTitle>
            <span className="rounded-full border border-border/70 bg-muted/30 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
              {listing.marketplace.listed ? 'Live' : 'Draft'}
            </span>
          </div>
          <CardDescription className="line-clamp-2">
            {listing.description?.trim() || previewText}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <BadgeCheck className="size-3.5 text-primary" />
            {creatorName}
          </span>
          <span>{listing.usageCount} uses</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {listing.marketplace.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[11px] text-muted-foreground"
            >
              <Tag className="size-3" />
              {tag}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-2xl border border-border/70 bg-muted/20 p-3 text-xs">
          <div>
            <p className="text-muted-foreground">Creator gets</p>
            <p className="mt-1 font-semibold text-foreground">{payoutCredits} credits</p>
          </div>
          <div>
            <p className="text-muted-foreground">Platform fee</p>
            <p className="mt-1 font-semibold text-foreground">{platformFeeCredits} credits</p>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between gap-3 border-t border-border/70 pt-5">
        <div className="text-xs text-muted-foreground">
          {canAfford
            ? 'Ready to buy'
            : `Need ${remainingCredits} more credit${remainingCredits === 1 ? '' : 's'}`}
        </div>
        <Button
          size="sm"
          className="rounded-full gap-2"
          disabled={isPurchasing || !canAfford}
          onClick={() => onPurchase(listing.id)}
        >
          {isPurchasing ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ArrowRight className="size-4" />
          )}
          Buy & open
        </Button>
      </CardFooter>
    </Card>
  );
}

function DraftPreviewThumbnail({
  thumbnail,
  title,
  previewText,
}: {
  thumbnail: string;
  title: string;
  previewText: string;
}) {
  const [imageFailed, setImageFailed] = React.useState(false);
  const showImage = Boolean(thumbnail.trim()) && !imageFailed;

  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-gradient-to-br from-zinc-950 via-zinc-950 to-zinc-900">
      {showImage ? (
        <Image
          src={thumbnail}
          alt={title || 'Draft cover preview'}
          fill
          unoptimized
          onError={() => setImageFailed(true)}
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 30vw"
        />
      ) : (
        <div className="flex h-full items-end p-4">
          <div className="max-w-[92%] space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Sparkles className="size-3.5" />
              Preview state
            </div>
            <p className="line-clamp-4 text-sm leading-relaxed text-foreground">{previewText}</p>
          </div>
        </div>
      )}

    </div>
  );
}

function ListingDraftPreview({
  title,
  description,
  prompt,
  thumbnail,
  templateType,
  priceCredits,
  platformFeeBps,
  tags,
}: {
  title: string;
  description: string;
  prompt: string;
  thumbnail: string;
  templateType: TemplateTypeEnum;
  priceCredits: number;
  platformFeeBps: number;
  tags: string;
}) {
  const previewTypeLabel =
    TEMPLATE_TYPE_LABELS.get(templateType) ?? formatType(templateType);
  const previewTypeDescription =
    TEMPLATE_TYPE_DESCRIPTIONS.get(templateType) ?? 'Selected template type';
  const previewTags = parseTags(tags);
  const feeCredits = getFeeCredits(priceCredits, platformFeeBps);
  const creatorCredits = Math.max(0, priceCredits - feeCredits);
  const previewCopy =
    prompt.trim() ||
    description.trim() ||
    'Add a prompt body or workflow summary so the preview explains what buyers receive.';

  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-muted/20">
      <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Draft preview</p>
          <p className="text-xs text-muted-foreground">{previewTypeDescription}</p>
        </div>
        <span className="rounded-full bg-background px-3 py-1 text-[11px] font-medium text-muted-foreground">
          {previewTypeLabel}
        </span>
      </div>

      <div className="grid gap-4 p-4 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="relative">
          <DraftPreviewThumbnail
            key={thumbnail.trim() || 'draft-preview-empty'}
            thumbnail={thumbnail}
            title={title}
            previewText={previewCopy}
          />

          <div className="absolute left-3 top-3 rounded-full bg-background/80 px-3 py-1 text-[11px] font-semibold text-foreground backdrop-blur-sm">
            {priceCredits} credits
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="text-base font-semibold text-foreground">
              {title.trim() || 'Untitled template'}
            </h4>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {description.trim() || previewCopy}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {previewTags.length > 0 ? (
              previewTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-background px-2.5 py-1 text-[11px] text-muted-foreground"
                >
                  <Tag className="size-3" />
                  {tag}
                </span>
              ))
            ) : (
              <span className="rounded-full border border-dashed border-border/70 px-2.5 py-1 text-[11px] text-muted-foreground">
                Add tags to improve discovery
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 rounded-2xl border border-border/70 bg-background/60 p-3 text-xs">
            <div>
              <p className="text-muted-foreground">Creator payout</p>
              <p className="mt-1 font-semibold text-foreground">{creatorCredits} credits</p>
            </div>
            <div>
              <p className="text-muted-foreground">Platform fee</p>
              <p className="mt-1 font-semibold text-foreground">{feeCredits} credits</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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
      const flattened: string[] = [];
      for (const value of Object.values(responseData.errors)) {
        if (Array.isArray(value)) {
          for (const item of value) {
            if (typeof item === 'string' && item.trim().length > 0) {
              flattened.push(item);
            }
          }
          continue;
        }
        if (typeof value === 'string' && value.trim().length > 0) {
          flattened.push(value);
        }
      }

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
  const { push } = useRouter();
  const queryClient = useQueryClient();
  const { balance, fetchBalance } = useCreditStore();
  const [state, dispatch] = useReducer(marketplaceReducer, initialMarketplaceState);

  React.useEffect(() => {
    void fetchBalance();
  }, [fetchBalance]);

  const listingsQuery = useQuery({
    queryKey: ['community-marketplace', state.page, state.search.trim(), state.typeFilter],
    queryFn: () =>
      communityMarketplaceApi.getListings({
        page: state.page,
        limit: 12,
        q: state.search.trim(),
        type: state.typeFilter,
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
    mutationFn: (payload: CreateListingPayload) => communityMarketplaceApi.createListing(payload),
    onSuccess: async (_, variables) => {
      toast.success(
        variables.listed
          ? 'Template listed on the community marketplace'
          : 'Template saved as a draft',
      );
      dispatch({ type: 'resetDraft' });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['community-marketplace'] }),
        queryClient.invalidateQueries({ queryKey: ['community-marketplace-mine'] }),
      ]);
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
      await Promise.all([
        fetchBalance(),
        queryClient.invalidateQueries({ queryKey: ['community-marketplace'] }),
        queryClient.invalidateQueries({ queryKey: ['community-marketplace-mine'] }),
      ]);
      push(`${getToolRoute(result.purchasedTemplate.type)}?templateId=${result.purchasedTemplate.id}`);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Unable to purchase template'));
    },
  });

  const submitListing = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!state.title.trim()) {
      toast.error('Add a title before listing');
      return;
    }

    if (!state.prompt.trim()) {
      toast.error('Add a prompt or workflow summary before listing');
      return;
    }

    if (state.priceCredits < 1) {
      toast.error('Price must be at least 1 credit');
      return;
    }

    createListingMutation.mutate({
      title: state.title.trim(),
      description: state.description.trim() || undefined,
      thumbnail: state.thumbnail.trim() || undefined,
      type: state.templateType,
      priceCredits: state.priceCredits,
      platformFeeBps: state.platformFeeBps,
      tags: parseTags(state.tags),
      listed: state.listed,
      content: {
        prompt: state.prompt.trim(),
        marketplacePitch: state.description.trim() || state.title.trim(),
        thumbnail: state.thumbnail.trim() || undefined,
      },
    });
  };

  const currentStats = {
    count: listings.length,
    avgPrice:
      listings.length > 0
        ? Math.round(listings.reduce((sum, item) => sum + item.marketplace.priceCredits, 0) / listings.length)
        : 0,
    myListings: myListings.length,
    platformFeeTotal: listings.reduce((sum, item) => sum + item.marketplace.platformFeeCredits, 0),
  };

  const selectedTypeDescription =
    TEMPLATE_TYPE_DESCRIPTIONS.get(state.templateType) ?? 'Selected template type';

  const draftFeeCredits = getFeeCredits(state.priceCredits, state.platformFeeBps);
  const draftCreatorCredits = Math.max(0, state.priceCredits - draftFeeCredits);

  return (
    <div className="space-y-6">
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
              <CardDescription>Platform fee total</CardDescription>
              <CardTitle className="text-3xl">{currentStats.platformFeeTotal}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card className="border-border/70 bg-card/95">
          <CardHeader className="gap-4 border-b border-border/70 pb-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="text-xl">Discover and trade templates</CardTitle>
                <CardDescription>
                  Sell prompt packs, workflow presets, and creative kits. Buyers keep the copy,
                  creators earn credits, and the platform keeps the spread.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-border/70 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                <CreditCard className="size-4 text-pricing" />
                Balance: {balance ?? '...'} credits
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {BROWSE_TEMPLATE_TYPES.map((option) => {
                const Icon = option.icon;

                return (
                  <button
                    type="button"
                    key={option.value}
                    onClick={() => {
                      dispatch({ type: 'setTypeFilter', typeFilter: option.value });
                    }}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors',
                      state.typeFilter === option.value
                        ? 'border-foreground bg-foreground text-background'
                        : 'border-border bg-background text-muted-foreground hover:border-foreground/40 hover:text-foreground',
                    )}
                  >
                    <Icon className="size-4" />
                    {option.label}
                  </button>
                );
              })}
            </div>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={state.search}
                onChange={(event) => {
                  dispatch({ type: 'setSearch', search: event.target.value });
                }}
                placeholder="Search titles, prompts, and creators"
                className="pl-10"
              />
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            {listingsQuery.isError ? (
              <div className="flex h-52 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-destructive/40 bg-destructive/5 px-6 text-center">
                <p className="font-medium text-foreground">Failed to load community listings</p>
                <p className="text-sm text-muted-foreground">
                  {getApiErrorMessage(listingsQuery.error, 'Try again in a moment.')}
                </p>
                <Button variant="outline" size="sm" onClick={() => listingsQuery.refetch()}>
                  Retry
                </Button>
              </div>
            ) : listingsQuery.isLoading ? (
              <MarketplaceListingSkeletonGrid count={6} />
            ) : listings.length === 0 ? (
              <div className="flex h-52 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/70 bg-muted/20 px-6 text-center">
                <BookOpen className="size-9 text-muted-foreground" />
                <div className="space-y-1">
                  <p className="font-medium text-foreground">No community listings yet</p>
                  <p className="text-sm text-muted-foreground">
                    Publish the first template or change the filter to find another category.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                {listings.map((listing) => {
                  const canAfford = (balance ?? 0) >= listing.marketplace.priceCredits;
                  const remainingCredits = Math.max(
                    0,
                    listing.marketplace.priceCredits - (balance ?? 0),
                  );
                  const isPurchasing =
                    purchaseListingMutation.isPending &&
                    purchaseListingMutation.variables === listing.id;

                  return (
                    <MarketplaceListingCard
                      key={listing.id}
                      listing={listing}
                      canAfford={canAfford}
                      remainingCredits={remainingCredits}
                      isPurchasing={isPurchasing}
                      onPurchase={(listingId) => purchaseListingMutation.mutate(listingId)}
                    />
                  );
                })}
              </div>
            )}
          </CardContent>

          <CardFooter className="justify-between border-t border-border/70 pt-6">
            <p className="text-sm text-muted-foreground">Showing page {state.page}</p>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => dispatch({ type: 'setPage', page: Math.max(1, state.page - 1) })}
                disabled={state.page === 1}
              >
                Previous
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => dispatch({ type: 'setPage', page: state.page + 1 })}
                disabled={!hasNextPage}
              >
                Next
              </Button>
            </div>
          </CardFooter>
        </Card>
      </section>

    </div>
  );
}
