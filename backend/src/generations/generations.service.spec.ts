import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GenerationsService } from './generations.service';

describe('GenerationsService callback hardening', () => {
  const makeService = (secret?: string) => {
    const generation: any = {
      id: 'gen-1',
      userId: 'user-1',
      type: 'image',
      status: 'pending',
      prompt: 'test',
      cost: 1,
      metadata: {},
    };

    const baseService = {
      findOne: jest.fn().mockResolvedValue(generation),
      save: jest.fn().mockImplementation(async (value) => value),
      captureCredits: jest.fn(),
      releaseCredits: jest.fn(),
      refundCredits: jest.fn(),
      saveAsset: jest.fn(),
      getRepository: jest.fn(),
    };

    const imageService = {
      generateImage: jest.fn(),
      upscaleImage: jest.fn(),
      processImage: jest.fn(),
    };

    const videoService = {
      generateVideo: jest.fn(),
      processVideo: jest.fn(),
    };

    const audioService = {
      generateAudio: jest.fn(),
    };

    const providerRegistry = {
      getProviderInfo: jest.fn(),
      getPromptEnhancerProvider: jest.fn(),
      getImageProvider: jest.fn(),
      getUpscaleProvider: jest.fn(),
      getImageProcessingProvider: jest.fn(),
      executeWithFallback: jest.fn(),
    };

    const eventsService = {
      emitUpdate: jest.fn(),
    };

    const configService = {
      get: jest.fn().mockReturnValue(secret),
    } as unknown as ConfigService<any>;

    const service = new GenerationsService(
      baseService as any,
      imageService as any,
      videoService as any,
      audioService as any,
      providerRegistry as any,
      eventsService as any,
      configService,
    );

    return { service, baseService, eventsService, generation };
  };

  it('rejects callbacks with an invalid secret', async () => {
    const { service } = makeService('expected-secret');

    await expect(
      service.handleCallback(
        'gen-1',
        'completed',
        'https://example.com/result.png',
        undefined,
        'wrong-secret',
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('is idempotent for duplicate callback payloads', async () => {
    const { service, baseService, eventsService, generation } = makeService('expected-secret');

    await service.handleCallback(
      'gen-1',
      'completed',
      'https://example.com/result.png',
      undefined,
      'expected-secret',
    );

    await service.handleCallback(
      'gen-1',
      'completed',
      'https://example.com/result.png',
      undefined,
      'expected-secret',
    );

    expect(baseService.save).toHaveBeenCalledTimes(1);
    expect(eventsService.emitUpdate).toHaveBeenCalledTimes(1);
    expect(generation.metadata.callback.hash).toBeDefined();
    expect(generation.status).toBe('completed');
    expect(generation.resultUrl).toBe('https://example.com/result.png');
  });
});
