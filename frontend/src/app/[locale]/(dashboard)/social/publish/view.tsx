"use client";

import React from "react";

import {
  Calendar,
  CheckCircle2,
  Eye,
  Facebook,
  Image as ImageIcon,
  Instagram,
  Linkedin,
  Link as LinkIcon,
  MessageCircle,
  Send,
  Smile,
  Trash2,
  Twitter,
  Video,
  Wand2
} from "lucide-react";
import { AnimatePresence, m } from "framer-motion";

import { cn } from "@/lib/utils";

import { SocialDateTimePicker } from "@/components/social-hub/social-date-time-picker";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { GlassCard } from "@/components/ui/glass-card";
import type { SocialChannel } from "@/services/socialHubApi";

import { AiAssistantModal } from "./components/ai-assistant-modal";
import { SocialFeedPreview } from "./components/social-feed-preview";
import type { PublishPageViewProps } from "./publish.types";

const PLATFORM_META: Record<
  string,
  { icon: React.ComponentType<{ className?: string }>; color: string; label: string }
> = {
  facebook: { icon: Facebook, color: "#1877F2", label: "Facebook" },
  twitter: { icon: Twitter, color: "#000000", label: "X (Twitter)" },
  x: { icon: Twitter, color: "#000000", label: "X (Twitter)" },
  instagram: { icon: Instagram, color: "#E4405F", label: "Instagram" },
  linkedin: { icon: Linkedin, color: "#0A66C2", label: "LinkedIn" }
};

const isFacebookPageAccount = (account: SocialChannel) =>
  account.platform === "facebook" && account.metadata?.isPage === true;

const getTargetLabel = (account: SocialChannel) => {
  if (isFacebookPageAccount(account)) {
    return account.name || "Facebook Page";
  }

  return account.name || PLATFORM_META[account.platform]?.label || account.platform;
};

