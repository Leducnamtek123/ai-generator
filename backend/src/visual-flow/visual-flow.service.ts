import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VisualProjectEntity } from './entities/visual-project.entity';
import { VisualCharacterEntity } from './entities/visual-character.entity';
import { VisualVideoEntity } from './entities/visual-video.entity';
import { VisualSceneEntity } from './entities/visual-scene.entity';
import {
  CreateVisualProjectDto,
  UpdateVisualProjectDto,
  CreateCharacterDto,
  CreateVisualVideoDto,
  CreateVisualSceneDto,
  UpdateVisualSceneDto,
} from './dto/visual-flow.dto';
import { GenerationsService } from '../generations/generations.service';

@Injectable()
export class VisualFlowService {
  private readonly logger = new Logger(VisualFlowService.name);

  constructor(
    @InjectRepository(VisualProjectEntity)
    private readonly projectRepo: Repository<VisualProjectEntity>,
    @InjectRepository(VisualCharacterEntity)
    private readonly characterRepo: Repository<VisualCharacterEntity>,
    @InjectRepository(VisualVideoEntity)
    private readonly videoRepo: Repository<VisualVideoEntity>,
    @InjectRepository(VisualSceneEntity)
    private readonly sceneRepo: Repository<VisualSceneEntity>,
    private readonly generationsService: GenerationsService,
  ) {}

  // ═══════════════════════════════════════════════
  // PROJECT CRUD
  // ═══════════════════════════════════════════════

  async createProject(
    dto: CreateVisualProjectDto,
    userId: string,
  ): Promise<VisualProjectEntity> {
    const project = this.projectRepo.create({
      userId,
      name: dto.name,
      story: dto.story,
      language: dto.language ?? 'en',
      status: 'ACTIVE',
    });
    await this.projectRepo.save(project);

    if (dto.characters?.length) {
      const chars = this.characterRepo.create(
        dto.characters.map((c) => ({
          projectId: project.id,
          name: c.name,
          entityType: c.entityType ?? 'character',
          description: c.description,
          voiceDescription: c.voiceDescription,
          refStatus: 'PENDING',
        })),
      );
      await this.characterRepo.save(chars);
      project.characters = chars;
    }

    return project;
  }

  async findAllProjects(
    userId: string,
    options: { page: number; limit: number },
  ) {
    const [data, total] = await this.projectRepo.findAndCount({
      where: { userId },
      relations: ['characters', 'videos'],
      order: { createdAt: 'DESC' },
      skip: (options.page - 1) * options.limit,
      take: options.limit,
    });
    return { data, total, page: options.page, limit: options.limit };
  }

  async findOneProject(id: string, userId: string): Promise<VisualProjectEntity> {
    const project = await this.projectRepo.findOne({
      where: { id, userId },
      relations: ['characters', 'videos', 'videos.scenes'],
    });
    if (!project) throw new NotFoundException(`Visual project ${id} not found`);
    return project;
  }

  async updateProject(
    id: string,
    dto: UpdateVisualProjectDto,
    userId: string,
  ): Promise<VisualProjectEntity> {
    const project = await this.findOneProject(id, userId);
    Object.assign(project, dto);
    return this.projectRepo.save(project);
  }

  async deleteProject(id: string, userId: string): Promise<void> {
    const project = await this.findOneProject(id, userId);
    await this.projectRepo.softDelete(project.id);
  }

  // ═══════════════════════════════════════════════
  // CHARACTER CRUD
  // ═══════════════════════════════════════════════

  async addCharacter(
    projectId: string,
    dto: CreateCharacterDto,
    userId: string,
  ): Promise<VisualCharacterEntity> {
    await this.findOneProject(projectId, userId); // ownership check
    const char = this.characterRepo.create({
      projectId,
      name: dto.name,
      entityType: dto.entityType ?? 'character',
      description: dto.description,
      voiceDescription: dto.voiceDescription,
      refStatus: 'PENDING',
    });
    return this.characterRepo.save(char);
  }

  async getCharacters(projectId: string, userId: string) {
    await this.findOneProject(projectId, userId);
    return this.characterRepo.find({ where: { projectId }, order: { createdAt: 'ASC' } });
  }

  async deleteCharacter(
    projectId: string,
    characterId: string,
    userId: string,
  ): Promise<void> {
    await this.findOneProject(projectId, userId);
    await this.characterRepo.delete({ id: characterId, projectId });
  }

  // ═══════════════════════════════════════════════
  // VIDEO CRUD
  // ═══════════════════════════════════════════════

