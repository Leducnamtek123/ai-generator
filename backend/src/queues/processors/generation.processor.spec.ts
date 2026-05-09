import { GenerationProcessor } from './generation.processor';

describe('GenerationProcessor', () => {
  const makeProcessor = () => {
    const generationsService = {
      generateImage: jest.fn().mockResolvedValue({
        id: 'gen-1',
        resultUrl: 'https://cdn.example.com/image.png',
      }),
      generateVideo: jest.fn(),
      processVideo: jest.fn(),
      processImage: jest.fn(),
      generateAudio: jest.fn(),
      upscaleImage: jest.fn(),
      enhancePrompt: jest.fn(),
    };

    const workflowsService = {
      findOne: jest.fn().mockResolvedValue({
        nodes: [
          {
            id: 'node-1',
            data: {},
          },
        ],
      }),
      update: jest.fn().mockResolvedValue(undefined),
    };

    const queueReliabilityService = {
      archiveFailure: jest.fn().mockResolvedValue(false),
    };

    const processor = new GenerationProcessor(
      generationsService as any,
      workflowsService as any,
      queueReliabilityService as any,
    );

    return {
      processor,
      generationsService,
      workflowsService,
      queueReliabilityService,
    };
  };

  it('should propagate the BullMQ job id into generation request metadata', async () => {
    const { processor, generationsService, workflowsService } = makeProcessor();
    const job = {
      id: 'workflow-1:run-abc:node-1:image',
      data: {
        type: 'image' as const,
        userId: 'user-1',
        workflowId: 'workflow-1',
        nodeId: 'node-1',
        projectId: 'project-1',
        params: {
          prompt: 'build a cover image',
        },
      },
      updateProgress: jest.fn().mockResolvedValue(undefined),
    } as any;

    const result = await processor.process(job);

    expect(result.success).toBe(true);
    expect(generationsService.generateImage).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          requestId: 'workflow-1:run-abc:node-1:image',
        }),
      }),
      'user-1',
      'project-1',
    );
    expect(workflowsService.update).toHaveBeenCalledWith(
      'workflow-1',
      'user-1',
      expect.objectContaining({
        nodes: expect.arrayContaining([
          expect.objectContaining({
            id: 'node-1',
            data: expect.objectContaining({
              status: 'processing',
              generationJobId: 'workflow-1:run-abc:node-1:image',
            }),
          }),
        ]),
      }),
    );
  });
});
