import { api } from '@/lib/api';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type EntityType = 'character' | 'location' | 'creature' | 'visual_asset';
export type ChainType = 'ROOT' | 'CONTINUATION' | 'INSERT';
export type RefStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type SceneStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type ProjectStatus = 'ACTIVE' | 'ARCHIVED';
export type VideoStatus = 'DRAFT' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
type Orientation = 'VERTICAL' | 'HORIZONTAL' | 'BOTH';

export interface VisualCharacter {
  id: string;
  projectId: string;
  name: string;
  entityType: EntityType;
  description?: string;
  voiceDescription?: string;
  referenceImageUrl?: string;
  mediaId?: string;
  refStatus: RefStatus;
  createdAt: string;
  updatedAt: string;
}

export interface VisualScene {
  id: string;
  videoId: string;
  displayOrder: number;
  prompt: string;
  videoPrompt?: string;
  characterNames: string[];
  chainType: ChainType;
  parentSceneId?: string;
  verticalImageUrl?: string;
  verticalVideoUrl?: string;
  verticalMediaId?: string;
  verticalImageStatus: SceneStatus;
  verticalVideoStatus: SceneStatus;
  horizontalImageUrl?: string;
  horizontalVideoUrl?: string;
  horizontalMediaId?: string;
  horizontalImageStatus: SceneStatus;
  horizontalVideoStatus: SceneStatus;
  trimStart?: number;
  trimEnd?: number;
  duration?: number;
  createdAt: string;
  updatedAt: string;
}

export interface VisualVideo {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  displayOrder: number;
  status: VideoStatus;
  verticalUrl?: string;
  horizontalUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  scenes?: VisualScene[];
  createdAt: string;
  updatedAt: string;
}

export interface VisualProject {
  id: string;
  userId: string;
  name: string;
  story?: string;
  thumbnailUrl?: string;
  language: string;
  status: ProjectStatus;
  characters?: VisualCharacter[];
  videos?: VisualVideo[];
  createdAt: string;
  updatedAt: string;
}

export interface PipelineStatus {
  project: { id: string; name: string; status: ProjectStatus };
  characters: {
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  };
  scenes: {
    total: number;
    verticalImages: { pending: number; completed: number; failed: number };
    verticalVideos: { pending: number; completed: number; failed: number };
    horizontalImages: { pending: number; completed: number; failed: number };
  };
  sceneList: Array<{
    id: string;
    order: number;
    chainType: ChainType;
    characterNames: string[];
    verticalImageStatus: SceneStatus;
    verticalVideoStatus: SceneStatus;
    horizontalImageStatus: SceneStatus;
    horizontalVideoStatus: SceneStatus;
    verticalImageUrl?: string;
    verticalVideoUrl?: string;
    horizontalImageUrl?: string;
    horizontalVideoUrl?: string;
  }>;
}

// ─────────────────────────────────────────────
// API Client
// ─────────────────────────────────────────────

const BASE = '/visual-flow';

