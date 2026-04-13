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
    const [currentTool, setCurrentTool] = useState<ToolMode>(activeTool);
    const menuRef = useRef<HTMLDivElement>(null);

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
        setCurrentTool(tool);
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
            <div className="absolute left-6 top-6 flex flex-col gap-3 z-50">
                {/* Main Toolbar */}
                <div className="flex flex-col p-2 rounded-2xl border border-white/10 bg-[#1A1B1F]/95 backdrop-blur-sm shadow-xl w-14 items-center gap-1.5">
                    <ToolbarButton
                        icon={<MousePointer2 className="w-5 h-5" />}
                        label="Select (V)"
                        active={currentTool === 'select'}
                        onClick={() => handleToolChange('select')}
                    />
                    <ToolbarButton
                        icon={<Hand className="w-5 h-5" />}
                        label="Pan (H)"
                        active={currentTool === 'pan'}
                        onClick={() => handleToolChange('pan')}
                    />

                    <div className="w-6 h-px bg-white/10 my-1" />

                    {/* Add Node */}
                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className={cn(
                                "p-2.5 rounded-full text-black bg-white hover:bg-white/90 transition-all shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-105",
                                isMenuOpen && "bg-blue-500 text-white"
                            )}
                        >
                            <Plus className={cn("w-5 h-5 transition-transform duration-200", isMenuOpen && "rotate-45")} />
                        </button>
                        {isMenuOpen && (
                            <NodeSelector onSelect={handleAddNode} onClose={() => setIsMenuOpen(false)} />
                        )}
                    </div>

                    <ToolbarButton
                        icon={<MessageSquare className="w-5 h-5" />}
                        label="Add Comment (C)"
                        active={currentTool === 'comment'}
                        onClick={() => handleToolChange('comment')}
                    />
                    <ToolbarButton
                        icon={<Sparkles className="w-5 h-5 text-blue-400" />}
                        label="Open Reviews"
                        onClick={onOpenComments}
                    />

                    <div className="w-6 h-px bg-white/10 my-1" />

                    <ToolbarButton icon={<Undo2 className="w-5 h-5" />} label="Undo (Ctrl+Z)" onClick={onUndo} disabled={!canUndo} />
                    <ToolbarButton icon={<Redo2 className="w-5 h-5" />} label="Redo (Ctrl+Shift+Z)" onClick={onRedo} disabled={!canRedo} />

                    <div className="w-6 h-px bg-white/10 my-1" />

                    <ToolbarButton icon={<Settings className="w-5 h-5" />} label="Shortcuts" onClick={() => setIsShortcutsOpen(true)} />
                </div>

                {/* Zoom Controls */}
                <div className="flex flex-col p-2 rounded-2xl border border-white/10 bg-[#1A1B1F]/95 backdrop-blur-sm shadow-xl w-14 items-center gap-1.5">
                    <ToolbarButton icon={<ZoomIn className="w-5 h-5" />} label="Zoom In (Ctrl+)" onClick={onZoomIn} />
                    <ToolbarButton icon={<ZoomOut className="w-5 h-5" />} label="Zoom Out (Ctrl-)" onClick={onZoomOut} />
                    <ToolbarButton icon={<Maximize2 className="w-5 h-5" />} label="Fit View (Ctrl+0)" onClick={onFitView} />
                </div>
            </div>

            <ShortcutsModal isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />
        </>
    );
}
