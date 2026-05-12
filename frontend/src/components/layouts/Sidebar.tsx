"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { useAuth } from "@/providers";
import { useWorkspaceStore } from "@/stores/workspace-store";
import {
  Image as ImageIcon,
  Coins,
  Video,
  LayoutGrid,
  Clock,
  PanelLeft,
  Grid3X3,
  Mic,
  Pin,
  Search,
  Globe,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { canAccessAdmin } from "@/lib/access-control";
import { Button } from "@/ui/button";
import { WorkspaceSwitcher } from "@/components/saas/WorkspaceSwitcher";
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
import { translateLayoutLabel } from "./i18n-helpers";

const stockMenuData = {
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

const communityMenuData = {
  routes: [
    {
      label: "Marketplace",
      description: "Open the reusable template market.",
      href: "/community/marketplace",
      icon: LayoutGrid,
    },
    {
      label: "Publish",
      description: "Create a new community listing.",
      href: "/community/publish",
      icon: Upload,
    },
    {
      label: "My listings",
      description: "Review your drafts and live items.",
      href: "/community/my-listings",
      icon: Globe,
    },
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

const creditCountFormatter = new Intl.NumberFormat("en-US");

const formatCreditCount = (value: number) => creditCountFormatter.format(value);

type BillingSummaryCard = {
  scopeLabel: string;
  remainingCredits: number;
};

const StockHoverContent = ({ t }: { t: (key: string) => string }) => (
  <div className="w-[600px] p-6 bg-popover border border-border text-popover-foreground rounded-xl shadow-2xl">
    <h3 className="text-lg font-semibold mb-4">{t("stock.title")}</h3>
    <div className="grid grid-cols-4 gap-6">
      <div className="space-y-2">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <ImageIcon className="size-4" />
          {t("stock.sections.image")}
        </div>
        {stockMenuData.image.map((tool) => (
          <Link
            key={tool.label}
            href={tool.href}
            className="block text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
          >
            {translateLayoutLabel(t, tool.label)}
          </Link>
        ))}
      </div>
      <div className="space-y-2">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Video className="size-4" />
          {t("stock.sections.video")}
        </div>
        {stockMenuData.video.map((tool) => (
          <Link
            key={tool.label}
            href={tool.href}
            className="block text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
          >
            {translateLayoutLabel(t, tool.label)}
          </Link>
        ))}
      </div>
      <div className="space-y-2">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Mic className="size-4" />
          {t("stock.sections.audio")}
        </div>
        {stockMenuData.audio.map((tool) => (
          <Link
            key={tool.label}
            href={tool.href}
            className="block text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
          >
            {translateLayoutLabel(t, tool.label)}
          </Link>
        ))}
      </div>
      <div className="space-y-2">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <LayoutGrid className="size-4" />
          {t("stock.sections.design")}
        </div>
        {stockMenuData.design.map((tool) => (
          <Link
            key={tool.label}
            href={tool.href}
            className="block text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
          >
            {translateLayoutLabel(t, tool.label)}
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
        {t("stock.collections")}
      </Link>
      <Link
        href="/stock?view=downloads"
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <Clock className="size-4" />
        {t("stock.downloads")}
      </Link>
    </div>
  </div>
);

const CommunityHoverContent = () => (
  <div className="w-[520px] p-6 bg-popover border border-border text-popover-foreground rounded-xl shadow-2xl">
    <div className="mb-4">
      <h3 className="text-lg font-semibold">Open the route you need</h3>
    </div>

    <div className="grid gap-2">
      {communityMenuData.routes.map((item) => {
        const Icon = item.icon;

        return (
          <Link
            key={item.label}
            href={item.href}
            className="group flex items-center gap-3 rounded-xl border border-border/70 bg-card/60 px-4 py-3 transition-colors hover:bg-accent hover:text-foreground"
          >
            <div className="rounded-lg border border-border/70 bg-background p-2 text-muted-foreground transition-colors group-hover:text-foreground">
              <Icon className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{item.label}</p>
              <p className="mt-0.5 text-xs leading-5 text-muted-foreground line-clamp-1">
                {item.description}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  </div>
);

interface SidebarNavItemProps {
  item: SidebarItem;
  pathname: string;
  isCollapsed: boolean;
  t: (key: string) => string;
  badge?: number;
}

const SidebarNavItem = ({
  item,
  pathname,
  isCollapsed,
  t,
  badge,
}: SidebarNavItemProps) => {
  const content = (
    <Link
      href={item.label === "Community" ? "/community" : item.href}
      className={cn(
        "relative flex items-center w-full px-3 py-2.5 text-sm text-muted-foreground rounded-lg transition-all duration-200 hover:text-foreground hover:bg-accent",
        (item.label === "Community"
          ? pathname.startsWith("/community")
          : pathname === item.href) && "text-foreground bg-accent font-medium",
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
        {!isCollapsed && <span>{translateLayoutLabel(t, item.label)}</span>}
      </div>
      {!isCollapsed && (
        <div className="flex items-center gap-1.5">
          {badge !== undefined && badge > 0 && (
            <span className="min-w-5 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground text-center">
              {badge > 99 ? "99+" : badge}
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
          <StockHoverContent t={t} />
        </HoverCardContent>
      </HoverCard>
    );
  }

  if (item.label === "Community" && !isCollapsed) {
    return (
      <HoverCard openDelay={0} closeDelay={100}>
        <HoverCardTrigger asChild>{content}</HoverCardTrigger>
        <HoverCardContent
          side="right"
          align="start"
          className="p-0 bg-transparent border-none shadow-none w-auto ml-2"
        >
          <CommunityHoverContent />
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
              {translateLayoutLabel(t, item.label)}
              {badge !== undefined && badge > 0 && (
                <span className="px-1 py-0.5 text-[9px] font-bold text-primary bg-primary/10 rounded">
                  {badge > 99 ? "99+" : badge}
                </span>
              )}
              {item.isNew && (
                <span className="px-1 py-0.5 text-[9px] font-bold text-primary bg-primary/10 rounded">
                  {t("badges.new")}
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
  t: (key: string) => string;
}

const AllToolsMenuItem = ({
  isCollapsed,
  pinnedIds,
  onTogglePin,
  allToolsList,
  t,
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
            {!isCollapsed && <span>{t("toolsMenu.title")}</span>}
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
            <h3 className="text-xl font-semibold">{t("toolsMenu.title")}</h3>
            <div className="relative">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={t("search.tools")}
                className="bg-muted border border-border rounded-full py-1.5 pl-9 pr-4 text-sm focus:outline-none focus:ring-1 ring-ring w-64"
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-8">
            {TOOL_CATEGORIES.map((cat) => {
              const categoryTools = filteredTools.filter((tool) => tool.category === cat.id);

              return (
                <div key={cat.id} className="space-y-4">
                  <div className="mb-1 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <cat.icon className="size-3.5" />
                    {translateLayoutLabel(t, cat.label)}
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
                        {t("search.noResults")}
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
            {t("toolsMenu.viewAll")}
          </Link>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const currentWorkspace = useWorkspaceStore((state) => state.currentWorkspace);
  const locale = useLocale();
  const t = useTranslations("Layout");
  const userId = user?.id;
  const navigationConfig = useSiteConfig("navigation", locale);
  const navigationData = mergeNavigationData(
    navigationConfig.data?.value as NavigationConfig | undefined,
  );
  const isWorkspaceRoute = pathname.startsWith("/workspaces/");
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
    personal: BillingSummaryCard | null;
    workspace: BillingSummaryCard | null;
  } | null>(null);
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

  useEffect(() => {
    let active = true;

    if (!user) {
      return () => {
        active = false;
      };
    }

    const loadBillingSummary = async () => {
      let personalSummary: BillingSummaryCard | null = null;
      let workspaceSummary: BillingSummaryCard | null = null;

      try {
        const [personalResult, workspaceResult] = await Promise.allSettled([
          billingApi.getMe(),
          currentWorkspace?.slug ? billingApi.get(currentWorkspace.slug) : Promise.resolve(null),
        ]);

        if (!active) return;

        if (personalResult.status === "fulfilled") {
          const wallet = personalResult.value;
          personalSummary = {
            scopeLabel: t("billing.personal"),
            remainingCredits: wallet.totalCredits,
          };
        }

        if (workspaceResult.status === "fulfilled" && workspaceResult.value) {
          const billing = workspaceResult.value;
          workspaceSummary = {
            scopeLabel: t("billing.workspace"),
            remainingCredits: billing.wallet.totalCredits,
          };
        }
      } catch {
        personalSummary = null;
        workspaceSummary = null;
      }

      if (active) {
        setBillingSummary({ personal: personalSummary, workspace: workspaceSummary });
      }
    };

    void loadBillingSummary();

    return () => {
      active = false;
    };
  }, [currentWorkspace?.slug, t, user]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    void fetchUnreadCount();
  }, [fetchUnreadCount, userId]);

  if (!user) return null;

  const isWorkspaceContext = isWorkspaceRoute && Boolean(currentWorkspace?.slug);
  const activeBillingSummary = isWorkspaceContext
    ? billingSummary?.workspace ?? billingSummary?.personal ?? null
    : billingSummary?.personal ?? billingSummary?.workspace ?? null;

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
                    {t("brandTagline")}
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
          <WorkspaceSwitcher isCollapsed={isCollapsed} />
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
                t={t}
              />
            ))}
          </div>

          {/* Social Hub Section */}
          {isCollapsed ? (
            <div className="h-px w-8 bg-sidebar-border mx-auto my-3" />
          ) : (
            <div className="p-3">
              <h3 className="text-sm font-medium text-sidebar-foreground/45">
                {t("sections.socialHub")}
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
                t={t}
              />
            ))}
          </div>

          {/* Divider */}
          {isCollapsed ? (
            <div className="h-px w-8 bg-sidebar-border mx-auto my-3" />
          ) : (
            <div className="p-3">
              <h3 className="text-sm font-medium text-sidebar-foreground/45">
                {t("sections.pinned")}
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
                t={t}
              />
            ))}
            <AllToolsMenuItem
              isCollapsed={isCollapsed}
              pinnedIds={pinnedIds}
              onTogglePin={togglePin}
              allToolsList={navigationData.allToolsList}
              t={t}
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
                t={t}
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
          {!isCollapsed ? (
            <div className="flex justify-center">
              <div
                className="inline-flex min-w-[108px] items-center justify-center gap-2 rounded-full border border-amber-500/20 bg-[linear-gradient(180deg,rgba(255,193,7,0.15),rgba(255,193,7,0.06))] px-3.5 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_10px_24px_rgba(0,0,0,0.18)]"
                aria-label={t("billing.creditsRemaining", { count: activeBillingSummary?.remainingCredits ?? 0 })}
              >
                <Coins className="size-4 shrink-0 text-amber-300" />
                <span className="text-base font-semibold leading-none tracking-tight text-amber-300">
                  {formatCreditCount(activeBillingSummary?.remainingCredits ?? 0)}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-10 rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-300 hover:bg-amber-500/15"
                    >
                      <Coins className="size-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    {t("billing.creditsRemaining", { count: activeBillingSummary?.remainingCredits ?? 0 })}
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
