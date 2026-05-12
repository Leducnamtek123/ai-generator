'use client';

import React, { useEffect, useCallback, useReducer, useRef } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { VisualFlowProjectSkeletonGrid } from '@/components/common/loading-skeletons';
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
    PENDING: { label: 'Pending', icon: <Clock className="size-3" />, cls: 'text-yellow-400 bg-yellow-400/10' },
    PROCESSING: { label: 'Processing', icon: <Loader2 className="size-3 animate-spin" />, cls: 'text-blue-400 bg-blue-400/10' },
    COMPLETED: { label: 'Done', icon: <CheckCircle2 className="size-3" />, cls: 'text-emerald-400 bg-emerald-400/10' },
    FAILED: { label: 'Failed', icon: <XCircle className="size-3" />, cls: 'text-red-400 bg-red-400/10' },
    ACTIVE: { label: 'Active', icon: <Sparkles className="size-3" />, cls: 'text-violet-400 bg-violet-400/10' },
    DRAFT: { label: 'Draft', icon: <BookOpen className="size-3" />, cls: 'text-gray-400 bg-gray-400/10' },
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
      <div className="size-10 rounded-lg bg-gradient-to-br from-violet-500/30 to-pink-500/30 border border-white/10 flex items-center justify-center text-lg shrink-0">
        <EntityIcon className="size-4 text-white/80" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{char.name}</p>
        <p className="text-xs text-white/40 truncate">{char.description ?? ','}</p>
      </div>
      <StatusBadge status={char.refStatus} />
      {char.referenceImageUrl && (
        <div className="relative size-8 overflow-hidden rounded-lg border border-white/10">
          <Image
            src={char.referenceImageUrl}
            alt={char.name}
            fill
            className="object-cover"
            sizes="32px"
            unoptimized
          />
        </div>
      )}
      <button
        onClick={() => onDelete(char.id)}
        className="opacity-0 group-hover:opacity-100 p-1.5 hover:text-red-400 transition-all"
      >
        <Trash2 className="size-3.5" />
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

type WizardDraft = {
  version: number;
  savedAt: string;
  state: WizardState;
};

const WIZARD_DRAFT_KEY = 'visual-flow:create-project:draft';

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
  | { type: 'restore'; state: WizardState }
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
    case 'restore':
      return action.state;
    case 'reset':
      return initialWizardState;
    default:
      return state;
  }
}

