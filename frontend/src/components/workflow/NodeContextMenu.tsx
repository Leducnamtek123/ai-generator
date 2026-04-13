'use client';

import React, { useMemo } from 'react';
import { NODE_CONFIG, WorkflowNodeType, ConnectionType } from './types';
import { ContextMenuItem } from './components/ContextMenuItem';

interface NodeContextMenuProps {
    position: { x: number; y: number };
    sourceConnectionType?: ConnectionType;
    onSelect: (type: WorkflowNodeType, label: string) => void;
    onClose: () => void;
}

const PRIMARY_TYPES = [
    WorkflowNodeType.IMAGE_GEN,
    WorkflowNodeType.VIDEO_GEN,
    WorkflowNodeType.UPSCALE,
    WorkflowNodeType.ASSISTANT,
];

/**
 * Context menu that appears when clicking on a node's connection handle.
 * Shows only compatible nodes that can connect to the source.
 */
export function NodeContextMenu({ position, sourceConnectionType, onSelect, onClose }: NodeContextMenuProps) {
    const compatibleNodes = useMemo(() => {
        if (!sourceConnectionType) {
            return Object.values(NODE_CONFIG).filter(c => c.connections.accepts.length > 0);
        }
        return Object.values(NODE_CONFIG).filter(config =>
            config.connections.accepts.includes(sourceConnectionType) ||
            (sourceConnectionType === ConnectionType.MEDIA &&
                (config.connections.accepts.includes(ConnectionType.IMAGE) ||
                    config.connections.accepts.includes(ConnectionType.VIDEO)))
        );
    }, [sourceConnectionType]);

    const primaryNodes = compatibleNodes.filter(n => PRIMARY_TYPES.includes(n.type));
    const secondaryNodes = compatibleNodes.filter(n => !PRIMARY_TYPES.includes(n.type));

    return (
        <>
            <div className="fixed inset-0 z-40" onClick={onClose} />
            <div
                className="fixed z-50 bg-[#1A1B1F] rounded-xl border border-white/10 shadow-2xl overflow-hidden"
                style={{ left: position.x, top: position.y, minWidth: 200 }}
            >
                <div className="p-2 space-y-0.5">
                    {primaryNodes.map(node => (
                        <ContextMenuItem
                            key={node.type}
                            node={node}
                            onClick={() => { onSelect(node.type, node.label); onClose(); }}
                        />
                    ))}

                    {secondaryNodes.length > 0 && primaryNodes.length > 0 && (
                        <div className="border-t border-white/5 my-1" />
                    )}

                    {secondaryNodes.map(node => (
                        <ContextMenuItem
                            key={node.type}
                            node={node}
                            onClick={() => { onSelect(node.type, node.label); onClose(); }}
                        />
                    ))}

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
