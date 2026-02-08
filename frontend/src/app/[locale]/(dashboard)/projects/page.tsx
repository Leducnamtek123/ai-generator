'use client';

import { useRouter } from '@/i18n/navigation';
import { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    User,
    Users,
    Folder,
    MoreHorizontal,
    LayoutGrid
} from 'lucide-react';
import { Button } from '@/ui/button';
import { cn } from '@/lib/utils';
import { useProjectStore, Project } from '@/stores/project-store';

const tabs = [
    { id: 'my', label: 'My Projects', icon: Folder },
    { id: 'shared', label: 'Shared', icon: Users },
];

export default function ProjectsPage() {
    const router = useRouter();
    const { projects, fetchProjects, createProject, isLoading } = useProjectStore();
    const [activeTab, setActiveTab] = useState('my');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [projectName, setProjectName] = useState('');
    const [projectDesc, setProjectDesc] = useState('');

    useEffect(() => {
        if (activeTab === 'my') {
            fetchProjects();
        }
    }, [activeTab, fetchProjects]);

    const handleCreateProject = async () => {
        if (!projectName.trim()) return;

        const newId = await createProject({
            name: projectName,
            description: projectDesc
        });

        if (newId) {
            setShowCreateModal(false);
            setProjectName('');
            setProjectDesc('');
            // Navigate to the new project
            router.push(`/projects/${newId}`);
        }
    };

    return (
        <div className="min-h-screen bg-[#0B0C0E] text-white">
            {/* Hero Section */}
            <div className="relative overflow-hidden mb-8">
                <div className="absolute inset-0 bg-gradient-to-r from-[#0B0C0E] via-transparent to-blue-900/20" />
                <div className="relative z-10 px-8 py-12">
                    <div className="max-w-lg">
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-300 via-indigo-200 to-blue-400 bg-clip-text text-transparent mb-2">
                            My Projects
                        </h1>
                        <p className="text-sm text-white/50 mb-6">Manage and organize your creative assets</p>
                        <Button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-white text-black hover:bg-white/90 gap-2 rounded-full px-5"
                        >
                            <Plus className="w-4 h-4" />
                            New Project
                        </Button>
                    </div>
                </div>
            </div>

            {/* Tabs & Search */}
            <div className="px-8 py-4 flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-1">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-colors",
                                activeTab === tab.id
                                    ? "bg-white/10 text-white"
                                    : "text-white/40 hover:text-white/60"
                            )}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                        type="text"
                        placeholder="Search projects..."
                        className="w-56 h-9 pl-10 pr-4 bg-[#151619] border border-white/5 rounded-lg text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-white/20"
                    />
                </div>
            </div>

            {/* Content */}
            <div className="px-8 py-6">
                {activeTab === 'my' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {projects.length === 0 ? (
                            <div className="col-span-full text-center py-20 text-white/40 border border-dashed border-white/10 rounded-2xl">
                                <Folder className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                <p>No projects found. Create one to get started!</p>
                            </div>
                        ) : (
                            projects.map((project) => (
                                <ProjectCard key={project.id} project={project} />
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'shared' && (
                    <div className="flex flex-col items-center justify-center py-20 text-center text-white/40">
                        <Users className="w-12 h-12 mb-4 opacity-20" />
                        <p>No shared projects yet.</p>
                    </div>
                )}
            </div>

            {/* Create Project Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
                    <div className="relative w-full max-w-md bg-[#151619] rounded-2xl border border-white/10 p-6 shadow-2xl">
                        <h2 className="text-xl font-bold text-white mb-4">Create New Project</h2>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-xs font-medium text-white/40 uppercase tracking-wider mb-2">
                                    Project Name
                                </label>
                                <input
                                    type="text"
                                    value={projectName}
                                    onChange={(e) => setProjectName(e.target.value)}
                                    placeholder="e.g. Social Media Campaign"
                                    className="w-full h-10 px-3 bg-[#0B0C0E] border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-white/40 uppercase tracking-wider mb-2">
                                    Description (Optional)
                                </label>
                                <textarea
                                    value={projectDesc}
                                    onChange={(e) => setProjectDesc(e.target.value)}
                                    placeholder="What is this project about?"
                                    className="w-full h-24 px-3 py-2 bg-[#0B0C0E] border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 resize-none"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <Button variant="ghost" onClick={() => setShowCreateModal(false)}>Cancel</Button>
                            <Button onClick={handleCreateProject} disabled={!projectName.trim()}>Create Project</Button>
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
            onClick={() => router.push(`/projects/${project.id}`)}
            className="group cursor-pointer bg-[#151619] border border-white/5 hover:border-white/20 rounded-xl p-5 hover:bg-white/[0.02] transition-all"
        >
            <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                    <Folder className="w-5 h-5 fill-current" />
                </div>
                <button className="text-white/20 hover:text-white transition-colors">
                    <MoreHorizontal className="w-5 h-5" />
                </button>
            </div>

            <h3 className="text-lg font-medium text-white group-hover:text-blue-100 transition-colors mb-1 truncate">
                {project.name}
            </h3>
            <p className="text-sm text-white/40 line-clamp-2 h-10 mb-4">
                {project.description || "No description provided"}
            </p>

            <div className="flex items-center justify-between text-xs text-white/30 border-t border-white/5 pt-3">
                <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
                {/* Placeholder for item count if available in future */}
                <span className="flex items-center gap-1">
                    View contents &rarr;
                </span>
            </div>
        </div>
    );
}
