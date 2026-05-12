"use client";

import React from "react";
import Link from "next/link";

import { CalendarClock, ChevronLeft, ChevronRight, Filter, Plus, Trash2, X } from "lucide-react";
import { m } from 'framer-motion';
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import { SocialDateTimePicker } from "@/components/social-hub/social-date-time-picker";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  socialHubApi,
  type SocialChannel,
  type SocialPost,
  type SocialPostStatus
} from "@/services/socialHubApi";
import { SocialCalendarSkeleton } from "@/components/common/loading-skeletons";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];

type StatusFilter = "all" | SocialPostStatus;

type CalendarState = {
  view: "month" | "week" | "day";
  currentDate: Date;
  baseNow: Date;
  posts: SocialPost[];
  channels: SocialChannel[];
  statusFilter: StatusFilter;
  isLoading: boolean;
  isComposerOpen: boolean;
  content: string;
  selectedAccountId: number | null;
  scheduledAt: string;
  isSaving: boolean;
};

type ComposerDraft = {
  version: number;
  savedAt: string;
  form: Pick<CalendarState, "content" | "selectedAccountId" | "scheduledAt" | "isComposerOpen">;
};

const COMPOSER_DRAFT_KEY = "social-calendar:composer:draft";

type CalendarAction =
  | { type: "setView"; view: "month" | "week" | "day" }
  | { type: "setCurrentDate"; currentDate: Date }
  | { type: "setPosts"; posts: SocialPost[] }
  | { type: "setChannels"; channels: SocialChannel[] }
  | { type: "setStatusFilter"; statusFilter: StatusFilter }
  | { type: "setLoading"; isLoading: boolean }
  | { type: "setComposerOpen"; isComposerOpen: boolean }
  | { type: "setContent"; content: string }
  | { type: "setSelectedAccountId"; selectedAccountId: number | null }
  | { type: "setScheduledAt"; scheduledAt: string }
  | { type: "setSaving"; isSaving: boolean }
  | { type: "resetComposer" };

const initialState: CalendarState = {
  view: "month",
  currentDate: new Date(),
  baseNow: new Date(),
  posts: [],
  channels: [],
  statusFilter: "all",
  isLoading: true,
  isComposerOpen: false,
  content: "",
  selectedAccountId: null,
  scheduledAt: "",
  isSaving: false
};

