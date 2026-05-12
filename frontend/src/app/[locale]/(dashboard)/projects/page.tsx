'use client';

import { useRouter } from '@/i18n/navigation';
import { useEffect, useReducer, useCallback, useSyncExternalStore, useState } from 'react';
import {
    Plus,
    Search,
    Folder,
    MoreHorizontal,
    LayoutGrid,
    List,
    ChevronDown,
    Home,
    Building2
} from 'lucide-react';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { cn } from '@/lib/utils';
import { useProjectStore, Project } from '@/stores/project-store';
import { workspaceApi } from '@/services/workspaceApi';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { DataTable } from '@/components/shared/data-table/data-table';
import { columns } from '@/components/projects/columns';
import { ProjectGridSkeleton, ProjectListSkeleton } from '@/components/common/loading-skeletons';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type ProjectScope = 'personal' | 'workspace';

type ProjectsState = {
    viewMode: 'grid' | 'list';
    showCreateModal: boolean;
    projectName: string;
    projectDesc: string;
};

type ProjectsAction =
    | { type: 'setViewMode'; viewMode: 'grid' | 'list' }
    | { type: 'openCreateModal' }
    | { type: 'closeCreateModal' }
    | { type: 'setProjectName'; projectName: string }
    | { type: 'setProjectDesc'; projectDesc: string }
    | { type: 'resetCreateForm' };

type ProjectDraft = {
    version: number;
    savedAt: string;
    projectName: string;
    projectDesc: string;
};

function ClientDateText({ value }: { value: string | Date }) {
    const subscribe = useCallback(() => () => {}, []);
    const getSnapshot = useCallback(() => {
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString();
    }, [value]);

    const text = useSyncExternalStore(subscribe, getSnapshot, () => '');
    return <span suppressHydrationWarning>{text}</span>;
}

const PROJECT_DRAFT_KEY = 'projects:create-modal:draft';

const initialState: ProjectsState = {
    viewMode: 'grid',
    showCreateModal: false,
    projectName: '',
    projectDesc: '',
};

function projectsReducer(state: ProjectsState, action: ProjectsAction): ProjectsState {
    switch (action.type) {
        case 'setViewMode':
            return { ...state, viewMode: action.viewMode };
        case 'openCreateModal':
            return { ...state, showCreateModal: true };
        case 'closeCreateModal':
            return { ...state, showCreateModal: false };
        case 'setProjectName':
            return { ...state, projectName: action.projectName };
        case 'setProjectDesc':
            return { ...state, projectDesc: action.projectDesc };
        case 'resetCreateForm':
            return { ...state, projectName: '', projectDesc: '' };
        default:
            return state;
    }
}

