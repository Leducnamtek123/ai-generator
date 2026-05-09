"use client";

import React, { useRef, useState } from "react";

import { Copy, Loader2, Wand2 } from "lucide-react";
import { Handle, Position } from "@xyflow/react";

import { cn } from "@/lib/utils";

import { useGeneration } from "@/hooks/useGeneration";

import { NodeToolbar } from "../NodeToolbar";
import { ExecutionMode, NodeStatus, StyleEmphasis } from "../types";
import { BaseNode } from "./BaseNode";

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
    onHandleClick?: (
      event: React.MouseEvent,
      handleId: string,
      handleType: "source" | "target"
    ) => void;
    isPreview?: boolean;
  };
  selected?: boolean;
}

export function TextNode({ id, data, selected }: TextNodeProps) {
  const [localText, setLocalText] = useState(data.text || "");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { isGenerating, handleEnhancePrompt } = useGeneration();

  React.useEffect(() => {
    if (data.text !== undefined) {
      setLocalText((currentText) => (data.text !== currentText ? (data.text ?? "") : currentText));
    }
  }, [data.text]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalText(e.target.value);
    data.onTextChange?.(id, e.target.value);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(localText);
  };

  const handleEnhance = async () => {
    if (!localText.trim()) return;
    const enhanced = await handleEnhancePrompt({
      prompt: localText,
      style: StyleEmphasis.PHOTOREALISTIC
    });

    if (enhanced) {
      setLocalText(enhanced);
      data.onTextChange?.(id, enhanced);
    }
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
        <div
          className={cn(
            "rounded-b-xl border-t border-border bg-background p-3",
            data.isPreview ? "w-[120px] p-1" : "w-[320px]"
          )}
        >
          <div className="relative">
            <textarea
              ref={textareaRef}
              className={cn(
                "nodrag nopan nowheel w-full resize-none rounded-lg border border-border bg-muted/50 p-3 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none",
                data.isPreview ? "h-12 overflow-hidden p-1 text-[8px]" : "h-32"
              )}
              placeholder="Type your prompt here?"
              value={localText}
              onChange={handleTextChange}
              onPointerDown={(event) => event.stopPropagation()}
              onMouseDown={(event) => event.stopPropagation()}
              onClick={(event) => event.stopPropagation()}
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
              <div className="mt-2 flex items-center gap-2">
                <button
                  onClick={handleEnhance}
                  disabled={isGenerating || !localText.trim()}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 px-3 py-2 text-xs font-medium text-white transition-all hover:from-amber-500 hover:to-orange-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="size-3 animate-spin" />
                      Enhancing?
                    </>
                  ) : (
                    <>
                      <Wand2 className="size-3" />
                      Enhance Prompt
                    </>
                  )}
                </button>
                <button
                  onClick={handleCopy}
                  disabled={!localText.trim()}
                  className="rounded-lg bg-white/5 p-2 text-white/60 transition-all hover:bg-white/10 hover:text-white disabled:opacity-50"
                  title="Copy to clipboard"
                >
                  <Copy className="size-4" />
                </button>
              </div>

              {/* Quick Templates */}
              <div className="mt-3 border-t border-white/5 pt-3">
                <p className="mb-2 text-[10px] text-white/30">Quick Templates:</p>
                <div className="flex flex-wrap gap-1">
                  {["Portrait", "Landscape", "Abstract", "Product", "Character"].map((template) => (
                    <button
                      key={template}
                      onClick={() => {
                        const templates: Record<string, string> = {
                          Portrait: "A professional portrait photo of a person",
                          Landscape: "A breathtaking landscape with mountains and lakes",
                          Abstract: "An abstract art piece with vibrant colors and shapes",
                          Product: "A sleek product photo on a clean background",
                          Character: "A fantasy character with detailed armor and magical effects"
                        };
                        setLocalText(templates[template] || template);
                        data.onTextChange?.(id, templates[template] || template);
                      }}
                      className="rounded bg-accent/50 px-2 py-1 text-[10px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    >
                      {template}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div
          className={cn(
            "absolute top-1/2 right-0 z-[90] flex -translate-y-1/2",
            data.isPreview && "scale-50 opacity-0"
          )}
        >
          <Handle
            type="source"
            position={Position.Right}
            id="output"
            onClick={(e) => data.onHandleClick?.(e, "output", "source")}
            className="!relative !top-0 !left-0 !flex !items-center !justify-center !rounded-full !border-2 !border-background !bg-green-500 !opacity-100 !transition-colors hover:!bg-green-400"
          />
        </div>
      </BaseNode>
    </>
  );
}
