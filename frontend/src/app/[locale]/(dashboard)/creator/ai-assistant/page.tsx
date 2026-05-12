"use client";

import { Suspense, useEffect, useMemo, useReducer, useRef, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

import {
  Bot,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Copy,
  Download,
  Folder,
  Image as ImageIcon,
  Loader2,
  MessageSquareMore,
  Music,
  Palette,
  Paperclip,
  Plus,
  RefreshCcw,
  Search,
  Send,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  User,
  Video,
  Wand2
} from "lucide-react";
import { toast } from "sonner";

import { TemplateTypeEnum } from "@/lib/api/templates";
import { uploadFileWithToast } from "@/lib/upload";
import { cn } from "@/lib/utils";

import { useGenerationStore } from "@/stores/generation-store";
import { useGenerationProviders } from "@/hooks/useGenerationProviders";

import { TemplateExplorerModal } from "@/components/gallery/TemplateExplorerModal";
import { CreatorWorkspaceShell } from "@/components/layouts/CreatorWorkspaceShell";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Button } from "@/ui/button";
import { projectApi } from "@/services/projectApi";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  feedback?: "up" | "down" | null;
  attachments?: { type: "image" | "video"; url: string }[];
  generatedImages?: string[];
}

type AssistantSnapshot = {
  messages: Array<Omit<Message, "timestamp"> & { timestamp: string }>;
  input: string;
  selectedAction: string | null;
  selectedProvider: string;
  pendingAttachments: Array<{ type: "image" | "video"; url: string }>;
};

type AssistantProjectPayload = {
  version: number;
  savedAt: string;
  snapshot: AssistantSnapshot;
};

type ClearConversationOptions = {
  persistProject?: boolean;
  persistDraft?: boolean;
  resetProjectId?: boolean;
};

type AssistantHistoryItem = {
  id: string;
  name: string;
  preview: string;
  updatedAt: string;
  meta: string;
};

type AssistantState = {
  messages: Message[];
  input: string;
  isGenerating: boolean;
  errorMessage: string | null;
  selectedAction: string | null;
  selectedProvider: string;
  pendingAttachments: Array<{ type: "image" | "video"; url: string }>;
  projectId: string | null;
  isProjectLoading: boolean;
  isProjectSaving: boolean;
  projectError: string | null;
};

type AssistantAction =
  | { type: "set-messages"; messages: Message[] }
  | { type: "append-message"; message: Message }
  | { type: "set-message-feedback"; messageId: string; feedback: "up" | "down" | null }
  | { type: "set-input"; input: string }
  | { type: "set-generating"; isGenerating: boolean }
  | { type: "set-error"; errorMessage: string | null }
  | { type: "set-selected-action"; selectedAction: string | null }
  | { type: "set-selected-provider"; selectedProvider: string }
  | {
      type: "set-pending-attachments";
      pendingAttachments: Array<{ type: "image" | "video"; url: string }>;
    }
  | { type: "set-project-id"; projectId: string | null }
  | { type: "set-project-loading"; isProjectLoading: boolean }
  | { type: "set-project-saving"; isProjectSaving: boolean }
  | { type: "set-project-error"; projectError: string | null }
  | { type: "reset-conversation" };

const initialAssistantState: AssistantState = {
  messages: [],
  input: "",
  isGenerating: false,
  errorMessage: null,
  selectedAction: null,
  selectedProvider: "",
  pendingAttachments: [],
  projectId: null,
  isProjectLoading: false,
  isProjectSaving: false,
  projectError: null
};

const assistantReducer = (state: AssistantState, action: AssistantAction): AssistantState => {
  switch (action.type) {
    case "set-messages":
      return { ...state, messages: action.messages };
    case "append-message":
      return { ...state, messages: [...state.messages, action.message] };
    case "set-message-feedback":
      return {
        ...state,
        messages: state.messages.map((message) =>
          message.id === action.messageId ? { ...message, feedback: action.feedback } : message
        )
      };
    case "set-input":
      return { ...state, input: action.input };
    case "set-generating":
      return { ...state, isGenerating: action.isGenerating };
    case "set-error":
      return { ...state, errorMessage: action.errorMessage };
    case "set-selected-action":
      return { ...state, selectedAction: action.selectedAction };
    case "set-selected-provider":
      return { ...state, selectedProvider: action.selectedProvider };
    case "set-pending-attachments":
      return { ...state, pendingAttachments: action.pendingAttachments };
    case "set-project-id":
      return { ...state, projectId: action.projectId };
    case "set-project-loading":
      return { ...state, isProjectLoading: action.isProjectLoading };
    case "set-project-saving":
      return { ...state, isProjectSaving: action.isProjectSaving };
    case "set-project-error":
      return { ...state, projectError: action.projectError };
    case "reset-conversation":
      return {
        ...initialAssistantState,
        messages: [],
        selectedProvider: state.selectedProvider,
        projectId: state.projectId,
        projectError: state.projectError
      };
    default:
      return state;
  }
};

