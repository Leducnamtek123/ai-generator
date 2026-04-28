'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Plus,
  Wand2,
  Film,
  ImageIcon,
  Loader2,
  ChevronRight,
  Layers,
  Users,
  Link2,
  Clapperboard,
  Play,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/ui/button';
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
  visualFlowApi,
  VisualProject,
  VisualVideo,
  PipelineStatus,
  ChainType,
} from '@/services/visualFlowApi';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const STATUS_COLOR: Record<string, string> = {
  PENDING: 'bg-yellow-400',
  PROCESSING: 'bg-blue-400',
  COMPLETED: 'bg-emerald-400',
  FAILED: 'bg-red-400',
};

function StatusDot({ status }: { status: string }) {
  return (
    <span className={cn('inline-block w-2 h-2 rounded-full', STATUS_COLOR[status] ?? 'bg-gray-400')} />
  );
}

function PipelineProgressBar({ label, done, total }: { label: string; done: number; total: number }) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs text-white/50 mb-1.5">
        <span>{label}</span>
        <span className="font-mono">{done}/{total} ({pct}%)</span>
      </div>
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-violet-500 to-pink-500 transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Scene Card
// ─────────────────────────────────────────────

function SceneCard({ scene, index }: { scene: PipelineStatus['sceneList'][0]; index: number }) {
  return (
    <div className="relative rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden group">
      {/* Chain connector */}
      {scene.chainType === 'CONTINUATION' && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <div className="flex flex-col items-center">
            <div className="w-px h-3 bg-violet-500/50" />
            <Link2 className="w-3.5 h-3.5 text-violet-400" />
          </div>
        </div>
      )}

      {/* Image/Video preview */}
      <div className="grid grid-cols-2 h-24">
        {/* Vertical preview */}
        <div className="relative border-r border-white/10 bg-black/30 flex items-center justify-center">
          {scene.verticalImageUrl ? (
            <img src={scene.verticalImageUrl} alt="vertical" className="h-full w-full object-cover" />
          ) : (
            <ImageIcon className="w-6 h-6 text-white/10" />
          )}
          <div className="absolute bottom-1 left-1">
            <StatusDot status={scene.verticalImageStatus} />
          </div>
          <div className="absolute bottom-1 right-1 text-[8px] text-white/30">9:16</div>
        </div>
        {/* Horizontal preview */}
        <div className="relative bg-black/30 flex items-center justify-center">
          {scene.horizontalImageUrl ? (
            <img src={scene.horizontalImageUrl} alt="horizontal" className="h-full w-full object-cover" />
          ) : (
            <ImageIcon className="w-6 h-6 text-white/10" />
          )}
          <div className="absolute bottom-1 left-1">
            <StatusDot status={scene.horizontalImageStatus} />
          </div>
          <div className="absolute bottom-1 right-1 text-[8px] text-white/30">16:9</div>
        </div>
      </div>

      {/* Scene info */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold text-white/40">SCENE {index + 1}</span>
          <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium',
            scene.chainType === 'ROOT' ? 'bg-violet-500/20 text-violet-400' : 'bg-blue-500/20 text-blue-400'
          )}>
            {scene.chainType}
          </span>
        </div>
        {scene.characterNames?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {scene.characterNames.slice(0, 3).map((n) => (
              <span key={n} className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-white/40">{n}</span>
            ))}
            {scene.characterNames.length > 3 && (
              <span className="text-[9px] text-white/30">+{scene.characterNames.length - 3}</span>
            )}
          </div>
        )}
        {/* Video statuses */}
        <div className="flex gap-2 mt-2">
          <div className="flex items-center gap-1 text-[10px] text-white/30">
            <StatusDot status={scene.verticalVideoStatus} /> V.Video
          </div>
          <div className="flex items-center gap-1 text-[10px] text-white/30">
            <StatusDot status={scene.horizontalVideoStatus} /> H.Video
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Add Scene Dialog
// ─────────────────────────────────────────────

interface AddSceneDialogProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  videoId: string;
  existingScenes: PipelineStatus['sceneList'];
  characterNames: string[];
  onCreated: () => void;
}

