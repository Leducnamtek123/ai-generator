"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { useAuth } from "@/providers";
import { useOrgStore } from "@/stores/org-store";
import {
  Image as ImageIcon,
  Video,
  Sparkles,
  LayoutGrid,
  Clock,
  PanelLeft,
  Grid3X3,
  Mic,
  Pin,
  Search,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { canAccessAdmin } from "@/lib/access-control";
import { Button } from "@/ui/button";
import { OrgSwitcher } from "@/components/saas/OrgSwitcher";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { CreditBadge } from "@/components/common/CreditBadge";
import { billingApi, type BillingWalletSummary } from "@/services/billingApi";
import { useNotificationStore } from "@/stores/notification-store";
import {
  DEFAULT_PINNED_TOOL_IDS,
  PINNED_STORAGE_KEY,
  TOOL_CATEGORIES,
  mergeNavigationData,
  type NavigationConfig,
} from "./navigation-data";
import type { SidebarItem } from "./navigation-data";
import { useSiteConfig } from "@/hooks/queries/useSiteConfig";

export const stockMenuData = {
  image: [
    { label: "All images", href: "/stock?category=images" },
    { label: "Vectors", href: "/stock?category=vectors" },
    { label: "Photos", href: "/stock?category=photos" },
    { label: "Illustrations", href: "/stock?category=illustrations" },
    { label: "Icons", href: "/stock?category=icons" },
    { label: "3D", href: "/stock?category=3d" },
  ],
  video: [
    { label: "Videos", href: "/stock?category=videos" },
    { label: "Video templates", href: "/stock?category=video-templates" },
    { label: "Motion graphics", href: "/stock?category=motion-graphics" },
  ],
  audio: [
    { label: "Sound Effects", href: "/stock?category=sound-effects" },
    { label: "Music", href: "/stock?category=music" },
  ],
  design: [
    { label: "Templates", href: "/stock?category=templates" },
    { label: "Mockups", href: "/stock?category=mockups" },
    { label: "Fonts", href: "/stock?category=fonts" },
    { label: "PSD", href: "/stock?category=psd" },
  ],
};

const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
};

const getViewportWidth = () =>
  typeof window === "undefined" ? BREAKPOINTS.lg : window.innerWidth;

const subscribeToViewport = (onStoreChange: () => void) => {
  window.addEventListener("resize", onStoreChange);
  return () => window.removeEventListener("resize", onStoreChange);
};

const formatBillingStatus = (status: BillingWalletSummary["status"]) => {
  switch (status) {
    case "active":
      return "Active";
    case "trialing":
      return "Trial";
    case "past_due":
      return "Past due";
    case "canceled":
      return "Canceled";
    case "free":
      return "Free";
    default:
      return status;
  }
};

const creditCountFormatter = new Intl.NumberFormat("en-US");

const formatCreditCount = (value: number) => creditCountFormatter.format(value);

const StockHoverContent = () => (
  <div className="w-[600px] p-6 bg-popover border border-border text-popover-foreground rounded-xl shadow-2xl">
    <h3 className="text-lg font-semibold mb-4">Stock</h3>
    <div className="grid grid-cols-4 gap-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
          <ImageIcon className="size-4" />
          IMAGE
        </div>
        {stockMenuData.image.map((tool) => (
          <Link
            key={tool.label}
            href={tool.href}
            className="block text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
          >
            {tool.label}
          </Link>
        ))}
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
          <Video className="size-4" />
          VIDEO
        </div>
        {stockMenuData.video.map((tool) => (
          <Link
            key={tool.label}
            href={tool.href}
            className="block text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
          >
            {tool.label}
          </Link>
        ))}
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
          <Mic className="size-4" />
          AUDIO
        </div>
        {stockMenuData.audio.map((tool) => (
          <Link
            key={tool.label}
            href={tool.href}
            className="block text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
          >
            {tool.label}
          </Link>
        ))}
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
          <LayoutGrid className="size-4" />
          DESIGN
        </div>
        {stockMenuData.design.map((tool) => (
          <Link
            key={tool.label}
            href={tool.href}
            className="block text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
          >
            {tool.label}
          </Link>
        ))}
      </div>
    </div>
    <div className="mt-6 pt-6 border-t border-border flex gap-6">
      <Link
        href="/stock?view=collections"
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <LayoutGrid className="size-4" />
        My Collections
      </Link>
      <Link
        href="/stock?view=downloads"
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <Clock className="size-4" />
        Downloads
      </Link>
    </div>
  </div>
);

