'use client';

import React, { useState, useMemo } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { NODE_CONFIG, NodeCategory, WorkflowNodeType } from './types';
import { cn } from '@/lib/utils';

import { Input } from '@/ui/input';

interface NodeSelectorProps {
    onSelect: (type: WorkflowNodeType, label: string) => void;
    onClose: () => void;
}

export function NodeSelector({ onSelect, onClose }: NodeSelectorProps) {
    const [search, setSearch] = useState('');

    const filteredNodes = useMemo(() => {
        const query = search.toLowerCase();
        return Object.values(NODE_CONFIG).filter(node =>
            node.label.toLowerCase().includes(query) ||
            node.description.toLowerCase().includes(query)
        );
    }, [search]);

    // Group nodes by category, excluding utility nodes for main list
    const mainNodes = useMemo(() => {
        return filteredNodes.filter(n =>
            n.category !== NodeCategory.UTILITY
        );
    }, [filteredNodes]);

    // Utility nodes shown separately
    const utilityNodes = useMemo(() => {
        return filteredNodes.filter(n => n.category === NodeCategory.UTILITY);
    }, [filteredNodes]);

    // Group main nodes by category
    const groupedMainNodes = useMemo(() => {
        const groups: Record<string, typeof mainNodes> = {};
        const categories = [NodeCategory.INPUT, NodeCategory.GENERATION, NodeCategory.MODIFICATION];

        categories.forEach(cat => {
            const nodesInCat = mainNodes.filter(n => n.category === cat);
            if (nodesInCat.length > 0) {
                groups[cat] = nodesInCat;
            }
        });

        return groups;
    }, [mainNodes]);

    return (
        <div className="w-[320px] bg-popover/95 backdrop-blur-md rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col text-popover-foreground origin-top-left absolute left-14 top-0 z-[100]">
            {/* Header with Close Button */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-accent/20">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Add Node</span>
                <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                >
                    <ChevronDown className="w-4 h-4 rotate-90" />
                </button>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-border">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        className="w-full bg-accent/50 border-input rounded-xl py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-ring h-10"
                        placeholder="Search nodes..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto max-h-[400px] p-2 custom-scrollbar">
                {/* Main Nodes Section */}
                <div className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Nodes
                </div>

                {Object.entries(groupedMainNodes).map(([category, nodes]) => (
                    <div key={category} className="mb-2">
                        {nodes.map(node => {
                            const Icon = node.icon;
                            return (
                                <button
                                    key={node.type}
                                    onClick={() => onSelect(node.type, node.label)}
                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors group text-left"
                                >
                                    <div className={cn("p-1.5 rounded-md bg-accent/50 group-hover:bg-accent-foreground/10 transition-colors")}>
                                        <Icon className={cn("w-4 h-4", node.color)} />
                                    </div>
                                    <div className="text-sm font-medium text-foreground/90 group-hover:text-foreground">
                                        {node.label}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                ))}

                {/* Utilities Section */}
                {utilityNodes.length > 0 && (
                    <>
                        <div className="px-3 py-1.5 mt-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-t border-border pt-3">
                            Utilities
                        </div>
                        <div className="space-y-0.5">
                            {utilityNodes.map(node => {
                                const Icon = node.icon;
                                return (
                                    <button
                                        key={node.type}
                                        onClick={() => onSelect(node.type, node.label)}
                                        className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors group text-left"
                                    >
                                        <div className={cn("p-1.5 rounded-md bg-accent/50 group-hover:bg-accent-foreground/10 transition-colors")}>
                                            <Icon className={cn("w-4 h-4", node.color)} />
                                        </div>
                                        <div className="text-sm font-medium text-foreground/90 group-hover:text-foreground">
                                            {node.label}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </>
                )}

                {filteredNodes.length === 0 && (
                    <div className="p-4 text-center text-xs text-muted-foreground">
                        No nodes found
                    </div>
                )}
            </div>

            {/* Footer - Keyboard Shortcut Hint */}
            <div className="p-2 border-t border-border bg-muted/20 text-center">
                <span className="text-[10px] text-muted-foreground">
                    Press <kbd className="px-1 py-0.5 bg-accent rounded text-foreground/50">Esc</kbd> to close
                </span>
            </div>
        </div>
    );
}
