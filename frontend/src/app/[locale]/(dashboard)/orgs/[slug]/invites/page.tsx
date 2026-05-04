'use client';

import { useReducer, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { inviteApi, type Invite, type CreateInviteData } from '@/services/inviteApi';
import { useOrgStore } from '@/stores/org-store';
import { Mail, Plus, Trash2, Loader2, ArrowLeft, Clock, Shield, ShieldCheck, Receipt } from 'lucide-react';
import { Button } from '@/ui/button';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

const roleConfig: Record<string, { label: string; icon: typeof Shield; color: string }> = {
    ADMIN: { label: 'Admin', icon: ShieldCheck, color: 'text-violet-500 bg-violet-500/10' },
    MEMBER: { label: 'Member', icon: Shield, color: 'text-blue-500 bg-blue-500/10' },
    BILLING: { label: 'Billing', icon: Receipt, color: 'text-emerald-500 bg-emerald-500/10' },
};

type InvitePageState = {
    invites: Invite[];
    loading: boolean;
    showForm: boolean;
    submitting: boolean;
    error: string;
    form: CreateInviteData;
};

type InvitePageAction =
    | { type: 'setInvites'; invites: Invite[] }
    | { type: 'setLoading'; loading: boolean }
    | { type: 'setShowForm'; showForm: boolean }
    | { type: 'setSubmitting'; submitting: boolean }
    | { type: 'setError'; error: string }
    | { type: 'setForm'; form: Partial<CreateInviteData> }
    | { type: 'resetForm' };

const initialState: InvitePageState = {
    invites: [],
    loading: true,
    showForm: false,
    submitting: false,
    error: '',
    form: { email: '', role: 'MEMBER' },
};

function reducer(state: InvitePageState, action: InvitePageAction): InvitePageState {
    switch (action.type) {
        case 'setInvites':
            return { ...state, invites: action.invites };
        case 'setLoading':
            return { ...state, loading: action.loading };
        case 'setShowForm':
            return { ...state, showForm: action.showForm };
        case 'setSubmitting':
            return { ...state, submitting: action.submitting };
        case 'setError':
            return { ...state, error: action.error };
        case 'setForm':
            return { ...state, form: { ...state.form, ...action.form } };
        case 'resetForm':
            return { ...state, form: { email: '', role: 'MEMBER' } };
        default:
            return state;
    }
}

export default function InvitesPage() {
    const params = useParams();
    const slug = params?.slug as string;
    const { hasPermission } = useOrgStore();
    const [state, dispatch] = useReducer(reducer, initialState);

    const canInvite = hasPermission('create', 'Invite');

    const loadInvites = useCallback(async () => {
        try {
            const data = await inviteApi.list(slug);
            dispatch({ type: 'setInvites', invites: data });
        } catch {
            dispatch({ type: 'setError', error: 'Failed to load invites' });
        }
        dispatch({ type: 'setLoading', loading: false });
    }, [slug]);

    useEffect(() => {
        queueMicrotask(() => { void loadInvites(); });
    }, [loadInvites]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!state.form.email) return;
        dispatch({ type: 'setSubmitting', submitting: true });
        dispatch({ type: 'setError', error: '' });
        try {
            const invite = await inviteApi.create(slug, state.form);
            dispatch({ type: 'setInvites', invites: [invite, ...state.invites] });
            dispatch({ type: 'resetForm' });
            dispatch({ type: 'setShowForm', showForm: false });
        } catch (err: unknown) {
            const apiErr = err as { response?: { data?: { message?: string } } };
            dispatch({ type: 'setError', error: apiErr?.response?.data?.message || 'Failed to create invite' });
        }
        dispatch({ type: 'setSubmitting', submitting: false });
    };

    const handleDelete = async (inviteId: string) => {
        try {
            await inviteApi.delete(slug, inviteId);
            dispatch({ type: 'setInvites', invites: state.invites.filter((i) => i.id !== inviteId) });
        } catch (err: unknown) {
            const apiErr = err as { response?: { data?: { message?: string } } };
            dispatch({ type: 'setError', error: apiErr?.response?.data?.message || 'Failed to delete invite' });
        }
    };

    if (state.loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6">
            <div className="mb-8">
                <Link href={'/dashboard' as string} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
                    <ArrowLeft className="w-4 h-4" />Back
                </Link>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                            <Mail className="w-6 h-6 text-primary" />Invites
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">{state.invites.length} pending invite{state.invites.length !== 1 ? 's' : ''}</p>
                    </div>
                    {canInvite && (
                        <Button onClick={() => dispatch({ type: 'setShowForm', showForm: !state.showForm })}>
                            <Plus className="w-4 h-4" />Invite Member
                        </Button>
                    )}
                </div>
            </div>

            {state.error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-xl px-4 py-3 text-sm mb-6">{state.error}</div>
            )}

            {state.showForm && (
                <div className="bg-card border border-border rounded-xl p-6 mb-6 animate-in slide-in-from-top-2">
                    <h3 className="text-sm font-semibold mb-4">Send Invite</h3>
                    <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-3">
                        <input
                            type="email"
                            value={state.form.email}
                            onChange={(e) => dispatch({ type: 'setForm', form: { email: e.target.value } })}
                            placeholder="member@example.com"
                            className="flex-1 px-3.5 py-2.5 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 transition-all placeholder:text-muted-foreground/50"
                            required
                        />
                        <select
                            value={state.form.role}
                            onChange={(e) => dispatch({ type: 'setForm', form: { role: e.target.value as CreateInviteData['role'] } })}
                            className="px-3.5 py-2.5 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 transition-all"
                        >
                            <option value="MEMBER">Member</option>
                            <option value="ADMIN">Admin</option>
                            <option value="BILLING">Billing</option>
                        </select>
                        <Button type="submit" disabled={state.submitting}>
                            {state.submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}Send
                        </Button>
                    </form>
                </div>
            )}

            <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="divide-y divide-border">
                    {state.invites.map((invite) => {
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
                                <div className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium', config.color)}>
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
                    {state.invites.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                            <Mail className="w-10 h-10 mx-auto mb-3 opacity-30" />
                            <p className="text-sm">No pending invites</p>
                            {canInvite && (
                                <Button variant="link" size="sm" onClick={() => dispatch({ type: 'setShowForm', showForm: true })} className="mt-2">
                                    Send your first invite
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