const normalizeAssistantSnapshot = (value: unknown): Partial<AssistantSnapshot> => {
  const raw = (value ?? {}) as Record<string, unknown>;
  const snapshot = (
    raw.snapshot && typeof raw.snapshot === "object" ? raw.snapshot : raw
  ) as Record<string, unknown>;

  const messages = Array.isArray(snapshot.messages)
    ? snapshot.messages.reduce<
        Array<{
          id: string;
          role: "user" | "assistant";
          content: string;
          timestamp: string;
          feedback?: "up" | "down" | null;
          attachments?: Array<{ type: "image" | "video"; url: string }>;
          generatedImages?: string[];
        }>
      >((items, message) => {
        const rawMessage = message as Record<string, unknown>;
        if (
          typeof rawMessage.id !== "string" ||
          (rawMessage.role !== "user" && rawMessage.role !== "assistant") ||
          typeof rawMessage.content !== "string"
        ) {
          return items;
        }

        const attachments = Array.isArray(rawMessage.attachments)
          ? rawMessage.attachments.flatMap((attachment) => {
              const item = attachment as Record<string, unknown>;
              if (
                (item.type === "image" || item.type === "video") &&
                typeof item.url === "string"
              ) {
                return [{ type: item.type as "image" | "video", url: item.url }];
              }
              return [];
            })
          : undefined;

        const generatedImages = Array.isArray(rawMessage.generatedImages)
          ? rawMessage.generatedImages.flatMap((url) => (typeof url === "string" ? [url] : []))
          : undefined;

        items.push({
          id: rawMessage.id,
          role: rawMessage.role,
          content: rawMessage.content,
          timestamp:
            typeof rawMessage.timestamp === "string"
              ? rawMessage.timestamp
              : new Date().toISOString(),
          feedback:
            rawMessage.feedback === "up" || rawMessage.feedback === "down"
              ? rawMessage.feedback
              : null,
          attachments,
          generatedImages
        });
        return items;
      }, [])
    : [];

  return {
    messages,
    input: typeof snapshot.input === "string" ? snapshot.input : "",
    selectedAction: typeof snapshot.selectedAction === "string" ? snapshot.selectedAction : null,
    selectedProvider:
      typeof snapshot.selectedProvider === "string" ? snapshot.selectedProvider : "",
    pendingAttachments: Array.isArray(snapshot.pendingAttachments)
      ? snapshot.pendingAttachments.filter(
          (attachment): attachment is { type: "image" | "video"; url: string } => {
            const item = attachment as Record<string, unknown>;
            return (item.type === "image" || item.type === "video") && typeof item.url === "string";
          }
        )
      : []
  };
};

const quickActions = [
  { id: "image", icon: ImageIcon, label: "Generate Image", color: "text-blue-400" },
  { id: "video", icon: Video, label: "Generate Video", color: "text-purple-400" },
  { id: "music", icon: Music, label: "Create Music", color: "text-green-400" },
  { id: "design", icon: Palette, label: "Design", color: "text-orange-400" },
  { id: "edit", icon: Wand2, label: "Edit Image", color: "text-pink-400" }
];

const actionConfig: Record<string, { endpoint: string; prompt: string; successLabel: string }> = {
  image: {
    endpoint: "/generations/image",
    prompt: "Generate a high quality image based on my request.",
    successLabel: "image"
  },
  video: {
    endpoint: "/generations/video",
    prompt: "Generate a high quality video based on my request.",
    successLabel: "video"
  },
  music: {
    endpoint: "/generations/music",
    prompt: "Generate music based on my request.",
    successLabel: "music"
  },
  design: {
    endpoint: "/generations/image",
    prompt: "Create a polished design based on my request.",
    successLabel: "design"
  },
  edit: {
    endpoint: "/generations/image",
    prompt: "Edit the image based on my request.",
    successLabel: "edit"
  }
};

const actionCapabilityMap: Record<string, string> = {
  image: "image-generation",
  video: "video-generation",
  music: "audio-music",
  design: "image-generation",
  edit: "image-generation"
};

const templates = [
  {
    label: "Product hero image",
    prompt:
      "Create a professional product hero image of a sleek smartwatch on a marble surface with soft studio lighting"
  },
  {
    label: "Character concept",
    prompt:
      "Design a futuristic cyberpunk character with neon accents, detailed armor, and a confident pose"
  },
  {
    label: "Video teaser",
    prompt:
      "Generate a cinematic video of a sunrise over mountain peaks with fog rolling through the valleys"
  },
  {
    label: "Brand logo",
    prompt: 'Create a minimalist logo for a tech startup called "NovaByte" using geometric shapes'
  },
  {
    label: "Social post",
    prompt: "Design an eye-catching Instagram post for a summer fashion collection"
  },
  {
    label: "Book illustration",
    prompt:
      "Create a whimsical children's book illustration of a friendly dragon in a flower garden"
  }
];

