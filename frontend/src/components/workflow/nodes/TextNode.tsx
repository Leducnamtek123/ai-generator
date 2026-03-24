import React, { useCallback, useState, useRef } from 'react';
import { BaseNode } from './BaseNode';
import { Handle, Position } from '@xyflow/react';
import { Copy, Wand2, Loader2 } from 'lucide-react';
import { NodeToolbar } from '../NodeToolbar';
import { cn } from '@/lib/utils';
import { ExecutionMode, NodeStatus } from '../types';

interface TextNodeProps {
    id: string;
    data: {
        label?: string;
        text?: string;
        status?: NodeStatus;
        onDelete?: (id: string) => void;
        onTextChange?: (id: string, text: string) => void;
        onEnhance?: (id: string) => void;
        onRun?: (id: string, mode?: ExecutionMode) => void;
        onDuplicate?: () => void;
        onSettings?: () => void;
        onHandleClick?: (event: any, handleId: string, handleType: 'source' | 'target') => void;
        isPreview?: boolean;
    };
    selected?: boolean;
}

export function TextNode({ id, data, selected }: TextNodeProps) {
    const [localText, setLocalText] = useState(data.text || '');
    const [isEnhancing, setIsEnhancing] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setLocalText(e.target.value);
        data.onTextChange?.(id, e.target.value);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(localText);
    };

    const handleEnhance = async () => {
        setIsEnhancing(true);
        // Mock AI enhancement - in reality, call an API
        await new Promise(r => setTimeout(r, 1500));

        const enhanced = `A stunning, photorealistic image of ${localText}. Ultra-detailed, 8K resolution, cinematic lighting, professional photography, golden hour, shallow depth of field, vibrant colors.`;
        setLocalText(enhanced);
        data.onTextChange?.(id, enhanced);
        setIsEnhancing(false);
    };

    return (
        <>
            {selected && !data.isPreview && (
                <NodeToolbar
                    nodeId={id}
                    onRun={() => data.onRun?.(id, ExecutionMode.WORKFLOW)}
                    onRunLocal={() => data.onRun?.(id, ExecutionMode.LOCAL)}
                    runDisabled={data.status === NodeStatus.PROCESSING || !localText.trim()}
                    onDelete={() => data.onDelete?.(id)}
                    onDuplicate={data.onDuplicate}
                    onSettings={data.onSettings}
                />
            )}

            <BaseNode
                id={id}
                title="Text Prompt"
                selected={selected}
                status={data.status}
                onDelete={data.onDelete}
                isPreview={data.isPreview}
            >
                <div className={cn("bg-background p-3 rounded-b-xl border-t border-border", data.isPreview ? "w-[120px] p-1" : "w-[320px]")}>
                    <div className="relative">
                        <textarea
                            ref={textareaRef}
                            className={cn(
                                "w-full bg-muted/50 border border-border rounded-lg p-3 text-sm text-foreground focus:outline-none focus:border-primary/50 resize-none font-mono placeholder:text-muted-foreground",
                                data.isPreview ? "h-12 p-1 text-[8px] overflow-hidden" : "h-32"
                            )}
                            placeholder="Type your prompt here..."
                            value={localText}
                            onChange={handleTextChange}
                            readOnly={data.isPreview}
                        />
                        {!data.isPreview && (
                            <div className="absolute right-2 bottom-2 flex items-center gap-2">
                                <span className="text-[10px] text-white/30">{localText.length} chars</span>
                            </div>
                        )}
                    </div>

                    {!data.isPreview && (
                        <>
                            {/* Action Buttons */}
                            <div className="flex items-center gap-2 mt-2">
                                <button
                                    onClick={handleEnhance}
                                    disabled={isEnhancing || !localText.trim()}
                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-xs font-medium text-white transition-all"
                                >
                                    {isEnhancing ? (
                                        <>
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                            Enhancing...
                                        </>
                                    ) : (
                                        <>
                                            <Wand2 className="w-3 h-3" />
                                            Enhance Prompt
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={handleCopy}
                                    disabled={!localText.trim()}
                                    className="p-2 bg-white/5 hover:bg-white/10 disabled:opacity-50 rounded-lg text-white/60 hover:text-white transition-all"
                                    title="Copy to clipboard"
                                >
                                    <Copy className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Quick Templates */}
                            <div className="mt-3 pt-3 border-t border-white/5">
                                <p className="text-[10px] text-white/30 mb-2">Quick Templates:</p>
                                <div className="flex flex-wrap gap-1">
                                    {['Portrait', 'Landscape', 'Abstract', 'Product', 'Character'].map((template) => (
                                        <button
                                            key={template}
                                            onClick={() => {
                                                const templates: Record<string, string> = {
                                                    'Portrait': 'A professional portrait photo of a person',
                                                    'Landscape': 'A breathtaking landscape with mountains and lakes',
                                                    'Abstract': 'An abstract art piece with vibrant colors and shapes',
                                                    'Product': 'A sleek product photo on a clean background',
                                                    'Character': 'A fantasy character with detailed armor and magical effects',
                                                };
                                                setLocalText(templates[template] || template);
                                                data.onTextChange?.(id, templates[template] || template);
                                            }}
                                            className="px-2 py-1 bg-accent/50 hover:bg-accent rounded text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {template}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <Handle
                    type="source"
                    position={Position.Right}
                    id="output"
                    onClick={(e) => data.onHandleClick?.(e, 'output', 'source')}
                    className="!h-3 !w-3 !border-2 !border-background !bg-green-500 z-50 transform translate-x-1.5 cursor-pointer hover:!bg-green-400"
                />
            </BaseNode >
        </>
    );
}
