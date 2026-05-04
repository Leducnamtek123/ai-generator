'use client';

import React from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Filter,
  Trash2,
  CalendarClock,
  X,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  socialHubApi,
  type SocialChannel,
  type SocialPost,
  type SocialPostStatus,
} from '@/services/socialHubApi';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

type StatusFilter = 'all' | SocialPostStatus;

type CalendarState = {
  view: 'month' | 'week' | 'day';
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

type CalendarAction =
  | { type: 'setView'; view: 'month' | 'week' | 'day' }
  | { type: 'setCurrentDate'; currentDate: Date }
  | { type: 'setPosts'; posts: SocialPost[] }
  | { type: 'setChannels'; channels: SocialChannel[] }
  | { type: 'setStatusFilter'; statusFilter: StatusFilter }
  | { type: 'setLoading'; isLoading: boolean }
  | { type: 'setComposerOpen'; isComposerOpen: boolean }
  | { type: 'setContent'; content: string }
  | { type: 'setSelectedAccountId'; selectedAccountId: number | null }
  | { type: 'setScheduledAt'; scheduledAt: string }
  | { type: 'setSaving'; isSaving: boolean }
  | { type: 'resetComposer' };

const initialState: CalendarState = {
  view: 'month',
  currentDate: new Date(),
  baseNow: new Date(),
  posts: [],
  channels: [],
  statusFilter: 'all',
  isLoading: true,
  isComposerOpen: false,
  content: '',
  selectedAccountId: null,
  scheduledAt: '',
  isSaving: false,
};

function reducer(state: CalendarState, action: CalendarAction): CalendarState {
  switch (action.type) {
    case 'setView':
      return { ...state, view: action.view };
    case 'setCurrentDate':
      return { ...state, currentDate: action.currentDate };
    case 'setPosts':
      return { ...state, posts: action.posts };
    case 'setChannels':
      return { ...state, channels: action.channels };
    case 'setStatusFilter':
      return { ...state, statusFilter: action.statusFilter };
    case 'setLoading':
      return { ...state, isLoading: action.isLoading };
    case 'setComposerOpen':
      return { ...state, isComposerOpen: action.isComposerOpen };
    case 'setContent':
      return { ...state, content: action.content };
    case 'setSelectedAccountId':
      return { ...state, selectedAccountId: action.selectedAccountId };
    case 'setScheduledAt':
      return { ...state, scheduledAt: action.scheduledAt };
    case 'setSaving':
      return { ...state, isSaving: action.isSaving };
    case 'resetComposer':
      return { ...state, isComposerOpen: false, content: '', scheduledAt: '' };
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

function toDatetimeLocal(date: Date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}

export default function CalendarPage() {
  const [state, dispatch] = React.useReducer(reducer, initialState);

  const monthName = MONTHS[state.currentDate.getMonth()];
  const year = state.currentDate.getFullYear();

  const fetchData = React.useCallback(async () => {
    try {
      const [postData, channelData] = await Promise.all([
        socialHubApi.getPosts(),
        socialHubApi.getChannels(),
      ]);
      dispatch({ type: 'setPosts', posts: postData });
      dispatch({ type: 'setChannels', channels: channelData });
      if (!state.selectedAccountId && channelData.length > 0) {
        dispatch({ type: 'setSelectedAccountId', selectedAccountId: channelData[0].id });
      }
    } catch (error) {
      console.error('Failed to fetch social calendar data', error);
      toast.error('Failed to load social calendar data.');
    }
    dispatch({ type: 'setLoading', isLoading: false });
  }, [state.selectedAccountId]);

  React.useEffect(() => {
    queueMicrotask(() => { void fetchData(); });
  }, [fetchData]);

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
    state.statusFilter === 'all' ? true : post.status === state.statusFilter,
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

  const openComposer = (seedDate?: Date) => {
    const targetDate = seedDate ?? new Date(state.baseNow.getTime() + 60 * 60 * 1000);
    dispatch({ type: 'setScheduledAt', scheduledAt: toDatetimeLocal(targetDate) });
    dispatch({ type: 'setContent', content: '' });
    dispatch({ type: 'setComposerOpen', isComposerOpen: true });
  };

  const handleCreatePost = async () => {
    if (!state.content.trim()) {
      toast.error('Please enter post content.');
      return;
    }
    if (!state.selectedAccountId) {
      toast.error('Please select a connected channel.');
      return;
    }
    dispatch({ type: 'setSaving', isSaving: true });
    try {
      await socialHubApi.createPost({
        content: state.content.trim(),
        scheduledAt: state.scheduledAt ? new Date(state.scheduledAt).toISOString() : null,
        socialAccountId: state.selectedAccountId,
      });
      toast.success('Post created successfully.');
      dispatch({ type: 'resetComposer' });
      await fetchData();
    } catch (error) {
      console.error('Failed to create post', error);
      toast.error('Failed to create post.');
    }
    dispatch({ type: 'setSaving', isSaving: false });
  };

  const handleDeletePost = async (postId: number) => {
    toast.promise(socialHubApi.deletePost(postId), {
      loading: 'Deleting post...',
      success: async () => {
        await fetchData();
        return 'Post deleted.';
      },
      error: 'Failed to delete post.',
    });
  };

  const handleReschedulePost = async (postId: number, sourceDate: string) => {
    const date = new Date(sourceDate);
    date.setHours(date.getHours() + 1);
    try {
      await socialHubApi.reschedulePost(postId, date.toISOString());
      toast.success('Post rescheduled +1 hour.');
      await fetchData();
    } catch (error) {
      console.error('Failed to reschedule post', error);
      toast.error('Failed to reschedule post.');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 flex flex-col h-full">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">Social Calendar</h1>
          <p className="text-muted-foreground text-sm">
            Schedule and manage social posts from one timeline.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex p-1 bg-muted rounded-lg border border-border">
            {(['month', 'week', 'day'] as const).map((v) => (
              <button
                key={v}
                onClick={() => dispatch({ type: 'setView', view: v })}
                className={cn(
                  'px-4 py-1.5 text-xs font-medium rounded-md capitalize transition-all',
                  state.view === v
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {v}
              </button>
            ))}
          </div>
          <Button onClick={() => openComposer()}>
            <Plus className="w-4 h-4 mr-2" />
            New Post
          </Button>
        </div>
      </div>

      <GlassCard
        variant="morphism"
        className="flex-1 flex flex-col p-0 overflow-hidden border border-white/10"
      >
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold">
              {monthName} {year}
            </h2>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() =>
                  dispatch({
                    type: 'setCurrentDate',
                    currentDate: new Date(state.currentDate.getFullYear(), state.currentDate.getMonth() - 1, 1),
                  })
                }
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() =>
                  dispatch({
                    type: 'setCurrentDate',
                    currentDate: new Date(state.currentDate.getFullYear(), state.currentDate.getMonth() + 1, 1),
                  })
                }
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => dispatch({ type: 'setCurrentDate', currentDate: new Date() })}
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
                  'all',
                  'scheduled',
                  'draft',
                  'published',
                  'failed',
                ];
                const currentIndex = sequence.indexOf(state.statusFilter);
                const next = sequence[(currentIndex + 1) % sequence.length];
                dispatch({ type: 'setStatusFilter', statusFilter: next });
              }}
            >
              <Filter className="w-3.5 h-3.5 mr-2" />
              {state.statusFilter === 'all' ? 'All statuses' : state.statusFilter}
            </Button>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-7 border-collapse">
          {DAYS.map((day) => (
            <div
              key={day}
              className="p-3 text-center text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-r border-white/5 bg-white/5"
            >
              {day}
            </div>
          ))}

          {gridDays.map((day) => {
            const key = day.toISOString().slice(0, 10);
            const dayPosts = postsByDay.get(key) ?? [];
            const isCurrentMonth = day.getMonth() === state.currentDate.getMonth();
            const isToday = key === new Date().toISOString().slice(0, 10);

            return (
              <div
                key={key}
                className={cn(
                  'min-h-[140px] p-2 border-b border-r border-white/5 relative group transition-colors',
                  isCurrentMonth ? 'hover:bg-white/[0.02]' : 'bg-gray-950/20',
                )}
              >
                <span
                  className={cn(
                    'text-xs font-medium ml-1',
                    isCurrentMonth ? 'text-foreground' : 'text-muted-foreground/30',
                    isToday &&
                      'w-6 h-6 flex items-center justify-center bg-primary text-primary-foreground rounded-full -ml-1 mt-0',
                  )}
                >
                  {day.getDate()}
                </span>

                <div className="mt-2 space-y-1">
              {dayPosts.slice(0, 3).map((post) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={cn(
                        'p-1.5 rounded-md text-[10px] flex flex-col gap-1 cursor-pointer transition-all border',
                        post.status === 'published'
                          ? 'bg-green-500/10 border-green-500/20 text-green-500'
                          : post.status === 'scheduled'
                            ? 'bg-primary/10 border-primary/20 text-primary'
                            : post.status === 'failed'
                              ? 'bg-red-500/10 border-red-500/20 text-red-400'
                              : 'bg-muted border-border text-muted-foreground',
                      )}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold uppercase tracking-tighter truncate">
                          {post.socialAccount?.platform || 'general'}
                        </span>
                        <span className="opacity-70">
                          {new Date(post.scheduledAt || post.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <span className="truncate font-medium">{post.content}</span>
                      <div className="flex items-center gap-1">
                        <button
                          className="underline"
                          onClick={() =>
                            handleReschedulePost(
                              post.id,
                              post.scheduledAt || post.createdAt,
                            )
                          }
                        >
                          +1h
                        </button>
                        <button
                          className="underline text-red-400 inline-flex items-center"
                          onClick={() => handleDeletePost(post.id)}
                        >
                          <Trash2 className="w-3 h-3 mr-0.5" />
                          Delete
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <button
                  className="absolute bottom-2 right-2 p-2 rounded-lg bg-primary opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 text-primary-foreground shadow-lg shadow-primary/40"
                  title="Schedule post"
                    onClick={() => openComposer(day)}
                  >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      </GlassCard>

      {state.isLoading && (
        <div className="text-sm text-muted-foreground">Loading calendar data...</div>
      )}

      {state.isComposerOpen && (
        <div className="fixed inset-0 z-50 bg-gray-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <GlassCard
            variant="morphism"
            className="w-full max-w-xl border border-white/10 p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold inline-flex items-center">
                <CalendarClock className="w-4 h-4 mr-2" />
                Create Scheduled Post
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => dispatch({ type: 'setComposerOpen', isComposerOpen: false })}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-2">
              <div className="text-xs text-muted-foreground uppercase tracking-wider">
                Channel
              </div>
              <select
                value={state.selectedAccountId ?? ''}
                onChange={(e) => dispatch({ type: 'setSelectedAccountId', selectedAccountId: Number(e.target.value) })}
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
              >
                {state.channels.map((channel) => (
                  <option key={channel.id} value={channel.id}>
                    {channel.name || channel.username || channel.platform}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <div className="text-xs text-muted-foreground uppercase tracking-wider">
                Content
              </div>
              <textarea
                value={state.content}
                onChange={(e) => dispatch({ type: 'setContent', content: e.target.value })}
                rows={4}
                className="w-full rounded-md border border-border bg-background p-3 text-sm resize-none"
                placeholder="Write your post content..."
              />
            </div>

            <div className="space-y-2">
              <div className="text-xs text-muted-foreground uppercase tracking-wider">
                Schedule Time
              </div>
              <input
                type="datetime-local"
                value={state.scheduledAt}
                onChange={(e) => dispatch({ type: 'setScheduledAt', scheduledAt: e.target.value })}
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => dispatch({ type: 'setComposerOpen', isComposerOpen: false })}
                disabled={state.isSaving}
              >
                Cancel
              </Button>
              <Button onClick={() => void handleCreatePost()} disabled={state.isSaving}>
                {state.isSaving ? 'Saving...' : 'Create Post'}
              </Button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
