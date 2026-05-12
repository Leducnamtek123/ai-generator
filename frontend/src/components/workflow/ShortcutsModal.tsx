'use client';

import React, { useState } from 'react';
import { Keyboard, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/ui/dialog';
import { useWorkflowUIStore } from '@/stores/workflow-ui-store';

// Simple Tab Interface
type Tab = 'general' | 'shortcuts';

interface ShortcutsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ShortcutsModal({ isOpen, onClose }: ShortcutsModalProps) {
    const [activeTab, setActiveTab] = useState<Tab>('general');

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="flex h-[600px] max-w-[800px] flex-row gap-0 overflow-hidden border-border bg-background p-0 shadow-2xl">
                {/* Sidebar */}
                <div className="flex w-64 flex-col gap-2 border-r border-border bg-card p-4">
                    <Button
                        variant={activeTab === 'general' ? 'default' : 'ghost'}
                        onClick={() => setActiveTab('general')}
                        className={cn(
                            "justify-start gap-3 px-4 py-6 rounded-lg text-sm font-medium transition-colors",
                            activeTab === 'general' ? "bg-primary/10 text-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"
                        )}
                    >
                        <Settings className="size-4" />
                        General
                    </Button>
                    <Button
                        variant={activeTab === 'shortcuts' ? 'default' : 'ghost'}
                        onClick={() => setActiveTab('shortcuts')}
                        className={cn(
                            "justify-start gap-3 px-4 py-6 rounded-lg text-sm font-medium transition-colors",
                            activeTab === 'shortcuts' ? "bg-primary/10 text-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"
                        )}
                    >
                        <Keyboard className="size-4" />
                        Shortcuts
                    </Button>
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col bg-background">
                    {/* Header */}
                    <DialogHeader className="flex h-16 flex-row items-center justify-between border-b border-border px-8 gap-y-0">
                        <DialogTitle className="text-lg font-semibold text-foreground">
                            {activeTab === 'general' ? 'General' : 'Shortcuts'}
                        </DialogTitle>
                    </DialogHeader>

                    {/* Scroll Area */}
                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                        {activeTab === 'general' ? <GeneralSettings /> : <ShortcutsList />}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function GeneralSettings() {
    const helperLines = useWorkflowUIStore((state) => state.helperLines);
    const richTooltips = useWorkflowUIStore((state) => state.richTooltips);
    const experimentalTools = useWorkflowUIStore((state) => state.experimentalTools);
    const autoplayVideos = useWorkflowUIStore((state) => state.autoplayVideos);
    const mouseWheelMode = useWorkflowUIStore((state) => state.mouseWheelMode);
    const setHelperLines = useWorkflowUIStore((state) => state.setHelperLines);
    const setRichTooltips = useWorkflowUIStore((state) => state.setRichTooltips);
    const setExperimentalTools = useWorkflowUIStore((state) => state.setExperimentalTools);
    const setAutoplayVideos = useWorkflowUIStore((state) => state.setAutoplayVideos);
    const setMouseWheelMode = useWorkflowUIStore((state) => state.setMouseWheelMode);

    return (
        <div className="space-y-8 max-w-lg">
            <Section title="General">
                <ToggleItem label="Helper lines" checked={helperLines} onChange={setHelperLines} />
                <ToggleItem label="Rich tooltips" checked={richTooltips} onChange={setRichTooltips} />
                <ToggleItem label="Experimental tools" checked={experimentalTools} onChange={setExperimentalTools} />
            </Section>

            <Section title="Media">
                <ToggleItem label="Autoplay videos" checked={autoplayVideos} onChange={setAutoplayVideos} />
            </Section>

            <Section title="Navigation">
                <div className="flex items-center justify-between py-2">
                    <div className="space-y-1">
                        <div className="text-sm font-medium text-foreground">Mouse wheel</div>
                        <div className="max-w-[300px] text-xs text-muted-foreground">
                            Pan: Traditional navigation where scrolling moves the canvas. Zoom: CAD-style navigation where scrolling zooms in/out.
                        </div>
                    </div>
                    <div className="flex rounded-lg border border-border bg-muted/30 p-1">
                        <ModeButton
                            label="Pan"
                            active={mouseWheelMode === 'pan'}
                            onClick={() => setMouseWheelMode('pan')}
                        />
                        <ModeButton
                            label="Zoom"
                            active={mouseWheelMode === 'zoom'}
                            onClick={() => setMouseWheelMode('zoom')}
                        />
                    </div>
                </div>
            </Section>
        </div>
    );
}

function ShortcutsList() {
    return (
        <div className="space-y-8">
            <Section title="Tools">
                <ShortcutItem label="Select tool" keys={['V']} />
                <ShortcutItem label="Pan tool" keys={['H']} />
                <ShortcutItem label="Comment tool" keys={['C']} />
            </Section>

            <Section title="Basics">
                <ShortcutItem label="Copy" keys={['Ctrl', 'C']} />
                <ShortcutItem label="Cut" keys={['Ctrl', 'X']} />
                <ShortcutItem label="Paste" keys={['Ctrl', 'V']} />
                <ShortcutItem label="Undo" keys={['Ctrl', 'Z']} />
                <ShortcutItem label="Redo" keys={['Ctrl', 'Shift', 'Z']} />
                <ShortcutItem label="Select all" keys={['Ctrl', 'A']} />
                <ShortcutItem label="Duplicate" keys={['Ctrl', 'D']} />
            </Section>

            <Section title="View">
                <ShortcutItem label="Zoom in" keys={['Ctrl', '+']} />
                <ShortcutItem label="Zoom out" keys={['Ctrl', '-']} />
                <ShortcutItem label="Fit to screen" keys={['Ctrl', '0']} />
            </Section>

            <Section title="Control">
                <ShortcutItem label="Delete" keys={['Delete']} />
            </Section>
        </div>
    );
}

function Section({ title, children }: { title: string, children: React.ReactNode }) {
    return (
        <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            <div className="space-y-1">
                {children}
            </div>
        </div>
    );
}

function ToggleItem({
    label,
    checked,
    onChange,
}: {
    label: string;
    checked: boolean;
    onChange: (value: boolean) => void;
}) {
    return (
        <button
            type="button"
            onClick={() => onChange(!checked)}
            className="flex w-full items-center justify-between rounded-lg py-2 text-left group"
            aria-pressed={checked}
        >
            <span className="text-sm text-muted-foreground transition-colors group-hover:text-foreground">{label}</span>
            <div className={cn("relative h-5 w-9 rounded-full transition-colors", checked ? 'bg-blue-600' : 'bg-muted')}>
                <div className={cn("absolute top-1 size-3 rounded-full bg-white transition-transform", checked ? 'left-5' : 'left-1')} />
            </div>
        </button>
    );
}

function ModeButton({
    label,
    active,
    onClick,
}: {
    label: string;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "px-3 py-1 text-xs rounded transition-colors",
                active ? "bg-blue-600 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
            aria-pressed={active}
        >
            {label}
        </button>
    );
}

function ShortcutItem({ label, keys, separator = '+' }: { label: string, keys: string[], separator?: string }) {
    return (
        <div className="group -mx-2 flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-accent">
            <span className="text-sm capitalize text-muted-foreground transition-colors group-hover:text-foreground">{label}</span>
            <div className="flex items-center gap-1.5">
                {keys.map((k, i) => (
                    <React.Fragment key={k}>
        {i > 0 && <span className="text-xs font-medium text-muted-foreground/40">{separator}</span>}
                        <kbd className="min-w-[24px] rounded border border-border bg-card px-2 py-1 text-[10px] font-bold text-foreground/70 shadow-sm">
                            {k}
                        </kbd>
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
}
