"use client";

import { useCallback, useEffect, useRef } from "react";

import { Edge, Node, useReactFlow } from "@xyflow/react";

import {
  enhancePrompt,
  generateImage,
  generateMusic,
  generateSfx,
  generateVideo,
  generateVoice,
  getGeneration,
  lipSync,
  removeBackground,
  upscaleImage,
  upscaleVideo,
  type GenerationResult as ApiGenerationResult,
  type EnhancePromptParams,
  type GenerateImageParams,
  type GenerateMusicParams,
  type GenerateSfxParams,
  type GenerateVideoParams,
  type GenerateVoiceParams,
  type LipSyncParams,
  type RemoveBackgroundParams,
  type UpscaleImageParams,
  type UpscaleVideoParams
} from "@/lib/api/generations";
import { isAbortError, pollUntil } from "@/lib/async-operation";

import { ConnectionType, NodeStatus, ToolType, WorkflowNodeType } from "../types";

const GENERATION_POLL_INTERVAL_MS = 2000;
const GENERATION_POLL_TIMEOUT_MS = 10 * 60 * 1000;
const VIDEO_URL_PATTERN = /\.(mp4|webm|mov|avi|mkv|m4v|wmv)(\?.*)?$/i;

type WorkflowNodeData = {
  [key: string]: unknown;
  enhancedText?: string;
  text?: string;
  inputText?: string;
  prompt?: string;
  content?: string;
  name?: string;
  label?: string;
  connectedPrompt?: string;
  connectedMediaUrl?: string;
  connectedImageUrl?: string;
  connectedVideoUrl?: string;
  previewUrl?: string;
  outputUrl?: string;
  resultUrl?: string;
  mediaUrl?: string;
  inputImageUrl?: string;
  inputUrl?: string;
  inputVideoUrl?: string;
  resultText?: string;
  mediaName?: string;
  model?: string;
  aspectRatio?: string;
  quality?: string;
  negativePrompt?: string;
  seed?: number | string;
  duration?: string;
  startImageUrl?: string;
  endImageUrl?: string;
  inputReference?: string;
  inputPrompt?: string;
  styleEmphasis?: string;
  advancedParams?: string;
  provider?: string;
  toolType?: ToolType;
  scale?: number | string;
  enhanceMode?: string;
  primaryUrl?: string;
  secondaryUrl?: string;
  audioUrl?: string;
  syncMode?: string;
  accuracy?: number | string;
  smoothing?: number | string;
  targetResolution?: string;
  denoise?: number | string;
  sharpen?: number | string;
  fpsBoost?: boolean;
  mode?: string;
  category?: string;
  voiceId?: string;
  language?: string;
  emotion?: string;
  speed?: number | string;
  edgeRefinement?: number | string;
  level?: number | string;
  preserveDetails?: boolean;
  status?: NodeStatus;
  mediaType?: string;
};

type WorkflowNode = Node<WorkflowNodeData>;
type WorkflowOutput = { type: ConnectionType; value: string };
type WorkflowInput = WorkflowOutput;

function safeParseAdvancedParams(input?: string) {
  if (!input?.trim()) {
    return {};
  }

  try {
    const parsed = JSON.parse(input);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function mergeParams(base: Record<string, unknown>, advancedParams?: string) {
  return {
    ...base,
    ...safeParseAdvancedParams(advancedParams)
  };
}

function optionalString(value: unknown) {
  return typeof value === "string" && value.trim() !== "" ? value : undefined;
}

function firstString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed) {
        return trimmed;
      }
    }
  }
  return "";
}

function getNodeTextValue(node: Node) {
  return firstString(
    node.data.enhancedText,
    node.data.text,
    node.data.inputText,
    node.data.prompt,
    node.data.content,
    node.data.name,
    node.data.label,
    node.data.connectedPrompt,
    node.data.connectedMediaUrl
  );
}