export const visualFlowApi = {
  // ── Projects ──────────────────────────────
  projects: {
    create: async (data: {
      name: string;
      story?: string;
      language?: string;
      characters?: Array<{
        name: string;
        entityType?: EntityType;
        description?: string;
        voiceDescription?: string;
      }>;
    }): Promise<VisualProject> => {
      const res = await api.post(`${BASE}/projects`, data);
      return res.data;
    },

    list: async (page = 1, limit = 20): Promise<{ data: VisualProject[]; total: number; page: number }> => {
      const res = await api.get(`${BASE}/projects`, { params: { page, limit } });
      return res.data;
    },

    get: async (id: string): Promise<VisualProject> => {
      const res = await api.get(`${BASE}/projects/${id}`);
      return res.data;
    },

    update: async (id: string, data: { name?: string; story?: string; status?: ProjectStatus }): Promise<VisualProject> => {
      const res = await api.patch(`${BASE}/projects/${id}`, data);
      return res.data;
    },

    delete: async (id: string): Promise<void> => {
      await api.delete(`${BASE}/projects/${id}`);
    },
  },

  // ── Characters ────────────────────────────
  characters: {
    add: async (projectId: string, data: { name: string; entityType?: EntityType; description?: string; voiceDescription?: string }): Promise<VisualCharacter> => {
      const res = await api.post(`${BASE}/projects/${projectId}/characters`, data);
      return res.data;
    },

    list: async (projectId: string): Promise<VisualCharacter[]> => {
      const res = await api.get(`${BASE}/projects/${projectId}/characters`);
      return res.data;
    },

    delete: async (projectId: string, charId: string): Promise<void> => {
      await api.delete(`${BASE}/projects/${projectId}/characters/${charId}`);
    },
  },

  // ── Videos ───────────────────────────────
  videos: {
    create: async (projectId: string, data: { title: string; description?: string; displayOrder?: number }): Promise<VisualVideo> => {
      const res = await api.post(`${BASE}/projects/${projectId}/videos`, data);
      return res.data;
    },

    list: async (projectId: string): Promise<VisualVideo[]> => {
      const res = await api.get(`${BASE}/projects/${projectId}/videos`);
      return res.data;
    },
  },

  // ── Scenes ───────────────────────────────
  scenes: {
    create: async (projectId: string, data: {
      videoId: string;
      prompt: string;
      videoPrompt?: string;
      characterNames?: string[];
      chainType?: ChainType;
      parentSceneId?: string;
      displayOrder?: number;
    }): Promise<VisualScene> => {
      const res = await api.post(`${BASE}/projects/${projectId}/scenes`, data);
      return res.data;
    },

    list: async (projectId: string, videoId: string): Promise<VisualScene[]> => {
      const res = await api.get(`${BASE}/projects/${projectId}/videos/${videoId}/scenes`);
      return res.data;
    },

    update: async (sceneId: string, data: { prompt?: string; videoPrompt?: string; characterNames?: string[]; displayOrder?: number }): Promise<VisualScene> => {
      const res = await api.patch(`${BASE}/scenes/${sceneId}`, data);
      return res.data;
    },

    delete: async (sceneId: string): Promise<void> => {
      await api.delete(`${BASE}/scenes/${sceneId}`);
    },
  },

  // ── Pipeline ─────────────────────────────
  pipeline: {
    generateRefs: async (projectId: string, characterIds?: string[]) => {
      const res = await api.post(`${BASE}/projects/${projectId}/gen-refs`, { characterIds });
      return res.data;
    },

    generateImages: async (projectId: string, videoId: string, orientation: Orientation = 'BOTH', sceneIds?: string[]) => {
      const res = await api.post(`${BASE}/projects/${projectId}/videos/${videoId}/gen-images`, { orientation, sceneIds });
      return res.data;
    },

    generateVideos: async (projectId: string, videoId: string, orientation: Orientation = 'BOTH', sceneIds?: string[]) => {
      const res = await api.post(`${BASE}/projects/${projectId}/videos/${videoId}/gen-videos`, { orientation, sceneIds });
      return res.data;
    },

    status: async (projectId: string, videoId: string): Promise<PipelineStatus> => {
      const res = await api.get(`${BASE}/projects/${projectId}/videos/${videoId}/status`);
      return res.data;
    },

    concat: async (projectId: string, videoId: string, options?: {
      orientation?: 'VERTICAL' | 'HORIZONTAL';
      sceneIds?: string[];
      musicUrl?: string;
      musicVolume?: number;
    }) => {
      const res = await api.post(`${BASE}/projects/${projectId}/videos/${videoId}/concat`, options ?? {});
      return res.data;
    },

    slideshow: async (projectId: string, videoId: string, options?: {
      orientation?: 'VERTICAL' | 'HORIZONTAL';
      sceneIds?: string[];
      durationPerSlide?: number;
      transitionDuration?: number;
      zoomEffect?: boolean;
      musicUrl?: string;
      musicVolume?: number;
    }) => {
      const res = await api.post(`${BASE}/projects/${projectId}/videos/${videoId}/slideshow`, options ?? {});
      return res.data;
    },

    review: async (projectId: string, videoId: string, options?: {
      sceneIds?: string;
      orientation?: 'VERTICAL' | 'HORIZONTAL';
      mode?: 'light' | 'deep';
    }) => {
      const res = await api.post(`${BASE}/projects/${projectId}/videos/${videoId}/review`, options ?? {});
      return res.data;
    },

    enrichPrompts: async (projectId: string, videoId: string) => {
      const res = await api.post(`${BASE}/projects/${projectId}/videos/${videoId}/enrich-prompts`);
      return res.data;
    },

    staleScenes: async (projectId: string, videoId: string) => {
      const res = await api.get(`${BASE}/projects/${projectId}/videos/${videoId}/stale-scenes`);
      return res.data;
    },
  },

  // ── Scene Chain ─────────────────────────
  sceneChain: {
    createContinuation: async (projectId: string, videoId: string, data: {
      parentSceneId: string;
      prompt: string;
      videoPrompt?: string;
      characterNames?: string[];
      displayOrder?: number;
    }) => {
      const res = await api.post(`${BASE}/projects/${projectId}/videos/${videoId}/scenes/continue`, data);
      return res.data;
    },

    insertScene: async (projectId: string, videoId: string, data: {
      atOrder: number;
      prompt: string;
      characterNames?: string[];
    }) => {
      const res = await api.post(`${BASE}/projects/${projectId}/videos/${videoId}/scenes/insert`, data);
      return res.data;
    },

    getChainInfo: async (projectId: string, videoId: string, sceneId: string) => {
      const res = await api.get(`${BASE}/projects/${projectId}/videos/${videoId}/scenes/${sceneId}/chain`);
      return res.data;
    },

    reorderScenes: async (projectId: string, videoId: string, sceneIds: string[]) => {
      const res = await api.post(`${BASE}/projects/${projectId}/videos/${videoId}/scenes/reorder`, { sceneIds });
      return res.data;
    },

    cleanup: async (projectId: string, videoId: string, chainType: ChainType) => {
      const res = await api.delete(`${BASE}/projects/${projectId}/videos/${videoId}/scenes/cleanup`, {
        data: { chainType },
      });
      return res.data;
    },
  },

  // ── Materials ───────────────────────────
  materials: {
    list: async () => {
      const res = await api.get(`${BASE}/materials`);
      return res.data;
    },

    get: async (id: string) => {
      const res = await api.get(`${BASE}/materials/${id}`);
      return res.data;
    },

    register: async (data: {
      id: string;
      name: string;
      styleInstruction: string;
      negativePrompt?: string;
      scenePrefix?: string;
      lighting?: string;
    }) => {
      const res = await api.post(`${BASE}/materials`, data);
      return res.data;
    },

    remove: async (id: string) => {
      await api.delete(`${BASE}/materials/${id}`);
    },

    applyToProject: async (projectId: string, materialId: string, sceneIds?: string[]) => {
      const res = await api.post(`${BASE}/projects/${projectId}/apply-material`, { materialId, sceneIds });
      return res.data;
    },
  },

  // ── Post-Processing ─────────────────────
  postProcess: {
    trim: async (inputUrl: string, start: number, end: number) => {
      const res = await api.post(`${BASE}/post-process/trim`, { inputUrl, start, end });
      return res.data;
    },

    merge: async (videoUrls: string[]) => {
      const res = await api.post(`${BASE}/post-process/merge`, { videoUrls });
      return res.data;
    },

    addNarration: async (videoUrl: string, narrationUrl: string, options?: {
      narrationVolume?: number;
      sfxVolume?: number;
    }) => {
      const res = await api.post(`${BASE}/post-process/add-narration`, { videoUrl, narrationUrl, ...options });
      return res.data;
    },

    addMusic: async (videoUrl: string, musicUrl: string, options?: {
      musicVolume?: number;
    }) => {
      const res = await api.post(`${BASE}/post-process/add-music`, { videoUrl, musicUrl, ...options });
      return res.data;
    },

    imageToVideo: async (imagePath: string, options?: {
      duration?: number;
      width?: number;
      height?: number;
      zoomDirection?: 'in' | 'out' | 'pan_left' | 'pan_right';
    }) => {
      const res = await api.post(`${BASE}/post-process/image-to-video`, { imagePath, ...options });
      return res.data;
    },

    imagesToSlideshow: async (imagePaths: string[], options?: {
      durationPerSlide?: number;
      transitionDuration?: number;
      zoomEffect?: boolean;
      width?: number;
      height?: number;
      musicUrl?: string;
      musicVolume?: number;
    }) => {
      const res = await api.post(`${BASE}/post-process/images-slideshow`, { imagePaths, ...options });
      return res.data;
    },
  },

  // ── Music (Suno) ────────────────────────
  music: {
    generate: async (data: {
      prompt: string;
      style?: string;
      title?: string;
      instrumental?: boolean;
      model?: string;
      customMode?: boolean;
      poll?: boolean;
    }) => {
      const res = await api.post(`${BASE}/music/generate`, data);
      return res.data;
    },

    generateLyrics: async (prompt: string, poll = false) => {
      const res = await api.post(`${BASE}/music/generate-lyrics`, { prompt, poll });
      return res.data;
    },

    getTask: async (taskId: string) => {
      const res = await api.get(`${BASE}/music/tasks/${taskId}`);
      return res.data;
    },

    pollTask: async (taskId: string) => {
      const res = await api.post(`${BASE}/music/tasks/${taskId}/poll`);
      return res.data;
    },

    extend: async (audioId: string, data: {
      prompt?: string;
      continueAt?: number;
      model?: string;
      poll?: boolean;
    }) => {
      const res = await api.post(`${BASE}/music/extend`, { audioId, ...data });
      return res.data;
    },

    vocalRemoval: async (taskId: string, audioId: string, poll = false) => {
      const res = await api.post(`${BASE}/music/vocal-removal`, { taskId, audioId, poll });
      return res.data;
    },

    convertToWav: async (taskId: string, audioId: string, poll = false) => {
      const res = await api.post(`${BASE}/music/convert-to-wav`, { taskId, audioId, poll });
      return res.data;
    },

    getCredits: async () => {
      const res = await api.get(`${BASE}/music/credits`);
      return res.data;
    },
  },

  // ── TTS / Narration ─────────────────────
  tts: {
    generateSpeech: async (data: {
      text: string;
      voice?: string;
      speed?: number;
      model?: string;
    }) => {
      const res = await api.post(`${BASE}/tts/generate`, data);
      return res.data;
    },

    listVoices: async () => {
      const res = await api.get(`${BASE}/tts/voices`);
      return res.data;
    },

    generateNarration: async (projectId: string, videoId: string, data: {
      voice?: string;
      speed?: number;
      model?: string;
      forceRegenerate?: boolean;
      overlayOnVideos?: boolean;
      orientation?: 'VERTICAL' | 'HORIZONTAL';
    }) => {
      const res = await api.post(`${BASE}/projects/${projectId}/videos/${videoId}/narration`, data);
      return res.data;
    },
  },

  // ── Voice Templates ─────────────────────
  voiceTemplates: {
    create: async (data: {
      name: string;
      text: string;
      voice?: string;
      speed?: number;
      model?: string;
      description?: string;
    }) => {
      const res = await api.post(`${BASE}/tts/templates`, data);
      return res.data;
    },

    list: async () => {
      const res = await api.get(`${BASE}/tts/templates`);
      return res.data;
    },

    get: async (templateId: string) => {
      const res = await api.get(`${BASE}/tts/templates/${templateId}`);
      return res.data;
    },

    update: async (templateId: string, data: { name?: string; description?: string }) => {
      const res = await api.patch(`${BASE}/tts/templates/${templateId}`, data);
      return res.data;
    },

    delete: async (templateId: string) => {
      await api.delete(`${BASE}/tts/templates/${templateId}`);
    },
  },

  // ── Prompt Builder ──────────────────────
  promptBuilder: {
    buildReference: async (data: {
      entityName: string;
      description: string;
      entityType?: EntityType;
      materialId?: string;
      story?: string;
    }) => {
      const res = await api.post(`${BASE}/prompt-builder/reference`, data);
      return res.data;
    },
  },
};
