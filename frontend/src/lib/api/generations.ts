import { get, post, type Cfg } from "@/lib/api";

export interface GenerationResult {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  resultUrl?: string;
  thumbnailUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface GenerateImageParams {
  prompt: string;
  model?: string;
  aspectRatio?: string;
  quality?: "standard" | "hd" | "4k";
  negativePrompt?: string;
  seed?: number;
  referenceImageUrl?: string;
  provider?: string;
}

export interface GenerateVideoParams {
  prompt: string;
  model?: string;
  duration?: string;
  aspectRatio?: string;
  startImageUrl?: string;
  endImageUrl?: string;
  provider?: string;
}

export interface UpscaleImageParams {
  imageUrl: string;
  scale?: 2 | 4;
  model?: string;
  optimization?: string;
  engine?: string;
  mode?: string;
  enhanceMode?: "balanced" | "creative" | "faithful" | "precision";
  creativity?: number;
  hdr?: number;
  resemblance?: number;
  fractality?: number;
  prompt?: string;
  provider?: string;
}

export interface EnhancePromptParams {
  prompt: string;
  style?: string;
  provider?: string;
}

// ======== New Audio Params ========

export interface GenerateMusicParams {
  prompt: string;
  genre?: string;
  moods?: string[];
  instruments?: string[];
  duration?: number;
  tempo?: number;
  provider?: string;
}

export interface GenerateSfxParams {
  prompt: string;
  category?: string;
  duration?: number;
  provider?: string;
}

export interface GenerateVoiceParams {
  text: string;
  mode?: "tts" | "clone";
  voiceId?: string;
  language?: string;
  emotion?: string;
  speed?: number;
  provider?: string;
}

// ======== New Video Processing Params ========

export interface LipSyncParams {
  videoUrl: string;
  audioUrl: string;
  syncMode?: string;
  accuracy?: number;
  smoothing?: number;
  provider?: string;
}

export interface UpscaleVideoParams {
  videoUrl: string;
  targetResolution?: string;
  model?: string;
  denoise?: number;
  sharpen?: number;
  fpsBoost?: boolean;
  provider?: string;
}

// ======== New Image Processing Params ========

export interface RemoveBackgroundParams {
  imageUrl: string;
  mode?: string;
  edgeRefinement?: number;
  provider?: string;
}

export interface GenerationProviderInfo {
  name: string;
  capabilities: string[];
}

type GenerationCapabilityHint =
  | 'image-generation'
  | 'video-generation'
  | 'audio-music'
  | 'audio-sfx'
  | 'audio-voice'
  | 'upscale'
  | 'prompt-enhance'
  | 'bg-remove'
  | 'sketch-to-image'
  | 'variations'
  | 'camera-change'
  | 'icon-gen'
  | 'image-extend'
  | 'mockup'
  | 'skin-enhance'
  | 'lip-sync'
  | 'video-upscale';

const GENERATION_CAPABILITY_HINTS: Record<string, GenerationCapabilityHint[]> = {
  '/generations/image': ['image-generation'],
  '/generations/video': ['video-generation'],
  '/generations/upscale': ['upscale'],
  '/generations/enhance-prompt': ['prompt-enhance'],
  '/generations/music': ['audio-music'],
  '/generations/sfx': ['audio-sfx'],
  '/generations/voice': ['audio-voice'],
  '/generations/lip-sync': ['lip-sync', 'video-generation'],
  '/generations/video-upscale': ['video-upscale'],
  '/generations/bg-remove': ['bg-remove'],
  '/generations/sketch-to-image': ['sketch-to-image'],
  '/generations/variations': ['variations'],
  '/generations/camera-change': ['camera-change', 'image-generation'],
  '/generations/icon-gen': ['icon-gen', 'image-generation'],
  '/generations/image-extend': ['image-extend', 'image-generation'],
  '/generations/mockup': ['mockup', 'image-generation'],
  '/generations/skin-enhance': ['skin-enhance', 'image-generation'],
};

let providerListCache: GenerationProviderInfo[] | null = null;
let providerListPromise: Promise<GenerationProviderInfo[]> | null = null;

async function loadGenerationProviders(): Promise<GenerationProviderInfo[]> {
  if (providerListCache) {
    return providerListCache;
  }

  if (!providerListPromise) {
    providerListPromise = getGenerationProviders()
      .then((providers) => {
        providerListCache = providers;
        return providers;
      })
      .catch(() => {
        return [];
      })
      .finally(() => {
        providerListPromise = null;
      });
  }

  return providerListPromise;
}

function resolveProviderName(
  providers: GenerationProviderInfo[],
  hints: GenerationCapabilityHint[],
): string | undefined {
  const providerByCapability = new Map<string, string>();

  for (const provider of providers) {
    for (const capability of provider.capabilities) {
      if (!providerByCapability.has(capability)) {
        providerByCapability.set(capability, provider.name);
      }
    }
  }

  for (const hint of hints) {
    const providerName = providerByCapability.get(hint);
    if (providerName) {
      return providerName;
    }
  }

  return undefined;
}

async function resolvePreferredProvider(
  endpoint: string,
  params: Record<string, unknown>,
): Promise<string | undefined> {
  const explicitProvider = typeof params.provider === 'string' ? params.provider.trim() : '';
  if (explicitProvider) {
    return explicitProvider;
  }

  const hints = GENERATION_CAPABILITY_HINTS[endpoint];
  if (!hints?.length) {
    return undefined;
  }

  const providers = await loadGenerationProviders();
  return resolveProviderName(providers, hints);
}

export async function postGeneration<TResponse, TParams extends object>(
  endpoint: string,
  params: TParams,
): Promise<TResponse> {
  const provider = await resolvePreferredProvider(endpoint, params as Record<string, unknown>);
  const payload = provider ? { ...(params as Record<string, unknown>), provider } : params;
  return post<TResponse>(endpoint, payload);
}

// ======== API Functions ========

/** Generate an image using the configured AI provider */
export async function generateImage(params: GenerateImageParams): Promise<GenerationResult> {
  return postGeneration<GenerationResult, GenerateImageParams>('/generations/image', params);
}

/** Generate a video using the configured AI provider */
export async function generateVideo(params: GenerateVideoParams): Promise<GenerationResult> {
  return postGeneration<GenerationResult, GenerateVideoParams>('/generations/video', params);
}

/** Upscale an image using the configured AI provider */
export async function upscaleImage(params: UpscaleImageParams): Promise<GenerationResult> {
  return postGeneration<GenerationResult, UpscaleImageParams>('/generations/upscale', params);
}

/** Enhance a prompt using AI */
export async function enhancePrompt(
  params: EnhancePromptParams
): Promise<{ enhancedPrompt: string }> {
  return postGeneration<{ enhancedPrompt: string }, EnhancePromptParams>('/generations/enhance-prompt', params);
}

/** Generate music from text description */
export async function generateMusic(params: GenerateMusicParams): Promise<GenerationResult> {
  return postGeneration<GenerationResult, GenerateMusicParams>('/generations/music', params);
}

/** Generate a sound effect from text */
export async function generateSfx(params: GenerateSfxParams): Promise<GenerationResult> {
  return postGeneration<GenerationResult, GenerateSfxParams>('/generations/sfx', params);
}

/** Generate voice audio (TTS or clone) */
export async function generateVoice(params: GenerateVoiceParams): Promise<GenerationResult> {
  return postGeneration<GenerationResult, GenerateVoiceParams>('/generations/voice', params);
}

/** Lip-sync a video to audio */
export async function lipSync(params: LipSyncParams): Promise<GenerationResult> {
  return postGeneration<GenerationResult, LipSyncParams>('/generations/lip-sync', params);
}

/** Upscale a video to higher resolution */
export async function upscaleVideo(params: UpscaleVideoParams): Promise<GenerationResult> {
  return postGeneration<GenerationResult, UpscaleVideoParams>('/generations/video-upscale', params);
}

/** Remove background from an image */
export async function removeBackground(params: RemoveBackgroundParams): Promise<GenerationResult> {
  return postGeneration<GenerationResult, RemoveBackgroundParams>('/generations/bg-remove', params);
}

export async function getGenerationProviders(): Promise<GenerationProviderInfo[]> {
  return get<GenerationProviderInfo[]>("/generations/providers");
}

/** Get generation status by ID */
export async function getGeneration(
  id: string,
  config?: Cfg,
): Promise<GenerationResult> {
  return get<GenerationResult>(`/generations/${id}`, config);
}
