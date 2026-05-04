import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

/**
 * Suno music generation client — sunoapi.org backend.
 * Ported from FlowKit: async client for generating music, lyrics,
 * extending tracks, vocal removal, and format conversion.
 */

export interface SunoGenerateOptions {
  prompt: string;
  style?: string;
  title?: string;
  instrumental?: boolean;
  model?: string;
  customMode?: boolean;
}

export interface SunoClip {
  id: string;
  title: string;
  audioUrl: string;
  duration: number;
  status: string;
}

@Injectable()
export class MusicService {
  private readonly logger = new Logger(MusicService.name);
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly pollInterval: number;
  private readonly pollTimeout: number;
  private readonly callbackUrl: string;
  private readonly client: AxiosInstance;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('SUNO_API_KEY') || '';
    this.baseUrl = (
      this.configService.get<string>('SUNO_BASE_URL') ||
      'https://api.sunoapi.org'
    ).replace(/\/$/, '');
    this.model = this.configService.get<string>('SUNO_MODEL') || 'V4';
    this.pollInterval =
      this.configService.get<number>('SUNO_POLL_INTERVAL') || 10;
    this.pollTimeout =
      this.configService.get<number>('SUNO_POLL_TIMEOUT') || 300;
    this.callbackUrl =
      this.configService.get<string>('SUNO_CALLBACK_URL') || '';

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  private checkKey(): void {
    if (!this.apiKey) {
      throw new Error(
        'SUNO_API_KEY not configured. Get one at https://sunoapi.org/api-key',
      );
    }
  }

  private checkResponse(data: any): void {
    if (data?.code && data.code !== 200) {
      throw new Error(
        `Suno API error ${data.code}: ${data.msg || 'unknown'}`,
      );
    }
  }

  // ── Generate ─────────────────────────────────────

  async generate(options: SunoGenerateOptions): Promise<string> {
    this.checkKey();
    const payload: Record<string, any> = {
      model: options.model || this.model,
      instrumental: options.instrumental ?? false,
      customMode: options.customMode ?? true,
      prompt: options.prompt,
    };
    if (options.customMode !== false) {
      if (options.style) payload.style = options.style;
      if (options.title) payload.title = options.title;
    }
    if (this.callbackUrl) payload.callBackUrl = this.callbackUrl;

    const { data } = await this.client.post('/api/v1/generate', payload);
    this.checkResponse(data);
    const taskId = data.data.taskId;
    this.logger.log(`Suno generate: taskId=${taskId}`);
    return taskId;
  }

  // ── Task status / polling ─────────────────────────

  async getTask(taskId: string): Promise<any> {
    this.checkKey();
    const { data } = await this.client.get(
      '/api/v1/generate/record-info',
      { params: { taskId } },
    );
    this.checkResponse(data);
    return data.data || {};
  }

  async pollTask(
    taskId: string,
    interval?: number,
    timeout?: number,
  ): Promise<any> {
    const intv = interval || this.pollInterval;
    const tout = timeout || this.pollTimeout;
    const deadline = Date.now() + tout * 1000;

    while (Date.now() < deadline) {
      const task = await this.getTask(taskId);
      const status = task.status || '';
      this.logger.log(`Suno task ${taskId.slice(0, 12)}: ${status}`);

      if (status === 'SUCCESS') return task;
      if (status === 'FAILED')
        throw new Error(`Suno task ${taskId} failed`);

      await new Promise((r) => setTimeout(r, intv * 1000));
    }
    throw new Error(`Suno task ${taskId} timed out after ${tout}s`);
  }

  // ── Lyrics ───────────────────────────────────────

  async generateLyrics(prompt: string): Promise<string> {
    this.checkKey();
    const payload: Record<string, any> = { prompt };
    if (this.callbackUrl) payload.callBackUrl = this.callbackUrl;

    const { data } = await this.client.post('/api/v1/lyrics', payload);
    this.checkResponse(data);
    const taskId = data.data.taskId;
    this.logger.log(`Suno lyrics: taskId=${taskId}`);
    return taskId;
  }

  // ── Extend ───────────────────────────────────────

  async extend(
    audioId: string,
    options: {
      prompt?: string;
      continueAt?: number;
      model?: string;
    } = {},
  ): Promise<string> {
    this.checkKey();
    const payload: Record<string, any> = {
      audioId,
      defaultParamFlag: true,
      model: options.model || this.model,
    };
    if (options.prompt) payload.prompt = options.prompt;
    if (options.continueAt != null) payload.continueAt = options.continueAt;
    if (this.callbackUrl) payload.callBackUrl = this.callbackUrl;

    const { data } = await this.client.post(
      '/api/v1/generate/extend',
      payload,
    );
    this.checkResponse(data);
    const taskId = data.data.taskId;
    this.logger.log(`Suno extend: taskId=${taskId}`);
    return taskId;
  }

  // ── Vocal removal ────────────────────────────────

  async vocalRemoval(taskId: string, audioId: string): Promise<string> {
    this.checkKey();
    const payload: Record<string, any> = { taskId, audioId };
    if (this.callbackUrl) payload.callBackUrl = this.callbackUrl;

    const { data } = await this.client.post(
      '/api/v1/vocal-removal/generate',
      payload,
    );
    this.checkResponse(data);
    const newTaskId = data.data.taskId;
    this.logger.log(`Suno vocal removal: taskId=${newTaskId}`);
    return newTaskId;
  }

  // ── Convert to WAV ───────────────────────────────

  async convertToWav(taskId: string, audioId: string): Promise<string> {
    this.checkKey();
    const payload: Record<string, any> = { taskId, audioId };
    if (this.callbackUrl) payload.callBackUrl = this.callbackUrl;

    const { data } = await this.client.post(
      '/api/v1/convert-to-wav',
      payload,
    );
    this.checkResponse(data);
    const newTaskId = data.data.taskId;
    this.logger.log(`Suno convert-to-wav: taskId=${newTaskId}`);
    return newTaskId;
  }

  // ── Credits ──────────────────────────────────────

  async getCredits(): Promise<any> {
    this.checkKey();
    const { data } = await this.client.get('/api/v1/get-credits');
    this.checkResponse(data);
    return data.data || {};
  }
}
