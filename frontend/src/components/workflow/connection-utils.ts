"use client";

import { Edge, Node } from "@xyflow/react";

import { ConnectionType, FileMediaType, WorkflowNodeType } from "./types";

export type WorkflowConnectionSlot = "prompt" | "image" | "video" | "media" | "reference";

export type WorkflowConnectionFlags = Partial<Record<WorkflowConnectionSlot, boolean>>;

export type WorkflowConnectionSummary = {
  sourceId: string;
  sourceLabel: string;
  sourceType: ConnectionType;
  slot: WorkflowConnectionSlot;
  valuePreview?: string;
};

export type WorkflowConnectionSnapshot = {
  inputs: WorkflowConnectionFlags;
  inputText?: string;
  inputPrompt?: string;
  inputUrl?: string;
  inputImageUrl?: string;
  inputReference?: string;
  inputVideoUrl?: string;
  startImageUrl?: string;
  connectedPrompt?: string;
  connectedPromptSource?: string;
  connectedImageUrl?: string;
  connectedImageSource?: string;
  connectedVideoUrl?: string;
  connectedVideoSource?: string;
  connectedMediaUrl?: string;
  connectedMediaSource?: string;
  connectionSummary: WorkflowConnectionSummary[];
};

const VIDEO_EXTENSIONS = /\.(mp4|webm|mov|avi|mkv|m4v|wmv)$/i;
const IMAGE_EXTENSIONS = /\.(png|jpe?g|gif|webp|bmp|svg|avif|heic)$/i;

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getNodeLabel(node: Node) {
  return asString(node.data?.label) || node.type || node.id;
}

function detectMediaOutputType(node: Node): ConnectionType {
  const mediaType = asString(node.data?.mediaType);
  const mediaUrl = asString(node.data?.mediaUrl);
  const mediaName = asString(node.data?.mediaName);
  const reference = `${mediaUrl} ${mediaName}`.trim();

  if (mediaType === FileMediaType.VIDEO || VIDEO_EXTENSIONS.test(reference)) {
    return ConnectionType.VIDEO;
  }

  if (mediaType === FileMediaType.IMAGE || IMAGE_EXTENSIONS.test(reference)) {
    return ConnectionType.IMAGE;
  }

  return ConnectionType.MEDIA;
}

export function inferNodeOutputType(node: Node): ConnectionType | null {
  switch (String(node.type)) {
    case "input":
    case WorkflowNodeType.TEXT:
      return ConnectionType.TEXT;
    case "process":
      return ConnectionType.REFERENCE;
    case "output":
      return null;
    case WorkflowNodeType.MEDIA:
      return detectMediaOutputType(node);
    case WorkflowNodeType.IMAGE_GEN:
    case WorkflowNodeType.UPSCALE:
    case WorkflowNodeType.CAMERA:
      return ConnectionType.IMAGE;
    case WorkflowNodeType.VIDEO_GEN:
      return ConnectionType.VIDEO;
    case WorkflowNodeType.ASSISTANT:
      return ConnectionType.TEXT;
    case WorkflowNodeType.TOOL: {
      if (asString(node.data?.resultText)) {
        return ConnectionType.TEXT;
      }
      if (asString(node.data?.resultUrl)) {
        return detectMediaOutputType({
          ...node,
          type: WorkflowNodeType.MEDIA,
          data: {
            ...node.data,
            mediaUrl: node.data?.resultUrl,
            mediaName: node.data?.resultUrl
          }
        });
      }
      if (asString(node.data?.previewUrl)) {
        return ConnectionType.REFERENCE;
      }
      return ConnectionType.REFERENCE;
    }
    case WorkflowNodeType.STICKY_NOTE:
    case WorkflowNodeType.COMMENT:
      return ConnectionType.TEXT;
    case WorkflowNodeType.GROUP:
    case WorkflowNodeType.STICKER:
      return ConnectionType.REFERENCE;
    default:
      return null;
  }
}

export function getNodeOutputValue(node: Node, outputType: ConnectionType | null) {
  switch (outputType) {
    case ConnectionType.TEXT:
      return (
        asString(node.data?.enhancedText) ||
        asString(node.data?.text) ||
        asString(node.data?.inputText) ||
        asString(node.data?.prompt) ||
        asString(node.data?.content) ||
        asString(node.data?.name) ||
        asString(node.data?.label) ||
        asString(node.data?.connectedPrompt) ||
        asString(node.data?.connectedMediaUrl)
      );
    case ConnectionType.IMAGE:
      return (
        asString(node.data?.previewUrl) ||
        asString(node.data?.mediaUrl) ||
        asString(node.data?.inputImageUrl) ||
        asString(node.data?.inputUrl) ||
        asString(node.data?.resultUrl) ||
        asString(node.data?.outputUrl) ||
        asString(node.data?.connectedImageUrl) ||
        asString(node.data?.connectedMediaUrl)
      );
    case ConnectionType.VIDEO:
      return (
        asString(node.data?.previewUrl) ||
        asString(node.data?.mediaUrl) ||
        asString(node.data?.resultUrl) ||
        asString(node.data?.videoUrl) ||
        asString(node.data?.connectedVideoUrl) ||
        asString(node.data?.connectedMediaUrl)
      );
    case ConnectionType.MEDIA:
    case ConnectionType.REFERENCE:
      return (
        asString(node.data?.mediaUrl) ||
        asString(node.data?.previewUrl) ||
        asString(node.data?.resultUrl) ||
        asString(node.data?.text) ||
        asString(node.data?.content) ||
        asString(node.data?.name) ||
        asString(node.data?.label) ||
        asString(node.data?.connectedPrompt) ||
        asString(node.data?.connectedImageUrl) ||
        asString(node.data?.connectedVideoUrl) ||
        asString(node.data?.connectedMediaUrl)
      );
    default:
      return "";
  }
}

