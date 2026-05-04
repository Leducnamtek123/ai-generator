import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Text-to-Speech service — generates narration audio for video scenes.
 * Ported from FlowKit: supports multiple TTS providers (OpenAI, ElevenLabs)
 * with batch generation and voice cloning capabilities.
 */

export interface TTSGenerateOptions {
  text: string;
  voice?: string;
  speed?: number;
  model?: string;
  outputPath: string;
}

export interface TTSBatchItem {
  sceneId: string;
  text: string;
  displayOrder: number;
}

export interface TTSBatchResult {
  sceneId: string;
  displayOrder: number;
  text: string;
  audioPath: string | null;
  duration: number | null;
  status: 'COMPLETED' | 'SKIPPED' | 'FAILED';
  error: string | null;
}

@Injectable()
export class TTSService {
  private readonly logger = new Logger(TTSService.name);
  private readonly provider: string;
  private readonly openaiKey: string;
  private readonly elevenLabsKey: string;
  private readonly defaultVoice: string;
  private readonly defaultModel: string;
  private readonly defaultSpeed: number;
  private readonly openaiClient: AxiosInstance;
  private readonly elevenLabsClient: AxiosInstance;

  constructor(private readonly configService: ConfigService) {
    this.provider =
      this.configService.get<string>('TTS_PROVIDER') || 'openai';
    this.openaiKey =
      this.configService.get<string>('OPENAI_API_KEY') || '';
    this.elevenLabsKey =
      this.configService.get<string>('ELEVENLABS_API_KEY') || '';
    this.defaultVoice =
      this.configService.get<string>('TTS_DEFAULT_VOICE') || 'alloy';
    this.defaultModel =
      this.configService.get<string>('TTS_DEFAULT_MODEL') || 'tts-1-hd';
    this.defaultSpeed =
      this.configService.get<number>('TTS_DEFAULT_SPEED') || 1.0;

    this.openaiClient = axios.create({
      baseURL: 'https://api.openai.com/v1',
      timeout: 60_000,
      headers: {
        Authorization: `Bearer ${this.openaiKey}`,
      },
    });

    this.elevenLabsClient = axios.create({
      baseURL: 'https://api.elevenlabs.io/v1',
      timeout: 60_000,
      headers: {
        'xi-api-key': this.elevenLabsKey,
      },
    });
  }

  private ensureDir(filePath: string): void {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  // ─── Single generation ──────────────────────────

  async generateSpeech(options: TTSGenerateOptions): Promise<string> {
    if (this.provider === 'elevenlabs') {
      return this.generateElevenLabs(options);
    }
    return this.generateOpenAI(options);
  }

  private async generateOpenAI(options: TTSGenerateOptions): Promise<string> {
    if (!this.openaiKey) {
      throw new BadRequestException(
        'OPENAI_API_KEY not configured — required for TTS',
      );
    }
    this.ensureDir(options.outputPath);

    const response = await this.openaiClient.post(
      '/audio/speech',
      {
        model: options.model || this.defaultModel,
        input: options.text,
        voice: options.voice || this.defaultVoice,
        speed: options.speed || this.defaultSpeed,
        response_format: 'mp3',
      },
      { responseType: 'arraybuffer' },
    );

    fs.writeFileSync(options.outputPath, Buffer.from(response.data));
    this.logger.log(`TTS (OpenAI) → ${options.outputPath}`);
    return options.outputPath;
  }

  private async generateElevenLabs(
    options: TTSGenerateOptions,
  ): Promise<string> {
    if (!this.elevenLabsKey) {
      throw new BadRequestException(
        'ELEVENLABS_API_KEY not configured — required for ElevenLabs TTS',
      );
    }
    this.ensureDir(options.outputPath);

    const voiceId = options.voice || this.defaultVoice;
    const response = await this.elevenLabsClient.post(
      `/text-to-speech/${voiceId}`,
      {
        text: options.text,
        model_id: options.model || 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          speed: options.speed || this.defaultSpeed,
        },
      },
      { responseType: 'arraybuffer' },
    );

    fs.writeFileSync(options.outputPath, Buffer.from(response.data));
    this.logger.log(`TTS (ElevenLabs) → ${options.outputPath}`);
    return options.outputPath;
  }

