'use client';

import * as React from 'react';
import {
    Settings,
    CreditCard,
    User,
    Layers,
    Languages,
    Moon,
    Code,
    LifeBuoy,
    LogOut,
    ChevronRight,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import { LOCALES, type LocaleCode } from '@/constants/i18n';
import { useOrgStore } from '@/stores/org-store';
import { env } from '@/env';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
    DropdownMenuPortal,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Button } from '@/ui/button';
import { useAuth } from '@/providers';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function UserMenu() {
    const { user, logout } = useAuth();
    const { setTheme, theme: currentTheme } = useTheme();
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const currentOrg = useOrgStore((state) => state.currentOrg);

    const goTo = (href: string) => {
        router.push(href);
    };

    const openHelpCenter = () => {
        window.open(`${env.NEXT_PUBLIC_GITHUB_URL.replace(/\/$/, '')}/issues`, '_blank', 'noopener,noreferrer');
    };

    if (!user) return null;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="flex items-center outline-none">
                    <Avatar className="w-8 h-8 rounded-full ring-border hover:ring-2 transition-all cursor-pointer border border-border">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-[10px] uppercase font-bold">
                            {user.username.substring(0, 1)}
                        </AvatarFallback>
                    </Avatar>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuPortal>
                <DropdownMenuContent
                    align="end"
                    sideOffset={8}
                    className="w-72 p-2"
                >
                    {/* User Info Section */}
                    <div className="flex items-center gap-3 p-3">
                        <Avatar className="w-10 h-10 rounded-lg">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback className="bg-primary text-primary-foreground text-xs uppercase font-bold">
                                {user.username.substring(0, 1)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-semibold truncate">{user.username}</span>
                            <span className="text-[11px] text-muted-foreground truncate">{user.email}</span>
                        </div>
                    </div>

                    <div className="px-2 py-3 space-y-2">
                        <Button
                            className="w-full text-xs font-semibold h-9 rounded-lg bg-pricing hover:bg-pricing/90 text-pricing-foreground"
                            onClick={() => goTo('/settings?tab=billing')}
                        >
                            Get a plan
                        </Button>
                        <Button
                            variant="secondary"
                            className="w-full text-xs font-semibold h-9 rounded-lg"
                            onClick={() => goTo('/orgs/new')}
                        >
                            Create your team
                        </Button>
                    </div>

                    <DropdownMenuSeparator />

                    <DropdownMenuGroup className="py-1">
                        <DropdownMenuItem
                            className="flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer"
                            onClick={() => {
                                if (currentOrg?.slug) {
                                    goTo(`/orgs/${currentOrg.slug}/billing`);
                                    return;
                                }
                                goTo('/settings?tab=billing');
                            }}
                        >
                            <div className="flex items-center gap-3">
                                <CreditCard className="w-4 h-4" />
                                <span className="text-sm font-medium">Plan & billing</span>
                            </div>
                            <span className="px-1.5 py-0.5 text-[9px] font-bold text-muted-foreground bg-muted rounded border border-border uppercase">Free</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer"
                            onClick={() => goTo('/settings')}
                        >
                            <Settings className="w-4 h-4" />
                            <span className="text-sm font-medium">Settings</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer"
                            onClick={() => goTo('/settings?tab=profile')}
                        >
                            <User className="w-4 h-4" />
                            <span className="text-sm font-medium">Creator profile</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer"
                            onClick={() => goTo('/stock?view=collections')}
                        >
                            <Layers className="w-4 h-4" />
                            <span className="text-sm font-medium">My collections</span>
                        </DropdownMenuItem>
                    </DropdownMenuGroup>

                    <DropdownMenuSeparator />

                    <DropdownMenuGroup className="py-1">
                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg cursor-pointer outline-none">
                                <div className="flex items-center gap-3">
                                    <Languages className="w-4 h-4" />
                                    <span className="text-sm font-medium">Language</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs text-muted-foreground">
                                        {(locale in LOCALES ? LOCALES[locale as LocaleCode].label : locale)}
                                    </span>
                                    <ChevronRight className="w-3 h-3 text-muted-foreground" />
                                </div>
                            </DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                                <DropdownMenuSubContent className="min-w-[120px]">
                                    {(Object.entries(LOCALES) as [LocaleCode, (typeof LOCALES)[LocaleCode]][]).map(([code, info]) => (
                                        <DropdownMenuItem
                                            key={code}
                                            className={cn(
                                                "px-3 py-2 text-sm cursor-pointer",
                                                locale === code && "bg-accent text-accent-foreground font-medium"
                                            )}
                                            onClick={() => router.replace(pathname, { locale: code })}
                                        >
                                            <span className="mr-2">{info.flag}</span>
                                            {info.label}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                        </DropdownMenuSub>

                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg cursor-pointer outline-none">
                                <div className="flex items-center gap-3">
                                    <Moon className="w-4 h-4" />
                                    <span className="text-sm font-medium">Theme</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs text-muted-foreground capitalize">{currentTheme}</span>
                                    <ChevronRight className="w-3 h-3 text-muted-foreground" />
                                </div>
                            </DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                                <DropdownMenuSubContent className="min-w-[120px]">
                                    <DropdownMenuItem
                                        onClick={() => setTheme('dark')}
                                        className={cn("px-3 py-2 text-sm cursor-pointer", currentTheme === 'dark' && "bg-accent text-accent-foreground font-medium")}
                                    >
                                        Dark
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => setTheme('light')}
                                        className={cn("px-3 py-2 text-sm cursor-pointer", currentTheme === 'light' && "bg-accent text-accent-foreground font-medium")}
                                    >
                                        Light
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => setTheme('system')}
                                        className={cn("px-3 py-2 text-sm cursor-pointer", currentTheme === 'system' && "bg-accent text-accent-foreground font-medium")}
                                    >
                                        System
                                    </DropdownMenuItem>
                                </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                        </DropdownMenuSub>

                        <DropdownMenuItem
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer"
                            onClick={() => goTo('/assistant')}
                        >
                            <Code className="w-4 h-4" />
                            <span className="text-sm font-medium">Use AI code</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer"
                            onClick={openHelpCenter}
                        >
                            <LifeBuoy className="w-4 h-4" />
                            <span className="text-sm font-medium">Help center</span>
                        </DropdownMenuItem>
                    </DropdownMenuGroup>

                    <DropdownMenuSeparator />

                    <div className="py-1">
                        <DropdownMenuItem
                            onClick={() => logout()}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-destructive/10 cursor-pointer text-destructive"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="text-sm font-medium">Log out</span>
                        </DropdownMenuItem>
                    </div>
                </DropdownMenuContent>
            </DropdownMenuPortal>
        </DropdownMenu>
    );
}
