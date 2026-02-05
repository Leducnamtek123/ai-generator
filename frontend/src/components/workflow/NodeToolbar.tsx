import React from 'react';
import { Play, Settings, Trash2, ArrowUpRight, Copy, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NodeToolbarProps {
    nodeId: string;
    onRun?: () => void;
    onDelete?: () => void;
    onReference?: () => void;
    onReplace?: () => void;
    onSettings?: () => void;
    onDuplicate?: () => void;
}

export function NodeToolbar({ nodeId, onRun, onDelete, onDuplicate, onReference, onReplace, onSettings }: NodeToolbarProps) {
    return (
        <div className="absolute -top-14 left-0 flex items-center gap-1 p-1 bg-[#1A1B1F] border border-white/10 rounded-xl shadow-xl z-50 animate-in fade-in slide-in-from-bottom-2 duration-200 scale-90 origin-bottom-left">
            {onRun && (
                <ToolbarButton onClick={onRun} tooltip="Run">
                    <Play className="w-4 h-4 fill-white" />
                </ToolbarButton>
            )}

            {onReference && (
                <ToolbarButton onClick={onReference} tooltip="Reference">
                    <ArrowUpRight className="w-4 h-4" />
                </ToolbarButton>
            )}

            <div className="w-px h-5 bg-white/10 mx-1" />

            {onReplace && (
                <ToolbarButton onClick={onReplace} tooltip="Replace">
                    <RefreshCw className="w-4 h-4" />
                </ToolbarButton>
            )}

            {onSettings && (
                <ToolbarButton onClick={onSettings} tooltip="Specs">
                    <Settings className="w-4 h-4" />
                </ToolbarButton>
            )}

            <div className="w-px h-5 bg-white/10 mx-1" />

            <ToolbarButton onClick={onDuplicate} tooltip="Duplicate">
                <Copy className="w-4 h-4" />
            </ToolbarButton>

            <ToolbarButton onClick={onDelete} className="hover:text-red-400 hover:bg-red-500/10" tooltip="Delete">
                <Trash2 className="w-4 h-4" />
            </ToolbarButton>
        </div>
    );
}

function ToolbarButton({ children, onClick, className, tooltip }: { children: React.ReactNode, onClick?: () => void, className?: string, tooltip?: string }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "p-2 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-colors relative group",
                className
            )}
        >
            {children}
            {tooltip && (
                <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-black text-[10px] text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-white/10">
                    {tooltip}
                </span>
            )}
        </button>
    );
}
