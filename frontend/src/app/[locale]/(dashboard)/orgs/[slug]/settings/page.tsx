'use client';

import { useId, useReducer, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { orgApi, type Organization, type UpdateOrgData } from '@/services/orgApi';
import { useOrgStore } from '@/stores/org-store';
import {
    Building2, Globe, Save, Trash2, Loader2, AlertTriangle,
    Link2, FileText, Shield, ArrowLeft,
} from 'lucide-react';
import { Button } from '@/ui/button';
import { Link } from '@/i18n/navigation';

type OrgSettingsState = {
    org: Organization | null;
    loading: boolean;
    saving: boolean;
    deleting: boolean;
    showDeleteConfirm: boolean;
    error: string;
    success: string;
    form: UpdateOrgData;
};

type OrgSettingsAction =
    | { type: 'setOrg'; org: Organization | null }
    | { type: 'setLoading'; loading: boolean }
    | { type: 'setSaving'; saving: boolean }
    | { type: 'setDeleting'; deleting: boolean }
    | { type: 'setShowDeleteConfirm'; showDeleteConfirm: boolean }
    | { type: 'setError'; error: string }
    | { type: 'setSuccess'; success: string }
    | { type: 'setForm'; form: UpdateOrgData }
    | { type: 'patchForm'; patch: UpdateOrgData };

const initialState: OrgSettingsState = {
    org: null,
    loading: true,
    saving: false,
    deleting: false,
    showDeleteConfirm: false,
    error: '',
    success: '',
    form: {},
};

function reducer(state: OrgSettingsState, action: OrgSettingsAction): OrgSettingsState {
    switch (action.type) {
        case 'setOrg':
            return { ...state, org: action.org };
        case 'setLoading':
            return { ...state, loading: action.loading };
        case 'setSaving':
            return { ...state, saving: action.saving };
        case 'setDeleting':
            return { ...state, deleting: action.deleting };
        case 'setShowDeleteConfirm':
            return { ...state, showDeleteConfirm: action.showDeleteConfirm };
        case 'setError':
            return { ...state, error: action.error };
        case 'setSuccess':
            return { ...state, success: action.success };
        case 'setForm':
            return { ...state, form: action.form };
        case 'patchForm':
            return { ...state, form: { ...state.form, ...action.patch } };
        default:
            return state;
    }
}

export default function OrgSettingsPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params?.slug as string;
    const { currentOrg, setCurrentOrg, hasPermission } = useOrgStore();
    const [state, dispatch] = useReducer(reducer, initialState);
    const nameId = useId();
    const urlId = useId();
    const descriptionId = useId();
    const domainId = useId();
    const attachUsersId = useId();

    const canUpdate = hasPermission('update', 'Organization');
    const canDelete = hasPermission('delete', 'Organization');

    const loadOrg = useCallback(async () => {
        try {
            const data = await orgApi.get(slug);
            dispatch({ type: 'setOrg', org: data });
            dispatch({
                type: 'setForm',
                form: {
                    name: data.name,
                    url: data.url,
                    description: data.description,
                    domain: data.domain,
                    shouldAttachUsersByDomain: data.shouldAttachUsersByDomain,
                },
            });
        } catch {
            dispatch({ type: 'setError', error: 'Failed to load organization' });
        }
        dispatch({ type: 'setLoading', loading: false });
    }, [slug]);

    useEffect(() => {
        queueMicrotask(() => { void loadOrg(); });
    }, [loadOrg]);

    const handleSave = async () => {
        dispatch({ type: 'setSaving', saving: true });
        dispatch({ type: 'setError', error: '' });
        dispatch({ type: 'setSuccess', success: '' });
        try {
            const updated = await orgApi.update(slug, state.form);
            dispatch({ type: 'setOrg', org: updated });
            if (currentOrg?.id === updated.id) {
                setCurrentOrg(updated);
            }
            dispatch({ type: 'setSuccess', success: 'Organization updated successfully' });
            setTimeout(() => dispatch({ type: 'setSuccess', success: '' }), 3000);
        } catch (err: unknown) {
            const apiErr = err as { response?: { data?: { message?: string } } };
            dispatch({ type: 'setError', error: apiErr?.response?.data?.message || 'Failed to update' });
        }
        dispatch({ type: 'setSaving', saving: false });
    };

    const handleDelete = async () => {
        dispatch({ type: 'setDeleting', deleting: true });
        try {
            await orgApi.delete(slug);
            setCurrentOrg(null);
            router.push('/dashboard');
        } catch (err: unknown) {
            const apiErr = err as { response?: { data?: { message?: string } } };
            dispatch({ type: 'setError', error: apiErr?.response?.data?.message || 'Failed to delete' });
            dispatch({ type: 'setDeleting', deleting: false });
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
        <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6">
            <div className="mb-8">
                <Link
                    href={"/dashboard" as string}
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </Link>
                <h1 className="text-2xl font-bold text-foreground">Organization Settings</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Manage your organization&apos;s configuration and details
                </p>
            </div>

            {state.error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-xl px-4 py-3 text-sm mb-6">
                    {state.error}
                </div>
            )}
            {state.success && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl px-4 py-3 text-sm mb-6">
                    {state.success}
                </div>
            )}

            <div className="space-y-6">
                <div className="bg-card border border-border rounded-xl p-6 space-y-5">
                    <h2 className="text-base font-semibold flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-primary" />
                        General Information
                    </h2>
                    <div className="space-y-2">
                        <label htmlFor={nameId} className="text-sm font-medium">Name</label>
                        <input
                            id={nameId}
                            type="text"
                            value={state.form.name || ''}
                            onChange={(e) => dispatch({ type: 'patchForm', patch: { name: e.target.value } })}
                            disabled={!canUpdate}
                            className="w-full px-3.5 py-2.5 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor={urlId} className="text-sm font-medium flex items-center gap-1.5"><Link2 className="w-3.5 h-3.5" />URL</label>
                        <input
                            id={urlId}
                            type="url"
                            value={state.form.url || ''}
                            onChange={(e) => dispatch({ type: 'patchForm', patch: { url: e.target.value } })}
                            disabled={!canUpdate}
                            className="w-full px-3.5 py-2.5 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor={descriptionId} className="text-sm font-medium flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" />Description</label>
                        <textarea
                            id={descriptionId}
                            value={state.form.description || ''}
                            onChange={(e) => dispatch({ type: 'patchForm', patch: { description: e.target.value } })}
                            disabled={!canUpdate}
                            rows={3}
                            className="w-full px-3.5 py-2.5 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all resize-none"
                        />
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
                        <Shield className="w-3.5 h-3.5 shrink-0" />
                        Slug: <code className="font-mono bg-background px-1.5 py-0.5 rounded">{state.org?.slug}</code>
                    </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-6 space-y-5">
                    <h2 className="text-base font-semibold flex items-center gap-2">
                        <Globe className="w-4 h-4 text-primary" />
                        Domain & Access
                    </h2>
                    <div className="space-y-2">
                        <label htmlFor={domainId} className="text-sm font-medium">Domain</label>
                        <input
                            id={domainId}
                            type="text"
                            value={state.form.domain || ''}
                            onChange={(e) => dispatch({ type: 'patchForm', patch: { domain: e.target.value || undefined } })}
                            disabled={!canUpdate}
                            placeholder="acme.com"
                            className="w-full px-3.5 py-2.5 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all placeholder:text-muted-foreground/50"
                        />
                    </div>
                    <label htmlFor={attachUsersId} className="flex items-start gap-3 cursor-pointer">
                        <input
                            id={attachUsersId}
                            type="checkbox"
                            checked={state.form.shouldAttachUsersByDomain || false}
                            onChange={(e) => dispatch({ type: 'patchForm', patch: { shouldAttachUsersByDomain: e.target.checked } })}
                            disabled={!canUpdate}
                            className="mt-1 rounded border-input"
                        />
                        <div>
                            <span className="text-sm font-medium">Auto-attach users by domain</span>
                            <span className="text-xs text-muted-foreground block mt-0.5">Automatically add users with matching email domain</span>
                        </div>
                    </label>
                </div>

                {canUpdate && (
                    <div className="flex justify-end">
                        <Button onClick={handleSave} disabled={state.saving}>
                            {state.saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Save Changes
                        </Button>
                    </div>
                )}

                {canDelete && (
                    <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-6 space-y-4">
                        <h2 className="text-base font-semibold text-destructive flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            Danger Zone
                        </h2>
                        <p className="text-sm text-muted-foreground">Deleting this organization will permanently remove all projects, members, and data.</p>
                        {!state.showDeleteConfirm ? (
                            <Button variant="destructive" onClick={() => dispatch({ type: 'setShowDeleteConfirm', showDeleteConfirm: true })}>
                                <Trash2 className="w-4 h-4" />Delete Organization
                            </Button>
                        ) : (
                            <div className="flex items-center gap-3">
                                <Button variant="destructive" onClick={handleDelete} disabled={state.deleting}>
                                    {state.deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                    Confirm Delete
                                </Button>
                                <Button variant="outline" onClick={() => dispatch({ type: 'setShowDeleteConfirm', showDeleteConfirm: false })}>Cancel</Button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
