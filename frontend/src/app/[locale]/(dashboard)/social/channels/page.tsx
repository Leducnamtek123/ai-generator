"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  CheckCircle2,
  Facebook,
  Instagram,
  Linkedin,
  MessageCircle,
  Plus,
  Twitter,
  XCircle,
  type LucideIcon
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { GlassCard } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  socialHubApi,
  type FacebookPendingConnection,
  type SocialChannel,
  type SocialProvider,
} from "@/services/socialHubApi";

const platformMeta: Record<
  string,
  { icon: LucideIcon; color: string; description: string; name: string }
> = {
  facebook: {
    icon: Facebook,
    color: "#1877F2",
    name: "Facebook Page",
    description: "Connect your Facebook pages to post updates and track interactions."
  },
  twitter: {
    icon: Twitter,
    color: "#000000",
    name: "X (Twitter)",
    description: "Publish tweets, threads and engage with your audience."
  },
  x: {
    icon: Twitter,
    color: "#000000",
    name: "X (Twitter)",
    description: "Publish tweets, threads and engage with your audience."
  },
  linkedin: {
    icon: Linkedin,
    color: "#0A66C2",
    name: "LinkedIn",
    description: "Share professional updates and articles to your LinkedIn profile or page."
  },
  instagram: {
    icon: Instagram,
    color: "#E4405F",
    name: "Instagram",
    description: "Schedule posts and reels to your Instagram business account."
  }
};

const getFacebookPageLabel = (name?: string | null) => name?.trim() || "Facebook Page";

const getPageInitials = (name?: string | null) => {
  const source = getFacebookPageLabel(name);
  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "P";
};

