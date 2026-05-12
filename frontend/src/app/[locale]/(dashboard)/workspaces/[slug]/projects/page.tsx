'use client';

import { useReducer, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { projectApi, type Project, type CreateProjectData } from '@/services/projectApi';
import { workspaceApi } from '@/services/workspaceApi';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { WorkspaceProjectsSkeleton } from '@/components/common/loading-skeletons';
import {
    FolderKanban,
    Plus,
    Loader2,
    ArrowLeft,
    ExternalLink,
    Trash2,
    MoreVertical,
    Globe
} from 'lucide-react';
import { Button } from '@/ui/button';
import { Link } from '@/i18n/navigation';
import { ConfirmDialog } from '@/components/common/confirm-dialog';

type State = {
    projects: Project[];
    loading: boolean;
    showForm: boolean;
    submitting: boolean;
    error: string;
    menuId: string | null;
    form: CreateProjectData;
};

type ProjectDraft = {
    version: number;
    savedAt: string;
    form: Partial<CreateProjectData>;
};

function ClientDateText({ value }: { value: string }) {
    const text = useMemo(() => {
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? null : date.toLocaleDateString();
    }, [value]);

    return <span suppressHydrationWarning>{text ?? ''}</span>;
}

type Action =
    | { type: 'setProjects'; projects: Project[] }
    | { type: 'setLoading'; loading: boolean }
    | { type: 'setShowForm'; showForm: boolean }
    | { type: 'toggleShowForm' }
    | { type: 'setSubmitting'; submitting: boolean }
    | { type: 'setError'; error: string }
    | { type: 'setMenuId'; menuId: string | null }
    | { type: 'updateForm'; form: Partial<CreateProjectData> }
    | { type: 'resetForm' };

const initialState: State = {
    projects: [],
    loading: true,
    showForm: false,
    submitting: false,
    error: '',
    menuId: null,
    form: { name: '', url: '', description: '' },
};

function reducer(state: State, action: Action): State {
    switch (action.type) {
        case 'setProjects':
            return { ...state, projects: action.projects };
        case 'setLoading':
            return { ...state, loading: action.loading };
        case 'setShowForm':
            return { ...state, showForm: action.showForm };
        case 'toggleShowForm':
            return { ...state, showForm: !state.showForm };
        case 'setSubmitting':
            return { ...state, submitting: action.submitting };
        case 'setError':
            return { ...state, error: action.error };
        case 'setMenuId':
            return { ...state, menuId: action.menuId };
        case 'updateForm':
            return { ...state, form: { ...state.form, ...action.form } };
        case 'resetForm':
            return { ...state, form: { name: '', url: '', description: '' } };
        default:
            return state;
    }
}

export default function ProjectsPage() {
    const params = useParams();
    const slug = params?.slug as string;
    const draftKey = slug ? `workspace-projects:${slug}:draft` : null;
    const { currentWorkspace, currentMembership, setCurrentWorkspace, setCurrentMembership, hasPermission } = useWorkspaceStore();
    const [state, dispatch] = useReducer(reducer, initialState);
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
    const draftReadyRef = useRef(false);
    const canCreate = hasPermission('create', 'Project');
    const [loadingWorkspace, setLoadingWorkspace] = useState(false);

    useEffect(() => {
        let active = true;

        const loadWorkspaceProjects = async () => {
            dispatch({ type: 'setLoading', loading: true });
            dispatch({ type: 'setError', error: '' });
            dispatch({ type: 'setProjects', projects: [] });
            setLoadingWorkspace(true);
            try {
                const workspace = currentWorkspace?.slug === slug ? currentWorkspace : await workspaceApi.get(slug);
                if (!active) return;

                setCurrentWorkspace(workspace);

                try {
                    if (currentMembership?.id && currentWorkspace?.slug === slug) {
                        // Keep the existing membership when the route already matches.
                    } else {
                        const membership = await workspaceApi.getMembership(slug);
                        if (!active) return;
                        setCurrentMembership(membership.member);
                    }
                } catch {
                    // Keep the workspace selected even if membership is unavailable.
                }

                const data = await projectApi.list();
                if (!active) return;

                const visibleProjects = (data.data || []).filter((project) => project.workspaceId === workspace.id);
                dispatch({ type: 'setProjects', projects: visibleProjects });
            } catch {
                if (active) {
                    dispatch({ type: 'setError', error: 'Failed to load projects' });
                }
            } finally {
                if (active) {
                    dispatch({ type: 'setLoading', loading: false });
                    setLoadingWorkspace(false);
                }
            }
        };

        void loadWorkspaceProjects();

        return () => {
            active = false;
        };
    }, [currentMembership?.id, currentWorkspace, setCurrentMembership, setCurrentWorkspace, slug]);

    useEffect(() => {
        if (!draftKey) {
            return;
        }

        try {
            const raw = window.localStorage.getItem(draftKey);
            if (!raw) {
                draftReadyRef.current = true;
                return;
            }

            const parsed = JSON.parse(raw) as Partial<ProjectDraft>;
            if (parsed.form) {
                dispatch({ type: 'updateForm', form: parsed.form });
            }
        } catch (restoreError) {
            console.error('Failed to restore workspace project draft', restoreError);
        } finally {
            draftReadyRef.current = true;
        }
    }, [draftKey]);

    useEffect(() => {
        if (!draftReadyRef.current || !draftKey || !state.showForm) {
            return;
        }

        const draft: ProjectDraft = {
            version: 1,
            savedAt: new Date().toISOString(),
            form: state.form,
        };
        window.localStorage.setItem(draftKey, JSON.stringify(draft));
    }, [draftKey, state.form, state.showForm]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!state.form.name || !state.form.url || !state.form.description) return;

        dispatch({ type: 'setSubmitting', submitting: true });
        dispatch({ type: 'setError', error: '' });
        try {
            const { project } = await projectApi.create({
                workspaceId: currentWorkspace?.id ?? undefined,
                name: state.form.name,
                description: state.form.description,
                content: {
                    sourceUrl: state.form.url,
                    source: 'workspace-projects-page',
                },
            });
            dispatch({ type: 'setProjects', projects: [project, ...state.projects] });
            if (draftKey) {
                window.localStorage.removeItem(draftKey);
            }
            dispatch({ type: 'resetForm' });
            dispatch({ type: 'setShowForm', showForm: false });
        } catch (err: unknown) {
            const apiErr = err as { response?: { data?: { message?: string } } };
            dispatch({ type: 'setError', error: apiErr?.response?.data?.message || 'Failed to create project' });
        }
        dispatch({ type: 'setSubmitting', submitting: false });
    };

    const handleDelete = async () => {
        if (!projectToDelete) return;
        try {
            await projectApi.delete(projectToDelete.id);
            dispatch({
                type: 'setProjects',
                projects: state.projects.filter((p) => p.id !== projectToDelete.id),
            });
            setProjectToDelete(null);
        } catch (err: unknown) {
            const apiErr = err as { response?: { data?: { message?: string } } };
            dispatch({ type: 'setError', error: apiErr?.response?.data?.message || 'Failed to delete project' });
        }
    };

    if (state.loading) {
        return <WorkspaceProjectsSkeleton />;
    }

    if (loadingWorkspace) {
        return <WorkspaceProjectsSkeleton />;
    }

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
            <div className="mb-8">
                <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
                >
                    <ArrowLeft className="size-4" />
                    Back
                </Link>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
                            <FolderKanban className="size-6 text-primary" />
                            {currentWorkspace?.name || 'Workspace'} projects
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            {state.projects.length} project{state.projects.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                    {canCreate && (
                        <Button onClick={() => dispatch({ type: 'toggleShowForm' })}>
                            <Plus className="size-4" />
                            New Project
                        </Button>
                    )}
                </div>
            </div>

            {state.error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-xl px-4 py-3 text-sm mb-6">
                    {state.error}
                </div>
            )}

            {state.showForm && (
                <div className="bg-card border border-border rounded-xl p-6 mb-6 animate-in slide-in-from-top-2">
                    <h3 className="text-sm font-semibold mb-4">Create New Project</h3>
                    <form onSubmit={handleCreate} className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <input
                                type="text"
                                value={state.form.name}
                                onChange={(e) => dispatch({ type: 'updateForm', form: { name: e.target.value } })}
                                placeholder="Project name"
                                className="px-3.5 py-2.5 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 transition-all placeholder:text-muted-foreground/50"
                                required
                            />
                            <input
                                type="url"
                                value={state.form.url}
                                onChange={(e) => dispatch({ type: 'updateForm', form: { url: e.target.value } })}
                                placeholder="https://project-url.com"
                                className="px-3.5 py-2.5 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 transition-all placeholder:text-muted-foreground/50"
                                required
                            />
                        </div>
                        <textarea
                            value={state.form.description}
                            onChange={(e) => dispatch({ type: 'updateForm', form: { description: e.target.value } })}
                            placeholder="Brief description?"
                            rows={2}
                            className="w-full px-3.5 py-2.5 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 transition-all placeholder:text-muted-foreground/50 resize-none"
                            required
                        />
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" type="button" onClick={() => dispatch({ type: 'setShowForm', showForm: false })}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={state.submitting}>
                                {state.submitting && <Loader2 className="size-4 animate-spin" />}
                                Create
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {state.projects.map((project) => (
                    <div
                        key={project.id}
                        className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group"
                    >
                        <div className="h-24 bg-gradient-to-br from-violet-500/20 via-violet-500/15 to-cyan-500/10 relative">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(139,92,246,0.15),transparent_60%)]" />
                            <div className="absolute bottom-3 left-4">
                                <div className="size-10 rounded-xl bg-background/90 backdrop-blur-sm border border-border flex items-center justify-center shadow-sm">
                                    <FolderKanban className="size-5 text-primary" />
                                </div>
                            </div>
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="relative">
                                    <Button
                                        variant="ghost"
                                        size="icon-xs"
                                        className="bg-background/50 backdrop-blur-sm"
                                        onClick={() => dispatch({ type: 'setMenuId', menuId: state.menuId === project.id ? null : project.id })}
                                    >
                                        <MoreVertical className="size-4" />
                                    </Button>
                                    {state.menuId === project.id && (
                                        <>
                                            <button
                                                type="button"
                                                aria-label="Close project actions menu"
                                                className="fixed inset-0 z-40"
                                                onClick={() => dispatch({ type: 'setMenuId', menuId: null })}
                                            />
                                            <div className="absolute right-0 top-full mt-1 z-50 bg-popover border border-border rounded-xl shadow-xl w-36 p-1.5">
                                                <button
                                                type="button"
                                                onClick={() => {
                                                        setProjectToDelete(project);
                                                        dispatch({ type: 'setMenuId', menuId: null });
                                                    }}
                                                    className="flex items-center gap-2 w-full px-2.5 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-all"
                                                >
                                                    <Trash2 className="size-4" />
                                                    Delete
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-4 space-y-2">
                            <h3 className="text-sm font-semibold text-foreground truncate">{project.name}</h3>
                            <p className="text-xs text-muted-foreground line-clamp-2">{project.description}</p>
                            <div className="flex items-center gap-2 pt-2">
                                <a
                                    href={`/creator/design-editor?projectId=${project.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                                >
                                    <Globe className="size-3" />
                                    Open editor
                                    <ExternalLink className="size-2.5" />
                                </a>
                                <span className="text-xs text-muted-foreground/50">•</span>
                                <span className="text-xs text-muted-foreground">
                                    <ClientDateText value={project.createdAt} />
                                </span>
                            </div>
                        </div>
                    </div>
                ))}

                {state.projects.length === 0 && !state.showForm && (
                    <div className="col-span-full text-center py-16 text-muted-foreground">
                        <FolderKanban className="size-12 mx-auto mb-3 opacity-20" />
                        <p className="text-sm font-medium">No projects yet</p>
                        <p className="text-xs text-muted-foreground mt-1">Create your first project to get started</p>
                        {canCreate && (
                            <Button variant="outline" size="sm" className="mt-4" onClick={() => dispatch({ type: 'setShowForm', showForm: true })}>
                                <Plus className="size-4" />
                                Create Project
                            </Button>
                        )}
                    </div>
                )}
            </div>

            <ConfirmDialog
                open={!!projectToDelete}
                onOpenChange={(open) => {
                    if (!open) setProjectToDelete(null);
                }}
                title="Delete project?"
                description={
                    projectToDelete
                        ? `Delete "${projectToDelete.name}" permanently? This action cannot be undone.`
                        : 'Delete this project permanently? This action cannot be undone.'
                }
                confirmText="Delete"
                onConfirm={handleDelete}
            />
        </div>
    );
}
