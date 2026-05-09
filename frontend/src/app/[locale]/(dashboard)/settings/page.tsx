"use client";

import { Suspense, useCallback, useEffect, useMemo, useReducer, useRef, useState, type ChangeEvent } from "react";
import { useSearchParams } from "next/navigation";

import {
  Bell,
  CheckCircle2,
  Code,
  CreditCard,
  Eye,
  EyeOff,
  Key,
  Loader2,
  Lock,
  LogOut,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  Upload,
  User,
  XCircle
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

import { useRouter } from "@/i18n/navigation";
import { getFileUrl, uploadFile } from "@/lib/upload";
import { cn } from "@/lib/utils";

import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/ui/dialog";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { authApi } from "@/services/authApi";
import {
  billingApi,
  type BillingPlanId,
  type TopUpPackageId,
  type BillingCatalogResponse,
  type BillingPlanSegment,
  type BillingWalletSummary
} from "@/services/billingApi";
import { developerApi, type ApiKey } from "@/services/developerApi";
import {
  notificationApi,
  type NotificationCategory,
  type NotificationPreference
} from "@/services/notificationApi";

import { paymentApi, type PaymentProvider } from "@/services/paymentApi";
import { socialHubApi, type SocialChannel, type SocialProvider } from "@/services/socialHubApi";

type UserProfile = {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  photo?: {
    id?: string | null;
    path?: string | null;
  } | null;
};

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background text-foreground" />}>
      <SettingsPageContent />
    </Suspense>
  );
}