export function PublishPageView({
  state,
  selectedAccounts,
  onToggleAccount,
  onToggleScheduling,
  onPublish,
  onSaveDraft,
  onOpenAiModal,
  onCloseAiModal,
  onSetContent,
  onSetScheduledAt,
  onSetPreviewPlatform,
  onClearDraft,
  onInsertSnippet
}: PublishPageViewProps) {
  const selectedLabels = selectedAccounts.map((account) => getTargetLabel(account));
  const isDraftReady = Boolean(state.content.trim() && state.selectedAccountIds.length > 0);
  const checklist = [
    { label: "Content drafted", done: state.content.trim().length > 0 },
    { label: "At least one target selected", done: state.selectedAccountIds.length > 0 },
    { label: "Scheduling configured", done: !state.isScheduling || Boolean(state.scheduledAt) },
    { label: "Draft autosaved locally", done: true },
  ] as const;

  return (
    <div className="mx-auto flex h-full max-w-[1600px] flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold tracking-tight">Create Post</h1>
          <p className="text-sm text-muted-foreground">
            Draft, preview and schedule your content across multiple networks.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={onToggleScheduling}>
            <Calendar className="mr-2 size-4" />
            {state.isScheduling ? "Schedule" : "Post Now"}
          </Button>
          <Button variant="outline" onClick={onSaveDraft} disabled={!state.content.trim()}>
            Save Draft
          </Button>
          <Button
            onClick={onPublish}
            disabled={state.isPublishing}
            className="bg-primary text-primary-foreground shadow-lg shadow-primary/20 transition-shadow hover:shadow-primary/40"
          >
            <Send className="mr-2 size-4" />
            {state.isPublishing ? "Publishing..." : "Publish"}
          </Button>
        </div>
      </div>

      <GlassCard variant="morphism" className="border border-white/10 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Publishing snapshot</p>
            <h2 className="mt-2 text-xl font-semibold">Draft state and target pages</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              The draft is saved locally while you work. This keeps the publish flow usable even if you reload or switch away before posting.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-muted-foreground">
              {selectedAccounts.length} target{selectedAccounts.length === 1 ? '' : 's'}
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-muted-foreground">
              {state.isScheduling ? 'Scheduled' : 'Immediate'}
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-muted-foreground">
              {isDraftReady ? 'Ready to publish' : 'Needs content or targets'}
            </span>
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-background/40 p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Targets</p>
            <p className="mt-2 text-sm font-semibold">{selectedLabels.length > 0 ? selectedLabels.join(', ') : 'No page selected'}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-background/40 p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Draft</p>
            <p className="mt-2 text-sm font-semibold">{state.content.trim().length.toLocaleString()} characters</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-background/40 p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Autosave</p>
            <p className="mt-2 text-sm font-semibold">Local draft persistence enabled</p>
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_0.85fr]">
        <GlassCard variant="morphism" className="border border-white/10 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Queue readiness</p>
              <h3 className="mt-2 text-lg font-semibold">Publishing checklist</h3>
            </div>
            <span className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold",
              isDraftReady ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400",
            )}>
              {isDraftReady ? "Ready" : "Incomplete"}
            </span>
          </div>
          <div className="mt-4 space-y-3">
            {checklist.map((item) => (
              <div key={item.label} className="flex items-center gap-3 rounded-xl border border-white/10 bg-background/40 p-3">
                <div className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full border",
                  item.done ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-400" : "border-white/10 bg-white/[0.03] text-muted-foreground",
                )}>
                  <CheckCircle2 className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{item.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.done ? "Completed" : "Needs action before publishing"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard variant="morphism" className="border border-white/10 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Targeting</p>
              <h3 className="mt-2 text-lg font-semibold">Selected pages and preview mode</h3>
            </div>
            <Button variant="outline" size="sm" onClick={onClearDraft}>
              Clear draft
            </Button>
          </div>
          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-white/10 bg-background/40 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Preview platform</p>
              <p className="mt-2 text-sm font-semibold capitalize">{state.previewPlatform}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-background/40 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Targets</p>
              <p className="mt-2 text-sm font-semibold">
                {selectedLabels.length > 0 ? selectedLabels.join(", ") : "No target selected"}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-background/40 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Operational note</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Use Facebook pages as the baseline. Per-platform customisation should follow the same draft flow across the rest of the workspace.
              </p>
            </div>
          </div>
        </GlassCard>
      </div>

      {state.isScheduling && (
        <GlassCard variant="morphism" className="border border-white/10 p-4">
          <div className="mb-2 block text-xs tracking-wider text-muted-foreground uppercase">
            Scheduled Time
          </div>
          <SocialDateTimePicker
            value={state.scheduledAt}
            onChange={onSetScheduledAt}
            className="md:w-[360px]"
          />
        </GlassCard>
      )}

      <div className="grid flex-1 grid-cols-1 gap-8 overflow-hidden pt-4 lg:grid-cols-12">
        <div className="scrollbar-thin flex flex-col gap-6 overflow-auto pr-2 lg:col-span-7">
          <GlassCard variant="morphism" className="border border-white/10 p-6">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs font-bold tracking-widest text-muted-foreground text-primary/80 uppercase">
                Select Channels
              </p>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                {state.selectedAccountIds.length} Selected
              </span>
            </div>
            <div className="mb-4 rounded-xl border border-primary/10 bg-primary/5 p-3 text-xs text-muted-foreground">
              Facebook works page-first here: each Page is a separate publish target, and only page
              access tokens are saved.
            </div>
            {state.isLoadingAccounts ? (
              <p className="text-sm text-muted-foreground">Loading connected channels?</p>
            ) : state.accounts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No connected channel yet. Please connect from Social Channels first.
              </p>
            ) : (
              <div className="flex flex-wrap gap-4">
                {state.accounts.map((account) => {
                  const meta = PLATFORM_META[account.platform] ?? {
                    icon: MessageCircle,
                    color: "#6b7280",
                    label: account.platform
                  };
                  const Icon = meta.icon;
                  const isSelected = state.selectedAccountIds.includes(account.id);
                  return (
                    <button
                      key={account.id}
                      onClick={() => onToggleAccount(account)}
                      className={cn(
                        "relative flex h-14 w-auto min-w-[120px] items-center gap-2 rounded-2xl border-2 px-3 transition-all duration-300",
                        isSelected
                          ? "scale-105 border-primary shadow-xl shadow-primary/20"
                          : "border-transparent opacity-40 grayscale hover:border-white/20 hover:opacity-100 hover:grayscale-0"
                      )}
                      style={{
                        backgroundColor: isSelected ? meta.color : "rgba(255,255,255,0.05)"
                      }}
                    >
                      <Icon
                        className={cn("h-6 w-6", isSelected ? "text-white" : "text-foreground")}
                      />
                      <span
                        className={cn(
                          "truncate text-xs font-semibold",
                          isSelected ? "text-white" : "text-foreground"
                        )}
                      >
                        {getTargetLabel(account)}
                      </span>
                      {isFacebookPageAccount(account) && (
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase",
                            isSelected
                              ? "bg-white/15 text-white"
                              : "bg-white/10 text-muted-foreground"
                          )}
                        >
                          Page
                        </span>
                      )}
                      {isFacebookPageAccount(account) && (
                        <span
                          className={cn(
                            "absolute bottom-1 left-3 text-[9px] tracking-widest uppercase",
                            isSelected ? "text-white/70" : "text-muted-foreground/70"
                          )}
                        >
                          {account.platformId}
                        </span>
                      )}
                      {isSelected && (
                        <m.div
                          layoutId="check-badge"
                          className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full border-2 border-background bg-primary"
                        >
                          <CheckCircle2 className="size-4 text-primary-foreground" />
                        </m.div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </GlassCard>

          <GlassCard
            variant="morphism"
            className="group relative flex flex-1 flex-col overflow-hidden border border-white/10 p-0"
          >
            <div className="flex items-center justify-between border-b border-white/5 bg-white/[0.03] p-4">
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 transition-colors hover:bg-white/10"
                    >
                      <ImageIcon className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuLabel>Image actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onSelect={() => onInsertSnippet("![Image attachment](https://)")}
                    >
                      Insert image placeholder
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => onInsertSnippet("Add a visual hook here.")}>
                      Add caption prompt
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 transition-colors hover:bg-white/10"
                    >
                      <Video className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuLabel>Video actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => onInsertSnippet("https://video.example.com")}>
                      Insert video link placeholder
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => onInsertSnippet("Short-form video idea:")}>
                      Add video prompt
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 transition-colors hover:bg-white/10"
                    >
                      <LinkIcon className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuLabel>Link actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => onInsertSnippet("https://")}>
                      Insert link placeholder
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => onInsertSnippet("Read more: ")}>
                      Add CTA text
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 transition-colors hover:bg-white/10"
                    >
                      <Smile className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-44">
                    <DropdownMenuLabel>Emoji</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => onInsertSnippet("\u2728 ")}>
                      Sparkle
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => onInsertSnippet("\u{1F525} ")}>
                      Fire
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => onInsertSnippet("\u{1F680} ")}>
                      Rocket
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <div className="mx-2 h-4 w-px bg-white/10" />
                <Button
                  variant="secondary"
                  size="sm"
                  className="group/ai h-8 gap-2 border border-primary/20 bg-primary/20 font-bold text-primary transition-all hover:bg-primary/30"
                  onClick={onOpenAiModal}
                >
                  <Wand2 className="size-4 transition-transform group-hover/ai:rotate-12" />
                  AI Assistant
                </Button>
              </div>
              <span
                className={cn(
                  "font-mono text-[10px]",
                  state.content.length > 280 ? "font-bold text-red-500" : "text-muted-foreground"
                )}
              >
                {state.content.length} / 280
              </span>
            </div>
            <textarea
              value={state.content}
              onChange={(e) => onSetContent(e.target.value)}
              placeholder="Type your creative post here or use the AI Assistant magic?"
              className="w-full flex-1 resize-none bg-transparent p-8 text-xl leading-relaxed font-medium selection:bg-primary/30 placeholder:text-muted-foreground/20 focus:outline-none"
            />
            <div className="flex justify-end border-t border-white/5 bg-white/[0.02] p-4">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground transition-all hover:bg-red-500/10 hover:text-red-500"
                onClick={onClearDraft}
              >
                <Trash2 className="mr-2 size-4" />
                Clear Draft
              </Button>
            </div>
          </GlassCard>
        </div>

        <div className="flex flex-col gap-4 lg:col-span-5">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <Eye className="size-4 text-primary" />
              <h3 className="text-sm font-semibold tracking-wide uppercase">Live Preview</h3>
            </div>
            <div className="flex gap-1.5 rounded-lg border border-white/10 bg-white/5 p-1">
              {selectedAccounts.map((account) => (
                <button
                  key={account.id}
                  onClick={() => onSetPreviewPlatform(account.platform)}
                  title={
                    isFacebookPageAccount(account)
                      ? `Preview ${account.name || "Facebook Page"}`
                      : undefined
                  }
                  className={cn(
                    "rounded-md px-3 py-1 text-[10px] font-bold uppercase transition-all",
                    state.previewPlatform === account.platform
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  )}
                >
                  {isFacebookPageAccount(account) ? getTargetLabel(account) : account.platform}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1">
            <AnimatePresence mode="wait">
              <m.div
                key={state.previewPlatform}
                initial={{ opacity: 0, scale: 0.98, x: 10 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.98, x: -10 }}
                transition={{ duration: 0.2 }}
                className="flex h-full items-start justify-center pt-8"
              >
                <SocialFeedPreview platform={state.previewPlatform} content={state.content} />
              </m.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      <AiAssistantModal
        isOpen={state.isAiModalOpen}
        onClose={onCloseAiModal}
        onApply={onSetContent}
      />
    </div>
  );
}
