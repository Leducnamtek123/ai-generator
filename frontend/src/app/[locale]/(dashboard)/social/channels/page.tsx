"use client";

import React from "react";

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
import { socialHubApi, type SocialChannel, type SocialProvider } from "@/services/socialHubApi";

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

export default function ChannelsPage() {
  const [accounts, setAccounts] = React.useState<SocialChannel[]>([]);
  const [providers, setProviders] = React.useState<SocialProvider[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isFacebookDialogOpen, setIsFacebookDialogOpen] = React.useState(false);
  const [isRequestDialogOpen, setIsRequestDialogOpen] = React.useState(false);
  const [facebookAppId, setFacebookAppId] = React.useState("");
  const [platformRequest, setPlatformRequest] = React.useState("");

  const fetchAccounts = React.useCallback(async () => {
    try {
      const [channels, providerList] = await Promise.all([
        socialHubApi.getChannels(),
        socialHubApi.getProviders()
      ]);
      setAccounts(channels);
      setProviders(providerList);
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

  const handleConnect = async (platformId: string, params?: Record<string, string>) => {
    try {
      const { url } = await socialHubApi.getAuthUrl(platformId, params);
      window.location.assign(url);
    } catch (err) {
      console.error("Failed to initiate connection", err);
      toast.error("Failed to connect to social platform");
    }
  };

  const handleFacebookConnect = async () => {
    if (!facebookAppId) {
      toast.error("Please enter your Facebook App ID");
      return;
    }

    await handleConnect("facebook", { appId: facebookAppId });
    setIsFacebookDialogOpen(false);
  };

  const handleDisconnect = async (accountId: number) => {
    toast.promise(socialHubApi.disconnectChannel(accountId), {
      loading: "Disconnecting channel...",
      success: () => {
        fetchAccounts();
        return "Channel disconnected";
      },
      error: "Failed to disconnect channel"
    });
  };

  const handlePlatformRequestSubmit = () => {
    if (!platformRequest.trim()) {
      toast.error("Please describe the platform you need.");
      return;
    }

    toast.success("Request recorded. Our team will review the platform for future integration!");
    setPlatformRequest("");
    setIsRequestDialogOpen(false);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold tracking-tight">Social Channels</h1>
        <p className="text-muted-foreground">
          Connect and manage your social media accounts for cross-platform publishing.
        </p>
      </div>

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
          const connectedAccount = accounts.find((a) => a.platform === provider.identifier);
          const isConnected = !!connectedAccount;
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
                    <h3 className="text-lg font-bold">{meta.name}</h3>
                    <span
                      className={`text-xs ${isConnected ? "text-green-500" : "text-muted-foreground"}`}
                    >
                      {isConnected ? `Connected as ${connectedAccount.name}` : "Not Connected"}
                    </span>
                  </div>
                </div>

                <p className="mb-8 flex-1 text-sm text-muted-foreground">{meta.description}</p>

                <Button
                  variant={isConnected ? "outline" : "default"}
                  className="group w-full"
                  onClick={() => {
                    if (isConnected) {
                      void handleDisconnect(connectedAccount.id);
                      return;
                    }

                    if (provider.identifier === "facebook") {
                      setIsFacebookDialogOpen(true);
                      return;
                    }

                    void handleConnect(provider.identifier);
                  }}
                >
                  {isConnected ? (
                    "Disconnect"
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
            <h4 className="font-bold">Missing a platform?</h4>
            <p className="text-sm text-muted-foreground">
              We&apos;re constantly adding new integrations. Let us know which one you need!
            </p>
          </div>
          <Button variant="ghost" className="ml-auto" onClick={() => setIsRequestDialogOpen(true)}>
            Send Request
          </Button>
        </div>
      </div>

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
