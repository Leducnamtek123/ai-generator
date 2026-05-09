import { AudioGenerationService } from './audio-generation.service';

describe('AudioGenerationService', () => {
  const flushPromises = () =>
    new Promise<void>((resolve) => setImmediate(resolve));

  const makeService = () => {
    const baseService = {
      assertProjectAccess: jest.fn().mockResolvedValue(undefined),
      findByRequestId: jest.fn().mockResolvedValue(null),
      reserveCredits: jest.fn().mockResolvedValue({
        transactionId: 'txn-1',
        amount: 2,
        balance: 98,
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
      name: 'elevenlabs',
      generateAudio: jest.fn().mockResolvedValue({
        id: 'provider-1',
        status: 'completed',
        resultUrl: 'https://cdn.example.com/audio.mp3',
        metadata: { provider: 'elevenlabs' },
      }),
    };

    const providerRegistry = {
      getAudioProvider: jest.fn().mockReturnValue(provider),
      executeWithFallback: jest
        .fn()
        .mockImplementation((_capability, operation) =>
          Promise.resolve(operation(provider)),
        ),
    };

    const service = new AudioGenerationService(
      baseService as any,
      providerRegistry as any,
    );

    return { service, baseService, provider, providerRegistry };
  };

  it('should capture credits only after asset persistence succeeds', async () => {
    const { service, baseService, provider, providerRegistry } = makeService();

    const generation = await service.generateAudio(
      {
        prompt: 'ambient atmosphere',
        provider: 'elevenlabs',
      } as any,
      'user-1',
      'music',
    );

    expect(generation.id).toBe('gen-1');

    await flushPromises();
    await flushPromises();

    expect(providerRegistry.executeWithFallback).toHaveBeenCalledWith(
      'audio-music',
      expect.any(Function),
      'elevenlabs',
    );
    expect(provider.generateAudio).toHaveBeenCalled();
    expect(baseService.saveAsset).toHaveBeenCalledWith(
      expect.objectContaining({
        resultUrl: 'https://cdn.example.com/audio.mp3',
      }),
    );
    expect(baseService.captureCredits).toHaveBeenCalledWith(
      'user-1',
      'txn-1',
      'music',
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

    const generation = await service.generateAudio(
      {
        prompt: 'ambient atmosphere',
        provider: 'elevenlabs',
        metadata: {
          requestId: 'job-123',
        },
      } as any,
      'user-1',
      'music',
    );

    expect(generation.id).toBe('gen-existing');
    expect(baseService.reserveCredits).not.toHaveBeenCalled();
    expect(baseService.create).not.toHaveBeenCalled();
  });
});
