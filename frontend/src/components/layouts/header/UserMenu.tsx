"use client";

import { useEffect, useState } from "react";

import {
  ChevronRight,
  Code,
  CreditCard,
  Languages,
  Layers,
  LifeBuoy,
  LogOut,
  Moon,
  Settings,
  User
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";

import { LOCALES, type LocaleCode } from "@/constants/i18n";
import { env } from "@/env";

import { usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import { useOrgStore } from "@/stores/org-store";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/ui/button";
import { useAuth } from "@/providers";
import { billingApi } from "@/services/billingApi";

export function UserMenu() {
  const { user, logout } = useAuth();
  const { setTheme, theme: currentTheme, resolvedTheme } = useTheme();
  const locale = useLocale();
  const t = useTranslations("UserMenu");
  const { push, replace, refresh } = useRouter();
  const pathname = usePathname();
  const currentOrg = useOrgStore((state) => state.currentOrg);
  const currentOrgSlug = currentOrg?.slug ?? "";
  const [billingLabel, setBillingLabel] = useState("Personal");
  const isOrgRoute = /\/orgs\/[^/]+/.test(pathname);
  const hasWorkspaceContext = Boolean(isOrgRoute && currentOrgSlug);

  useEffect(() => {
    let active = true;
    void (hasWorkspaceContext ? billingApi.get(currentOrgSlug) : billingApi.getMe())
      .then((summary) => {
        if (active) {
          if ("wallet" in summary) {
            setBillingLabel(
              hasWorkspaceContext
                ? summary.plan?.name ||
                    (summary.wallet.totalCredits > 0 ? "Credits only" : "Workspace")
                : summary.plan?.name ||
                    (summary.wallet.totalCredits > 0 ? "Credits only" : "Personal")
            );
          } else {
            setBillingLabel(
              hasWorkspaceContext
                ? summary.plan?.name || (summary.totalCredits > 0 ? "Credits only" : "Workspace")
                : summary.plan?.name || (summary.totalCredits > 0 ? "Credits only" : "Personal")
            );
          }
        }
      })
      .catch(() => {
        if (active) {
          setBillingLabel(hasWorkspaceContext ? "Workspace" : "Personal");
        }
      });
    return () => {
      active = false;
    };
  }, [currentOrgSlug, hasWorkspaceContext]);

  const goTo = (href: string) => {
    push(href);
  };

  const billingHref = hasWorkspaceContext
    ? `/orgs/${currentOrgSlug}/billing`
    : "/settings?tab=billing";
  const billingButtonLabel = hasWorkspaceContext ? t("billing.workspace") : t("billing.personal");
  const secondaryActionLabel = hasWorkspaceContext
    ? t("secondaryAction.workspace")
    : t("secondaryAction.personal");
  const secondaryActionHref = hasWorkspaceContext ? "/settings?tab=billing" : "/orgs/new";

  const openHelpCenter = () => {
    window.open(
      `${env.NEXT_PUBLIC_GITHUB_URL.replace(/\/$/, "")}/issues`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center outline-none">
          <Avatar className="size-8 cursor-pointer rounded-full border border-border ring-border transition-all hover:ring-2">
            <AvatarImage src={user.avatar} />
            <AvatarFallback className="bg-primary text-[10px] font-bold text-primary-foreground uppercase">
              {user.username.substring(0, 1)}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuPortal>
        <DropdownMenuContent align="end" sideOffset={8} className="w-72 p-2">
          {/* User Info Section */}
          <div className="flex items-center gap-3 p-3">
            <Avatar className="size-10 rounded-lg">
              <AvatarImage src={user.avatar} />
              <AvatarFallback className="bg-primary text-xs font-bold text-primary-foreground uppercase">
                {user.username.substring(0, 1)}
              </AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-semibold">{user.username}</span>
              <span className="truncate text-[11px] text-muted-foreground">{user.email}</span>
            </div>
          </div>

          <div className="space-y-2 px-2 py-3">
            <Button
              className="h-9 w-full rounded-lg bg-pricing text-xs font-semibold text-pricing-foreground hover:bg-pricing/90"
              onClick={() => goTo(billingHref)}
            >
              {billingButtonLabel}
            </Button>
            <Button
              variant="secondary"
              className="h-9 w-full rounded-lg text-xs font-semibold"
              onClick={() => goTo(secondaryActionHref)}
            >
              {secondaryActionLabel}
            </Button>
          </div>

          <DropdownMenuSeparator />

          <DropdownMenuGroup className="py-1">
            <DropdownMenuItem
              className="flex cursor-pointer items-center justify-between rounded-lg px-3 py-2.5"
              onClick={() => {
                if (hasWorkspaceContext) {
                  goTo(`/orgs/${currentOrgSlug}/billing`);
                  return;
                }
                goTo("/settings?tab=billing");
              }}
            >
              <div className="flex items-center gap-3">
                <CreditCard className="size-4" />
                <span className="text-sm font-medium">{billingButtonLabel}</span>
              </div>
              <span className="rounded border border-border bg-muted px-1.5 py-0.5 text-[9px] font-bold text-muted-foreground uppercase">
                {billingLabel}
              </span>
            </DropdownMenuItem>

            <DropdownMenuItem
              className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5"
              onClick={() => goTo("/settings")}
            >
              <Settings className="size-4" />
              <span className="text-sm font-medium">{t("items.settings")}</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5"
              onClick={() => goTo("/settings?tab=profile")}
            >
              <User className="size-4" />
              <span className="text-sm font-medium">{t("items.profile")}</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5"
              onClick={() => goTo("/stock?view=collections")}
            >
              <Layers className="size-4" />
              <span className="text-sm font-medium">{t("items.collections")}</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <DropdownMenuGroup className="py-1">
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 outline-none">
                <div className="flex items-center gap-3">
                  <Languages className="size-4" />
                  <span className="text-sm font-medium">{t("items.language")}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">
                    {locale in LOCALES ? LOCALES[locale as LocaleCode].label : locale}
                  </span>
                  <ChevronRight className="size-3 text-muted-foreground" />
                </div>
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent className="min-w-[120px]">
                  {(Object.entries(LOCALES) as [LocaleCode, (typeof LOCALES)[LocaleCode]][]).map(
                    ([code, info]) => (
                      <DropdownMenuItem
                        key={code}
                        className={cn(
                          "cursor-pointer px-3 py-2 text-sm",
                          locale === code && "bg-accent font-medium text-accent-foreground"
                        )}
                        onClick={() => {
                          replace(pathname, { locale: code });
                          refresh();
                        }}
                      >
                        <Languages className="mr-2 size-4" />
                        {info.label}
                      </DropdownMenuItem>
                    )
                  )}
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>

            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 outline-none">
                <div className="flex items-center gap-3">
                  <Moon className="size-4" />
                  <span className="text-sm font-medium">{t("items.theme")}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground capitalize">
                    {resolvedTheme ?? currentTheme}
                  </span>
                  <ChevronRight className="size-3 text-muted-foreground" />
                </div>
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent className="min-w-[120px]">
                  <DropdownMenuItem
                    onClick={() => setTheme("dark")}
                    className={cn(
                      "cursor-pointer px-3 py-2 text-sm",
                      currentTheme === "dark" && "bg-accent font-medium text-accent-foreground"
                    )}
                  >
                    Dark
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setTheme("light")}
                    className={cn(
                      "cursor-pointer px-3 py-2 text-sm",
                      currentTheme === "light" && "bg-accent font-medium text-accent-foreground"
                    )}
                  >
                    Light
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setTheme("system")}
                    className={cn(
                      "cursor-pointer px-3 py-2 text-sm",
                      currentTheme === "system" && "bg-accent font-medium text-accent-foreground"
                    )}
                  >
                    System
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>

            <DropdownMenuItem
              className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5"
              onClick={() => goTo("/settings?tab=api")}
            >
              <Code className="size-4" />
              <span className="text-sm font-medium">{t("items.developer")}</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5"
              onClick={() => window.open("/docs/api", "_blank")}
            >
              <LifeBuoy className="size-4" />
              <span className="text-sm font-medium">{t("items.docs")}</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5"
              onClick={openHelpCenter}
            >
              <LifeBuoy className="size-4" />
              <span className="text-sm font-medium">{t("items.help")}</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <div className="py-1">
            <DropdownMenuItem
              onClick={() => logout()}
              className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-destructive hover:bg-destructive/10"
            >
              <LogOut className="size-4" />
              <span className="text-sm font-medium">{t("items.logout")}</span>
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenu>
  );
}
