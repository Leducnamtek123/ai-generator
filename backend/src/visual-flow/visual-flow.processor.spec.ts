import { VisualFlowProcessor } from './visual-flow.processor';

describe('VisualFlowProcessor', () => {
  const makeProcessor = () => {
    const visualFlowService = {
      findOneProject: jest.fn().mockResolvedValue({
        characters: [
          { id: 'char-1', name: 'Hero', description: 'Hero character' },
        ],
      }),
      saveCharacter: jest.fn().mockResolvedValue(undefined),
      saveScene: jest.fn().mockResolvedValue(undefined),
      getScenes: jest.fn().mockResolvedValue([
        {
          id: 'scene-1',
          prompt: 'Scene prompt',
          verticalImageStatus: 'PENDING',
          horizontalImageStatus: 'PENDING',
          verticalImageUrl: undefined,
          horizontalImageUrl: undefined,
        },
      ]),
    };

    const generationsService = {
      generateImage: jest.fn().mockResolvedValue({
        id: 'gen-1',
        status: 'completed',
        resultUrl: 'https://cdn.example.com/image.png',
      }),
      generateVideo: jest.fn().mockResolvedValue({
        id: 'gen-2',
        status: 'completed',
        resultUrl: 'https://cdn.example.com/video.mp4',
      }),
    };

    const eventsService = {
      emitCharacterUpdate: jest.fn(),
      emitSceneUpdate: jest.fn(),
    };

    const queueReliabilityService = {
      archiveFailure: jest.fn().mockResolvedValue(false),
    };

    const processor = new VisualFlowProcessor(
      visualFlowService as any,
      generationsService as any,
      eventsService as any,
      queueReliabilityService as any,
    );

    return { processor, visualFlowService, generationsService, eventsService };
  };

  it('should propagate the BullMQ job id into reference generation metadata', async () => {
    const { processor, generationsService } = makeProcessor();
    const job = {
      id: 'vf:project-1:ref:char-1',
      data: {
        action: 'generate_ref' as const,
        projectId: 'project-1',
        userId: 'user-1',
        characterId: 'char-1',
      },
    } as any;

    const result = await processor.process(job);

    expect(result).toEqual({
      characterId: 'char-1',
      status: 'COMPLETED',
    });
    expect(generationsService.generateImage).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          requestId: 'vf:project-1:ref:char-1',
          vfAction: 'generate_ref',
          characterId: 'char-1',
        }),
      }),
      'user-1',
      'project-1',
    );
  });

  it('should propagate the BullMQ job id into scene video generation metadata', async () => {
    const { processor, generationsService } = makeProcessor();
    const job = {
      id: 'vf:project-1:scene-video:video-1:scene-1:VERTICAL',
      data: {
        action: 'generate_scene_video' as const,
        projectId: 'project-1',
        userId: 'user-1',
        videoId: 'video-1',
        sceneId: 'scene-1',
        orientation: 'VERTICAL' as const,
        prompt: 'Scene prompt',
      },
    } as any;

    const result = await processor.process(job);

    expect(result).toEqual({
      sceneId: 'scene-1',
      status: 'COMPLETED',
    });
    expect(generationsService.generateVideo).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          requestId: 'vf:project-1:scene-video:video-1:scene-1:VERTICAL',
          vfAction: 'generate_scene_video',
          videoId: 'video-1',
          sceneId: 'scene-1',
          orientation: 'VERTICAL',
        }),
      }),
      'user-1',
      'project-1',
    );
  });
});
