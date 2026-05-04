'use client';

import React, { useState, useEffect, useCallback, useReducer } from 'react';
import Image from 'next/image';
import { useRouter } from '@/i18n/navigation';
import {
  Plus,
  Search,
  Film,
  Users,
  Layers,
  MoreHorizontal,
  Trash2,
  Edit,
  ChevronRight,
  Clapperboard,
  Wand2,
  ImageIcon,
  Video,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  BookOpen,
  Sparkles,
  UserRound,
  MapPinned,
  Ghost,
  Gem,
} from 'lucide-react';
import { Button } from '@/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  visualFlowApi,
  VisualProject,
  VisualCharacter,
  EntityType,
} from '@/services/visualFlowApi';

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
    PENDING: { label: 'Pending', icon: <Clock className="w-3 h-3" />, cls: 'text-yellow-400 bg-yellow-400/10' },
    PROCESSING: { label: 'Processing', icon: <Loader2 className="w-3 h-3 animate-spin" />, cls: 'text-blue-400 bg-blue-400/10' },
    COMPLETED: { label: 'Done', icon: <CheckCircle2 className="w-3 h-3" />, cls: 'text-emerald-400 bg-emerald-400/10' },
    FAILED: { label: 'Failed', icon: <XCircle className="w-3 h-3" />, cls: 'text-red-400 bg-red-400/10' },
    ACTIVE: { label: 'Active', icon: <Sparkles className="w-3 h-3" />, cls: 'text-violet-400 bg-violet-400/10' },
    DRAFT: { label: 'Draft', icon: <BookOpen className="w-3 h-3" />, cls: 'text-gray-400 bg-gray-400/10' },
  };
  const s = map[status] ?? { label: status, icon: null, cls: 'text-gray-400 bg-gray-400/10' };
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', s.cls)}>
      {s.icon} {s.label}
    </span>
  );
}

const ENTITY_TYPE_ICONS: Record<EntityType, React.ComponentType<{ className?: string }>> = {
  character: UserRound,
  location: MapPinned,
  creature: Ghost,
  visual_asset: Gem,
};

interface CharacterRowProps {
  char: VisualCharacter;
  onDelete: (id: string) => void;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function CharacterRow({ char, onDelete }: CharacterRowProps) {
  const EntityIcon = ENTITY_TYPE_ICONS[char.entityType] ?? Clapperboard;
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group">
      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500/30 to-pink-500/30 border border-white/10 flex items-center justify-center text-lg shrink-0">
        <EntityIcon className="w-4 h-4 text-white/80" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{char.name}</p>
        <p className="text-xs text-white/40 truncate">{char.description ?? '—'}</p>
      </div>
      <StatusBadge status={char.refStatus} />
      {char.referenceImageUrl && (
        <div className="relative w-8 h-8 overflow-hidden rounded-lg border border-white/10">
          <Image
            src={char.referenceImageUrl}
            alt={char.name}
            fill
            className="object-cover"
            sizes="32px"
          />
        </div>
      )}
      <button
        onClick={() => onDelete(char.id)}
        className="opacity-0 group-hover:opacity-100 p-1.5 hover:text-red-400 transition-all"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
// Create Project Wizard
// ─────────────────────────────────────────────

interface CreateProjectWizardProps {
  open: boolean;
  onClose: () => void;
  onCreated: (project: VisualProject) => void;
}

type WizardCharacter = {
  name: string;
  entityType: EntityType;
  description: string;
  voiceDescription: string;
};

type WizardState = {
  step: 1 | 2;
  loading: boolean;
  form: {
    name: string;
    story: string;
    language: string;
  };
  characters: WizardCharacter[];
  newChar: WizardCharacter;
};

type WizardAction =
  | { type: 'setStep'; step: 1 | 2 }
  | { type: 'setLoading'; loading: boolean }
  | { type: 'setForm'; form: Partial<WizardState['form']> }
  | { type: 'setCharacters'; characters: WizardCharacter[] }
  | { type: 'setNewChar'; newChar: Partial<WizardCharacter> }
  | { type: 'reset' };

const initialWizardState: WizardState = {
  step: 1,
  loading: false,
  form: {
    name: '',
    story: '',
    language: 'en',
  },
  characters: [],
  newChar: {
    name: '',
    entityType: 'character',
    description: '',
    voiceDescription: '',
  },
};

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'setStep':
      return { ...state, step: action.step };
    case 'setLoading':
      return { ...state, loading: action.loading };
    case 'setForm':
      return { ...state, form: { ...state.form, ...action.form } };
    case 'setCharacters':
      return { ...state, characters: action.characters };
    case 'setNewChar':
      return { ...state, newChar: { ...state.newChar, ...action.newChar } };
    case 'reset':
      return initialWizardState;
    default:
      return state;
  }
}