interface SidebarNavItemProps {
  item: SidebarItem;
  pathname: string;
  isCollapsed: boolean;
  badge?: number;
}

const SidebarNavItem = ({
  item,
  pathname,
  isCollapsed,
  badge,
}: SidebarNavItemProps) => {
  const content = (
    <Link
      href={item.href}
      className={cn(
        "relative flex items-center w-full px-3 py-2.5 text-sm text-muted-foreground rounded-lg transition-all duration-200 hover:text-foreground hover:bg-accent",
        pathname === item.href && "text-foreground bg-accent font-medium",
        isCollapsed ? "justify-center px-2" : "justify-between",
      )}
    >
      <div
        className={cn(
          "flex items-center gap-3",
          isCollapsed && "justify-center w-full",
        )}
      >
        <item.icon className="size-5 shrink-0" />
        {!isCollapsed && <span>{item.label}</span>}
      </div>
      {!isCollapsed && (
        <div className="flex items-center gap-1.5">
          {badge !== undefined && badge > 0 && (
            <span className="min-w-5 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground text-center">
              {badge > 99 ? "99+" : badge}
            </span>
          )}
          {item.isNew && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold text-primary bg-primary/10 rounded">
              New
            </span>
          )}
        </div>
      )}
      {isCollapsed && (
        <div className="absolute top-1 right-1 flex items-center gap-1">
          {badge !== undefined && badge > 0 && (
            <div
              className="size-2 rounded-full bg-primary"
              aria-label={`${badge} unread notifications`}
            />
          )}
          {item.isNew && (
            <div className="size-1.5 bg-primary rounded-full" />
          )}
        </div>
      )}
    </Link>
  );

  if (item.label === "Stock" && !isCollapsed) {
    return (
      <HoverCard openDelay={0} closeDelay={100}>
        <HoverCardTrigger asChild>{content}</HoverCardTrigger>
        <HoverCardContent
          side="right"
          align="start"
          className="p-0 bg-transparent border-none shadow-none w-auto ml-2"
        >
          <StockHoverContent />
        </HoverCardContent>
      </HoverCard>
    );
  }

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        {isCollapsed && (
          <TooltipContent side="right">
            <div className="flex items-center gap-2">
              {item.label}
              {badge !== undefined && badge > 0 && (
                <span className="px-1 py-0.5 text-[9px] font-bold text-primary bg-primary/10 rounded">
                  {badge > 99 ? "99+" : badge}
                </span>
              )}
              {item.isNew && (
                <span className="px-1 py-0.5 text-[9px] font-bold text-primary bg-primary/10 rounded">
                  New
                </span>
              )}
            </div>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
};

interface AllToolsMenuItemProps {
  isCollapsed: boolean;
  pinnedIds: string[];
  onTogglePin: (e: React.MouseEvent, id: string) => void;
  allToolsList: SidebarItem[];
}

const AllToolsMenuItem = ({
  isCollapsed,
  pinnedIds,
  onTogglePin,
  allToolsList,
}: AllToolsMenuItemProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTools = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return allToolsList.filter((tool) => {
      const matchesCategory = TOOL_CATEGORIES.some(
        (category) => category.id === tool.category,
      );
      const matchesQuery =
        normalizedQuery.length === 0 ||
        tool.label.toLowerCase().includes(normalizedQuery) ||
        tool.href.toLowerCase().includes(normalizedQuery);

      return matchesCategory && matchesQuery;
    });
  }, [allToolsList, searchQuery]);

  return (
    <HoverCard openDelay={0} closeDelay={100}>
      <HoverCardTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex items-center w-full px-3 py-2.5 text-sm text-muted-foreground rounded-lg transition-all duration-200 hover:text-foreground hover:bg-accent",
            isCollapsed ? "justify-center px-2" : "justify-between",
          )}
        >
          <div
            className={cn(
              "flex items-center gap-3",
              isCollapsed && "justify-center w-full",
            )}
          >
            <Grid3X3 className="size-5 shrink-0" />
            {!isCollapsed && <span>All tools</span>}
          </div>
        </button>
      </HoverCardTrigger>
      <HoverCardContent
        side="right"
        align="start"
        className="w-[700px] p-0 bg-popover border-border text-popover-foreground rounded-xl shadow-2xl overflow-hidden"
      >
        <div className="p-6">
          <div className="flex items-center justify-between gap-4 mb-6">
            <h3 className="text-xl font-semibold">All tools</h3>
            <div className="relative">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search tools?"
                className="bg-muted border border-border rounded-full py-1.5 pl-9 pr-4 text-sm focus:outline-none focus:ring-1 ring-ring w-64"
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-8">
            {TOOL_CATEGORIES.map((cat) => {
              const categoryTools = filteredTools.filter((tool) => tool.category === cat.id);

              return (
                <div key={cat.id} className="space-y-4">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                    <cat.icon className="size-3.5" />
                    {cat.label}
                  </div>
                  <div className="space-y-1">
                    {categoryTools.length > 0 ? (
                      categoryTools.map((tool) => (
                        <div
                          key={tool.id}
                          className="group flex items-center justify-between gap-2 py-1.5 px-2 -mx-2 rounded-lg hover:bg-accent transition-colors"
                        >
                          <Link
                            href={tool.href}
                            className="flex min-w-0 flex-1 items-center gap-2"
                          >
                            <span
                              className={cn(
                                "truncate text-sm transition-colors",
                                pinnedIds.includes(tool.id || "")
                                  ? "text-foreground font-medium"
                                  : "text-muted-foreground group-hover:text-foreground",
                              )}
                            >
                              {tool.label}
                            </span>
                            {tool.isNew && (
                              <span className="text-[9px] font-bold text-primary bg-primary/10 px-1 rounded">
                                New
                              </span>
                            )}
                          </Link>
                          <button
                            type="button"
                            onClick={(e) => onTogglePin(e, tool.id || "")}
                            className={cn(
                              "opacity-0 group-hover:opacity-100 transition-all p-1 hover:bg-accent rounded",
                              pinnedIds.includes(tool.id || "") &&
                                "opacity-100 text-primary",
                            )}
                          >
                            <Pin
                              className={cn(
                                "size-3.5",
                                pinnedIds.includes(tool.id || "") && "fill-current",
                              )}
                            />
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="p-2 text-sm text-muted-foreground">
                        No tools match this search.
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-muted p-4 flex items-center justify-center border-t border-border">
          <Link
            href="/creator"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            View all tools in a single list
          </Link>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const currentOrg = useOrgStore((state) => state.currentOrg);
  const locale = useLocale();
  const userId = user?.id;
  const navigationConfig = useSiteConfig("navigation", locale);
  const navigationData = mergeNavigationData(
    navigationConfig.data?.value as NavigationConfig | undefined,
  );
  const viewportWidth = useSyncExternalStore(
    subscribeToViewport,
    getViewportWidth,
    () => BREAKPOINTS.lg,
  );
  const [manualCollapsed, setManualCollapsed] = useState<boolean | null>(null);
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const fetchUnreadCount = useNotificationStore(
    (state) => state.fetchUnreadCount,
  );
  const [billingSummary, setBillingSummary] = useState<{
    planName: string | null;
    status: BillingWalletSummary["status"] | null;
    remainingCredits: number;
    managementHref: string;
  } | null>(null);
  const [isBillingLoading, setIsBillingLoading] = useState(true);
  const viewportCollapsed = viewportWidth < BREAKPOINTS.lg;
  const isCollapsed = manualCollapsed ?? viewportCollapsed;
  const isTablet =
    manualCollapsed === null &&
    viewportWidth >= BREAKPOINTS.md &&
    viewportWidth < BREAKPOINTS.lg;

  const [pinnedIds, setPinnedIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return DEFAULT_PINNED_TOOL_IDS;

    try {
      const saved = localStorage.getItem(PINNED_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved) as string[];
      }
    } catch {
      localStorage.removeItem(PINNED_STORAGE_KEY);
    }

    return DEFAULT_PINNED_TOOL_IDS;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem(PINNED_STORAGE_KEY, JSON.stringify(pinnedIds));
    } catch {
      // Ignore storage quota or privacy-mode failures.
    }
  }, [pinnedIds]);

  const isOrgRoute = /\/orgs\/[^/]+/.test(pathname);

  useEffect(() => {
    let active = true;

    if (!user) {
      setBillingSummary(null);
      setIsBillingLoading(false);
      return () => {
        active = false;
      };
    }

    const loadBillingSummary = async () => {
      setIsBillingLoading(true);
      try {
        if (isOrgRoute && currentOrg?.slug) {
          const billing = await billingApi.get(currentOrg.slug);
          if (!active) return;

          setBillingSummary({
            planName: billing.plan?.name ?? null,
            status: billing.wallet.status,
            remainingCredits: billing.wallet.totalCredits,
            managementHref: `/orgs/${currentOrg.slug}/billing`,
          });
          return;
        }

        const wallet = await billingApi.getMe();
        if (!active) return;

        setBillingSummary({
          planName: wallet.plan?.name ?? null,
          status: wallet.status,
          remainingCredits: wallet.totalCredits,
          managementHref: "/settings?tab=billing",
        });
      } catch {
        if (active) {
          setBillingSummary(null);
        }
      } finally {
        if (active) {
          setIsBillingLoading(false);
        }
      }
    };

    void loadBillingSummary();

    return () => {
      active = false;
    };
  }, [currentOrg?.name, currentOrg?.slug, isOrgRoute, pathname, user]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    void fetchUnreadCount();
  }, [fetchUnreadCount, userId]);

  if (!user) return null;

  const togglePin = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setPinnedIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  };

  const pinnedTools = navigationData.allToolsList.filter((tool) =>
    pinnedIds.includes(tool.id || ""),
  );
  const visibleBottomItems = navigationData.bottomItems.filter(
    (item) => item.href !== "/admin" || canAccessAdmin(user),
  );
  const notificationBadge = unreadCount > 0 ? unreadCount : undefined;
  const hasSubscription = Boolean(billingSummary?.planName);
  const hasCreditsOnly =
    !hasSubscription && (billingSummary?.remainingCredits ?? 0) > 0;
  const billingScopeLabel = isOrgRoute ? "Workspace plan" : "Personal plan";
  const billingActionLabel = hasSubscription
    ? "Manage billing"
    : hasCreditsOnly
      ? "Choose plan"
      : "Upgrade plan";
  const billingCardDescription = isOrgRoute
    ? "Shared credits and seats for the active workspace."
    : "Your personal subscription and credit wallet.";

  return (
    <>
      <aside
        className={cn(
          "h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 ease-in-out z-50 shrink-0",
          isCollapsed ? "w-[72px]" : "w-64",
        )}
      >
        {/* Header */}
        <div
          className={cn(
            "h-14 flex items-center border-b border-sidebar-border shrink-0",
            isCollapsed ? "justify-center px-2" : "px-4",
          )}
        >
          {!isCollapsed ? (
            <div className="flex items-center w-full gap-2 group">
              <div className="flex items-center gap-2 flex-1">
                <div className="size-9 rounded-lg overflow-hidden flex items-center justify-center p-0.5 bg-sidebar-accent border border-sidebar-border group-hover:border-sidebar-accent-foreground/20 transition-colors">
                  <Image
                    src="/logo.svg"
                    alt="Logo"
                    width={36}
                    height={36}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-sidebar-foreground tracking-tight leading-tight">
                    PaintAI
                  </span>
                  <span className="text-[9px] text-sidebar-foreground/50 font-medium">
                    Your paint, your choice
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-sidebar-foreground/50 hover:text-sidebar-foreground shrink-0"
                onClick={() => setManualCollapsed(true)}
              >
                <PanelLeft className="size-4" />
              </Button>
            </div>
          ) : isTablet ? (
            <div className="size-10 flex items-center justify-center">
              <div className="size-7 rounded-lg overflow-hidden flex items-center justify-center p-1 bg-sidebar-accent border border-sidebar-border">
                <Image
                  src="/logo.svg"
                  alt="Logo"
                  width={28}
                  height={28}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          ) : (
            <button
              className="size-10 rounded-lg flex items-center justify-center hover:bg-sidebar-accent transition-colors text-sidebar-foreground/50 hover:text-sidebar-foreground"
              onClick={() => setManualCollapsed(false)}
            >
              <Image
                src="/logo.svg"
                alt="Logo"
                width={24}
                height={24}
                className="size-6 object-contain"
              />
            </button>
          )}
        </div>

        {/* Workspace switcher */}
        <div
          className={cn(
            "border-b border-sidebar-border",
            isCollapsed ? "py-2 px-1" : "px-3 py-3",
          )}
        >
          <OrgSwitcher isCollapsed={isCollapsed} />
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2  gap-y-1 scrollbar-hide">
          {/* Main Nav */}
          <div className="space-y-0.5">
            {navigationData.navItems.map((item) => (
              <SidebarNavItem
                key={item.label}
                item={item}
                pathname={pathname}
                isCollapsed={isCollapsed}
              />
            ))}
          </div>

          {/* Social Hub Section */}
          {isCollapsed ? (
            <div className="h-px w-8 bg-sidebar-border mx-auto my-3" />
          ) : (
            <div className="p-3">
              <h3 className="text-[10px] font-medium text-sidebar-foreground/30 uppercase tracking-wider">
                Social Hub
              </h3>
            </div>
          )}

          <div className="space-y-0.5">
            {navigationData.socialItems.map((item) => (
              <SidebarNavItem
                key={item.label}
                item={item}
                pathname={pathname}
                isCollapsed={isCollapsed}
              />
            ))}
          </div>

          {/* Divider */}
          {isCollapsed ? (
            <div className="h-px w-8 bg-sidebar-border mx-auto my-3" />
          ) : (
            <div className="p-3">
              <h3 className="text-[10px] font-medium text-sidebar-foreground/30 uppercase tracking-wider">
                Pinned
              </h3>
            </div>
          )}

          {/* Pinned Tools */}
          <div className="space-y-0.5">
            {pinnedTools.map((item) => (
              <SidebarNavItem
                key={item.id}
                item={item}
                pathname={pathname}
                isCollapsed={isCollapsed}
              />
            ))}
            <AllToolsMenuItem
              isCollapsed={isCollapsed}
              pinnedIds={pinnedIds}
              onTogglePin={togglePin}
              allToolsList={navigationData.allToolsList}
            />
          </div>

          {/* Divider */}
          {isCollapsed ? (
            <div className="h-px w-8 bg-sidebar-border mx-auto my-3" />
          ) : (
            <div className="h-px bg-sidebar-border mx-3 my-3" />
          )}

          {/* Bottom Section */}
          <div className="space-y-0.5">
            {visibleBottomItems.map((item) => (
              <SidebarNavItem
                key={item.label}
                item={item}
                pathname={pathname}
                isCollapsed={isCollapsed}
                badge={
                  item.href === "/notifications" ? notificationBadge : undefined
                }
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div
          className={cn(
            "border-t border-sidebar-border shrink-0",
            isCollapsed ? "p-2" : "p-3",
          )}
        >
          {!isCollapsed && (
            <div className="mb-3">
              {isOrgRoute && billingSummary ? (
                <div className="flex items-center justify-between gap-3 rounded-lg bg-pricing/10 border border-pricing/20 px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Wallet className="size-4 text-pricing shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-pricing/70">
                        Org credits
                      </p>
                      <p className="text-sm font-semibold text-pricing">
                        {formatCreditCount(billingSummary.remainingCredits)}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-pricing/70">
                    Shared wallet
                  </span>
                </div>
              ) : (
                <CreditBadge className="w-full justify-center" />
              )}
            </div>
          )}

          {!isCollapsed ? (
            <div className="rounded-xl bg-pricing/10 p-4 border border-pricing/20 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <h4 className="text-sm font-semibold text-pricing">
                    {billingSummary?.planName ??
                      (hasCreditsOnly
                        ? "No active subscription"
                        : "Upgrade plan")}
                  </h4>
                </div>
                {billingSummary?.status && (
                  <span className="shrink-0 rounded-full border border-pricing/30 bg-background/60 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-pricing">
                    {formatBillingStatus(billingSummary.status)}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-credits font-medium">
                {billingSummary
                  ? `${formatCreditCount(billingSummary.remainingCredits)} credits remaining`
                  : "Unlock more credits and workspace features"}
              </p>
              <Link
                href={billingSummary?.managementHref ?? "/settings?tab=billing"}
                className="inline-flex items-center justify-center rounded-lg bg-pricing px-3 py-2 text-[11px] font-semibold text-pricing-foreground transition-colors hover:bg-pricing/90"
              >
                {billingActionLabel}
              </Link>
            </div>
          ) : (
            <div className="flex justify-center">
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-10 text-pricing bg-pricing/10 rounded-xl hover:bg-pricing/20"
                    >
                      <Sparkles className="size-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    {billingSummary?.planName
                      ? `${billingSummary.planName} plan`
                      : "Buy Credits"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </div>
      </aside>
      {isTablet && !isCollapsed && (
        <div
          className="w-[72px] shrink-0 h-full hidden md:block"
          aria-hidden="true"
        />
      )}
    </>
  );
}
