"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  Suspense,
  type ChangeEvent,
} from "react";
import { useSearchParams } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  User,
  Lock,
  CreditCard,
  Key,
  Bell,
  Save,
  Loader2,
  Eye,
  EyeOff,
  Trash2,
  LogOut,
  Plus,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Upload,
  Code,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/ui/dialog";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import { getFileUrl, uploadFile } from "@/lib/upload";
import {
  billingApi,
  type BillingCatalogResponse,
  type BillingWalletSummary,
} from "@/services/billingApi";
import { paymentApi, type PaymentProvider } from "@/services/paymentApi";
import { authApi } from "@/services/authApi";
import {
  socialHubApi,
  type SocialChannel,
  type SocialProvider,
} from "@/services/socialHubApi";
import {
  notificationApi,
  type NotificationCategory,
  type NotificationPreference,
} from "@/services/notificationApi";
import { developerApi, type ApiKey } from "@/services/developerApi";

type UserProfile = {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  photo?: {
    id?: string | null;
    path?: string | null;
  } | null;
};

const settingsTabs = [
  { id: "profile", label: "Profile", icon: User },
  { id: "account", label: "Account", icon: Lock },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "api", label: "API Keys", icon: Key },
] as const;

export default function SettingsPage() {
  return (
    <Suspense
      fallback={<div className="min-h-screen bg-background text-foreground" />}
    >
      <SettingsPageContent />
    </Suspense>
  );
}

function SettingsPageContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<
    (typeof settingsTabs)[number]["id"]
  >(() => {
    const tab = searchParams.get("tab");
    if (tab && settingsTabs.some((item) => item.id === tab)) {
      return tab as (typeof settingsTabs)[number]["id"];
    }
    return "profile";
  });
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const notifiedRef = useRef<string>("");

  const fetchProfile = useCallback(async () => {
    try {
      const me = await authApi.getProfile();
      setProfile({
        firstName: me?.firstName ?? "",
        lastName: me?.lastName ?? "",
        email: me?.email ?? "",
        photo: me?.photo
          ? { id: me.photo.id ?? null, path: me.photo.path ?? null }
          : null,
      });
    } catch (error) {
      console.error("Failed to fetch profile", error);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void fetchProfile();
    });
  }, [fetchProfile]);

  useEffect(() => {
    const paymentStatus = searchParams.get("paymentStatus");
    const paymentProvider = searchParams.get("paymentProvider");
    const paymentOrder = searchParams.get("paymentOrder");
    if (!paymentStatus || !paymentProvider) return;

    const notifyKey = `${paymentProvider}:${paymentOrder || ""}:${paymentStatus}`;
    if (notifiedRef.current === notifyKey) return;
    notifiedRef.current = notifyKey;

    if (paymentStatus === "paid") {
      toast.success(`Thanh toan ${paymentProvider.toUpperCase()} thanh cong`);
    } else if (paymentStatus === "pending") {
      toast.info(`Giao dich ${paymentProvider.toUpperCase()} dang cho xu ly`);
    } else {
      toast.error(`Thanh toan ${paymentProvider.toUpperCase()} that bai`);
    }
  }, [searchParams]);

  useEffect(() => {
    const paymentOrder = searchParams.get("paymentOrder");
    const paymentProvider = searchParams.get("paymentProvider");
    const paymentStatus = searchParams.get("paymentStatus");
    if (!paymentOrder || !paymentProvider || paymentStatus !== "pending")
      return;

    const checkStatus = async () => {
      try {
        const order = await paymentApi.getStatus(paymentOrder);
        if (order.status === "paid") {
          toast.success(
            `Thanh toan ${paymentProvider.toUpperCase()} da hoan tat`,
          );
        } else if (order.status === "failed" || order.status === "cancelled") {
          toast.error(`Thanh toan ${paymentProvider.toUpperCase()} that bai`);
        }
      } catch {
        // ignore status polling errors on return page
      }
    };

    void checkStatus();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-8">Settings</h1>

        <div className="flex gap-8">
          <nav className="w-[220px] shrink-0 space-y-1">
            {settingsTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
                  activeTab === tab.id
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted",
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="flex-1 min-w-0">
            {activeTab === "profile" && (
              <ProfileSettings
                key={`${profile?.email ?? "empty"}-${profile?.firstName ?? ""}-${profile?.lastName ?? ""}-${profile?.photo?.path ?? ""}`}
                profile={profile}
                onProfileRefresh={fetchProfile}
              />
            )}
            {activeTab === "account" && <AccountSettings />}
            {activeTab === "billing" && <BillingSettings />}
            {activeTab === "notifications" && <NotificationSettings />}
            {activeTab === "api" && <ApiKeySettings />}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileSettings({
  profile,
  onProfileRefresh,
}: {
  profile: UserProfile | null;
  onProfileRefresh: () => Promise<void>;
}) {
  const { data: session } = useSession();
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const [firstName, setFirstName] = useState(profile?.firstName ?? "");
  const [lastName, setLastName] = useState(profile?.lastName ?? "");
  const [email, setEmail] = useState(profile?.email ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await authApi.updateProfile({ firstName, lastName, email });
      toast.success("Profile updated");
      await onProfileRefresh();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to update profile";
      toast.error(message);
    }
    setIsSaving(false);
  };

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    setIsUploadingAvatar(true);
    try {
      const uploaded = await uploadFile(file);
      await authApi.updateProfile({ photo: { id: uploaded.id } });
      toast.success("Avatar updated");
      await onProfileRefresh();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to update avatar";
      toast.error(message);
    }
    setIsUploadingAvatar(false);
  };

  const initials = useMemo(
    () => `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase() || "U",
    [firstName, lastName],
  );

  const avatarSrc = profile?.photo?.path
    ? getFileUrl(profile.photo.path)
    : (session?.user?.image ?? null);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold mb-1">Profile</h2>
        <p className="text-sm text-muted-foreground">
          Manage your public profile information
        </p>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl overflow-hidden border border-border bg-gradient-to-br from-primary/20 to-chart-2/20 flex items-center justify-center text-2xl font-bold">
            {avatarSrc ? (
              <Avatar className="h-full w-full rounded-2xl">
                <AvatarImage
                  src={avatarSrc}
                  alt={`${firstName || "User"} avatar`}
                  className="object-cover"
                />
                <AvatarFallback className="rounded-2xl bg-transparent text-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
            ) : (
              initials
            )}
          </div>
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full shadow-lg"
            onClick={() => avatarInputRef.current?.click()}
            disabled={isUploadingAvatar}
          >
            {isUploadingAvatar ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
          </Button>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => void handleAvatarChange(event)}
          />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">
            {firstName || lastName
              ? `${firstName} ${lastName}`.trim()
              : "Profile photo"}
          </p>
          <p className="text-xs text-muted-foreground">
            Use your Google avatar if available, or upload a new one to MinIO.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            First Name
          </Label>
          <Input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="John"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Last Name
          </Label>
          <Input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Doe"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">
          Email
        </Label>
        <Input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="john@example.com"
          type="email"
        />
      </div>

      <div className="flex justify-end pt-4 border-t border-border">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save Changes
        </Button>
      </div>
    </div>
  );
}

function AccountSettings() {
  const [state, dispatch] = useReducer(
    (
      s: {
        showCurrent: boolean;
        showNext: boolean;
        currentPassword: string;
        newPassword: string;
        confirmPassword: string;
        isUpdatingPassword: boolean;
        accounts: SocialChannel[];
        providers: SocialProvider[];
        isLoadingChannels: boolean;
      },
      a:
        | { type: "setShowCurrent"; showCurrent: boolean }
        | { type: "setShowNext"; showNext: boolean }
        | { type: "setCurrentPassword"; currentPassword: string }
        | { type: "setNewPassword"; newPassword: string }
        | { type: "setConfirmPassword"; confirmPassword: string }
        | { type: "setIsUpdatingPassword"; isUpdatingPassword: boolean }
        | { type: "setAccounts"; accounts: SocialChannel[] }
        | { type: "setProviders"; providers: SocialProvider[] }
        | { type: "setIsLoadingChannels"; isLoadingChannels: boolean }
        | { type: "resetPasswords" },
    ) => {
      switch (a.type) {
        case "setShowCurrent":
          return { ...s, showCurrent: a.showCurrent };
        case "setShowNext":
          return { ...s, showNext: a.showNext };
        case "setCurrentPassword":
          return { ...s, currentPassword: a.currentPassword };
        case "setNewPassword":
          return { ...s, newPassword: a.newPassword };
        case "setConfirmPassword":
          return { ...s, confirmPassword: a.confirmPassword };
        case "setIsUpdatingPassword":
          return { ...s, isUpdatingPassword: a.isUpdatingPassword };
        case "setAccounts":
          return { ...s, accounts: a.accounts };
        case "setProviders":
          return { ...s, providers: a.providers };
        case "setIsLoadingChannels":
          return { ...s, isLoadingChannels: a.isLoadingChannels };
        case "resetPasswords":
          return {
            ...s,
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
          };
        default:
          return s;
      }
    },
    {
      showCurrent: false,
      showNext: false,
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
      isUpdatingPassword: false,
      accounts: [],
      providers: [],
      isLoadingChannels: true,
    },
  );

  const loadChannels = useCallback(async () => {
    dispatch({ type: "setIsLoadingChannels", isLoadingChannels: true });
    try {
      const [channelData, providerData] = await Promise.all([
        socialHubApi.getChannels(),
        socialHubApi.getProviders(),
      ]);
      dispatch({ type: "setAccounts", accounts: channelData });
      dispatch({ type: "setProviders", providers: providerData });
    } catch (error) {
      console.error("Failed to load social accounts", error);
      toast.error("Failed to load connected accounts");
    }
    dispatch({ type: "setIsLoadingChannels", isLoadingChannels: false });
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void loadChannels();
    });
  }, [loadChannels]);

  const updatePassword = async () => {
    if (
      !state.currentPassword ||
      !state.newPassword ||
      !state.confirmPassword
    ) {
      toast.error("Please fill all password fields.");
      return;
    }
    if (state.newPassword !== state.confirmPassword) {
      toast.error("New password and confirmation do not match.");
      return;
    }
    dispatch({ type: "setIsUpdatingPassword", isUpdatingPassword: true });
    try {
      await authApi.updateProfile({
        oldPassword: state.currentPassword,
        password: state.newPassword,
      });
      toast.success("Password updated.");
      dispatch({ type: "resetPasswords" });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to update password";
      toast.error(message);
    }
    dispatch({ type: "setIsUpdatingPassword", isUpdatingPassword: false });
  };

  const [isFbDialogOpen, setIsFbDialogOpen] = useState(false);
  const [fbAppId, setFbAppId] = useState("");
  const [isDeleteAccountDialogOpen, setIsDeleteAccountDialogOpen] =
    useState(false);

  const connectProvider = async (
    provider: string,
    params?: Record<string, string>,
  ) => {
    try {
      const { url } = await socialHubApi.getAuthUrl(provider, params);
      window.location.assign(url);
    } catch (error) {
      console.error("Failed to connect provider", error);
      toast.error("Failed to start provider connection.");
    }
  };

  const handleFbConnect = async () => {
    if (!fbAppId) {
      toast.error("Please enter your Facebook App ID");
      return;
    }
    await connectProvider("facebook", { appId: fbAppId });
    setIsFbDialogOpen(false);
  };

  const disconnectAccount = async (accountId: number) => {
    toast.promise(socialHubApi.disconnectChannel(accountId), {
      loading: "Disconnecting...",
      success: async () => {
        await loadChannels();
        return "Disconnected";
      },
      error: "Failed to disconnect",
    });
  };

  const logoutCurrentSession = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore backend logout error and continue clearing NextAuth session
    }
    await signOut({ callbackUrl: "/sign-in", redirect: true });
  };

  const deleteAccount = async () => {
    try {
      await authApi.deleteAccount();
      toast.success("Account deleted");
      await signOut({ callbackUrl: "/sign-in", redirect: true });
    } catch (error) {
      console.error("Failed to delete account", error);
      toast.error("Failed to delete account");
    }
    setIsDeleteAccountDialogOpen(false);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold mb-1">Account</h2>
        <p className="text-sm text-muted-foreground">
          Manage your account security
        </p>
      </div>

      <div className="p-6 bg-card rounded-2xl border border-border space-y-4">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Lock className="w-4 h-4" /> Change Password
        </h3>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              Current Password
            </Label>
            <div className="relative">
              <Input
                type={state.showCurrent ? "text" : "password"}
                value={state.currentPassword}
                onChange={(e) =>
                  dispatch({
                    type: "setCurrentPassword",
                    currentPassword: e.target.value,
                  })
                }
              />
              <button
                onClick={() =>
                  dispatch({
                    type: "setShowCurrent",
                    showCurrent: !state.showCurrent,
                  })
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {state.showCurrent ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              New Password
            </Label>
            <div className="relative">
              <Input
                type={state.showNext ? "text" : "password"}
                value={state.newPassword}
                onChange={(e) =>
                  dispatch({
                    type: "setNewPassword",
                    newPassword: e.target.value,
                  })
                }
              />
              <button
                onClick={() =>
                  dispatch({ type: "setShowNext", showNext: !state.showNext })
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {state.showNext ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              Confirm New Password
            </Label>
            <Input
              type="password"
              value={state.confirmPassword}
              onChange={(e) =>
                dispatch({
                  type: "setConfirmPassword",
                  confirmPassword: e.target.value,
                })
              }
            />
          </div>
        </div>
        <Button
          size="sm"
          onClick={() => void updatePassword()}
          disabled={state.isUpdatingPassword}
        >
          {state.isUpdatingPassword ? "Updating..." : "Update Password"}
        </Button>
      </div>

      <div className="p-6 bg-card rounded-2xl border border-border space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Connected Social Accounts</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void loadChannels()}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
        {state.isLoadingChannels ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : (
          state.providers.map((provider) => {
            const account = state.accounts.find(
              (item) => item.platform === provider.identifier,
            );
            const isConnected = !!account;
            return (
              <div
                key={provider.identifier}
                className="flex flex-col gap-2 py-2 border-b border-border last:border-0"
              >
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-2">
                    {isConnected ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-muted-foreground" />
                    )}
                    <span className="text-sm font-medium">
                      {provider.name}
                      {account?.name ? ` (${account.name})` : ""}
                    </span>
                  </div>
                  {isConnected ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void disconnectAccount(account.id)}
                    >
                      Disconnect
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => {
                        if (provider.identifier === "facebook") {
                          setIsFbDialogOpen(true);
                        } else {
                          void connectProvider(provider.identifier);
                        }
                      }}
                    >
                      Connect
                    </Button>
                  )}
                </div>

                {isConnected && provider.identifier === "facebook" && (
                  <div className="mt-2 p-3 bg-muted/50 rounded-xl space-y-3 text-xs">
                    <p className="font-semibold text-foreground">
                      Webhook Configuration (for Messenger/Feed)
                    </p>
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase text-muted-foreground">
                        Webhook URL
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          readOnly
                          value={`${process.env.NEXT_PUBLIC_API_URL || (typeof window !== "undefined" ? window.location.origin + "/api" : "")}/v1/triggers/messenger/webhook/${account.id}`}
                          className="h-7 text-[11px] font-mono"
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2"
                          onClick={() => {
                            navigator.clipboard.writeText(
                              `${process.env.NEXT_PUBLIC_API_URL || (typeof window !== "undefined" ? window.location.origin + "/api" : "")}/v1/triggers/messenger/webhook/${account.id}`,
                            );
                            toast.success("Copied URL");
                          }}
                        >
                          Copy
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase text-muted-foreground">
                        Verify Token
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          readOnly
                          value={account.metadata?.verifyToken || "N/A"}
                          className="h-7 text-[11px] font-mono"
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2"
                          onClick={() => {
                            navigator.clipboard.writeText(
                              account.metadata?.verifyToken || "",
                            );
                            toast.success("Copied Token");
                          }}
                        >
                          Copy
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="p-6 bg-card rounded-2xl border border-destructive/30 space-y-4">
        <h3 className="text-sm font-semibold text-destructive flex items-center gap-2">
          <Trash2 className="w-4 h-4" /> Danger Zone
        </h3>
        <p className="text-xs text-muted-foreground">
          Once deleted, your account cannot be recovered.
        </p>
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void logoutCurrentSession()}
          >
            <LogOut className="w-4 h-4 mr-2" /> Sign Out
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setIsDeleteAccountDialogOpen(true)}
          >
            <Trash2 className="w-4 h-4 mr-2" /> Delete Account
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={isDeleteAccountDialogOpen}
        onOpenChange={setIsDeleteAccountDialogOpen}
        title="Delete account permanently?"
        description="This action cannot be undone. Your account and associated data will be removed."
        confirmText="Delete Account"
        onConfirm={() => void deleteAccount()}
      />

      <Dialog open={isFbDialogOpen} onOpenChange={setIsFbDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Connect Facebook Page</DialogTitle>
            <DialogDescription>
              Enter your Meta App ID to start the connection process.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="appId">Facebook App ID</Label>
              <Input
                id="appId"
                placeholder="123456789012345"
                value={fbAppId}
                onChange={(e) => setFbAppId(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFbDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleFbConnect}>Connect & Authorize</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BillingSettings() {
  const [catalog, setCatalog] = useState<BillingCatalogResponse | null>(null);
  const [wallet, setWallet] = useState<BillingWalletSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaying, setIsPaying] = useState<string | null>(null);

  const loadBilling = useCallback(async () => {
    setIsLoading(true);
    try {
      const catalogResponse = await billingApi.getCatalog();
      setCatalog(catalogResponse);
      setWallet(await billingApi.getMe());
    } catch (error) {
      console.error("Failed to load billing summary", error);
      toast.error("Khong tai duoc du lieu billing");
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void loadBilling();
    });
  }, [loadBilling]);

  const purchase = async (
    purchaseType: "subscription" | "topup",
    itemId: string,
    provider: PaymentProvider,
  ) => {
    try {
      setIsPaying(itemId);
      const checkout = await paymentApi.checkout(
        purchaseType === "subscription"
          ? {
              purchaseType,
              planId: itemId as any,
              provider,
              returnUri: `${window.location.pathname}${window.location.search}`,
            }
          : {
              purchaseType,
              topUpPackageId: itemId as any,
              provider,
              returnUri: `${window.location.pathname}${window.location.search}`,
            },
      );
      if (!checkout.paymentUrl) {
        toast.error("Khong tao duoc URL thanh toan");
        return;
      }
      window.location.assign(checkout.paymentUrl);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Khoi tao thanh toan that bai";
      toast.error(message);
    } finally {
      setIsPaying(null);
    }
  };

  const formatDate = (value: string | null) =>
    value
      ? new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(
          new Date(value),
        )
      : "No renewal scheduled";

  const activePlan = wallet?.plan ?? null;
  const remainingCredits = wallet?.totalCredits ?? 0;
  const hasActiveSubscription = Boolean(wallet?.plan);
  const individualPlans =
    catalog?.individualPlans ??
    catalog?.plans?.filter((plan) => plan.segment === "individual") ??
    [];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold mb-1">Plan & billing</h2>
        <p className="text-sm text-muted-foreground">
          Purchase a personal plan to unlock the full toolset. Workspace
          billing is handled from the workspace billing page.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="p-6 bg-gradient-to-br from-primary/10 to-chart-2/10 rounded-2xl border border-border md:col-span-2">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Subscription
              </p>
              <p className="text-3xl font-bold">
                {activePlan?.name ?? "No active subscription"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {hasActiveSubscription
                  ? `${wallet?.status ?? "free"} - ${formatDate(wallet?.renewalAt ?? null)}`
                  : remainingCredits > 0
                    ? "Top-up credits only - purchase a plan to activate subscription benefits"
                    : "No subscription and no credits yet"}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => void loadBilling()}
              disabled={isLoading}
            >
              {isLoading ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </div>

        <div className="p-6 rounded-2xl border border-border bg-card">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            Spendable credits
          </p>
          <p className="text-4xl font-bold">{remainingCredits}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {wallet?.includedCreditsRemaining ?? 0} included +{" "}
            {wallet?.topUpCreditsBalance ?? 0} top-up
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold">Personal plans</h3>
            <p className="text-sm text-muted-foreground mt-1">
              These are the plans for individual users and single-seat billing.
            </p>
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {individualPlans.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                "p-5 rounded-2xl border bg-card space-y-3 relative",
                plan.featured
                  ? "border-primary shadow-lg shadow-primary/10"
                  : "border-border",
              )}
            >
              {plan.featured && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider rounded-full">
                  Featured
                </span>
              )}
              <span className="inline-flex rounded-full border border-border bg-muted/40 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Personal plan
              </span>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold">{plan.name}</h3>
                  <p className="text-2xl font-bold">{plan.priceLabel}</p>
                </div>
                {wallet?.plan?.id === plan.id && (
                  <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
                    Active
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {plan.monthlyCredits} credits included
              </p>
              <p className="text-sm text-muted-foreground leading-6">
                {plan.summary}
              </p>
              <ul className="space-y-2 pt-2">
                {plan.highlights.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-sm text-foreground/85"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="rounded-xl bg-muted/40 border border-border p-3">
                <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground mb-2">
                  Approximate usage
                </p>
                <div className="space-y-1 text-sm text-foreground/80">
                  {plan.usageExamples.map((item) => (
                    <p key={item}>{item}</p>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                {plan.trial ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    disabled
                  >
                    Free trial on sign-up
                  </Button>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <Button
                        variant={plan.featured ? "default" : "outline"}
                        className="w-full"
                        size="sm"
                        disabled={isPaying === plan.id}
                        onClick={() =>
                          void purchase("subscription", plan.id, "vnpay")
                        }
                      >
                        {isPaying === plan.id ? "Processing..." : "VNPAY"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isPaying === plan.id}
                        onClick={() =>
                          void purchase("subscription", plan.id, "momo")
                        }
                      >
                        MoMo
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isPaying === plan.id}
                        onClick={() =>
                          void purchase("subscription", plan.id, "zalopay")
                        }
                      >
                        ZaloPay
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isPaying === plan.id}
                        onClick={() =>
                          void purchase("subscription", plan.id, "9pay")
                        }
                      >
                        9Pay
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      disabled={isPaying === plan.id}
                      onClick={() =>
                        void purchase("subscription", plan.id, "9pay")
                      }
                    >
                      {plan.ctaLabel}
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          Workspace plans are managed from workspace billing. If you need
          shared credits or org seats, open the workspace billing screen
          instead of the personal settings page.
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-2">Optional top-up credits</h3>
        <div className="grid gap-4 md:grid-cols-3">
          {(catalog?.topUpPackages ?? []).map((pack) => (
            <div
              key={pack.id}
              className="rounded-2xl border border-border bg-card p-5 space-y-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="font-semibold">{pack.name}</h4>
                  <p className="text-2xl font-bold">{pack.priceLabel}</p>
                </div>
                <span className="rounded-full border border-border px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {pack.credits} credits
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{pack.summary}</p>
              <ul className="space-y-2">
                {pack.highlights.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-sm text-foreground/85"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="space-y-2">
                <Button
                  className="w-full"
                  size="sm"
                  disabled={isPaying === pack.id}
                  onClick={() => void purchase("topup", pack.id, "vnpay")}
                >
                  {isPaying === pack.id ? "Processing..." : "Buy top-up"}
                </Button>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isPaying === pack.id}
                    onClick={() => void purchase("topup", pack.id, "momo")}
                  >
                    MoMo
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isPaying === pack.id}
                    onClick={() => void purchase("topup", pack.id, "zalopay")}
                  >
                    ZaloPay
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isPaying === pack.id}
                    onClick={() => void purchase("topup", pack.id, "9pay")}
                  >
                    9Pay
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <div>
          <h3 className="text-sm font-semibold">Credit cost guide</h3>
          <p className="text-sm text-muted-foreground mt-1">
            This is the rule of thumb for how credits are spent across tools.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {(catalog?.creditCostGuide ?? []).map((item) => (
            <div
              key={item.group}
              className="rounded-xl border border-border px-4 py-3"
            >
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-medium">{item.group}</span>
                <span className="text-xs font-semibold text-credits">
                  {item.credits} credit{item.credits > 1 ? "s" : ""}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {item.tools.join(", ")}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-credits/20 bg-credits/10 p-4 text-sm text-credits-foreground">
        <p className="font-semibold">
          Top-up credits do not change your subscription plan.
        </p>
        <p className="mt-1 text-credits-foreground/80">
          If you want the sidebar and plan card to stop showing Free, choose one
          of the subscription plans above.
        </p>
      </div>
    </div>
  );
}

const notificationPreferenceMeta: Record<
  NotificationCategory,
  { label: string; description: string }
> = {
  payment: {
    label: "Payment",
    description: "Checkout outcomes, refunds, and credit balance changes.",
  },
  workflow: {
    label: "Workflow",
    description:
      "Execution completion, queue updates, and generation failures.",
  },
  social: {
    label: "Social",
    description: "Account connections, disconnects, and publishing activity.",
  },
  moderation: {
    label: "Moderation",
    description: "Template review, approval, and admin moderation actions.",
  },
  system: {
    label: "System",
    description: "Platform-wide notices and operational alerts.",
  },
};

function NotificationSettings() {
  const router = useRouter();
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [unreadCount, setUnreadCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const [savedPreferences, unread] = await Promise.all([
        notificationApi.getPreferences(),
        notificationApi.getUnreadCount(),
      ]);
      setPreferences(savedPreferences);
      setUnreadCount(unread.count);
    } catch (error) {
      console.error("Failed to load notification preferences", error);
      toast.error("Failed to load notification settings");
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void loadSettings();
    });
  }, [loadSettings]);

  const updatePreference = (
    category: NotificationCategory,
    key: keyof Omit<NotificationPreference, "category">,
    value: boolean,
  ) => {
    setPreferences((current) =>
      current.map((item) =>
        item.category === category ? { ...item, [key]: value } : item,
      ),
    );
  };

  const resetToDefaults = () => {
    setPreferences(
      Object.keys(notificationPreferenceMeta).map((category) => ({
        category: category as NotificationCategory,
        emailEnabled: true,
        inAppEnabled: true,
        adminAlertsEnabled: category === "moderation",
      })),
    );
  };

  const markAllRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      toast.success("All notifications marked as read");
      await loadSettings();
    } catch (error) {
      console.error("Failed to mark notifications as read", error);
      toast.error("Failed to mark all read");
    }
  };

  const savePreferences = async () => {
    setIsSaving(true);
    try {
      const saved = await notificationApi.updatePreferences(preferences);
      setPreferences(saved);
      toast.success("Notification preferences saved");
    } catch (error) {
      console.error("Failed to save notification preferences", error);
      toast.error("Failed to save notification preferences");
    }
    setIsSaving(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-lg font-semibold mb-1">Notifications</h2>
          <p className="text-sm text-muted-foreground">
            Control which event families land in email, the inbox, and admin
            alert views.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => void loadSettings()}
            disabled={isLoading}
          >
            <RefreshCw
              className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")}
            />
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/notifications")}
          >
            Open inbox
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="p-6 bg-card rounded-2xl border border-border space-y-2">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Unread
          </p>
          <p className="text-4xl font-bold">{unreadCount ?? "-"}</p>
          <p className="text-sm text-muted-foreground">
            Messages waiting in the in-app inbox.
          </p>
        </div>
        <div className="p-6 bg-card rounded-2xl border border-border space-y-2">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Channels
          </p>
          <p className="text-4xl font-bold">
            {preferences.length ||
              Object.keys(notificationPreferenceMeta).length}
          </p>
          <p className="text-sm text-muted-foreground">
            Payment, workflow, social, moderation, and system categories.
          </p>
        </div>
        <div className="p-6 bg-card rounded-2xl border border-border space-y-2">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Admin alerts
          </p>
          <p className="text-sm text-muted-foreground">
            Per-category controls for admin-facing moderation notices are saved
            here too.
          </p>
          <Button
            variant="ghost"
            className="px-0 h-auto text-primary"
            onClick={resetToDefaults}
          >
            Restore defaults
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="grid grid-cols-[1.2fr_repeat(3,minmax(0,0.95fr))] gap-4 border-b border-border px-5 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <span>Type</span>
          <span>Email</span>
          <span>In-app</span>
          <span>Admin alerts</span>
        </div>

        <div className="divide-y divide-border">
          {Object.entries(notificationPreferenceMeta).map(
            ([category, meta]) => {
              const preference = preferences.find(
                (item) => item.category === category,
              );

              return (
                <div
                  key={category}
                  className="grid grid-cols-[1.2fr_repeat(3,minmax(0,0.95fr))] gap-4 px-5 py-5"
                >
                  <div>
                    <p className="font-semibold">{meta.label}</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {meta.description}
                    </p>
                  </div>
                  <label className="flex items-center gap-3 rounded-xl border border-border px-3 py-3">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-primary"
                      checked={preference?.emailEnabled ?? true}
                      onChange={(event) =>
                        updatePreference(
                          category as NotificationCategory,
                          "emailEnabled",
                          event.target.checked,
                        )
                      }
                    />
                    <span className="text-sm">Send email</span>
                  </label>
                  <label className="flex items-center gap-3 rounded-xl border border-border px-3 py-3">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-primary"
                      checked={preference?.inAppEnabled ?? true}
                      onChange={(event) =>
                        updatePreference(
                          category as NotificationCategory,
                          "inAppEnabled",
                          event.target.checked,
                        )
                      }
                    />
                    <span className="text-sm">Show in inbox</span>
                  </label>
                  <label className="flex items-center gap-3 rounded-xl border border-border px-3 py-3">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-primary"
                      checked={
                        preference?.adminAlertsEnabled ??
                        category === "moderation"
                      }
                      onChange={(event) =>
                        updatePreference(
                          category as NotificationCategory,
                          "adminAlertsEnabled",
                          event.target.checked,
                        )
                      }
                    />
                    <span className="text-sm">Admin alert</span>
                  </label>
                </div>
              );
            },
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 justify-end">
        <Button
          variant="outline"
          onClick={() => void markAllRead()}
          disabled={isLoading}
        >
          Mark All as Read
        </Button>
        <Button
          onClick={() => void savePreferences()}
          disabled={isLoading || isSaving}
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save Preferences
        </Button>
      </div>
    </div>
  );
}

function ApiKeySettings() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  const fetchKeys = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await developerApi.getKeys();
      setKeys(data);
    } catch (error) {
      console.error("Failed to fetch keys", error);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void fetchKeys();
  }, [fetchKeys]);

  const handleGenerate = async () => {
    if (!newKeyName.trim()) {
      toast.error("Please enter a name for the key");
      return;
    }
    setIsGenerating(true);
    try {
      const newKey = await developerApi.generateKey(newKeyName);
      setKeys((prev) => [...prev, newKey]);
      setNewKeyName("");
      toast.success("API Key generated successfully");
    } catch (error) {
      toast.error("Failed to generate API Key");
    }
    setIsGenerating(false);
  };

  const handleRevoke = async (id: string) => {
    try {
      await developerApi.revokeKey(id);
      setKeys((prev) => prev.filter((k) => k.id !== id));
      toast.success("API Key revoked");
    } catch (error) {
      toast.error("Failed to revoke API Key");
    }
  };

  const toggleShow = (id: string) => {
    setShowKeys((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text: string) => {
    void navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold mb-1">Developer & MCP Settings</h2>
        <p className="text-sm text-muted-foreground">
          Manage your API keys to connect with external AI agents via Model
          Context Protocol (MCP).
        </p>
      </div>

      <div className="p-6 bg-card rounded-2xl border border-border space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex-1 space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              New Key Name
            </Label>
            <Input
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="e.g. Claude Desktop"
            />
          </div>
          <Button onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            Generate New Key
          </Button>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Your API Keys</h3>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : keys.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-border rounded-xl">
              <p className="text-sm text-muted-foreground">
                No API keys found.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {keys.map((key) => (
                <div
                  key={key.id}
                  className="p-4 bg-muted/30 rounded-xl border border-border space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {key.name || "Untitled Key"}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8"
                      onClick={() => handleRevoke(key.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Revoke
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Input
                        readOnly
                        value={
                          showKeys[key.id]
                            ? key.rawKey || key.keyPreview || key.key
                            : key.keyPreview || "Stored securely"
                        }
                        className="font-mono text-xs pr-20"
                      />
                      <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => toggleShow(key.id)}
                        >
                          {showKeys[key.id] ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() =>
                            copyToClipboard(
                              key.rawKey || key.keyPreview || key.key,
                            )
                          }
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>
                      Created: {new Date(key.createdAt).toLocaleDateString()}
                    </span>
                    <span>
                      Last used:{" "}
                      {key.lastUsedAt
                        ? new Date(key.lastUsedAt).toLocaleString()
                        : "Never"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="p-6 bg-gradient-to-br from-primary/5 to-chart-4/5 rounded-2xl border border-primary/20 space-y-4">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Code className="w-4 h-4 text-primary" /> MCP Connection Info
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          To connect your AI agents (like Claude Desktop) to this platform, use
          the following configuration in your{" "}
          <code>claude_desktop_config.json</code>:
        </p>
        <div className="relative">
          <pre className="p-4 bg-black/80 text-green-400 rounded-xl text-[11px] font-mono overflow-x-auto">
            {`{
  "mcpServers": {
    "paintai": {
      "command": "npx",
      "args": ["-y", "@paintai/mcp-server"],
      "env": {
        "API_BASE_URL": "${typeof window !== "undefined" ? window.location.origin : ""}/api/v1",
        "API_KEY": "YOUR_API_KEY_HERE"
      }
    }
  }
}`}
          </pre>
          <Button
            variant="secondary"
            size="sm"
            className="absolute top-2 right-2 h-7 text-[10px]"
            onClick={() =>
              copyToClipboard(`{
  "mcpServers": {
    "paintai": {
      "command": "npx",
      "args": ["-y", "@paintai/mcp-server"],
      "env": {
        "API_BASE_URL": "${typeof window !== "undefined" ? window.location.origin : ""}/api/v1",
        "API_KEY": "YOUR_API_KEY_HERE"
      }
    }
  }
}`)
            }
          >
            Copy Config
          </Button>
        </div>
        <div className="pt-2">
          <Button
            variant="link"
            className="p-0 h-auto text-xs text-primary"
            onClick={() => window.open("/docs/api", "_blank")}
          >
            View full documentation →
          </Button>
        </div>
      </div>
    </div>
  );
}
