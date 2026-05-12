'use client';

import React, { useReducer } from 'react';
import {
  Download,
  Film,
  Music,
  Mic2,
  Loader2,
  CheckCircle2,
  Volume2,
  Settings2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { visualFlowApi } from '@/services/visualFlowApi';
import { toast } from 'sonner';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface ExportPanelProps {
  projectId: string;
  videoId: string;
  sceneCount: number;
}

type ExportStep = 'idle' | 'concat' | 'music' | 'narration' | 'done';

type ExportPanelState = {
  step: ExportStep;
  orientation: 'VERTICAL' | 'HORIZONTAL';
  musicUrl: string;
  musicVolume: number[];
  resultUrl: string | null;
  isGeneratingMusic: boolean;
  musicPrompt: string;
};

type ExportPanelAction =
  | { type: 'setStep'; step: ExportStep }
  | { type: 'setOrientation'; orientation: 'VERTICAL' | 'HORIZONTAL' }
  | { type: 'setMusicUrl'; musicUrl: string }
  | { type: 'setMusicVolume'; musicVolume: number[] }
  | { type: 'setResultUrl'; resultUrl: string | null }
  | { type: 'setIsGeneratingMusic'; isGeneratingMusic: boolean }
  | { type: 'setMusicPrompt'; musicPrompt: string };

const initialExportPanelState: ExportPanelState = {
  step: 'idle',
  orientation: 'VERTICAL',
  musicUrl: '',
  musicVolume: [30],
  resultUrl: null,
  isGeneratingMusic: false,
  musicPrompt: '',
};

function exportPanelReducer(state: ExportPanelState, action: ExportPanelAction): ExportPanelState {
  switch (action.type) {
    case 'setStep':
      return { ...state, step: action.step };
    case 'setOrientation':
      return { ...state, orientation: action.orientation };
    case 'setMusicUrl':
      return { ...state, musicUrl: action.musicUrl };
    case 'setMusicVolume':
      return { ...state, musicVolume: action.musicVolume };
    case 'setResultUrl':
      return { ...state, resultUrl: action.resultUrl };
    case 'setIsGeneratingMusic':
      return { ...state, isGeneratingMusic: action.isGeneratingMusic };
    case 'setMusicPrompt':
      return { ...state, musicPrompt: action.musicPrompt };
    default:
      return state;
  }
}

const isMissingRenderedVideoError = (error: unknown) => {
  let message = '';
  if (error && typeof error === 'object' && 'response' in error) {
    const response = error as {
      response?: { data?: { message?: unknown } };
    };
    const responseMessage = response.response?.data?.message;
    if (Array.isArray(responseMessage)) {
      message = responseMessage.join(' ');
    } else if (typeof responseMessage === 'string') {
      message = responseMessage;
    } else if (responseMessage !== undefined && responseMessage !== null) {
      message = String(responseMessage);
    }
  } else if (error instanceof Error) {
    message = error.message;
  } else {
    message = String(error);
  }

  return (
    message.includes('No vertical videos found to concatenate') ||
    message.includes('No horizontal videos found to concatenate') ||
    message.includes('No videos found to concatenate')
  );
};

// ─────────────────────────────────────────────
// Export Panel Component
// ─────────────────────────────────────────────

export function ExportPanel({ projectId, videoId, sceneCount }: ExportPanelProps) {
  const [state, dispatch] = useReducer(exportPanelReducer, initialExportPanelState);
  const { step, orientation, musicUrl, musicVolume, resultUrl, isGeneratingMusic, musicPrompt } = state;

  // ── Concat ──────────────────────────────
  const handleConcat = async () => {
    dispatch({ type: 'setStep', step: 'concat' });
    try {
      const result = await visualFlowApi.pipeline.concat(projectId, videoId, {
        orientation,
        musicUrl: musicUrl || undefined,
        musicVolume: musicVolume[0] / 100,
      });
      dispatch({ type: 'setResultUrl', resultUrl: result?.url || result?.outputUrl || null });
      dispatch({ type: 'setStep', step: 'done' });
      toast.success('Video exported successfully!');
    } catch (error) {
      if (isMissingRenderedVideoError(error)) {
        try {
          const fallback = await visualFlowApi.pipeline.slideshow(projectId, videoId, {
            orientation,
            musicUrl: musicUrl || undefined,
            musicVolume: musicVolume[0] / 100,
            zoomEffect: true,
          });
          dispatch({ type: 'setResultUrl', resultUrl: fallback?.url || fallback?.outputUrl || null });
          dispatch({ type: 'setStep', step: 'done' });
          toast.success('No rendered clips were ready yet, so a slideshow export was created instead.');
          return;
        } catch (fallbackError) {
          console.error('Slideshow fallback failed', fallbackError);
        }
      }

      console.error('Export failed', error);
      toast.error(
        isMissingRenderedVideoError(error)
          ? 'No rendered scene videos were ready yet. Generate videos first or use the slideshow export.'
          : 'Export failed',
      );
      dispatch({ type: 'setStep', step: 'idle' });
    }
  };

  // ── Slideshow ───────────────────────────
  const handleSlideshow = async () => {
    dispatch({ type: 'setStep', step: 'concat' });
    try {
      const result = await visualFlowApi.pipeline.slideshow(projectId, videoId, {
        orientation,
        musicUrl: musicUrl || undefined,
        musicVolume: musicVolume[0] / 100,
        zoomEffect: true,
      });
      dispatch({ type: 'setResultUrl', resultUrl: result?.url || result?.outputUrl || null });
      dispatch({ type: 'setStep', step: 'done' });
      toast.success('Slideshow created!');
    } catch (error) {
      console.error('Slideshow failed', error);
      toast.error('Slideshow failed');
      dispatch({ type: 'setStep', step: 'idle' });
    }
  };

  // ── Generate Music ──────────────────────
  const handleGenerateMusic = async () => {
    if (!musicPrompt.trim()) return;
    dispatch({ type: 'setIsGeneratingMusic', isGeneratingMusic: true });
    try {
      const result = await visualFlowApi.music.generate({
        prompt: musicPrompt,
        instrumental: true,
        poll: true,
      });
      if (result?.audioUrl) {
        dispatch({ type: 'setMusicUrl', musicUrl: result.audioUrl });
        toast.success('Music generated!');
      }
    } catch (error) {
      console.error('Music gen failed', error);
      toast.error('Failed to generate music');
    }
    dispatch({ type: 'setIsGeneratingMusic', isGeneratingMusic: false });
  };

  // ── Narration ───────────────────────────
  const handleNarration = async () => {
    dispatch({ type: 'setStep', step: 'narration' });
    try {
      await visualFlowApi.tts.generateNarration(projectId, videoId, {
        orientation: orientation,
        overlayOnVideos: true,
      });
      toast.success('Narration added!');
      dispatch({ type: 'setStep', step: 'idle' });
    } catch (error) {
      console.error('Narration failed', error);
      toast.error('Narration failed');
      dispatch({ type: 'setStep', step: 'idle' });
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20">
          <Download className="size-4 text-emerald-400" />
        </div>
        <div>
          <h3 className="text-xs font-semibold text-foreground">Export</h3>
          <p className="text-[10px] text-muted-foreground">{sceneCount} scenes ready</p>
        </div>
      </div>

      {/* Orientation toggle */}
      <div>
        <p className="mb-1.5 block text-[10px] font-medium text-muted-foreground">
          Orientation
        </p>
        <div className="flex gap-2">
          {(['VERTICAL', 'HORIZONTAL'] as const).map((o) => (
            <button
              key={o}
              onClick={() => dispatch({ type: 'setOrientation', orientation: o })}
              className={cn(
                'flex-1 py-2 rounded-lg text-xs font-medium border transition-all',
                orientation === o
                ? 'border-violet-500/30 bg-violet-500/15 text-violet-300'
                  : 'border-border bg-muted/20 text-muted-foreground hover:border-border/80'
              )}
            >
              {o === 'VERTICAL' ? '9:16' : '16:9'}
            </button>
          ))}
        </div>
      </div>

      {/* Music section */}
      <div className="space-y-2">
        <label htmlFor="export-background-music-url" className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground">
          <Music className="size-3" /> Background Music
        </label>
        <Input
          id="export-background-music-url"
          value={musicUrl}
          onChange={(e) => dispatch({ type: 'setMusicUrl', musicUrl: e.target.value })}
          placeholder="Music URL (optional)?"
          className="h-8 border-border bg-background text-xs text-foreground placeholder:text-muted-foreground"
        />

        {/* AI Music Generator */}
        <div className="flex gap-1.5">
          <Input
            value={musicPrompt}
            onChange={(e) => dispatch({ type: 'setMusicPrompt', musicPrompt: e.target.value })}
            placeholder="Generate: 'epic cinematic orchestra'?"
            className="h-7 flex-1 border-border bg-muted/20 text-[10px] text-foreground placeholder:text-muted-foreground"
          />
          <Button
            size="xs"
            onClick={handleGenerateMusic}
            disabled={isGeneratingMusic || !musicPrompt.trim()}
            className="h-7 border border-pink-500/20 bg-pink-600/20 text-[10px] text-pink-300 hover:bg-pink-600/30"
          >
            {isGeneratingMusic ? <Loader2 className="size-3 animate-spin" /> : <Music className="size-3" />}
          </Button>
        </div>

        {/* Volume slider */}
        {musicUrl && (
          <div className="flex items-center gap-2">
            <Volume2 className="size-3 text-muted-foreground/30" />
            <Slider
              value={musicVolume}
              onValueChange={(value) => dispatch({ type: 'setMusicVolume', musicVolume: value })}
              max={100}
              step={5}
              className="flex-1"
            />
            <span className="w-7 text-right font-mono text-[10px] text-muted-foreground">{musicVolume}%</span>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="space-y-2 pt-2">
        <Button
          onClick={handleConcat}
          disabled={step !== 'idle' && step !== 'done' || sceneCount === 0}
          className="h-9 w-full bg-emerald-600 text-xs text-white hover:bg-emerald-500"
        >
          {step === 'concat' ? (
            <Loader2 className="size-4 animate-spin mr-2" />
          ) : step === 'done' ? (
            <CheckCircle2 className="size-4 mr-2" />
          ) : (
            <Film className="size-4 mr-2" />
          )}
          {step === 'done' ? 'Re-export Video' : 'Export Video'}
        </Button>

        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={handleSlideshow}
            disabled={step !== 'idle' && step !== 'done' || sceneCount === 0}
            variant="outline"
            size="sm"
            className="h-7 border-border text-[10px] text-muted-foreground hover:bg-accent"
          >
            <Settings2 className="size-3 mr-1" /> Slideshow
          </Button>
          <Button
            onClick={handleNarration}
            disabled={step !== 'idle' && step !== 'done'}
            variant="outline"
            size="sm"
            className="h-7 border-border text-[10px] text-muted-foreground hover:bg-accent"
          >
            <Mic2 className="size-3 mr-1" /> Narration
          </Button>
        </div>
      </div>

      {/* Result download */}
      {resultUrl && (
        <div className="rounded-lg bg-emerald-500/[0.06] border border-emerald-500/15 p-3 space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-emerald-400" />
            <span className="text-xs text-emerald-300 font-medium">Export Complete</span>
          </div>
          <a
            href={resultUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-[11px] text-emerald-400 hover:text-emerald-300 transition underline underline-offset-2"
          >
            <Download className="size-3" />
            Download Video
          </a>
        </div>
      )}
    </div>
  );
}
