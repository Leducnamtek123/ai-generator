"use client";

import React, { useCallback, useRef, useState } from "react";

import { Loader2, Plus, Upload, Wand2 } from "lucide-react";
import { Handle, Position, useUpdateNodeInternals } from "@xyflow/react";

import { uploadFileWithToast } from "@/lib/upload";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";

import { NodeToolbar } from "../NodeToolbar";
import { NodeStatus } from "../types";
import { BaseNode } from "./BaseNode";

interface MediaNodeProps {
  id: string;
  data: {
    label?: string;
    mediaType?: "image" | "video" | "any";
    mediaUrl?: string;
    mediaName?: string;
    mediaThumbnail?: string;
    status?: NodeStatus;
    onDelete?: (id: string) => void;
    onMediaChange?: (id: string, url: string, name: string, thumbnail?: string) => void;
    onOpenImageEditor?: (url: string) => void;
    onOpenVideoEditor?: (url: string) => void;
    onHandleClick?: (
      event: React.MouseEvent,
      handleId: string,
      handleType: "source" | "target"
    ) => void;
    isPreview?: boolean;
  };
  selected?: boolean;
}

export function MediaNode({ id, data, selected }: MediaNodeProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const mediaType = data.mediaType || "any";

  const acceptTypes = {
    image: "image/*",
    video: "video/*",
    any: "image/*,video/*"
  };

  const handleFileSelect = useCallback(
    async (file: File) => {
      setIsUploading(true);
      try {
        const uploaded = await uploadFileWithToast(file, file.name);
        if (uploaded) {
          data.onMediaChange?.(id, uploaded.url, file.name, uploaded.url);
        }
      } finally {
        setIsUploading(false);
      }
    },
    [id, data]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const isVideo =
    data.mediaUrl?.includes("video") || data.mediaName?.match(/\.(mp4|webm|mov|avi)$/i);

  const updateNodeInternals = useUpdateNodeInternals();
  const handleMediaLoad = () => {
    updateNodeInternals(id);
  };

  const handleMediaClick = () => {
    if (!data.mediaUrl || data.isPreview) return;
    if (isVideo) {
      data.onOpenVideoEditor?.(data.mediaUrl);
    } else {
      data.onOpenImageEditor?.(data.mediaUrl);
    }
  };

  const sideIcons = (
    <div className="flex flex-col gap-1.5 py-2">
      <div
        className={cn(
          "flex h-6 w-6 items-center justify-center rounded-md transition-colors",
          isVideo ? "bg-muted text-muted-foreground" : "bg-blue-500/10 text-blue-600"
        )}
      >
        <Upload className="size-3.5" />
      </div>
      <div
        className={cn(
          "flex h-6 w-6 items-center justify-center rounded-md transition-colors",
          isVideo ? "bg-green-500/10 text-green-600" : "bg-muted text-muted-foreground"
        )}
      >
        <Plus className="size-3.5" />
      </div>
    </div>
  );

  return (
    <>
      {selected && !data.isPreview && (
        <NodeToolbar nodeId={id} onDelete={() => data.onDelete?.(id)} />
      )}

      <div className="relative group">
        <BaseNode
          id={id}
          title={
            data.label ||
            (mediaType === "image" ? "Image" : mediaType === "video" ? "Video" : "Media")
          }
          selected={selected}
          status={data.status}
          onDelete={data.onDelete}
          isPreview={data.isPreview}
          sideActions={sideIcons}
        >
          <div
            onClick={handleMediaClick}
            className={cn(
              "group relative cursor-pointer",
              data.isPreview ? "min-h-[60px] w-[120px]" : "min-h-[100px] w-[300px]"
            )}
          >
            {data.mediaUrl ? (
              <div className="relative">
                {isVideo ? (
                  <video
                    src={data.mediaUrl}
                    className="block h-auto w-full object-cover"
                    muted
                    loop
                    autoPlay
                    playsInline
                    onLoadedData={handleMediaLoad}
                  />
                ) : (
                  <div className="relative aspect-video w-full overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element -- Uploaded files can come from local/S3 backends outside next.config image hosts. */}
                    <img
                      src={data.mediaUrl}
                      alt={data.mediaName || "Uploaded media"}
                      className="h-full w-full object-cover"
                      onLoad={handleMediaLoad}
                    />
                  </div>
                )}

                {/* Hover Edit Overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-background/70 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="gap-2 border-border bg-background/80 text-foreground backdrop-blur-sm hover:bg-background"
                    onClick={handleMediaClick}
                  >
                    <Wand2 className="size-4" />
                    Edit {isVideo ? "Clip" : "Image"}
                  </Button>
                </div>
              </div>
            ) : (
              <div
                className={cn(
                  "nodrag nopan flex aspect-video w-full flex-col items-center justify-center border-2 border-dashed border-transparent bg-muted/50 p-4 transition-colors hover:border-primary/50",
                  data.isPreview && "p-2"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                {isUploading ? (
                  <Loader2 className="size-4 animate-spin text-primary" />
                ) : (
                  <>
                    <Upload
                      className={cn(
                        "text-muted-foreground",
                        data.isPreview ? "h-4 w-4" : "mb-2 h-8 w-8"
                      )}
                    />
                    {!data.isPreview && (
                      <span className="text-xs font-medium text-muted-foreground">Upload media</span>
                    )}
                  </>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleInputChange}
                  accept={acceptTypes[mediaType]}
                  className="hidden"
                  onClick={(e) => e.stopPropagation()}
                />
                {false && <span />}
              </div>
            )}
          </div>
        </BaseNode>

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
            className="!border-2 !border-background !bg-cyan-500"
          />
        </div>
      </div>
    </>
  );
}