  // ─── Batch generation for video narration ───────

  /**
   * Generate narration audio for all scenes that have narrator_text.
   * Skips scenes without text. Caches — won't regenerate if WAV already exists.
   */
  async generateVideoNarration(
    scenes: TTSBatchItem[],
    outputDir: string,
    options: {
      voice?: string;
      speed?: number;
      model?: string;
      forceRegenerate?: boolean;
    } = {},
  ): Promise<TTSBatchResult[]> {
    this.ensureDir(path.join(outputDir, '.keep'));
    const results: TTSBatchResult[] = [];

    for (const scene of scenes) {
      if (!scene.text?.trim()) {
        results.push({
          sceneId: scene.sceneId,
          displayOrder: scene.displayOrder,
          text: '',
          audioPath: null,
          duration: null,
          status: 'SKIPPED',
          error: null,
        });
        continue;
      }

      const outputPath = path.join(
        outputDir,
        `scene_${String(scene.displayOrder).padStart(3, '0')}_${scene.sceneId}.mp3`,
      );

      // Skip if already exists (caching)
      if (
        !options.forceRegenerate &&
        fs.existsSync(outputPath) &&
        fs.statSync(outputPath).size > 1024
      ) {
        this.logger.log(
          `Skipping scene ${scene.displayOrder} (audio exists: ${outputPath})`,
        );
        results.push({
          sceneId: scene.sceneId,
          displayOrder: scene.displayOrder,
          text: scene.text,
          audioPath: outputPath,
          duration: null,
          status: 'COMPLETED',
          error: null,
        });
        continue;
      }

      try {
        await this.generateSpeech({
          text: scene.text,
          voice: options.voice,
          speed: options.speed,
          model: options.model,
          outputPath,
        });

        results.push({
          sceneId: scene.sceneId,
          displayOrder: scene.displayOrder,
          text: scene.text,
          audioPath: outputPath,
          duration: null, // Duration can be probed via ffprobe if needed
          status: 'COMPLETED',
          error: null,
        });
      } catch (err: any) {
        this.logger.error(
          `TTS failed for scene ${scene.sceneId}: ${err.message}`,
        );
        results.push({
          sceneId: scene.sceneId,
          displayOrder: scene.displayOrder,
          text: scene.text,
          audioPath: null,
          duration: null,
          status: 'FAILED',
          error: err.message,
        });
      }
    }

    const completed = results.filter((r) => r.status === 'COMPLETED').length;
    const failed = results.filter((r) => r.status === 'FAILED').length;
    this.logger.log(
      `Batch TTS: ${completed} completed, ${failed} failed, ${results.length - completed - failed} skipped`,
    );

    return results;
  }

  // ─── List available voices ──────────────────────

  async listVoices(): Promise<any[]> {
    if (this.provider === 'elevenlabs') {
      if (!this.elevenLabsKey) return [];
      const { data } = await this.elevenLabsClient.get('/voices');
      return (data.voices || []).map((v: any) => ({
        id: v.voice_id,
        name: v.name,
        category: v.category,
        labels: v.labels,
        preview_url: v.preview_url,
      }));
    }

    // OpenAI voices are fixed
    return [
      { id: 'alloy', name: 'Alloy', category: 'neutral' },
      { id: 'echo', name: 'Echo', category: 'male' },
      { id: 'fable', name: 'Fable', category: 'male' },
      { id: 'onyx', name: 'Onyx', category: 'male-deep' },
      { id: 'nova', name: 'Nova', category: 'female' },
      { id: 'shimmer', name: 'Shimmer', category: 'female' },
      { id: 'ash', name: 'Ash', category: 'male' },
      { id: 'ballad', name: 'Ballad', category: 'male' },
      { id: 'coral', name: 'Coral', category: 'female' },
      { id: 'sage', name: 'Sage', category: 'female' },
      { id: 'verse', name: 'Verse', category: 'neutral' },
    ];
  }
}