const assistantStarters = [
  {
    id: "starter-image-brief",
    actionId: "image",
    label: "Image brief",
    prompt:
      "Write a production-ready prompt for a premium product hero image with lighting, composition, and negative prompts."
  },
  {
    id: "starter-video-brief",
    actionId: "video",
    label: "Video brief",
    prompt:
      "Plan a cinematic short video prompt with scene, pacing, motion, and aspect-ratio guidance."
  },
  {
    id: "starter-design-brief",
    actionId: "design",
    label: "Design brief",
    prompt:
      "Draft a concise creative brief for a clean app landing visual with a clear visual hierarchy."
  },
  {
    id: "starter-edit-brief",
    actionId: "edit",
    label: "Edit brief",
    prompt:
      "Suggest an image edit prompt that is specific about the subject, style changes, and constraints."
  }
];

export default function AssistantPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background text-foreground" />}>
      <AssistantPageContent />
    </Suspense>
  );
}

function AssistantPageContent() {
  const [state, dispatch] = useReducer(assistantReducer, initialAssistantState);
  const [historyProjects, setHistoryProjects] = useState<AssistantHistoryItem[]>([]);
  const [historySearch, setHistorySearch] = useState("");
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const messageIdRef = useRef(0);
  const pendingPromptRef = useRef<string | null>(null);
  const pendingActionRef = useRef<string | null>(null);
  const pendingGenerationIdRef = useRef<string | null>(null);
  const { startGeneration, currentGeneration, error, reset } = useGenerationStore();
  const { providers: generationProviders } = useGenerationProviders();
  const { replace } = useRouter();
  const searchParams = useSearchParams();
  const searchParamsSnapshot = useMemo(() => new URLSearchParams(searchParams), [searchParams]);
  const providerOptions = useMemo(
    () =>
      generationProviders.filter((provider) =>
        provider.capabilities.some(
          (capability) =>
            capability in actionCapabilityMap ||
            capability === "image-generation" ||
            capability === "video-generation" ||
            capability === "audio-music" ||
            capability === "audio-sfx"
        )
      ),
    [generationProviders]
  );
  const visibleHistoryProjects = useMemo(() => {
    const query = historySearch.trim().toLowerCase();

    return historyProjects.filter((project) => {
      if (!query) {
        return true;
      }

      return [project.name, project.preview, project.meta].join(" ").toLowerCase().includes(query);
    });
  }, [historyProjects, historySearch]);
  const isProjectBusy = state.isProjectLoading || state.isProjectSaving;
  const applyAssistantStarter = (starter: { actionId: string; prompt: string }) => {
    dispatch({ type: "set-selected-action", selectedAction: starter.actionId });
    dispatch({ type: "set-input", input: starter.prompt });
    textareaRef.current?.focus();
    toast.success("Assistant starter applied.");
  };

  const resolveProviderForAction = (actionId?: string | null) => {
    const capability = actionId ? actionCapabilityMap[actionId] : "image-generation";
    const compatibleProviders = generationProviders.filter((provider) =>
      provider.capabilities.includes(capability)
    );

    if (compatibleProviders.length === 0) {
      return state.selectedProvider || "";
    }

    if (
      state.selectedProvider &&
      compatibleProviders.some((provider) => provider.name === state.selectedProvider)
    ) {
      return state.selectedProvider;
    }

    return compatibleProviders[0].name;
  };

  useEffect(() => {
    const requestedProjectId = searchParamsSnapshot.get("projectId");
    dispatch({ type: "set-project-id", projectId: requestedProjectId });

    const applySnapshot = (snapshot: Partial<AssistantSnapshot>) => {
      dispatch({
        type: "set-messages",
        messages:
          snapshot.messages?.map((message) => ({
            ...message,
            timestamp: new Date(message.timestamp)
          })) ?? []
      });
      dispatch({ type: "set-input", input: snapshot.input ?? "" });
      dispatch({ type: "set-selected-action", selectedAction: snapshot.selectedAction ?? null });
      dispatch({
        type: "set-selected-provider",
        selectedProvider: snapshot.selectedProvider ?? ""
      });
      dispatch({
        type: "set-pending-attachments",
        pendingAttachments: snapshot.pendingAttachments ?? []
      });
      dispatch({ type: "set-project-error", projectError: null });
      pendingPromptRef.current = null;
      pendingActionRef.current = null;
      pendingGenerationIdRef.current = null;
      messageIdRef.current = snapshot.messages?.length ?? 0;
    };

    const loadDraft = () => {
      const draftRaw = localStorage.getItem("assistant:draft:v1");
      if (!draftRaw) {
        return;
      }

      try {
        applySnapshot(normalizeAssistantSnapshot(JSON.parse(draftRaw)));
      } catch (loadError) {
        console.error("Failed to load assistant draft", loadError);
      }
    };

    if (!requestedProjectId) {
      loadDraft();
      return;
    }

    let cancelled = false;
    dispatch({ type: "set-project-loading", isProjectLoading: true });

    void (async () => {
      try {
        const project = await projectApi.get(requestedProjectId);
        if (cancelled) {
          return;
        }

        applySnapshot(normalizeAssistantSnapshot(project.content));
      } catch (loadError) {
        console.error("Failed to load assistant project", loadError);
        if (!cancelled) {
          dispatch({
            type: "set-project-error",
            projectError: "Loaded local draft because backend project load failed."
          });
          loadDraft();
        }
      } finally {
        if (!cancelled) {
          dispatch({ type: "set-project-loading", isProjectLoading: false });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParamsSnapshot]);

  useEffect(() => {
    let cancelled = false;

    const loadAssistantHistory = async () => {
      setIsHistoryLoading(true);
      setHistoryError(null);

      try {
        const response = await projectApi.list(1, 24);
        if (cancelled) {
          return;
        }

        const assistantHistory = response.data
          .map((project) => {
            const snapshot = normalizeAssistantSnapshot(project.content);
            const messages = snapshot.messages ?? [];
            const pendingAttachments = snapshot.pendingAttachments ?? [];
            const hasAssistantContent =
              messages.length > 0 ||
              Boolean(snapshot.input) ||
              Boolean(snapshot.selectedAction) ||
              pendingAttachments.length > 0;

            if (!hasAssistantContent && !project.name.toLowerCase().includes("assistant")) {
              return null;
            }

            const lastMessage = messages[messages.length - 1];
            const preview =
              lastMessage?.content ||
              snapshot.input ||
              (snapshot.selectedAction ? `Action: ${snapshot.selectedAction}` : "") ||
              "Saved assistant session";

            return {
              id: project.id,
              name: project.name || "AI Assistant Session",
              preview,
              updatedAt: project.updatedAt,
              meta: `${messages.length} messages`
            } satisfies AssistantHistoryItem;
          })
          .filter((item): item is AssistantHistoryItem => item !== null)
          .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

        setHistoryProjects(assistantHistory);
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load assistant history", error);
          setHistoryError("History is unavailable right now. Saved chats still work.");
        }
      } finally {
        if (!cancelled) {
          setIsHistoryLoading(false);
        }
      }
    };

    void loadAssistantHistory();

    return () => {
      cancelled = true;
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [state.messages]);

  useEffect(() => {
    if (!state.isGenerating) {
      return;
    }

    if (!currentGeneration) {
      return;
    }

    if (
      !pendingGenerationIdRef.current ||
      pendingGenerationIdRef.current !== currentGeneration.id
    ) {
      pendingGenerationIdRef.current = currentGeneration.id;
    }

    if (currentGeneration.status === "completed") {
      const prompt = pendingPromptRef.current || state.input;
      const actionKey = pendingActionRef.current;
      const actionLabel = actionKey ? actionConfig[actionKey]?.successLabel : null;
      messageIdRef.current += 1;
      dispatch({
        type: "append-message",
        message: {
          id: `msg_${messageIdRef.current}`,
          role: "assistant",
          content: prompt
            ? `I processed your ${actionLabel || "request"}: "${prompt}". Here is the generated result.`
            : `I processed your ${actionLabel || "request"} and generated a result.`,
          timestamp: new Date(),
          feedback: null,
          generatedImages: currentGeneration.resultUrl ? [currentGeneration.resultUrl] : undefined
        }
      });
      pendingPromptRef.current = null;
      pendingActionRef.current = null;
      pendingGenerationIdRef.current = null;
      dispatch({ type: "set-generating", isGenerating: false });
      dispatch({ type: "set-error", errorMessage: null });
    } else if (currentGeneration.status === "failed") {
      pendingPromptRef.current = null;
      pendingActionRef.current = null;
      pendingGenerationIdRef.current = null;
      dispatch({ type: "set-generating", isGenerating: false });
      dispatch({
        type: "set-error",
        errorMessage: currentGeneration.error || error || "Generation failed. Please try again."
      });
    }
  }, [currentGeneration, error, state.input, state.isGenerating]);

  const buildAssistantSnapshot = (messages: Message[] = state.messages): AssistantSnapshot => ({
    messages: messages.map((message) => ({
      ...message,
      timestamp: message.timestamp.toISOString()
    })),
    input: state.input,
    selectedAction: state.selectedAction,
    selectedProvider: state.selectedProvider,
    pendingAttachments: state.pendingAttachments
  });

  const persistAssistantSnapshot = async (snapshot: AssistantSnapshot) => {
    localStorage.setItem("assistant:draft:v1", JSON.stringify(snapshot));

    if (state.projectId) {
      await projectApi.update(state.projectId, {
        name: "AI Assistant Session",
        content: {
          version: 1,
          savedAt: new Date().toISOString(),
          snapshot
        } satisfies AssistantProjectPayload
      });
      return;
    }

    const created = await projectApi.create({
      name: "AI Assistant Session",
      content: {
        version: 1,
        savedAt: new Date().toISOString(),
        snapshot
      } satisfies AssistantProjectPayload
    });
    dispatch({ type: "set-project-id", projectId: created.project.id });
    replace(`${window.location.pathname}?projectId=${created.project.id}`);
  };

  const handleSaveProject = async () => {
    dispatch({ type: "set-project-saving", isProjectSaving: true });
    dispatch({ type: "set-project-error", projectError: null });

    try {
      await persistAssistantSnapshot(buildAssistantSnapshot());
      toast.success("Assistant project saved.");
    } catch (saveError) {
      console.error("Failed to save assistant project", saveError);
      dispatch({
        type: "set-project-error",
        projectError: "Saved locally, but backend project save failed."
      });
      toast.error("Assistant project saved locally, backend save failed.");
    } finally {
      dispatch({ type: "set-project-saving", isProjectSaving: false });
    }
  };

  const handleSend = async () => {
    if (!state.input.trim() && !state.selectedAction) return;
    messageIdRef.current += 1;
    const userMessageId = `msg_${messageIdRef.current}`;
    const action = state.selectedAction ? actionConfig[state.selectedAction] : null;
    const promptText = state.input.trim() || action?.prompt || "Create something new.";
    const provider = resolveProviderForAction(state.selectedAction);

    if (!provider) {
      dispatch({
        type: "set-error",
        errorMessage: "No compatible provider is available for this action."
      });
      return;
    }

    const userMsg: Message = {
      id: userMessageId,
      role: "user",
      content: promptText,
      timestamp: new Date(),
      attachments: state.pendingAttachments.length > 0 ? state.pendingAttachments : undefined
    };

    dispatch({ type: "append-message", message: userMsg });
    dispatch({ type: "set-error", errorMessage: null });
    dispatch({ type: "set-input", input: "" });
    dispatch({ type: "set-selected-action", selectedAction: null });
    dispatch({ type: "set-pending-attachments", pendingAttachments: [] });
    dispatch({ type: "set-generating", isGenerating: true });
    pendingPromptRef.current = userMsg.content;
    pendingActionRef.current = state.selectedAction;

    try {
      await startGeneration(action?.endpoint ?? "/generations/image", {
        prompt: promptText,
        provider
      });
    } catch (err) {
      console.error("Failed to start assistant generation", err);
      pendingPromptRef.current = null;
      pendingActionRef.current = null;
      pendingGenerationIdRef.current = null;
      dispatch({ type: "set-generating", isGenerating: false });
      dispatch({
        type: "set-error",
        errorMessage: "Failed to start generation. Please try again."
      });
    }
  };

  const clearConversation = (options: ClearConversationOptions = {}) => {
    const { persistProject = true, persistDraft = true, resetProjectId = false } = options;

    reset();
    const clearedSnapshot: AssistantSnapshot = {
      messages: [],
      input: "",
      selectedAction: null,
      selectedProvider: state.selectedProvider,
      pendingAttachments: []
    };

    if (persistDraft) {
      localStorage.setItem("assistant:draft:v1", JSON.stringify(clearedSnapshot));
    } else {
      localStorage.removeItem("assistant:draft:v1");
    }

    if (persistProject && state.projectId) {
      void (async () => {
        try {
          await persistAssistantSnapshot(clearedSnapshot);
        } catch (error) {
          console.error("Failed to reset assistant project", error);
        }
      })();
    }

    dispatch({ type: "reset-conversation" });
    dispatch({ type: "set-input", input: "" });
    dispatch({ type: "set-error", errorMessage: null });
    dispatch({ type: "set-selected-action", selectedAction: null });
    dispatch({ type: "set-selected-provider", selectedProvider: "" });
    dispatch({ type: "set-generating", isGenerating: false });
    dispatch({ type: "set-pending-attachments", pendingAttachments: [] });
    dispatch({ type: "set-project-error", projectError: null });
    if (resetProjectId) {
      dispatch({ type: "set-project-id", projectId: null });
    }
    pendingPromptRef.current = null;
    pendingActionRef.current = null;
    pendingGenerationIdRef.current = null;
  };

  const handleResetConversation = () => {
    clearConversation({ persistProject: true, persistDraft: true, resetProjectId: false });
  };

  const handleNewConversation = () => {
    clearConversation({ persistProject: false, persistDraft: false, resetProjectId: true });
    replace(window.location.pathname);
    queueMicrotask(() => {
      textareaRef.current?.focus();
    });
  };

  const handleAttachmentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const uploaded = await uploadFileWithToast(file, file.name);
    if (!uploaded?.url) {
      return;
    }

    dispatch({
      type: "set-pending-attachments",
      pendingAttachments: [
        ...state.pendingAttachments,
        {
          type: file.type.startsWith("video/") ? "video" : "image",
          url: uploaded.url
        }
      ]
    });
    toast.success("Attachment added.");
    event.target.value = "";
  };

  const handleDownloadImage = (url: string, filename: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.click();
  };

  const handleCopyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard.");
    } catch {
      toast.error("Failed to copy to clipboard.");
    }
  };

  const handleFeedback = async (messageId: string, kind: "up" | "down") => {
    const nextMessages = state.messages.map((message) =>
      message.id === messageId
        ? {
            ...message,
            feedback: message.feedback === kind ? null : kind
          }
        : message
    );

    dispatch({
      type: "set-message-feedback",
      messageId,
      feedback: nextMessages.find((message) => message.id === messageId)?.feedback ?? null
    });

    try {
      localStorage.setItem(
        "assistant:draft:v1",
        JSON.stringify(buildAssistantSnapshot(nextMessages))
      );
      if (state.projectId) {
        await persistAssistantSnapshot(buildAssistantSnapshot(nextMessages));
      }
      toast.success(kind === "up" ? "Feedback saved." : "Thanks for the feedback.");
    } catch (error) {
      console.error("Failed to save assistant feedback", error);
      toast.error("Feedback could not be saved right now.");
    }
  };

  const handleReuseMessage = (text: string) => {
    dispatch({ type: "set-input", input: text });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isEmpty = state.messages.length === 0;
  const canSend = Boolean((state.input.trim() || state.selectedAction) && !state.isGenerating);
  const historyCount = historyProjects.length;

  const renderComposer = (compact: boolean) => (
    <div
      className={cn(
        "rounded-[28px] border border-border/70 bg-card/80 shadow-[0_20px_60px_rgba(0,0,0,0.20)] backdrop-blur-xl transition-all focus-within:border-ring focus-within:ring-1 focus-within:ring-ring",
        compact ? "p-3 sm:p-4" : "p-4 sm:p-5"
      )}
    >
      <textarea
        ref={textareaRef}
        value={state.input}
        onChange={(e) => dispatch({ type: "set-input", input: e.target.value })}
        onKeyDown={handleKeyDown}
        placeholder={
          compact
            ? "Ask for a brief, edit, or prompt..."
            : "Describe the deliverable, style, and constraints"
        }
        className={cn(
          "w-full resize-none border-none bg-transparent outline-none placeholder:text-muted-foreground/50",
          compact
            ? "min-h-[90px] text-sm sm:min-h-[110px] sm:text-base"
            : "min-h-[100px] text-base sm:min-h-[140px] sm:text-lg"
        )}
      />
      <div className="mt-4 flex flex-col gap-3 border-t border-border/70 pt-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-2 px-3 text-muted-foreground hover:text-foreground"
            onClick={() => attachmentInputRef.current?.click()}
          >
            <Paperclip className="size-4" />
            Attach
          </Button>
          <TemplateExplorerModal
            defaultCategory={TemplateTypeEnum.AI_ASSISTANT}
            title="Assistant templates"
            description="Browse concise assistant starters and reuse a prompt in one click."
            onSelectTemplate={(template) => {
              dispatch({ type: "set-input", input: template.title });
              textareaRef.current?.focus();
              toast.success(`Applied ${template.title}`);
            }}
          >
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-2 px-3 text-muted-foreground hover:text-foreground"
            >
              <ImageIcon className="size-4" />
              Templates
            </Button>
          </TemplateExplorerModal>
          <Select
            value={state.selectedProvider || "__default__"}
            onValueChange={(value) =>
              dispatch({
                type: "set-selected-provider",
                selectedProvider: value === "__default__" ? "" : value
              })
            }
          >
            <SelectTrigger className="h-9 min-w-44 rounded-full border border-border/80 bg-background/70 px-3 text-xs text-muted-foreground outline-none">
              <SelectValue placeholder="Use backend default" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__default__">Use backend default</SelectItem>
              {providerOptions.length > 0 &&
                providerOptions.map((provider) => (
                  <SelectItem key={provider.name} value={provider.name}>
                    {provider.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          size="icon"
          className="size-11 rounded-full"
          onClick={handleSend}
          disabled={
            !canSend || state.isGenerating || !resolveProviderForAction(state.selectedAction)
          }
        >
          <Send className="size-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <CreatorWorkspaceShell
      variant="stack"
      className="bg-[radial-gradient(circle_at_top,_rgba(47,102,255,0.10),_transparent_42%)]"
    >
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside
          className={cn(
            "hidden min-h-0 overflow-hidden border-r border-border/70 bg-card/95 transition-[width] duration-300 ease-out lg:block"
          )}
          style={{ width: isHistoryOpen ? 330 : 0 }}
        >
          <div
            className={cn(
              "flex h-full min-h-0 min-w-[330px] flex-col transition-all duration-300 ease-out",
              isHistoryOpen ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0"
            )}
          >
            {isHistoryOpen ? (
              <>
                <div className="border-b border-border/70 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Saved chats</p>
                      <p className="mt-1 text-sm text-foreground">Assistant history</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 rounded-full"
                        onClick={() => setIsHistoryOpen(false)}
                        aria-label="Collapse history"
                      >
                        <ChevronLeft className="size-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8 gap-2 rounded-full px-3"
                        onClick={handleNewConversation}
                      >
                        <Plus className="size-4" />
                        New chat
                      </Button>
                    </div>
                  </div>
                  <div className="relative mt-4">
                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={historySearch}
                      onChange={(event) => setHistorySearch(event.target.value)}
                      placeholder="Search chats"
                      className="h-11 w-full rounded-2xl border border-border/70 bg-background/70 pr-4 pl-10 text-sm ring-0 outline-none placeholder:text-muted-foreground/60 focus:border-border focus:bg-background"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-4">
                  {isHistoryLoading ? (
                    <div className="rounded-[24px] border border-border/70 bg-background/70 p-4 text-sm text-muted-foreground">
                      Loading assistant history...
                    </div>
                  ) : visibleHistoryProjects.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center rounded-[24px] border border-dashed border-border/70 bg-background/60 px-4 py-8 text-center">
                      <Clock3 className="size-8 text-muted-foreground/80" />
                      <p className="mt-3 text-sm font-medium text-foreground">No chats found</p>
                      <p className="mt-2 max-w-[220px] text-xs leading-6 text-muted-foreground">
                        Start a new assistant session and it will appear here after you save it.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {visibleHistoryProjects.map((project) => {
                        const isActive = project.id === state.projectId;
                        return (
                          <button
                            key={project.id}
                            type="button"
                            onClick={() => {
                              dispatch({ type: "set-project-id", projectId: project.id });
                              replace(`${window.location.pathname}?projectId=${project.id}`);
                            }}
                            className={cn(
                              "w-full rounded-[22px] border p-4 text-left transition-all",
                              isActive
                                ? "border-primary/35 bg-primary/10"
                                : "border-border/70 bg-background/70 hover:border-border hover:bg-accent/40"
                            )}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-foreground">
                                  {project.name}
                                </p>
                                <p className="mt-1 line-clamp-2 text-xs leading-6 text-muted-foreground">
                                  {project.preview}
                                </p>
                              </div>
                              <span className="shrink-0 rounded-full border border-border/70 bg-background/70 px-2 py-1 text-xs font-medium text-muted-foreground">
                                {project.meta}
                              </span>
                            </div>
                            <p className="mt-3 text-xs font-medium text-muted-foreground/80">
                              {new Date(project.updatedAt).toLocaleDateString([], {
                                month: "short",
                                day: "numeric"
                              })}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {(historyError || state.projectError) && (
                    <div className="mt-4 rounded-[20px] border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-200">
                      {historyError || state.projectError}
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </aside>

        <main className="flex min-h-0 min-w-0 flex-1 flex-col">
          <header className="border-b border-border/70 bg-background/75 px-4 py-3 backdrop-blur-xl sm:px-5 sm:py-4 lg:px-6">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-2 rounded-full border border-border/70 bg-background/70 px-3 text-[12px] text-muted-foreground hover:text-foreground"
                  onClick={() => setIsHistoryOpen((value) => !value)}
                >
                  <MessageSquareMore className="size-4" />
                  History
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    {historyCount}
                  </span>
                </Button>
                <div className="flex size-10 items-center justify-center rounded-2xl border border-border/70 bg-background/70">
                  <MessageSquareMore className="size-4 text-primary" />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 rounded-full"
                  onClick={handleResetConversation}
                  disabled={state.messages.length === 0 && !state.input && !state.selectedAction}
                >
                  <RefreshCcw className="size-4" />
                  Reset
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 rounded-full"
                  onClick={handleSaveProject}
                  disabled={isProjectBusy}
                >
                  <Folder className="size-4" />
                  {state.isProjectSaving ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          </header>

          {isEmpty ? (
            <div className="flex min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-6 lg:px-8">
              <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-6">
                <div className="w-full max-w-3xl space-y-4 pt-4 text-center sm:pt-10">
                  <div className="mx-auto flex size-16 items-center justify-center rounded-[28px] border border-primary/20 bg-primary/10">
                    <Sparkles className="size-8 text-primary" />
                  </div>
                  <div className="space-y-3">
                    <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                      Good afternoon,
                      <br />
                      What do you want to create?
                    </h2>
                    <p className="mx-auto max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                      I can generate images, videos, music, or just help you shape the prompt. Start
                      with a brief and use the quick actions below.
                    </p>
                  </div>
                  {state.errorMessage && (
                    <div className="mx-auto max-w-2xl rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-left text-sm text-destructive">
                      {state.errorMessage}
                    </div>
                  )}
                </div>

                <div className="w-full max-w-4xl space-y-5">
                  {renderComposer(false)}
                  <div className="flex items-center justify-center">
                    <TemplateExplorerModal
                      defaultCategory={TemplateTypeEnum.AI_ASSISTANT}
                      title="Assistant templates"
                      description="Browse concise assistant starters and reuse a prompt in one click."
                      onSelectTemplate={(template) => {
                        dispatch({ type: "set-input", input: template.title });
                        textareaRef.current?.focus();
                        toast.success(`Applied ${template.title}`);
                      }}
                    >
                      <Button
                        variant="ghost"
                        className="rounded-full border border-border/70 bg-background/70 text-muted-foreground hover:text-foreground"
                      >
                        Open templates
                      </Button>
                    </TemplateExplorerModal>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-6 lg:px-8">
                <div className="mx-auto flex w-full max-w-4xl flex-col space-y-5">
                  {state.projectError && (
                    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-200">
                      {state.projectError}
                    </div>
                  )}

                  {state.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "")}
                    >
                      {msg.role === "assistant" && (
                        <div className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10">
                          <Bot className="size-4 text-primary" />
                        </div>
                      )}
                      <div
                        className={cn(
                          "max-w-[82%] space-y-3",
                          msg.role === "user" ? "items-end" : ""
                        )}
                      >
                        <div
                          className={cn(
                            "rounded-[22px] px-4 py-3 text-sm leading-relaxed",
                            msg.role === "user"
                              ? "rounded-tr-md bg-primary text-primary-foreground"
                              : "rounded-tl-md border border-border bg-card/90"
                          )}
                        >
                          {msg.content}
                        </div>
                        {msg.generatedImages && msg.generatedImages.length > 0 && (
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            {msg.generatedImages.map((url: string, i: number) => (
                              <div
                                key={url}
                                className="group relative aspect-square overflow-hidden rounded-2xl border border-border"
                              >
                                <Image
                                  src={url}
                                  alt={`Generated ${i + 1}`}
                                  fill
                                  className="object-cover"
                                  sizes="(max-width: 768px) 100vw, 50vw"
                                />
                                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                                  <Button
                                    size="icon"
                                    variant="secondary"
                                    className="size-8"
                                    onClick={() =>
                                      handleDownloadImage(
                                        url,
                                        `assistant-image-${msg.id}-${i + 1}.png`
                                      )
                                    }
                                  >
                                    <Download className="size-4" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="secondary"
                                    className="size-8"
                                    onClick={() => handleCopyText(url)}
                                  >
                                    <Copy className="size-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        {msg.role === "assistant" && (
                          <div className="flex items-center gap-1 pt-1">
                            <Button
                              variant={msg.feedback === "up" ? "secondary" : "ghost"}
                              size="icon"
                              className={cn(
                                "size-7",
                                msg.feedback === "up" ? "text-foreground" : "text-muted-foreground"
                              )}
                              onClick={() => handleFeedback(msg.id, "up")}
                            >
                              <ThumbsUp className="size-3.5" />
                            </Button>
                            <Button
                              variant={msg.feedback === "down" ? "secondary" : "ghost"}
                              size="icon"
                              className={cn(
                                "size-7",
                                msg.feedback === "down"
                                  ? "text-foreground"
                                  : "text-muted-foreground"
                              )}
                              onClick={() => handleFeedback(msg.id, "down")}
                            >
                              <ThumbsDown className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 text-muted-foreground"
                              onClick={() => handleCopyText(msg.content)}
                            >
                              <Copy className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 text-muted-foreground"
                              onClick={() => handleReuseMessage(msg.content)}
                            >
                              <RefreshCcw className="size-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>
                      {msg.role === "user" && (
                        <div className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
                          <User className="size-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  ))}

                  {state.isGenerating && (
                    <div className="flex gap-3">
                      <div className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10">
                        <Bot className="size-4 text-primary" />
                      </div>
                      <div className="rounded-[22px] rounded-tl-md border border-border bg-card/90 px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Loader2 className="size-4 animate-spin text-primary" />
                          <span className="text-sm text-muted-foreground">Creating...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              <div className="border-t border-border/70 bg-background/80 px-5 py-4 backdrop-blur-xl sm:px-6 lg:px-8">
                <div className="mx-auto w-full max-w-4xl">{renderComposer(true)}</div>
              </div>
            </div>
          )}

          <input
            ref={attachmentInputRef}
            type="file"
            className="hidden"
            accept="image/*,video/*"
            onChange={handleAttachmentUpload}
          />
        </main>
      </div>
    </CreatorWorkspaceShell>
  );
}
