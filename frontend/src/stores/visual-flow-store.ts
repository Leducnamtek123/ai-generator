import { create } from 'zustand';
import { toast } from 'sonner';
import {
  visualFlowApi,
  VisualProject,
  VisualCharacter,
  VisualVideo,
  VisualScene,
  PipelineStatus,
  EntityType,
  ChainType,
} from '@/services/visualFlowApi';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type StudioTab = 'scenes' | 'characters' | 'pipeline' | 'export';
export type PipelineStep = 'refs' | 'images' | 'videos' | 'concat' | 'narration' | null;

interface VisualFlowState {
  // ── Data ──────────────────────────────────
  project: VisualProject | null;
  characters: VisualCharacter[];
  videos: VisualVideo[];
  scenes: VisualScene[];
  activeVideo: VisualVideo | null;
  selectedScene: VisualScene | null;
  pipelineStatus: PipelineStatus | null;

  // ── UI State ──────────────────────────────
  isLoading: boolean;
  isInitialized: boolean;
  activeTab: StudioTab;
  runningStep: PipelineStep;
  pollingInterval: ReturnType<typeof setInterval> | null;

  // ── Project Actions ───────────────────────
  loadProject: (projectId: string) => Promise<void>;
  updateProject: (projectId: string, data: { name?: string; story?: string }) => Promise<void>;

  // ── Character Actions ─────────────────────
  loadCharacters: (projectId: string) => Promise<void>;
  addCharacter: (projectId: string, data: {
    name: string;
    entityType?: EntityType;
    description?: string;
    voiceDescription?: string;
  }) => Promise<void>;
  deleteCharacter: (projectId: string, charId: string) => Promise<void>;

  // ── Video Actions ─────────────────────────
  loadVideos: (projectId: string) => Promise<void>;
  createVideo: (projectId: string, title: string) => Promise<VisualVideo | null>;
  setActiveVideo: (video: VisualVideo | null) => void;

  // ── Scene Actions ─────────────────────────
  loadScenes: (projectId: string, videoId: string) => Promise<void>;
  addScene: (projectId: string, data: {
    videoId: string;
    prompt: string;
    videoPrompt?: string;
    characterNames?: string[];
    chainType?: ChainType;
    parentSceneId?: string;
    displayOrder?: number;
  }) => Promise<void>;
  updateScene: (sceneId: string, data: {
    prompt?: string;
    videoPrompt?: string;
    characterNames?: string[];
    displayOrder?: number;
  }) => Promise<void>;
  deleteScene: (sceneId: string) => Promise<void>;
  selectScene: (scene: VisualScene | null) => void;

  // ── Pipeline Actions ──────────────────────
  loadPipelineStatus: (projectId: string, videoId: string) => Promise<void>;
  generateRefs: (projectId: string, characterIds?: string[]) => Promise<void>;
  generateImages: (projectId: string, videoId: string) => Promise<void>;
  generateVideos: (projectId: string, videoId: string) => Promise<void>;
  concatScenes: (projectId: string, videoId: string, options?: {
    orientation?: 'VERTICAL' | 'HORIZONTAL';
    musicUrl?: string;
    musicVolume?: number;
  }) => Promise<void>;

  // ── Polling ───────────────────────────────
  startPolling: (projectId: string, videoId: string) => void;
  stopPolling: () => void;

  // ── UI Actions ────────────────────────────
  setActiveTab: (tab: StudioTab) => void;
  reset: () => void;
}

// ─────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────

const initialState = {
  project: null,
  characters: [],
  videos: [],
  scenes: [],
  activeVideo: null,
  selectedScene: null,
  pipelineStatus: null,
  isLoading: false,
  isInitialized: false,
  activeTab: 'scenes' as StudioTab,
  runningStep: null as PipelineStep,
  pollingInterval: null as ReturnType<typeof setInterval> | null,
};

