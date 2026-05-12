'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  ImageIcon,
  Play,
  Plus,
  Trash2,
  Edit3,
  Link2,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Film,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { VisualScene, ChainType, SceneStatus } from '@/services/visualFlowApi';

// ─────────────────────────────────────────────
// Status Badge
// ─────────────────────────────────────────────

function StatusBadge({ status, label }: { status: SceneStatus; label: string }) {
  return (
    <div className={cn(
      'flex items-center gap-1 text-[9px] font-medium px-1.5 py-0.5 rounded-full',
      status === 'COMPLETED' ? 'bg-emerald-500/15 text-emerald-400' :
      status === 'PROCESSING' ? 'bg-blue-500/15 text-blue-400' :
      status === 'FAILED' ? 'bg-red-500/15 text-red-400' :
      'bg-muted/60 text-muted-foreground'
    )}>
      <span className={cn(
        'size-1.5 rounded-full',
        status === 'COMPLETED' ? 'bg-emerald-400' :
        status === 'PROCESSING' ? 'bg-blue-400 animate-pulse' :
        status === 'FAILED' ? 'bg-red-400' : 'bg-muted-foreground/60'
      )} />
      {label}
    </div>
  );
}

// ─────────────────────────────────────────────
// Scene Card
// ─────────────────────────────────────────────

interface SceneCardProps {
  scene: VisualScene;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (data: { prompt?: string; videoPrompt?: string }) => Promise<void>;
  onDelete: () => Promise<void>;
}

