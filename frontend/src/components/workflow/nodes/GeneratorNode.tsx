"use client";

import React from "react";

import { Image as ImageIcon, Loader2, Play } from "lucide-react";
import { Handle, Position, useUpdateNodeInternals } from "@xyflow/react";

import { cn } from "@/lib/utils";

import { NodeToolbar } from "../NodeToolbar";
import { ExecutionMode, ImageModel, NodeStatus } from "../types";
import { BaseNode } from "./BaseNode";

interface GeneratorNodeProps {
  id: string;
  data: {
    label?: string;
    model?: ImageModel;
    previewUrl?: string;
    status?: NodeStatus;
    prompt?: string;
    inputs?: {
      prompt?: boolean;
      media?: boolean;
    };
    connectedPrompt?: string;
    connectedPromptSource?: string;
    connectedMediaSource?: string;
    onTextChange?: (id: string, text: string) => void;
    onDelete?: (id: string) => void;
    onRun?: (id: string, mode?: ExecutionMode) => void;
    onDuplicate?: () => void;
    onSettings?: () => void;
    onReplace?: () => void;
    onReference?: () => void;
    onOpenImageEditor?: (previewUrl: string) => void;
    onHandleClick?: (
      event: React.MouseEvent,
      handleId: string,
      handleType: "source" | "target"
    ) => void;
    isPreview?: boolean;
  };
  selected?: boolean;
}

const MODELS = [
  { id: ImageModel.SEEDREAM, name: "Seedream 4 4K", badge: "Fast" },
  { id: ImageModel.FLUX, name: "Flux Schnell", badge: "Popular" },
  { id: ImageModel.IMAGEN3, name: "Imagen 3", badge: "Best" },
  { id: ImageModel.MIDJOURNEY, name: "Midjourney v6", badge: "" },
  { id: ImageModel.DALLE3, name: "DALL-E 3", badge: "" }
];

