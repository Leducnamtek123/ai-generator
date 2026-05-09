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
    <div className="relative rounded-lg overflow-hidden bg-[#0a0a0f] group">
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full aspect-video object-contain"
        playsInline
      />
      {/* Controls overlay */}
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-[#0a0a0f]/80 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Progress bar */}
        <button
          type="button"
          aria-label="Seek video position"
          className="block w-full h-1 bg-white/20 rounded-full mb-2 cursor-pointer"
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
          <div className="h-full bg-violet-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </button>
        <div className="flex items-center gap-2">
          <button onClick={togglePlay} className="text-white/80 hover:text-white transition">
            {playerState.isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
          </button>
          <span className="text-[10px] text-white/50 font-mono">
            {formatTime(playerState.progress)} / {formatTime(playerState.duration)}
          </span>
          <div className="flex-1" />
          <button
            onClick={() => videoRef.current?.requestFullscreen?.()}
            className="text-white/40 hover:text-white transition"
          >
            <Maximize2 className="size-3.5" />
          </button>
        </div>
      </div>
      {/* Center play button when paused */}
      {!playerState.isPlaying && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-[#0a0a0f]/20"
        >
          <div className="size-12 rounded-full bg-[#0a0a0f]/50 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/20 hover:bg-[#0a0a0f]/70 transition">
            <Play className="size-5 text-white ml-0.5" />
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
      <div className="px-4 py-3 border-b border-white/[0.06]">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-white/50">
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
            <div className="relative aspect-[9/16] max-h-[250px] rounded-lg overflow-hidden bg-[#0a0a0f]">
              <Image src={previewImage} alt="Preview" fill className="object-contain" sizes="300px" unoptimized />
            </div>
          ) : (
            <div className="aspect-video rounded-lg bg-white/[0.02] border border-white/[0.06] flex items-center justify-center">
              <ImageIcon className="size-8 text-white/[0.06]" />
            </div>
          )}

          {/* Dual preview (V + H) */}
          {(scene.verticalImageUrl || scene.horizontalImageUrl) && (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <span className="text-[9px] text-white/20 font-mono">9:16 Vertical</span>
                <div className="relative aspect-[9/16] rounded-md overflow-hidden bg-white/[0.02] border border-white/[0.04]">
                  {scene.verticalImageUrl ? (
                    <Image src={scene.verticalImageUrl} alt="V" fill className="object-cover" sizes="150px" unoptimized />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="size-4 text-white/[0.06]" />
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] text-white/20 font-mono">16:9 Horizontal</span>
                <div className="relative aspect-video rounded-md overflow-hidden bg-white/[0.02] border border-white/[0.04]">
                  {scene.horizontalImageUrl ? (
                    <Image src={scene.horizontalImageUrl} alt="H" fill className="object-cover" sizes="150px" unoptimized />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="size-4 text-white/[0.06]" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Scene Prompt */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="text-[10px] font-medium text-white/30 uppercase tracking-wider">Image Prompt</div>
              <button
                onClick={() => draft.editingField === 'prompt' ? savePrompt() : setDraft((current) => ({ ...current, editingField: 'prompt' }))}
                className="text-white/20 hover:text-white/50 transition"
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
                  className="bg-white/5 border-white/10 text-white text-xs placeholder:text-white/20 resize-none"
                />
                <div className="flex gap-1">
                  <Button size="xs" onClick={savePrompt} className="bg-violet-600 text-white text-[10px] h-5 px-2">Save</Button>
                  <Button size="xs" variant="ghost" onClick={() => setDraft((current) => ({ ...current, editingField: null, prompt: scene.prompt }))} className="text-white/30 text-[10px] h-5 px-2">Cancel</Button>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-white/40 leading-relaxed">{scene.prompt || 'No prompt'}</p>
            )}
          </div>

          {/* Video Prompt */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="text-[10px] font-medium text-white/30 uppercase tracking-wider">Video Motion Prompt</div>
              <button
                onClick={() => draft.editingField === 'videoPrompt' ? saveVideoPrompt() : setDraft((current) => ({ ...current, editingField: 'videoPrompt' }))}
                className="text-white/20 hover:text-white/50 transition"
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
                  className="bg-white/5 border-white/10 text-white text-xs placeholder:text-white/20 resize-none"
                />
                <div className="flex gap-1">
                  <Button size="xs" onClick={saveVideoPrompt} className="bg-violet-600 text-white text-[10px] h-5 px-2">Save</Button>
                  <Button size="xs" variant="ghost" onClick={() => setDraft((current) => ({ ...current, editingField: null, videoPrompt: scene.videoPrompt ?? '' }))} className="text-white/30 text-[10px] h-5 px-2">Cancel</Button>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-white/30 leading-relaxed italic">
                {scene.videoPrompt || 'Not set , will use image prompt for motion'}
              </p>
            )}
          </div>

          {/* Characters */}
          <div>
            <div className="text-[10px] font-medium text-white/30 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Users className="size-3" /> Characters in Scene
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
                        : 'bg-white/[0.02] border-white/[0.06] text-white/25 hover:border-white/15'
                    )}
                  >
                    {name}
                  </button>
                );
              })}
              {availableCharacters.length === 0 && (
                <span className="text-[10px] text-white/15">No characters in project</span>
              )}
            </div>
          </div>

          {/* Chain info */}
          <div className="pt-2 border-t border-white/[0.04]">
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div>
                <span className="text-white/20">Chain Type</span>
                <p className={cn(
                  'font-medium mt-0.5',
                  scene.chainType === 'ROOT' ? 'text-violet-400' :
                  scene.chainType === 'CONTINUATION' ? 'text-blue-400' : 'text-amber-400'
                )}>
                  {scene.chainType}
                </p>
              </div>
              <div>
                <span className="text-white/20">Display Order</span>
                <p className="text-white/50 font-mono mt-0.5">{scene.displayOrder}</p>
              </div>
              {scene.duration && (
                <div>
                  <span className="text-white/20">Duration</span>
                  <p className="text-white/50 font-mono mt-0.5">{scene.duration}s</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
