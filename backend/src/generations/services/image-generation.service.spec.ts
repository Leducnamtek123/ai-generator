import { ImageGenerationService } from './image-generation.service';

describe('ImageGenerationService', () => {
  const flushPromises = () =>
    new Promise<void>((resolve) => setImmediate(resolve));

  const makeService = () => {
    const baseService = {
      assertProjectAccess: jest.fn().mockResolvedValue(undefined),
      findByRequestId: jest.fn().mockResolvedValue(null),
      reserveCredits: jest.fn().mockResolvedValue({
        transactionId: 'txn-1',
        amount: 1,
        balance: 99,
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
      saveAsset: jest
        .fn()
        .mockImplementation((value) => Promise.resolve(value)),
    };

    const provider = {
      name: 'replicate',
      generateImage: jest.fn().mockResolvedValue({
        id: 'provider-1',
        status: 'completed',
        resultUrl: 'https://cdn.example.com/image.png',
        metadata: { provider: 'replicate' },
      }),
      upscaleImage: jest.fn(),
      processImage: jest.fn(),
    };

    const providerRegistry = {
      getImageProvider: jest.fn().mockReturnValue(provider),
      getUpscaleProvider: jest.fn().mockReturnValue(provider),
      getImageProcessingProvider: jest.fn().mockReturnValue(provider),
      executeWithFallback: jest
        .fn()
        .mockImplementation((_capability, operation) =>
          Promise.resolve(operation(provider)),
        ),
    };

    const eventsService = {
      emitUpdate: jest.fn(),
    };

    const service = new ImageGenerationService(
      baseService as any,
      providerRegistry as any,
      eventsService as any,
    );

    return { service, baseService, provider, providerRegistry };
  };

  it('should capture credits only after asset persistence succeeds', async () => {
    const { service, baseService, provider, providerRegistry } = makeService();

    const generation = await service.generateImage(
      {
        prompt: 'a bright poster',
        aspectRatio: '1:1',
        provider: 'replicate',
      } as any,
      'user-1',
      'project-1',
    );

    expect(generation.id).toBe('gen-1');

    await flushPromises();
    await flushPromises();

    expect(providerRegistry.executeWithFallback).toHaveBeenCalledWith(
      'image-generation',
      expect.any(Function),
      'replicate',
    );
    expect(provider.generateImage).toHaveBeenCalled();
    expect(baseService.saveAsset).toHaveBeenCalledWith(
      expect.objectContaining({
        resultUrl: 'https://cdn.example.com/image.png',
      }),
      'project-1',
    );
    expect(baseService.captureCredits).toHaveBeenCalledWith(
      'user-1',
      'txn-1',
      'image',
    );
    expect(baseService.saveAsset.mock.invocationCallOrder[0]).toBeLessThan(
      baseService.captureCredits.mock.invocationCallOrder[0],
    );
  });

  it('should keep completed image generations even when credit capture fails', async () => {
    const { service, baseService, provider, providerRegistry } = makeService();
    baseService.captureCredits.mockRejectedValueOnce(new Error('billing 422'));

    const generation = await service.generateImage(
      {
        prompt: 'a bright poster',
        aspectRatio: '1:1',
        provider: 'replicate',
      } as any,
      'user-1',
      'project-1',
    );

    expect(generation.id).toBe('gen-1');
    await flushPromises();
    await flushPromises();

    expect(providerRegistry.executeWithFallback).toHaveBeenCalledWith(
      'image-generation',
      expect.any(Function),
      'replicate',
    );
    expect(baseService.captureCredits).toHaveBeenCalled();
    expect(baseService.releaseCredits).not.toHaveBeenCalled();
    expect(baseService.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'gen-1',
        status: 'completed',
        resultUrl: 'https://cdn.example.com/image.png',
        metadata: expect.objectContaining({
          creditCaptureError: 'billing 422',
        }),
      }),
    );
  });

  it('should reject generation for projects outside the user workspace', async () => {
    const { service, baseService } = makeService();
    baseService.assertProjectAccess.mockRejectedValueOnce(
      new Error('Project not found'),
    );

    await expect(
      service.generateImage(
        {
          prompt: 'a bright poster',
          aspectRatio: '1:1',
          provider: 'replicate',
        } as any,
        'user-1',
        'project-404',
      ),
    ).rejects.toThrow('Project not found');

    expect(baseService.reserveCredits).not.toHaveBeenCalled();
  });

  it('should reuse an existing generation when the request id matches', async () => {
    const { service, baseService } = makeService();
    baseService.findByRequestId.mockResolvedValueOnce({
      id: 'gen-existing',
      status: 'processing',
      resultUrl: undefined,
      metadata: {},
    });

    const generation = await service.generateImage(
      {
        prompt: 'a bright poster',
        aspectRatio: '1:1',
        provider: 'replicate',
        metadata: {
          requestId: 'job-123',
        },
      } as any,
      'user-1',
      'project-1',
    );

    expect(generation.id).toBe('gen-existing');
    expect(baseService.reserveCredits).not.toHaveBeenCalled();
    expect(baseService.create).not.toHaveBeenCalled();
  });
});
