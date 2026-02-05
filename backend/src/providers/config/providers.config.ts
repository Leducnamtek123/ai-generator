import { registerAs } from '@nestjs/config';

export interface ProviderConfig {
  webhookUrl?: string;
  apiKey?: string;
  modelId?: string;
}

export interface ProvidersConfigType {
  imageGeneration: {
    provider: string;
    n8n: ProviderConfig;
    leonardo: ProviderConfig;
    openai: ProviderConfig;
  };
  videoGeneration: {
    provider: string;
    n8n: ProviderConfig;
    runway: ProviderConfig;
  };
  upscaler: {
    provider: string;
    n8n: ProviderConfig;
    replicate: ProviderConfig;
  };
  promptEnhancer: {
    provider: string;
    n8n: ProviderConfig;
    openai: ProviderConfig;
  };
}

export default registerAs(
  'providers',
  (): ProvidersConfigType => ({
    imageGeneration: {
      provider: process.env.IMAGE_GEN_PROVIDER || 'n8n',
      n8n: {
        webhookUrl: process.env.N8N_IMAGE_WEBHOOK_URL,
      },
      leonardo: {
        apiKey: process.env.LEONARDO_API_KEY,
        modelId: process.env.LEONARDO_MODEL_ID || 'phoenix',
      },
      openai: {
        apiKey: process.env.OPENAI_API_KEY,
      },
    },
    videoGeneration: {
      provider: process.env.VIDEO_GEN_PROVIDER || 'n8n',
      n8n: {
        webhookUrl: process.env.N8N_VIDEO_WEBHOOK_URL,
      },
      runway: {
        apiKey: process.env.RUNWAY_API_KEY,
      },
    },
    upscaler: {
      provider: process.env.UPSCALER_PROVIDER || 'n8n',
      n8n: {
        webhookUrl: process.env.N8N_UPSCALE_WEBHOOK_URL,
      },
      replicate: {
        apiKey: process.env.REPLICATE_API_KEY,
      },
    },
    promptEnhancer: {
      provider: process.env.PROMPT_ENHANCER_PROVIDER || 'n8n',
      n8n: {
        webhookUrl: process.env.N8N_PROMPT_WEBHOOK_URL,
      },
      openai: {
        apiKey: process.env.OPENAI_API_KEY,
      },
    },
  }),
);
