'use client';

import React, { useMemo } from 'react';
import { NODE_CONFIG, WorkflowNodeType, ConnectionType } from './types';
import { ContextMenuItem } from './components/ContextMenuItem';

interface HandleMenuProps {
    position: { x: number; y: number };
    outputType: ConnectionType;
    onAddAndConnect: (type: WorkflowNodeType) => void;
    onClose: () => void;
}

/**
 * Menu that appears when clicking on a node's output handle.
 * Shows compatible nodes that can receive the output type.
 */
export function HandleMenu({ position, outputType, onAddAndConnect, onClose }: HandleMenuProps) {
    const compatibleNodes = useMemo(() => {
        return Object.values(NODE_CONFIG).filter(config => {
            if (config.connections.accepts.includes(outputType)) return true;
            if (outputType === ConnectionType.MEDIA) {
                return config.connections.accepts.includes(ConnectionType.IMAGE) ||
                    config.connections.accepts.includes(ConnectionType.VIDEO);
            }
            if (outputType === ConnectionType.TEXT) {
                return config.connections.accepts.includes(ConnectionType.TEXT);
            }
            return false;
        });
    }, [outputType]);

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
            <button
                type="button"
                aria-label="Close handle menu"
                className="fixed inset-0 z-40"
                onClick={onClose}
            />
            <div
                className="fixed z-50 bg-[#1A1B1F] rounded-xl border border-white/10 shadow-2xl overflow-hidden"
                style={{ left: position.x + 20, top: position.y - 20, minWidth: 180 }}
            >
                <div className="px-4 py-2 border-b border-white/5 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-cyan-500" />
                    <span className="text-xs text-white/50">{connectionLabel}</span>
                </div>
                <div className="p-2 space-y-0.5">
                    {compatibleNodes.map(node => (
                        <ContextMenuItem
                            key={node.type}
                            node={node}
                            onClick={() => { onAddAndConnect(node.type); onClose(); }}
                        />
                    ))}
                </div>
            </div>
        </>
    );
}