function getNodeImageValue(node: Node) {
  return firstString(
    node.data.previewUrl,
    node.data.outputUrl,
    node.data.resultUrl,
    node.data.mediaUrl,
    node.data.inputImageUrl,
    node.data.inputUrl,
    node.data.connectedImageUrl,
    node.data.connectedMediaUrl
  );
}

function getNodeVideoValue(node: Node) {
  return firstString(
    node.data.previewUrl,
    node.data.videoUrl,
    node.data.resultUrl,
    node.data.inputVideoUrl,
    node.data.connectedVideoUrl,
    node.data.connectedMediaUrl
  );
}

function getNodeReferenceValue(node: Node) {
  return firstString(
    node.data.connectedPrompt,
    node.data.connectedImageUrl,
    node.data.connectedVideoUrl,
    node.data.connectedMediaUrl,
    node.data.content,
    node.data.name,
    node.data.label
  );
}

function inferMediaConnectionType(value: string) {
  return VIDEO_URL_PATTERN.test(value) ? ConnectionType.VIDEO : ConnectionType.IMAGE;
}

function getProviderValue(node: WorkflowNode, params: Record<string, unknown>) {
  return optionalString(params.provider ?? node.data.provider);
}

function getGenerationErrorMessage(generation: ApiGenerationResult, fallback: string) {
  const metadata = generation.metadata as Record<string, unknown> | undefined;
  const metadataError = metadata?.error;

  if (typeof metadataError === "string" && metadataError.trim()) {
    return metadataError;
  }

  return fallback;
}

async function waitForGenerationCompletion(
  generationId: string,
  signal?: AbortSignal,
): Promise<ApiGenerationResult> {
  return pollUntil({
    fetcher: (pollSignal) => getGeneration(generationId, { signal: pollSignal }),
    shouldStop: (generation) =>
      generation.status === "completed" || generation.status === "failed",
    intervalMs: GENERATION_POLL_INTERVAL_MS,
    timeoutMs: GENERATION_POLL_TIMEOUT_MS,
    signal,
  });
}

async function finalizeGenerationResult(
  generation: ApiGenerationResult,
  fallbackMessage: string,
) {
  const completed =
    generation.status === "completed" || generation.status === "failed"
      ? generation
      : await waitForGenerationCompletion(generation.id);

  if (completed.status === "failed") {
    throw new Error(getGenerationErrorMessage(completed, fallbackMessage));
  }

  return completed;
}