function CreateProjectWizard({ open, onClose, onCreated }: CreateProjectWizardProps) {
  const [state, dispatch] = useReducer(wizardReducer, initialWizardState);

  const handleAddChar = () => {
    if (!state.newChar.name.trim()) return;
    dispatch({
      type: 'setCharacters',
      characters: [...state.characters, { ...state.newChar }],
    });
    dispatch({
      type: 'setNewChar',
      newChar: { name: '', entityType: 'character', description: '', voiceDescription: '' },
    });
  };

  const handleCreate = async () => {
    if (!state.form.name.trim()) return;
    dispatch({ type: 'setLoading', loading: true });
    try {
      const project = await visualFlowApi.projects.create({
        name: state.form.name,
        story: state.form.story,
        language: state.form.language,
        characters: state.characters.length ? state.characters : undefined,
      });
      onCreated(project);
      onClose();
      dispatch({ type: 'reset' });
    } catch (error) {
      console.error('Failed to create VisualFlow project', error);
    }
    dispatch({ type: 'setLoading', loading: false });
  };

  if (!open) return null;
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl bg-zinc-900 border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clapperboard className="w-5 h-5 text-violet-400" />
            New VisualFlow Project
            <span className="ml-auto text-xs text-white/40">Step {state.step} / 2</span>
          </DialogTitle>
        </DialogHeader>

        {/* Progress bar */}
        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-pink-500 transition-all duration-500"
            style={{ width: `${(state.step / 2) * 100}%` }}
          />
        </div>

        {state.step === 1 && (
          <div className="space-y-4 py-2">
            <div>
              <div className="text-xs font-medium text-white/50 uppercase tracking-widest">Project Name *</div>
              <Input
                value={state.form.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => dispatch({ type: 'setForm', form: { name: e.target.value } })}
                placeholder="e.g. Dragon Chronicles Episode 1"
                className="mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-white/30"
              />
            </div>
            <div>
              <div className="text-xs font-medium text-white/50 uppercase tracking-widest">Story / Synopsis</div>
              <Textarea
                value={state.form.story}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => dispatch({ type: 'setForm', form: { story: e.target.value } })}
                placeholder="Describe your full story here. The AI will use this to maintain consistency across all scenes..."
                rows={5}
                className="mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-white/30 resize-none"
              />
            </div>
            <div>
              <div className="text-xs font-medium text-white/50 uppercase tracking-widest">Language</div>
              <Input
                value={state.form.language}
                onChange={(e) => dispatch({ type: 'setForm', form: { language: e.target.value } })}
                placeholder="en"
                className="mt-1.5 bg-white/5 border-white/10 text-white w-24"
              />
            </div>
          </div>
        )}

        {state.step === 2 && (
          <div className="space-y-4 py-2">
            <p className="text-sm text-white/50">
              Add visual entities (characters, locations, props). Each gets a reference image to stay consistent across all scenes.
            </p>
            {/* Existing chars */}
            {state.characters.length > 0 && (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {state.characters.map((c, i) => {
                  const EntityIcon = ENTITY_TYPE_ICONS[c.entityType] ?? Clapperboard;

                  return (
                    <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-white/5 text-sm">
                      <EntityIcon className="w-4 h-4" />
                      <span className="font-medium">{c.name}</span>
                      <span className="text-white/40 truncate flex-1">{c.description}</span>
                      <button
                        onClick={() =>
                          dispatch({
                            type: 'setCharacters',
                            characters: state.characters.filter((_, j) => j !== i),
                          })
                        }
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            {/* Add new char */}
            <div className="p-3 rounded-xl border border-dashed border-white/10 space-y-2">
              <div className="flex gap-2">
                <select
                  value={state.newChar.entityType}
                  onChange={(e) => dispatch({ type: 'setNewChar', newChar: { entityType: e.target.value as EntityType } })}
                  className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white"
                >
                  <option value="character">Character</option>
                  <option value="location">Location</option>
                  <option value="creature">Creature</option>
                  <option value="visual_asset">Visual Asset</option>
                </select>
                <Input
                  value={state.newChar.name}
                  onChange={(e) => dispatch({ type: 'setNewChar', newChar: { name: e.target.value } })}
                  placeholder="Name (used in scene prompts)"
                  className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/30 h-9"
                />
              </div>
              <Textarea
                value={state.newChar.description}
                onChange={(e) => dispatch({ type: 'setNewChar', newChar: { description: e.target.value } })}
                placeholder='Appearance only: "Chubby orange cat, blue apron, straw hat, Pixar 3D style"'
                rows={2}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 resize-none text-sm"
              />
              <Input
                value={state.newChar.voiceDescription}
                onChange={(e) => dispatch({ type: 'setNewChar', newChar: { voiceDescription: e.target.value } })}
                placeholder="Voice (optional): 'Soft curious childlike voice'"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-8 text-xs"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={handleAddChar}
                disabled={!state.newChar.name.trim()}
                className="w-full border-white/10 text-white/70 hover:bg-white/10"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Entity
              </Button>
            </div>
          </div>
        )}

        <DialogFooter className="flex gap-2">
          {state.step > 1 && (
            <Button variant="ghost" onClick={() => dispatch({ type: 'setStep', step: 1 })} className="text-white/60">
              Back
            </Button>
          )}
          <Button variant="ghost" onClick={onClose} className="text-white/60">
            Cancel
          </Button>
          {state.step < 2 ? (
            <Button
              onClick={() => dispatch({ type: 'setStep', step: 2 })}
              disabled={!state.form.name.trim()}
              className="bg-violet-600 hover:bg-violet-500 text-white"
            >
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleCreate}
              disabled={state.loading || !state.form.name.trim()}
              className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white"
            >
              {state.loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Create Project
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────
// Project Card
// ─────────────────────────────────────────────

function ProjectCard({ project, onClick, onDelete }: { project: VisualProject; onClick: () => void; onDelete: () => void }) {
  const chars = project.characters ?? [];
  const completedRefs = chars.filter((c) => c.refStatus === 'COMPLETED').length;
  const videos = project.videos ?? [];

  return (
    <div
      onClick={onClick}
      className="group relative cursor-pointer rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/20 transition-all duration-300 overflow-hidden"
    >
      {/* Thumbnail / gradient header */}
      <div className="h-36 bg-gradient-to-br from-violet-900/60 via-pink-900/40 to-indigo-900/60 relative overflow-hidden">
        {project.thumbnailUrl ? (
          <Image src={project.thumbnailUrl} alt={project.name} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 25vw" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Clapperboard className="w-12 h-12 text-white/10" />
          </div>
        )}
        {/* Overlay actions */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1.5 bg-gray-950/60 backdrop-blur rounded-lg text-white hover:bg-gray-950/80 transition">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-zinc-900 border-white/10 text-white">
              <DropdownMenuItem className="cursor-pointer hover:bg-white/10">
                <Edit className="w-4 h-4 mr-2" /> Rename
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem
                onClick={onDelete}
                className="cursor-pointer text-red-400 hover:bg-red-400/10 focus:text-red-400"
              >
                <Trash2 className="w-4 h-4 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {/* Status badge top-left */}
        <div className="absolute top-2 left-2">
          <StatusBadge status={project.status} />
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-sm truncate mb-1">{project.name}</h3>
        {project.story && (
          <p className="text-xs text-white/40 line-clamp-2 mb-3">{project.story}</p>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-4 text-xs text-white/40">
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {chars.length} entities ({completedRefs} refs)
          </span>
          <span className="flex items-center gap-1">
            <Film className="w-3.5 h-3.5" />
            {videos.length} video{videos.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Ref progress bar */}
        {chars.length > 0 && (
          <div className="mt-3">
            <div className="flex justify-between text-[10px] text-white/30 mb-1">
              <span>Reference images</span>
              <span>{completedRefs}/{chars.length}</span>
            </div>
            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-500 to-pink-500 transition-all"
                style={{ width: chars.length ? `${(completedRefs / chars.length) * 100}%` : '0%' }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────

export default function VisualFlowPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<VisualProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showWizard, setShowWizard] = useState(false);

  const loadProjects = useCallback(async () => {
    try {
      const res = await visualFlowApi.projects.list();
      setProjects(res.data);
    } catch (e) {
      console.error('Failed to load visual projects', e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    queueMicrotask(() => { void loadProjects(); });
  }, [loadProjects]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this project? This cannot be undone.')) return;
    await visualFlowApi.projects.delete(id);
    setProjects((p) => p.filter((proj) => proj.id !== id));
  };

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6 space-y-8">
      {/* Hero Banner */}
      <div className="relative w-full rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-br from-violet-950/80 via-[#0a0a0f] to-pink-950/50 p-8 flex items-center justify-between min-h-[180px]">
        {/* Animated background orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-violet-600/20 blur-[80px]" />
          <div className="absolute -bottom-20 right-20 w-60 h-60 rounded-full bg-pink-600/20 blur-[60px]" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-xl bg-violet-600/20 border border-violet-500/30">
              <Clapperboard className="w-5 h-5 text-violet-400" />
            </div>
            <span className="text-xs font-medium text-violet-400 uppercase tracking-widest">VisualFlow Studio</span>
          </div>
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
            AI Video Pipeline
          </h1>
          <p className="text-sm text-white/50 max-w-md">
            Build consistent, multi-scene AI videos. Reference images keep your characters and locations identical across every frame.
          </p>
          <Button
            onClick={() => setShowWizard(true)}
            className="mt-5 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white border-0 rounded-full px-6"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </div>

        {/* Feature pills */}
        <div className="relative z-10 hidden lg:flex flex-col gap-2.5">
          {[
            { icon: <ImageIcon className="w-4 h-4 text-violet-400" />, label: 'Reference Image System' },
            { icon: <Layers className="w-4 h-4 text-pink-400" />, label: 'Scene Chaining (ROOT → CONTINUATION)' },
            { icon: <Video className="w-4 h-4 text-blue-400" />, label: 'Dual Orientation (9:16 + 16:9)' },
            { icon: <Wand2 className="w-4 h-4 text-emerald-400" />, label: 'Auto Pipeline Generation' },
          ].map((f) => (
            <div key={f.label} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-white/60">
              {f.icon} {f.label}
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-full"
          />
        </div>
        <span className="text-sm text-white/30">
          {filtered.length} project{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Project Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {/* New project ghost card */}
          <div
            onClick={() => setShowWizard(true)}
            className="group cursor-pointer rounded-2xl border border-dashed border-white/10 bg-transparent hover:bg-white/[0.03] hover:border-violet-500/40 transition-all duration-300 flex flex-col items-center justify-center gap-3 min-h-[260px]"
          >
            <div className="w-14 h-14 rounded-2xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center group-hover:bg-violet-600/20 transition-colors">
              <Plus className="w-6 h-6 text-violet-400" />
            </div>
            <span className="text-sm font-medium text-white/30 group-hover:text-white/60 transition-colors">
              New Project
            </span>
          </div>

          {filtered.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() => router.push(`/visual-flow/projects/${project.id}`)}
              onDelete={() => handleDelete(project.id)}
            />
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && projects.length > 0 && (
        <div className="flex flex-col items-center justify-center h-32 text-white/30">
          <p>No projects match your search.</p>
        </div>
      )}

      {!loading && projects.length === 0 && (
        <div className="flex flex-col items-center justify-center h-48 gap-3 text-white/30">
          <Clapperboard className="w-10 h-10" />
          <p className="text-sm">No projects yet. Create your first VisualFlow project!</p>
        </div>
      )}

      {/* Create Wizard */}
      <CreateProjectWizard
        open={showWizard}
        onClose={() => setShowWizard(false)}
        onCreated={(p) => {
          setProjects((prev) => [p, ...prev]);
          router.push(`/visual-flow/projects/${p.id}`);
        }}
      />
    </div>
  );
}
