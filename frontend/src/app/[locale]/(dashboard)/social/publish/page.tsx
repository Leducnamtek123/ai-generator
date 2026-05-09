"use client";

import React from "react";

import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { socialHubApi, type SocialChannel } from "@/services/socialHubApi";

import type { PublishAction, PublishState } from "./publish.types";
import { PublishPageView } from "./view";

const PUBLISH_DRAFT_STORAGE_KEY = "social-hub-publish-draft";

const loadPublishDraft = (): Pick<PublishState, "selectedAccountIds" | "previewPlatform" | "content" | "isScheduling" | "scheduledAt"> | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(PUBLISH_DRAFT_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<Pick<PublishState, "selectedAccountIds" | "previewPlatform" | "content" | "isScheduling" | "scheduledAt">>;
    return {
      selectedAccountIds: Array.isArray(parsed.selectedAccountIds)
        ? parsed.selectedAccountIds.filter((value): value is number => typeof value === "number")
        : [],
      previewPlatform: typeof parsed.previewPlatform === "string" ? parsed.previewPlatform : "facebook",
      content: typeof parsed.content === "string" ? parsed.content : "",
      isScheduling: Boolean(parsed.isScheduling),
      scheduledAt: typeof parsed.scheduledAt === "string" ? parsed.scheduledAt : "",
    };
  } catch {
    return null;
  }
};

