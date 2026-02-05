import React, { useState, useRef, useEffect } from 'react';
import {
    Plus, MousePointer2, Move, LayoutGrid, Search,
    Undo2, Redo2, Minus, Maximize,
    Type, Image as ImageIcon, Video, Wand2, Sparkles, MoreHorizontal,
    Upload, FolderOpen, Hand, MessageSquare, RotateCcw, RotateCw, Settings, Square, ZoomIn, ZoomOut, Maximize2, Play
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NodeSelector } from './NodeSelector';
import { ShortcutsModal } from './ShortcutsModal';
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
    isSaving = false,
    onRun,
    isExecuting = false
}: FloatingToolbarProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
    const [currentTool, setCurrentTool] = useState<ToolMode>(activeTool);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Keyboard shortcuts
    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            // Don't trigger if typing in an input
            if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
                return;
            }

            switch (event.key.toLowerCase()) {
                case 'v':
                    handleToolChange('select');
                    break;
                case 'h':
                    handleToolChange('pan');
                    break;
                case 'c':
                    handleToolChange('comment');
                    break;
                case 'z':
                    if (event.ctrlKey || event.metaKey) {
                        if (event.shiftKey) {
                            onRedo?.();
                        } else {
                            onUndo?.();
                        }
                    }
                    break;
                case 'y':
                    if (event.ctrlKey || event.metaKey) {
                        onRedo?.();
                    }
                    break;
                case '=':
                case '+':
                    if (event.ctrlKey || event.metaKey) {
                        event.preventDefault();
                        onZoomIn?.();
                    }
                    break;
                case '-':
                    if (event.ctrlKey || event.metaKey) {
                        event.preventDefault();
                        onZoomOut?.();
                    }
                    break;
                case '0':
                    if (event.ctrlKey || event.metaKey) {
                        event.preventDefault();
                        onFitView?.();
                    }
                    break;
            }
        }

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onUndo, onRedo, onZoomIn, onZoomOut, onFitView]);

    const handleAddNode = (type: WorkflowNodeType, label: string) => {
        onAddNode(type, label);
        setIsMenuOpen(false);
    }

    const handleToolChange = (tool: ToolMode) => {
        setCurrentTool(tool);
        onToolChange?.(tool);
    };

    return (
        <>
            <div className="absolute left-6 top-6 flex flex-col gap-3 z-50">
                {/* Main Toolbar */}
                <div className="flex flex-col p-2 rounded-2xl border border-white/10 bg-[#1A1B1F]/95 backdrop-blur-sm shadow-xl w-14 items-center gap-1.5">
                    {/* Select Tool */}
                    <ToolbarButton
                        icon={<MousePointer2 className="w-5 h-5" />}
                        label="Select (V)"
                        active={currentTool === 'select'}
                        onClick={() => handleToolChange('select')}
                        shortcut="V"
                    />

                    {/* Pan Tool */}
                    <ToolbarButton
                        icon={<Hand className="w-5 h-5" />}
                        label="Pan (H)"
                        active={currentTool === 'pan'}
                        onClick={() => handleToolChange('pan')}
                        shortcut="H"
                    />

                    <div className="w-6 h-px bg-white/10 my-1" />

                    {/* Add Node Button */}
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

                    {/* Comment Tool */}
                    <ToolbarButton
                        icon={<MessageSquare className="w-5 h-5" />}
                        label="Comment (C)"
                        active={currentTool === 'comment'}
                        onClick={() => handleToolChange('comment')}
                        shortcut="C"
                    />

                    <div className="w-6 h-px bg-white/10 my-1" />

                    {/* Undo */}
                    <ToolbarButton
                        icon={<Undo2 className="w-5 h-5" />}
                        label="Undo (Ctrl+Z)"
                        onClick={onUndo}
                        disabled={!canUndo}
                    />

                    {/* Redo */}
                    <ToolbarButton
                        icon={<Redo2 className="w-5 h-5" />}
                        label="Redo (Ctrl+Shift+Z)"
                        onClick={onRedo}
                        disabled={!canRedo}
                    />

                    <div className="w-6 h-px bg-white/10 my-1" />

                    {/* Settings / Shortcuts */}
                    <ToolbarButton
                        icon={<Settings className="w-5 h-5" />}
                        label="Shortcuts"
                        onClick={() => setIsShortcutsOpen(true)}
                    />
                </div>

                {/* Zoom Controls */}
                <div className="flex flex-col p-2 rounded-2xl border border-white/10 bg-[#1A1B1F]/95 backdrop-blur-sm shadow-xl w-14 items-center gap-1.5">
                    <ToolbarButton
                        icon={<ZoomIn className="w-5 h-5" />}
                        label="Zoom In (Ctrl+)"
                        onClick={onZoomIn}
                    />
                    <ToolbarButton
                        icon={<ZoomOut className="w-5 h-5" />}
                        label="Zoom Out (Ctrl-)"
                        onClick={onZoomOut}
                    />
                    <ToolbarButton
                        icon={<Maximize2 className="w-5 h-5" />}
                        label="Fit View (Ctrl+0)"
                        onClick={onFitView}
                    />
                </div>

            </div>

            <ShortcutsModal isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />
        </>
    );
}

interface ToolbarButtonProps {
    icon: React.ReactNode;
    label: string;
    onClick?: () => void;
    active?: boolean;
    disabled?: boolean;
    shortcut?: string;
}

function ToolbarButton({ icon, label, onClick, active, disabled, shortcut }: ToolbarButtonProps) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={cn(
                "p-3 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-all relative group",
                active && "bg-white/10 text-white",
                disabled && "opacity-30 cursor-not-allowed hover:bg-transparent hover:text-white/50"
            )}
        >
            {icon}

            {/* Tooltip */}
            <span className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 bg-[#1A1B1F] border border-white/10 rounded-lg text-[11px] text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-xl">
                {label}
            </span>

            {/* Active indicator */}
            {active && (
                <div className="absolute -left-0.5 top-1/2 -translate-y-1/2 w-1 h-4 bg-blue-500 rounded-full" />
            )}
        </button>
    );
}
