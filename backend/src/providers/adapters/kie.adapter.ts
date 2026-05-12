import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '../../config/config.type';
import {
  BaseProvider,
  GenerationResult,
  ImageOptions,
  VideoOptions,
  ProviderCapability,
} from '../provider.interface';

type KieTaskResponse = {
  code?: number;
  msg?: string;
  data?: {
    taskId?: string;
  };
};

type KieTaskDetailResponse = {
  code?: number;
  msg?: string;
  data?: {
    successFlag?: number;
    response?: {
      result_urls?: string[];
    };
    errorMessage?: string;
  };
};

@Injectable()
export class KieAdapter extends BaseProvider {
  readonly name = 'kie';
  readonly capabilities: ProviderCapability[] = ['image-generation', 'video-generation'];

  private readonly logger = new Logger(KieAdapter.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService<AllConfigType>,
  ) {
    super();
  }

  private getApiKey(): string {
    const apiKey = this.configService.get('providers.kie.apiKey', { infer: true }) as string | undefined;
    if (!apiKey) {
      throw new Error('KIE_API_KEY is not configured');
    }
    return apiKey;
  }

  private getBaseUrl(): string {
    return 'https://api.kie.ai';
  }

  private getHeaders() {
    return {
      Authorization: `Bearer ${this.getApiKey()}`,
      'Content-Type': 'application/json',
    };
  }

  private getImageModel(options?: ImageOptions): string {
    const model = options?.model?.trim();
    return model || this.configService.get('providers.kie.modelId', { infer: true }) || '4o-image';
  }

  private getVideoModel(options?: VideoOptions): string {
    const model = options?.model?.trim();
    return model || this.configService.get('providers.kie.modelId', { infer: true }) || 'veo-3.1';
  }

  async generateImage(prompt: string, options?: ImageOptions): Promise<GenerationResult> {
    const model = this.getImageModel(options);
    const response = await this.httpService.axiosRef.post(
      `${this.getBaseUrl()}/4o-image-api/generate-4-o-image`,
      {
        prompt,
        size: this.mapAspectRatio(options?.aspectRatio),
        nVariants: 1,
        isEnhance: false,
        model,
      },
      { headers: this.getHeaders(), timeout: 120000 },
    );

    const taskId = response.data?.data?.taskId || response.data?.taskId || crypto.randomUUID();
    return {
      id: String(taskId),
      status: 'pending',
      metadata: { provider: 'kie', model, taskId },
    };
  }

  async generateVideo(prompt: string, options?: VideoOptions): Promise<GenerationResult> {
    const model = this.getVideoModel(options);
    const response = await this.httpService.axiosRef.post(
      `${this.getBaseUrl()}/veo3-api/generate-veo-3-video`,
      {
        prompt,
        model,
        aspectRatio: options?.aspectRatio,
      },
      { headers: this.getHeaders(), timeout: 120000 },
    );

    const taskId = response.data?.data?.taskId || response.data?.taskId || crypto.randomUUID();
    return {
      id: String(taskId),
      status: 'pending',
      metadata: { provider: 'kie', model, taskId },
    };
  }

  private mapAspectRatio(ratio?: string): string {
    switch (ratio) {
      case '3:2':
      case '2:3':
      case '1:1':
        return ratio;
      default:
        return '1:1';
    }
  }
}
