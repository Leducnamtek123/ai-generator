'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import {
  Edit3,
  Users,
  Link2,
  ImageIcon,
  Film,
  Volume2,
  Download,
  Copy,
  Play,
  Pause,
  Maximize2,
  SkipBack,
  SkipForward,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { VisualScene } from '@/services/visualFlowApi';

// ─────────────────────────────────────────────
// Video Player (inline)
// ─────────────────────────────────────────────

function VideoPlayer({ src, poster }: { src: string; poster?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playerState, setPlayerState] = useState({
    isPlaying: false,
    progress: 0,
    duration: 0,
  });
  const updatePlayerState = (next: Partial<typeof playerState>) => {
    setPlayerState((current) => ({ ...current, ...next }));
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (playerState.isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setPlayerState((current) => ({ ...current, isPlaying: !current.isPlaying }));
  };

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => updatePlayerState({ progress: v.currentTime });
    const onDur = () => updatePlayerState({ duration: v.duration || 0 });
    const onEnd = () => updatePlayerState({ isPlaying: false });
    v.addEventListener('timeupdate', onTime);
    v.addEventListener('loadedmetadata', onDur);
    v.addEventListener('ended', onEnd);
    return () => {
      v.removeEventListener('timeupdate', onTime);
      v.removeEventListener('loadedmetadata', onDur);
      v.removeEventListener('ended', onEnd);
    };
  }, [src]);

  const pct = playerState.duration > 0 ? (playerState.progress / playerState.duration) * 100 : 0;

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative overflow-hidden rounded-lg bg-background/95 group">
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full aspect-video object-contain"
        playsInline
      />
      {/* Controls overlay */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/90 to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
        {/* Progress bar */}
        <button
          type="button"
          aria-label="Seek video position"
          className="mb-2 block h-1 w-full cursor-pointer rounded-full bg-muted/60"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const pctClicked = (e.clientX - rect.left) / rect.width;
            if (videoRef.current) videoRef.current.currentTime = pctClicked * playerState.duration;
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              if (videoRef.current) videoRef.current.currentTime = playerState.duration / 2;
            }
          }}
        >
          <div className="h-full rounded-full bg-violet-500 transition-all" style={{ width: `${pct}%` }} />
        </button>
        <div className="flex items-center gap-2">
          <button onClick={togglePlay} className="text-muted-foreground transition hover:text-foreground">
            {playerState.isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
          </button>
          <span className="font-mono text-[10px] text-muted-foreground">
            {formatTime(playerState.progress)} / {formatTime(playerState.duration)}
          </span>
          <div className="flex-1" />
          <button
            onClick={() => videoRef.current?.requestFullscreen?.()}
            className="text-muted-foreground transition hover:text-foreground"
          >
            <Maximize2 className="size-3.5" />
          </button>
        </div>
      </div>
      {/* Center play button when paused */}
      {!playerState.isPlaying && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-background/20"
        >
          <div className="flex size-12 items-center justify-center rounded-full bg-background/70 backdrop-blur-sm ring-1 ring-border/70 transition hover:bg-background/90">
            <Play className="ml-0.5 size-5 text-foreground" />
          </div>
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Scene Properties Panel
// ─────────────────────────────────────────────

interface ScenePropertiesProps {
  scene: VisualScene;
  onUpdate: (data: { prompt?: string; videoPrompt?: string; characterNames?: string[] }) => Promise<void>;
  availableCharacters: string[];
}

export function SceneProperties({ scene, onUpdate, availableCharacters }: ScenePropertiesProps) {
  const [draft, setDraft] = useState<{
    editingField: string | null;
    prompt: string;
    videoPrompt: string;
  }>(() => ({
    editingField: null,
    prompt: scene.prompt,
    videoPrompt: scene.videoPrompt ?? '',
  }));

  const savePrompt = async () => {
    if (draft.prompt !== scene.prompt) {
      await onUpdate({ prompt: draft.prompt });
    }
    setDraft((current) => ({ ...current, editingField: null, prompt: draft.prompt }));
  };

  const saveVideoPrompt = async () => {
    if (draft.videoPrompt !== (scene.videoPrompt ?? '')) {
      await onUpdate({ videoPrompt: draft.videoPrompt });
    }
    setDraft((current) => ({ ...current, editingField: null, videoPrompt: draft.videoPrompt }));
  };

  const toggleChar = async (name: string) => {
    const current = scene.characterNames ?? [];
    const updated = current.includes(name)
      ? current.filter((c) => c !== name)
      : [...current, name];
    await onUpdate({ characterNames: updated });
  };

  const previewVideo = scene.verticalVideoUrl || scene.horizontalVideoUrl;
  const previewImage = scene.verticalImageUrl || scene.horizontalImageUrl;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border px-4 py-3">
        <h3 className="text-sm font-medium text-foreground">
          Scene Properties
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Preview */}
        <div className="p-4 space-y-4">
          {/* Video / Image preview */}
          {previewVideo ? (
            <VideoPlayer src={previewVideo} poster={previewImage} />
          ) : previewImage ? (
            <div className="relative max-h-[250px] overflow-hidden rounded-lg bg-background">
              <Image src={previewImage} alt="Preview" fill className="object-contain" sizes="300px" unoptimized />
            </div>
          ) : (
            <div className="flex aspect-video items-center justify-center rounded-lg border border-border bg-muted/20">
              <ImageIcon className="size-8 text-muted-foreground/20" />
            </div>
          )}

          {/* Dual preview (V + H) */}
          {(scene.verticalImageUrl || scene.horizontalImageUrl) && (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground">9:16 Vertical</span>
                <div className="relative aspect-[9/16] overflow-hidden rounded-md border border-border bg-muted/20">
                  {scene.verticalImageUrl ? (
                    <Image src={scene.verticalImageUrl} alt="V" fill className="object-cover" sizes="150px" unoptimized />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <ImageIcon className="size-4 text-muted-foreground/20" />
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground">16:9 Horizontal</span>
                <div className="relative aspect-video overflow-hidden rounded-md border border-border bg-muted/20">
                  {scene.horizontalImageUrl ? (
                    <Image src={scene.horizontalImageUrl} alt="H" fill className="object-cover" sizes="150px" unoptimized />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <ImageIcon className="size-4 text-muted-foreground/20" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Scene Prompt */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="text-sm font-medium text-muted-foreground">Prompt</div>
              <button
                onClick={() => draft.editingField === 'prompt' ? savePrompt() : setDraft((current) => ({ ...current, editingField: 'prompt' }))}
                className="text-muted-foreground/60 transition hover:text-foreground"
              >
                <Edit3 className="size-3" />
              </button>
            </div>
            {draft.editingField === 'prompt' ? (
              <div className="space-y-1.5">
                <Textarea
                  value={draft.prompt}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDraft((current) => ({ ...current, prompt: e.target.value }))}
                  rows={4}
                  className="resize-none border-border bg-background text-xs text-foreground placeholder:text-muted-foreground"
                />
                <div className="flex gap-1">
                  <Button size="xs" onClick={savePrompt} className="h-5 bg-violet-600 px-2 text-[10px] text-white">Save</Button>
                  <Button size="xs" variant="ghost" onClick={() => setDraft((current) => ({ ...current, editingField: null, prompt: scene.prompt }))} className="h-5 px-2 text-[10px] text-muted-foreground">Cancel</Button>
                </div>
              </div>
            ) : (
              <p className="text-[11px] leading-relaxed text-muted-foreground">{scene.prompt || 'No prompt'}</p>
            )}
          </div>

          {/* Video Prompt */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="text-[10px] font-medium text-muted-foreground">Motion prompt</div>
              <button
                onClick={() => draft.editingField === 'videoPrompt' ? saveVideoPrompt() : setDraft((current) => ({ ...current, editingField: 'videoPrompt' }))}
                className="text-muted-foreground/60 transition hover:text-foreground"
              >
                <Edit3 className="size-3" />
              </button>
            </div>
            {draft.editingField === 'videoPrompt' ? (
              <div className="space-y-1.5">
                <Textarea
                  value={draft.videoPrompt}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDraft((current) => ({ ...current, videoPrompt: e.target.value }))}
                  rows={3}
                  placeholder="e.g. 0-3s: wide crane down. 3-6s: tracking shot."
                  className="resize-none border-border bg-background text-xs text-foreground placeholder:text-muted-foreground"
                />
                <div className="flex gap-1">
                  <Button size="xs" onClick={saveVideoPrompt} className="h-5 bg-violet-600 px-2 text-[10px] text-white">Save</Button>
                  <Button size="xs" variant="ghost" onClick={() => setDraft((current) => ({ ...current, editingField: null, videoPrompt: scene.videoPrompt ?? '' }))} className="h-5 px-2 text-[10px] text-muted-foreground">Cancel</Button>
                </div>
              </div>
            ) : (
              <p className="text-[11px] leading-relaxed italic text-muted-foreground">
                {scene.videoPrompt || 'Not set , will use image prompt for motion'}
              </p>
            )}
          </div>

          {/* Characters */}
          <div>
            <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground">
              <Users className="size-3" /> Characters
            </div>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {availableCharacters.map((name) => {
                const isActive = (scene.characterNames ?? []).includes(name);
                return (
                  <button
                    key={name}
                    onClick={() => toggleChar(name)}
                    className={cn(
                      'px-2.5 py-1 rounded-full text-[10px] border transition-all',
                      isActive
                        ? 'bg-violet-500/20 border-violet-500/40 text-violet-300'
                        : 'border-border bg-muted/20 text-muted-foreground hover:border-border/80'
                    )}
                  >
                    {name}
                  </button>
                );
              })}
              {availableCharacters.length === 0 && (
                <span className="text-[10px] text-muted-foreground/50">No characters in project</span>
              )}
            </div>
          </div>

          {/* Chain info */}
          <div className="border-t border-border pt-2">
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div>
                <span className="text-muted-foreground">Chain</span>
                <p className={cn(
                  'font-medium mt-0.5',
                  scene.chainType === 'ROOT' ? 'text-violet-400' :
                  scene.chainType === 'CONTINUATION' ? 'text-blue-400' : 'text-amber-400'
                )}>
                  {scene.chainType}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Order</span>
                <p className="mt-0.5 font-mono text-muted-foreground">{scene.displayOrder}</p>
              </div>
              {scene.duration && (
                <div>
                  <span className="text-muted-foreground">Duration</span>
                  <p className="mt-0.5 font-mono text-muted-foreground">{scene.duration}s</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