export function useWorkflowExecution(
  setNodes: (
    nodes: WorkflowNode[] | ((nodes: WorkflowNode[]) => WorkflowNode[]),
  ) => void,
  saveToHistory: (nodes: Node[], edges: Edge[]) => void
) {
  const { getNodes, getEdges } = useReactFlow();
  const executionControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      executionControllerRef.current?.abort();
      executionControllerRef.current = null;
    };
  }, []);

  const startExecution = useCallback(() => {
    executionControllerRef.current?.abort();
    const controller = new AbortController();
    executionControllerRef.current = controller;
    return controller;
  }, []);

  const getNodeOutput = useCallback((node: WorkflowNode) => {
    const nodeType = node.type;
    switch (nodeType) {
      case "input":
      case WorkflowNodeType.TEXT:
        return getNodeTextValue(node)
          ? { type: ConnectionType.TEXT, value: getNodeTextValue(node) }
          : null;
      case WorkflowNodeType.MEDIA:
        if (node.data.mediaUrl) {
          const isVideo = (node.data.mediaName as string)?.match(/\.(mp4|webm|mov|avi)$/i);
          return {
            type: isVideo ? ConnectionType.VIDEO : ConnectionType.IMAGE,
            value: node.data.mediaUrl as string
          };
        }
        break;
      case WorkflowNodeType.IMAGE_GEN:
      case WorkflowNodeType.UPSCALE:
      case WorkflowNodeType.CAMERA:
        return getNodeImageValue(node)
          ? { type: ConnectionType.IMAGE, value: getNodeImageValue(node) }
          : null;
      case WorkflowNodeType.VIDEO_GEN:
        return getNodeVideoValue(node)
          ? { type: ConnectionType.VIDEO, value: getNodeVideoValue(node) }
          : null;
      case WorkflowNodeType.ASSISTANT:
        return getNodeTextValue(node)
          ? { type: ConnectionType.TEXT, value: getNodeTextValue(node) }
          : null;
      case WorkflowNodeType.TOOL:
        if (node.data.resultText) {
          return { type: ConnectionType.TEXT, value: node.data.resultText as string };
        }
        if (node.data.resultUrl) {
          return {
            type: inferMediaConnectionType(node.data.resultUrl as string),
            value: node.data.resultUrl as string
          };
        }
        if (node.data.previewUrl) {
          return {
            type: inferMediaConnectionType(node.data.previewUrl as string),
            value: node.data.previewUrl as string
          };
        }
        return getNodeReferenceValue(node)
          ? { type: ConnectionType.REFERENCE, value: getNodeReferenceValue(node) }
          : null;
      case WorkflowNodeType.STICKY_NOTE:
      case WorkflowNodeType.COMMENT:
        return getNodeTextValue(node)
          ? { type: ConnectionType.TEXT, value: getNodeTextValue(node) }
          : null;
      case WorkflowNodeType.GROUP:
      case WorkflowNodeType.STICKER:
      case "process":
      case "output":
        if (getNodeTextValue(node)) {
          return { type: ConnectionType.TEXT, value: getNodeTextValue(node) };
        }
        if (getNodeImageValue(node)) {
          return { type: ConnectionType.IMAGE, value: getNodeImageValue(node) };
        }
        if (getNodeVideoValue(node)) {
          return { type: ConnectionType.VIDEO, value: getNodeVideoValue(node) };
        }
        return getNodeReferenceValue(node)
          ? { type: ConnectionType.REFERENCE, value: getNodeReferenceValue(node) }
          : null;
    }
    return null;
  }, []);

  const getNodeInputs = useCallback(
    (nodeId: string) => {
      const currentNodes = getNodes();
      const currentEdges = getEdges();
      const nodesById = new Map(currentNodes.map((node) => [node.id, node] as const));
      const incomingEdges = currentEdges.filter((e) => e.target === nodeId);
      const inputs: WorkflowInput[] = [];

      for (const edge of incomingEdges) {
        const sourceNode = nodesById.get(edge.source);
        if (sourceNode) {
          const output = getNodeOutput(sourceNode);
          if (output) inputs.push(output);
        }
      }
      return inputs;
    },
    [getNodes, getEdges, getNodeOutput]
  );

  const runNode = useCallback(
    async (nodeId: string, signal?: AbortSignal) => {
      const currentNodes = getNodes();
      const node = currentNodes.find((n) => n.id === nodeId);
      if (!node) return;

      const inputs = getNodeInputs(nodeId);
      const advancedParams = safeParseAdvancedParams(
        node.data.advancedParams as string | undefined
      );

      setNodes((nds: WorkflowNode[]) =>
        nds.map((n) =>
          n.id === nodeId ? { ...n, data: { ...n.data, status: NodeStatus.PROCESSING } } : n
        )
      );

      try {
        let newData: WorkflowNodeData = { ...node.data, status: NodeStatus.SUCCESS };
        const nodeOutput = getNodeOutput(node);
        const model = optionalString(node.data.model);
        const aspectRatio = optionalString(node.data.aspectRatio);
        const duration = optionalString(node.data.duration);
        const quality = (optionalString(node.data.quality) as GenerateImageParams["quality"] | undefined) || "standard";
        const negativePrompt = optionalString(node.data.negativePrompt);
        const seed =
          typeof node.data.seed === "number"
            ? node.data.seed
            : typeof node.data.seed === "string" && node.data.seed.trim() !== ""
              ? Number(node.data.seed)
              : undefined;
        const promptValue = firstString(
          node.data.text,
          node.data.prompt,
          node.data.inputPrompt,
          node.data.content,
          node.data.name,
          node.data.label
        );
        const referenceImageUrl = firstString(
          node.data.inputReference,
          node.data.connectedImageUrl,
          node.data.connectedMediaUrl
        );
        const startImageUrl = firstString(
          node.data.startImageUrl,
          node.data.inputImageUrl,
          node.data.connectedImageUrl,
          node.data.connectedMediaUrl
        );

        if (node.type === WorkflowNodeType.IMAGE_GEN) {
          const textInput = inputs.find((i) => i.type === ConnectionType.TEXT);
          const imageInput = inputs.find((i) => i.type === ConnectionType.IMAGE);
          const prompt = firstString(textInput?.value, promptValue);
          if (!prompt) throw new Error("Missing prompt for Image Generation");

          const result = await generateImage({
            prompt,
            model,
            aspectRatio,
            quality,
            negativePrompt,
            seed: Number.isFinite(seed as number) ? seed : undefined,
            referenceImageUrl: firstString(imageInput?.value, referenceImageUrl) || undefined,
            provider: getProviderValue(node, advancedParams)
          });

          newData.generationId = result.id;
          newData.status = result.status === "failed" ? NodeStatus.ERROR : NodeStatus.QUEUED;

          const completed = await waitForGenerationCompletion(result.id, signal);
          if (completed.status === "failed") {
            throw new Error(getGenerationErrorMessage(completed, "Image generation failed"));
          }

          newData.previewUrl = completed.resultUrl;
          newData.usedPrompt = prompt;
          newData.status = NodeStatus.SUCCESS;
        } else if (node.type === WorkflowNodeType.VIDEO_GEN) {
          const textInput = inputs.find((i) => i.type === ConnectionType.TEXT);
          const imageInput = inputs.find((i) => i.type === ConnectionType.IMAGE);
          const videoPrompt = firstString(textInput?.value, promptValue);

          const result = await generateVideo({
            prompt: videoPrompt || "Video from image",
            model,
            duration,
            aspectRatio,
            startImageUrl: firstString(imageInput?.value, startImageUrl) || undefined,
            endImageUrl: optionalString(node.data.endImageUrl),
            provider: getProviderValue(node, advancedParams)
          });
          newData.generationId = result.id;
          newData.status = result.status === "failed" ? NodeStatus.ERROR : NodeStatus.QUEUED;

          const completed = await waitForGenerationCompletion(result.id, signal);
          if (completed.status === "failed") {
            throw new Error(getGenerationErrorMessage(completed, "Video generation failed"));
          }

          newData.previewUrl = completed.resultUrl;
          newData.status = NodeStatus.SUCCESS;
        } else if (node.type === WorkflowNodeType.UPSCALE) {
          const imageInput = inputs.find((i) => i.type === ConnectionType.IMAGE);
          const imageUrl = firstString(imageInput?.value, node.data.inputUrl);
          if (!imageUrl) throw new Error("Missing image for Upscale");
          const enhanceMode =
            (optionalString(node.data.enhanceMode) as UpscaleImageParams["enhanceMode"] | undefined) ||
            "balanced";

          const result = await upscaleImage({
            imageUrl,
            scale: Number(node.data.scale) === 4 ? 4 : 2,
            enhanceMode,
            provider: getProviderValue(node, advancedParams)
          });
          newData.generationId = result.id;
          newData.status = result.status === "failed" ? NodeStatus.ERROR : NodeStatus.QUEUED;

          const completed = await waitForGenerationCompletion(result.id, signal);
          if (completed.status === "failed") {
            throw new Error(getGenerationErrorMessage(completed, "Upscale failed"));
          }

          newData.previewUrl = completed.resultUrl;
          newData.status = NodeStatus.SUCCESS;
        } else if (node.type === WorkflowNodeType.ASSISTANT) {
          const textInput = inputs.find((i) => i.type === ConnectionType.TEXT);
          const originalText = firstString(textInput?.value, node.data.inputText, promptValue);
          if (!originalText) throw new Error("Missing input text for Assistant");

          newData.inputText = originalText;
          const res = await enhancePrompt({
            prompt: originalText,
            style: optionalString(node.data.styleEmphasis) || "Photorealistic",
            provider: getProviderValue(node, advancedParams)
          });
          newData.enhancedText = res.enhancedPrompt;
          newData.inputPrompt = originalText;
        } else if (
          node.type === "input" ||
          node.type === "process" ||
          node.type === "output" ||
          node.type === WorkflowNodeType.STICKY_NOTE ||
          node.type === WorkflowNodeType.COMMENT ||
          node.type === WorkflowNodeType.GROUP ||
          node.type === WorkflowNodeType.STICKER
        ) {
          const textValue =
            nodeOutput?.type === ConnectionType.TEXT ? nodeOutput.value : getNodeTextValue(node);
          const imageValue =
            nodeOutput?.type === ConnectionType.IMAGE ? nodeOutput.value : getNodeImageValue(node);
          const videoValue =
            nodeOutput?.type === ConnectionType.VIDEO ? nodeOutput.value : getNodeVideoValue(node);
          const referenceValue =
            nodeOutput?.type === ConnectionType.REFERENCE
              ? nodeOutput.value
              : getNodeReferenceValue(node);

          newData.referenceValue = referenceValue;
          newData.outputText = textValue || referenceValue;
          if (textValue) {
            newData.inputText = textValue;
            newData.inputPrompt = textValue;
          }
          if (imageValue) {
            newData.inputImageUrl = imageValue;
            newData.inputUrl = imageValue;
            newData.previewUrl = imageValue;
          }
          if (videoValue) {
            newData.inputVideoUrl = videoValue;
            newData.previewUrl = videoValue;
          }
        } else if (node.type === WorkflowNodeType.TOOL) {
          const toolType = (node.data.toolType as ToolType) || ToolType.IMAGE_GEN;
          const generated = await runGenericTool({
            toolType,
            node,
            inputs
          });

          newData = {
            ...newData,
            ...generated,
            status: NodeStatus.SUCCESS
          };
        }

        setNodes((nds: WorkflowNode[]) => {
          const updatedNodes = nds.map((n) => (n.id === nodeId ? { ...n, data: newData } : n));
          saveToHistory(updatedNodes, getEdges());
          return updatedNodes;
        });
      } catch (err) {
        if (isAbortError(err)) {
          return;
        }
        console.error(`Failed to run node ${nodeId}`, err);
        setNodes((nds: WorkflowNode[]) =>
          nds.map((n) =>
            n.id === nodeId ? { ...n, data: { ...n.data, status: NodeStatus.ERROR } } : n
          )
        );
      }
    },
    [setNodes, getNodes, getEdges, getNodeInputs, saveToHistory, getNodeOutput]
  );

  const runWorkflow = useCallback(
    async (startNodeId: string, mode: "workflow" | "local" = "workflow") => {
      const execution = startExecution();
      const currentNodes = getNodes();
      const currentEdges = getEdges();
      const nodesById = new Map(currentNodes.map((node) => [node.id, node] as const));
      const visited = new Set<string>();
      const executionOrder: string[] = [];

      if (mode === "local") {
        executionOrder.push(startNodeId);
      } else {
        const visit = (nodeId: string) => {
          if (visited.has(nodeId)) return;
          visited.add(nodeId);
          const dependencies: string[] = [];
          for (const edge of currentEdges) {
            if (edge.target === nodeId) {
              dependencies.push(edge.source);
            }
          }
          dependencies.forEach(visit);
          executionOrder.push(nodeId);
        };
        visit(startNodeId);
      }

      const executeNodeOrder = async (index: number): Promise<void> => {
        if (index >= executionOrder.length) {
          return;
        }

        const nodeId = executionOrder[index];
        const node = nodesById.get(nodeId);
        if (node && node.type !== WorkflowNodeType.TEXT && node.type !== WorkflowNodeType.MEDIA) {
          await runNode(nodeId, execution.signal);
        }

        return executeNodeOrder(index + 1);
      };

      await executeNodeOrder(0);
    },
    [getNodes, getEdges, runNode, startExecution]
  );

  return { runNode, runWorkflow, getNodeOutput };
}

