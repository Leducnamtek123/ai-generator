import { registerAs } from '@nestjs/config';

export interface ProviderConfig {
  apiKey?: string;
  modelId?: string;
}

export interface ProvidersConfigType {
  // === Image Generation ===
  imageGeneration: {
    provider: string; // 'replicate' | 'fal' | 'openai' | 'leonardo' | 'stability'
    defaultModel?: string;
  };

  // === Video Generation ===
  videoGeneration: {
    provider: string; // 'replicate' | 'runway' | 'fal'
    defaultModel?: string;
  };

  // === Image Upscaling ===
  upscaler: {
    provider: string; // 'replicate' | 'stability' | 'fal'
  };

  // === Prompt Enhancement ===
  promptEnhancer: {
    provider: string; // 'openai' | 'replicate'
  };

  // === Audio ===
  audio: {
    musicProvider: string; // 'replicate'
    sfxProvider: string;   // 'elevenlabs' | 'replicate'
    voiceProvider: string; // 'elevenlabs'
  };

  // === Image Processing ===
  imageProcessing: {
    provider: string; // 'replicate' | 'fal' | 'stability'
  };

  // === Provider API Keys ===
  replicate: ProviderConfig;
  stability: ProviderConfig;
  openai: ProviderConfig;
  leonardo: ProviderConfig;
  runway: ProviderConfig;
  elevenlabs: ProviderConfig;
  fal: ProviderConfig;
}

export default registerAs(
  'providers',
  (): ProvidersConfigType => ({
    // === Capability → Provider Mapping ===
    imageGeneration: {
      provider: process.env.IMAGE_GEN_PROVIDER || 'replicate',
      defaultModel: process.env.IMAGE_GEN_MODEL || 'flux-pro',
    },
    videoGeneration: {
      provider: process.env.VIDEO_GEN_PROVIDER || 'replicate',
      defaultModel: process.env.VIDEO_GEN_MODEL,
    },
    upscaler: {
      provider: process.env.UPSCALER_PROVIDER || 'replicate',
    },
    promptEnhancer: {
      provider: process.env.PROMPT_ENHANCER_PROVIDER || 'openai',
    },
    audio: {
      musicProvider: process.env.MUSIC_PROVIDER || 'replicate',
      sfxProvider: process.env.SFX_PROVIDER || 'elevenlabs',
      voiceProvider: process.env.VOICE_PROVIDER || 'elevenlabs',
    },
    imageProcessing: {
      provider: process.env.IMAGE_PROCESSING_PROVIDER || 'replicate',
    },

    // === Provider API Keys ===
    replicate: {
      apiKey: process.env.REPLICATE_API_KEY,
    },
    stability: {
      apiKey: process.env.STABILITY_API_KEY,
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
    },
    leonardo: {
      apiKey: process.env.LEONARDO_API_KEY,
      modelId: process.env.LEONARDO_MODEL_ID || 'phoenix',
    },
    runway: {
      apiKey: process.env.RUNWAY_API_KEY,
    },
    elevenlabs: {
      apiKey: process.env.ELEVENLABS_API_KEY,
    },
    fal: {
      apiKey: process.env.FAL_API_KEY,
    },
  }),
);
