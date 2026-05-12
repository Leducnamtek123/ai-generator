'use client';

import React from 'react';
import {
  ImageIcon,
  Sparkles,
  Play,
  Loader2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { PipelineStatus } from '@/services/visualFlowApi';
import type { PipelineStep } from '@/stores/visual-flow-store';

// ─────────────────────────────────────────────
// Progress Ring (circular progress)
// ─────────────────────────────────────────────

function ProgressRing({ value, size = 40, stroke = 3, color }: {
  value: number;
  size?: number;
  stroke?: number;
  color: string;
}) {
  const radius = (size - stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        className="text-muted-foreground/20"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-700 ease-out"
      />
    </svg>
  );
}

// ─────────────────────────────────────────────
// Pipeline Step Card
// ─────────────────────────────────────────────

interface StepCardProps {
  label: string;
  icon: React.ReactNode;
  done: number;
  total: number;
  color: string;
  gradientFrom: string;
  gradientTo: string;
  isRunning: boolean;
  disabled: boolean;
  onRun: () => void;
}

function StepCard({ label, icon, done, total, color, gradientFrom, gradientTo, isRunning, disabled, onRun }: StepCardProps) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const isComplete = done === total && total > 0;

  return (
    <div className={cn(
      'relative rounded-xl border p-4 transition-all',
      isComplete
        ? 'border-emerald-500/20 bg-emerald-500/[0.03]'
        : 'border-border bg-card hover:bg-accent/30'
    )}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={cn(
            'size-8 rounded-lg flex items-center justify-center',
            `bg-gradient-to-br ${gradientFrom} ${gradientTo}`
          )}>
            {icon}
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{label}</p>
            <p className="font-mono text-[10px] text-muted-foreground">{done}/{total}</p>
          </div>
        </div>
        <div className="relative">
          <ProgressRing value={pct} size={36} stroke={2.5} color={color} />
          <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-muted-foreground">
            {pct}%
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-3 h-1 overflow-hidden rounded-full bg-muted/50">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-700',
            isComplete ? 'bg-emerald-500' : `bg-gradient-to-r ${gradientFrom} ${gradientTo}`
          )}
          style={{ width: `${pct}%` }}
        />
      </div>

      <Button
        onClick={onRun}
        disabled={disabled || isRunning}
        size="sm"
          className={cn(
            'h-7 w-full text-xs',
            isComplete
              ? 'border border-emerald-500/20 bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30'
              : 'border border-border bg-muted/20 text-muted-foreground hover:bg-accent/40'
        )}
      >
        {isRunning ? (
          <Loader2 className="size-3 animate-spin mr-1.5" />
        ) : isComplete ? (
          <CheckCircle2 className="size-3 mr-1.5" />
        ) : (
          <Zap className="size-3 mr-1.5" />
        )}
        {isRunning ? 'Running...' : isComplete ? 'Regenerate' : 'Generate'}
      </Button>
    </div>
  );
}

// ─────────────────────────────────────────────
// Pipeline Control Panel
// ─────────────────────────────────────────────

interface PipelineControlProps {
  status: PipelineStatus | null;
  runningStep: PipelineStep;
  charCount: number;
  onGenerateRefs: () => void;
  onGenerateImages: () => void;
  onGenerateVideos: () => void;
  onRefresh: () => void;
}

export function PipelineControl({
  status,
  runningStep,
  charCount,
  onGenerateRefs,
  onGenerateImages,
  onGenerateVideos,
  onRefresh,
}: PipelineControlProps) {
  if (!status) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
        Select a video to see pipeline status
      </div>
    );
  }

  const hasAnyRunning = !!runningStep;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Zap className="size-3.5 text-amber-400" />
          Generation Pipeline
        </h3>
        <button
          onClick={onRefresh}
          className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-accent hover:text-foreground"
        >
          <RefreshCw className="size-3.5" />
        </button>
      </div>

      {/* Step Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StepCard
          label="Reference Images"
          icon={<ImageIcon className="size-4 text-violet-300" />}
          done={status.characters.completed}
          total={status.characters.total}
          color="#8b5cf6"
          gradientFrom="from-violet-500/20"
          gradientTo="to-purple-500/20"
          isRunning={runningStep === 'refs'}
          disabled={hasAnyRunning || charCount === 0}
          onRun={onGenerateRefs}
        />

        <StepCard
          label="Scene Images"
          icon={<Sparkles className="size-4 text-blue-300" />}
          done={status.scenes.verticalImages.completed}
          total={status.scenes.total}
          color="#3b82f6"
          gradientFrom="from-blue-500/20"
          gradientTo="to-cyan-500/20"
          isRunning={runningStep === 'images'}
          disabled={hasAnyRunning || status.scenes.total === 0}
          onRun={onGenerateImages}
        />

        <StepCard
          label="Video Clips"
          icon={<Play className="size-4 text-pink-300" />}
          done={status.scenes.verticalVideos.completed}
          total={status.scenes.total}
          color="#ec4899"
          gradientFrom="from-pink-500/20"
          gradientTo="to-rose-500/20"
          isRunning={runningStep === 'videos'}
          disabled={hasAnyRunning || status.scenes.total === 0}
          onRun={onGenerateVideos}
        />
      </div>

      {/* Failed warnings */}
      {(status.characters.failed > 0 ||
        status.scenes.verticalImages.failed > 0 ||
        status.scenes.verticalVideos.failed > 0) && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/10 bg-red-500/[0.06] px-3 py-2 text-[11px] text-red-400/60">
          <XCircle className="size-3.5 shrink-0" />
          <span>
            Some generations failed ,{' '}
            {status.characters.failed > 0 && `${status.characters.failed} refs, `}
            {status.scenes.verticalImages.failed > 0 && `${status.scenes.verticalImages.failed} images, `}
            {status.scenes.verticalVideos.failed > 0 && `${status.scenes.verticalVideos.failed} videos`}
            . Click Generate to retry.
          </span>
        </div>
      )}
    </div>
  );
}
