import React, { useState } from 'react';
import { X, Keyboard, Settings, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/ui/dialog';

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
            <DialogContent className="max-w-[800px] h-[600px] p-0 bg-[#0B0C0E] border-white/10 shadow-2xl overflow-hidden flex flex-row gap-0">
                {/* Sidebar */}
                <div className="w-64 border-r border-white/5 bg-[#151619] p-4 flex flex-col gap-2">
                    <Button
                        variant={activeTab === 'general' ? 'default' : 'ghost'}
                        onClick={() => setActiveTab('general')}
                        className={cn(
                            "justify-start gap-3 px-4 py-6 rounded-lg text-sm font-medium transition-colors",
                            activeTab === 'general' ? "bg-white/10 text-white" : "text-white/50 hover:text-white hover:bg-white/5"
                        )}
                    >
                        <Settings className="w-4 h-4" />
                        General
                    </Button>
                    <Button
                        variant={activeTab === 'shortcuts' ? 'default' : 'ghost'}
                        onClick={() => setActiveTab('shortcuts')}
                        className={cn(
                            "justify-start gap-3 px-4 py-6 rounded-lg text-sm font-medium transition-colors",
                            activeTab === 'shortcuts' ? "bg-white/10 text-white" : "text-white/50 hover:text-white hover:bg-white/5"
                        )}
                    >
                        <Keyboard className="w-4 h-4" />
                        Shortcuts
                    </Button>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col bg-[#0B0C0E]">
                    {/* Header */}
                    <DialogHeader className="h-16 border-b border-white/5 flex flex-row items-center justify-between px-8 space-y-0">
                        <DialogTitle className="text-lg font-semibold text-white">
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
    return (
        <div className="space-y-8 max-w-lg">
            <Section title="General">
                <ToggleItem label="Helper lines" defaultChecked />
                <ToggleItem label="Rich tooltips" defaultChecked />
                <ToggleItem label="Experimental tools" />
            </Section>

            <Section title="Media">
                <ToggleItem label="Autoplay videos" defaultChecked />
            </Section>

            <Section title="Navigation">
                <div className="flex items-center justify-between py-2">
                    <div className="space-y-1">
                        <div className="text-sm font-medium text-white">Mouse wheel</div>
                        <div className="text-xs text-white/40 max-w-[300px]">
                            Pan: Traditional navigation where scrolling moves the canvas. Zoom: CAD-style navigation where scrolling zooms in/out.
                        </div>
                    </div>
                    <div className="flex bg-white/5 rounded-lg p-1 border border-white/5">
                        <button className="px-3 py-1 bg-blue-600 text-white text-xs rounded shadow-sm">Pan</button>
                        <button className="px-3 py-1 text-white/50 hover:text-white text-xs rounded">Zoom</button>
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
            <h3 className="text-sm font-semibold text-white/90">{title}</h3>
            <div className="space-y-1">
                {children}
            </div>
        </div>
    );
}

function ToggleItem({ label, defaultChecked }: { label: string, defaultChecked?: boolean }) {
    return (
        <div className="flex items-center justify-between py-2 group">
            <span className="text-sm text-white/70 group-hover:text-white transition-colors">{label}</span>
            <div className={`w-9 h-5 rounded-full relative transition-colors ${defaultChecked ? 'bg-blue-600' : 'bg-white/20'}`}>
                <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-transform ${defaultChecked ? 'left-5' : 'left-1'}`} />
            </div>
        </div>
    );
}

function ShortcutItem({ label, keys, separator = '+' }: { label: string, keys: string[], separator?: string }) {
    return (
        <div className="flex items-center justify-between py-2 group hover:bg-white/5 -mx-2 px-2 rounded-lg transition-colors">
            <span className="text-sm text-white/70 group-hover:text-white transition-colors capitalize">{label}</span>
            <div className="flex items-center gap-1.5">
                {keys.map((k, i) => (
                    <React.Fragment key={k}>
                        {i > 0 && <span className="text-xs text-white/20 font-medium">{separator}</span>}
                        <kbd className="min-w-[24px] px-2 py-1 bg-[#1A1B1F] border border-white/10 rounded text-[10px] font-bold text-white/70 shadow-sm">
                            {k}
                        </kbd>
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
}
