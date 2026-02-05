import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon, ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';

interface ToolCardProps {
    icon: LucideIcon;
    label: string;
    href: string;
    description?: string;
    isNew?: boolean;
    color?: string;
}

export function ToolCard({ icon: Icon, label, href, description, isNew, color = "text-white" }: ToolCardProps) {
    return (
        <Link href={href as any} className="group relative flex flex-col p-5 rounded-2xl bg-[#151619] border border-white/5 hover:border-white/10 transition-all hover:-translate-y-1 hover:shadow-xl overflow-hidden">
            {isNew && (
                <span className="absolute top-3 right-3 px-2 py-0.5 text-[10px] font-bold text-black bg-blue-400 rounded-full">New</span>
            )}

            <div className={cn("p-3 rounded-xl bg-white/5 w-fit mb-4 transition-colors group-hover:bg-white/10", color)}>
                <Icon className="w-6 h-6" />
            </div>

            <h3 className="font-semibold text-white mb-1 group-hover:text-blue-400 transition-colors">{label}</h3>
            {description && <p className="text-xs text-white/40 mb-4 line-clamp-2">{description}</p>}

            <div className="mt-auto flex items-center text-xs font-medium text-white/30 group-hover:text-white transition-colors">
                <span>Try now</span>
                <ArrowRight className="w-3 h-3 ml-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </div>
        </Link>
    );
}
