import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '../../config/config.type';
import {
  BaseProvider,
  GenerationResult,
  AudioOptions,
  ProviderCapability,
} from '../provider.interface';

const ELEVENLABS_API_BASE = 'https://api.elevenlabs.io/v1';

/**
 * ElevenLabs API Adapter
 * Supports: Voice TTS, Sound Effects
 */
@Injectable()
export class ElevenLabsAdapter extends BaseProvider {
  readonly name = 'elevenlabs';
  readonly capabilities: ProviderCapability[] = [
    'audio-voice',
    'audio-sfx',
  ];

  private readonly logger = new Logger(ElevenLabsAdapter.name);

  // Popular voice IDs
  private readonly defaultVoices: Record<string, string> = {
    'rachel': '21m00Tcm4TlvDq8ikWAM',
    'drew': '29vD33N1CtxCmqQRPOHJ',
    'clyde': '2EiwWnXFnvU5JabPnv8n',
    'paul': '5Q0t7uMcjvnagumLfvZi',
    'domi': 'AZnzlk1XvdvUeBnXmlld',
    'dave': 'CYw3kZ02Hs0563khs1Fj',
    'fin': 'D38z5RcWu1voky8WS1ja',
    'sarah': 'EXAVITQu4vr4xnSDxMaL',
    'antoni': 'ErXwobaYiN019PkySvjV',
    'thomas': 'GBv7mTt0atIp3Br8iCZE',
  };

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService<AllConfigType>,
  ) {
    super();
  }

  private getApiKey(): string {
    const apiKey = this.configService.get(
      'providers.elevenlabs.apiKey',
      { infer: true },
    ) as string | undefined;
    if (!apiKey) {
      throw new Error('ELEVENLABS_API_KEY is not configured');
    }
    return apiKey;
  }

  private getHeaders() {
    return {
      'xi-api-key': this.getApiKey(),
      'Content-Type': 'application/json',
    };
  }

  // ==================== Voice Generation (TTS) ====================

  async generateAudio(
    prompt: string,
    type: 'music' | 'sfx' | 'voice',
    options?: AudioOptions,
  ): Promise<GenerationResult> {
    if (type === 'voice') {
      return this.generateVoice(prompt, options);
    }
    if (type === 'sfx') {
      return this.generateSoundEffect(prompt, options);
    }

    throw new Error('ElevenLabs does not support music generation. Use Replicate instead.');
  }

  private async generateVoice(
    text: string,
    options?: AudioOptions,
  ): Promise<GenerationResult> {
    const voiceId = this.resolveVoiceId(options?.voice);
    const model = options?.model || 'eleven_multilingual_v2';

    this.logger.log(`Generating voice with ElevenLabs, voice: ${voiceId}`);

    try {
      const response = await this.httpService.axiosRef.post(
        `${ELEVENLABS_API_BASE}/text-to-speech/${voiceId}`,
        {
          text,
          model_id: model,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.5,
            use_speaker_boost: true,
          },
        },
        {
          headers: {
            'xi-api-key': this.getApiKey(),
            'Content-Type': 'application/json',
            Accept: 'audio/mpeg',
          },
          responseType: 'arraybuffer',
          timeout: 60000,
        },
      );

      // Convert buffer to base64 data URI
      const base64 = Buffer.from(response.data).toString('base64');
      const resultUrl = `data:audio/mpeg;base64,${base64}`;

      return {
        id: crypto.randomUUID(),
        status: 'completed',
        resultUrl,
        metadata: {
          provider: 'elevenlabs',
          type: 'voice',
          voiceId,
          model,
        },
      };
    } catch (error: any) {
      this.logger.error(`ElevenLabs TTS failed: ${error.message}`);
      throw error;
    }
  }

  // ==================== Sound Effects ====================

  private async generateSoundEffect(
    text: string,
    options?: AudioOptions,
  ): Promise<GenerationResult> {
    this.logger.log(`Generating sound effect with ElevenLabs`);

    try {
      const response = await this.httpService.axiosRef.post(
        `${ELEVENLABS_API_BASE}/sound-generation`,
        {
          text,
          duration_seconds: options?.duration || 5,
          prompt_influence: 0.5,
        },
        {
          headers: {
            'xi-api-key': this.getApiKey(),
            'Content-Type': 'application/json',
            Accept: 'audio/mpeg',
          },
          responseType: 'arraybuffer',
          timeout: 60000,
        },
      );

      const base64 = Buffer.from(response.data).toString('base64');
      const resultUrl = `data:audio/mpeg;base64,${base64}`;

      return {
        id: crypto.randomUUID(),
        status: 'completed',
        resultUrl,
        metadata: {
          provider: 'elevenlabs',
          type: 'sfx',
          duration: options?.duration || 5,
        },
      };
    } catch (error: any) {
      this.logger.error(`ElevenLabs SFX failed: ${error.message}`);
      throw error;
    }
  }

  // ==================== Helpers ====================

  private resolveVoiceId(voiceNameOrId?: string): string {
    if (!voiceNameOrId) return this.defaultVoices['rachel'];

    // Check if it's a known voice name
    const lowerName = voiceNameOrId.toLowerCase();
    if (this.defaultVoices[lowerName]) {
      return this.defaultVoices[lowerName];
    }

    // Assume it's a voice ID
    return voiceNameOrId;
  }
}
