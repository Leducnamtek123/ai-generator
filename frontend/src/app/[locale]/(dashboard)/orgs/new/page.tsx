'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { orgApi, type CreateOrgData } from '@/services/orgApi';
import { useOrgStore } from '@/stores/org-store';
import { Building2, Globe, ArrowLeft, Loader2, Link2, FileText, Shield } from 'lucide-react';
import { Button } from '@/ui/button';
import { Link } from '@/i18n/navigation';

export default function NewOrgPage() {
    const router = useRouter();
    const { setCurrentOrg, setOrganizations, organizations } = useOrgStore();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState<CreateOrgData>({
        name: '',
        url: '',
        description: '',
        domain: '',
        shouldAttachUsersByDomain: false,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name || !form.url || !form.description) {
            setError('Please fill in all required fields');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const org = await orgApi.create({
                ...form,
                domain: form.domain || undefined,
            });
            setOrganizations([...organizations, org]);
            setCurrentOrg(org);
            router.push(`/orgs/${org.slug}/settings`);
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Failed to create organization');
        }
        setLoading(false);
    };

    return (
        <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6">
            {/* Header */}
            <div className="mb-8">
                <Link
                    href={"/dashboard" as any}
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Dashboard
                </Link>
                <h1 className="text-2xl font-bold text-foreground">Create Organization</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Set up a new organization to collaborate with your team
                </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-xl px-4 py-3 text-sm">
                        {error}
                    </div>
                )}

                <div className="bg-card border border-border rounded-xl p-6 space-y-5">
                    <h2 className="text-base font-semibold flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-primary" />
                        Organization Details
                    </h2>

                    {/* Name */}
                    <div className="space-y-2">
                        <div className="text-sm font-medium text-foreground">
                            Name <span className="text-destructive">*</span>
                        </div>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            placeholder="Acme Inc."
                            className="w-full px-3.5 py-2.5 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring transition-all placeholder:text-muted-foreground/50"
                        />
                    </div>

                    {/* URL */}
                    <div className="space-y-2">
                        <div className="text-sm font-medium text-foreground flex items-center gap-1.5">
                            <Link2 className="w-3.5 h-3.5" />
                            URL <span className="text-destructive">*</span>
                        </div>
                        <input
                            type="url"
                            value={form.url}
                            onChange={(e) => setForm({ ...form, url: e.target.value })}
                            placeholder="https://acme.com"
                            className="w-full px-3.5 py-2.5 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring transition-all placeholder:text-muted-foreground/50"
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <div className="text-sm font-medium text-foreground flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5" />
                            Description <span className="text-destructive">*</span>
                        </div>
                        <textarea
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            placeholder="Brief description of your organization..."
                            rows={3}
                            className="w-full px-3.5 py-2.5 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring transition-all placeholder:text-muted-foreground/50 resize-none"
                        />
                    </div>
                </div>

                {/* Domain Settings */}
                <div className="bg-card border border-border rounded-xl p-6 space-y-5">
                    <h2 className="text-base font-semibold flex items-center gap-2">
                        <Globe className="w-4 h-4 text-primary" />
                        Domain & Access
                    </h2>

                    <div className="space-y-2">
                        <div className="text-sm font-medium text-foreground">
                            Domain <span className="text-muted-foreground text-xs">(optional)</span>
                        </div>
                        <input
                            type="text"
                            value={form.domain || ''}
                            onChange={(e) => setForm({ ...form, domain: e.target.value })}
                            placeholder="acme.com"
                            className="w-full px-3.5 py-2.5 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring transition-all placeholder:text-muted-foreground/50"
                        />
                        <p className="text-xs text-muted-foreground">
                            Users with this email domain can auto-join the organization
                        </p>
                    </div>

                    <label className="flex items-start gap-3 cursor-pointer group">
                        <div className="relative mt-0.5">
                            <input
                                type="checkbox"
                                checked={form.shouldAttachUsersByDomain}
                                onChange={(e) =>
                                    setForm({ ...form, shouldAttachUsersByDomain: e.target.checked })
                                }
                                className="sr-only peer"
                            />
                            <div className="w-5 h-5 border-2 border-input rounded peer-checked:bg-primary peer-checked:border-primary transition-all flex items-center justify-center">
                                {form.shouldAttachUsersByDomain && (
                                    <svg className="w-3 h-3 text-primary-foreground" viewBox="0 0 12 12" fill="none">
                                        <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                )}
                            </div>
                        </div>
                        <div>
                            <span className="text-sm font-medium text-foreground flex items-center gap-1.5">
                                <Shield className="w-3.5 h-3.5" />
                                Auto-attach users by domain
                            </span>
                            <span className="text-xs text-muted-foreground block mt-0.5">
                                Automatically add users with matching email domain to this organization
                            </span>
                        </div>
                    </label>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                    <Button variant="outline" type="button" onClick={() => router.back()}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        Create Organization
                    </Button>
                </div>
            </form>
        </div>
    );
}
