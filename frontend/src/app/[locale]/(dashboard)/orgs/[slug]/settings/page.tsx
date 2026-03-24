'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { orgApi, type Organization, type UpdateOrgData } from '@/services/orgApi';
import { useOrgStore } from '@/stores/org-store';
import {
    Building2, Globe, Save, Trash2, Loader2, AlertTriangle,
    Link2, FileText, Shield, ArrowLeft
} from 'lucide-react';
import { Button } from '@/ui/button';
import { Link } from '@/i18n/navigation';

export default function OrgSettingsPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params?.slug as string;
    const { currentOrg, setCurrentOrg, hasPermission } = useOrgStore();

    const [org, setOrg] = useState<Organization | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [form, setForm] = useState<UpdateOrgData>({});

    const canUpdate = hasPermission('update', 'Organization');
    const canDelete = hasPermission('delete', 'Organization');

    const loadOrg = useCallback(async () => {
        try {
            setLoading(true);
            const data = await orgApi.get(slug);
            setOrg(data);
            setForm({
                name: data.name,
                url: data.url,
                description: data.description,
                domain: data.domain,
                shouldAttachUsersByDomain: data.shouldAttachUsersByDomain,
            });
        } catch {
            setError('Failed to load organization');
        } finally {
            setLoading(false);
        }
    }, [slug]);

    useEffect(() => {
        loadOrg();
    }, [loadOrg]);

    const handleSave = async () => {
        setSaving(true);
        setError('');
        setSuccess('');
        try {
            const updated = await orgApi.update(slug, form);
            setOrg(updated);
            if (currentOrg?.id === updated.id) {
                setCurrentOrg(updated);
            }
            setSuccess('Organization updated successfully');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: unknown) {
            const apiErr = err as { response?: { data?: { message?: string } } };
            setError(apiErr?.response?.data?.message || 'Failed to update');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await orgApi.delete(slug);
            setCurrentOrg(null);
            router.push('/dashboard');
        } catch (err: unknown) {
            const apiErr = err as { response?: { data?: { message?: string } } };
            setError(apiErr?.response?.data?.message || 'Failed to delete');
            setDeleting(false);
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

            {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-xl px-4 py-3 text-sm mb-6">
                    {error}
                </div>
            )}
            {success && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl px-4 py-3 text-sm mb-6">
                    {success}
                </div>
            )}

            <div className="space-y-6">
                <div className="bg-card border border-border rounded-xl p-6 space-y-5">
                    <h2 className="text-base font-semibold flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-primary" />
                        General Information
                    </h2>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Name</label>
                        <input type="text" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} disabled={!canUpdate} className="w-full px-3.5 py-2.5 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-1.5"><Link2 className="w-3.5 h-3.5" />URL</label>
                        <input type="url" value={form.url || ''} onChange={(e) => setForm({ ...form, url: e.target.value })} disabled={!canUpdate} className="w-full px-3.5 py-2.5 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" />Description</label>
                        <textarea value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} disabled={!canUpdate} rows={3} className="w-full px-3.5 py-2.5 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all resize-none" />
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
                        <Shield className="w-3.5 h-3.5 shrink-0" />
                        Slug: <code className="font-mono bg-background px-1.5 py-0.5 rounded">{org?.slug}</code>
                    </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-6 space-y-5">
                    <h2 className="text-base font-semibold flex items-center gap-2">
                        <Globe className="w-4 h-4 text-primary" />
                        Domain & Access
                    </h2>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Domain</label>
                        <input type="text" value={form.domain || ''} onChange={(e) => setForm({ ...form, domain: e.target.value || undefined })} disabled={!canUpdate} placeholder="acme.com" className="w-full px-3.5 py-2.5 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all placeholder:text-muted-foreground/50" />
                    </div>
                    <label className="flex items-start gap-3 cursor-pointer">
                        <input type="checkbox" checked={form.shouldAttachUsersByDomain || false} onChange={(e) => setForm({ ...form, shouldAttachUsersByDomain: e.target.checked })} disabled={!canUpdate} className="mt-1 rounded border-input" />
                        <div>
                            <span className="text-sm font-medium">Auto-attach users by domain</span>
                            <span className="text-xs text-muted-foreground block mt-0.5">Automatically add users with matching email domain</span>
                        </div>
                    </label>
                </div>

                {canUpdate && (
                    <div className="flex justify-end">
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
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
                        {!showDeleteConfirm ? (
                            <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)}>
                                <Trash2 className="w-4 h-4" />Delete Organization
                            </Button>
                        ) : (
                            <div className="flex items-center gap-3">
                                <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                                    {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                    Confirm Delete
                                </Button>
                                <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
