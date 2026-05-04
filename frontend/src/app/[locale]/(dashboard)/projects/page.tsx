'use client';

import { useRouter } from '@/i18n/navigation';
import { useEffect, useReducer } from 'react';
import {
    Plus,
    Search,
    Users,
    Folder,
    MoreHorizontal,
    LayoutGrid,
    List
} from 'lucide-react';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { cn } from '@/lib/utils';
import { useProjectStore, Project } from '@/stores/project-store';
import { DataTable } from '@/components/shared/data-table/data-table';
import { columns } from '@/components/projects/columns';

const tabs = [
    { id: 'my', label: 'My Projects', icon: Folder },
    { id: 'shared', label: 'Shared', icon: Users },
];

type ProjectsState = {
    activeTab: 'my' | 'shared';
    viewMode: 'grid' | 'list';
    showCreateModal: boolean;
    projectName: string;
    projectDesc: string;
};

type ProjectsAction =
    | { type: 'setActiveTab'; activeTab: 'my' | 'shared' }
    | { type: 'setViewMode'; viewMode: 'grid' | 'list' }
    | { type: 'openCreateModal' }
    | { type: 'closeCreateModal' }
    | { type: 'setProjectName'; projectName: string }
    | { type: 'setProjectDesc'; projectDesc: string }
    | { type: 'resetCreateForm' };

const initialState: ProjectsState = {
    activeTab: 'my',
    viewMode: 'grid',
    showCreateModal: false,
    projectName: '',
    projectDesc: '',
};

function projectsReducer(state: ProjectsState, action: ProjectsAction): ProjectsState {
    switch (action.type) {
        case 'setActiveTab':
            return { ...state, activeTab: action.activeTab };
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
    const router = useRouter();
    const { projects, fetchProjects, createProject } = useProjectStore();
    const [state, dispatch] = useReducer(projectsReducer, initialState);

    useEffect(() => {
        if (state.activeTab === 'my') {
            fetchProjects();
        }
    }, [state.activeTab, fetchProjects]);

    const handleCreateProject = async () => {
        if (!state.projectName.trim()) return;

        const newId = await createProject({
            name: state.projectName,
            description: state.projectDesc
        });

        if (newId) {
            dispatch({ type: 'closeCreateModal' });
            dispatch({ type: 'resetCreateForm' });
            router.push(`/projects/${newId}`);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Hero Section - simplified, no gradient */}
            <div className="px-8 py-12 border-b border-border">
                <div className="max-w-lg">
                    <h1 className="text-3xl font-bold text-foreground mb-2">
                        My Projects
                    </h1>
                    <p className="text-sm text-muted-foreground mb-6">Manage and organize your creative assets</p>
                    <Button
                        onClick={() => dispatch({ type: 'openCreateModal' })}
                        className="gap-2 px-5"
                    >
                        <Plus className="w-4 h-4" />
                        New Project
                    </Button>
                </div>
            </div>

            {/* Tabs & Search */}
            <div className="px-8 py-4 flex items-center justify-between border-b border-border">
                <div className="flex items-center gap-1">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => dispatch({ type: 'setActiveTab', activeTab: tab.id as 'my' | 'shared' })}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-colors",
                                state.activeTab === tab.id
                                    ? "bg-accent text-accent-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Search projects..."
                            className="w-56 h-9 pl-10 pr-4"
                        />
                    </div>
                    <div className="flex items-center border border-input rounded-md p-1 bg-background">
                        <Button
                            variant={state.viewMode === 'grid' ? 'secondary' : 'ghost'}
                            size="icon-xs"
                            onClick={() => dispatch({ type: 'setViewMode', viewMode: 'grid' })}
                            className="h-7 w-7"
                            title="Grid View"
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </Button>
                        <Button
                            variant={state.viewMode === 'list' ? 'secondary' : 'ghost'}
                            size="icon-xs"
                            onClick={() => dispatch({ type: 'setViewMode', viewMode: 'list' })}
                            className="h-7 w-7"
                            title="List View"
                        >
                            <List className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="px-8 py-6">
                {state.activeTab === 'my' && (
                    <>
                        {projects.length === 0 ? (
                            <div className="col-span-full text-center py-20 text-muted-foreground border border-dashed border-border rounded-2xl">
                                <Folder className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                <p>No projects found. Create one to get started!</p>
                            </div>
                        ) : (
                            state.viewMode === 'grid' ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {projects.map((project) => (
                                        <ProjectCard key={project.id} project={project} />
                                    ))}
                                </div>
                            ) : (
                                <DataTable columns={columns} data={projects} />
                            )
                        )}
                    </>
                )}

                {state.activeTab === 'shared' && (
                    <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
                        <Users className="w-12 h-12 mb-4 opacity-20" />
                        <p>No shared projects yet.</p>
                    </div>
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
                        <h2 className="text-xl font-bold mb-4">Create New Project</h2>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label htmlFor="projectName" className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
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
                                <label htmlFor="projectDesc" className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
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
    const router = useRouter();
    return (
        <div
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') router.push(`/projects/${project.id}`); }}
            onClick={() => router.push(`/projects/${project.id}`)}
            className="group cursor-pointer bg-card border border-border hover:border-border/80 rounded-xl p-5 hover:bg-accent/50 transition-all"
        >
            <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                    <Folder className="w-5 h-5" />
                </div>
                <button className="text-muted-foreground/50 hover:text-foreground transition-colors">
                    <MoreHorizontal className="w-5 h-5" />
                </button>
            </div>

            <h3 className="text-lg font-medium group-hover:text-foreground transition-colors mb-1 truncate">
                {project.name}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2 h-10 mb-4">
                {project.description || "No description provided"}
            </p>

            <div className="flex items-center justify-between text-xs text-muted-foreground/70 border-t border-border pt-3">
                <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
                <span className="flex items-center gap-1">
                    View contents &rarr;
                </span>
            </div>
        </div>
    );
}
