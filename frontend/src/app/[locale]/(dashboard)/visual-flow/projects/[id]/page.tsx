'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Plus,
  Film,
  Loader2,
  Clapperboard,
  ChevronRight,
  Layers,
  Settings2,
  Download,
  Music,
  Mic2,
  Palette,
  PanelRightClose,
  PanelRightOpen,
  SlidersHorizontal,
  Activity,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import {
  visualFlowApi,
  type ChainType,
} from '@/services/visualFlowApi';
import { useVisualFlowStore } from '@/stores/visual-flow-store';

// Components
import { CharacterPanel } from '@/components/studio/CharacterPanel';
import { SceneTimeline } from '@/components/studio/SceneTimeline';
import { PipelineControl } from '@/components/studio/PipelineControl';
import { SceneProperties } from '@/components/studio/SceneProperties';
import { ExportPanel } from '@/components/studio/ExportPanel';
import { useVisualFlowSSE } from '@/hooks/useVisualFlowSSE';

// ─────────────────────────────────────────────
// Add Scene Dialog
// ─────────────────────────────────────────────

function AddSceneDialog({
  open,
  onClose,
  projectId,
  videoId,
  scenes,
  characterNames,
}: {
  open: boolean;
  onClose: () => void;
  projectId: string;
  videoId: string;
  scenes: { id: string; displayOrder: number; chainType: string }[];
  characterNames: string[];
}) {
  const { addScene } = useVisualFlowStore();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    prompt: '',
    videoPrompt: '',
    chainType: 'ROOT' as ChainType,
    parentSceneId: '',
    selectedChars: [] as string[],
  });

  const handleSubmit = async () => {
    if (!form.prompt.trim()) return;
    setLoading(true);
    await addScene(projectId, {
      videoId,
      prompt: form.prompt,
      videoPrompt: form.videoPrompt || undefined,
      chainType: form.chainType,
      parentSceneId: form.chainType === 'CONTINUATION' ? form.parentSceneId || undefined : undefined,
      characterNames: form.selectedChars,
      displayOrder: scenes.length,
    });
    setForm({ prompt: '', videoPrompt: '', chainType: 'ROOT', parentSceneId: '', selectedChars: [] });
    onClose();
    setLoading(false);
  };

  const toggleChar = (name: string) => {
    setForm((p) => ({
      ...p,
      selectedChars: p.selectedChars.includes(name)
        ? p.selectedChars.filter((c) => c !== name)
        : [...p.selectedChars, name],
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-[#111118] border-white/[0.08] text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Layers className="w-5 h-5 text-violet-400" />
            Add Scene
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* Chain Type */}
          <div>
            <label className="text-[10px] text-white/30 uppercase tracking-widest font-medium">Chain Type</label>
            <div className="flex gap-2 mt-1.5">
              {(['ROOT', 'CONTINUATION'] as ChainType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setForm((p) => ({ ...p, chainType: t }))}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                    form.chainType === t
                      ? 'border-violet-500/50 bg-violet-500/15 text-violet-300'
                      : 'border-white/[0.08] text-white/30 hover:border-white/15'
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Parent scene selector */}
          {form.chainType === 'CONTINUATION' && scenes.length > 0 && (
            <div>
              <label className="text-[10px] text-white/30 uppercase tracking-widest font-medium">Continues from</label>
              <select
                value={form.parentSceneId}
                onChange={(e) => setForm((p) => ({ ...p, parentSceneId: e.target.value }))}
                className="mt-1.5 w-full bg-white/5 border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white"
              >
                <option value="">Select parent scene...</option>
                {scenes.map((s, i) => (
                  <option key={s.id} value={s.id}>Scene {i + 1} ({s.chainType})</option>
                ))}
              </select>
            </div>
          )}

          {/* Image Prompt */}
          <div>
            <label className="text-[10px] text-white/30 uppercase tracking-widest font-medium">Image Prompt *</label>
            <Textarea
              value={form.prompt}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm((p) => ({ ...p, prompt: e.target.value }))}
              placeholder='Describe the frame: "Luna stands on the candy planet surface, sunrise, wide shot"'
              rows={3}
              className="mt-1.5 bg-white/5 border-white/[0.08] text-white placeholder:text-white/15 resize-none text-sm"
            />
          </div>

          {/* Video Prompt */}
          <div>
            <label className="text-[10px] text-white/30 uppercase tracking-widest font-medium">Video Motion Prompt</label>
            <Textarea
              value={form.videoPrompt}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm((p) => ({ ...p, videoPrompt: e.target.value }))}
              placeholder='Optional: "0-3s: wide crane down. 3-6s: tracking shot."'
              rows={2}
              className="mt-1.5 bg-white/5 border-white/[0.08] text-white placeholder:text-white/15 resize-none text-xs"
            />
          </div>

          {/* Characters */}
          {characterNames.length > 0 && (
            <div>
              <label className="text-[10px] text-white/30 uppercase tracking-widest font-medium">Characters</label>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {characterNames.map((name) => (
                  <button
                    key={name}
                    onClick={() => toggleChar(name)}
                    className={cn(
                      'px-2.5 py-1 rounded-full text-[11px] border transition-all',
                      form.selectedChars.includes(name)
                        ? 'bg-violet-500/20 border-violet-500/40 text-violet-300'
                        : 'bg-white/[0.03] border-white/[0.06] text-white/30 hover:border-white/15'
                    )}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-white/30">Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !form.prompt.trim()}
            className="bg-violet-600 hover:bg-violet-500 text-white"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            Add Scene
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────
// Main Studio Page
// ─────────────────────────────────────────────

export default function VisualProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id as string;

  // Store
  const {
    project,
    characters,
    videos,
    scenes,
    activeVideo,
    selectedScene,
    pipelineStatus,
    isLoading,
    isInitialized,
    runningStep,
    loadProject,
    addCharacter,
    deleteCharacter,
    createVideo,
    setActiveVideo,
    loadScenes,
    loadPipelineStatus,
    updateScene,
    deleteScene,
    selectScene,
    generateRefs,
    generateImages,
    generateVideos,
    concatScenes,
    startPolling,
    stopPolling,
    reset,
  } = useVisualFlowStore();

  // Local UI state
  const [showAddScene, setShowAddScene] = useState(false);
  const [showAddVideo, setShowAddVideo] = useState(false);
  const [videoTitle, setVideoTitle] = useState('');
  const [rightPanelOpen, setRightPanelOpen] = useState(true);

  // ── SSE Real-time Updates ─────────────────
  const { isConnected: sseConnected } = useVisualFlowSSE({
    projectId: projectId ?? null,
    enabled: !!projectId && isInitialized,
    onCharacterUpdate: (payload) => {
      // Refresh characters when a ref status changes
      if (projectId) loadProject(projectId);
    },
    onSceneUpdate: (payload) => {
      // Refresh scenes + pipeline when a scene status changes
      if (projectId && activeVideo) {
        loadScenes(projectId, activeVideo.id);
        loadPipelineStatus(projectId, activeVideo.id);
      }
    },
    onPipelineStatus: (payload) => {
      // Direct pipeline status push
      if (projectId && activeVideo) {
        loadPipelineStatus(projectId, activeVideo.id);
      }
    },
  });

  // ── Init ──────────────────────────────────
  useEffect(() => {
    if (projectId) {
      loadProject(projectId);
    }
    return () => {
      stopPolling();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // ── Load scenes when active video changes ─
  useEffect(() => {
    if (projectId && activeVideo?.id) {
      loadScenes(projectId, activeVideo.id);
      loadPipelineStatus(projectId, activeVideo.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeVideo?.id, projectId]);

  // ── Handlers ──────────────────────────────
  const handleCreateVideo = async () => {
    if (!videoTitle.trim()) return;
    await createVideo(projectId, videoTitle);
    setShowAddVideo(false);
    setVideoTitle('');
  };

  const handleRefresh = () => {
    if (activeVideo) {
      loadPipelineStatus(projectId, activeVideo.id);
    }
  };

  const charNames = characters.map((c) => c.name);

  // ── Loading state ─────────────────────────
  if (isLoading && !isInitialized) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
          <p className="text-xs text-white/20">Loading studio...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="h-full flex items-center justify-center text-white/30 text-sm">
        Project not found.
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#08080d] text-white overflow-hidden">
      {/* ═══ Top Bar ═══ */}
      <div className="shrink-0 h-12 flex items-center gap-3 px-4 border-b border-white/[0.06] bg-[#0a0a10]/80 backdrop-blur-xl z-20">
        <button
          onClick={() => router.back()}
          className="p-1.5 hover:bg-white/[0.06] rounded-lg transition text-white/40 hover:text-white/70"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 min-w-0 flex-1">
          <h1 className="text-sm font-semibold truncate">{project.name}</h1>
          {project.story && (
            <span className="hidden sm:block text-[10px] text-white/15 truncate max-w-[200px]">
              — {project.story}
            </span>
          )}

          {/* SSE Status Indicator */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={cn(
                "flex items-center gap-1.5 ml-3 px-2 py-1 rounded-full text-[10px] font-medium border transition-colors",
                sseConnected 
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                  : "bg-red-500/10 border-red-500/20 text-red-400"
              )}>
                <Activity className={cn("w-3 h-3", sseConnected && "animate-pulse")} />
                {sseConnected ? 'Live' : 'Offline'}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {sseConnected ? 'Real-time updates connected' : 'Disconnected from real-time updates'}
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon-xs"
                variant="ghost"
                onClick={() => setRightPanelOpen(!rightPanelOpen)}
                className="text-white/30 hover:text-white/60"
              >
                {rightPanelOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{rightPanelOpen ? 'Close panel' : 'Open panel'}</TooltipContent>
          </Tooltip>

          <Button
            onClick={() => setShowAddScene(true)}
            disabled={!activeVideo}
            size="sm"
            className="bg-violet-600 hover:bg-violet-500 text-white text-xs h-7 rounded-lg"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Scene
          </Button>
        </div>
      </div>

      {/* ═══ Main Content ═══ */}
      <div className="flex-1 flex overflow-hidden">
        {/* ─── Left Sidebar: Characters + Videos ─── */}
        <div className="w-56 shrink-0 border-r border-white/[0.06] flex flex-col bg-[#0a0a10]/40 overflow-hidden">
          {/* Characters section */}
          <div className="flex-1 min-h-0 border-b border-white/[0.06] overflow-hidden">
            <CharacterPanel
              characters={characters}
              projectId={projectId}
              onAdd={(data) => addCharacter(projectId, data)}
              onDelete={(charId) => deleteCharacter(projectId, charId)}
              onGenerateRefs={(ids) => generateRefs(projectId, ids)}
              isGenerating={runningStep === 'refs'}
            />
          </div>

          {/* Videos section */}
          <div className="shrink-0 max-h-[40%] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-white/50">
                Videos ({videos.length})
              </h3>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setShowAddVideo(true)}
                    className="p-1 hover:bg-white/10 rounded-md transition text-white/30 hover:text-white/60"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>New Video</TooltipContent>
              </Tooltip>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
              {videos.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setActiveVideo(v)}
                  className={cn(
                    'w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs transition text-left',
                    activeVideo?.id === v.id
                      ? 'bg-violet-500/15 text-white border border-violet-500/20'
                      : 'hover:bg-white/[0.04] text-white/35 border border-transparent'
                  )}
                >
                  <Clapperboard className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate flex-1">{v.title}</span>
                  {activeVideo?.id === v.id && <ChevronRight className="w-3 h-3 text-violet-400" />}
                </button>
              ))}
              {videos.length === 0 && (
                <button
                  onClick={() => setShowAddVideo(true)}
                  className="w-full flex flex-col items-center py-6 text-white/15 hover:text-white/30 transition"
                >
                  <Film className="w-5 h-5 mb-1" />
                  <span className="text-[10px]">Create first video</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ─── Main Area ─── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {!activeVideo ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-white/15">
              <div className="w-16 h-16 rounded-2xl bg-white/[0.02] flex items-center justify-center border border-white/[0.04]">
                <Film className="w-8 h-8" />
              </div>
              <div className="text-center">
                <p className="text-sm text-white/25">Create a video to start</p>
                <p className="text-[11px] text-white/10 mt-1">Each video is an episode with its own scenes</p>
              </div>
              <Button
                onClick={() => setShowAddVideo(true)}
                variant="outline"
                size="sm"
                className="border-white/[0.08] text-white/40 hover:bg-white/[0.04] text-xs"
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" /> New Video
              </Button>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              <div className="p-5 space-y-5">
                {/* Pipeline Control */}
                <PipelineControl
                  status={pipelineStatus}
                  runningStep={runningStep}
                  charCount={characters.length}
                  onGenerateRefs={() => generateRefs(projectId)}
                  onGenerateImages={() => activeVideo && generateImages(projectId, activeVideo.id)}
                  onGenerateVideos={() => activeVideo && generateVideos(projectId, activeVideo.id)}
                  onRefresh={handleRefresh}
                />

                {/* Scene Timeline */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-semibold uppercase tracking-widest text-white/50 flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5" />
                      Scenes ({scenes.length})
                    </h3>
                    {scenes.length > 0 && (
                      <div className="flex gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon-xs"
                              variant="ghost"
                              onClick={() => activeVideo && concatScenes(projectId, activeVideo.id)}
                              disabled={!!runningStep || scenes.length === 0}
                              className="text-white/25 hover:text-white/50"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Export / Concat Videos</TooltipContent>
                        </Tooltip>
                      </div>
                    )}
                  </div>
                  <SceneTimeline
                    scenes={scenes}
                    selectedScene={selectedScene}
                    onSelect={selectScene}
                    onUpdate={(id, data) => updateScene(id, data)}
                    onDelete={(id) => deleteScene(id)}
                    onAddScene={() => setShowAddScene(true)}
                  />
                </div>

                {/* Export Panel */}
                {scenes.length > 0 && activeVideo && (
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-5">
                    <ExportPanel
                      projectId={projectId}
                      videoId={activeVideo.id}
                      sceneCount={scenes.length}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ─── Right Panel: Scene Properties ─── */}
        {rightPanelOpen && selectedScene && (
          <div className="w-72 shrink-0 border-l border-white/[0.06] bg-[#0a0a10]/40 overflow-hidden animate-in slide-in-from-right-4 duration-200">
            <SceneProperties
              scene={selectedScene}
              onUpdate={(data) => updateScene(selectedScene.id, data)}
              availableCharacters={charNames}
            />
          </div>
        )}
      </div>

      {/* ═══ Dialogs ═══ */}
      <AddSceneDialog
        open={showAddScene}
        onClose={() => setShowAddScene(false)}
        projectId={projectId}
        videoId={activeVideo?.id ?? ''}
        scenes={scenes.map((s) => ({ id: s.id, displayOrder: s.displayOrder, chainType: s.chainType }))}
        characterNames={charNames}
      />

      <Dialog open={showAddVideo} onOpenChange={setShowAddVideo}>
        <DialogContent className="max-w-sm bg-[#111118] border-white/[0.08] text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Film className="w-5 h-5 text-pink-400" />
              New Video / Episode
            </DialogTitle>
          </DialogHeader>
          <Input
            value={videoTitle}
            onChange={(e) => setVideoTitle(e.target.value)}
            placeholder="Episode title..."
            className="bg-white/5 border-white/[0.08] text-white placeholder:text-white/20"
            onKeyDown={(e) => e.key === 'Enter' && handleCreateVideo()}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAddVideo(false)} className="text-white/30">
              Cancel
            </Button>
            <Button
              onClick={handleCreateVideo}
              disabled={!videoTitle.trim()}
              className="bg-violet-600 hover:bg-violet-500 text-white"
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
