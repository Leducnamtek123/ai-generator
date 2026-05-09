"use client";

import * as React from "react";

import { Image as ImageIcon, Loader2, Play } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import { Button } from "@/ui/button";

import { NodePanelProps } from "../NodePanels";
import { AspectRatio, ImageModel, ImageQuality } from "../types";
import { ConnectionInfo } from "./ConnectionInfo";

export function ImageGenNodePanel({ nodeData, onChange, isGenerating, handlers }: NodePanelProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-3">
        <div className="flex items-start gap-2">
          <ImageIcon className="mt-0.5 size-4 shrink-0 text-blue-400" />
          <div>
            <p className="text-xs font-medium text-blue-300">Image Generator</p>
            <p className="mt-1 text-[10px] text-blue-300/60">
              Generate high-quality images from text prompts.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-xs font-medium text-muted-foreground">AI Model</div>
        <select
          value={(nodeData.model as string) || "seedream"}
          onChange={(e) => onChange("model", e.target.value)}
          className="h-11 w-full appearance-none rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:ring-1 focus:ring-blue-500/50 focus:outline-none"
        >
          <option value="seedream">Seedream 4 4K ⭐</option>
          <option value="flux">Flux Schnell</option>
          <option value="imagen3">Google Imagen 3</option>
          <option value="midjourney">Midjourney v6</option>
          <option value="dalle3">DALL-E 3</option>
          <option value="stable">Stable Diffusion XL</option>
        </select>
      </div>

      <div className="space-y-2">
        <div className="text-xs font-medium text-muted-foreground">Aspect Ratio</div>
        <div className="grid grid-cols-4 gap-2">
          {["1:1", "4:3", "16:9", "9:16"].map((ratio) => (
            <Button
              key={ratio}
              variant={(nodeData.aspectRatio || "1:1") === ratio ? "default" : "outline"}
              onClick={() => onChange("aspectRatio", ratio)}
              className={cn(
                "h-9 text-xs font-medium",
                (nodeData.aspectRatio || "1:1") === ratio
                  ? "border-none bg-blue-600 hover:bg-blue-500"
                  : "border-border bg-background text-muted-foreground hover:bg-accent"
              )}
            >
              {ratio}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-xs font-medium text-muted-foreground">Quality</div>
        <div className="grid grid-cols-3 gap-2">
          {["standard", "hd", "4k"].map((quality) => (
            <button
              key={quality}
              onClick={() => onChange("quality", quality)}
              className={`rounded-lg p-2 text-xs font-medium uppercase transition-all ${(nodeData.quality || "hd") === quality ? "bg-blue-600 text-white" : "bg-background text-muted-foreground hover:bg-accent"}`}
            >
              {quality}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-xs font-medium text-muted-foreground">Negative Prompt (Optional)</div>
        <textarea
          value={(nodeData.negativePrompt as string) || ""}
          onChange={(e) => onChange("negativePrompt", e.target.value)}
          className="h-20 w-full resize-none rounded-lg border border-input bg-background p-3 text-xs text-foreground focus:ring-1 focus:ring-blue-500/50 focus:outline-none"
          placeholder="What to avoid in generation?"
        />
      </div>

      <ConnectionInfo accepts={["Text", "Enhanced Text"]} outputs="Image" />

      <div className="space-y-2 pt-2">
        <Button
          onClick={async () => {
            const prompt =
              (nodeData.inputPrompt as string) ||
              (nodeData.connectedPrompt as string) ||
              (nodeData.prompt as string) ||
              "A beautiful landscape";
            if (handlers?.handleGenerateImage) {
              const result = await handlers.handleGenerateImage({
                prompt,
                model: (nodeData.model as ImageModel) || ImageModel.SEEDREAM,
                aspectRatio: (nodeData.aspectRatio as AspectRatio) || AspectRatio.SQUARE,
                quality: (nodeData.quality as ImageQuality) || ImageQuality.HD,
                negativePrompt: nodeData.negativePrompt as string,
                referenceImageUrl:
                  (nodeData.inputImageUrl as string) ||
                  (nodeData.connectedImageUrl as string) ||
                  (nodeData.connectedMediaUrl as string) ||
                  (nodeData.inputReference as string)
              });
              if (result) {
                onChange("generationId", result.id);
                onChange("status", result.status);
                toast.success("Generation started");
              }
            }
          }}
          disabled={isGenerating}
          className="h-11 w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-sm font-medium text-white shadow-lg shadow-blue-500/20 hover:from-blue-500 hover:to-blue-400"
        >
          {isGenerating ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Play className="size-4" />
          )}
          {isGenerating ? "Generating..." : "Generate Image"}
        </Button>
      </div>

      {(nodeData.usedPrompt as string) && (
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">Last Used Prompt</div>
          <div className="max-h-20 overflow-y-auto rounded-lg bg-muted/30 p-3 text-xs text-muted-foreground">
            {nodeData.usedPrompt as string}
          </div>
        </div>
      )}
    </div>
  );
}
