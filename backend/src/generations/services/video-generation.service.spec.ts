import { BadRequestException } from '@nestjs/common';
import { VideoGenerationService } from './video-generation.service';

describe('VideoGenerationService', () => {
  const flushPromises = () =>
    new Promise<void>((resolve) => setImmediate(resolve));

  const makeService = () => {
    const baseService = {
      assertProjectAccess: jest.fn().mockResolvedValue(undefined),
      findByRequestId: jest.fn().mockResolvedValue(null),
      reserveCredits: jest.fn().mockResolvedValue({
        transactionId: 'txn-1',
        amount: 5,
        balance: 95,
        referenceId: 'ref-1',
      }),
      create: jest.fn().mockImplementation((data) => ({
        id: 'gen-1',
        status: 'pending',
        resultUrl: undefined,
        metadata: {},
        ...data,
      })),
      save: jest.fn().mockImplementation((value) => Promise.resolve(value)),
      captureCredits: jest.fn(),
      releaseCredits: jest.fn(),
      saveAsset: jest.fn(),
    };

    const provider = {
      name: 'replicate',
      processImage: jest.fn().mockResolvedValue({
        id: 'provider-1',
        status: 'completed',
        resultUrl: 'https://cdn.example.com/video.mp4',
        metadata: { provider: 'replicate' },
      }),
    };

    const providerRegistry = {
      getProvider: jest.fn(),
      getProvidersForCapability: jest.fn(),
      executeWithFallback: jest.fn(),
    };

    providerRegistry.getProvidersForCapability.mockImplementation(
      (capability: string) => {
        if (capability === 'video-upscale') {
          return [provider];
        }
        return [];
      },
    );
    providerRegistry.getProvider.mockReturnValue(provider);
    providerRegistry.executeWithFallback.mockImplementation(
      (_capability: string, operation: any) =>
        Promise.resolve(operation(provider)),
    );

    const eventsService = {
      emitUpdate: jest.fn(),
    };

    const service = new VideoGenerationService(
      baseService as any,
      providerRegistry as any,
      eventsService as any,
    );

    return { service, baseService, provider, providerRegistry, eventsService };
  };

  it('should reject lip-sync when no configured provider supports it', async () => {
    const { service, baseService, providerRegistry } = makeService();
    providerRegistry.getProvidersForCapability.mockImplementation(() => []);

    await expect(
      service.processVideo(
        {
          videoUrl: 'https://example.com/input.mp4',
          audioUrl: 'https://example.com/input.wav',
          prompt: 'sync lip movement',
        },
        'user-1',
        'lip-sync',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(baseService.reserveCredits).not.toHaveBeenCalled();
  });

  it('should execute video-upscale through the capability fallback path', async () => {
    const { service, baseService, provider, providerRegistry } = makeService();

    const generation = await service.processVideo(
      {
        videoUrl: 'https://example.com/input.mp4',
        targetResolution: '1080p',
        provider: 'replicate',
      },
      'user-1',
      'video-upscale',
    );

    expect(generation.id).toBe('gen-1');
    expect(baseService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        type: 'video-upscale',
        status: 'pending',
        metadata: expect.objectContaining({
          provider: 'replicate',
          creditTransactionId: 'txn-1',
          creditReservationId: 'ref-1',
        }),
      }),
    );

    await flushPromises();
    await flushPromises();

    expect(providerRegistry.executeWithFallback).toHaveBeenCalledWith(
      'video-upscale',
      expect.any(Function),
      'replicate',
    );
    expect(provider.processImage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'video-upscale',
        imageUrl: 'https://example.com/input.mp4',
      }),
    );
    expect(baseService.captureCredits).toHaveBeenCalledWith(
      'user-1',
      'txn-1',
      'video-upscale',
    );
    expect(baseService.saveAsset).toHaveBeenCalledWith(
      expect.objectContaining({
        resultUrl: 'https://cdn.example.com/video.mp4',
      }),
    );
    expect(baseService.saveAsset.mock.invocationCallOrder[0]).toBeLessThan(
      baseService.captureCredits.mock.invocationCallOrder[0],
    );
  });

  it('should reuse an existing generation when the request id matches', async () => {
    const { service, baseService } = makeService();
    baseService.findByRequestId.mockResolvedValueOnce({
      id: 'gen-existing',
      status: 'processing',
      resultUrl: undefined,
      metadata: {},
    });

    const generation = await service.processVideo(
      {
        videoUrl: 'https://example.com/input.mp4',
        targetResolution: '1080p',
        provider: 'replicate',
        metadata: {
          requestId: 'job-123',
        },
      } as any,
      'user-1',
      'video-upscale',
    );

    expect(generation.id).toBe('gen-existing');
    expect(baseService.reserveCredits).not.toHaveBeenCalled();
    expect(baseService.create).not.toHaveBeenCalled();
  });
});
