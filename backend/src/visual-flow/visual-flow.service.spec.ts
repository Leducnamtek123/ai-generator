import { VisualFlowService } from './visual-flow.service';

describe('VisualFlowService', () => {
  const makeService = () => {
    const projectRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findAndCount: jest.fn(),
      findOne: jest.fn(),
    };
    const characterRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      delete: jest.fn(),
    };
    const videoRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
    };
    const sceneRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      delete: jest.fn(),
    };
    const vfQueue = {
      add: jest.fn(),
      getJob: jest.fn(),
    };

    const eventsService = {
      emitCharacterUpdate: jest.fn(),
      emitSceneUpdate: jest.fn(),
      emitProjectUpdate: jest.fn(),
      emitPipelineStatusUpdate: jest.fn(),
    };

    const service = new VisualFlowService(
      projectRepo as any,
      characterRepo as any,
      videoRepo as any,
      sceneRepo as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      eventsService as any,
      { generationUpdated: { subscribe: jest.fn() } } as any,
      vfQueue as any,
    );

    return {
      service,
      projectRepo,
      characterRepo,
      videoRepo,
      sceneRepo,
      eventsService,
      vfQueue,
    };
  };

  it('should reject scene reads when the video does not belong to the user', async () => {
    const { service, videoRepo, sceneRepo, projectRepo } = makeService();
    videoRepo.findOne.mockResolvedValue({
      id: 'video-1',
      projectId: 'project-1',
    });
    projectRepo.findOne.mockResolvedValue(null);

    await expect(
      service.getScenes('video-1', 'user-1', 'project-1'),
    ).rejects.toThrow('Video video-1 not found');

    expect(projectRepo.findOne).toHaveBeenCalledWith({
      where: { id: 'project-1', userId: 'user-1' },
    });
    expect(sceneRepo.find).not.toHaveBeenCalled();
  });

  it('should allow scene creation when ownership ids differ in type but match by value', async () => {
    const { service, projectRepo, videoRepo, sceneRepo } = makeService();
    projectRepo.findOne.mockResolvedValue({
      id: 'project-1',
      userId: 6,
    });
    videoRepo.findOne.mockResolvedValue({
      id: 'video-1',
      projectId: 'project-1',
      project: {
        userId: 6,
      },
    });
    sceneRepo.create.mockImplementation((data) => ({ ...data }));
    sceneRepo.save.mockImplementation(async (scene) => ({
      ...scene,
      id: 'scene-1',
    }));

    await expect(
      service.createScene(
        'project-1',
        {
          videoId: 'video-1',
          prompt: 'A new scene',
        } as any,
        '6',
      ),
    ).resolves.toMatchObject({
      id: 'scene-1',
      videoId: 'video-1',
      prompt: 'A new scene',
    });
  });

  it('should reject scene updates from another user workspace', async () => {
    const { service, sceneRepo, videoRepo, projectRepo } = makeService();
    sceneRepo.findOne.mockResolvedValue({
      id: 'scene-1',
      video: { id: 'video-1' },
    });
    videoRepo.findOne.mockResolvedValue({
      id: 'video-1',
      projectId: 'project-1',
    });
    projectRepo.findOne.mockResolvedValue(null);

    await expect(
      service.updateScene('scene-1', { prompt: 'new prompt' } as any, 'user-1'),
    ).rejects.toThrow('Video video-1 not found');

    expect(sceneRepo.save).not.toHaveBeenCalled();
  });

  it('should reject scene deletes from another user workspace', async () => {
    const { service, sceneRepo, videoRepo, projectRepo } = makeService();
    sceneRepo.findOne.mockResolvedValue({
      id: 'scene-1',
      video: { id: 'video-1' },
    });
    videoRepo.findOne.mockResolvedValue({
      id: 'video-1',
      projectId: 'project-1',
    });
    projectRepo.findOne.mockResolvedValue(null);

    await expect(service.deleteScene('scene-1', 'user-1')).rejects.toThrow(
      'Video video-1 not found',
    );

    expect(sceneRepo.delete).not.toHaveBeenCalled();
  });

  it('should enqueue unique ref jobs with stable job ids', async () => {
    const { service, vfQueue, eventsService } = makeService();
    const existingJob = {
      getState: jest.fn().mockResolvedValue('waiting'),
      remove: jest.fn().mockResolvedValue(undefined),
    };
    vfQueue.getJob.mockResolvedValue(existingJob);

    jest.spyOn(service, 'findOneProject').mockResolvedValue({
      id: 'project-1',
      name: 'Project 1',
      status: 'DRAFT',
      characters: [{ id: 'char-1', name: 'Hero', description: 'Hero' }],
    } as any);

    await service.generateRefs('project-1', 'user-1', ['char-1']);

    expect(existingJob.remove).toHaveBeenCalled();
    expect(vfQueue.add).toHaveBeenCalledWith(
      'generate_ref',
      expect.objectContaining({
        action: 'generate_ref',
        projectId: 'project-1',
        characterId: 'char-1',
      }),
      expect.objectContaining({
        jobId: 'vf:project-1:ref:char-1',
        removeOnComplete: true,
        removeOnFail: 10,
      }),
    );
    expect(eventsService.emitCharacterUpdate).toHaveBeenCalled();
  });

  it('should skip duplicate scene image jobs when one is already active', async () => {
    const { service, vfQueue, sceneRepo, eventsService } = makeService();
    const activeJob = {
      getState: jest.fn().mockResolvedValue('active'),
      remove: jest.fn().mockResolvedValue(undefined),
    };
    vfQueue.getJob.mockResolvedValue(activeJob);

    jest.spyOn(service, 'findOneProject').mockResolvedValue({
      id: 'project-1',
      name: 'Project 1',
      status: 'DRAFT',
      characters: [],
    } as any);
    jest.spyOn(service, 'getScenes').mockResolvedValue([
      {
        id: 'scene-1',
        prompt: 'Scene prompt',
        characterNames: [],
        verticalImageStatus: 'PENDING',
        horizontalImageStatus: 'PENDING',
      },
    ] as any);

    sceneRepo.save.mockResolvedValue({
      id: 'scene-1',
      prompt: 'Scene prompt',
    });

    await service.generateSceneImages(
      'project-1',
      'video-1',
      'user-1',
      'VERTICAL',
      ['scene-1'],
    );

    expect(vfQueue.add).not.toHaveBeenCalled();
    expect(activeJob.remove).not.toHaveBeenCalled();
    expect(eventsService.emitSceneUpdate).toHaveBeenCalledWith(
      'project-1',
      'video-1',
      'scene-1',
      expect.objectContaining({ verticalImageStatus: 'PROCESSING' }),
    );
  });
});
