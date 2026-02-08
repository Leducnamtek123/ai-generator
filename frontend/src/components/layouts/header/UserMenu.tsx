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
    Sparkles,
    Users
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import { LOCALES, LocaleCode } from '@/constants/i18n';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
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

    if (!user) return null;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="flex items-center outline-none">
                    <Avatar className="w-8 h-8 rounded-full ring-white/10 hover:ring-2 transition-all cursor-pointer border border-white/10">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-[10px] uppercase font-bold">
                            {user.username.substring(0, 1)}
                        </AvatarFallback>
                    </Avatar>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuPortal>
                <DropdownMenuContent
                    align="end"
                    sideOffset={8}
                    className="w-72 bg-[#1A1B1F] border-white/10 p-2 text-white shadow-2xl rounded-xl"
                >
                    {/* User Info Section */}
                    <div className="flex items-center gap-3 p-3">
                        <Avatar className="w-10 h-10 rounded-lg shadow-lg shadow-blue-500/10">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xs uppercase font-bold">
                                {user.username.substring(0, 1)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-semibold truncate text-white/90">{user.username}</span>
                            <span className="text-[11px] text-white/40 truncate">{user.email}</span>
                        </div>
                    </div>

                    <div className="px-2 py-3 space-y-2">
                        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold h-9 rounded-lg transition-all shadow-lg shadow-blue-500/20">
                            Get a plan
                        </Button>
                        <Button variant="ghost" className="w-full bg-white/5 hover:bg-white/10 text-white text-xs font-semibold h-9 rounded-lg border border-white/5">
                            Create your team
                        </Button>
                    </div>

                    <DropdownMenuSeparator className="bg-white/5 mx-2" />

                    <DropdownMenuGroup className="py-1">
                        <DropdownMenuItem className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-white/5 cursor-pointer text-white/70 hover:text-white transition-colors">
                            <div className="flex items-center gap-3">
                                <CreditCard className="w-4 h-4" />
                                <span className="text-sm font-medium">Plan & billing</span>
                            </div>
                            <span className="px-1.5 py-0.5 text-[9px] font-bold text-white/40 bg-white/5 rounded border border-white/5 uppercase">Free</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 cursor-pointer text-white/70 hover:text-white transition-colors">
                            <Settings className="w-4 h-4" />
                            <span className="text-sm font-medium">Settings</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 cursor-pointer text-white/70 hover:text-white transition-colors">
                            <User className="w-4 h-4" />
                            <span className="text-sm font-medium">Creator profile</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 cursor-pointer text-white/70 hover:text-white transition-colors">
                            <Layers className="w-4 h-4" />
                            <span className="text-sm font-medium">My collections</span>
                        </DropdownMenuItem>
                    </DropdownMenuGroup>

                    <DropdownMenuSeparator className="bg-white/5 mx-2" />

                    <DropdownMenuGroup className="py-1">
                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg hover:bg-white/5 cursor-pointer text-white/70 hover:text-white transition-colors outline-none">
                                <div className="flex items-center gap-3">
                                    <Languages className="w-4 h-4" />
                                    <span className="text-sm font-medium">Language</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs text-white/30">
                                        {(LOCALES as any)[locale]?.label || locale}
                                    </span>
                                    <ChevronRight className="w-3 h-3 text-white/20" />
                                </div>
                            </DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                                <DropdownMenuSubContent className="bg-[#1A1B1F] border-white/10 text-white min-w-[120px] rounded-lg shadow-xl">
                                    {Object.entries(LOCALES).map(([code, info]) => (
                                        <DropdownMenuItem
                                            key={code}
                                            className={cn(
                                                "px-3 py-2 text-sm hover:bg-white/5 cursor-pointer",
                                                locale === code && "bg-white/5 text-blue-400 font-medium"
                                            )}
                                            onClick={() => router.replace(pathname, { locale: code as any })}
                                        >
                                            <span className="mr-2">{info.flag}</span>
                                            {info.label}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                        </DropdownMenuSub>

                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg hover:bg-white/5 cursor-pointer text-white/70 hover:text-white transition-colors outline-none">
                                <div className="flex items-center gap-3">
                                    <Moon className="w-4 h-4" />
                                    <span className="text-sm font-medium">Theme</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs text-white/30 capitalize">{currentTheme}</span>
                                    <ChevronRight className="w-3 h-3 text-white/20" />
                                </div>
                            </DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                                <DropdownMenuSubContent className="bg-[#1A1B1F] border-white/10 text-white min-w-[120px] rounded-lg shadow-xl">
                                    <DropdownMenuItem
                                        onClick={() => setTheme('dark')}
                                        className={cn("px-3 py-2 text-sm hover:bg-white/5 cursor-pointer", currentTheme === 'dark' && "bg-white/5 text-blue-400 font-medium")}
                                    >
                                        Dark
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => setTheme('light')}
                                        className={cn("px-3 py-2 text-sm hover:bg-white/5 cursor-pointer", currentTheme === 'light' && "bg-white/5 text-blue-400 font-medium")}
                                    >
                                        Light
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => setTheme('system')}
                                        className={cn("px-3 py-2 text-sm hover:bg-white/5 cursor-pointer", currentTheme === 'system' && "bg-white/5 text-blue-400 font-medium")}
                                    >
                                        System
                                    </DropdownMenuItem>
                                </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                        </DropdownMenuSub>

                        <DropdownMenuItem className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 cursor-pointer text-white/70 hover:text-white transition-colors">
                            <Code className="w-4 h-4" />
                            <span className="text-sm font-medium">Use AI code</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 cursor-pointer text-white/70 hover:text-white transition-colors">
                            <LifeBuoy className="w-4 h-4" />
                            <span className="text-sm font-medium">Help center</span>
                        </DropdownMenuItem>
                    </DropdownMenuGroup>

                    <DropdownMenuSeparator className="bg-white/5 mx-2" />

                    <div className="py-1">
                        <DropdownMenuItem
                            onClick={() => logout()}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-500/10 cursor-pointer text-white/70 hover:text-red-400 transition-colors"
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
