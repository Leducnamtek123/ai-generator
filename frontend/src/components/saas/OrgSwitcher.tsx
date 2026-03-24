'use client';

import { useState, useEffect } from 'react';
import { useOrgStore } from '@/stores/org-store';
import { orgApi, type Organization } from '@/services/orgApi';
import { cn } from '@/lib/utils';
import {
    Building2,
    ChevronDown,
    Plus,
    Check,
    Settings,
    Users,
    CreditCard,
    FolderKanban,
    Mail,
} from 'lucide-react';
import { Link } from '@/i18n/navigation';

export function OrgSwitcher({ isCollapsed = false }: { isCollapsed?: boolean }) {
    const { currentOrg, organizations, setCurrentOrg, setOrganizations, setCurrentMembership } = useOrgStore();
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadOrgs();
    }, []);

    const loadOrgs = async () => {
        try {
            setLoading(true);
            const orgs = await orgApi.list();
            setOrganizations(orgs);
            if (!currentOrg && orgs.length > 0) {
                setCurrentOrg(orgs[0]);
                // Also fetch membership
                try {
                    const membership = await orgApi.getMembership(orgs[0].slug);
                    setCurrentMembership(membership.member);
                } catch { }
            }
        } catch (err) {
            console.error('Failed to load organizations:', err);
        } finally {
            setLoading(false);
        }
    };

    const selectOrg = async (org: Organization) => {
        setCurrentOrg(org);
        setIsOpen(false);
        try {
            const membership = await orgApi.getMembership(org.slug);
            setCurrentMembership(membership.member);
        } catch { }
    };

    if (isCollapsed) {
        return (
            <div className="flex justify-center py-2">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-md hover:shadow-lg transition-all"
                >
                    {currentOrg?.name?.charAt(0)?.toUpperCase() || '?'}
                </button>
            </div>
        );
    }

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex items-center gap-2.5 w-full px-2 py-2 text-sm rounded-lg transition-all duration-200",
                    "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
                    isOpen && "bg-sidebar-accent text-sidebar-foreground"
                )}
            >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold shadow-sm shrink-0">
                    {currentOrg?.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 text-left min-w-0">
                    <div className="text-sm font-medium truncate">
                        {loading ? 'Loading...' : currentOrg?.name || 'Select Org'}
                    </div>
                </div>
                <ChevronDown className={cn("w-3.5 h-3.5 text-sidebar-foreground/40 transition-transform", isOpen && "rotate-180")} />
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-popover border border-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95">
                        {/* Org list */}
                        <div className="p-1.5 max-h-48 overflow-y-auto">
                            {organizations.map((org) => (
                                <button
                                    key={org.id}
                                    onClick={() => selectOrg(org)}
                                    className={cn(
                                        "flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-sm transition-all",
                                        "hover:bg-accent",
                                        currentOrg?.id === org.id
                                            ? "text-foreground bg-accent/50"
                                            : "text-muted-foreground"
                                    )}
                                >
                                    <div className="w-6 h-6 rounded bg-gradient-to-br from-violet-500/80 to-indigo-600/80 flex items-center justify-center text-white text-[9px] font-bold shrink-0">
                                        {org.name?.charAt(0)?.toUpperCase()}
                                    </div>
                                    <span className="flex-1 text-left truncate">{org.name}</span>
                                    {currentOrg?.id === org.id && (
                                        <Check className="w-3.5 h-3.5 text-primary" />
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Quick actions */}
                        {currentOrg && (
                            <div className="border-t border-border p-1.5">
                                <Link
                                    href={`/orgs/${currentOrg.slug}/settings` as any}
                                    className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
                                    onClick={() => setIsOpen(false)}
                                >
                                    <Settings className="w-4 h-4" />
                                    Settings
                                </Link>
                                <Link
                                    href={`/orgs/${currentOrg.slug}/members` as any}
                                    className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
                                    onClick={() => setIsOpen(false)}
                                >
                                    <Users className="w-4 h-4" />
                                    Members
                                </Link>
                                <Link
                                    href={`/orgs/${currentOrg.slug}/projects` as any}
                                    className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
                                    onClick={() => setIsOpen(false)}
                                >
                                    <FolderKanban className="w-4 h-4" />
                                    Projects
                                </Link>
                                <Link
                                    href={`/orgs/${currentOrg.slug}/invites` as any}
                                    className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
                                    onClick={() => setIsOpen(false)}
                                >
                                    <Mail className="w-4 h-4" />
                                    Invites
                                </Link>
                                <Link
                                    href={`/orgs/${currentOrg.slug}/billing` as any}
                                    className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
                                    onClick={() => setIsOpen(false)}
                                >
                                    <CreditCard className="w-4 h-4" />
                                    Billing
                                </Link>
                            </div>
                        )}

                        {/* Create new */}
                        <div className="border-t border-border p-1.5">
                            <Link
                                href={"/orgs/new" as any}
                                className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-sm text-primary hover:bg-primary/5 transition-all font-medium"
                                onClick={() => setIsOpen(false)}
                            >
                                <Plus className="w-4 h-4" />
                                Create Organization
                            </Link>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
