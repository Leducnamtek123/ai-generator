'use client';

import React from 'react';
import { Play, Settings, Trash2, ArrowUpRight, Copy, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWorkflowUIStore } from '@/stores/workflow-ui-store';

interface NodeToolbarProps {
    nodeId: string;
    onRun?: () => void;
    onRunLocal?: () => void;
    runDisabled?: boolean;
    onDelete?: () => void;
    onReference?: () => void;
    onReplace?: () => void;
    onSettings?: () => void;
    onDuplicate?: () => void;
}

export function NodeToolbar({ nodeId, onRun, onRunLocal, runDisabled, onDelete, onDuplicate, onReference, onReplace, onSettings }: NodeToolbarProps) {
    const richTooltips = useWorkflowUIStore((state) => state.richTooltips);

    return (
        <div className="absolute -top-14 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-lg border border-border/70 bg-[#0b0e13]/95 px-1.5 py-1 shadow-[0_16px_40px_rgba(0,0,0,0.42)] backdrop-blur-xl z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
            {onRun && (
                <ToolbarButton onClick={onRun} tooltip="Run Workflow" disabled={runDisabled} tooltipEnabled={richTooltips}>
                    <Play className="w-4 h-4" />
                </ToolbarButton>
            )}

            {onRunLocal && (
                <ToolbarButton onClick={onRunLocal} tooltip="Run Local" disabled={runDisabled} tooltipEnabled={richTooltips}>
                    <RefreshCw className="w-4 h-4" />
                </ToolbarButton>
            )}

            {onReference && (
                <ToolbarButton onClick={onReference} tooltip="Reference" tooltipEnabled={richTooltips}>
                    <ArrowUpRight className="w-4 h-4" />
                </ToolbarButton>
            )}

            <div className="w-px h-5 bg-border mx-1" />

            {onReplace && (
                <ToolbarButton onClick={onReplace} tooltip="Replace" tooltipEnabled={richTooltips}>
                    <RefreshCw className="w-4 h-4" />
                </ToolbarButton>
            )}

            {onSettings && (
                <ToolbarButton onClick={onSettings} tooltip="Specs" tooltipEnabled={richTooltips}>
                    <Settings className="w-4 h-4" />
                </ToolbarButton>
            )}

            <div className="w-px h-5 bg-border mx-1" />

            <ToolbarButton onClick={onDuplicate} tooltip="Duplicate" tooltipEnabled={richTooltips}>
                <Copy className="w-4 h-4" />
            </ToolbarButton>

            <ToolbarButton onClick={onDelete} className="hover:text-red-400 hover:bg-red-500/10" tooltip="Delete" tooltipEnabled={richTooltips}>
                <Trash2 className="w-4 h-4" />
            </ToolbarButton>
        </div>
    );
}

function ToolbarButton({ children, onClick, className, tooltip, disabled, tooltipEnabled = true }: { children: React.ReactNode, onClick?: () => void, className?: string, tooltip?: string, disabled?: boolean, tooltipEnabled?: boolean }) {
    return (
        <button
            type="button"
            aria-label={tooltip}
            onClick={onClick}
            disabled={disabled}
            className={cn(
                "relative group flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30",
                className
            )}
        >
            {children}
            {tooltipEnabled && tooltip && (
                <span className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-border/70 bg-[#0b0e13] px-2 py-1 text-[10px] text-foreground opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none">
                    {tooltip}
                </span>
            )}
        </button>
    );
}
