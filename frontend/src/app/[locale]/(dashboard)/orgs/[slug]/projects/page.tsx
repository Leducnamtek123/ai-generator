'use client';

import { useReducer, useEffect, useCallback } from 'react';
import { projectApi, type Project, type CreateProjectData } from '@/services/projectApi';
import { useOrgStore } from '@/stores/org-store';
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

type State = {
    projects: Project[];
    loading: boolean;
    showForm: boolean;
    submitting: boolean;
    error: string;
    menuId: string | null;
    form: CreateProjectData;
};

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
    const { currentOrg, hasPermission } = useOrgStore();
    const [state, dispatch] = useReducer(reducer, initialState);
    const canCreate = hasPermission('create', 'Project');

    const loadProjects = useCallback(async () => {
        try {
            const data = await projectApi.list();
            dispatch({ type: 'setProjects', projects: data.data || [] });
        } catch {
            dispatch({ type: 'setError', error: 'Failed to load projects' });
        }
        dispatch({ type: 'setLoading', loading: false });
    }, []);

    useEffect(() => {
        queueMicrotask(() => {
            void loadProjects();
        });
    }, [loadProjects]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!state.form.name || !state.form.url || !state.form.description) return;

        dispatch({ type: 'setSubmitting', submitting: true });
        dispatch({ type: 'setError', error: '' });
        try {
            const { project } = await projectApi.create({
                ...state.form,
                organizationId: currentOrg?.id,
            });
            dispatch({ type: 'setProjects', projects: [project, ...state.projects] });
            dispatch({ type: 'resetForm' });
            dispatch({ type: 'setShowForm', showForm: false });
        } catch (err: unknown) {
            const apiErr = err as { response?: { data?: { message?: string } } };
            dispatch({ type: 'setError', error: apiErr?.response?.data?.message || 'Failed to create project' });
        }
        dispatch({ type: 'setSubmitting', submitting: false });
    };

    const handleDelete = async (projectId: string) => {
        if (!confirm('Are you sure you want to delete this project?')) return;

        try {
            await projectApi.delete(projectId);
            dispatch({
                type: 'setProjects',
                projects: state.projects.filter((p) => p.id !== projectId),
            });
        } catch (err: unknown) {
            const apiErr = err as { response?: { data?: { message?: string } } };
            dispatch({ type: 'setError', error: apiErr?.response?.data?.message || 'Failed to delete project' });
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
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
            <div className="mb-8">
                <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </Link>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                            <FolderKanban className="w-6 h-6 text-primary" />
                            Projects
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            {state.projects.length} project{state.projects.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                    {canCreate && (
                        <Button onClick={() => dispatch({ type: 'toggleShowForm' })}>
                            <Plus className="w-4 h-4" />
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
                            placeholder="Brief description..."
                            rows={2}
                            className="w-full px-3.5 py-2.5 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 transition-all placeholder:text-muted-foreground/50 resize-none"
                            required
                        />
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" type="button" onClick={() => dispatch({ type: 'setShowForm', showForm: false })}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={state.submitting}>
                                {state.submitting && <Loader2 className="w-4 h-4 animate-spin" />}
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
                        <div className="h-24 bg-gradient-to-br from-violet-500/20 via-indigo-500/15 to-cyan-500/10 relative">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(139,92,246,0.15),transparent_60%)]" />
                            <div className="absolute bottom-3 left-4">
                                <div className="w-10 h-10 rounded-xl bg-background/90 backdrop-blur-sm border border-border flex items-center justify-center shadow-sm">
                                    <FolderKanban className="w-5 h-5 text-primary" />
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
                                        <MoreVertical className="w-4 h-4" />
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
                                                        void handleDelete(project.id);
                                                        dispatch({ type: 'setMenuId', menuId: null });
                                                    }}
                                                    className="flex items-center gap-2 w-full px-2.5 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
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
                                    href={project.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                                >
                                    <Globe className="w-3 h-3" />
                                    Visit
                                    <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                                <span className="text-xs text-muted-foreground/50">•</span>
                                <span className="text-xs text-muted-foreground">
                                    {new Date(project.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}

                {state.projects.length === 0 && !state.showForm && (
                    <div className="col-span-full text-center py-16 text-muted-foreground">
                        <FolderKanban className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p className="text-sm font-medium">No projects yet</p>
                        <p className="text-xs text-muted-foreground mt-1">Create your first project to get started</p>
                        {canCreate && (
                            <Button variant="outline" size="sm" className="mt-4" onClick={() => dispatch({ type: 'setShowForm', showForm: true })}>
                                <Plus className="w-4 h-4" />
                                Create Project
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
