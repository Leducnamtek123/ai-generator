'use client';

import { useEffect } from 'react';
import type { ToolMode } from '../FloatingToolbar';

interface UseToolbarShortcutsProps {
    onToolChange: (tool: ToolMode) => void;
    onUndo?: () => void;
    onRedo?: () => void;
    onZoomIn?: () => void;
    onZoomOut?: () => void;
    onFitView?: () => void;
}

/**
 * Handles keyboard shortcuts for the workflow toolbar.
 * V = select, H = pan, C = comment, Ctrl+Z = undo, etc.
 */
export function useToolbarShortcuts({
    onToolChange,
    onUndo,
    onRedo,
    onZoomIn,
    onZoomOut,
    onFitView,
}: UseToolbarShortcutsProps) {
    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            if (
                event.target instanceof HTMLInputElement ||
                event.target instanceof HTMLTextAreaElement
            ) {
                return;
            }

            switch (event.key.toLowerCase()) {
                case 'v':
                    onToolChange('select');
                    break;
                case 'h':
                    onToolChange('pan');
                    break;
                case 'c':
                    onToolChange('comment');
                    break;
                case 'z':
                    if (event.ctrlKey || event.metaKey) {
                        event.shiftKey ? onRedo?.() : onUndo?.();
                    }
                    break;
                case 'y':
                    if (event.ctrlKey || event.metaKey) onRedo?.();
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
    }, [onToolChange, onUndo, onRedo, onZoomIn, onZoomOut, onFitView]);
}
