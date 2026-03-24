'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
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
            <Button
                variant="outline"
                className="group relative flex h-auto aspect-video w-full flex-col items-center justify-center gap-4 overflow-hidden rounded-lg border-dashed border-border bg-muted/50 p-0 hover:bg-muted/80"
                onClick={handleCreateProject}
            >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-primary transition-all group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground">
                    <Plus className="h-6 w-6" />
                </div>
                <span className="text-sm font-semibold text-muted-foreground group-hover:text-foreground">Create New Project</span>
            </Button>

            {projects.map((project) => (
                <Link key={project.id} href={`/project/${project.id}`} className="block group">
                    <Card
                        className="group overflow-hidden p-0 border-border transition-all hover:border-primary/30 hover:shadow-lg bg-background/60 backdrop-blur-sm"
                    >
                        <div className="aspect-video w-full overflow-hidden bg-gradient-to-br from-muted to-muted/50">
                            {project.thumbnail ? (
                                <img
                                    src={project.thumbnail}
                                    alt={project.name}
                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center bg-background">
                                    <span className="text-4xl">🎨</span>
                                </div>
                            )}
                        </div>
                        <div className="p-4">
                            <div className="mb-2 flex items-center justify-between">
                                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                                    Workflow
                                </span>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-6 w-6">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={(e) => { e.preventDefault(); /* TODO: Rename */ }}>Rename</DropdownMenuItem>
                                        <DropdownMenuItem onClick={(e) => { e.preventDefault(); /* TODO: Delete */ }} className="text-destructive">Delete</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            <h3 className="mb-1 text-sm font-semibold">{project.name}</h3>
                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {new Date(project.createdAt).toLocaleDateString()}
                            </div>
                        </div>
                    </Card>
                </Link>
            ))}
        </div>
    );
}
