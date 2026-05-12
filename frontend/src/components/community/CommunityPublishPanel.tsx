'use client';

import React, { useReducer } from 'react';
import Image from 'next/image';
import { useMutation } from '@tanstack/react-query';
import { ArrowRight, CheckCircle2, CreditCard, Image as ImageIcon, Loader2, Mic, Music, Sparkles, Tag, Video, Box, type LucideIcon } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { TemplateTypeEnum } from '@/lib/api/templates';
import { communityMarketplaceApi } from '@/services/communityMarketplaceApi';

type TemplateTypeOption = {
  value: TemplateTypeEnum;
  label: string;
  description: string;
  icon: LucideIcon;
};

type PublishState = {
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

type PublishAction =
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

const initialState: PublishState = {
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

function publishReducer(state: PublishState, action: PublishAction): PublishState {
  switch (action.type) {
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
      return initialState;
    default:
      return state;
  }
}

const parseTags = (value: string) =>
  value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 12);

const getFeeCredits = (priceCredits: number, platformFeeBps: number) =>
  Math.max(0, Math.floor((priceCredits * Math.max(0, platformFeeBps)) / 10000));

function PublishPreview({ state }: { state: PublishState }) {
  const feeCredits = getFeeCredits(state.priceCredits, state.platformFeeBps);
  const creatorCredits = Math.max(0, state.priceCredits - feeCredits);
  const previewType = PUBLISH_TEMPLATE_TYPES.find((option) => option.value === state.templateType);
  const previewText =
    state.prompt.trim() ||
    state.description.trim() ||
    'Add a prompt body or workflow summary so the preview explains what buyers receive.';
  const tags = parseTags(state.tags);

  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-muted/20">
      <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Draft preview</p>
          <p className="text-xs text-muted-foreground">
            {previewType?.description ?? 'Selected template type'}
          </p>
        </div>
        <span className="rounded-full bg-background px-3 py-1 text-[11px] font-medium text-muted-foreground">
          {previewType?.label ?? 'Template'}
        </span>
      </div>

      <div className="grid gap-4 p-4 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="relative">
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-gradient-to-br from-zinc-950 via-zinc-950 to-zinc-900">
            {state.thumbnail.trim() ? (
              <Image
                src={state.thumbnail}
                alt={state.title || 'Draft cover preview'}
                fill
                unoptimized
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

          <div className="absolute left-3 top-3 rounded-full bg-background/80 px-3 py-1 text-[11px] font-semibold text-foreground backdrop-blur-sm">
            {state.priceCredits} credits
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-lg font-semibold text-foreground">
                  {state.title.trim() || 'Untitled listing'}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {state.description.trim() || 'Add a concise value statement.'}
                </p>
              </div>
              <span
                className={cn(
                  'rounded-full px-2.5 py-1 text-[11px] font-medium',
                  state.listed
                    ? 'bg-emerald-500/10 text-emerald-700'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                {state.listed ? 'Live' : 'Draft'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 rounded-2xl border border-border/70 bg-background p-3 text-xs">
            <div>
              <p className="text-muted-foreground">Creator gets</p>
              <p className="mt-1 font-semibold text-foreground">{creatorCredits} credits</p>
            </div>
            <div>
              <p className="text-muted-foreground">Platform fee</p>
              <p className="mt-1 font-semibold text-foreground">{feeCredits} credits</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {tags.slice(0, 4).map((tag) => (
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
    </div>
  );
}

export function CommunityPublishPanel() {
  const [state, dispatch] = useReducer(publishReducer, initialState);

  const createListingMutation = useMutation({
    mutationFn: (payload: Parameters<typeof communityMarketplaceApi.createListing>[0]) =>
      communityMarketplaceApi.createListing(payload),
    onSuccess: () => {
      toast.success('Listing saved');
      dispatch({ type: 'resetDraft' });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to create listing';
      toast.error(message);
    },
  });

  const selectedTemplate =
    PUBLISH_TEMPLATE_TYPES.find((option) => option.value === state.templateType) ??
    PUBLISH_TEMPLATE_TYPES[0];

  const submitListing = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!state.title.trim() || !state.prompt.trim()) {
      toast.error('Title and prompt are required.');
      return;
    }

    createListingMutation.mutate({
      title: state.title.trim(),
      description: state.description.trim() || undefined,
      thumbnail: state.thumbnail.trim() || undefined,
      type: state.templateType,
      content: {
        prompt: state.prompt.trim(),
        marketplacePitch: state.description.trim() || undefined,
      },
      priceCredits: Math.max(1, state.priceCredits),
      platformFeeBps: Math.max(0, state.platformFeeBps),
      tags: parseTags(state.tags),
      listed: state.listed,
    });
  };

  const draftFeeCredits = getFeeCredits(state.priceCredits, state.platformFeeBps);
  const draftCreatorCredits = Math.max(0, state.priceCredits - draftFeeCredits);

  return (
    <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <section className="space-y-6">
        <Card className="border-border/70 bg-card/95">
          <CardHeader className="gap-4 border-b border-border/70 pb-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="text-xl">Publish a listing</CardTitle>
                <CardDescription>
                  Create a reusable template, explain the value clearly, and choose whether it
                  goes live immediately or stays as a draft.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-border/70 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                <CreditCard className="size-4 text-pricing" />
                Balance-aware pricing
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 pt-6">
            <form onSubmit={submitListing} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="community-title">Title</Label>
                <Input
                  id="community-title"
                  value={state.title}
                  onChange={(event) => dispatch({ type: 'setTitle', title: event.target.value })}
                  placeholder="Template title"
                />
                <p className="text-xs text-muted-foreground">
                  Keep the title short and specific so the listing scans well in the grid.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="community-description">Short description</Label>
                <Textarea
                  id="community-description"
                  value={state.description}
                  onChange={(event) =>
                    dispatch({ type: 'setDescription', description: event.target.value })
                  }
                  placeholder="Describe the outcome, workflow, or style pack"
                  className="min-h-24"
                />
                <p className="text-xs text-muted-foreground">
                  Explain the value proposition in one or two lines.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="community-thumbnail">Cover image URL</Label>
                <Input
                  id="community-thumbnail"
                  value={state.thumbnail}
                  onChange={(event) =>
                    dispatch({ type: 'setThumbnail', thumbnail: event.target.value })
                  }
                  placeholder="https://example.com/cover.png"
                />
                <p className="text-xs text-muted-foreground">
                  A strong cover improves conversion. If you skip it, buyers see a deliberate
                  prompt preview instead of a broken card.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="community-prompt">Prompt / template content</Label>
                <Textarea
                  id="community-prompt"
                  value={state.prompt}
                  onChange={(event) => dispatch({ type: 'setPrompt', prompt: event.target.value })}
                  placeholder="Paste the prompt body, workflow notes, or instructions"
                  className="min-h-32"
                />
                <p className="text-xs text-muted-foreground">
                  This is the real payload buyers receive after purchase.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="community-type">Type</Label>
                  <Select
                    value={state.templateType}
                    onValueChange={(value) =>
                      dispatch({ type: 'setTemplateType', templateType: value as TemplateTypeEnum })
                    }
                  >
                    <SelectTrigger id="community-type" className="w-full">
                      <SelectValue placeholder="Choose a template type" />
                    </SelectTrigger>
                    <SelectContent>
                      {PUBLISH_TEMPLATE_TYPES.map((option) => {
                        const Icon = option.icon;

                        return (
                          <SelectItem key={option.value} value={option.value}>
                            <span className="flex items-center gap-2">
                              <Icon className="size-4" />
                              {option.label}
                            </span>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">{selectedTemplate.description}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="community-price">Price in credits</Label>
                  <Input
                    id="community-price"
                    type="number"
                    min={1}
                    value={state.priceCredits}
                    onChange={(event) => {
                      const nextValue = Number(event.target.value);
                      dispatch({
                        type: 'setPriceCredits',
                        priceCredits: Number.isFinite(nextValue) ? Math.max(1, nextValue) : 1,
                      });
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Creator payout: {draftCreatorCredits} credits. Platform fee: {draftFeeCredits}{' '}
                    credits.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="community-platform-fee">Platform fee bps</Label>
                <Input
                  id="community-platform-fee"
                  type="number"
                  min={0}
                  value={state.platformFeeBps}
                  onChange={(event) => {
                    const nextValue = Number(event.target.value);
                    dispatch({
                      type: 'setPlatformFeeBps',
                      platformFeeBps: Number.isFinite(nextValue) ? Math.max(0, nextValue) : 0,
                    });
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  The backend uses basis points. 1500 bps means a 15% platform fee.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="community-tags">Tags</Label>
                <Input
                  id="community-tags"
                  value={state.tags}
                  onChange={(event) => dispatch({ type: 'setTags', tags: event.target.value })}
                  placeholder="prompt,community,template"
                />
                <p className="text-xs text-muted-foreground">
                  Use short comma-separated tags. The first few tags show on the card.
                </p>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-muted/20 p-4">
                <div className="space-y-1">
                  <Label htmlFor="community-listed">Publish immediately</Label>
                  <p className="text-xs text-muted-foreground">
                    Turn this off to save as a draft and keep the listing out of the public grid.
                  </p>
                </div>
                <input
                  id="community-listed"
                  type="checkbox"
                  checked={state.listed}
                  onChange={(event) => dispatch({ type: 'setListed', listed: event.target.checked })}
                  className="size-4 rounded border-border text-primary focus:ring-primary"
                />
              </div>

              <Button type="submit" className="w-full gap-2" disabled={createListingMutation.isPending}>
                {createListingMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Sparkles className="size-4" />
                )}
                {state.listed ? 'Publish listing' : 'Save draft'}
              </Button>
            </form>

            <Separator />

            <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
              <div className="mb-4">
                <p className="text-sm font-semibold text-foreground">Publishing checklist</p>
                <p className="text-xs text-muted-foreground">
                  Small habits that make listings easier to buy and reuse.
                </p>
              </div>
              <div className="space-y-3">
                {PUBLISHING_GUIDE.map((item) => (
                  <div key={item.title} className="flex items-start gap-3">
                    <div className="mt-1 rounded-full bg-primary/10 p-1.5 text-primary">
                      <CheckCircle2 className="size-3.5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.title}</p>
                      <p className="text-xs leading-relaxed text-muted-foreground">{item.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <aside className="space-y-6">
        <Card className="border-border/70 bg-card/95">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Draft preview</CardTitle>
            <CardDescription>See how the card will read before you publish.</CardDescription>
          </CardHeader>
          <CardContent>
            <PublishPreview state={state} />
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/95">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">How the split works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 size-4 text-primary" />
              <p>Creator posts a template with a cover image, prompt body, type, and credit price.</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 size-4 text-primary" />
              <p>Buyer pays in credits and receives a private copy in their workspace.</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 size-4 text-primary" />
              <p>Credits split automatically between the creator and the platform fee.</p>
            </div>
          </CardContent>
          <CardFooter className="pt-0">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ArrowRight className="size-4" />
              After publish, check your new item in <span className="font-medium text-foreground">My listings</span>.
            </div>
          </CardFooter>
        </Card>
      </aside>
    </div>
  );
}