function CreateProjectWizard({ open, onClose, onCreated }: CreateProjectWizardProps) {
  const [state, dispatch] = useReducer(wizardReducer, initialWizardState);
  const draftReadyRef = useRef(false);

  useEffect(() => {
    if (!open) {
      draftReadyRef.current = false;
      return;
    }

    try {
      const raw = window.localStorage.getItem(WIZARD_DRAFT_KEY);
      if (!raw) {
        draftReadyRef.current = true;
        return;
      }

      const parsed = JSON.parse(raw) as Partial<WizardDraft>;
      const restored = parsed.state;
      if (restored) {
        dispatch({
          type: 'restore',
          state: {
            ...initialWizardState,
            ...restored,
            loading: false,
            form: {
              ...initialWizardState.form,
              ...(restored.form ?? {}),
            },
            characters: restored.characters ?? [],
            newChar: {
              ...initialWizardState.newChar,
              ...(restored.newChar ?? {}),
            },
          },
        });
      }
    } catch (error) {
      console.error('Failed to restore VisualFlow wizard draft', error);
    } finally {
      draftReadyRef.current = true;
    }
  }, [open]);

  useEffect(() => {
    if (!open || !draftReadyRef.current) {
      return;
    }

    const draft: WizardDraft = {
      version: 1,
      savedAt: new Date().toISOString(),
      state,
    };

    window.localStorage.setItem(WIZARD_DRAFT_KEY, JSON.stringify(draft));
  }, [open, state]);

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
      window.localStorage.removeItem(WIZARD_DRAFT_KEY);
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
      <DialogContent className="max-w-xl border-border bg-background text-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clapperboard className="size-5 text-violet-400" />
            New VisualFlow Project
            <span className="ml-auto text-xs text-muted-foreground">Step {state.step} / 2</span>
          </DialogTitle>
        </DialogHeader>

        {/* Progress bar */}
        <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-pink-500 transition-all duration-500"
            style={{ width: `${(state.step / 2) * 100}%` }}
          />
        </div>

        {state.step === 1 && (
          <div className="space-y-4 py-2">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Project Name *</div>
              <Input
                value={state.form.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => dispatch({ type: 'setForm', form: { name: e.target.value } })}
                placeholder="e.g. Dragon Chronicles Episode 1"
                className="mt-1.5 border-border bg-muted/20 text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Story / Synopsis</div>
              <Textarea
                value={state.form.story}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => dispatch({ type: 'setForm', form: { story: e.target.value } })}
                placeholder="Describe your full story here. The AI will use this to maintain consistency across all scenes?"
                rows={5}
                className="mt-1.5 resize-none border-border bg-muted/20 text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Language</div>
              <Input
                value={state.form.language}
                onChange={(e) => dispatch({ type: 'setForm', form: { language: e.target.value } })}
                placeholder="en"
                className="mt-1.5 w-24 border-border bg-muted/20 text-foreground"
              />
            </div>
          </div>
        )}

        {state.step === 2 && (
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Add visual entities (characters, locations, props). Each gets a reference image to stay consistent across all scenes.
            </p>
            {/* Existing chars */}
            {state.characters.length > 0 && (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {state.characters.map((c, i) => {
                  const EntityIcon = ENTITY_TYPE_ICONS[c.entityType] ?? Clapperboard;

                  return (
                    <div key={`${c.entityType}-${c.name}-${c.description}`} className="flex items-center gap-3 rounded-lg bg-muted/20 p-2.5 text-sm">
                      <EntityIcon className="size-4" />
                      <span className="font-medium">{c.name}</span>
                      <span className="flex-1 truncate text-muted-foreground">{c.description}</span>
                      <button
                        onClick={() =>
                          dispatch({
                            type: 'setCharacters',
                            characters: state.characters.filter((_, j) => j !== i),
                          })
                        }
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            {/* Add new char */}
            <div className="space-y-2 rounded-xl border border-dashed border-border p-3">
              <div className="flex gap-2">
                <Select
                  value={state.newChar.entityType}
                  onValueChange={(value) => dispatch({ type: 'setNewChar', newChar: { entityType: value as EntityType } })}
                >
                  <SelectTrigger className="rounded-lg border border-border bg-muted/20 px-2 py-1.5 text-sm text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="character">Character</SelectItem>
                    <SelectItem value="location">Location</SelectItem>
                    <SelectItem value="creature">Creature</SelectItem>
                    <SelectItem value="visual_asset">Visual Asset</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  value={state.newChar.name}
                  onChange={(e) => dispatch({ type: 'setNewChar', newChar: { name: e.target.value } })}
                  placeholder="Name (used in scene prompts)"
                  className="h-9 flex-1 border-border bg-muted/20 text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <Textarea
                value={state.newChar.description}
                onChange={(e) => dispatch({ type: 'setNewChar', newChar: { description: e.target.value } })}
                placeholder='Appearance only: "Chubby orange cat, blue apron, straw hat, Pixar 3D style"'
                rows={2}
                className="resize-none border-border bg-muted/20 text-sm text-foreground placeholder:text-muted-foreground"
              />
              <Input
                value={state.newChar.voiceDescription}
                onChange={(e) => dispatch({ type: 'setNewChar', newChar: { voiceDescription: e.target.value } })}
                placeholder="Voice (optional): 'Soft curious childlike voice'"
                className="h-8 border-border bg-muted/20 text-xs text-foreground placeholder:text-muted-foreground"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={handleAddChar}
                disabled={!state.newChar.name.trim()}
                className="w-full border-border text-foreground hover:bg-accent"
              >
                <Plus className="size-3.5 mr-1" /> Add Entity
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
              Next <ChevronRight className="size-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleCreate}
              disabled={state.loading || !state.form.name.trim()}
              className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white"
            >
              {state.loading ? <Loader2 className="size-4 animate-spin mr-2" /> : <Sparkles className="size-4 mr-2" />}
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
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className="group relative cursor-pointer rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/20 transition-all duration-300 overflow-hidden text-left w-full"
    >
      {/* Thumbnail / gradient header */}
      <div className="h-36 bg-gradient-to-br from-violet-900/60 via-pink-900/40 to-violet-900/60 relative overflow-hidden">
        {project.thumbnailUrl ? (
          <Image src={project.thumbnailUrl} alt={project.name} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 25vw" unoptimized />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Clapperboard className="size-12 text-white/10" />
          </div>
        )}
        {/* Overlay actions */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1.5 bg-zinc-950/60 backdrop-blur rounded-lg text-white hover:bg-zinc-950/80 transition">
                <MoreHorizontal className="size-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-zinc-900 border-white/10 text-white">
              <DropdownMenuItem className="cursor-pointer hover:bg-white/10">
                <Edit className="size-4 mr-2" /> Rename
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem
                onClick={onDelete}
                className="cursor-pointer text-red-400 hover:bg-red-400/10 focus:text-red-400"
              >
                <Trash2 className="size-4 mr-2" /> Delete
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
            <Users className="size-3.5" />
            {chars.length} entities ({completedRefs} refs)
          </span>
          <span className="flex items-center gap-1">
            <Film className="size-3.5" />
            {videos.length} video{videos.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Ref progress bar */}
        {chars.length > 0 && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-white/30 mb-1">
              <span>References</span>
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

type VisualFlowState = {
  projects: VisualProject[];
  loading: boolean;
  search: string;
  showWizard: boolean;
  projectToDelete: VisualProject | null;
};

type VisualFlowAction =
  | { type: 'setProjects'; projects: VisualProject[] }
  | { type: 'setLoading'; loading: boolean }
  | { type: 'setSearch'; search: string }
  | { type: 'setShowWizard'; showWizard: boolean }
  | { type: 'setProjectToDelete'; projectToDelete: VisualProject | null }
  | { type: 'removeProject'; projectId: string }
  | { type: 'prependProject'; project: VisualProject };

const initialVisualFlowState: VisualFlowState = {
  projects: [],
  loading: true,
  search: '',
  showWizard: false,
  projectToDelete: null,
};

function visualFlowReducer(state: VisualFlowState, action: VisualFlowAction): VisualFlowState {
  switch (action.type) {
    case 'setProjects':
      return { ...state, projects: action.projects };
    case 'setLoading':
      return { ...state, loading: action.loading };
    case 'setSearch':
      return { ...state, search: action.search };
    case 'setShowWizard':
      return { ...state, showWizard: action.showWizard };
    case 'setProjectToDelete':
      return { ...state, projectToDelete: action.projectToDelete };
    case 'removeProject':
      return { ...state, projects: state.projects.filter((project) => project.id !== action.projectId) };
    case 'prependProject':
      return { ...state, projects: [action.project, ...state.projects] };
    default:
      return state;
  }
}

export default function VisualFlowPage() {
  const { push } = useRouter();
  const [state, dispatch] = useReducer(visualFlowReducer, initialVisualFlowState);
  const { projects, loading, search, showWizard, projectToDelete } = state;

  const loadProjects = useCallback(async () => {
    try {
      const res = await visualFlowApi.projects.list();
      dispatch({ type: 'setProjects', projects: res.data });
    } catch (e) {
      console.error('Failed to load visual projects', e);
    } finally {
      dispatch({ type: 'setLoading', loading: false });
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => { void loadProjects(); });
  }, [loadProjects]);

  const handleDelete = async () => {
    if (!projectToDelete) return;
    const projectId = projectToDelete.id;
    await visualFlowApi.projects.delete(projectId);
    dispatch({ type: 'removeProject', projectId });
    dispatch({ type: 'setProjectToDelete', projectToDelete: null });
  };

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-background p-6 space-y-8 text-foreground">
      {/* Hero Banner */}
      <div className="relative flex min-h-[180px] w-full items-center justify-between overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-violet-500/10 via-background to-pink-500/10 p-8">
        {/* Animated background orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -left-20 size-80 rounded-full bg-violet-600/20 blur-[80px]" />
          <div className="absolute -bottom-20 right-20 size-60 rounded-full bg-pink-600/20 blur-[60px]" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-xl bg-violet-600/20 border border-violet-500/30">
              <Clapperboard className="size-5 text-violet-400" />
            </div>
            <span className="text-sm font-medium text-violet-300">VisualFlow Studio</span>
          </div>
          <h1 className="mb-2 text-3xl font-semibold text-foreground">
            AI Video Pipeline
          </h1>
          <p className="max-w-md text-sm text-muted-foreground">
            Build consistent, multi-scene AI videos. Reference images keep your characters and locations identical across every frame.
          </p>
          <Button
            onClick={() => dispatch({ type: 'setShowWizard', showWizard: true })}
            className="mt-5 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white border-0 rounded-full px-6"
          >
            <Plus className="size-4 mr-2" />
            New Project
          </Button>
        </div>

        {/* Feature pills */}
        <div className="relative z-10 hidden lg:flex flex-col gap-2.5">
          {[
            { icon: <ImageIcon className="size-4 text-violet-400" />, label: 'Reference Image System' },
            { icon: <Layers className="size-4 text-pink-400" />, label: 'Scene Chaining (ROOT → CONTINUATION)' },
            { icon: <Video className="size-4 text-blue-400" />, label: 'Dual Orientation (9:16 + 16:9)' },
            { icon: <Wand2 className="size-4 text-emerald-400" />, label: 'Auto Pipeline Generation' },
          ].map((f) => (
            <div key={f.label} className="flex items-center gap-2 rounded-full border border-border bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground">
              {f.icon} {f.label}
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => dispatch({ type: 'setSearch', search: e.target.value })}
            placeholder="Search projects?"
            className="rounded-full border-border bg-background pl-10 text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <span className="text-sm text-muted-foreground">
          {filtered.length} project{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Project Grid */}
      {loading ? (
        <VisualFlowProjectSkeletonGrid count={8} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {/* New project ghost card */}
          <button
            type="button"
            onClick={() => dispatch({ type: 'setShowWizard', showWizard: true })}
            className="group flex min-h-[260px] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-transparent transition-all duration-300 hover:border-violet-500/40 hover:bg-accent/30"
          >
            <div className="size-14 rounded-2xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center group-hover:bg-violet-600/20 transition-colors">
              <Plus className="size-6 text-violet-400" />
            </div>
            <span className="text-sm font-medium text-muted-foreground transition-colors group-hover:text-foreground">
              New Project
            </span>
          </button>

          {filtered.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() => push(`/visual-flow/projects/${project.id}`)}
              onDelete={() => dispatch({ type: 'setProjectToDelete', projectToDelete: project })}
            />
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && projects.length > 0 && (
        <div className="flex h-32 flex-col items-center justify-center text-muted-foreground">
          <p>No projects match your search.</p>
        </div>
      )}

      {!loading && projects.length === 0 && (
        <div className="flex h-48 flex-col items-center justify-center gap-3 text-muted-foreground">
          <Clapperboard className="size-10" />
          <p className="text-sm">No projects yet. Create your first VisualFlow project!</p>
        </div>
      )}

      <ConfirmDialog
        open={!!projectToDelete}
        onOpenChange={(open) => {
          if (!open) dispatch({ type: 'setProjectToDelete', projectToDelete: null });
        }}
        title="Delete project?"
        description={
          projectToDelete
            ? `Delete "${projectToDelete.name}" permanently? This cannot be undone.`
            : 'Delete this project permanently? This cannot be undone.'
        }
        confirmText="Delete"
        onConfirm={handleDelete}
      />

      {/* Create Wizard */}
      <CreateProjectWizard
        open={showWizard}
        onClose={() => dispatch({ type: 'setShowWizard', showWizard: false })}
        onCreated={(p) => {
          dispatch({ type: 'prependProject', project: p });
          push(`/visual-flow/projects/${p.id}`);
        }}
      />
    </div>
  );
}