export const useVisualFlowStore = create<VisualFlowState>((set, get) => ({
  ...initialState,

  // ═══════════════════════════════════════════
  // PROJECT
  // ═══════════════════════════════════════════

  loadProject: async (projectId) => {
    set({ isLoading: true });
    try {
      const project = await visualFlowApi.projects.get(projectId);
      const characters = project.characters ?? [];
      const videos = project.videos ?? [];
      const activeVideo = get().activeVideo ?? videos[0] ?? null;

      set({
        project,
        characters,
        videos,
        activeVideo,
        isInitialized: true,
      });

      // Auto-load scenes + pipeline status for active video
      if (activeVideo) {
        await Promise.all([
          get().loadScenes(projectId, activeVideo.id),
          get().loadPipelineStatus(projectId, activeVideo.id),
        ]);
      }
    } catch (error) {
      console.error('Failed to load project', error);
      toast.error('Failed to load project');
    }
    set({ isLoading: false });
  },

  updateProject: async (projectId, data) => {
    try {
      const updated = await visualFlowApi.projects.update(projectId, data);
      set({ project: updated });
      toast.success('Project updated');
    } catch (error) {
      console.error('Failed to update project', error);
      toast.error('Failed to update project');
    }
  },

  // ═══════════════════════════════════════════
  // CHARACTERS
  // ═══════════════════════════════════════════

  loadCharacters: async (projectId) => {
    try {
      const characters = await visualFlowApi.characters.list(projectId);
      set({ characters });
    } catch (error) {
      console.error('Failed to load characters', error);
    }
  },

  addCharacter: async (projectId, data) => {
    try {
      const char = await visualFlowApi.characters.add(projectId, data);
      set((s) => ({ characters: [...s.characters, char] }));
      toast.success(`Added ${data.name}`);
    } catch (error) {
      console.error('Failed to add character', error);
      toast.error('Failed to add character');
    }
  },

  deleteCharacter: async (projectId, charId) => {
    try {
      await visualFlowApi.characters.delete(projectId, charId);
      set((s) => ({ characters: s.characters.filter((c) => c.id !== charId) }));
      toast.success('Character removed');
    } catch (error) {
      console.error('Failed to delete character', error);
      toast.error('Failed to delete character');
    }
  },

  // ═══════════════════════════════════════════
  // VIDEOS
  // ═══════════════════════════════════════════

  loadVideos: async (projectId) => {
    try {
      const videos = await visualFlowApi.videos.list(projectId);
      set({ videos });
    } catch (error) {
      console.error('Failed to load videos', error);
    }
  },

  createVideo: async (projectId, title) => {
    try {
      const video = await visualFlowApi.videos.create(projectId, { title });
      set((s) => ({
        videos: [...s.videos, video],
        activeVideo: video,
        scenes: [],
        pipelineStatus: null,
      }));
      toast.success(`Created "${title}"`);
      return video;
    } catch (error) {
      console.error('Failed to create video', error);
      toast.error('Failed to create video');
      return null;
    }
  },

  setActiveVideo: (video) => {
    const prev = get().activeVideo;
    if (prev?.id === video?.id) return;

    set({
      activeVideo: video,
      scenes: [],
      selectedScene: null,
      pipelineStatus: null,
    });
  },

  // ═══════════════════════════════════════════
  // SCENES
  // ═══════════════════════════════════════════

  loadScenes: async (projectId, videoId) => {
    try {
      const scenes = await visualFlowApi.scenes.list(projectId, videoId);
      set({ scenes });
    } catch (error) {
      console.error('Failed to load scenes', error);
    }
  },

  addScene: async (projectId, data) => {
    try {
      const scene = await visualFlowApi.scenes.create(projectId, data);
      set((s) => ({ scenes: [...s.scenes, scene].sort((a, b) => a.displayOrder - b.displayOrder) }));
      toast.success('Scene added');
    } catch (error) {
      console.error('Failed to add scene', error);
      toast.error('Failed to add scene');
    }
  },

  updateScene: async (sceneId, data) => {
    try {
      const updated = await visualFlowApi.scenes.update(sceneId, data);
      set((s) => ({
        scenes: s.scenes.map((sc) => sc.id === sceneId ? updated : sc),
        selectedScene: s.selectedScene?.id === sceneId ? updated : s.selectedScene,
      }));
    } catch (error) {
      console.error('Failed to update scene', error);
      toast.error('Failed to update scene');
    }
  },

  deleteScene: async (sceneId) => {
    try {
      await visualFlowApi.scenes.delete(sceneId);
      set((s) => ({
        scenes: s.scenes.filter((sc) => sc.id !== sceneId),
        selectedScene: s.selectedScene?.id === sceneId ? null : s.selectedScene,
      }));
      toast.success('Scene removed');
    } catch (error) {
      console.error('Failed to delete scene', error);
      toast.error('Failed to delete scene');
    }
  },

  selectScene: (scene) => set({ selectedScene: scene }),

  // ═══════════════════════════════════════════
  // PIPELINE
  // ═══════════════════════════════════════════

  loadPipelineStatus: async (projectId, videoId) => {
    try {
      const status = await visualFlowApi.pipeline.status(projectId, videoId);
      set({ pipelineStatus: status });
    } catch (error) {
      console.error('Failed to load pipeline status', error);
    }
  },

  generateRefs: async (projectId, characterIds) => {
    set({ runningStep: 'refs' });
    try {
      await visualFlowApi.pipeline.generateRefs(projectId, characterIds);
      toast.success('Reference generation started');

      // Start polling for updates
      const { activeVideo } = get();
      if (activeVideo) get().startPolling(projectId, activeVideo.id);
    } catch (error) {
      console.error('Failed to generate refs', error);
      toast.error('Failed to generate references');
    }
    set({ runningStep: null });
  },

  generateImages: async (projectId, videoId) => {
    set({ runningStep: 'images' });
    try {
      await visualFlowApi.pipeline.generateImages(projectId, videoId);
      toast.success('Image generation started');
      get().startPolling(projectId, videoId);
    } catch (error) {
      console.error('Failed to generate images', error);
      toast.error('Failed to generate images');
    }
    set({ runningStep: null });
  },

  generateVideos: async (projectId, videoId) => {
    set({ runningStep: 'videos' });
    try {
      await visualFlowApi.pipeline.generateVideos(projectId, videoId);
      toast.success('Video generation started');
      get().startPolling(projectId, videoId);
    } catch (error) {
      console.error('Failed to generate videos', error);
      toast.error('Failed to generate videos');
    }
    set({ runningStep: null });
  },

  concatScenes: async (projectId, videoId, options) => {
    set({ runningStep: 'concat' });
    try {
      await visualFlowApi.pipeline.concat(projectId, videoId, options);
      toast.success('Video concatenation complete');
      await get().loadPipelineStatus(projectId, videoId);
    } catch (error) {
      console.error('Failed to concat scenes', error);
      toast.error('Failed to concatenate scenes');
    }
    set({ runningStep: null });
  },

  // ═══════════════════════════════════════════
  // POLLING
  // ═══════════════════════════════════════════

  startPolling: (projectId, videoId) => {
    // Stop any existing polling
    get().stopPolling();

    const intervalId = setInterval(async () => {
      try {
        await Promise.all([
          get().loadPipelineStatus(projectId, videoId),
          get().loadCharacters(projectId),
        ]);
      } catch {
        // Silent polling failure
      }
    }, 5000);

    set({ pollingInterval: intervalId });

    // Auto-stop after 10 minutes
    setTimeout(() => {
      get().stopPolling();
    }, 10 * 60 * 1000);
  },

  stopPolling: () => {
    const { pollingInterval } = get();
    if (pollingInterval) {
      clearInterval(pollingInterval);
      set({ pollingInterval: null });
    }
  },

  // ═══════════════════════════════════════════
  // UI
  // ═══════════════════════════════════════════

  setActiveTab: (tab) => set({ activeTab: tab }),

  reset: () => {
    get().stopPolling();
    set(initialState);
  },
}));
