'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  Plus,
  Trash2,
  Loader2,
  UserRound,
  MapPinned,
  Ghost,
  Gem,
  Sparkles,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import type { VisualCharacter, EntityType } from '@/services/visualFlowApi';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface CharacterPanelProps {
  characters: VisualCharacter[];
  projectId: string;
  onAdd: (data: {
    name: string;
    entityType?: EntityType;
    description?: string;
    voiceDescription?: string;
  }) => Promise<void>;
  onDelete: (charId: string) => Promise<void>;
  onGenerateRefs: (characterIds?: string[]) => Promise<void>;
  isGenerating: boolean;
}

// ─────────────────────────────────────────────
// Entity Icon
// ─────────────────────────────────────────────

const ENTITY_ICONS: Record<EntityType, React.ComponentType<{ className?: string }>> = {
  character: UserRound,
  location: MapPinned,
  creature: Ghost,
  visual_asset: Gem,
};

const STATUS_STYLES: Record<string, { bg: string; ring: string; label: string }> = {
  PENDING: { bg: 'bg-amber-500/20', ring: 'ring-amber-500/30', label: 'Pending' },
  PROCESSING: { bg: 'bg-blue-500/20', ring: 'ring-blue-500/30', label: 'Processing' },
  COMPLETED: { bg: 'bg-emerald-500/20', ring: 'ring-emerald-500/30', label: 'Ready' },
  FAILED: { bg: 'bg-red-500/20', ring: 'ring-red-500/30', label: 'Failed' },
};

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export function CharacterPanel({
  characters,
  onAdd,
  onDelete,
  onGenerateRefs,
  isGenerating,
}: CharacterPanelProps) {
  const [showForm, setShowForm] = useState(false);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    name: '',
    entityType: 'character' as EntityType,
    description: '',
    voiceDescription: '',
  });

  const handleAdd = async () => {
    if (!form.name.trim()) return;
    setAdding(true);
    await onAdd({
      name: form.name,
      entityType: form.entityType,
      description: form.description || undefined,
      voiceDescription: form.voiceDescription || undefined,
    });
    setForm({ name: '', entityType: 'character', description: '', voiceDescription: '' });
    setShowForm(false);
    setAdding(false);
  };

  const pendingCount = characters.filter((c) => c.refStatus === 'PENDING' || c.refStatus === 'FAILED').length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="text-sm font-medium text-foreground">
          Entities ({characters.length})
        </h3>
        <div className="flex gap-1">
          {pendingCount > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon-xs"
                  variant="ghost"
                  onClick={() => onGenerateRefs()}
                  disabled={isGenerating}
                  className="text-violet-500 hover:bg-violet-500/10 hover:text-violet-400"
                >
                  {isGenerating ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="size-3.5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Generate references ({pendingCount})</TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon-xs"
                variant="ghost"
                onClick={() => setShowForm(!showForm)}
                className="text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                {showForm ? <X className="size-3.5" /> : <Plus className="size-3.5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{showForm ? 'Cancel' : 'Add Entity'}</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="space-y-2.5 border-b border-border bg-muted/20 px-4 py-3 animate-in slide-in-from-top-2 duration-200">
          <Input
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="Entity name?"
            className="h-8 border-border bg-background text-sm text-foreground placeholder:text-muted-foreground"
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <div className="flex gap-1.5">
            {(Object.keys(ENTITY_ICONS) as EntityType[]).map((type) => {
              const Icon = ENTITY_ICONS[type];
              return (
                <button
                  key={type}
                  onClick={() => setForm((p) => ({ ...p, entityType: type }))}
                  className={cn(
                    'flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] capitalize border transition-all',
                    form.entityType === type
                      ? 'border-violet-500/40 bg-violet-500/20 text-violet-300'
                      : 'border-border bg-muted/20 text-muted-foreground hover:border-border/80'
                  )}
                >
                  <Icon className="size-3" />
                  {type.replace('_', ' ')}
                </button>
              );
            })}
          </div>
          <Textarea
            value={form.description}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm((p) => ({ ...p, description: e.target.value }))}
            placeholder="Visual description (for AI reference generation)?"
            rows={2}
            className="resize-none border-border bg-background text-xs text-foreground placeholder:text-muted-foreground"
          />
          <Button
            onClick={handleAdd}
            disabled={adding || !form.name.trim()}
            size="sm"
            className="h-7 w-full bg-violet-600 text-xs text-white hover:bg-violet-500"
          >
            {adding ? <Loader2 className="size-3 animate-spin mr-1" /> : <Plus className="size-3 mr-1" />}
            Add
          </Button>
        </div>
      )}

      {/* Character list */}
      <div className="flex-1 overflow-y-auto px-3 py-2  gap-y-1">
        {characters.map((char) => {
          const Icon = ENTITY_ICONS[char.entityType] ?? UserRound;
          const statusStyle = STATUS_STYLES[char.refStatus] ?? STATUS_STYLES.PENDING;

          return (
            <div
              key={char.id}
              className="group flex items-center gap-2.5 rounded-lg p-2 transition-colors hover:bg-accent/40"
            >
              {/* Avatar */}
              <div className="relative size-9 shrink-0">
                {char.referenceImageUrl ? (
                  <Image
                    src={char.referenceImageUrl}
                    alt={char.name}
                    fill
                    className="object-cover rounded-lg"
                    sizes="36px"
                    unoptimized
                  />
                ) : (
                  <div className={cn(
                    'flex size-9 items-center justify-center rounded-lg ring-1',
                    statusStyle.bg, statusStyle.ring
                  )}>
                    <Icon className="size-4 text-muted-foreground" />
                  </div>
                )}
                {/* Status indicator */}
                <div className={cn(
                  'absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-background',
                  char.refStatus === 'COMPLETED' ? 'bg-emerald-400' :
                  char.refStatus === 'PROCESSING' ? 'bg-blue-400 animate-pulse' :
                  char.refStatus === 'FAILED' ? 'bg-red-400' : 'bg-amber-400'
                )} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="truncate text-xs font-medium text-foreground">{char.name}</p>
                <p className="text-[10px] capitalize text-muted-foreground">{char.entityType.replace('_', ' ')}</p>
              </div>

              {/* Delete */}
              <button
                onClick={() => onDelete(char.id)}
                className="rounded p-1 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-500/10"
              >
                <Trash2 className="size-3 text-red-400/60" />
              </button>
            </div>
          );
        })}

        {characters.length === 0 && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex w-full flex-col items-center justify-center py-8 text-muted-foreground/30 transition-colors hover:text-muted-foreground"
          >
            <Plus className="size-6 mb-1" />
            <span className="text-[10px]">Add your first entity</span>
          </button>
        )}
      </div>
    </div>
  );
}
