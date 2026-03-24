'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { memberApi, type UpdateMemberData } from '@/services/memberApi';
import type { Member } from '@/services/orgApi';
import { useOrgStore } from '@/stores/org-store';
import {
    Users, Shield, ShieldCheck, Receipt, MoreVertical,
    Loader2, Trash2, ArrowLeft, UserCog
} from 'lucide-react';
import { Button } from '@/ui/button';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

const roleConfig = {
    ADMIN: { label: 'Admin', icon: ShieldCheck, color: 'text-violet-500 bg-violet-500/10' },
    MEMBER: { label: 'Member', icon: Shield, color: 'text-blue-500 bg-blue-500/10' },
    BILLING: { label: 'Billing', icon: Receipt, color: 'text-emerald-500 bg-emerald-500/10' },
};

export default function MembersPage() {
    const params = useParams();
    const slug = params?.slug as string;
    const { hasPermission } = useOrgStore();

    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [menuId, setMenuId] = useState<string | null>(null);

    const canManage = hasPermission('update', 'User');

    const loadMembers = useCallback(async () => {
        try {
            setLoading(true);
            const data = await memberApi.list(slug);
            setMembers(data);
        } catch {
            setError('Failed to load members');
        } finally {
            setLoading(false);
        }
    }, [slug]);

    useEffect(() => {
        loadMembers();
    }, [loadMembers]);

    const updateRole = async (memberId: string, role: UpdateMemberData['role']) => {
        try {
            await memberApi.updateRole(slug, memberId, { role });
            setEditingId(null);
            await loadMembers();
        } catch (err: unknown) {
            const apiErr = err as { response?: { data?: { message?: string } } };
            setError(apiErr?.response?.data?.message || 'Failed to update role');
        }
    };

    const removeMember = async (memberId: string) => {
        if (!confirm('Are you sure you want to remove this member?')) return;
        try {
            await memberApi.remove(slug, memberId);
            setMembers(members.filter((m) => m.id !== memberId));
        } catch (err: unknown) {
            const apiErr = err as { response?: { data?: { message?: string } } };
            setError(apiErr?.response?.data?.message || 'Failed to remove member');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6">
            <div className="mb-8">
                <Link href={"/dashboard" as string} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
                    <ArrowLeft className="w-4 h-4" />Back
                </Link>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                            <Users className="w-6 h-6 text-primary" />Members
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">{members.length} member{members.length !== 1 ? 's' : ''}</p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-xl px-4 py-3 text-sm mb-6">{error}</div>
            )}

            <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="divide-y divide-border">
                    {members.map((member) => {
                        const role = (member.role || member.roles?.[0]?.role || 'MEMBER') as keyof typeof roleConfig;
                        const config = roleConfig[role] || roleConfig.MEMBER;
                        const RoleIcon = config.icon;
                        const displayName = member.user?.firstName && member.user?.lastName
                            ? `${member.user.firstName} ${member.user.lastName}`
                            : member.user?.name || member.user?.email || 'Unknown';

                        return (
                            <div key={member.id} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors group">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                                    {displayName.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-foreground truncate">{displayName}</div>
                                    <div className="text-xs text-muted-foreground truncate">{member.user?.email || ''}</div>
                                </div>

                                {editingId === member.id ? (
                                    <div className="flex items-center gap-1.5">
                                        {(['ADMIN', 'MEMBER', 'BILLING'] as const).map((r) => (
                                            <button key={r} onClick={() => updateRole(member.id, r)} className={cn("px-2.5 py-1 rounded-lg text-xs font-medium transition-all border", role === r ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50 text-muted-foreground hover:text-foreground")}>
                                                {roleConfig[r].label}
                                            </button>
                                        ))}
                                        <button onClick={() => setEditingId(null)} className="text-xs text-muted-foreground hover:text-foreground ml-1">✕</button>
                                    </div>
                                ) : (
                                    <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium", config.color)}>
                                        <RoleIcon className="w-3.5 h-3.5" />{config.label}
                                    </div>
                                )}

                                {canManage && editingId !== member.id && (
                                    <div className="relative">
                                        <Button variant="ghost" size="icon-xs" onClick={() => setMenuId(menuId === member.id ? null : member.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            <MoreVertical className="w-4 h-4" />
                                        </Button>
                                        {menuId === member.id && (
                                            <>
                                                <div className="fixed inset-0 z-40" onClick={() => setMenuId(null)} />
                                                <div className="absolute right-0 top-full mt-1 z-50 bg-popover border border-border rounded-xl shadow-xl w-40 p-1.5 animate-in fade-in-0 zoom-in-95">
                                                    <button onClick={() => { setEditingId(member.id); setMenuId(null); }} className="flex items-center gap-2 w-full px-2.5 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-all">
                                                        <UserCog className="w-4 h-4" />Change Role
                                                    </button>
                                                    <button onClick={() => { removeMember(member.id); setMenuId(null); }} className="flex items-center gap-2 w-full px-2.5 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-all">
                                                        <Trash2 className="w-4 h-4" />Remove
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    {members.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                            <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                            <p className="text-sm">No members found</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
