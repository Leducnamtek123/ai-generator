'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
    Plus, MousePointer2, Hand, MessageSquare,
    Undo2, Redo2, Sparkles, Settings,
    ZoomIn, ZoomOut, Maximize2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NodeSelector } from './NodeSelector';
import { ShortcutsModal } from './ShortcutsModal';
import { ToolbarButton } from './components/ToolbarButton';
import { useToolbarShortcuts } from './hooks/useToolbarShortcuts';
import { WorkflowNodeType } from './types';
import { useWorkflowUIStore } from '@/stores/workflow-ui-store';

export type ToolMode = 'select' | 'pan' | 'comment';

interface FloatingToolbarProps {
    onAddNode: (type: WorkflowNodeType, label: string) => void;
    onToolChange?: (tool: ToolMode) => void;
    onUndo?: () => void;
    onRedo?: () => void;
    onZoomIn?: () => void;
    onZoomOut?: () => void;
    onFitView?: () => void;
    activeTool?: ToolMode;
    canUndo?: boolean;
    canRedo?: boolean;
    isSaving?: boolean;
    onRun?: () => void;
    isExecuting?: boolean;
    onOpenComments?: () => void;
}

export function FloatingToolbar({
    onAddNode,
    onToolChange,
    onUndo,
    onRedo,
    onZoomIn,
    onZoomOut,
    onFitView,
    activeTool = 'select',
    canUndo = false,
    canRedo = false,
    onOpenComments,
}: FloatingToolbarProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const richTooltips = useWorkflowUIStore((state) => state.richTooltips);

    // Close menu on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleToolChange = (tool: ToolMode) => {
        onToolChange?.(tool);
    };

    useToolbarShortcuts({
        onToolChange: handleToolChange,
        onUndo,
        onRedo,
        onZoomIn,
        onZoomOut,
        onFitView,
    });

    const handleAddNode = (type: WorkflowNodeType, label: string) => {
        onAddNode(type, label);
        setIsMenuOpen(false);
    };

    return (
        <>
            <div className="absolute left-5 top-5 z-50 flex flex-col gap-3">
                {/* Main Toolbar */}
                <div className="flex w-14 flex-col items-center gap-1.5 rounded-lg border border-border/70 bg-card/95 p-2 shadow-[0_18px_50px_rgba(0,0,0,0.24)] backdrop-blur-xl">
                    <ToolbarButton
                        icon={<MousePointer2 className="size-5" />}
                        label="Select (V)"
                        active={activeTool === 'select'}
                        onClick={() => handleToolChange('select')}
                        tooltipEnabled={richTooltips}
                    />
                    <ToolbarButton
                        icon={<Hand className="size-5" />}
                        label="Pan (H)"
                        active={activeTool === 'pan'}
                        onClick={() => handleToolChange('pan')}
                        tooltipEnabled={richTooltips}
                    />

                    <div className="w-6 h-px bg-border my-1" />

                    {/* Add Node */}
                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className={cn(
                                "p-2.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-[0_0_15px_rgba(47,102,255,0.25)] hover:shadow-[0_0_20px_rgba(47,102,255,0.32)]",
                                isMenuOpen && "bg-primary/90 text-primary-foreground"
                            )}
                        >
                            <Plus className={cn("size-5 transition-transform duration-200", isMenuOpen && "rotate-45")} />
                        </button>
                        {isMenuOpen && (
                            <NodeSelector onSelect={handleAddNode} onClose={() => setIsMenuOpen(false)} />
                        )}
                    </div>

                    <ToolbarButton
                        icon={<MessageSquare className="size-5" />}
                        label="Add Comment (C)"
                        active={activeTool === 'comment'}
                        onClick={() => {
                            handleToolChange('comment');
                            onOpenComments?.();
                        }}
                        tooltipEnabled={richTooltips}
                    />
                    <ToolbarButton icon={<Sparkles className="size-5 text-blue-500" />} label="Open Reviews" onClick={onOpenComments} tooltipEnabled={richTooltips} />

                    <div className="w-6 h-px bg-border my-1" />

                    <ToolbarButton icon={<Undo2 className="size-5" />} label="Undo (Ctrl+Z)" onClick={onUndo} disabled={!canUndo} tooltipEnabled={richTooltips} />
                    <ToolbarButton icon={<Redo2 className="size-5" />} label="Redo (Ctrl+Shift+Z)" onClick={onRedo} disabled={!canRedo} tooltipEnabled={richTooltips} />

                    <div className="w-6 h-px bg-border my-1" />

                    <ToolbarButton icon={<Settings className="size-5" />} label="Shortcuts" onClick={() => setIsShortcutsOpen(true)} tooltipEnabled={richTooltips} />
                </div>

                {/* Zoom Controls */}
                <div className="flex w-14 flex-col items-center gap-1.5 rounded-lg border border-border/70 bg-card/95 p-2 shadow-[0_18px_50px_rgba(0,0,0,0.24)] backdrop-blur-xl">
                    <ToolbarButton icon={<ZoomIn className="size-5" />} label="Zoom In (Ctrl+)" onClick={onZoomIn} tooltipEnabled={richTooltips} />
                    <ToolbarButton icon={<ZoomOut className="size-5" />} label="Zoom Out (Ctrl-)" onClick={onZoomOut} tooltipEnabled={richTooltips} />
                    <ToolbarButton icon={<Maximize2 className="size-5" />} label="Fit View (Ctrl+0)" onClick={onFitView} tooltipEnabled={richTooltips} />
                </div>
            </div>

            <ShortcutsModal isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />
        </>
    );
}