export default function ChannelsPage() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [accounts, setAccounts] = React.useState<SocialChannel[]>([]);
  const [providers, setProviders] = React.useState<SocialProvider[]>([]);
  const [facebookPendingConnections, setFacebookPendingConnections] = React.useState<FacebookPendingConnection[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isFacebookDialogOpen, setIsFacebookDialogOpen] = React.useState(false);
  const [isFacebookReviewDialogOpen, setIsFacebookReviewDialogOpen] = React.useState(false);
  const [facebookReviewMode, setFacebookReviewMode] = React.useState<'pending' | 'connected' | null>(null);
  const [selectedFacebookPageIds, setSelectedFacebookPageIds] = React.useState<string[]>([]);
  const [isRequestDialogOpen, setIsRequestDialogOpen] = React.useState(false);
  const [facebookAppId, setFacebookAppId] = React.useState("");
  const [facebookAppSecret, setFacebookAppSecret] = React.useState("");
  const [platformRequest, setPlatformRequest] = React.useState("");
  const [requestDraftReady, setRequestDraftReady] = React.useState(false);
  const REQUEST_DRAFT_KEY = "social-channels:request:draft";

  const fetchAccounts = React.useCallback(async () => {
    try {
      const [channels, providerList] = await Promise.all([
        socialHubApi.getChannels(),
        socialHubApi.getProviders()
      ]);
      setAccounts(channels);
      setProviders(providerList);
      const pendingConnections = await socialHubApi.getFacebookPendingConnections();
      setFacebookPendingConnections(pendingConnections);
    } catch (err) {
      console.error("Failed to fetch accounts", err);
      toast.error("Failed to load social channels");
    }
    setIsLoading(false);
  }, []);

  React.useEffect(() => {
    queueMicrotask(() => {
      void fetchAccounts();
    });
  }, [fetchAccounts]);

  React.useEffect(() => {
    const status = searchParams.get("status");
    if (status !== "success" && status !== "error") {
      return;
    }

    const platform = searchParams.get("platform");
    if (status === "success") {
      toast.success(
        platform === "facebook"
          ? "Facebook connected successfully. Review the pages returned by Meta."
          : platform
            ? `${platform.charAt(0).toUpperCase()}${platform.slice(1)} connected successfully`
          : "Social channel connected successfully",
      );
    } else {
      toast.error(
        platform
          ? `Failed to connect ${platform}`
          : "Failed to connect social channel",
      );
    }

    router.replace(pathname);
  }, [pathname, router, searchParams]);

  const handleConnect = async (platformId: string, params?: Record<string, string>) => {
    try {
      const { url } = await socialHubApi.getAuthUrl(platformId, params);
      window.location.assign(url);
    } catch (err) {
      console.error("Failed to initiate connection", err);
      toast.error("Failed to connect to social platform");
    }
  };

  const getProviderAccounts = React.useCallback(
    (platformId: string) => accounts.filter((account) => account.platform === platformId),
    [accounts],
  );

  React.useEffect(() => {
    if (facebookPendingConnections.length === 0) {
      return;
    }

    setSelectedFacebookPageIds(
      facebookPendingConnections[0]?.pages.map((page) => page.id) ?? [],
    );
    setFacebookReviewMode('pending');
    setIsFacebookReviewDialogOpen(true);
  }, [facebookPendingConnections]);

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(REQUEST_DRAFT_KEY);
      if (!raw) {
        setRequestDraftReady(true);
        return;
      }

      const parsed = JSON.parse(raw) as { platformRequest?: unknown };
      if (typeof parsed.platformRequest === "string") {
        setPlatformRequest(parsed.platformRequest);
      }
    } catch (error) {
      console.error("Failed to restore social channels request draft", error);
    } finally {
      setRequestDraftReady(true);
    }
  }, []);

  React.useEffect(() => {
    if (!requestDraftReady || !isRequestDialogOpen) {
      return;
    }

    if (!platformRequest.trim()) {
      window.localStorage.removeItem(REQUEST_DRAFT_KEY);
      return;
    }

    window.localStorage.setItem(
      REQUEST_DRAFT_KEY,
      JSON.stringify({
        version: 1,
        savedAt: new Date().toISOString(),
        platformRequest,
      }),
    );
  }, [platformRequest, requestDraftReady]);

  const activeFacebookPendingConnection = facebookPendingConnections[0];
  const facebookAccounts = getProviderAccounts("facebook");
  const hasPendingFacebookConnection = facebookPendingConnections.length > 0;
  const isFacebookReviewPending = facebookReviewMode === 'pending';
  const facebookReviewTitle = isFacebookReviewPending ? "Review Facebook Pages" : "Manage Facebook Pages";
  const facebookReviewDescription = isFacebookReviewPending
    ? "Select the Facebook pages you want to keep connected. Only the checked pages will be saved as publish targets."
    : "Select the Facebook pages you want to keep connected. Unchecked pages will be removed from your workspace.";
  const facebookReviewPages = isFacebookReviewPending
    ? activeFacebookPendingConnection?.pages ?? []
    : facebookAccounts.map((account) => ({
        id: String(account.id),
        name: account.name ?? account.platformId,
        picture: account.picture,
      }));
  const connectedCount = accounts.length;
  const facebookPageCount = facebookAccounts.length;
  const pendingFacebookPages = activeFacebookPendingConnection?.pages.length ?? 0;
  const reauthCount = accounts.filter((account) => account.needsReauth).length;

  const handleConfirmPendingFacebookPages = async () => {
    if (!activeFacebookPendingConnection) {
      return;
    }

    if (selectedFacebookPageIds.length === 0) {
      toast.error("Select at least one Facebook page to keep connected");
      return;
    }

    toast.promise(
      socialHubApi.confirmFacebookPendingConnection(
        activeFacebookPendingConnection.id,
        selectedFacebookPageIds,
      ),
      {
        loading: "Saving selected Facebook pages...",
        success: () => {
          void fetchAccounts();
          setIsFacebookReviewDialogOpen(false);
          return "Facebook pages connected";
        },
        error: "Failed to connect selected Facebook pages",
      },
    );
  };

  const handleDiscardPendingFacebookConnection = async () => {
    if (!activeFacebookPendingConnection) {
      return;
    }

    toast.promise(
      socialHubApi.discardFacebookPendingConnection(activeFacebookPendingConnection.id),
      {
        loading: "Discarding pending Facebook setup...",
        success: () => {
          void fetchAccounts();
          setIsFacebookReviewDialogOpen(false);
          return "Pending Facebook setup discarded";
        },
        error: "Failed to discard pending Facebook setup",
      },
    );
  };

  const handleSaveFacebookPages = async () => {
    if (selectedFacebookPageIds.length === 0) {
      toast.error("Select at least one Facebook page to keep connected");
      return;
    }

    const idsToRemove = facebookAccounts
      .filter((account) => !selectedFacebookPageIds.includes(String(account.id)))
      .map((account) => account.id);

    if (idsToRemove.length === 0) {
      setIsFacebookReviewDialogOpen(false);
      return;
    }

    toast.promise(handleDisconnectAccounts(idsToRemove), {
      loading: "Updating Facebook pages...",
      success: () => {
        void fetchAccounts();
        setIsFacebookReviewDialogOpen(false);
        return "Facebook pages updated";
      },
      error: "Failed to update Facebook pages",
    });
  };

  const handleDisconnectAllFacebookPages = async () => {
    if (facebookAccounts.length === 0) {
      return;
    }

    toast.promise(handleDisconnectAccounts(facebookAccounts.map((account) => account.id)), {
      loading: "Disconnecting Facebook pages...",
      success: () => {
        void fetchAccounts();
        setIsFacebookReviewDialogOpen(false);
        return "Facebook pages disconnected";
      },
      error: "Failed to disconnect Facebook pages",
    });
  };

  const handleDisconnectAccounts = async (accountIds: number[]) => {
    if (accountIds.length === 0) {
      return;
    }

    await Promise.all(accountIds.map((accountId) => socialHubApi.disconnectChannel(accountId)));
  };

  const handleFacebookConnect = async () => {
    if (!facebookAppId) {
      toast.error("Please enter your Facebook App ID");
      return;
    }

    if (!facebookAppSecret) {
      toast.error("Please enter your Facebook App Secret");
      return;
    }

    await handleConnect("facebook", {
      appId: facebookAppId,
      appSecret: facebookAppSecret,
    });
    setIsFacebookDialogOpen(false);
  };

  const handleDisconnect = async (accountId: number) => {
    toast.promise(handleDisconnectAccounts([accountId]), {
      loading: "Disconnecting channel...",
      success: () => {
        void fetchAccounts();
        return "Channel disconnected";
      },
      error: "Failed to disconnect channel",
    });
  };

  const handlePlatformRequestSubmit = () => {
    if (!platformRequest.trim()) {
      toast.error("Please describe the platform you need.");
      return;
    }

    toast.success("Request recorded. Our team will review the platform for future integration!");
    window.localStorage.removeItem(REQUEST_DRAFT_KEY);
    setPlatformRequest("");
    setIsRequestDialogOpen(false);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-semibold tracking-tight">Social Channels</h1>
        <p className="text-muted-foreground">
          Connect and manage your social media accounts for cross-platform publishing.
        </p>
        <div className="flex flex-wrap gap-2 pt-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/social">Hub overview</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/social/publish">Open Publish</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/social/inbox">Open Inbox</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <GlassCard variant="morphism" className="border border-white/10 p-5">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Connected</p>
          <div className="mt-3 text-3xl font-bold">{connectedCount}</div>
          <p className="mt-1 text-sm text-muted-foreground">Total social accounts in this workspace</p>
        </GlassCard>
        <GlassCard variant="morphism" className="border border-white/10 p-5">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Facebook pages</p>
          <div className="mt-3 text-3xl font-bold">{facebookPageCount}</div>
          <p className="mt-1 text-sm text-muted-foreground">Page-first publish targets</p>
        </GlassCard>
        <GlassCard variant="morphism" className="border border-white/10 p-5">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Pending review</p>
          <div className="mt-3 text-3xl font-bold">{pendingFacebookPages}</div>
          <p className="mt-1 text-sm text-muted-foreground">Pages waiting for selection</p>
        </GlassCard>
        <GlassCard variant="morphism" className="border border-white/10 p-5">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Reconnect</p>
          <div className="mt-3 text-3xl font-bold">{reauthCount}</div>
          <p className="mt-1 text-sm text-muted-foreground">Accounts that need token refresh</p>
        </GlassCard>
      </div>

      <GlassCard variant="morphism" className="border border-white/10 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Facebook-first onboarding</p>
            <h2 className="mt-2 text-2xl font-semibold">Review pages before they become publish targets</h2>
            <p className="mt-2 text-sm text-muted-foreground leading-6">
              The workspace is page-first: connect a Facebook Page, review the returned pages, and keep only the ones you want to publish from. Other providers follow the same workspace pattern after Facebook is established.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/social/dashboard">View Dashboard</Link>
            </Button>
            <Button asChild>
              <Link href="/social/calendar">Open Calendar</Link>
            </Button>
          </div>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-background/40 p-4">
            <p className="text-sm font-semibold">1. Connect</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Start OAuth from a provider card. Facebook asks for app credentials and returns page candidates.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-background/40 p-4">
            <p className="text-sm font-semibold">2. Review pages</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Select which Facebook pages stay active. This is the publish target list for the workspace.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-background/40 p-4">
            <p className="text-sm font-semibold">3. Keep fresh</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Reconnect accounts that need reauth before you publish or monitor interactions.
            </p>
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading social providers...</p>
        ) : null}
        {providers.map((provider, index) => {
          const meta = platformMeta[provider.identifier] ?? {
            icon: MessageCircle,
            color: "#6b7280",
            name: provider.name,
            description: "Connect this provider to publish and monitor interactions."
          };
          const connectedAccounts = getProviderAccounts(provider.identifier);
          const isConnected = connectedAccounts.length > 0;
          const isFacebookPending = provider.identifier === "facebook" && hasPendingFacebookConnection && !isConnected;
          const Icon = meta.icon;

          return (
            <motion.div
              key={provider.identifier}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <GlassCard
                variant="morphism"
                className="group relative flex h-full flex-col overflow-hidden border border-white/10 transition-all hover:border-white/20"
              >
                <div className="absolute top-0 right-0 p-4">
                  {isConnected ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-muted-foreground/30" />
                  )}
                </div>

                <div className="mb-6 flex items-center gap-4">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-xl text-white"
                    style={{ backgroundColor: meta.color }}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                <div>
                  <h3 className="text-lg font-semibold">{meta.name}</h3>
                  <span
                    className={`text-xs ${isConnected ? "text-green-500" : "text-muted-foreground"}`}
                  >
                      {isConnected
                        ? provider.identifier === "facebook"
                          ? `Connected as ${connectedAccounts.length} Facebook page${connectedAccounts.length === 1 ? "" : "s"}`
                          : `Connected as ${connectedAccounts[0]?.name ?? provider.name}`
                        : isFacebookPending
                          ? "Pending Facebook setup"
                          : "Not Connected"}
                  </span>
                </div>
                </div>

                <p className="mb-4 flex-1 text-sm text-muted-foreground">{meta.description}</p>

                {provider.identifier === "facebook" && isFacebookPending ? (
                  <div className="mb-6 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
                    <div className="text-sm font-medium text-amber-200">Facebook pages are waiting for review.</div>
                    <p className="mt-1 text-xs text-amber-100/80">
                      Meta returned page access tokens. Choose which pages you want to keep connected before anything is saved as a publish target.
                    </p>
                  </div>
                ) : null}

                {provider.identifier === "facebook" && isConnected ? (
                  <div className="mb-6 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-wider text-muted-foreground">
                      <span>Connected pages</span>
                      <button
                        type="button"
                        className="text-primary transition-colors hover:text-primary/80"
                        onClick={() => {
                          setSelectedFacebookPageIds(facebookAccounts.map((account) => String(account.id)));
                          setFacebookReviewMode('connected');
                          setIsFacebookReviewDialogOpen(true);
                        }}
                      >
                        View all
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {connectedAccounts.slice(0, 3).map((account) => (
                        <span
                          key={account.id}
                          className="flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-foreground"
                        >
                          {account.picture ? (
                            <Image
                              src={account.picture}
                              alt={account.name || "Facebook Page"}
                              width={16}
                              height={16}
                              unoptimized
                              className="h-4 w-4 rounded-full object-cover"
                            />
                          ) : (
                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/20 text-[9px] font-bold text-primary">
                              {getPageInitials(account.name)}
                            </span>
                          )}
                          <span>{getFacebookPageLabel(account.name)}</span>
                        </span>
                      ))}
                      {connectedAccounts.length > 3 ? (
                        <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-muted-foreground">
                          +{connectedAccounts.length - 3} more
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">
                      Publish from the <span className="font-medium text-foreground">Publish</span> screen and select the page you want.
                    </p>
                  </div>
                ) : null}

                <Button
                  variant={isConnected ? "outline" : "default"}
                  className="group w-full"
                  onClick={() => {
                    if (isConnected) {
                      if (provider.identifier === "facebook") {
                        setSelectedFacebookPageIds(
                          hasPendingFacebookConnection
                            ? (activeFacebookPendingConnection?.pages.map((page) => page.id) ?? [])
                            : facebookAccounts.map((account) => String(account.id)),
                        );
                        setFacebookReviewMode(hasPendingFacebookConnection ? 'pending' : 'connected');
                        setIsFacebookReviewDialogOpen(true);
                        return;
                      }

                      void handleDisconnect(connectedAccounts[0].id);
                      return;
                    }

                    if (provider.identifier === "facebook") {
                      if (hasPendingFacebookConnection) {
                        setSelectedFacebookPageIds(
                          activeFacebookPendingConnection?.pages.map((page) => page.id) ?? [],
                        );
                        setFacebookReviewMode('pending');
                        setIsFacebookReviewDialogOpen(true);
                        return;
                      }

                      setIsFacebookDialogOpen(true);
                      return;
                    }

                    void handleConnect(provider.identifier);
                  }}
                >
                  {isConnected ? (
                    provider.identifier === "facebook"
                      ? hasPendingFacebookConnection
                        ? "Review Pages"
                        : "Manage Pages"
                      : "Disconnect"
                  ) : hasPendingFacebookConnection && provider.identifier === "facebook" ? (
                    "Review Pages"
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4 transition-transform group-hover:rotate-90" />
                      Connect Account
                    </>
                  )}
                </Button>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-12 rounded-2xl border border-primary/10 bg-primary/5 p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Plus className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h4 className="font-semibold">Missing a platform?</h4>
            <p className="text-sm text-muted-foreground">
              We&apos;re constantly adding new integrations. Let us know which one you need!
            </p>
          </div>
          <Button variant="ghost" className="ml-auto" onClick={() => setIsRequestDialogOpen(true)}>
            Send Request
          </Button>
        </div>
      </div>

      <Dialog
        open={isFacebookReviewDialogOpen}
        onOpenChange={(open) => {
          setIsFacebookReviewDialogOpen(open);
          if (!open) {
            setFacebookReviewMode(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>{facebookReviewTitle}</DialogTitle>
            <DialogDescription>{facebookReviewDescription}</DialogDescription>
          </DialogHeader>
          <div className="max-h-[360px] space-y-3 overflow-auto py-2 pr-1">
            {facebookReviewPages.length > 0 ? (
              facebookReviewPages.map((page) => (
                <div
                  key={page.id}
                  className={`flex items-center justify-between rounded-xl border p-4 transition-colors ${
                    selectedFacebookPageIds.includes(page.id)
                      ? "border-primary/40 bg-primary/10"
                      : "border-white/10 bg-white/[0.03]"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 rounded border-border accent-primary"
                      checked={selectedFacebookPageIds.includes(page.id)}
                      onChange={() => {
                        setSelectedFacebookPageIds((current) =>
                          current.includes(page.id)
                            ? current.filter((id) => id !== page.id)
                            : [...current, page.id],
                        );
                      }}
                    />
                    {page.picture ? (
                      <Image
                        src={page.picture}
                        alt={page.name || "Facebook Page"}
                        width={40}
                        height={40}
                        unoptimized
                        className="mt-0.5 h-10 w-10 rounded-full object-cover ring-1 ring-white/10"
                      />
                    ) : (
                      <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                        {getPageInitials(page.name)}
                      </div>
                    )}
                    <div>
                      <div className="font-medium">{getFacebookPageLabel(page.name)}</div>
                      <div className="text-xs text-muted-foreground">Page ID: {page.id}</div>
                    </div>
                  </div>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {isFacebookReviewPending ? "Pending" : "Connected"}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                {isFacebookReviewPending
                  ? "No pending Facebook pages were returned."
                  : "No Facebook pages are connected yet."}
              </p>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            {isFacebookReviewPending ? (
              <Button variant="outline" onClick={() => void handleDiscardPendingFacebookConnection()}>
                Discard Setup
              </Button>
            ) : (
              <Button variant="destructive" onClick={() => void handleDisconnectAllFacebookPages()}>
                Disconnect All
              </Button>
            )}
            {isFacebookReviewPending ? (
              <Button onClick={() => void handleConfirmPendingFacebookPages()}>
                Connect Selected Pages
              </Button>
            ) : (
              <Button onClick={() => void handleSaveFacebookPages()}>
                Keep Selected Pages
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isFacebookDialogOpen} onOpenChange={setIsFacebookDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Connect Facebook Page</DialogTitle>
            <DialogDescription>
              Enter your Meta App ID so the backend can generate the OAuth URL using server-side
              credentials.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="facebookAppId">Facebook App ID</Label>
              <Input
                id="facebookAppId"
                placeholder="123456789012345"
                value={facebookAppId}
                onChange={(e) => setFacebookAppId(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="facebookAppSecret">Facebook App Secret</Label>
              <Input
                id="facebookAppSecret"
                type="password"
                placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
                value={facebookAppSecret}
                onChange={(e) => setFacebookAppSecret(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFacebookDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void handleFacebookConnect()}>Connect & Authorize</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Request a new platform</DialogTitle>
            <DialogDescription>
              Tell us which social platform you need and why it matters for your workflow.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <textarea
              className="min-h-[140px] w-full rounded-md border border-border bg-background p-3 text-sm"
              placeholder="Example: TikTok business account support for scheduling and analytics."
              value={platformRequest}
              onChange={(e) => setPlatformRequest(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRequestDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePlatformRequestSubmit}>Submit Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