function SettingsPageContent() {
  const t = useTranslations("Settings");
  const searchParams = useSearchParams();
  const searchParamsSnapshot = useMemo(() => new URLSearchParams(searchParams), [searchParams]);
  const { push, replace } = useRouter();
  const settingsTabs = [
    { id: "profile", label: t("tabs.profile"), icon: User },
    { id: "account", label: t("tabs.account"), icon: Lock },
    { id: "billing", label: t("tabs.billing"), icon: CreditCard },
    { id: "notifications", label: t("tabs.notifications"), icon: Bell },
    { id: "api", label: t("tabs.apiKeys"), icon: Key }
  ] as const;
  const [activeTab, setActiveTab] = useState<(typeof settingsTabs)[number]["id"]>(() => {
    const tab = searchParamsSnapshot.get("tab");
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
        photo: me?.photo ? { id: me.photo.id ?? null, path: me.photo.path ?? null } : null
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
    const paymentStatus = searchParamsSnapshot.get("paymentStatus");
    const paymentProvider = searchParamsSnapshot.get("paymentProvider");
    const paymentOrder = searchParamsSnapshot.get("paymentOrder");
    if (!paymentStatus || !paymentProvider) return;

    const notifyKey = `${paymentProvider}:${paymentOrder || ""}:${paymentStatus}`;
    if (notifiedRef.current === notifyKey) return;
    notifiedRef.current = notifyKey;

    if (paymentStatus === "paid") {
      toast.success(t("toasts.paymentPaid", { provider: paymentProvider.toUpperCase() }));
    } else if (paymentStatus === "pending") {
      toast.info(t("toasts.paymentPending", { provider: paymentProvider.toUpperCase() }));
    } else {
      toast.error(t("toasts.paymentFailed", { provider: paymentProvider.toUpperCase() }));
    }
  }, [searchParams, t]);

  useEffect(() => {
    const paymentOrder = searchParamsSnapshot.get("paymentOrder");
    const paymentProvider = searchParamsSnapshot.get("paymentProvider");
    const paymentStatus = searchParamsSnapshot.get("paymentStatus");
    if (!paymentOrder || !paymentProvider || paymentStatus !== "pending") return;

    const checkStatus = async () => {
      try {
        const order = await paymentApi.getStatus(paymentOrder);
        if (order.status === "paid") {
          toast.success(t("toasts.paymentCompleted", { provider: paymentProvider.toUpperCase() }));
        } else if (order.status === "failed" || order.status === "cancelled") {
          toast.error(t("toasts.paymentFailed", { provider: paymentProvider.toUpperCase() }));
        }
      } catch {
        // ignore status polling errors on return page
      }
    };

    void checkStatus();
  }, [searchParams, t]);

  useEffect(() => {
    const socialStatus = searchParamsSnapshot.get("status");
    const socialPlatform = searchParamsSnapshot.get("platform");
    if (socialStatus !== "success" && socialStatus !== "error") return;

    if (socialStatus === "success") {
      toast.success(
        socialPlatform
          ? t("toasts.socialConnectedPlatform", {
              platform: `${socialPlatform.charAt(0).toUpperCase()}${socialPlatform.slice(1)}`
            })
          : t("toasts.socialConnected")
      );
    } else {
      toast.error(
        socialPlatform
          ? t("toasts.socialConnectPlatformFailed", { platform: socialPlatform })
          : t("toasts.socialConnectFailed")
      );
    }

    const nextSearchParams = new URLSearchParams(searchParamsSnapshot.toString());
    nextSearchParams.delete("status");
    nextSearchParams.delete("platform");
    const nextQuery = nextSearchParams.toString();
    replace(`${window.location.pathname}${nextQuery ? `?${nextQuery}` : ""}`);
  }, [replace, searchParams, t]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-[1200px] px-6 py-8">
        <h1 className="mb-8 text-2xl font-semibold">{t("title")}</h1>

        <div className="flex gap-8">
          <nav className="w-[220px] shrink-0 space-y-1">
            {settingsTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all",
                  activeTab === tab.id
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <tab.icon className="size-4" />
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="min-w-0 flex-1">
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
  onProfileRefresh
}: {
  profile: UserProfile | null;
  onProfileRefresh: () => Promise<void>;
}) {
  const t = useTranslations("Settings");
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
      toast.success(t("profile.toasts.updated"));
      await onProfileRefresh();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : t("profile.toasts.updateFailed");
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
      toast.success(t("profile.toasts.avatarUpdated"));
      await onProfileRefresh();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : t("profile.toasts.avatarUpdateFailed");
      toast.error(message);
    }
    setIsUploadingAvatar(false);
  };

  const initials = useMemo(
    () => `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase() || "U",
    [firstName, lastName]
  );

  const avatarSrc = profile?.photo?.path
    ? getFileUrl(profile.photo.path)
    : (session?.user?.image ?? null);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-1 text-lg font-semibold">{t("profile.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("profile.description")}</p>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative">
          <div className="flex size-20 items-center justify-center overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/20 to-chart-2/20 text-2xl font-bold">
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
            className="absolute -right-2 -bottom-2 size-8 rounded-full shadow-lg"
            onClick={() => avatarInputRef.current?.click()}
            disabled={isUploadingAvatar}
          >
            {isUploadingAvatar ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Upload className="size-4" />
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
            {firstName || lastName ? `${firstName} ${lastName}`.trim() : t("profile.photoLabel")}
          </p>
          <p className="text-xs text-muted-foreground">{t("profile.photoHint")}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="text-xs tracking-wider text-muted-foreground uppercase">
            {t("profile.firstNameLabel")}
          </Label>
          <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder={t("profile.firstNamePlaceholder")} />
        </div>
        <div className="space-y-2">
          <Label className="text-xs tracking-wider text-muted-foreground uppercase">
            {t("profile.lastNameLabel")}
          </Label>
          <Input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder={t("profile.lastNamePlaceholder")}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs tracking-wider text-muted-foreground uppercase">
          {t("profile.emailLabel")}
        </Label>
        <Input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("profile.emailPlaceholder")}
          type="email"
        />
      </div>

      <div className="flex justify-end border-t border-border pt-4">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Save className="mr-2 size-4" />
          )}
          {t("profile.save")}
        </Button>
      </div>
    </div>
  );
}

function AccountSettings() {
  const t = useTranslations("Settings");
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
        | { type: "resetPasswords" }
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
            confirmPassword: ""
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
      isLoadingChannels: true
    }
  );

  const loadChannels = useCallback(async () => {
    dispatch({ type: "setIsLoadingChannels", isLoadingChannels: true });
    try {
      const [channelData, providerData] = await Promise.all([
        socialHubApi.getChannels(),
        socialHubApi.getProviders()
      ]);
      dispatch({ type: "setAccounts", accounts: channelData });
      dispatch({ type: "setProviders", providers: providerData });
    } catch (error) {
      console.error("Failed to load social accounts", error);
      toast.error(t("account.toasts.loadConnectedAccountsFailed"));
    }
    dispatch({ type: "setIsLoadingChannels", isLoadingChannels: false });
  }, [t]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadChannels();
    });
  }, [loadChannels]);

  const updatePassword = async () => {
    if (!state.currentPassword || !state.newPassword || !state.confirmPassword) {
      toast.error(t("account.toasts.passwordFieldsRequired"));
      return;
    }
    if (state.newPassword !== state.confirmPassword) {
      toast.error(t("account.toasts.passwordMismatch"));
      return;
    }
    dispatch({ type: "setIsUpdatingPassword", isUpdatingPassword: true });
    try {
      await authApi.updateProfile({
        oldPassword: state.currentPassword,
        password: state.newPassword
      });
      toast.success(t("account.toasts.passwordUpdated"));
      dispatch({ type: "resetPasswords" });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : t("account.toasts.passwordUpdateFailed");
      toast.error(message);
    }
    dispatch({ type: "setIsUpdatingPassword", isUpdatingPassword: false });
  };

  const [isFbDialogOpen, setIsFbDialogOpen] = useState(false);
  const [fbAppId, setFbAppId] = useState("");
  const [fbAppSecret, setFbAppSecret] = useState("");
  const [isDeleteAccountDialogOpen, setIsDeleteAccountDialogOpen] = useState(false);

  const connectProvider = async (provider: string, params?: Record<string, string>) => {
    try {
      const { url } = await socialHubApi.getAuthUrl(provider, params);
      window.location.assign(url);
    } catch (error) {
      console.error("Failed to connect provider", error);
      toast.error(t("account.toasts.providerConnectionFailed"));
    }
  };

  const handleFbConnect = async () => {
    if (!fbAppId) {
      toast.error(t("account.toasts.facebookAppIdRequired"));
      return;
    }
    if (!fbAppSecret) {
      toast.error(t("account.toasts.facebookAppSecretRequired"));
      return;
    }
    await connectProvider("facebook", {
      appId: fbAppId,
      appSecret: fbAppSecret
    });
    setIsFbDialogOpen(false);
  };

  const disconnectAccount = async (accountId: number) => {
    toast.promise(socialHubApi.disconnectChannel(accountId), {
      loading: t("account.toasts.disconnecting"),
      success: async () => {
        await loadChannels();
        return t("account.toasts.disconnected");
      },
      error: t("account.toasts.disconnectFailed")
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
      toast.success(t("account.toasts.accountDeleted"));
      await signOut({ callbackUrl: "/sign-in", redirect: true });
    } catch (error) {
      console.error("Failed to delete account", error);
      toast.error(t("account.toasts.deleteAccountFailed"));
    }
    setIsDeleteAccountDialogOpen(false);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-1 text-lg font-semibold">{t("account.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("account.description")}</p>
      </div>

      <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Lock className="size-4" /> {t("account.changePassword")}
        </h3>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">{t("account.currentPassword")}</Label>
            <div className="relative">
              <Input
                type={state.showCurrent ? "text" : "password"}
                value={state.currentPassword}
                onChange={(e) =>
                  dispatch({
                    type: "setCurrentPassword",
                    currentPassword: e.target.value
                  })
                }
              />
              <button
                onClick={() =>
                  dispatch({
                    type: "setShowCurrent",
                    showCurrent: !state.showCurrent
                  })
                }
                className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {state.showCurrent ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">{t("account.newPassword")}</Label>
            <div className="relative">
              <Input
                type={state.showNext ? "text" : "password"}
                value={state.newPassword}
                onChange={(e) =>
                  dispatch({
                    type: "setNewPassword",
                    newPassword: e.target.value
                  })
                }
              />
              <button
                onClick={() => dispatch({ type: "setShowNext", showNext: !state.showNext })}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {state.showNext ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">{t("account.confirmPassword")}</Label>
            <Input
              type="password"
              value={state.confirmPassword}
              onChange={(e) =>
                dispatch({
                  type: "setConfirmPassword",
                  confirmPassword: e.target.value
                })
              }
            />
          </div>
        </div>
        <Button size="sm" onClick={() => void updatePassword()} disabled={state.isUpdatingPassword}>
          {state.isUpdatingPassword ? t("account.updatingPassword") : t("account.updatePassword")}
        </Button>
      </div>

      <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">{t("account.connectedAccounts")}</h3>
          <Button variant="outline" size="sm" onClick={() => void loadChannels()}>
            <RefreshCw className="mr-2 size-4" />
            {t("account.refresh")}
          </Button>
        </div>
        {state.isLoadingChannels ? (
          <p className="text-sm text-muted-foreground">{t("account.loading")}</p>
        ) : (
          state.providers.map((provider) => {
            const account = state.accounts.find((item) => item.platform === provider.identifier);
            const isConnected = !!account;
            const verifyToken =
              account && typeof account.metadata?.verifyToken === "string" && account.metadata.verifyToken
                ? account.metadata.verifyToken
                : "N/A";
            const webhookUrl = `${
              process.env.NEXT_PUBLIC_API_URL ||
              (typeof window !== "undefined" ? window.location.origin + "/api" : "")
            }/v1/triggers/messenger/webhook/${account?.id ?? ""}`;

            return (
              <div
                key={provider.identifier}
                className="flex flex-col gap-2 border-b border-border py-2 last:border-0"
              >
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-2">
                    {isConnected ? (
                      <CheckCircle2 className="size-4 text-green-500" />
                    ) : (
                      <XCircle className="size-4 text-muted-foreground" />
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
                      {t("account.disconnect")}
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
                      {t("account.connect")}
                    </Button>
                  )}
                </div>

                {isConnected && provider.identifier === "facebook" && (
                  <div className="mt-2 space-y-3 rounded-xl bg-muted/50 p-3 text-xs">
                    <p className="font-semibold text-foreground">
                      {t("account.webhookConfigurationTitle")}
                    </p>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground uppercase">
                        {t("account.webhookUrl")}
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          readOnly
                          value={webhookUrl}
                          className="h-7 font-mono text-[11px]"
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2"
                          onClick={() => {
                            navigator.clipboard.writeText(webhookUrl);
                            toast.success(t("account.copiedUrl"));
                          }}
                        >
                          {t("account.copy")}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground uppercase">
                        {t("account.verifyToken")}
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          readOnly
                          value={verifyToken}
                          className="h-7 font-mono text-[11px]"
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2"
                          onClick={() => {
                            navigator.clipboard.writeText(verifyToken === "N/A" ? "" : verifyToken);
                            toast.success(t("account.copiedToken"));
                          }}
                        >
                          {t("account.copy")}
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

      <div className="space-y-4 rounded-2xl border border-destructive/30 bg-card p-6">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-destructive">
          <Trash2 className="size-4" /> {t("account.dangerZone")}
        </h3>
        <p className="text-xs text-muted-foreground">
          {t("account.dangerZoneDescription")}
        </p>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={() => void logoutCurrentSession()}>
            <LogOut className="mr-2 size-4" /> {t("account.signOut")}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setIsDeleteAccountDialogOpen(true)}
          >
            <Trash2 className="mr-2 size-4" /> {t("account.deleteAccount")}
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={isDeleteAccountDialogOpen}
        onOpenChange={setIsDeleteAccountDialogOpen}
        title={t("account.deleteConfirmTitle")}
        description={t("account.deleteConfirmDescription")}
        confirmText={t("account.deleteConfirmAction")}
        onConfirm={() => void deleteAccount()}
      />

      <Dialog open={isFbDialogOpen} onOpenChange={setIsFbDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("account.facebookDialog.title")}</DialogTitle>
            <DialogDescription>
              {t("account.facebookDialog.description")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="appId">{t("account.facebookDialog.appId")}</Label>
              <Input
                id="appId"
                placeholder={t("account.facebookDialog.appIdPlaceholder")}
                value={fbAppId}
                onChange={(e) => setFbAppId(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="appSecret">{t("account.facebookDialog.appSecret")}</Label>
              <Input
                id="appSecret"
                type="password"
                placeholder={t("account.facebookDialog.appSecretPlaceholder")}
                value={fbAppSecret}
                onChange={(e) => setFbAppSecret(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFbDialogOpen(false)}>
              {t("account.facebookDialog.cancel")}
            </Button>
            <Button onClick={handleFbConnect}>{t("account.facebookDialog.connect")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BillingSettings() {
  const t = useTranslations("Settings");
  const locale = useLocale();
  const [catalog, setCatalog] = useState<BillingCatalogResponse | null>(null);
  const [wallet, setWallet] = useState<BillingWalletSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaying, setIsPaying] = useState<string | null>(null);
  const [segment, setSegment] = useState<BillingPlanSegment>("individual");

  const loadBilling = useCallback(async () => {
    setIsLoading(true);
    try {
      const catalogResponse = await billingApi.getCatalog();
      setCatalog(catalogResponse);
      setWallet(await billingApi.getMe());
    } catch (error) {
      console.error("Failed to load billing summary", error);
      toast.error(t("billing.toasts.loadFailed"));
    }
    setIsLoading(false);
  }, [t]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadBilling();
    });
  }, [loadBilling]);

  const purchase = async (
    purchaseType: "subscription" | "topup",
    itemId: string,
    provider: PaymentProvider
  ) => {
    const planId = itemId as BillingPlanId;
    const topUpPackageId = itemId as TopUpPackageId;
    try {
      setIsPaying(itemId);
      const checkout = await paymentApi.checkout(
        purchaseType === "subscription"
          ? {
              purchaseType,
              planId,
              provider,
              returnUri: `${window.location.pathname}${window.location.search}`
            }
          : {
              purchaseType,
              topUpPackageId,
              provider,
              returnUri: `${window.location.pathname}${window.location.search}`
            }
      );
      if (!checkout.paymentUrl) {
        toast.error(t("billing.toasts.paymentUrlMissing"));
        return;
      }
      window.location.assign(checkout.paymentUrl);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : t("billing.toasts.checkoutFailed");
      toast.error(message);
    } finally {
      setIsPaying(null);
    }
  };

  const formatDate = (value: string | null) =>
    value ? new Date(value).toLocaleDateString(locale, { dateStyle: "medium" }) : t("billing.noRenewalScheduled");

  const activePlan = wallet?.plan ?? null;
  const remainingCredits = wallet?.totalCredits ?? 0;
  const hasActiveSubscription = Boolean(wallet?.plan);
  const individualPlans =
    catalog?.individualPlans ??
    catalog?.plans?.filter((plan) => plan.segment === "individual") ??
    [];
  const workspacePlans =
    catalog?.teamPlans ?? catalog?.plans?.filter((plan) => plan.segment === "team") ?? [];
  const visiblePlans = segment === "individual" ? individualPlans : workspacePlans;
  const segmentMeta: Record<BillingPlanSegment, { label: string; title: string; description: string }> = {
    individual: {
      label: t("billing.segment.individual.label"),
      title: t("billing.segment.individual.title"),
      description: t("billing.segment.individual.description")
    },
    team: {
      label: t("billing.segment.team.label"),
      title: t("billing.segment.team.title"),
      description: t("billing.segment.team.description")
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="mb-1 text-lg font-semibold">{t("billing.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("billing.description")}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/10 to-chart-2/10 p-6 md:col-span-2">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-1 text-xs tracking-wider text-muted-foreground uppercase">
                {t("billing.subscriptionLabel")}
              </p>
              <p className="text-3xl font-bold">{activePlan?.name ?? t("billing.noActiveSubscription")}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {hasActiveSubscription
                  ? `${wallet?.status ?? t("billing.freeStatus")} - ${formatDate(wallet?.renewalAt ?? null)}`
                  : remainingCredits > 0
                    ? t("billing.topUpOnly")
                    : t("billing.noSubscriptionNoCredits")}
              </p>
            </div>
            <Button variant="outline" onClick={() => void loadBilling()} disabled={isLoading}>
              {isLoading ? t("billing.refreshing") : t("billing.refresh")}
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="mb-1 text-xs tracking-wider text-muted-foreground uppercase">
            {t("billing.spendableCredits")}
          </p>
          <p className="text-4xl font-bold">{remainingCredits}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {wallet?.includedCreditsRemaining ?? 0} {t("billing.includedCredits")} + {wallet?.topUpCreditsBalance ?? 0}{" "}
            {t("billing.topUp")}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              {t("billing.compareScope")}
            </div>
            <h3 className="mt-1 text-sm font-semibold">{segmentMeta[segment].title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{segmentMeta[segment].description}</p>
          </div>

          <div className="inline-flex w-fit rounded-full border border-border bg-muted p-1">
            {(Object.keys(segmentMeta) as BillingPlanSegment[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setSegment(item)}
                className={cn(
                  "rounded-full px-4 py-2 text-xs font-semibold tracking-[0.22em] uppercase transition-colors",
                  segment === item
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {segmentMeta[item].label}
              </button>
            ))}
          </div>
        </div>

        {visiblePlans.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
            {t("billing.noPlanData")}
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {visiblePlans.map((plan) => (
              <div
                key={plan.id}
                className={cn(
                  "relative space-y-3 rounded-2xl border bg-card p-5",
                  plan.featured ? "border-primary shadow-lg shadow-primary/10" : "border-border"
                )}
              >
                {plan.featured && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-[10px] font-bold tracking-wider text-primary-foreground uppercase">
                    {t("billing.featured")}
                  </span>
                )}
                <span className="inline-flex rounded-full border border-border bg-muted/40 px-2.5 py-1 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                  {segmentMeta[segment].label} {t("billing.plan")}
                </span>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold">{plan.name}</h3>
                    <p className="text-2xl font-bold">{plan.priceLabel}</p>
                  </div>
                  {wallet?.plan?.id === plan.id && (
                    <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold tracking-wider text-primary uppercase">
                      {t("billing.active")}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {plan.monthlyCredits} {t("billing.creditsIncluded")}
                </p>
                <p className="text-sm leading-6 text-muted-foreground">{plan.summary}</p>
                <ul className="space-y-2 pt-2">
                  {plan.highlights.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-foreground/85">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-400" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="rounded-xl border border-border bg-muted/40 p-3">
                  <p className="mb-2 text-[11px] tracking-[0.24em] text-muted-foreground uppercase">
                    {t("billing.approximateUsage")}
                  </p>
                  <div className="space-y-1 text-sm text-foreground/80">
                    {plan.usageExamples.map((item) => (
                      <p key={item}>{item}</p>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  {plan.trial ? (
                    <Button variant="outline" size="sm" className="w-full" disabled>
                      {t("billing.freeTrial")}
                    </Button>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        <Button
                          variant={plan.featured ? "default" : "outline"}
                          className="w-full"
                          size="sm"
                          disabled={isPaying === plan.id}
                          onClick={() => void purchase("subscription", plan.id, "vnpay")}
                        >
                          {isPaying === plan.id ? t("billing.processing") : "VNPAY"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isPaying === plan.id}
                          onClick={() => void purchase("subscription", plan.id, "momo")}
                        >
                          MoMo
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isPaying === plan.id}
                          onClick={() => void purchase("subscription", plan.id, "zalopay")}
                        >
                          ZaloPay
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isPaying === plan.id}
                          onClick={() => void purchase("subscription", plan.id, "9pay")}
                        >
                          9Pay
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full"
                        disabled={isPaying === plan.id}
                        onClick={() => void purchase("subscription", plan.id, "9pay")}
                      >
                        {plan.ctaLabel}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="rounded-2xl border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          {t("billing.workspacePlansNote")}
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold">{t("billing.topUpCreditsTitle")}</h3>
        <div className="grid gap-4 md:grid-cols-3">
          {(catalog?.topUpPackages ?? []).map((pack) => (
            <div key={pack.id} className="space-y-3 rounded-2xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="font-semibold">{pack.name}</h4>
                  <p className="text-2xl font-bold">{pack.priceLabel}</p>
                </div>
                <span className="rounded-full border border-border px-2 py-1 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                  {pack.credits} {t("billing.credits")}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{pack.summary}</p>
              <ul className="space-y-2">
                {pack.highlights.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-foreground/85">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-400" />
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
                  {isPaying === pack.id ? t("billing.processing") : t("billing.buyTopUp")}
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

      <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <div>
          <h3 className="text-sm font-semibold">{t("billing.creditCostGuide.title")}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("billing.creditCostGuide.description")}
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {(catalog?.creditCostGuide ?? []).map((item) => (
            <div key={item.group} className="rounded-xl border border-border px-4 py-3">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-medium">{item.group}</span>
                <span className="text-xs font-semibold text-credits">
                  {item.credits} {t("billing.creditUnit", { count: item.credits })}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{item.tools.join(", ")}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-credits/20 bg-credits/10 p-4 text-sm text-credits-foreground">
        <p className="font-semibold">{t("billing.topUpNoticeTitle")}</p>
        <p className="mt-1 text-credits-foreground/80">
          {t("billing.topUpNoticeDescription")}
        </p>
      </div>
    </div>
  );
}

function NotificationSettings() {
  const t = useTranslations("Settings");
  const { push } = useRouter();
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [unreadCount, setUnreadCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const [savedPreferences, unread] = await Promise.all([
        notificationApi.getPreferences(),
        notificationApi.getUnreadCount()
      ]);
      setPreferences(savedPreferences);
      setUnreadCount(unread.count);
    } catch (error) {
      console.error("Failed to load notification preferences", error);
      toast.error(t("notifications.toasts.loadFailed"));
    }
    setIsLoading(false);
  }, [t]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadSettings();
    });
  }, [loadSettings]);

  const updatePreference = (
    category: NotificationCategory,
    key: keyof Omit<NotificationPreference, "category">,
    value: boolean
  ) => {
    setPreferences((current) =>
      current.map((item) => (item.category === category ? { ...item, [key]: value } : item))
    );
  };

  const notificationPreferenceMeta = useMemo(
    () =>
      ({
        payment: {
          label: t("notifications.categories.payment.label"),
          description: t("notifications.categories.payment.description")
        },
        workflow: {
          label: t("notifications.categories.workflow.label"),
          description: t("notifications.categories.workflow.description")
        },
        social: {
          label: t("notifications.categories.social.label"),
          description: t("notifications.categories.social.description")
        },
        moderation: {
          label: t("notifications.categories.moderation.label"),
          description: t("notifications.categories.moderation.description")
        },
        system: {
          label: t("notifications.categories.system.label"),
          description: t("notifications.categories.system.description")
        }
      }) satisfies Record<NotificationCategory, { label: string; description: string }>,
    [t]
  );

  const resetToDefaults = () => {
    setPreferences(
      Object.keys(notificationPreferenceMeta).map((category) => ({
        category: category as NotificationCategory,
        emailEnabled: true,
        inAppEnabled: true,
        adminAlertsEnabled: category === "moderation"
      }))
    );
  };

  const markAllRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      toast.success(t("notifications.toasts.markAllReadSuccess"));
      await loadSettings();
    } catch (error) {
      console.error("Failed to mark notifications as read", error);
      toast.error(t("notifications.toasts.markAllReadFailed"));
    }
  };

  const savePreferences = async () => {
    setIsSaving(true);
    try {
      const saved = await notificationApi.updatePreferences(preferences);
      setPreferences(saved);
      toast.success(t("notifications.toasts.saveSuccess"));
    } catch (error) {
      console.error("Failed to save notification preferences", error);
      toast.error(t("notifications.toasts.saveFailed"));
    }
    setIsSaving(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="mb-1 text-lg font-semibold">{t("notifications.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("notifications.description")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => void loadSettings()} disabled={isLoading}>
            <RefreshCw className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")} />
            {t("notifications.refresh")}
          </Button>
          <Button variant="outline" onClick={() => push("/notifications")}>
            {t("notifications.openInbox")}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2 rounded-2xl border border-border bg-card p-6">
          <p className="text-xs tracking-wider text-muted-foreground uppercase">{t("notifications.unread")}</p>
          <p className="text-4xl font-bold">{unreadCount ?? "-"}</p>
          <p className="text-sm text-muted-foreground">{t("notifications.unreadDescription")}</p>
        </div>
        <div className="space-y-2 rounded-2xl border border-border bg-card p-6">
          <p className="text-xs tracking-wider text-muted-foreground uppercase">{t("notifications.channels")}</p>
          <p className="text-4xl font-bold">
            {preferences.length || Object.keys(notificationPreferenceMeta).length}
          </p>
          <p className="text-sm text-muted-foreground">{t("notifications.channelsDescription")}</p>
        </div>
        <div className="space-y-2 rounded-2xl border border-border bg-card p-6">
          <p className="text-xs tracking-wider text-muted-foreground uppercase">
            {t("notifications.adminAlerts")}
          </p>
          <p className="text-sm text-muted-foreground">{t("notifications.adminAlertsDescription")}</p>
          <Button variant="ghost" className="h-auto px-0 text-primary" onClick={resetToDefaults}>
            {t("notifications.restoreDefaults")}
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="grid grid-cols-[1.2fr_repeat(3,minmax(0,0.95fr))] gap-4 border-b border-border px-5 py-4 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          <span>{t("notifications.table.type")}</span>
          <span>{t("notifications.table.email")}</span>
          <span>{t("notifications.table.inApp")}</span>
          <span>{t("notifications.table.adminAlerts")}</span>
        </div>

        <div className="divide-y divide-border">
          {Object.entries(notificationPreferenceMeta).map(([category, meta]) => {
            const preference = preferences.find((item) => item.category === category);

            return (
              <div
                key={category}
                className="grid grid-cols-[1.2fr_repeat(3,minmax(0,0.95fr))] gap-4 p-5"
              >
                <div>
                  <p className="font-semibold">{meta.label}</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{meta.description}</p>
                </div>
                <label className="flex items-center gap-3 rounded-xl border border-border p-3">
                  <input
                    type="checkbox"
                    className="size-4 accent-primary"
                    checked={preference?.emailEnabled ?? true}
                    onChange={(event) =>
                      updatePreference(
                        category as NotificationCategory,
                        "emailEnabled",
                        event.target.checked
                      )
                    }
                  />
                  <span className="text-sm">{t("notifications.actions.sendEmail")}</span>
                </label>
                <label className="flex items-center gap-3 rounded-xl border border-border p-3">
                  <input
                    type="checkbox"
                    className="size-4 accent-primary"
                    checked={preference?.inAppEnabled ?? true}
                    onChange={(event) =>
                      updatePreference(
                        category as NotificationCategory,
                        "inAppEnabled",
                        event.target.checked
                      )
                    }
                  />
                  <span className="text-sm">{t("notifications.actions.showInInbox")}</span>
                </label>
                <label className="flex items-center gap-3 rounded-xl border border-border p-3">
                  <input
                    type="checkbox"
                    className="size-4 accent-primary"
                    checked={preference?.adminAlertsEnabled ?? category === "moderation"}
                    onChange={(event) =>
                      updatePreference(
                        category as NotificationCategory,
                        "adminAlertsEnabled",
                        event.target.checked
                      )
                    }
                  />
                  <span className="text-sm">{t("notifications.actions.adminAlert")}</span>
                </label>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-3">
        <Button variant="outline" onClick={() => void markAllRead()} disabled={isLoading}>
          {t("notifications.markAllRead")}
        </Button>
        <Button onClick={() => void savePreferences()} disabled={isLoading || isSaving}>
          {isSaving ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Save className="mr-2 size-4" />
          )}
          {t("notifications.savePreferences")}
        </Button>
      </div>
    </div>
  );
}

function ApiKeySettings() {
  const t = useTranslations("Settings");
  const locale = useLocale();
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
    queueMicrotask(() => {
      void fetchKeys();
    });
  }, [fetchKeys]);

  const handleGenerate = async () => {
    if (!newKeyName.trim()) {
      toast.error(t("apiKeys.toasts.nameRequired"));
      return;
    }
    setIsGenerating(true);
    try {
      const newKey = await developerApi.generateKey(newKeyName);
      setKeys((prev) => [...prev, newKey]);
      setNewKeyName("");
      toast.success(t("apiKeys.toasts.generateSuccess"));
    } catch (error) {
      toast.error(t("apiKeys.toasts.generateFailed"));
    }
    setIsGenerating(false);
  };

  const handleRevoke = async (id: string) => {
    try {
      await developerApi.revokeKey(id);
      setKeys((prev) => prev.filter((k) => k.id !== id));
      toast.success(t("apiKeys.toasts.revokeSuccess"));
    } catch (error) {
      toast.error(t("apiKeys.toasts.revokeFailed"));
    }
  };

  const toggleShow = (id: string) => {
    setShowKeys((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text: string) => {
    void navigator.clipboard.writeText(text);
    toast.success(t("apiKeys.toasts.copied"));
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-1 text-lg font-semibold">{t("apiKeys.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("apiKeys.description")}</p>
      </div>

      <div className="space-y-6 rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex-1  gap-y-2">
            <Label className="text-xs tracking-wider text-muted-foreground uppercase">
              {t("apiKeys.newKeyName")}
            </Label>
            <Input
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder={t("apiKeys.newKeyNamePlaceholder")}
            />
          </div>
          <Button onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Plus className="mr-2 size-4" />
            )}
            {t("apiKeys.generate")}
          </Button>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold">{t("apiKeys.yourKeys")}</h3>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : keys.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border py-8 text-center">
              <p className="text-sm text-muted-foreground">{t("apiKeys.noKeys")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {keys.map((key) => (
                <div
                  key={key.id}
                  className="space-y-3 rounded-xl border border-border bg-muted/30 p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{key.name || t("apiKeys.untitledKey")}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => handleRevoke(key.id)}
                    >
                      <Trash2 className="mr-2 size-4" />
                      {t("apiKeys.revoke")}
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Input
                        readOnly
                        value={
                          showKeys[key.id]
                            ? key.rawKey || key.keyPreview || key.key
                            : key.keyPreview || t("apiKeys.storedSecurely")
                        }
                        className="pr-20 font-mono text-xs"
                      />
                      <div className="absolute top-1/2 right-1 flex -translate-y-1/2 items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          onClick={() => toggleShow(key.id)}
                        >
                          {showKeys[key.id] ? (
                            <EyeOff className="size-3.5" />
                          ) : (
                            <Eye className="size-3.5" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          onClick={() => copyToClipboard(key.rawKey || key.keyPreview || key.key)}
                        >
                          <RefreshCw className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>
                      {t("apiKeys.created")}: {new Date(key.createdAt).toLocaleDateString(locale)}
                    </span>
                    <span>
                      {t("apiKeys.lastUsed")}:{" "}
                      {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleString(locale) : t("apiKeys.never")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-chart-4/5 p-6">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Code className="size-4 text-primary" /> {t("apiKeys.mcpTitle")}
        </h3>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {t("apiKeys.mcpDescription")} <code>claude_desktop_config.json</code>:
        </p>
        <div className="relative">
          <pre className="overflow-x-auto rounded-xl bg-black/80 p-4 font-mono text-[11px] text-green-400">
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
            {t("apiKeys.copyConfig")}
          </Button>
        </div>
        <div className="pt-2">
          <Button
            variant="link"
            className="h-auto p-0 text-xs text-primary"
            onClick={() => window.open("/docs/api", "_blank")}
          >
            {t("apiKeys.viewDocs")}
          </Button>
        </div>
      </div>
    </div>
  );
}
