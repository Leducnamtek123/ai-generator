import React, { useState } from 'react';
import { BaseNode } from './BaseNode';
import { Handle, Position } from '@xyflow/react';
import { Sparkles, Loader2, Play, Copy, RefreshCw, ChevronDown } from 'lucide-react';
import { NodeToolbar } from '../NodeToolbar';
import { ExecutionMode, NodeStatus, AssistantMode } from '../types';

interface AssistantNodeProps {
    id: string;
    data: {
        label?: string;
        inputText?: string;
        enhancedText?: string;
        mode?: AssistantMode;
        status?: NodeStatus;
        onDelete?: (id: string) => void;
        onRun?: (id: string, mode?: ExecutionMode) => void;
        onDuplicate?: () => void;
        onSettings?: () => void;
        onHandleClick?: (event: any, handleId: string, handleType: 'source' | 'target') => void;
    };
    selected?: boolean;
}

const MODES = [
    { id: AssistantMode.ENHANCE, name: 'Enhance', description: 'Improve clarity and detail' },
    { id: AssistantMode.EXPAND, name: 'Expand', description: 'Add more descriptive elements' },
    { id: AssistantMode.CREATIVE, name: 'Creative', description: 'Add artistic interpretations' },
    { id: AssistantMode.CINEMATIC, name: 'Cinematic', description: 'Transform into cinematic style' },
];

export function AssistantNode({ id, data, selected }: AssistantNodeProps) {
    const [mode, setMode] = useState<AssistantMode>(data.mode || AssistantMode.ENHANCE);
    const [showModeDropdown, setShowModeDropdown] = useState(false);
    const currentMode = MODES.find(m => m.id === mode) || MODES[0];

    const handleCopy = () => {
        if (data.enhancedText) {
            navigator.clipboard.writeText(data.enhancedText);
        }
    };

    return (
        <>
            {selected && (
                <NodeToolbar
                    nodeId={id}
                    onRun={() => data.onRun?.(id, ExecutionMode.WORKFLOW)}
                    onRunLocal={() => data.onRun?.(id, ExecutionMode.LOCAL)}
                    runDisabled={data.status === NodeStatus.PROCESSING || data.status === NodeStatus.QUEUED || !data.inputText?.trim()}
                    onDelete={() => data.onDelete?.(id)}
                    onDuplicate={data.onDuplicate}
                    onSettings={data.onSettings}
                />
            )}

            <BaseNode
                id={id}
                title="AI Assistant"
                selected={selected}
                status={data.status}
                onDelete={data.onDelete}
            >
                <div className="w-[280px] bg-[#151619] border-t border-white/5">
                    {/* Mode Selector */}
                    <div className="p-3 border-b border-white/5">
                        <div className="relative">
                            <button
                                onClick={() => setShowModeDropdown(!showModeDropdown)}
                                className="w-full flex items-center justify-between px-3 py-2 bg-gradient-to-r from-amber-900/20 to-orange-900/20 border border-amber-500/20 rounded-lg text-sm text-amber-400 hover:text-amber-300 transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4" />
                                    <span>{currentMode.name}</span>
                                </div>
                                <ChevronDown className="w-4 h-4" />
                            </button>
                            {showModeDropdown && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-[#1A1B1F] border border-white/10 rounded-lg overflow-hidden z-50 shadow-xl">
                                    {MODES.map((m) => (
                                        <button
                                            key={m.id}
                                            onClick={() => {
                                                setMode(m.id as any);
                                                setShowModeDropdown(false);
                                            }}
                                            className="w-full px-3 py-2 text-left hover:bg-white/5 transition-colors"
                                        >
                                            <div className="text-xs text-white">{m.name}</div>
                                            <div className="text-[10px] text-white/40">{m.description}</div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Input Preview */}
                    <div className="p-3 border-b border-white/5">
                        <p className="text-[10px] text-white/30 mb-1 uppercase tracking-wider">Input</p>
                        <div className="bg-black/20 rounded-lg p-2 text-xs text-white/60 min-h-[40px] max-h-[60px] overflow-y-auto">
                            {data.inputText || 'Connect a Text node...'}
                        </div>
                    </div>

                    {/* Output */}
                    <div className="p-3">
                        <div className="flex items-center justify-between mb-1">
                            <p className="text-[10px] text-white/30 uppercase tracking-wider">Output</p>
                            {data.enhancedText && (
                                <button
                                    onClick={handleCopy}
                                    className="p-1 text-white/40 hover:text-white transition-colors"
                                    title="Copy"
                                >
                                    <Copy className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                        <div className="bg-gradient-to-br from-amber-900/20 to-orange-900/20 rounded-lg p-3 text-xs text-amber-100/90 min-h-[80px] max-h-[120px] overflow-y-auto border border-amber-500/10">
                            {data.status === NodeStatus.PROCESSING || data.status === NodeStatus.QUEUED ? (
                                <div className="flex items-center gap-2 text-amber-400">
                                    <div className="relative">
                                        <div className="absolute inset-0 border border-amber-500/20 rounded-full animate-ping" />
                                        <Loader2 className="w-4 h-4 animate-spin relative z-10" />
                                    </div>
                                    <span className="animate-pulse">{data.status === NodeStatus.QUEUED ? 'In Queue...' : 'Enhancing prompt...'}</span>
                                </div>
                            ) : data.enhancedText ? (
                                <p className="leading-relaxed">{data.enhancedText}</p>
                            ) : (
                                <p className="text-white/30 italic">Enhanced prompt will appear here...</p>
                            )}
                        </div>
                    </div>

                    {/* Run Button */}
                    <div className="px-3 pb-3">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                data.onRun?.(id);
                            }}
                            disabled={data.status === NodeStatus.PROCESSING || data.status === NodeStatus.QUEUED || !data.inputText}
                            className="w-full py-2.5 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm flex items-center justify-center gap-2 transition-all"
                        >
                            {data.status === NodeStatus.PROCESSING || data.status === NodeStatus.QUEUED ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    {data.status === NodeStatus.QUEUED ? 'Queued...' : 'Processing...'}
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4" />
                                    Enhance
                                </>
                            )}
                        </button>
                    </div>
                </div>

                <Handle
                    type="target"
                    position={Position.Left}
                    id="input"
                    onClick={(e) => data.onHandleClick?.(e, 'input', 'target')}
                    className="!h-3 !w-3 !border-2 !border-[#0B0C0E] !bg-amber-500 z-50 transform -translate-x-1.5 cursor-pointer hover:!bg-amber-400"
                />
                <Handle
                    type="source"
                    position={Position.Right}
                    id="output"
                    onClick={(e) => data.onHandleClick?.(e, 'output', 'source')}
                    className="!h-3 !w-3 !border-2 !border-[#0B0C0E] !bg-amber-500 z-50 transform translate-x-1.5 cursor-pointer hover:!bg-amber-400"
                />
            </BaseNode>
        </>
    );
}