export function getConnectionSlot(
  targetNode: Node,
  targetHandleId?: string | null
): WorkflowConnectionSlot | null {
  const handle = asString(targetHandleId).toLowerCase();
  const targetType = String(targetNode.type);

  if (handle.includes("prompt")) return "prompt";
  if (handle.includes("media")) return "media";
  if (handle.includes("image")) return "image";
  if (handle.includes("video")) return "video";
  if (handle.includes("reference")) return "reference";

  switch (targetType) {
    case WorkflowNodeType.IMAGE_GEN:
      return "media";
    case WorkflowNodeType.VIDEO_GEN:
      return "image";
    case WorkflowNodeType.ASSISTANT:
      return "prompt";
    case WorkflowNodeType.UPSCALE:
    case WorkflowNodeType.CAMERA:
      return "image";
    case WorkflowNodeType.TOOL:
    case "process":
    case "output":
      return "reference";
    default:
      return null;
  }
}

export function isConnectionCompatible(
  sourceType: ConnectionType | null,
  slot: WorkflowConnectionSlot | null
) {
  if (!sourceType || !slot) return false;

  if (slot === "prompt") {
    return sourceType === ConnectionType.TEXT;
  }

  if (slot === "image") {
    return (
      sourceType === ConnectionType.IMAGE ||
      sourceType === ConnectionType.MEDIA ||
      sourceType === ConnectionType.REFERENCE
    );
  }

  if (slot === "video") {
    return sourceType === ConnectionType.VIDEO || sourceType === ConnectionType.MEDIA;
  }

  if (slot === "media") {
    return (
      sourceType === ConnectionType.IMAGE ||
      sourceType === ConnectionType.VIDEO ||
      sourceType === ConnectionType.MEDIA ||
      sourceType === ConnectionType.REFERENCE
    );
  }

  if (slot === "reference") {
    return true;
  }

  return false;
}

export function getConnectionLabel(slot: WorkflowConnectionSlot, sourceType: ConnectionType) {
  if (slot === "prompt") return "Prompt";
  if (slot === "image") return "Image";
  if (slot === "video") return "Video";
  if (slot === "media") return sourceType === ConnectionType.VIDEO ? "Video ref" : "Media";
  return "Reference";
}

export function getConnectionStroke(sourceType: ConnectionType) {
  switch (sourceType) {
    case ConnectionType.TEXT:
      return "#22c55e";
    case ConnectionType.IMAGE:
      return "#3b82f6";
    case ConnectionType.VIDEO:
      return "#a855f7";
    case ConnectionType.MEDIA:
      return "#06b6d4";
    case ConnectionType.REFERENCE:
    default:
      return "#f59e0b";
  }
}

export function buildNodeConnectionSnapshot(
  targetNode: Node,
  nodes: Node[],
  edges: Edge[]
): WorkflowConnectionSnapshot {
  const snapshot: WorkflowConnectionSnapshot = {
    inputs: {},
    connectionSummary: []
  };

  const incomingEdges = edges.filter((edge) => edge.target === targetNode.id);
  const nodesById = new Map(nodes.map((node) => [node.id, node] as const));

  for (const edge of incomingEdges) {
    const sourceNode = nodesById.get(edge.source);
    if (!sourceNode) continue;

    const sourceType = inferNodeOutputType(sourceNode);
    const slot = getConnectionSlot(targetNode, edge.targetHandle);
    if (!sourceType || !slot || !isConnectionCompatible(sourceType, slot)) continue;

    const sourceLabel = getNodeLabel(sourceNode);
    const valuePreview = getNodeOutputValue(sourceNode, sourceType);

    snapshot.connectionSummary.push({
      sourceId: sourceNode.id,
      sourceLabel,
      sourceType,
      slot,
      valuePreview
    });

    snapshot.inputs[slot] = true;

    if (slot === "prompt") {
      snapshot.connectedPrompt ??= valuePreview || sourceLabel;
      snapshot.connectedPromptSource ??= sourceLabel;
      snapshot.inputText ??= valuePreview;
      snapshot.inputPrompt ??= valuePreview || sourceLabel;
    }

    if (slot === "image") {
      snapshot.connectedImageUrl ??= valuePreview;
      snapshot.connectedImageSource ??= sourceLabel;
      snapshot.inputUrl ??= valuePreview;
      snapshot.inputImageUrl ??= valuePreview;
      snapshot.startImageUrl ??= valuePreview;
    }

    if (slot === "video") {
      snapshot.connectedVideoUrl ??= valuePreview;
      snapshot.connectedVideoSource ??= sourceLabel;
      snapshot.inputVideoUrl ??= valuePreview;
    }

    if (slot === "media" || slot === "reference") {
      snapshot.connectedMediaUrl ??= valuePreview;
      snapshot.connectedMediaSource ??= sourceLabel;
      snapshot.inputUrl ??= snapshot.inputUrl || valuePreview;
      snapshot.inputReference ??= valuePreview || sourceLabel;
      snapshot.inputImageUrl ??= snapshot.inputImageUrl || valuePreview;
      snapshot.startImageUrl ??= snapshot.startImageUrl || valuePreview;
    }
  }

  return snapshot;
}
