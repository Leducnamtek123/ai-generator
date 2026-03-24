'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { inviteApi, type Invite, type CreateInviteData } from '@/services/inviteApi';
import { useOrgStore } from '@/stores/org-store';
import {
    Mail, Plus, Trash2, Loader2, ArrowLeft, Clock, Shield, ShieldCheck, Receipt
} from 'lucide-react';
import { Button } from '@/ui/button';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

const roleConfig: Record<string, { label: string; icon: typeof Shield; color: string }> = {
    ADMIN: { label: 'Admin', icon: ShieldCheck, color: 'text-violet-500 bg-violet-500/10' },
    MEMBER: { label: 'Member', icon: Shield, color: 'text-blue-500 bg-blue-500/10' },
    BILLING: { label: 'Billing', icon: Receipt, color: 'text-emerald-500 bg-emerald-500/10' },
};

export default function InvitesPage() {
    const params = useParams();
    const slug = params?.slug as string;
    const { hasPermission } = useOrgStore();

    const [invites, setInvites] = useState<Invite[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState<CreateInviteData>({ email: '', role: 'MEMBER' });

    const canInvite = hasPermission('create', 'Invite');

    const loadInvites = useCallback(async () => {
        try {
            setLoading(true);
            const data = await inviteApi.list(slug);
            setInvites(data);
        } catch {
            setError('Failed to load invites');
        } finally {
            setLoading(false);
        }
    }, [slug]);

    useEffect(() => {
        loadInvites();
    }, [loadInvites]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.email) return;
        setSubmitting(true);
        setError('');
        try {
            const invite = await inviteApi.create(slug, form);
            setInvites([invite, ...invites]);
            setForm({ email: '', role: 'MEMBER' });
            setShowForm(false);
        } catch (err: unknown) {
            const apiErr = err as { response?: { data?: { message?: string } } };
            setError(apiErr?.response?.data?.message || 'Failed to create invite');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (inviteId: string) => {
        try {
            await inviteApi.delete(slug, inviteId);
            setInvites(invites.filter((i) => i.id !== inviteId));
        } catch (err: unknown) {
            const apiErr = err as { response?: { data?: { message?: string } } };
            setError(apiErr?.response?.data?.message || 'Failed to delete invite');
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
                            <Mail className="w-6 h-6 text-primary" />Invites
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">{invites.length} pending invite{invites.length !== 1 ? 's' : ''}</p>
                    </div>
                    {canInvite && (
                        <Button onClick={() => setShowForm(!showForm)}>
                            <Plus className="w-4 h-4" />Invite Member
                        </Button>
                    )}
                </div>
            </div>

            {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-xl px-4 py-3 text-sm mb-6">{error}</div>
            )}

            {showForm && (
                <div className="bg-card border border-border rounded-xl p-6 mb-6 animate-in slide-in-from-top-2">
                    <h3 className="text-sm font-semibold mb-4">Send Invite</h3>
                    <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-3">
                        <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="member@example.com" className="flex-1 px-3.5 py-2.5 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 transition-all placeholder:text-muted-foreground/50" required />
                        <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as CreateInviteData['role'] })} className="px-3.5 py-2.5 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 transition-all">
                            <option value="MEMBER">Member</option>
                            <option value="ADMIN">Admin</option>
                            <option value="BILLING">Billing</option>
                        </select>
                        <Button type="submit" disabled={submitting}>
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}Send
                        </Button>
                    </form>
                </div>
            )}

            <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="divide-y divide-border">
                    {invites.map((invite) => {
                        const config = roleConfig[invite.role] || roleConfig.MEMBER;
                        const RoleIcon = config.icon;
                        return (
                            <div key={invite.id} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors group">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shrink-0">
                                    <Mail className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-foreground truncate">{invite.email}</div>
                                    <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                        <Clock className="w-3 h-3" />{new Date(invite.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                                <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium", config.color)}>
                                    <RoleIcon className="w-3.5 h-3.5" />{config.label}
                                </div>
                                {canInvite && (
                                    <Button variant="ghost" size="icon-xs" onClick={() => handleDelete(invite.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10">
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>
                        );
                    })}
                    {invites.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                            <Mail className="w-10 h-10 mx-auto mb-3 opacity-30" />
                            <p className="text-sm">No pending invites</p>
                            {canInvite && (
                                <Button variant="link" size="sm" onClick={() => setShowForm(true)} className="mt-2">Send your first invite</Button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