export function GeneratorNode({ id, data, selected }: GeneratorNodeProps) {
  const updateNodeInternals = useUpdateNodeInternals();
  const [localPrompt, setLocalPrompt] = React.useState(data.prompt || "");

  const currentModel =
    MODELS.find((model) => model.id === (data.model ?? ImageModel.SEEDREAM)) ?? MODELS[0];

  React.useEffect(() => {
    if (data.prompt !== undefined) {
      setLocalPrompt((currentPrompt) =>
        data.prompt !== currentPrompt ? (data.prompt ?? "") : currentPrompt
      );
    }
  }, [data.prompt]);

  const handlePromptChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.target.value;
    setLocalPrompt(value);
    data.onTextChange?.(id, value);
  };

  const handleMediaLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.currentTarget;
    if (target.naturalWidth > 0 && target.naturalHeight > 0) {
      updateNodeInternals(id);
    }
  };

  return (
    <div className="relative">
      {selected && !data.isPreview && (
        <NodeToolbar
          nodeId={id}
          onRun={() => data.onRun?.(id, ExecutionMode.WORKFLOW)}
          onRunLocal={() => data.onRun?.(id, ExecutionMode.LOCAL)}
          runDisabled={
            data.status === NodeStatus.PROCESSING ||
            data.status === NodeStatus.QUEUED ||
            (!data.prompt?.trim() && !data.inputs?.prompt)
          }
          onDelete={() => data.onDelete?.(id)}
          onDuplicate={data.onDuplicate}
          onSettings={data.onSettings}
          onReplace={data.onReplace}
          onReference={data.onReference}
        />
      )}

      <div
        className={cn(
          "absolute top-1/2 left-0 z-[90] flex -translate-y-1/2 flex-col gap-2",
          data.isPreview && "scale-50 opacity-0"
        )}
      >
        <Handle
          type="target"
          position={Position.Left}
          id="prompt-input"
          onClick={(e) => data.onHandleClick?.(e, "prompt-input", "target")}
          className={cn(
            "!relative !top-0 !left-0 !flex !items-center !justify-center !rounded-full !border-2 !border-background !bg-card !opacity-100 !transition-colors",
            data.inputs?.prompt ? "!border-blue-500/20 !bg-blue-500" : "hover:!bg-blue-500/20"
          )}
        />
        <Handle
          type="target"
          position={Position.Left}
          id="media-input"
          onClick={(e) => data.onHandleClick?.(e, "media-input", "target")}
          className={cn(
            "!relative !top-0 !left-0 !flex !items-center !justify-center !rounded-full !border-2 !border-background !bg-card !opacity-100 !transition-colors",
            data.inputs?.media ? "!border-green-500/20 !bg-green-500" : "hover:!bg-green-500/20"
          )}
        />
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
          className={cn(
            "!relative !top-0 !left-0 !flex !items-center !justify-center !rounded-full !border-2 !border-background !bg-foreground/50 !opacity-100 !transition-colors",
            "hover:!bg-foreground/70"
          )}
        />
      </div>

      <BaseNode
        id={id}
        title={data.label || "Image Generator"}
        selected={selected}
        status={data.status}
        onDelete={data.onDelete}
        isPreview={data.isPreview}
      >
        <div
          className={cn(
            "relative overflow-hidden bg-muted/30",
            data.isPreview ? "w-[120px]" : "w-[340px]"
          )}
        >
          <div
            className={cn(
              "relative flex w-full items-center justify-center overflow-hidden bg-background",
              data.isPreview ? "min-h-[80px]" : "min-h-[200px]"
            )}
          >
            {data.status === NodeStatus.PROCESSING || data.status === NodeStatus.QUEUED ? (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-950/40 backdrop-blur-[2px]">
                <div className="relative flex size-12 items-center justify-center">
                  <div className="absolute inset-0 animate-ping rounded-full border-2 border-blue-500/20" />
                  <Loader2 className="relative z-20 size-6 animate-spin text-blue-500" />
                </div>
                <span className="mt-3 animate-pulse text-[10px] font-bold tracking-widest text-blue-400 uppercase">
                  {data.status === NodeStatus.QUEUED ? "In Queue" : "Generating..."}
                </span>
              </div>
            ) : null}

            {data.previewUrl ? (
              <div className="relative aspect-video w-full">
                {/* eslint-disable-next-line @next/next/no-img-element -- Workflow outputs can be arbitrary provider URLs not declared in next.config. */}
                <img
                  src={data.previewUrl}
                  alt="Generated"
                  className="h-full w-full cursor-pointer object-cover transition-all hover:ring-2 hover:ring-blue-500/50"
                  onClick={() => data.onOpenImageEditor?.(data.previewUrl ?? "")}
                  onLoad={handleMediaLoad}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-6 text-white/5 italic">
                <ImageIcon className={data.isPreview ? "h-6 w-6" : "h-12 w-12"} />
              </div>
            )}

            {!data.isPreview && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-zinc-950/80 to-transparent p-4">
                {data.inputs?.prompt ? (
                  <div className="space-y-1 rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-2">
                    <p className="text-sm font-medium text-blue-400">Prompt connected</p>
                    {data.connectedPrompt && (
                      <p className="text-xs leading-snug break-words text-blue-200/80">
                        {data.connectedPrompt}
                      </p>
                    )}
                    {data.connectedPromptSource && (
                      <p className="text-[10px] text-blue-300/50">
                        From {data.connectedPromptSource}
                      </p>
                    )}
                  </div>
                ) : (
                  <textarea
                    className="nodrag nopan nowheel custom-scrollbar h-16 w-full resize-none rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/80 outline-none placeholder:text-white/35 focus:border-blue-400/70 focus:bg-black/50 focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Describe the image?"
                    value={localPrompt}
                    onChange={handlePromptChange}
                    onPointerDown={(event) => event.stopPropagation()}
                    onMouseDown={(event) => event.stopPropagation()}
                    onClick={(event) => event.stopPropagation()}
                    readOnly={data.isPreview}
                  />
                )}
                {data.inputs?.media && (
                  <div className="mt-2 rounded-lg border border-green-500/20 bg-green-500/10 px-3 py-2">
                    <p className="text-sm font-medium text-green-400">Reference connected</p>
                    {data.connectedMediaSource && (
                      <p className="text-[10px] text-green-300/50">
                        From {data.connectedMediaSource}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {!data.isPreview && (
            <div className="flex items-center gap-2 border-t border-border bg-card p-3">
              <div className="flex-1 truncate text-xs text-muted-foreground">
                {currentModel.name}
              </div>
              <button
                onClick={() => data.onRun?.(id, ExecutionMode.LOCAL)}
                disabled={
                  data.status === NodeStatus.PROCESSING ||
                  data.status === NodeStatus.QUEUED ||
                  (!data.prompt?.trim() && !data.inputs?.prompt)
                }
                className="flex size-8 items-center justify-center rounded-full bg-blue-500 p-2 text-white transition-all hover:bg-blue-400 disabled:opacity-50"
              >
                <Play className="size-4 fill-current" />
              </button>
            </div>
          )}
        </div>

      </BaseNode>
    </div>
  );
}
