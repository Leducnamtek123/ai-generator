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
      'bg-white/[0.06] text-white/25'
    )}>
      <span className={cn(
        'w-1.5 h-1.5 rounded-full',
        status === 'COMPLETED' ? 'bg-emerald-400' :
        status === 'PROCESSING' ? 'bg-blue-400 animate-pulse' :
        status === 'FAILED' ? 'bg-red-400' : 'bg-white/20'
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

export function SceneCard({ scene, index, isSelected, onSelect, onUpdate, onDelete }: SceneCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editPrompt, setEditPrompt] = useState(scene.prompt);
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

  return (
    <div
      onClick={onSelect}
      className={cn(
        'group relative rounded-xl border transition-all duration-200 cursor-pointer',
        'hover:border-white/15 hover:bg-white/[0.03]',
        isSelected
          ? 'border-violet-500/50 bg-violet-500/[0.06] ring-1 ring-violet-500/20'
          : 'border-white/[0.06] bg-white/[0.015]'
      )}
    >
      {/* Chain connector line */}
      {scene.chainType === 'CONTINUATION' && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center">
          <div className="w-px h-3 bg-gradient-to-b from-transparent to-violet-500/50" />
          <Link2 className="w-3 h-3 text-violet-400/60" />
        </div>
      )}

      {/* Drag handle + index */}
      <div className="absolute top-2 left-2 flex items-center gap-1 z-10">
        <GripVertical className="w-3 h-3 text-white/10 group-hover:text-white/25 transition" />
        <span className="text-[10px] font-bold text-white/20 font-mono">
          {String(index + 1).padStart(2, '0')}
        </span>
      </div>

      {/* Chain badge */}
      {scene.chainType !== 'ROOT' && (
        <div className="absolute top-2 right-2 z-10">
          <span className={cn(
            'text-[8px] px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wider',
            scene.chainType === 'CONTINUATION'
              ? 'bg-blue-500/20 text-blue-400'
              : 'bg-amber-500/20 text-amber-400'
          )}>
            {scene.chainType === 'CONTINUATION' ? 'CONT' : 'INS'}
          </span>
        </div>
      )}

      {/* Image preview */}
      <div className="relative h-28 bg-gradient-to-b from-white/[0.02] to-transparent rounded-t-xl overflow-hidden">
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
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent" />
            {/* Video play indicator */}
            {hasVideo && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/20">
                  <Play className="w-3.5 h-3.5 text-white ml-0.5" />
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-8 h-8 text-white/[0.06]" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        {/* Prompt */}
        {isEditing ? (
          <div className="space-y-1.5" onClick={(e) => e.stopPropagation()}>
            <Textarea
              value={editPrompt}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditPrompt(e.target.value)}
              rows={3}
              className="bg-white/5 border-white/10 text-white text-[11px] placeholder:text-white/20 resize-none"
              autoFocus
            />
            <div className="flex gap-1">
              <Button size="xs" onClick={handleSave} className="bg-violet-600 hover:bg-violet-500 text-white text-[10px] h-5 px-2">
                Save
              </Button>
              <Button size="xs" variant="ghost" onClick={() => { setIsEditing(false); setEditPrompt(scene.prompt); }} className="text-white/30 text-[10px] h-5 px-2">
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-[11px] text-white/40 line-clamp-2 leading-relaxed min-h-[28px]">
            {scene.prompt || 'No prompt set'}
          </p>
        )}

        {/* Character tags */}
        {scene.characterNames?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {scene.characterNames.slice(0, 3).map((n) => (
              <span key={n} className="text-[8px] px-1.5 py-0.5 rounded-full bg-white/[0.04] text-white/30 border border-white/[0.04]">
                {n}
              </span>
            ))}
            {scene.characterNames.length > 3 && (
              <span className="text-[8px] text-white/20">+{scene.characterNames.length - 3}</span>
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
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pt-1"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => { setIsEditing(true); setEditPrompt(scene.prompt); }}
            className="p-1 hover:bg-white/10 rounded text-white/25 hover:text-white/60 transition"
          >
            <Edit3 className="w-3 h-3" />
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-1 hover:bg-red-500/10 rounded text-white/25 hover:text-red-400 transition"
          >
            <Trash2 className="w-3 h-3" />
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
  const sorted = [...scenes].sort((a, b) => a.displayOrder - b.displayOrder);

  if (sorted.length === 0) {
    return (
      <div
        onClick={onAddScene}
        className="flex flex-col items-center justify-center h-64 rounded-2xl border-2 border-dashed border-white/[0.06] hover:border-violet-500/20 hover:bg-violet-500/[0.02] cursor-pointer transition-all group"
      >
        <div className="w-14 h-14 rounded-2xl bg-white/[0.03] flex items-center justify-center mb-3 group-hover:bg-violet-500/10 transition">
          <Film className="w-7 h-7 text-white/10 group-hover:text-violet-400 transition" />
        </div>
        <p className="text-sm text-white/20 group-hover:text-white/40 transition">Add your first scene</p>
        <p className="text-[10px] text-white/10 mt-1">Describe each frame of your visual story</p>
      </div>
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
        className="rounded-xl border-2 border-dashed border-white/[0.06] hover:border-violet-500/20 hover:bg-violet-500/[0.02] flex flex-col items-center justify-center gap-2 min-h-[200px] transition-all group cursor-pointer"
      >
        <div className="w-10 h-10 rounded-xl bg-white/[0.02] group-hover:bg-violet-500/10 flex items-center justify-center transition">
          <Plus className="w-5 h-5 text-white/10 group-hover:text-violet-400 transition" />
        </div>
        <span className="text-[10px] text-white/15 group-hover:text-white/35 transition">Add Scene</span>
      </button>
    </div>
  );
}