async function runGenericTool({
  toolType,
  node,
  inputs
}: {
  toolType: ToolType;
  node: WorkflowNode;
  inputs: WorkflowInput[];
}) {
  const textInput = inputs.find((i) => i.type === ConnectionType.TEXT)?.value;
  const imageInput = inputs.find((i) => i.type === ConnectionType.IMAGE)?.value;
  const videoInput = inputs.find((i) => i.type === ConnectionType.VIDEO)?.value;
  const params = mergeParams(
    {
      prompt: node.data.prompt || textInput || "",
      imageUrl: node.data.primaryUrl || imageInput || "",
      videoUrl: node.data.primaryUrl || videoInput || "",
      audioUrl: node.data.secondaryUrl || "",
      text: node.data.prompt || textInput || ""
    },
    node.data.advancedParams as string | undefined
  );

  const asString = (value: unknown, fallback = "") =>
    typeof value === "string" ? value : fallback;

  const asNumber = (value: unknown, fallback?: number) => {
    if (typeof value === "number" && !Number.isNaN(value)) return value;
    if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number(value);
      return Number.isNaN(parsed) ? fallback : parsed;
    }
    return fallback;
  };

  let result: ApiGenerationResult | { enhancedPrompt: string };

  switch (toolType) {
    case ToolType.IMAGE_GEN: {
      result = await finalizeGenerationResult(
        await generateImage({
          prompt: asString(params.prompt, "A detailed image"),
          model: asString(params.model, "seedream"),
          aspectRatio: asString(params.aspectRatio, "1:1"),
          quality: asString(params.quality, "hd") as "standard" | "hd" | "4k",
          negativePrompt: optionalString(params.negativePrompt),
          seed: asNumber(params.seed),
          provider: getProviderValue(node, params)
        } as GenerateImageParams),
        "Image generation failed",
      );
      break;
    }
    case ToolType.VIDEO_GEN: {
      result = await finalizeGenerationResult(
        await generateVideo({
          prompt: asString(params.prompt, "A cinematic video"),
          model: asString(params.model, "runway"),
          duration: asString(params.duration, "8s"),
          aspectRatio: asString(params.aspectRatio, "16:9"),
          startImageUrl: optionalString(
            params.startImageUrl || params.imageUrl || node.data.primaryUrl || imageInput
          ),
          endImageUrl: optionalString(params.endImageUrl || node.data.secondaryUrl),
          provider: getProviderValue(node, params)
        } as GenerateVideoParams),
        "Video generation failed",
      );
      break;
    }
    case ToolType.UPSCALE: {
      const imageUrl = asString(
        params.imageUrl || params.primaryUrl || node.data.primaryUrl || imageInput
      );
      if (!imageUrl) throw new Error("Missing image for Upscale");
      result = await finalizeGenerationResult(
        await upscaleImage({
          imageUrl,
          scale: asNumber(params.scale, 2) as 2 | 4,
          enhanceMode: asString(params.enhanceMode || params.mode, "balanced") as
            | "balanced"
            | "creative"
            | "faithful"
            | "precision",
          provider: getProviderValue(node, params)
        } as UpscaleImageParams),
        "Upscale failed",
      );
      break;
    }
    case ToolType.ASSISTANT: {
      const prompt = asString(
        params.prompt,
        typeof textInput === "string"
          ? textInput
          : typeof node.data.prompt === "string"
            ? node.data.prompt
            : ""
      );
      if (!prompt) throw new Error("Missing prompt for Assistant");
      result = await enhancePrompt({
        prompt,
        style: asString(params.style, "photorealistic"),
        provider: getProviderValue(node, params)
      } as EnhancePromptParams);
      break;
    }
    case ToolType.MUSIC: {
      result = await finalizeGenerationResult(
        await generateMusic({
          prompt: asString(params.prompt, textInput || "Ambient music"),
          genre: optionalString(params.genre),
          moods: Array.isArray(params.moods) ? params.moods : undefined,
          instruments: Array.isArray(params.instruments) ? params.instruments : undefined,
          duration: asNumber(params.duration, undefined),
          tempo: asNumber(params.tempo, undefined),
          provider: getProviderValue(node, params)
        } as GenerateMusicParams),
        "Music generation failed",
      );
      break;
    }
    case ToolType.SFX: {
      result = await finalizeGenerationResult(
        await generateSfx({
          prompt: asString(params.prompt, textInput || "Sound effect"),
          category: optionalString(params.category),
          duration: asNumber(params.duration, undefined),
          provider: getProviderValue(node, params)
        } as GenerateSfxParams),
        "Sound effect generation failed",
      );
      break;
    }
    case ToolType.VOICE: {
      result = await finalizeGenerationResult(
        await generateVoice({
          text: asString(params.text || params.prompt, textInput || "Hello world"),
          mode: asString(params.mode, "tts") as "tts" | "clone",
          voiceId: optionalString(params.voiceId),
          language: optionalString(params.language),
          emotion: optionalString(params.emotion),
          speed: asNumber(params.speed, undefined),
          provider: getProviderValue(node, params)
        } as GenerateVoiceParams),
        "Voice generation failed",
      );
      break;
    }
    case ToolType.LIP_SYNC: {
      result = await finalizeGenerationResult(
        await lipSync({
          videoUrl: asString(
            params.videoUrl || params.primaryUrl || node.data.primaryUrl || videoInput,
            ""
          ),
          audioUrl: asString(params.audioUrl || params.secondaryUrl || node.data.secondaryUrl, ""),
          syncMode: optionalString(params.syncMode),
          accuracy: asNumber(params.accuracy, undefined),
          smoothing: asNumber(params.smoothing, undefined),
          provider: getProviderValue(node, params)
        } as LipSyncParams),
        "Lip-sync failed",
      );
      break;
    }
    case ToolType.VIDEO_UPSCALE: {
      result = await finalizeGenerationResult(
        await upscaleVideo({
          videoUrl: asString(
            params.videoUrl || params.primaryUrl || node.data.primaryUrl || videoInput,
            ""
          ),
          targetResolution: optionalString(params.targetResolution),
          model: optionalString(params.model),
          denoise: asNumber(params.denoise, undefined),
          sharpen: asNumber(params.sharpen, undefined),
          fpsBoost: Boolean(params.fpsBoost),
          provider: getProviderValue(node, params)
        } as UpscaleVideoParams),
        "Video upscale failed",
      );
      break;
    }
    case ToolType.BG_REMOVE: {
      result = await finalizeGenerationResult(
        await removeBackground({
          imageUrl: asString(
            params.imageUrl || params.primaryUrl || node.data.primaryUrl || imageInput,
            ""
          ),
          mode: optionalString(params.mode),
          edgeRefinement: asNumber(params.edgeRefinement, undefined),
          provider: getProviderValue(node, params)
        } as RemoveBackgroundParams),
        "Background removal failed",
      );
      break;
    }
    case ToolType.SKETCH_TO_IMAGE:
    case ToolType.VARIATIONS:
    case ToolType.CAMERA_CHANGE:
    case ToolType.ICON_GEN:
    case ToolType.IMAGE_EXTEND:
    case ToolType.MOCKUP:
    case ToolType.SKIN_ENHANCE:
      result = await finalizeGenerationResult(
        await generateImage({
          prompt: asString(params.prompt, textInput || "Create an image"),
          model: asString(params.model, "seedream"),
          aspectRatio: asString(params.aspectRatio, "1:1"),
          quality: asString(params.quality, "hd") as "standard" | "hd" | "4k",
          provider: getProviderValue(node, params)
        } as GenerateImageParams),
        "Image generation failed",
      );
      break;
    default:
      throw new Error(`Unsupported tool type: ${toolType}`);
  }

  if ("enhancedPrompt" in result) {
    return { resultText: result.enhancedPrompt };
  }

  return {
    resultUrl: result.resultUrl || "",
    previewUrl: result.resultUrl || "",
    generationId: result.id
  };
}
