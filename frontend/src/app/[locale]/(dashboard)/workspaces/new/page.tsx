'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { workspaceApi, type CreateWorkspaceData } from '@/services/workspaceApi';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { Building2, Globe, ArrowLeft, Loader2, Link2, FileText, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Link } from '@/i18n/navigation';

type WorkspaceDraft = {
    version: number;
    savedAt: string;
    form: Partial<CreateWorkspaceData>;
};

const WORKSPACE_DRAFT_KEY = 'workspaces:new:draft';

export default function NewWorkspacePage() {
    const { push, back } = useRouter();
    const { setCurrentWorkspace, setWorkspaces } = useWorkspaceStore();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState<CreateWorkspaceData>(() => {
        const fallback: CreateWorkspaceData = {
            name: '',
            url: '',
            description: '',
            domain: '',
            shouldAttachUsersByDomain: false,
        };

        if (typeof window === 'undefined') {
            return fallback;
        }

        try {
            const raw = window.localStorage.getItem(WORKSPACE_DRAFT_KEY);
            if (!raw) {
                return fallback;
            }

            const parsed = JSON.parse(raw) as Partial<WorkspaceDraft>;
            if (parsed.form) {
                return {
                    ...fallback,
                    ...parsed.form,
                };
            }
        } catch (restoreError) {
            console.error('Failed to restore workspace draft', restoreError);
        }

        return fallback;
    });

    useEffect(() => {
        const draft: WorkspaceDraft = {
            version: 1,
            savedAt: new Date().toISOString(),
            form,
        };
        window.localStorage.setItem(WORKSPACE_DRAFT_KEY, JSON.stringify(draft));
    }, [form]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name || !form.url || !form.description) {
            setError('Please fill in all required fields');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const workspace = await workspaceApi.create({
                ...form,
                domain: form.domain || undefined,
            });
            setWorkspaces((current) => [...current, workspace]);
            setCurrentWorkspace(workspace);
            window.localStorage.removeItem(WORKSPACE_DRAFT_KEY);
            push(`/workspaces/${workspace.slug}/settings`);
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.message || 'Failed to create workspace');
            } else {
                setError(err instanceof Error ? err.message : 'Failed to create workspace');
            }
        }
        setLoading(false);
    };

    return (
        <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6">
            {/* Header */}
            <div className="mb-8">
                <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
                >
                    <ArrowLeft className="size-4" />
                    Back to Dashboard
                </Link>
                <h1 className="text-2xl font-semibold text-foreground">Create Workspace</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Set up a new workspace to collaborate with your team
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
                        <Building2 className="size-4 text-primary" />
                        Workspace Details
                    </h2>

                    {/* Name */}
                    <div className="space-y-2">
                        <div className="text-sm font-medium text-foreground">
                            Name <span className="text-destructive">*</span>
                        </div>
                        <Input
                            type="text"
                            value={form.name}
                            onChange={(e) =>
                                setForm((current) => ({
                                    ...current,
                                    name: e.target.value,
                                }))
                            }
                            placeholder="Acme Inc."
                        />
                    </div>

                    {/* URL */}
                    <div className="space-y-2">
                        <div className="text-sm font-medium text-foreground flex items-center gap-1.5">
                            <Link2 className="size-3.5" />
                            URL <span className="text-destructive">*</span>
                        </div>
                        <Input
                            type="url"
                            value={form.url}
                            onChange={(e) =>
                                setForm((current) => ({
                                    ...current,
                                    url: e.target.value,
                                }))
                            }
                            placeholder="https://acme.com"
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <div className="text-sm font-medium text-foreground flex items-center gap-1.5">
                            <FileText className="size-3.5" />
                            Description <span className="text-destructive">*</span>
                        </div>
                        <Textarea
                            value={form.description}
                            onChange={(e) =>
                                setForm((current) => ({
                                    ...current,
                                    description: e.target.value,
                                }))
                            }
                            placeholder="Brief description of your workspace?"
                            rows={3}
                        />
                    </div>
                </div>

                {/* Domain Settings */}
                <div className="bg-card border border-border rounded-xl p-6 space-y-5">
                    <h2 className="text-base font-semibold flex items-center gap-2">
                        <Globe className="size-4 text-primary" />
                        Domain & Access
                    </h2>

                    <div className="space-y-2">
                        <div className="text-sm font-medium text-foreground">
                            Domain <span className="text-muted-foreground text-xs">(optional)</span>
                        </div>
                        <Input
                            type="text"
                            value={form.domain || ''}
                            onChange={(e) =>
                                setForm((current) => ({
                                    ...current,
                                    domain: e.target.value,
                                }))
                            }
                            placeholder="acme.com"
                        />
                        <p className="text-xs text-muted-foreground">
                            Users with this email domain can auto-join the workspace
                        </p>
                    </div>

                    <div className="flex items-start gap-3">
                        <Checkbox
                            id="attach-users-by-domain"
                            checked={form.shouldAttachUsersByDomain}
                            onCheckedChange={(checked) =>
                                setForm((current) => ({
                                    ...current,
                                    shouldAttachUsersByDomain: Boolean(checked),
                                }))
                            }
                        />
                        <label htmlFor="attach-users-by-domain" className="block cursor-pointer">
                            <span className="text-sm font-medium text-foreground flex items-center gap-1.5">
                                <Shield className="size-3.5" />
                                Auto-attach users by domain
                            </span>
                            <span className="text-xs text-muted-foreground block mt-0.5">
                                Automatically add users with matching email domain to this workspace
                            </span>
                        </label>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                    <Button variant="outline" type="button" onClick={() => back()}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                        {loading && <Loader2 className="size-4 animate-spin" />}
                        Create Workspace
                    </Button>
                </div>
            </form>
        </div>
    );
}
