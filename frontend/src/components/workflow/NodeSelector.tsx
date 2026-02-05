'use client';

import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, Upload } from 'lucide-react';
import { NODE_CONFIG, NodeCategory, WorkflowNodeType, MAIN_NODES, UTILITY_NODES } from './types';
import { cn } from '@/lib/utils';

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
        <div className="w-[280px] bg-[#1A1B1F] rounded-xl border border-white/10 shadow-2xl overflow-hidden flex flex-col text-white origin-top-left absolute left-14 top-0 z-50">
            {/* Header with Close Button */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 bg-[#151619]">
                <button
                    onClick={onClose}
                    className="p-1.5 rounded-md hover:bg-white/10 transition-colors text-white/60 hover:text-white"
                >
                    <ChevronDown className="w-4 h-4 rotate-90" />
                </button>
            </div>

            {/* Search */}
            <div className="p-3 border-b border-white/5 bg-[#151619]">
                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                        className="w-full bg-[#0B0C0E] border border-white/5 rounded-md py-1.5 pl-9 pr-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 transition-colors"
                        placeholder="Search"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        autoFocus
                    />
                </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto max-h-[400px] p-2 custom-scrollbar">
                {/* Main Nodes Section */}
                <div className="px-3 py-1.5 text-[10px] font-bold text-white/30 uppercase tracking-wider">
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
                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-white/5 transition-colors group text-left"
                                >
                                    <div className={cn("p-1.5 rounded-md bg-white/5 group-hover:bg-white/10 transition-colors")}>
                                        <Icon className={cn("w-4 h-4", node.color)} />
                                    </div>
                                    <div className="text-sm font-medium text-white/90 group-hover:text-white">
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
                        <div className="px-3 py-1.5 mt-2 text-[10px] font-bold text-white/30 uppercase tracking-wider border-t border-white/5 pt-3">
                            Utilities
                        </div>
                        <div className="space-y-0.5">
                            {utilityNodes.map(node => {
                                const Icon = node.icon;
                                return (
                                    <button
                                        key={node.type}
                                        onClick={() => onSelect(node.type, node.label)}
                                        className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-white/5 transition-colors group text-left"
                                    >
                                        <div className={cn("p-1.5 rounded-md bg-white/5 group-hover:bg-white/10 transition-colors")}>
                                            <Icon className={cn("w-4 h-4", node.color)} />
                                        </div>
                                        <div className="text-sm font-medium text-white/90 group-hover:text-white">
                                            {node.label}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </>
                )}

                {filteredNodes.length === 0 && (
                    <div className="p-4 text-center text-xs text-white/30">
                        No nodes found
                    </div>
                )}
            </div>

            {/* Footer - Keyboard Shortcut Hint */}
            <div className="p-2 border-t border-white/5 bg-[#151619] text-center">
                <span className="text-[10px] text-white/30">
                    Press <kbd className="px-1 py-0.5 bg-white/10 rounded text-white/50">Esc</kbd> to close
                </span>
            </div>
        </div>
    );
}