export default function ProjectsPage() {
    const { push } = useRouter();
    const { projects, fetchProjects, createProject, isLoading } = useProjectStore();
    const currentWorkspace = useWorkspaceStore((state) => state.currentWorkspace);
    const workspaces = useWorkspaceStore((state) => state.workspaces);
    const setWorkspaces = useWorkspaceStore((state) => state.setWorkspaces);
    const [state, dispatch] = useReducer(projectsReducer, initialState);
    const [scope, setScope] = useState<ProjectScope>('personal');
    const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(currentWorkspace?.id ?? null);
    const effectiveWorkspaceId = selectedWorkspaceId ?? currentWorkspace?.id ?? workspaces[0]?.id ?? null;
    const selectedWorkspace = workspaces.find((workspace) => workspace.id === effectiveWorkspaceId) ?? null;
    const scopeLabel = scope === 'workspace' ? (selectedWorkspace?.name ?? 'Workspace') : 'Personal';
    const visibleProjects = projects.filter((project) =>
        scope === 'workspace'
            ? Boolean(effectiveWorkspaceId) && project.workspaceId === effectiveWorkspaceId
            : !project.workspaceId,
    );

    useEffect(() => {
        if (!workspaces.length) {
            void workspaceApi.list().then((items) => setWorkspaces(items));
        }
    }, [setWorkspaces, workspaces.length]);

    useEffect(() => {
        if (scope === 'workspace') {
            if (!effectiveWorkspaceId) {
                return;
            }

            fetchProjects({
                limit: 50,
                filters: { workspaceId: effectiveWorkspaceId },
            });
            return;
        }

        fetchProjects({ limit: 50 });
    }, [effectiveWorkspaceId, fetchProjects, scope]);

    useEffect(() => {
        try {
            const raw = window.localStorage.getItem(PROJECT_DRAFT_KEY);
            if (!raw) {
                return;
            }

            const parsed = JSON.parse(raw) as Partial<ProjectDraft>;
            if (typeof parsed.projectName === 'string') {
                dispatch({ type: 'setProjectName', projectName: parsed.projectName });
            }
            if (typeof parsed.projectDesc === 'string') {
                dispatch({ type: 'setProjectDesc', projectDesc: parsed.projectDesc });
            }
        } catch (error) {
            console.error('Failed to restore project draft', error);
        }
    }, []);

    useEffect(() => {
        if (!state.showCreateModal) {
            return;
        }

        const draft: ProjectDraft = {
            version: 1,
            savedAt: new Date().toISOString(),
            projectName: state.projectName,
            projectDesc: state.projectDesc,
        };
        window.localStorage.setItem(PROJECT_DRAFT_KEY, JSON.stringify(draft));
    }, [state.projectDesc, state.projectName]);

    const handleCreateProject = async () => {
        if (!state.projectName.trim()) return;

        const newId = await createProject({
            name: state.projectName,
            description: state.projectDesc,
            workspaceId: scope === 'workspace' ? effectiveWorkspaceId : null,
        });

        if (newId) {
            window.localStorage.removeItem(PROJECT_DRAFT_KEY);
            dispatch({ type: 'closeCreateModal' });
            dispatch({ type: 'resetCreateForm' });
            push(`/projects/${newId}`);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="px-8 py-12 border-b border-border">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-lg">
                        <h1 className="text-3xl font-semibold text-foreground mb-2">
                            {scopeLabel} projects
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {scope === 'workspace'
                                ? 'Projects that belong to the selected workspace.'
                                : 'Projects that belong to your personal space.'}
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="inline-flex rounded-full border border-border bg-muted p-1">
                            <button
                                type="button"
                                onClick={() => setScope('personal')}
                                className={cn(
                                    'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors',
                                    scope === 'personal'
                                        ? 'bg-background text-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground'
                                )}
                            >
                                <Home className="size-4" />
                                Personal
                            </button>
                            <button
                                type="button"
                                onClick={() => setScope('workspace')}
                                className={cn(
                                    'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors',
                                    scope === 'workspace'
                                        ? 'bg-background text-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground'
                                )}
                            >
                                <Building2 className="size-4" />
                                Workspace
                            </button>
                        </div>

                        {scope === 'workspace' ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="justify-between gap-2 min-w-[220px]">
                                        <span className="truncate">
                                            {selectedWorkspace?.name ?? 'Select workspace'}
                                        </span>
                                        <ChevronDown className="size-4 shrink-0" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-64">
                                    <DropdownMenuLabel>Workspace scope</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuRadioGroup
                                        value={effectiveWorkspaceId ?? ''}
                                        onValueChange={(value) => setSelectedWorkspaceId(value)}
                                    >
                                        {workspaces.map((workspace) => (
                                            <DropdownMenuRadioItem key={workspace.id} value={workspace.id}>
                                                {workspace.name}
                                            </DropdownMenuRadioItem>
                                        ))}
                                    </DropdownMenuRadioGroup>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : null}

                        <Button
                            onClick={() => dispatch({ type: 'openCreateModal' })}
                            disabled={scope === 'workspace' && !effectiveWorkspaceId}
                            className="gap-2 px-5"
                        >
                            <Plus className="size-4" />
                            New Project
                        </Button>
                    </div>
                </div>
            </div>

            {/* View controls */}
            <div className="px-8 py-4 flex items-center justify-between border-b border-border">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Folder className="size-4" />
                    <span>{visibleProjects.length} project{visibleProjects.length !== 1 ? 's' : ''}</span>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Search projects?"
                            className="w-56 h-9 pl-10 pr-4"
                        />
                    </div>
                    <div className="flex items-center border border-input rounded-md p-1 bg-background">
                        <Button
                            variant={state.viewMode === 'grid' ? 'secondary' : 'ghost'}
                            size="icon-xs"
                            onClick={() => dispatch({ type: 'setViewMode', viewMode: 'grid' })}
                            className="size-7"
                            title="Grid View"
                        >
                            <LayoutGrid className="size-4" />
                        </Button>
                        <Button
                            variant={state.viewMode === 'list' ? 'secondary' : 'ghost'}
                            size="icon-xs"
                            onClick={() => dispatch({ type: 'setViewMode', viewMode: 'list' })}
                            className="size-7"
                            title="List View"
                        >
                            <List className="size-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="px-8 py-6">
                {isLoading ? (
                    state.viewMode === 'grid' ? (
                        <ProjectGridSkeleton count={8} />
                    ) : (
                        <ProjectListSkeleton count={6} />
                    )
                ) : visibleProjects.length === 0 ? (
                    <div className="col-span-full text-center py-20 text-muted-foreground border border-dashed border-border rounded-2xl">
                        <Folder className="size-12 mx-auto mb-4 opacity-20" />
                        <p>No projects found in this scope. Create one to get started!</p>
                    </div>
                ) : (
                    state.viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {visibleProjects.map((project) => (
                                <ProjectCard key={project.id} project={project} />
                            ))}
                        </div>
                    ) : (
                        <DataTable columns={columns} data={visibleProjects} />
                    )
                )}
            </div>

            {/* Create Project Modal */}
            {state.showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <button
                        type="button"
                        aria-label="Close create project modal"
                        className="absolute inset-0 bg-[#0a0a0f]/60 backdrop-blur-sm"
                        onClick={() => dispatch({ type: 'closeCreateModal' })}
                    />
                    <div className="relative w-full max-w-md bg-card rounded-2xl border border-border p-6 shadow-2xl">
                        <h2 className="text-xl font-semibold mb-4">Create New Project</h2>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label htmlFor="projectName" className="block text-sm font-medium text-muted-foreground mb-2">
                                    Project Name
                                </label>
                                <Input
                                    id="projectName"
                                    type="text"
                                    value={state.projectName}
                                    onChange={(e) => dispatch({ type: 'setProjectName', projectName: e.target.value })}
                                    placeholder="e.g. Social Media Campaign"
                                />
                            </div>
                            <div>
                                <label htmlFor="projectDesc" className="block text-sm font-medium text-muted-foreground mb-2">
                                    Description (Optional)
                                </label>
                                <textarea
                                    id="projectDesc"
                                    value={state.projectDesc}
                                    onChange={(e) => dispatch({ type: 'setProjectDesc', projectDesc: e.target.value })}
                                    placeholder="What is this project about?"
                                    className="w-full h-24 px-3 py-2 bg-background border border-border rounded-lg placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <Button variant="ghost" onClick={() => dispatch({ type: 'closeCreateModal' })}>Cancel</Button>
                            <Button onClick={handleCreateProject} disabled={!state.projectName.trim()}>Create Project</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function ProjectCard({ project }: { project: Project }) {
    const { push } = useRouter();
    return (
        <div
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    push(`/projects/${project.id}`);
                }
            }}
            onClick={() => push(`/projects/${project.id}`)}
            className="group cursor-pointer bg-card border border-border hover:border-border/80 rounded-xl p-5 hover:bg-accent/50 transition-all"
        >
            <div className="mb-4 flex items-start justify-between gap-3">
                <div className="size-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                    <Folder className="size-5" />
                </div>
                <div className="flex items-center gap-2">
                    <span className={cn(
                        'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium',
                        project.workspaceId
                            ? 'border-primary/20 bg-primary/10 text-primary'
                            : 'border-border bg-muted text-muted-foreground'
                    )}>
                        {project.workspaceId ? 'Workspace' : 'Personal'}
                    </span>
                    <button
                        className="text-muted-foreground/50 transition-colors hover:text-foreground"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <MoreHorizontal className="size-5" />
                    </button>
                </div>
            </div>

            <h3 className="text-lg font-medium group-hover:text-foreground transition-colors mb-1 truncate">
                {project.name}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2 h-10 mb-4">
                {project.description || "No description provided"}
            </p>

            <div className="flex items-center justify-between text-xs text-muted-foreground/70 border-t border-border pt-3">
                <span><ClientDateText value={project.updatedAt} /></span>
                <span className="flex items-center gap-1">
                    View contents &rarr;
                </span>
            </div>
        </div>
    );
}