function SceneCard({ scene, index, isSelected, onSelect, onUpdate, onDelete }: SceneCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editPrompt, setEditPrompt] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSave = async () => {
    if (editPrompt !== scene.prompt) {
      await onUpdate({ prompt: editPrompt });
    }
    setIsEditing(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    await onDelete();
    setIsDeleting(false);
  };

  const previewUrl = scene.verticalImageUrl || scene.horizontalImageUrl;
  const hasVideo = scene.verticalVideoUrl || scene.horizontalVideoUrl;
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect();
    }
  };

  return (
    <div
      onClick={onSelect}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      className={cn(
        'group relative rounded-xl border transition-all duration-200 cursor-pointer',
        'hover:border-border/80 hover:bg-accent/30',
        isSelected
          ? 'border-violet-500/50 bg-violet-500/[0.06] ring-1 ring-violet-500/20'
          : 'border-border bg-card'
      )}
    >
      {/* Chain connector line */}
      {scene.chainType === 'CONTINUATION' && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center">
          <div className="w-px h-3 bg-gradient-to-b from-transparent to-violet-500/50" />
          <Link2 className="size-3 text-violet-400/60" />
        </div>
      )}

      {/* Drag handle + index */}
      <div className="absolute top-2 left-2 flex items-center gap-1 z-10">
        <GripVertical className="size-3 text-muted-foreground/30 transition group-hover:text-muted-foreground/60" />
        <span className="font-mono text-[10px] font-bold text-muted-foreground/40">
          {String(index + 1).padStart(2, '0')}
        </span>
      </div>

      {/* Chain badge */}
      {scene.chainType !== 'ROOT' && (
        <div className="absolute top-2 right-2 z-10">
          <span className={cn(
            'text-[8px] px-1.5 py-0.5 rounded-full font-semibold',
            scene.chainType === 'CONTINUATION'
              ? 'bg-blue-500/20 text-blue-400'
              : 'bg-amber-500/20 text-amber-400'
          )}>
            {scene.chainType === 'CONTINUATION' ? 'CONT' : 'INS'}
          </span>
        </div>
      )}

      {/* Image preview */}
      <div className="relative h-28 overflow-hidden rounded-t-xl bg-gradient-to-b from-muted/20 to-transparent">
        {previewUrl ? (
          <>
            <Image
              src={previewUrl}
              alt={`Scene ${index + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 200px"
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
            {/* Video play indicator */}
            {hasVideo && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex size-8 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm ring-1 ring-border/70">
                  <Play className="ml-0.5 size-3.5 text-foreground" />
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ImageIcon className="size-8 text-muted-foreground/20" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        {/* Prompt */}
        {isEditing ? (
          <div className="space-y-1.5">
            <Textarea
              value={editPrompt}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditPrompt(e.target.value)}
              rows={3}
              onClick={(e) => e.stopPropagation()}
              className="resize-none border-border bg-background text-[11px] text-foreground placeholder:text-muted-foreground"
            />
            <div className="flex gap-1">
              <Button size="xs" onClick={(e) => { e.stopPropagation(); void handleSave(); }} className="h-5 bg-violet-600 px-2 text-[10px] text-white hover:bg-violet-500">
                Save
              </Button>
              <Button size="xs" variant="ghost" onClick={(e) => { e.stopPropagation(); setIsEditing(false); setEditPrompt(scene.prompt); }} className="h-5 px-2 text-[10px] text-muted-foreground">
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <p className="min-h-[28px] text-[11px] leading-relaxed text-muted-foreground line-clamp-2">
            {scene.prompt || 'No prompt set'}
          </p>
        )}

        {/* Character tags */}
        {scene.characterNames?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {scene.characterNames.slice(0, 3).map((n) => (
              <span key={n} className="rounded-full border border-border bg-muted/30 px-1.5 py-0.5 text-[8px] text-muted-foreground">
                {n}
              </span>
            ))}
            {scene.characterNames.length > 3 && (
              <span className="text-[8px] text-muted-foreground/60">+{scene.characterNames.length - 3}</span>
            )}
          </div>
        )}

        {/* Status row */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <StatusBadge status={scene.verticalImageStatus} label="V.Img" />
          <StatusBadge status={scene.verticalVideoStatus} label="V.Vid" />
          <StatusBadge status={scene.horizontalImageStatus} label="H.Img" />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pt-1">
          <button
            onClick={(e) => { e.stopPropagation(); setIsEditing(true); setEditPrompt(scene.prompt); }}
            className="rounded p-1 text-muted-foreground/60 transition hover:bg-accent hover:text-foreground"
          >
            <Edit3 className="size-3" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); void handleDelete(); }}
            disabled={isDeleting}
            className="rounded p-1 text-muted-foreground/60 transition hover:bg-red-500/10 hover:text-red-400"
          >
            <Trash2 className="size-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Scene Timeline (grid of scene cards)
// ─────────────────────────────────────────────

interface SceneTimelineProps {
  scenes: VisualScene[];
  selectedScene: VisualScene | null;
  onSelect: (scene: VisualScene | null) => void;
  onUpdate: (sceneId: string, data: { prompt?: string; videoPrompt?: string }) => Promise<void>;
  onDelete: (sceneId: string) => Promise<void>;
  onAddScene: () => void;
}

export function SceneTimeline({
  scenes,
  selectedScene,
  onSelect,
  onUpdate,
  onDelete,
  onAddScene,
}: SceneTimelineProps) {
  const sorted = scenes.toSorted((a, b) => a.displayOrder - b.displayOrder);

  if (sorted.length === 0) {
    return (
      <button
        type="button"
        onClick={onAddScene}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onAddScene();
          }
        }}
        className="flex h-64 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border hover:border-violet-500/20 hover:bg-violet-500/[0.02] cursor-pointer transition-all group"
      >
        <div className="mb-3 flex size-14 items-center justify-center rounded-2xl bg-muted/20 transition group-hover:bg-violet-500/10">
          <Film className="size-7 text-muted-foreground/20 transition group-hover:text-violet-400" />
        </div>
        <p className="text-sm text-muted-foreground/50 transition group-hover:text-muted-foreground">Add your first scene</p>
        <p className="mt-1 text-[10px] text-muted-foreground/30">Describe each frame of your visual story.</p>
      </button>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3">
      {sorted.map((scene, i) => (
        <SceneCard
          key={scene.id}
          scene={scene}
          index={i}
          isSelected={selectedScene?.id === scene.id}
          onSelect={() => onSelect(selectedScene?.id === scene.id ? null : scene)}
          onUpdate={(data) => onUpdate(scene.id, data)}
          onDelete={() => onDelete(scene.id)}
        />
      ))}

      {/* Add scene button */}
      <button
        onClick={onAddScene}
        className="flex min-h-[200px] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border hover:border-violet-500/20 hover:bg-violet-500/[0.02] transition-all group cursor-pointer"
      >
        <div className="flex size-10 items-center justify-center rounded-xl bg-muted/20 transition group-hover:bg-violet-500/10">
          <Plus className="size-5 text-muted-foreground/20 transition group-hover:text-violet-400" />
        </div>
        <span className="text-[10px] text-muted-foreground/50 transition group-hover:text-muted-foreground">Add scene</span>
      </button>
    </div>
  );
}
