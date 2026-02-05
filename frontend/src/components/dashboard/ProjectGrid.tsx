'use client';

import { GlassCard } from '@/ui/glass-card';
import { MoreVertical, Calendar, Plus } from 'lucide-react';
import { Link, useRouter } from '@/i18n/navigation';
import { useProjectStore } from '@/stores/project-store';

export function ProjectGrid() {
    const { projects, createProject } = useProjectStore();
    const router = useRouter();

    const handleCreateProject = async () => {
        const id = await createProject({ name: 'Untitled canvas' });
        if (id) {
            router.push(`/project/${id}`);
        }
    };

    return (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Create New Card */}
            <button
                onClick={handleCreateProject}
                className="group relative flex aspect-video w-full flex-col items-center justify-center gap-4 overflow-hidden rounded-lg border border-dashed border-white/10 bg-white/5 transition-all hover:border-blue-500/50 hover:bg-blue-500/5"
            >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/20 text-blue-400 transition-all group-hover:scale-110 group-hover:bg-blue-500 group-hover:text-white">
                    <Plus className="h-6 w-6" />
                </div>
                <span className="text-sm font-semibold text-white/60 group-hover:text-white">Create New Project</span>
            </button>

            {projects.map((project) => (
                <Link key={project.id} href={`/project/${project.id}`} className="block group">
                    <GlassCard
                        variant="morphism"
                        className="group overflow-hidden p-0 border-white/5 transition-all hover:border-blue-500/30 hover:shadow-[0_0_20px_rgba(59,130,246,0.1)]"
                    >
                        <div className="aspect-video w-full overflow-hidden bg-gradient-to-br from-blue-900/20 to-purple-900/20">
                            {project.thumbnail ? (
                                <img
                                    src={project.thumbnail}
                                    alt={project.name}
                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center bg-[#0B0C0E]">
                                    <span className="text-4xl">🎨</span>
                                </div>
                            )}
                        </div>
                        <div className="p-4">
                            <div className="mb-2 flex items-center justify-between">
                                <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-400">
                                    Workflow
                                </span>
                                <button className="text-white/20 hover:text-white">
                                    <MoreVertical className="h-4 w-4" />
                                </button>
                            </div>
                            <h3 className="mb-1 text-sm font-semibold">{project.name}</h3>
                            <div className="flex items-center gap-1.5 text-[10px] text-white/40">
                                <Calendar className="h-3 w-3" />
                                {new Date(project.createdAt).toLocaleDateString()}
                            </div>
                        </div>
                    </GlassCard>
                </Link>
            ))}
        </div>
    );
}
