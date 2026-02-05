'use client';

import React, { useMemo } from 'react';
import { NODE_CONFIG, WorkflowNodeType, ConnectionType } from './types';
import { cn } from '@/lib/utils';

interface NodeContextMenuProps {
    position: { x: number; y: number };
    /** The type of connection we're coming from (determines compatible nodes) */
    sourceConnectionType?: ConnectionType;
    /** Called when user selects a node */
    onSelect: (type: WorkflowNodeType, label: string) => void;
    /** Called when menu should close */
    onClose: () => void;
}

/**
 * Context menu that appears when clicking on a node's connection handle
 * Shows only compatible nodes that can connect to the source
 */
export function NodeContextMenu({
    position,
    sourceConnectionType,
    onSelect,
    onClose
}: NodeContextMenuProps) {
    // Filter nodes that can accept the source connection type
    const compatibleNodes = useMemo(() => {
        if (!sourceConnectionType) {
            // If no source type, show all generation/modification nodes
            return Object.values(NODE_CONFIG).filter(config =>
                config.connections.accepts.length > 0
            );
        }

        return Object.values(NODE_CONFIG).filter(config =>
            config.connections.accepts.includes(sourceConnectionType) ||
            // Media can connect to image/video compatible nodes
            (sourceConnectionType === ConnectionType.MEDIA &&
                (config.connections.accepts.includes(ConnectionType.IMAGE) ||
                    config.connections.accepts.includes(ConnectionType.VIDEO)))
        );
    }, [sourceConnectionType]);

    // Group by whether it's a key action or secondary
    const primaryNodes = compatibleNodes.filter(n =>
        [WorkflowNodeType.IMAGE_GEN, WorkflowNodeType.VIDEO_GEN, WorkflowNodeType.UPSCALE, WorkflowNodeType.ASSISTANT].includes(n.type)
    );

    const secondaryNodes = compatibleNodes.filter(n =>
        ![WorkflowNodeType.IMAGE_GEN, WorkflowNodeType.VIDEO_GEN, WorkflowNodeType.UPSCALE, WorkflowNodeType.ASSISTANT].includes(n.type)
    );

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-40"
                onClick={onClose}
            />

            {/* Menu */}
            <div
                className="fixed z-50 bg-[#1A1B1F] rounded-xl border border-white/10 shadow-2xl overflow-hidden"
                style={{
                    left: position.x,
                    top: position.y,
                    minWidth: 200,
                }}
            >
                <div className="p-2 space-y-0.5">
                    {/* Primary Actions */}
                    {primaryNodes.map(node => {
                        const Icon = node.icon;
                        return (
                            <button
                                key={node.type}
                                onClick={() => {
                                    onSelect(node.type, node.label);
                                    onClose();
                                }}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors group text-left"
                            >
                                <div className={cn("p-1.5 rounded-md bg-white/5 group-hover:bg-white/10 transition-colors")}>
                                    <Icon className={cn("w-4 h-4", node.color)} />
                                </div>
                                <span className="text-sm font-medium text-white/90 group-hover:text-white">
                                    {node.label}
                                </span>
                            </button>
                        );
                    })}

                    {/* Separator */}
                    {secondaryNodes.length > 0 && primaryNodes.length > 0 && (
                        <div className="border-t border-white/5 my-1" />
                    )}

                    {/* Secondary Actions */}
                    {secondaryNodes.map(node => {
                        const Icon = node.icon;
                        return (
                            <button
                                key={node.type}
                                onClick={() => {
                                    onSelect(node.type, node.label);
                                    onClose();
                                }}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors group text-left"
                            >
                                <div className={cn("p-1.5 rounded-md bg-white/5 group-hover:bg-white/10 transition-colors")}>
                                    <Icon className={cn("w-4 h-4", node.color)} />
                                </div>
                                <span className="text-sm font-medium text-white/90 group-hover:text-white">
                                    {node.label}
                                </span>
                            </button>
                        );
                    })}

                    {compatibleNodes.length === 0 && (
                        <div className="px-3 py-4 text-center text-xs text-white/30">
                            No compatible nodes
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

/**
 * Menu that appears when clicking on a node's output handle
 * Like in Freepik where it shows "Media", "Image Generator", etc.
 */
interface HandleMenuProps {
    position: { x: number; y: number };
    /** What type of data this handle outputs */
    outputType: ConnectionType;
    /** Called when user selects a node to add and connect */
    onAddAndConnect: (type: WorkflowNodeType) => void;
    onClose: () => void;
}

export function HandleMenu({ position, outputType, onAddAndConnect, onClose }: HandleMenuProps) {
    // Get nodes that can accept this output type
    const compatibleNodes = useMemo(() => {
        return Object.values(NODE_CONFIG).filter(config => {
            // Check if this node accepts the output type
            if (config.connections.accepts.includes(outputType)) {
                return true;
            }
            // Media can connect to image/video nodes
            if (outputType === ConnectionType.MEDIA) {
                return config.connections.accepts.includes(ConnectionType.IMAGE) ||
                    config.connections.accepts.includes(ConnectionType.VIDEO);
            }
            // Text can also work as reference in some cases
            if (outputType === ConnectionType.TEXT) {
                return config.connections.accepts.includes(ConnectionType.TEXT);
            }
            return false;
        });
    }, [outputType]);

    // Special label based on output type
    const connectionLabel = useMemo(() => {
        switch (outputType) {
            case ConnectionType.IMAGE:
            case ConnectionType.VIDEO:
            case ConnectionType.MEDIA:
                return 'Reference';
            case ConnectionType.TEXT:
                return 'Prompt';
            default:
                return 'Connect';
        }
    }, [outputType]);

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-40"
                onClick={onClose}
            />

            {/* Menu */}
            <div
                className="fixed z-50 bg-[#1A1B1F] rounded-xl border border-white/10 shadow-2xl overflow-hidden"
                style={{
                    left: position.x + 20,
                    top: position.y - 20,
                    minWidth: 180,
                }}
            >
                {/* Connection type label */}
                <div className="px-4 py-2 border-b border-white/5 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-cyan-500" />
                    <span className="text-xs text-white/50">{connectionLabel}</span>
                </div>

                <div className="p-2 space-y-0.5">
                    {compatibleNodes.map(node => {
                        const Icon = node.icon;
                        return (
                            <button
                                key={node.type}
                                onClick={() => {
                                    onAddAndConnect(node.type);
                                    onClose();
                                }}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors group text-left"
                            >
                                <div className={cn("p-1.5 rounded-md bg-white/5 group-hover:bg-white/10 transition-colors")}>
                                    <Icon className={cn("w-4 h-4", node.color)} />
                                </div>
                                <span className="text-sm font-medium text-white/90 group-hover:text-white">
                                    {node.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </>
    );
}