  async createVideo(
    projectId: string,
    dto: CreateVisualVideoDto,
    userId: string,
  ): Promise<VisualVideoEntity> {
    await this.findOneProject(projectId, userId);
    const video = this.videoRepo.create({
      projectId,
      title: dto.title,
      description: dto.description,
      displayOrder: dto.displayOrder ?? 0,
      status: 'DRAFT',
    });
    return this.videoRepo.save(video);
  }

  async getVideos(projectId: string, userId: string) {
    await this.findOneProject(projectId, userId);
    return this.videoRepo.find({
      where: { projectId },
      relations: ['scenes'],
      order: { displayOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  async findOneVideo(videoId: string): Promise<VisualVideoEntity> {
    const video = await this.videoRepo.findOne({
      where: { id: videoId },
      relations: ['scenes'],
    });
    if (!video) throw new NotFoundException(`Video ${videoId} not found`);
    return video;
  }

  // ═══════════════════════════════════════════════
  // SCENE CRUD
  // ═══════════════════════════════════════════════

  async createScene(
    projectId: string,
    dto: CreateVisualSceneDto,
    userId: string,
  ): Promise<VisualSceneEntity> {
    await this.findOneProject(projectId, userId);
    const video = await this.findOneVideo(dto.videoId);
    if (video.projectId !== projectId) {
      throw new BadRequestException('Video does not belong to this project');
    }

    if (dto.chainType === 'CONTINUATION' && !dto.parentSceneId) {
      throw new BadRequestException(
        'parentSceneId is required when chainType is CONTINUATION',
      );
    }

    const scene = this.sceneRepo.create({
      videoId: dto.videoId,
      displayOrder: dto.displayOrder ?? 0,
      prompt: dto.prompt,
      videoPrompt: dto.videoPrompt,
      characterNames: dto.characterNames ?? [],
      chainType: dto.chainType ?? 'ROOT',
      parentSceneId: dto.parentSceneId,
      verticalImageStatus: 'PENDING',
      verticalVideoStatus: 'PENDING',
      horizontalImageStatus: 'PENDING',
      horizontalVideoStatus: 'PENDING',
    });
    return this.sceneRepo.save(scene);
  }

  async getScenes(videoId: string): Promise<VisualSceneEntity[]> {
    return this.sceneRepo.find({
      where: { videoId },
      order: { displayOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  async updateScene(
    sceneId: string,
    dto: UpdateVisualSceneDto,
  ): Promise<VisualSceneEntity> {
    const scene = await this.sceneRepo.findOne({ where: { id: sceneId } });
    if (!scene) throw new NotFoundException(`Scene ${sceneId} not found`);
    Object.assign(scene, dto);
    return this.sceneRepo.save(scene);
  }

  async deleteScene(sceneId: string): Promise<void> {
    await this.sceneRepo.delete(sceneId);
  }

  // ═══════════════════════════════════════════════
  // PIPELINE: GENERATE REFERENCE IMAGES
  // ═══════════════════════════════════════════════

  async generateRefs(
    projectId: string,
    userId: string,
    characterIds?: string[],
  ) {
    const project = await this.findOneProject(projectId, userId);

    let characters = project.characters ?? [];
    if (characterIds?.length) {
      characters = characters.filter((c) => characterIds.includes(c.id));
    } else {
      characters = characters.filter((c) => c.refStatus === 'PENDING');
    }

    if (!characters.length) {
      return { message: 'No pending characters to generate refs for', queued: 0 };
    }

    // Fire & forget — generate reference image per character
    const jobs = characters.map(async (char) => {
      try {
        char.refStatus = 'PROCESSING';
        await this.characterRepo.save(char);

        const generation = await this.generationsService.generateImage(
          {
            prompt: char.description
              ? `Reference portrait of: ${char.description}. Clean studio background, no text.`
              : `Reference image of ${char.name}`,
            aspectRatio: '1:1',
            quality: 'hd',
          },
          userId,
        );

        // Poll or wait for result — simplified: store generation id in metadata
        // In production this would use a queue / SSE
        char.refStatus = generation.status === 'completed' ? 'COMPLETED' : 'PROCESSING';
        if (generation.resultUrl) {
          char.referenceImageUrl = generation.resultUrl;
          char.mediaId = generation.id; // use generation ID as mediaId reference
          char.refStatus = 'COMPLETED';
        }
        await this.characterRepo.save(char);
        return { characterId: char.id, status: 'queued', generationId: generation.id };
      } catch (err) {
        this.logger.error(`Failed to generate ref for character ${char.id}: ${err.message}`);
        char.refStatus = 'FAILED';
        await this.characterRepo.save(char);
        return { characterId: char.id, status: 'failed', error: err.message };
      }
    });

    const results = await Promise.allSettled(jobs);
    return {
      queued: characters.length,
      results: results.map((r) => (r.status === 'fulfilled' ? r.value : { status: 'error' })),
    };
  }

  // ═══════════════════════════════════════════════
  // PIPELINE: GENERATE SCENE IMAGES
  // ═══════════════════════════════════════════════

  async generateSceneImages(
    projectId: string,
    videoId: string,
    userId: string,
    orientation: 'VERTICAL' | 'HORIZONTAL' | 'BOTH' = 'BOTH',
    sceneIds?: string[],
  ) {
    const project = await this.findOneProject(projectId, userId);

    let scenes = await this.getScenes(videoId);
    if (sceneIds?.length) {
      scenes = scenes.filter((s) => sceneIds.includes(s.id));
    } else {
      scenes = scenes.filter(
        (s) =>
          s.verticalImageStatus === 'PENDING' ||
          s.horizontalImageStatus === 'PENDING',
      );
    }

    if (!scenes.length) {
      return { message: 'No pending scenes to generate images for', queued: 0 };
    }

    // Build character name → URL map for reference injection
    const chars = project.characters ?? [];
    const charMap = Object.fromEntries(
      chars.filter((c) => c.referenceImageUrl).map((c) => [c.name, c.referenceImageUrl]),
    );

    const jobs = scenes.map(async (scene) => {
      try {
        // Build prompt enriched with ref image metadata
        const refNames = (scene.characterNames ?? [])
          .filter((n) => charMap[n])
          .join(', ');
        const enrichedPrompt = scene.prompt;

        if (orientation === 'VERTICAL' || orientation === 'BOTH') {
          scene.verticalImageStatus = 'PROCESSING';
          await this.sceneRepo.save(scene);

          const gen = await this.generationsService.generateImage(
            { prompt: enrichedPrompt, aspectRatio: '9:16', quality: 'hd' },
            userId,
          );
          scene.verticalMediaId = gen.id;
          if (gen.resultUrl) {
            scene.verticalImageUrl = gen.resultUrl;
            scene.verticalImageStatus = 'COMPLETED';
          }
          await this.sceneRepo.save(scene);
        }

        if (orientation === 'HORIZONTAL' || orientation === 'BOTH') {
          scene.horizontalImageStatus = 'PROCESSING';
          await this.sceneRepo.save(scene);

          const gen = await this.generationsService.generateImage(
            { prompt: enrichedPrompt, aspectRatio: '16:9', quality: 'hd' },
            userId,
          );
          scene.horizontalMediaId = gen.id;
          if (gen.resultUrl) {
            scene.horizontalImageUrl = gen.resultUrl;
            scene.horizontalImageStatus = 'COMPLETED';
          }
          await this.sceneRepo.save(scene);
        }

        return { sceneId: scene.id, status: 'queued', refChars: refNames };
      } catch (err) {
        this.logger.error(`Failed scene image gen for ${scene.id}: ${err.message}`);
        scene.verticalImageStatus = 'FAILED';
        scene.horizontalImageStatus = 'FAILED';
        await this.sceneRepo.save(scene);
        return { sceneId: scene.id, status: 'failed', error: err.message };
      }
    });

    const results = await Promise.allSettled(jobs);
    return {
      queued: scenes.length,
      results: results.map((r) => (r.status === 'fulfilled' ? r.value : { status: 'error' })),
    };
  }

  // ═══════════════════════════════════════════════
  // PIPELINE: GENERATE SCENE VIDEOS
  // ═══════════════════════════════════════════════

  async generateSceneVideos(
    projectId: string,
    videoId: string,
    userId: string,
    orientation: 'VERTICAL' | 'HORIZONTAL' | 'BOTH' = 'BOTH',
    sceneIds?: string[],
  ) {
    await this.findOneProject(projectId, userId);

    let scenes = await this.getScenes(videoId);
    if (sceneIds?.length) {
      scenes = scenes.filter((s) => sceneIds.includes(s.id));
    } else {
      // Only generate video for scenes that have completed images
      scenes = scenes.filter(
        (s) =>
          s.verticalImageStatus === 'COMPLETED' ||
          s.horizontalImageStatus === 'COMPLETED',
      );
    }

    if (!scenes.length) {
      return { message: 'No scenes with completed images ready for video gen', queued: 0 };
    }

    const jobs = scenes.map(async (scene) => {
      try {
        const motionPrompt = scene.videoPrompt ?? scene.prompt;

        if (
          (orientation === 'VERTICAL' || orientation === 'BOTH') &&
          scene.verticalImageUrl
        ) {
          scene.verticalVideoStatus = 'PROCESSING';
          await this.sceneRepo.save(scene);

          const gen = await this.generationsService.generateVideo(
            {
              prompt: motionPrompt,
              aspectRatio: '9:16',
              duration: '8s',
              startImageUrl: scene.verticalImageUrl,
            },
            userId,
          );
          if (gen.resultUrl) {
            scene.verticalVideoUrl = gen.resultUrl;
            scene.verticalVideoStatus = 'COMPLETED';
          }
          await this.sceneRepo.save(scene);
        }

        if (
          (orientation === 'HORIZONTAL' || orientation === 'BOTH') &&
          scene.horizontalImageUrl
        ) {
          scene.horizontalVideoStatus = 'PROCESSING';
          await this.sceneRepo.save(scene);

          const gen = await this.generationsService.generateVideo(
            {
              prompt: motionPrompt,
              aspectRatio: '16:9',
              duration: '8s',
              startImageUrl: scene.horizontalImageUrl,
            },
            userId,
          );
          if (gen.resultUrl) {
            scene.horizontalVideoUrl = gen.resultUrl;
            scene.horizontalVideoStatus = 'COMPLETED';
          }
          await this.sceneRepo.save(scene);
        }

        return { sceneId: scene.id, status: 'queued' };
      } catch (err) {
        this.logger.error(`Failed scene video gen for ${scene.id}: ${err.message}`);
        return { sceneId: scene.id, status: 'failed', error: err.message };
      }
    });

    const results = await Promise.allSettled(jobs);
    return {
      queued: scenes.length,
      results: results.map((r) => (r.status === 'fulfilled' ? r.value : { status: 'error' })),
    };
  }

  // ═══════════════════════════════════════════════
  // PIPELINE STATUS DASHBOARD
  // ═══════════════════════════════════════════════

  async getPipelineStatus(projectId: string, videoId: string, userId: string) {
    const project = await this.findOneProject(projectId, userId);
    const scenes = await this.getScenes(videoId);
    const chars = project.characters ?? [];

    return {
      project: { id: project.id, name: project.name, status: project.status },
      characters: {
        total: chars.length,
        pending: chars.filter((c) => c.refStatus === 'PENDING').length,
        processing: chars.filter((c) => c.refStatus === 'PROCESSING').length,
        completed: chars.filter((c) => c.refStatus === 'COMPLETED').length,
        failed: chars.filter((c) => c.refStatus === 'FAILED').length,
      },
      scenes: {
        total: scenes.length,
        verticalImages: {
          pending: scenes.filter((s) => s.verticalImageStatus === 'PENDING').length,
          completed: scenes.filter((s) => s.verticalImageStatus === 'COMPLETED').length,
          failed: scenes.filter((s) => s.verticalImageStatus === 'FAILED').length,
        },
        verticalVideos: {
          pending: scenes.filter((s) => s.verticalVideoStatus === 'PENDING').length,
          completed: scenes.filter((s) => s.verticalVideoStatus === 'COMPLETED').length,
          failed: scenes.filter((s) => s.verticalVideoStatus === 'FAILED').length,
        },
        horizontalImages: {
          pending: scenes.filter((s) => s.horizontalImageStatus === 'PENDING').length,
          completed: scenes.filter((s) => s.horizontalImageStatus === 'COMPLETED').length,
          failed: scenes.filter((s) => s.horizontalImageStatus === 'FAILED').length,
        },
      },
      sceneList: scenes.map((s) => ({
        id: s.id,
        order: s.displayOrder,
        chainType: s.chainType,
        characterNames: s.characterNames,
        verticalImageStatus: s.verticalImageStatus,
        verticalVideoStatus: s.verticalVideoStatus,
        horizontalImageStatus: s.horizontalImageStatus,
        horizontalVideoStatus: s.horizontalVideoStatus,
        verticalImageUrl: s.verticalImageUrl,
        verticalVideoUrl: s.verticalVideoUrl,
        horizontalImageUrl: s.horizontalImageUrl,
        horizontalVideoUrl: s.horizontalVideoUrl,
      })),
    };
  }
}