function reducer(state: CalendarState, action: CalendarAction): CalendarState {
  switch (action.type) {
    case "setView":
      return { ...state, view: action.view };
    case "setCurrentDate":
      return { ...state, currentDate: action.currentDate };
    case "setPosts":
      return { ...state, posts: action.posts };
    case "setChannels":
      return { ...state, channels: action.channels };
    case "setStatusFilter":
      return { ...state, statusFilter: action.statusFilter };
    case "setLoading":
      return { ...state, isLoading: action.isLoading };
    case "setComposerOpen":
      return { ...state, isComposerOpen: action.isComposerOpen };
    case "setContent":
      return { ...state, content: action.content };
    case "setSelectedAccountId":
      return { ...state, selectedAccountId: action.selectedAccountId };
    case "setScheduledAt":
      return { ...state, scheduledAt: action.scheduledAt };
    case "setSaving":
      return { ...state, isSaving: action.isSaving };
    case "resetComposer":
      return { ...state, isComposerOpen: false, content: "", scheduledAt: "" };
    default:
      return state;
  }
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getMondayBasedOffset(date: Date) {
  const day = date.getDay();
  return (day + 6) % 7;
}

function startOfWeek(date: Date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  value.setDate(value.getDate() - getMondayBasedOffset(value));
  return value;
}

function toDayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatRangeLabel(start: Date, end: Date) {
  const startMonth = MONTHS[start.getMonth()].slice(0, 3);
  const endMonth = MONTHS[end.getMonth()].slice(0, 3);
  if (start.getMonth() === end.getMonth()) {
    return `${startMonth} ${start.getDate()} - ${end.getDate()}`;
  }
  return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}`;
}

function toDatetimeLocal(date: Date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

type CalendarTextKind = "time" | "monthDayTime" | "selectedDay";

function formatCalendarText(value: string | Date, kind: CalendarTextKind) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  switch (kind) {
    case "time":
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      });
    case "monthDayTime":
      return date.toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit"
      });
    case "selectedDay":
      return date.toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric"
      });
  }
}

function ClientCalendarText({
  value,
  kind,
  fallback = ""
}: {
  value: string | Date;
  kind: CalendarTextKind;
  fallback?: string;
}) {
  const subscribe = React.useCallback(() => () => {}, []);
  const getSnapshot = React.useCallback(() => formatCalendarText(value, kind) || fallback, [
    fallback,
    kind,
    value
  ]);

  const text = React.useSyncExternalStore(subscribe, getSnapshot, () => fallback);
  return <span suppressHydrationWarning>{text}</span>;
}

export default function CalendarPage() {
  const [state, dispatch] = React.useReducer(reducer, initialState);
  const draftReadyRef = React.useRef(false);

  const monthName = MONTHS[state.currentDate.getMonth()];
  const year = state.currentDate.getFullYear();
  const weekStart = React.useMemo(() => startOfWeek(state.currentDate), [state.currentDate]);
  const weekDays = React.useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const value = new Date(weekStart);
        value.setDate(weekStart.getDate() + i);
        return value;
      }),
    [weekStart]
  );
  const selectedDayKey = toDayKey(state.currentDate);
  const todayKey = React.useSyncExternalStore(
    React.useCallback(() => () => {}, []),
    React.useCallback(() => toDayKey(new Date()), []),
    () => ""
  );

  const fetchData = React.useCallback(async () => {
    try {
      const [postData, channelData] = await Promise.all([
        socialHubApi.getPosts(),
        socialHubApi.getChannels()
      ]);
      dispatch({ type: "setPosts", posts: postData });
      dispatch({ type: "setChannels", channels: channelData });
      if (!state.selectedAccountId && channelData.length > 0) {
        dispatch({ type: "setSelectedAccountId", selectedAccountId: channelData[0].id });
      }
    } catch (error) {
      console.error("Failed to fetch social calendar data", error);
      toast.error("Failed to load social calendar data.");
    }
    dispatch({ type: "setLoading", isLoading: false });
  }, [state.selectedAccountId]);

  React.useEffect(() => {
    queueMicrotask(() => {
      void fetchData();
    });
  }, [fetchData]);

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(COMPOSER_DRAFT_KEY);
        if (!raw) {
        draftReadyRef.current = true;
        return;
      }

      const parsed = JSON.parse(raw) as Partial<ComposerDraft>;
      const restored = parsed.form;
      if (restored) {
        if (typeof restored.content === "string") {
          dispatch({ type: "setContent", content: restored.content });
        }
        if (typeof restored.selectedAccountId === "number") {
          dispatch({ type: "setSelectedAccountId", selectedAccountId: restored.selectedAccountId });
        }
        if (typeof restored.scheduledAt === "string") {
          dispatch({ type: "setScheduledAt", scheduledAt: restored.scheduledAt });
        }
        dispatch({
          type: "setComposerOpen",
          isComposerOpen: Boolean(restored.isComposerOpen),
        });
      }
    } catch (error) {
      console.error("Failed to restore calendar composer draft", error);
    } finally {
      draftReadyRef.current = true;
    }
  }, []);

  React.useEffect(() => {
    if (!draftReadyRef.current) {
      return;
    }

    const draft: ComposerDraft = {
      version: 1,
      savedAt: new Date().toISOString(),
      form: {
        content: state.content,
        selectedAccountId: state.selectedAccountId,
        scheduledAt: state.scheduledAt,
        isComposerOpen: state.isComposerOpen,
      },
    };
    window.localStorage.setItem(COMPOSER_DRAFT_KEY, JSON.stringify(draft));
  }, [state.content, state.isComposerOpen, state.scheduledAt, state.selectedAccountId]);

  const base = startOfMonth(state.currentDate);
  const offset = getMondayBasedOffset(base);
  const firstCell = new Date(base);
  firstCell.setDate(firstCell.getDate() - offset);
  const gridDays = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(firstCell);
    d.setDate(firstCell.getDate() + i);
    return d;
  });

  const filteredPosts = state.posts.filter((post) =>
    state.statusFilter === "all" ? true : post.status === state.statusFilter
  );

  const postsByDay = React.useMemo(() => {
    const map = new Map<string, SocialPost[]>();
    for (const post of filteredPosts) {
      const sourceDate = post.scheduledAt || post.createdAt;
      if (!sourceDate) continue;
      const date = new Date(sourceDate);
      if (Number.isNaN(date.getTime())) continue;
      const key = date.toISOString().slice(0, 10);
      const bucket = map.get(key) ?? [];
      bucket.push(post);
      map.set(key, bucket);
    }
    return map;
  }, [filteredPosts]);
  const currentDayPosts = React.useMemo(() => {
    const key = selectedDayKey;
    return postsByDay.get(key) ?? [];
  }, [postsByDay, selectedDayKey]);
  const scheduledPosts = state.posts.filter((post) => post.status === "scheduled");
  const publishedPosts = state.posts.filter((post) => post.status === "published");
  const draftPosts = state.posts.filter((post) => post.status === "draft");
  const failedPosts = state.posts.filter((post) => post.status === "failed");
  let nextScheduledPost: (typeof scheduledPosts)[number] | null = null;
  let nextScheduledTime = Number.POSITIVE_INFINITY;
  for (const post of scheduledPosts) {
    if (!post.scheduledAt) {
      continue;
    }

    const scheduledTime = new Date(post.scheduledAt as string).getTime();
    if (!Number.isNaN(scheduledTime) && scheduledTime >= Date.now() && scheduledTime < nextScheduledTime) {
      nextScheduledPost = post;
      nextScheduledTime = scheduledTime;
    }
  }
  const activeChannels = state.channels.length;

  const visibleMonthLabel =
    state.view === "month"
      ? `${monthName} ${year}`
      : state.view === "week"
        ? formatRangeLabel(weekDays[0], weekDays[6])
        : `${MONTHS[state.currentDate.getMonth()]} ${state.currentDate.getDate()}, ${year}`;

  const openComposer = (seedDate?: Date) => {
    const targetDate = seedDate ?? new Date(state.baseNow.getTime() + 60 * 60 * 1000);
    if (!state.scheduledAt) {
      dispatch({ type: "setScheduledAt", scheduledAt: toDatetimeLocal(targetDate) });
    }
    dispatch({ type: "setComposerOpen", isComposerOpen: true });
  };

  const handleCreatePost = async () => {
    if (!state.content.trim()) {
      toast.error("Please enter post content.");
      return;
    }
    if (!state.selectedAccountId) {
      toast.error("Please select a connected channel.");
      return;
    }
    dispatch({ type: "setSaving", isSaving: true });
    try {
      await socialHubApi.createPost({
        content: state.content.trim(),
        scheduledAt: state.scheduledAt ? new Date(state.scheduledAt).toISOString() : null,
        socialAccountId: state.selectedAccountId
      });
      toast.success("Post created successfully.");
      window.localStorage.removeItem(COMPOSER_DRAFT_KEY);
      dispatch({ type: "resetComposer" });
      await fetchData();
    } catch (error) {
      console.error("Failed to create post", error);
      toast.error("Failed to create post.");
    }
    dispatch({ type: "setSaving", isSaving: false });
  };

  const handleDeletePost = async (postId: number) => {
    toast.promise(socialHubApi.deletePost(postId), {
      loading: "Deleting post...",
      success: async () => {
        await fetchData();
        return "Post deleted.";
      },
      error: "Failed to delete post."
    });
  };

  const handleReschedulePost = async (postId: number, sourceDate: string) => {
    const date = new Date(sourceDate);
    date.setHours(date.getHours() + 1);
    try {
      await socialHubApi.reschedulePost(postId, date.toISOString());
      toast.success("Post rescheduled +1 hour.");
      await fetchData();
    } catch (error) {
      console.error("Failed to reschedule post", error);
      toast.error("Failed to reschedule post.");
    }
  };

  const moveRange = (direction: -1 | 1) => {
    if (state.view === "month") {
      dispatch({
        type: "setCurrentDate",
        currentDate: new Date(
          state.currentDate.getFullYear(),
          state.currentDate.getMonth() + direction,
          1
        )
      });
      return;
    }

    if (state.view === "week") {
      const next = new Date(state.currentDate);
      next.setDate(next.getDate() + direction * 7);
      dispatch({ type: "setCurrentDate", currentDate: next });
      return;
    }

    const next = new Date(state.currentDate);
    next.setDate(next.getDate() + direction);
    dispatch({ type: "setCurrentDate", currentDate: next });
  };

  const handleTodayClick = () => {
    dispatch({ type: "setCurrentDate", currentDate: new Date() });
  };

  if (state.isLoading && state.posts.length === 0) {
    return <SocialCalendarSkeleton />;
  }

  return (
    <div className="mx-auto flex min-h-full max-w-7xl flex-col gap-y-8 p-8 pb-8">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold tracking-tight">Calendar</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-border bg-muted p-1">
            {(["month", "week", "day"] as const).map((v) => (
              <button
                key={v}
                onClick={() => dispatch({ type: "setView", view: v })}
                className={cn(
                  "rounded-md px-4 py-1.5 text-xs font-medium capitalize transition-all",
                  state.view === v
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {v}
              </button>
            ))}
          </div>
          <Button onClick={() => openComposer()}>
            <Plus className="mr-2 size-4" />
            New Post
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <GlassCard variant="morphism" className="border border-border/60 p-5">
          <p className="text-sm font-medium text-muted-foreground">Connected</p>
          <div className="mt-3 text-3xl font-bold">{activeChannels}</div>
          <p className="mt-1 text-sm text-muted-foreground">Channels available to schedule</p>
        </GlassCard>
        <GlassCard variant="morphism" className="border border-border/60 p-5">
          <p className="text-sm font-medium text-muted-foreground">Scheduled</p>
          <div className="mt-3 text-3xl font-bold">{scheduledPosts.length}</div>
          <p className="mt-1 text-sm text-muted-foreground">Queued for delivery</p>
        </GlassCard>
        <GlassCard variant="morphism" className="border border-border/60 p-5">
          <p className="text-sm font-medium text-muted-foreground">Published</p>
          <div className="mt-3 text-3xl font-bold">{publishedPosts.length}</div>
          <p className="mt-1 text-sm text-muted-foreground">Visible in post history</p>
        </GlassCard>
        <GlassCard variant="morphism" className="border border-border/60 p-5">
          <p className="text-sm font-medium text-muted-foreground">Drafts</p>
          <div className="mt-3 text-3xl font-bold">{draftPosts.length}</div>
          <p className="mt-1 text-sm text-muted-foreground">Needs review or copy work</p>
        </GlassCard>
        <GlassCard variant="morphism" className="border border-border/60 p-5">
          <p className="text-sm font-medium text-muted-foreground">Failed</p>
          <div className="mt-3 text-3xl font-bold">{failedPosts.length}</div>
          <p className="mt-1 text-sm text-muted-foreground">Needs action before publish</p>
        </GlassCard>
      </div>

      <GlassCard
        variant="morphism"
        className="flex min-h-0 flex-1 flex-col overflow-y-auto border border-border/60 p-0"
      >
        <div className="flex items-center justify-between border-b border-border/60 bg-muted/50 p-6">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold">{visibleMonthLabel}</h2>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="size-8" onClick={() => moveRange(-1)}>
                <ChevronLeft className="size-4" />
              </Button>
              <Button variant="ghost" size="icon" className="size-8" onClick={() => moveRange(1)}>
                <ChevronRight className="size-4" />
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={handleTodayClick}
            >
              Today
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-muted-foreground"
              onClick={() => {
                const sequence: StatusFilter[] = [
                  "all",
                  "scheduled",
                  "draft",
                  "published",
                  "failed"
                ];
                const currentIndex = sequence.indexOf(state.statusFilter);
                const next = sequence[(currentIndex + 1) % sequence.length];
                dispatch({ type: "setStatusFilter", statusFilter: next });
              }}
            >
              <Filter className="mr-2 size-3.5" />
              {state.statusFilter === "all" ? "All statuses" : state.statusFilter}
            </Button>
          </div>
        </div>

        {state.view === "month" ? (
          <div className="grid flex-1 border-collapse grid-cols-7">
            {DAYS.map((day) => (
              <div
                key={day}
                className="border-r border-b border-border/40 bg-muted/50 p-3 text-center text-sm font-medium text-muted-foreground"
              >
                {day}
              </div>
            ))}

            {gridDays.map((day) => {
              const key = toDayKey(day);
              const dayPosts = postsByDay.get(key) ?? [];
              const isCurrentMonth = day.getMonth() === state.currentDate.getMonth();
              const isToday = todayKey ? key === todayKey : false;

              return (
                <div
                  key={key}
                  className={cn(
                    "group relative min-h-[140px] border-r border-b border-border/40 p-2 transition-colors",
                    isCurrentMonth ? "hover:bg-card/60" : "bg-muted/30"
                  )}
                >
                  <span
                    className={cn(
                      "ml-1 text-xs font-medium",
                      isCurrentMonth ? "text-foreground" : "text-muted-foreground/30",
                      isToday &&
                        "mt-0 -ml-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground"
                    )}
                  >
                    {day.getDate()}
                  </span>

                  <div className="mt-2 space-y-1">
                    {dayPosts.slice(0, 3).map((post) => (
                      <m.div
                        key={post.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={cn(
                          "flex cursor-pointer flex-col gap-1 rounded-md border p-1.5 text-[10px] transition-all",
                          post.status === "published"
                            ? "border-green-500/20 bg-green-500/10 text-green-500"
                            : post.status === "scheduled"
                              ? "border-primary/20 bg-primary/10 text-primary"
                              : post.status === "failed"
                                ? "border-red-500/20 bg-red-500/10 text-red-400"
                                : "border-border bg-muted text-muted-foreground"
                        )}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="truncate font-semibold">
                            {post.socialAccount?.platform || "general"}
                          </span>
                          <span className="opacity-70">
                            <ClientCalendarText value={post.scheduledAt || post.createdAt} kind="time" />
                          </span>
                        </div>
                        <span className="truncate font-medium">{post.content}</span>
                        <div className="flex items-center gap-1">
                          <button
                            className="underline"
                            onClick={() =>
                              handleReschedulePost(post.id, post.scheduledAt || post.createdAt)
                            }
                          >
                            +1h
                          </button>
                          <button
                            className="inline-flex items-center text-red-400 underline"
                            onClick={() => handleDeletePost(post.id)}
                          >
                            <Trash2 className="mr-0.5 size-3" />
                            Delete
                          </button>
                        </div>
                      </m.div>
                    ))}
                  </div>

                  <button
                    className="absolute right-2 bottom-2 translate-y-2 transform rounded-lg bg-primary p-2 text-primary-foreground opacity-0 shadow-lg shadow-primary/40 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100"
                    title="Schedule post"
                    onClick={() => openComposer(day)}
                  >
                    <Plus className="size-4" />
                  </button>
                </div>
              );
            })}
          </div>
        ) : state.view === "week" ? (
          <div className="grid flex-1 grid-cols-1 border-t border-border/40 md:grid-cols-7">
            {weekDays.map((day) => {
              const key = toDayKey(day);
              const dayPosts = postsByDay.get(key) ?? [];
              const isToday = todayKey ? key === todayKey : false;

              return (
                <div key={key} className="min-h-[320px] border-r border-border/40 last:border-r-0">
                  <div className="border-b border-border/40 bg-muted/50 p-3">
                    <div className="text-sm font-medium text-muted-foreground">
                      {DAYS[day.getDay() === 0 ? 6 : day.getDay() - 1]}
                    </div>
                    <div className={cn("text-lg font-bold", isToday && "text-primary")}>
                      {day.getDate()}
                    </div>
                  </div>
                  <div className="space-y-2 p-2">
                    {dayPosts.length > 0 ? (
                      dayPosts.map((post) => (
                        <m.div
                          key={post.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={cn(
                            "cursor-pointer rounded-lg border p-3 text-xs transition-colors",
                            post.status === "published"
                              ? "border-green-500/20 bg-green-500/10 text-green-500"
                              : post.status === "scheduled"
                                ? "border-primary/20 bg-primary/10 text-primary"
                                : post.status === "failed"
                                  ? "border-red-500/20 bg-red-500/10 text-red-400"
                                  : "border-border bg-muted text-muted-foreground"
                          )}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate font-semibold">
                              {post.socialAccount?.platform || "general"}
                            </span>
                            <span className="opacity-70">
                              <ClientCalendarText value={post.scheduledAt || post.createdAt} kind="time" />
                            </span>
                          </div>
                          <p className="mt-1 line-clamp-3">{post.content}</p>
                          <div className="mt-2 flex items-center gap-2">
                            <button
                              className="underline"
                              onClick={() =>
                                handleReschedulePost(post.id, post.scheduledAt || post.createdAt)
                              }
                            >
                              +1h
                            </button>
                            <button
                              className="inline-flex items-center text-red-400 underline"
                              onClick={() => handleDeletePost(post.id)}
                            >
                              <Trash2 className="mr-0.5 size-3" />
                              Delete
                            </button>
                          </div>
                        </m.div>
                      ))
                    ) : (
                      <div className="rounded-xl border border-dashed border-border/60 p-3 text-xs text-muted-foreground">
                        No posts this week.
                      </div>
                    )}
                    <button
                      className="w-full rounded-lg border border-dashed border-border/60 px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary"
                      onClick={() => openComposer(day)}
                    >
                      + Schedule
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex-1  gap-y-4 p-6">
            <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-muted/50 p-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Selected day
                </p>
                <h3 className="text-xl font-semibold">
                  <ClientCalendarText value={state.currentDate} kind="selectedDay" />
                </h3>
              </div>
              <Button onClick={() => openComposer(state.currentDate)}>
                <Plus className="mr-2 size-4" />
                New Post
              </Button>
            </div>

            <div className="space-y-3">
              {currentDayPosts.length > 0 ? (
                currentDayPosts.map((post) => (
                  <m.div
                    key={post.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "flex flex-col gap-3 rounded-2xl border p-4",
                      post.status === "published"
                        ? "border-green-500/20 bg-green-500/10 text-green-500"
                        : post.status === "scheduled"
                          ? "border-primary/20 bg-primary/10 text-primary"
                          : post.status === "failed"
                            ? "border-red-500/20 bg-red-500/10 text-red-400"
                            : "border-border bg-muted text-muted-foreground"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="text-sm font-medium opacity-70">
                          {post.socialAccount?.platform || "general"}
                        </div>
                        <div className="text-sm font-semibold">
                          <ClientCalendarText value={post.scheduledAt || post.createdAt} kind="time" />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          className="text-sm underline"
                          onClick={() =>
                            handleReschedulePost(post.id, post.scheduledAt || post.createdAt)
                          }
                        >
                          +1h
                        </button>
                        <button
                          className="inline-flex items-center text-sm text-red-400 underline"
                          onClick={() => handleDeletePost(post.id)}
                        >
                          <Trash2 className="mr-0.5 size-3" />
                          Delete
                        </button>
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed">{post.content}</p>
                  </m.div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
                  No posts scheduled for this day.
                </div>
              )}
            </div>
          </div>
        )}
      </GlassCard>

      {state.isComposerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 p-4 backdrop-blur-sm">
          <GlassCard
            variant="morphism"
            className="w-full max-w-xl space-y-4 border border-border/60 p-6"
          >
            <div className="flex items-center justify-between">
              <h3 className="inline-flex items-center text-lg font-semibold">
                <CalendarClock className="mr-2 size-4" />
                New Post
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => dispatch({ type: "setComposerOpen", isComposerOpen: false })}
              >
                <X className="size-4" />
              </Button>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Channel</div>
              <Select
                value={state.selectedAccountId ? String(state.selectedAccountId) : ""}
                onValueChange={(value) =>
                  dispatch({ type: "setSelectedAccountId", selectedAccountId: Number(value) })
                }
              >
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder="Choose a channel" />
                </SelectTrigger>
                <SelectContent>
                  {state.channels.map((channel) => (
                    <SelectItem key={channel.id} value={String(channel.id)}>
                      {channel.name || channel.username || channel.platform}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Content</div>
              <textarea
                value={state.content}
                onChange={(e) => dispatch({ type: "setContent", content: e.target.value })}
                rows={4}
                className="w-full resize-none rounded-md border border-border bg-background p-3 text-sm"
                placeholder="Write your post content"
              />
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">
                Schedule Time
              </div>
              <SocialDateTimePicker
                value={state.scheduledAt}
                onChange={(value) => dispatch({ type: "setScheduledAt", scheduledAt: value })}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => dispatch({ type: "setComposerOpen", isComposerOpen: false })}
                disabled={state.isSaving}
              >
                Cancel
              </Button>
              <Button onClick={() => void handleCreatePost()} disabled={state.isSaving}>
                {state.isSaving ? "Saving..." : "Create Post"}
              </Button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
