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
  const [view, setView] = React.useState<'month' | 'week' | 'day'>('month');
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [posts, setPosts] = React.useState<SocialPost[]>([]);
  const [channels, setChannels] = React.useState<SocialChannel[]>([]);
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('all');
  const [isLoading, setIsLoading] = React.useState(true);
  const [isComposerOpen, setIsComposerOpen] = React.useState(false);
  const [content, setContent] = React.useState('');
  const [selectedAccountId, setSelectedAccountId] = React.useState<number | null>(
    null,
  );
  const [scheduledAt, setScheduledAt] = React.useState('');
  const [isSaving, setIsSaving] = React.useState(false);

  const monthName = MONTHS[currentDate.getMonth()];
  const year = currentDate.getFullYear();

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [postData, channelData] = await Promise.all([
        socialHubApi.getPosts(),
        socialHubApi.getChannels(),
      ]);
      setPosts(postData);
      setChannels(channelData);
      if (!selectedAccountId && channelData.length > 0) {
        setSelectedAccountId(channelData[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch social calendar data', error);
      toast.error('Failed to load social calendar data.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedAccountId]);

  React.useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const base = startOfMonth(currentDate);
  const offset = getMondayBasedOffset(base);
  const firstCell = new Date(base);
  firstCell.setDate(firstCell.getDate() - offset);
  const gridDays = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(firstCell);
    d.setDate(firstCell.getDate() + i);
    return d;
  });

  const filteredPosts = posts.filter((post) =>
    statusFilter === 'all' ? true : post.status === statusFilter,
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
    const targetDate = seedDate ?? new Date(Date.now() + 60 * 60 * 1000);
    setScheduledAt(toDatetimeLocal(targetDate));
    setContent('');
    setIsComposerOpen(true);
  };

  const handleCreatePost = async () => {
    if (!content.trim()) {
      toast.error('Please enter post content.');
      return;
    }
    if (!selectedAccountId) {
      toast.error('Please select a connected channel.');
      return;
    }
    setIsSaving(true);
    try {
      await socialHubApi.createPost({
        content: content.trim(),
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
        socialAccountId: selectedAccountId,
      });
      toast.success('Post created successfully.');
      setIsComposerOpen(false);
      await fetchData();
    } catch (error) {
      console.error('Failed to create post', error);
      toast.error('Failed to create post.');
    } finally {
      setIsSaving(false);
    }
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
                onClick={() => setView(v)}
                className={cn(
                  'px-4 py-1.5 text-xs font-medium rounded-md capitalize transition-all',
                  view === v
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
                  setCurrentDate(
                    new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
                  )
                }
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() =>
                  setCurrentDate(
                    new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
                  )
                }
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => setCurrentDate(new Date())}
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
                const currentIndex = sequence.indexOf(statusFilter);
                const next = sequence[(currentIndex + 1) % sequence.length];
                setStatusFilter(next);
              }}
            >
              <Filter className="w-3.5 h-3.5 mr-2" />
              {statusFilter === 'all' ? 'All statuses' : statusFilter}
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
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
            const isToday = key === new Date().toISOString().slice(0, 10);

            return (
              <div
                key={key}
                className={cn(
                  'min-h-[140px] p-2 border-b border-r border-white/5 relative group transition-colors',
                  isCurrentMonth ? 'hover:bg-white/[0.02]' : 'bg-black/20',
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

      {isLoading && (
        <div className="text-sm text-muted-foreground">Loading calendar data...</div>
      )}

      {isComposerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
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
                onClick={() => setIsComposerOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-muted-foreground uppercase tracking-wider">
                Channel
              </label>
              <select
                value={selectedAccountId ?? ''}
                onChange={(e) => setSelectedAccountId(Number(e.target.value))}
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
              >
                {channels.map((channel) => (
                  <option key={channel.id} value={channel.id}>
                    {channel.name || channel.username || channel.platform}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-muted-foreground uppercase tracking-wider">
                Content
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                className="w-full rounded-md border border-border bg-background p-3 text-sm resize-none"
                placeholder="Write your post content..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs text-muted-foreground uppercase tracking-wider">
                Schedule Time
              </label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsComposerOpen(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button onClick={() => void handleCreatePost()} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Create Post'}
              </Button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
