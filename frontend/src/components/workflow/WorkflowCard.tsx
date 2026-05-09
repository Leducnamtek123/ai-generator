import React from 'react';
import Image from 'next/image';
import { useRouter } from '@/i18n/navigation';
import { Plus, Loader2 } from 'lucide-react';
import { Workflow } from '@/stores/workflow-store';
import { WorkflowMiniPreview } from '@/components/workflow/WorkflowMiniPreview';
import { cn, getAssetUrl } from '@/lib/utils';

interface WorkflowCardProps {
    workflow: Workflow;
    onClick?: () => void;
    href?: string;
    isUploading?: boolean;
    actions?: React.ReactNode;
    className?: string;
    variant?: 'default' | 'compact';
}

export function WorkflowCard({ workflow, onClick, href, isUploading, actions, className, variant = 'default' }: WorkflowCardProps) {
    const router = useRouter();

    const handleClick = (e: React.MouseEvent) => {
        if (onClick) {
            onClick();
        } else if (href) {
            router.push(href);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            if (onClick) {
                onClick();
            } else if (href) {
                router.push(href);
            }
        }
    };

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            className={cn("group cursor-pointer flex flex-col", className)}
        >
            <div className="aspect-[4/3] w-full bg-card rounded-xl overflow-hidden border border-border group-hover:border-border/80 transition-all relative mb-3 shrink-0">
                {isUploading && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm">
                        <div className="flex flex-col items-center gap-2">
                            <Loader2 className="size-6 text-foreground animate-spin" />
                            <span className="text-xs text-foreground/80 font-medium">Uploading...</span>
                        </div>
                    </div>
                )}
                {workflow.previewUrl ? (
                    <div className="relative w-full h-full">
                        <Image
                            src={getAssetUrl(workflow.previewUrl)}
                            alt={workflow.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            sizes="(max-width: 1024px) 100vw, 20vw"
                        />
                    </div>
                ) : workflow.nodes && workflow.nodes.length > 0 ? (
                    <div className="w-full h-full bg-muted relative overflow-hidden group-hover:scale-105 transition-transform duration-500">
                        <WorkflowMiniPreview nodes={workflow.nodes} edges={workflow.edges} />
                        <div className="absolute inset-0 bg-background/10 backdrop-blur-[0.5px] pointer-events-none" />
                    </div>
                ) : (
                    <div className="w-full h-full relative group-hover:scale-105 transition-transform duration-500">
                        <Image
                            src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=300&fit=crop"
                            alt="Empty Studio"
                            fill
                            className="object-cover opacity-50 group-hover:opacity-80 transition-opacity"
                            sizes="(max-width: 1024px) 100vw, 20vw"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="size-10 rounded-lg bg-muted/80 backdrop-blur-sm flex items-center justify-center mb-2 group-hover:bg-muted transition-colors">
                                <Plus className="size-5 text-muted-foreground group-hover:text-foreground" />
                            </div>
                        </div>
                    </div>
                )}

                {actions && (
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {actions}
                    </div>
                )}
            </div>

            <div className="flex flex-col px-1">
                <h3 className="text-sm font-medium group-hover:text-foreground truncate">{workflow.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                    {variant === 'compact' && <span className="size-1.5 rounded-full bg-muted-foreground/50 shrink-0"></span>}
                    <p className="text-xs text-muted-foreground truncate">
                        {variant === 'default'
                            ? `${new Date(workflow.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ago`
                            : new Date(workflow.createdAt).toLocaleDateString()
                        }
                    </p>
                </div>
            </div>
        </div>
    );
}