export default function PublishPage() {
  const scheduleAnchorRef = React.useRef(new Date());
  const [isClearDraftDialogOpen, setIsClearDraftDialogOpen] = React.useState(false);
  const initialDraft = loadPublishDraft();
  const [state, dispatch] = React.useReducer(
    (current: PublishState, action: PublishAction): PublishState => {
      switch (action.type) {
        case "channelsLoaded":
          return {
            ...current,
            accounts: action.accounts,
            isLoadingAccounts: false,
            selectedAccountIds: current.selectedAccountIds.length > 0
              ? current.selectedAccountIds.filter((id) => action.accounts.some((account) => account.id === id))
              : action.accounts.length > 0
                ? [action.accounts[0].id]
                : [],
            previewPlatform: current.previewPlatform || action.accounts[0]?.platform || "facebook"
          };
        case "channelsFailed":
          return { ...current, isLoadingAccounts: false };
        case "toggleAccount":
          return {
            ...current,
            selectedAccountIds: current.selectedAccountIds.includes(action.accountId)
              ? current.selectedAccountIds.filter((id) => id !== action.accountId)
              : [...current.selectedAccountIds, action.accountId]
          };
        case "setPreviewPlatform":
          return { ...current, previewPlatform: action.platform };
        case "setContent":
          return { ...current, content: action.content };
        case "toggleScheduling":
          return {
            ...current,
            isScheduling: !current.isScheduling,
            scheduledAt: current.isScheduling ? "" : action.anchor.toISOString().slice(0, 16)
          };
        case "setScheduledAt":
          return { ...current, scheduledAt: action.scheduledAt };
        case "openAiModal":
          return { ...current, isAiModalOpen: true };
        case "closeAiModal":
          return { ...current, isAiModalOpen: false };
        case "setPublishing":
          return { ...current, isPublishing: action.isPublishing };
        default:
          return current;
      }
    },
    {
      accounts: [],
      isLoadingAccounts: true,
      selectedAccountIds: initialDraft?.selectedAccountIds ?? [],
      previewPlatform: initialDraft?.previewPlatform ?? "facebook",
      content: initialDraft?.content ?? "",
      isScheduling: initialDraft?.isScheduling ?? false,
      scheduledAt: initialDraft?.scheduledAt ?? "",
      isAiModalOpen: false,
      isPublishing: false
    }
  );

  React.useEffect(() => {
    const fetchChannels = async () => {
      try {
        const data = await socialHubApi.getChannels();
        dispatch({ type: "channelsLoaded", accounts: data });
      } catch (error) {
        console.error("Failed to load social channels", error);
        toast.error("Failed to load connected channels.");
        dispatch({ type: "channelsFailed" });
      }
    };
    void fetchChannels();
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const hasMeaningfulDraft =
      state.content.trim().length > 0 ||
      state.isScheduling ||
      state.scheduledAt.trim().length > 0;

    if (!hasMeaningfulDraft) {
      window.localStorage.removeItem(PUBLISH_DRAFT_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(
      PUBLISH_DRAFT_STORAGE_KEY,
      JSON.stringify({
        selectedAccountIds: state.selectedAccountIds,
        previewPlatform: state.previewPlatform,
        content: state.content,
        isScheduling: state.isScheduling,
        scheduledAt: state.scheduledAt,
      }),
    );
  }, [state.content, state.isScheduling, state.previewPlatform, state.scheduledAt, state.selectedAccountIds]);

  const selectedAccounts = state.accounts.filter((account) =>
    state.selectedAccountIds.includes(account.id)
  );

  const appendSnippet = React.useCallback(
    (snippet: string) => {
      dispatch({
        type: "setContent",
        content: state.content
          ? `${state.content}${state.content.endsWith("\n") ? "" : "\n"}${snippet}`
          : snippet
      });
    },
    [state.content]
  );

  const toggleAccount = (account: SocialChannel) => {
    dispatch({ type: "toggleAccount", accountId: account.id });
  };

  const handlePublish = async () => {
    if (!state.content) {
      toast.error("Please enter some content first!");
      return;
    }
    if (state.selectedAccountIds.length === 0) {
      toast.error("Select at least one connected channel.");
      return;
    }
    if (state.isScheduling && !state.scheduledAt) {
      toast.error("Please select a date and time for scheduling.");
      return;
    }

    dispatch({ type: "setPublishing", isPublishing: true });
    toast.promise(
      socialHubApi.createPost({
        content: state.content,
        scheduledAt: state.isScheduling ? new Date(state.scheduledAt).toISOString() : null,
        socialAccountIds: state.selectedAccountIds
      }),
      {
        loading: state.isScheduling ? "Scheduling posts..." : "Publishing to selected channels...",
        success: () => {
          dispatch({ type: "setPublishing", isPublishing: false });
          dispatch({ type: "setContent", content: "" });
          if (state.isScheduling) {
            dispatch({ type: "setScheduledAt", scheduledAt: "" });
          }
          return `Successfully processed for ${state.selectedAccountIds.length} channels!`;
        },
        error: (err) => {
          dispatch({ type: "setPublishing", isPublishing: false });
          return `Failed to publish: ${err.message || "Unknown error"}`;
        }
      }
    );
  };

  const handleSaveDraft = async () => {
    if (!state.content.trim()) {
      toast.error("Please enter some content first!");
      return;
    }

    toast.promise(
      socialHubApi.saveDraft({
        content: state.content,
        scheduledAt: state.isScheduling && state.scheduledAt ? new Date(state.scheduledAt).toISOString() : null,
        socialAccountIds: state.selectedAccountIds,
      }),
      {
        loading: "Saving draft...",
        success: () => "Draft saved to the workspace",
        error: "Failed to save draft",
      },
    );
  };

  const handleClearDraftConfirm = () => {
    dispatch({ type: "setContent", content: "" });
    dispatch({ type: "setScheduledAt", scheduledAt: "" });
    window.localStorage.removeItem(PUBLISH_DRAFT_STORAGE_KEY);
    setIsClearDraftDialogOpen(false);
  };

  return (
    <>
      <PublishPageView
        state={state}
        selectedAccounts={selectedAccounts}
        onToggleAccount={toggleAccount}
        onToggleScheduling={() => {
          dispatch({
            type: "toggleScheduling",
            anchor: scheduleAnchorRef.current
          });
        }}
        onPublish={handlePublish}
        onSaveDraft={handleSaveDraft}
        onOpenAiModal={() => dispatch({ type: "openAiModal" })}
        onCloseAiModal={() => dispatch({ type: "closeAiModal" })}
        onSetContent={(content) => dispatch({ type: "setContent", content })}
        onSetScheduledAt={(scheduledAt) => dispatch({ type: "setScheduledAt", scheduledAt })}
        onSetPreviewPlatform={(platform) => dispatch({ type: "setPreviewPlatform", platform })}
        onClearDraft={() => {
          if (state.content) {
            setIsClearDraftDialogOpen(true);
          }
        }}
        onInsertSnippet={appendSnippet}
      />

      <ConfirmDialog
        open={isClearDraftDialogOpen}
        onOpenChange={setIsClearDraftDialogOpen}
        title="Clear draft?"
        description="This will remove the current draft content."
        confirmText="Clear Draft"
        onConfirm={handleClearDraftConfirm}
      />
    </>
  );
}
