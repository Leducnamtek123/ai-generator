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
export type Orientation = 'VERTICAL' | 'HORIZONTAL' | 'BOTH';

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
  },
};