function AddSceneDialog({ open, onClose, projectId, videoId, existingScenes, characterNames, onCreated }: AddSceneDialogProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    prompt: '',
    videoPrompt: '',
    chainType: 'ROOT' as ChainType,
    parentSceneId: '',
    selectedChars: [] as string[],
    displayOrder: existingScenes.length,
  });

  const handleSubmit = async () => {
    if (!form.prompt.trim()) return;
    setLoading(true);
    try {
      await visualFlowApi.scenes.create(projectId, {
        videoId,
        prompt: form.prompt,
        videoPrompt: form.videoPrompt || undefined,
        chainType: form.chainType,
        parentSceneId: form.chainType === 'CONTINUATION' ? form.parentSceneId : undefined,
        characterNames: form.selectedChars,
        displayOrder: form.displayOrder,
      });
      onCreated();
      onClose();
      setForm({ prompt: '', videoPrompt: '', chainType: 'ROOT', parentSceneId: '', selectedChars: [], displayOrder: existingScenes.length });
    } finally {
      setLoading(false);
    }
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
      <DialogContent className="max-w-lg bg-zinc-900 border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-400" />
            Add Scene
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <label className="text-xs text-white/40 uppercase tracking-widest">Chain Type</label>
            <div className="flex gap-2 mt-1.5">
              {(['ROOT', 'CONTINUATION'] as ChainType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setForm((p) => ({ ...p, chainType: t }))}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium border transition-all',
                    form.chainType === t
                      ? 'border-violet-500 bg-violet-500/20 text-violet-300'
                      : 'border-white/10 text-white/40 hover:border-white/20'
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {form.chainType === 'CONTINUATION' && existingScenes.length > 0 && (
            <div>
              <label className="text-xs text-white/40 uppercase tracking-widest">Continues from Scene</label>
              <select
                value={form.parentSceneId}
                onChange={(e) => setForm((p) => ({ ...p, parentSceneId: e.target.value }))}
                className="mt-1.5 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
              >
                <option value="">Select parent scene...</option>
                {existingScenes.map((s, i) => (
                  <option key={s.id} value={s.id}>Scene {i + 1} ({s.chainType})</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="text-xs text-white/40 uppercase tracking-widest">Still Image Prompt *</label>
            <Textarea
              value={form.prompt}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm((p) => ({ ...p, prompt: e.target.value }))}
              placeholder='Describe the frame: "Luna stands on the candy planet surface, sunrise, wide shot"'
              rows={3}
              className="mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-white/20 resize-none"
            />
          </div>

          <div>
            <label className="text-xs text-white/40 uppercase tracking-widest">Video Motion Prompt</label>
            <Textarea
              value={form.videoPrompt}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm((p) => ({ ...p, videoPrompt: e.target.value }))}
              placeholder='Optional: "0-3s: wide crane down. 3-6s: tracking shot. 6-8s: close-up"'
              rows={2}
              className="mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-white/20 resize-none text-sm"
            />
          </div>

          {characterNames.length > 0 && (
            <div>
              <label className="text-xs text-white/40 uppercase tracking-widest">Characters in this scene</label>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {characterNames.map((name) => (
                  <button
                    key={name}
                    onClick={() => toggleChar(name)}
                    className={cn(
                      'px-2.5 py-1 rounded-full text-xs border transition-all',
                      form.selectedChars.includes(name)
                        ? 'bg-violet-500/30 border-violet-400 text-violet-300'
                        : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'
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
          <Button variant="ghost" onClick={onClose} className="text-white/40">Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !form.prompt.trim()}
            className="bg-blue-600 hover:bg-blue-500 text-white"
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
// Main Project Detail Page
// ─────────────────────────────────────────────

export default function VisualProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id as string;

  const [project, setProject] = useState<VisualProject | null>(null);
  const [activeVideo, setActiveVideo] = useState<VisualVideo | null>(null);
  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState<string | null>(null); // which pipeline step is running
  const [showAddScene, setShowAddScene] = useState(false);
  const [showAddVideo, setShowAddVideo] = useState(false);
  const [videoTitle, setVideoTitle] = useState('');

  const loadProject = useCallback(async () => {
    if (!projectId) return;
    try {
      const p = await visualFlowApi.projects.get(projectId);
      setProject(p);
      if (p.videos?.length && !activeVideo) {
        setActiveVideo(p.videos[0]);
      }
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const loadStatus = useCallback(async () => {
    if (!projectId || !activeVideo?.id) return;
    const s = await visualFlowApi.pipeline.status(projectId, activeVideo.id);
    setPipelineStatus(s);
  }, [projectId, activeVideo?.id]);

  useEffect(() => { loadProject(); }, [loadProject]);
  useEffect(() => { if (activeVideo) loadStatus(); }, [activeVideo, loadStatus]);

  const handleCreateVideo = async () => {
    if (!videoTitle.trim()) return;
    const v = await visualFlowApi.videos.create(projectId, { title: videoTitle });
    setActiveVideo(v);
    setShowAddVideo(false);
    setVideoTitle('');
    loadProject();
  };

  const runStep = async (
    step: string,
    fn: () => Promise<any>,
  ) => {
    setRunning(step);
    try {
      await fn();
      await loadStatus();
    } finally {
      setRunning(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center text-white/40">
        Project not found.
      </div>
    );
  }

  const chars = project.characters ?? [];
  const charNames = chars.map((c) => c.name);
  const status = pipelineStatus;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#0a0a0f]/90 backdrop-blur border-b border-white/10 px-6 py-3 flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-white/10 rounded-lg transition">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold">{project.name}</h1>
          <p className="text-xs text-white/40 line-clamp-1">{project.story ?? 'No story defined'}</p>
        </div>
        <Button
          onClick={() => setShowAddScene(true)}
          disabled={!activeVideo}
          className="bg-blue-600 hover:bg-blue-500 text-white rounded-full text-sm h-9"
        >
          <Plus className="w-4 h-4 mr-1" /> Add Scene
        </Button>
      </div>

      <div className="p-6 grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Left: Characters + Videos sidebar */}
        <div className="xl:col-span-1 space-y-5">
          {/* Characters */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <Users className="w-4 h-4 text-violet-400" /> Entities
              </h2>
              <span className="text-xs text-white/30">{chars.length} total</span>
            </div>
            <div className="space-y-2">
              {chars.map((c) => (
                <div key={c.id} className="flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition">
                  {c.referenceImageUrl ? (
                    <img src={c.referenceImageUrl} alt={c.name} className="w-8 h-8 rounded-lg object-cover border border-white/10" />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-sm">
                      {c.entityType === 'character' ? '🧑' : c.entityType === 'location' ? '🏔️' : '💎'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{c.name}</p>
                    <p className="text-[10px] text-white/30 capitalize">{c.entityType}</p>
                  </div>
                  <span className={cn(
                    'w-2 h-2 rounded-full shrink-0',
                    c.refStatus === 'COMPLETED' ? 'bg-emerald-400' :
                    c.refStatus === 'PROCESSING' ? 'bg-blue-400' :
                    c.refStatus === 'FAILED' ? 'bg-red-400' : 'bg-yellow-400'
                  )} />
                </div>
              ))}
              {chars.length === 0 && (
                <p className="text-xs text-white/20 text-center py-4">No entities yet</p>
              )}
            </div>
          </div>

          {/* Videos */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <Film className="w-4 h-4 text-pink-400" /> Videos
              </h2>
              <button
                onClick={() => setShowAddVideo(true)}
                className="p-1 hover:bg-white/10 rounded-md transition"
              >
                <Plus className="w-4 h-4 text-white/40" />
              </button>
            </div>
            <div className="space-y-1">
              {(project.videos ?? []).map((v) => (
                <button
                  key={v.id}
                  onClick={() => setActiveVideo(v)}
                  className={cn(
                    'w-full flex items-center gap-2 p-2.5 rounded-lg text-sm transition text-left',
                    activeVideo?.id === v.id
                      ? 'bg-violet-500/20 border border-violet-500/30 text-white'
                      : 'hover:bg-white/5 text-white/50 border border-transparent'
                  )}
                >
                  <Clapperboard className="w-4 h-4 shrink-0" />
                  <span className="truncate flex-1">{v.title}</span>
                  {activeVideo?.id === v.id && <ChevronRight className="w-3.5 h-3.5" />}
                </button>
              ))}
              {(project.videos ?? []).length === 0 && (
                <p className="text-xs text-white/20 text-center py-4">No videos yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Right: Pipeline + Scenes */}
        <div className="xl:col-span-3 space-y-5">
          {!activeVideo ? (
            <div className="flex flex-col items-center justify-center h-64 rounded-2xl border border-dashed border-white/10 text-white/30 gap-3">
              <Film className="w-10 h-10" />
              <p className="text-sm">Create a video to start building scenes</p>
              <Button
                onClick={() => setShowAddVideo(true)}
                variant="outline"
                className="border-white/10 text-white/50 hover:bg-white/10"
              >
                <Plus className="w-4 h-4 mr-2" /> New Video
              </Button>
            </div>
          ) : (
            <>
              {/* Pipeline Control Panel */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold flex items-center gap-2">
                    <Wand2 className="w-4 h-4 text-pink-400" /> Pipeline — {activeVideo.title}
                  </h2>
                  <button onClick={loadStatus} className="p-1.5 hover:bg-white/10 rounded-lg transition">
                    <RefreshCw className="w-4 h-4 text-white/30" />
                  </button>
                </div>

                {status && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                    <PipelineProgressBar
                      label="Reference Images"
                      done={status.characters.completed}
                      total={status.characters.total}
                    />
                    <PipelineProgressBar
                      label="Scene Images (V)"
                      done={status.scenes.verticalImages.completed}
                      total={status.scenes.total}
                    />
                    <PipelineProgressBar
                      label="Video Clips (V)"
                      done={status.scenes.verticalVideos.completed}
                      total={status.scenes.total}
                    />
                  </div>
                )}

                {/* Pipeline step buttons */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => runStep('refs', () => visualFlowApi.pipeline.generateRefs(projectId))}
                    disabled={!!running || chars.length === 0}
                    size="sm"
                    className="bg-violet-600/20 hover:bg-violet-600/40 text-violet-300 border border-violet-500/30"
                  >
                    {running === 'refs' ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <ImageIcon className="w-3.5 h-3.5 mr-1.5" />}
                    Gen Refs
                  </Button>
                  <Button
                    onClick={() => runStep('images', () => visualFlowApi.pipeline.generateImages(projectId, activeVideo.id))}
                    disabled={!!running}
                    size="sm"
                    className="bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/30"
                  >
                    {running === 'images' ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Sparkles className="w-3.5 h-3.5 mr-1.5" />}
                    Gen Images
                  </Button>
                  <Button
                    onClick={() => runStep('videos', () => visualFlowApi.pipeline.generateVideos(projectId, activeVideo.id))}
                    disabled={!!running}
                    size="sm"
                    className="bg-pink-600/20 hover:bg-pink-600/40 text-pink-300 border border-pink-500/30"
                  >
                    {running === 'videos' ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Play className="w-3.5 h-3.5 mr-1.5" />}
                    Gen Videos
                  </Button>
                </div>
              </div>

              {/* Scene Grid */}
              <div>
                <h2 className="text-sm font-semibold text-white/60 mb-3 flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  Scenes ({status?.sceneList.length ?? 0})
                </h2>
                {status?.sceneList.length ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    {status.sceneList
                      .sort((a, b) => a.order - b.order)
                      .map((scene, i) => (
                        <SceneCard key={scene.id} scene={scene} index={i} />
                      ))}
                    <div
                      onClick={() => setShowAddScene(true)}
                      className="rounded-xl border border-dashed border-white/10 hover:border-blue-500/30 hover:bg-blue-500/5 cursor-pointer flex flex-col items-center justify-center gap-2 min-h-[180px] transition group"
                    >
                      <Plus className="w-6 h-6 text-white/20 group-hover:text-blue-400 transition" />
                      <span className="text-xs text-white/20 group-hover:text-blue-400 transition">Add Scene</span>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => setShowAddScene(true)}
                    className="flex flex-col items-center justify-center h-40 rounded-2xl border border-dashed border-white/10 hover:border-blue-500/30 hover:bg-blue-500/5 cursor-pointer transition text-white/30 gap-2"
                  >
                    <Layers className="w-8 h-8" />
                    <p className="text-sm">Add your first scene</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Add Scene Dialog */}
      <AddSceneDialog
        open={showAddScene}
        onClose={() => setShowAddScene(false)}
        projectId={projectId}
        videoId={activeVideo?.id ?? ''}
        existingScenes={status?.sceneList ?? []}
        characterNames={charNames}
        onCreated={loadStatus}
      />

      {/* Add Video Dialog */}
      <Dialog open={showAddVideo} onOpenChange={setShowAddVideo}>
        <DialogContent className="max-w-sm bg-zinc-900 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>New Video / Episode</DialogTitle>
          </DialogHeader>
          <Input
            value={videoTitle}
            onChange={(e) => setVideoTitle(e.target.value)}
            placeholder="Episode title..."
            className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
            autoFocus
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAddVideo(false)} className="text-white/40">Cancel</Button>
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
