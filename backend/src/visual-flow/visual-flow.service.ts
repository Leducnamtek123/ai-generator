import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { VISUAL_FLOW_QUEUE } from '../queues/queues.constants';
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
import { MaterialsService } from './services/materials.service';
import { PostProcessService } from './services/post-process.service';
import { VideoReviewService } from './services/video-review.service';
import { TTSService } from './services/tts.service';
import {
  ReviewVideoDto,
  SlideshowFromScenesDto,
  GenerateVideoNarrationDto,
} from './dto/flowkit-features.dto';
import { VisualFlowEventsService } from './services/visual-flow-events.service';
import { GenerationEventsService } from '../generations/services/generation-events.service';

@Injectable()
export class VisualFlowService implements OnModuleInit {
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
    private readonly materialsService: MaterialsService,
    private readonly postProcessService: PostProcessService,
    private readonly videoReviewService: VideoReviewService,
    private readonly ttsService: TTSService,
    private readonly eventsService: VisualFlowEventsService,
    private readonly generationEventsService: GenerationEventsService,
    @InjectQueue(VISUAL_FLOW_QUEUE) private readonly vfQueue: Queue,
  ) {}

  onModuleInit() {
    this.generationEventsService.generationUpdated.subscribe((data) => {
      this.handleGenerationUpdate(data.generation, data.projectId).catch((err) =>
        this.logger.error(`Error handling generation update: ${err.message}`),
      );
    });
  }

  private async handleGenerationUpdate(generation: any, projectId?: string) {
    if (!projectId) return;
    const metadata = generation.metadata || {};
    const vfAction = metadata.vfAction;
    if (!vfAction) return;

    this.logger.log(`Handling VF generation update: ${vfAction} for project ${projectId}`);

    if (vfAction === 'generate_ref') {
      const charId = metadata.characterId;
      if (!charId) return;
      const char = await this.characterRepo.findOne({ where: { id: charId } });
      if (!char) return;

      char.refStatus = generation.status === 'completed' ? 'COMPLETED' : generation.status === 'failed' ? 'FAILED' : 'PROCESSING';
      if (generation.resultUrl) char.referenceImageUrl = generation.resultUrl;
      await this.characterRepo.save(char);

      this.eventsService.emitCharacterUpdate(projectId, char.id, {
        refStatus: char.refStatus,
        referenceImageUrl: char.referenceImageUrl,
      });
    } else if (vfAction === 'generate_scene_image') {
      const { sceneId, orientation, videoId } = metadata;
      if (!sceneId || !orientation || !videoId) return;

      const scene = await this.sceneRepo.findOne({ where: { id: sceneId } });
      if (!scene) return;

      const isVertical = orientation === 'VERTICAL';
      const status = generation.status === 'completed' ? 'COMPLETED' : generation.status === 'failed' ? 'FAILED' : 'PROCESSING';

      if (isVertical) {
        scene.verticalImageStatus = status;
        if (generation.resultUrl) scene.verticalImageUrl = generation.resultUrl;
      } else {
        scene.horizontalImageStatus = status;
        if (generation.resultUrl) scene.horizontalImageUrl = generation.resultUrl;
      }

      await this.sceneRepo.save(scene);
      this.eventsService.emitSceneUpdate(projectId, videoId, scene.id, {
        verticalImageStatus: scene.verticalImageStatus,
        horizontalImageStatus: scene.horizontalImageStatus,
        verticalImageUrl: scene.verticalImageUrl,
        horizontalImageUrl: scene.horizontalImageUrl,
      });
    } else if (vfAction === 'generate_scene_video') {
      const { sceneId, orientation, videoId } = metadata;
      if (!sceneId || !orientation || !videoId) return;

      const scene = await this.sceneRepo.findOne({ where: { id: sceneId } });
      if (!scene) return;

      const isVertical = orientation === 'VERTICAL';
      const status = generation.status === 'completed' ? 'COMPLETED' : generation.status === 'failed' ? 'FAILED' : 'PROCESSING';

      if (isVertical) {
        scene.verticalVideoStatus = status;
        if (generation.resultUrl) scene.verticalVideoUrl = generation.resultUrl;
      } else {
        scene.horizontalVideoStatus = status;
        if (generation.resultUrl) scene.horizontalVideoUrl = generation.resultUrl;
      }

      await this.sceneRepo.save(scene);
      this.eventsService.emitSceneUpdate(projectId, videoId, scene.id, {
        verticalVideoStatus: scene.verticalVideoStatus,
        horizontalVideoStatus: scene.horizontalVideoStatus,
        verticalVideoUrl: scene.verticalVideoUrl,
        horizontalVideoUrl: scene.horizontalVideoUrl,
      });
    }
  }

  // ═══════════════════════════════════════════════
  // REPOSITORY HELPERS
  // ═══════════════════════════════════════════════
  
  async saveCharacter(character: VisualCharacterEntity) {
    return this.characterRepo.save(character);
  }

  async saveScene(scene: VisualSceneEntity) {
    return this.sceneRepo.save(scene);
  }

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

    // Add jobs to BullMQ queue
    const jobs = characters.map(async (char) => {
      char.refStatus = 'PROCESSING';
      await this.characterRepo.save(char);

      this.eventsService.emitCharacterUpdate(projectId, char.id, {
        refStatus: char.refStatus,
      });

      await this.vfQueue.add('generate_ref', {
        action: 'generate_ref',
        projectId,
        userId,
        characterId: char.id,
      });

      return { characterId: char.id, status: 'queued' };
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
      // Build character name → URL map for reference injection
      const refNames = (scene.characterNames ?? [])
        .filter((n) => charMap[n])
        .join(', ');
      const enrichedPrompt = scene.prompt;

      if (orientation === 'VERTICAL' || orientation === 'BOTH') {
        scene.verticalImageStatus = 'PROCESSING';
        await this.sceneRepo.save(scene);
        this.eventsService.emitSceneUpdate(projectId, videoId, scene.id, { verticalImageStatus: 'PROCESSING' });

        await this.vfQueue.add('generate_scene_image', {
          action: 'generate_scene_image',
          projectId,
          videoId,
          userId,
          sceneId: scene.id,
          orientation: 'VERTICAL',
          prompt: enrichedPrompt,
        });
      }

      if (orientation === 'HORIZONTAL' || orientation === 'BOTH') {
        scene.horizontalImageStatus = 'PROCESSING';
        await this.sceneRepo.save(scene);
        this.eventsService.emitSceneUpdate(projectId, videoId, scene.id, { horizontalImageStatus: 'PROCESSING' });

        await this.vfQueue.add('generate_scene_image', {
          action: 'generate_scene_image',
          projectId,
          videoId,
          userId,
          sceneId: scene.id,
          orientation: 'HORIZONTAL',
          prompt: enrichedPrompt,
        });
      }

      return { sceneId: scene.id, status: 'queued', refChars: refNames };
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
      if (
        (orientation === 'VERTICAL' || orientation === 'BOTH') &&
        scene.verticalImageUrl
      ) {
        scene.verticalVideoStatus = 'PROCESSING';
        await this.sceneRepo.save(scene);
        this.eventsService.emitSceneUpdate(projectId, videoId, scene.id, { verticalVideoStatus: 'PROCESSING' });

        await this.vfQueue.add('generate_scene_video', {
          action: 'generate_scene_video',
          projectId,
          videoId,
          userId,
          sceneId: scene.id,
          orientation: 'VERTICAL',
          prompt: scene.videoPrompt || scene.prompt,
        });
      }

      if (
        (orientation === 'HORIZONTAL' || orientation === 'BOTH') &&
        scene.horizontalImageUrl
      ) {
        scene.horizontalVideoStatus = 'PROCESSING';
        await this.sceneRepo.save(scene);
        this.eventsService.emitSceneUpdate(projectId, videoId, scene.id, { horizontalVideoStatus: 'PROCESSING' });

        await this.vfQueue.add('generate_scene_video', {
          action: 'generate_scene_video',
          projectId,
          videoId,
          userId,
          sceneId: scene.id,
          orientation: 'HORIZONTAL',
          prompt: scene.videoPrompt || scene.prompt,
        });
      }

      return { sceneId: scene.id, status: 'queued' };
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

  // ═══════════════════════════════════════════════
  // MATERIALS: APPLY TO SCENES (FlowKit)
  // ═══════════════════════════════════════════════

  async applyMaterialToScenes(
    projectId: string,
    materialId: string,
    userId: string,
    sceneIds?: string[],
  ) {
    const project = await this.findOneProject(projectId, userId);
    const videos = project.videos ?? [];
    let allScenes: VisualSceneEntity[] = [];
    for (const video of videos) {
      const scenes = await this.getScenes(video.id);
      allScenes = allScenes.concat(scenes);
    }

    if (sceneIds?.length) {
      allScenes = allScenes.filter((s) => sceneIds.includes(s.id));
    }

    let updated = 0;
    for (const scene of allScenes) {
      const newPrompt = this.materialsService.applyToPrompt(materialId, scene.prompt);
      if (newPrompt !== scene.prompt) {
        scene.prompt = newPrompt;
        // Reset image/video status since prompt changed
        scene.verticalImageStatus = 'PENDING';
        scene.horizontalImageStatus = 'PENDING';
        scene.verticalVideoStatus = 'PENDING';
        scene.horizontalVideoStatus = 'PENDING';
        await this.sceneRepo.save(scene);
        updated++;
      }
    }

    return {
      materialId,
      scenesUpdated: updated,
      scenesTotal: allScenes.length,
    };
  }

  // ═══════════════════════════════════════════════
  // CONCAT SCENE VIDEOS (FlowKit)
  // ═══════════════════════════════════════════════

  async concatSceneVideos(
    projectId: string,
    videoId: string,
    userId: string,
    orientation: 'VERTICAL' | 'HORIZONTAL' = 'VERTICAL',
    sceneIds?: string[],
    musicUrl?: string,
    musicVolume?: number,
  ) {
    await this.findOneProject(projectId, userId);
    let scenes = await this.getScenes(videoId);

    if (sceneIds?.length) {
      scenes = scenes.filter((s) => sceneIds.includes(s.id));
    }

    const urlField = orientation === 'HORIZONTAL' ? 'horizontalVideoUrl' : 'verticalVideoUrl';
    const videoPaths = scenes
      .filter((s) => s[urlField])
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((s) => s[urlField] as string);

    if (!videoPaths.length) {
      throw new BadRequestException(
        `No ${orientation.toLowerCase()} videos found to concatenate`,
      );
    }

    // Merge all scene videos
    const outputBase = `files/videos/${videoId}`;
    const mergedPath = `${outputBase}_concat_${orientation.toLowerCase()}.mp4`;
    await this.postProcessService.mergeVideos(videoPaths, mergedPath);

    // Optionally add background music
    let finalPath = mergedPath;
    if (musicUrl) {
      finalPath = `${outputBase}_final_${orientation.toLowerCase()}.mp4`;
      await this.postProcessService.addMusic(mergedPath, musicUrl, finalPath, {
        musicVolume: musicVolume ?? 0.3,
      });
    }

    // Update video entity with result
    const video = await this.findOneVideo(videoId);
    if (orientation === 'HORIZONTAL') {
      video.horizontalUrl = finalPath;
    } else {
      video.verticalUrl = finalPath;
    }
    video.status = 'COMPLETED';
    await this.videoRepo.save(video);

    return {
      videoId,
      orientation,
      scenesConcat: videoPaths.length,
      outputUrl: finalPath,
      hasMusicOverlay: !!musicUrl,
    };
  }

  // ═══════════════════════════════════════════════
  // REVIEW VIDEO SCENES (FlowKit)
  // ═══════════════════════════════════════════════

  async reviewVideoScenes(
    projectId: string,
    videoId: string,
    userId: string,
    dto: ReviewVideoDto,
  ) {
    await this.findOneProject(projectId, userId);
    let scenes = await this.getScenes(videoId);

    if (dto.sceneIds) {
      const ids = dto.sceneIds.split(',').map((s) => s.trim()).filter(Boolean);
      scenes = scenes.filter((s) => ids.includes(s.id));
    }

    const orientation = dto.orientation || 'VERTICAL';
    const urlField = orientation === 'HORIZONTAL' ? 'horizontalVideoUrl' : 'verticalVideoUrl';

    const videoPaths = scenes
      .filter((s) => s[urlField])
      .map((s) => s[urlField] as string);
    const prompts = scenes
      .filter((s) => s[urlField])
      .map((s) => s.prompt || '');

    if (!videoPaths.length) {
      throw new BadRequestException(
        `No ${orientation.toLowerCase()} videos found to review`,
      );
    }

    return this.videoReviewService.reviewMultipleVideos(videoPaths, {
      prompts,
      mode: dto.mode || 'light',
      videoId,
    });
  }

  // ═══════════════════════════════════════════════
  // SLIDESHOW FROM SCENE IMAGES (FlowKit)
  // ═══════════════════════════════════════════════

  async createSlideshowFromScenes(
    projectId: string,
    videoId: string,
    userId: string,
    dto: SlideshowFromScenesDto,
  ) {
    await this.findOneProject(projectId, userId);
    let scenes = await this.getScenes(videoId);

    if (dto.sceneIds?.length) {
      scenes = scenes.filter((s) => dto.sceneIds!.includes(s.id));
    }

    const orientation = dto.orientation || 'VERTICAL';
    const imageField =
      orientation === 'HORIZONTAL' ? 'horizontalImageUrl' : 'verticalImageUrl';

    // Collect images sorted by display order
    const imagePaths = scenes
      .filter((s) => s[imageField])
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((s) => s[imageField] as string);

    if (!imagePaths.length) {
      throw new BadRequestException(
        `No ${orientation.toLowerCase()} scene images found. Generate images first.`,
      );
    }

    // Determine output dimensions based on orientation
    const width = orientation === 'HORIZONTAL' ? 1920 : 1080;
    const height = orientation === 'HORIZONTAL' ? 1080 : 1920;

    // Create slideshow from scene images
    const outputBase = `files/videos/${videoId}`;
    const slideshowPath = `${outputBase}_slideshow_${orientation.toLowerCase()}.mp4`;

    const result = await this.postProcessService.imagesToSlideshow(
      imagePaths,
      slideshowPath,
      {
        durationPerSlide: dto.durationPerSlide ?? 4,
        transitionDuration: dto.transitionDuration ?? 1,
        zoomEffect: dto.zoomEffect ?? true,
        fps: 25,
        width,
        height,
      },
    );

    // Optionally overlay background music
    let finalPath = result.path;
    if (dto.musicUrl) {
      finalPath = `${outputBase}_slideshow_music_${orientation.toLowerCase()}.mp4`;
      await this.postProcessService.addMusic(result.path, dto.musicUrl, finalPath, {
        musicVolume: dto.musicVolume ?? 0.3,
      });
    }

    // Update video entity
    const video = await this.findOneVideo(videoId);
    if (orientation === 'HORIZONTAL') {
      video.horizontalUrl = finalPath;
    } else {
      video.verticalUrl = finalPath;
    }
    video.status = 'COMPLETED';
    await this.videoRepo.save(video);

    return {
      videoId,
      orientation,
      type: 'slideshow',
      slideCount: result.slideCount,
      totalDuration: result.totalDuration,
      outputUrl: finalPath,
      hasMusicOverlay: !!dto.musicUrl,
      scenesUsed: imagePaths.length,
    };
  }

  // ═══════════════════════════════════════════════
  // VIDEO NARRATION PIPELINE (FlowKit TTS)
  // ═══════════════════════════════════════════════

  async generateVideoNarration(
    projectId: string,
    videoId: string,
    userId: string,
    dto: GenerateVideoNarrationDto,
  ) {
    await this.findOneProject(projectId, userId);
    const scenes = await this.getScenes(videoId);

    // Build batch items from scenes with narratorText
    const batchItems = scenes
      .filter((s) => s.narratorText?.trim())
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((s) => ({
        sceneId: s.id,
        text: s.narratorText,
        displayOrder: s.displayOrder,
      }));

    if (!batchItems.length) {
      return {
        videoId,
        narrationResults: [],
        message: 'No scenes have narratorText. Add narrator_text to scenes first.',
      };
    }

    const outputDir = `files/narration/${videoId}`;
    const results = await this.ttsService.generateVideoNarration(
      batchItems,
      outputDir,
      {
        voice: dto.voice,
        speed: dto.speed,
        model: dto.model,
        forceRegenerate: dto.forceRegenerate,
      },
    );

    // Optionally overlay narration onto scene videos
    const overlayResults: any[] = [];
    if (dto.overlayOnVideos) {
      const orientation = dto.orientation || 'VERTICAL';
      const videoField =
        orientation === 'HORIZONTAL' ? 'horizontalVideoUrl' : 'verticalVideoUrl';

      for (const result of results) {
        if (result.status !== 'COMPLETED' || !result.audioPath) continue;

        const scene = scenes.find((s) => s.id === result.sceneId);
        if (!scene || !scene[videoField]) continue;

        try {
          const narrated = `files/narration/${videoId}/narrated_${scene.id}.mp4`;
          await this.postProcessService.addNarration(
            scene[videoField] as string,
            result.audioPath,
            narrated,
          );
          overlayResults.push({
            sceneId: scene.id,
            narratedVideoPath: narrated,
          });
        } catch (err: any) {
          this.logger.error(
            `Failed to overlay narration on scene ${scene.id}: ${err.message}`,
          );
        }
      }
    }

    return {
      videoId,
      narrationResults: results,
      overlayResults: dto.overlayOnVideos ? overlayResults : undefined,
      stats: {
        total: scenes.length,
        withText: batchItems.length,
        generated: results.filter((r) => r.status === 'COMPLETED').length,
        failed: results.filter((r) => r.status === 'FAILED').length,
        overlaid: overlayResults.length,
      },
    };
  }
}
