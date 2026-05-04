import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { VisualFlowService } from './visual-flow.service';
import {
  CreateVisualProjectDto,
  UpdateVisualProjectDto,
  CreateCharacterDto,
  CreateVisualVideoDto,
  CreateVisualSceneDto,
  UpdateVisualSceneDto,
  GenerateRefsDto,
  GenerateSceneImagesDto,
  GenerateSceneVideosDto,
} from './dto/visual-flow.dto';
import {
  RegisterMaterialDto,
  TrimVideoDto,
  MergeVideosDto,
  AddNarrationDto,
  AddMusicDto,
  ReviewVideoDto,
  GenerateMusicDto,
  GenerateLyricsDto,
  ExtendMusicDto,
  VocalRemovalDto,
  ConvertToWavDto,
  ConcatScenesDto,
  ApplyMaterialDto,
  ImageToVideoDto,
  ImagesToSlideshowDto,
  SlideshowFromScenesDto,
  GenerateSpeechDto,
  GenerateVideoNarrationDto,
  CreateContinuationSceneDto,
  CreateInsertSceneDto,
  ReorderScenesDto,
  CreateVoiceTemplateDto,
  UpdateVoiceTemplateDto,
  CleanupScenesDto,
  BuildReferencePromptDto,
} from './dto/flowkit-features.dto';
import { VoiceTemplateEntity } from './entities/voice-template.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Throttle } from '@nestjs/throttler';
import { MaterialsService } from './services/materials.service';
import { PostProcessService } from './services/post-process.service';
import { VideoReviewService } from './services/video-review.service';
import { MusicService } from './services/music.service';
import { TTSService } from './services/tts.service';
import { SceneChainService } from './services/scene-chain.service';
import { CascadeService } from './services/cascade.service';
import { PromptBuilderService } from './services/prompt-builder.service';

@ApiTags('VisualFlow Studio')
@Controller({ path: 'visual-flow', version: '1' })
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class VisualFlowController {
  constructor(
    private readonly visualFlowService: VisualFlowService,
    private readonly materialsService: MaterialsService,
    private readonly postProcessService: PostProcessService,
    private readonly videoReviewService: VideoReviewService,
    private readonly musicService: MusicService,
    private readonly ttsService: TTSService,
    private readonly sceneChainService: SceneChainService,
    private readonly cascadeService: CascadeService,
    private readonly promptBuilderService: PromptBuilderService,
    @InjectRepository(VoiceTemplateEntity)
    private readonly voiceTemplateRepo: Repository<VoiceTemplateEntity>,
  ) {}

  // ─────────────────────────────────────────────
  // PROJECT
  // ─────────────────────────────────────────────

  @Post('projects')
  @ApiOperation({ summary: 'Create a new visual story project with characters' })
  @ApiResponse({ status: 201, description: 'Project created' })
  createProject(@Body() dto: CreateVisualProjectDto, @Request() req: any) {
    return this.visualFlowService.createProject(dto, req.user.id);
  }

  @Get('projects')
  @ApiOperation({ summary: 'List all visual projects for the current user' })
  findAllProjects(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.visualFlowService.findAllProjects(req.user.id, {
      page: parseInt(page || '1', 10),
      limit: parseInt(limit || '20', 10),
    });
  }

  @Get('projects/:id')
  @ApiOperation({ summary: 'Get project details with characters, videos, and scenes' })
  findOneProject(@Param('id') id: string, @Request() req: any) {
    return this.visualFlowService.findOneProject(id, req.user.id);
  }

  @Patch('projects/:id')
  @ApiOperation({ summary: 'Update project name, story, or status' })
  updateProject(
    @Param('id') id: string,
    @Body() dto: UpdateVisualProjectDto,
    @Request() req: any,
  ) {
    return this.visualFlowService.updateProject(id, dto, req.user.id);
  }

  @Delete('projects/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a visual project (soft delete)' })
  deleteProject(@Param('id') id: string, @Request() req: any) {
    return this.visualFlowService.deleteProject(id, req.user.id);
  }

  // ─────────────────────────────────────────────
  // CHARACTERS
  // ─────────────────────────────────────────────

  @Post('projects/:id/characters')
  @ApiOperation({ summary: 'Add a character/entity to a project' })
  addCharacter(
    @Param('id') projectId: string,
    @Body() dto: CreateCharacterDto,
    @Request() req: any,
  ) {
    return this.visualFlowService.addCharacter(projectId, dto, req.user.id);
  }

  @Get('projects/:id/characters')
  @ApiOperation({ summary: 'List characters in a project' })
  getCharacters(@Param('id') projectId: string, @Request() req: any) {
    return this.visualFlowService.getCharacters(projectId, req.user.id);
  }

  @Delete('projects/:id/characters/:charId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a character from a project' })
  deleteCharacter(
    @Param('id') projectId: string,
    @Param('charId') charId: string,
    @Request() req: any,
  ) {
    return this.visualFlowService.deleteCharacter(projectId, charId, req.user.id);
  }

  // ─────────────────────────────────────────────
  // VIDEOS
  // ─────────────────────────────────────────────

  @Post('projects/:id/videos')
  @ApiOperation({ summary: 'Create a new video (episode) within a project' })
  createVideo(
    @Param('id') projectId: string,
    @Body() dto: CreateVisualVideoDto,
    @Request() req: any,
  ) {
    return this.visualFlowService.createVideo(projectId, dto, req.user.id);
  }

  @Get('projects/:id/videos')
  @ApiOperation({ summary: 'List all videos in a project' })
  getVideos(@Param('id') projectId: string, @Request() req: any) {
    return this.visualFlowService.getVideos(projectId, req.user.id);
  }

  // ─────────────────────────────────────────────
  // SCENES
  // ─────────────────────────────────────────────

  @Post('projects/:id/scenes')
  @ApiOperation({
    summary: 'Add a scene to a video (ROOT or CONTINUATION chain)',
  })
  createScene(
    @Param('id') projectId: string,
    @Body() dto: CreateVisualSceneDto,
    @Request() req: any,
  ) {
    return this.visualFlowService.createScene(projectId, dto, req.user.id);
  }

  @Get('projects/:id/videos/:videoId/scenes')
  @ApiOperation({ summary: 'Get all scenes in a video (ordered)' })
  getScenes(@Param('videoId') videoId: string) {
    return this.visualFlowService.getScenes(videoId);
  }

  @Patch('scenes/:sceneId')
  @ApiOperation({ summary: 'Update scene prompt, videoPrompt, or characterNames' })
  updateScene(
    @Param('sceneId') sceneId: string,
    @Body() dto: UpdateVisualSceneDto,
  ) {
    return this.visualFlowService.updateScene(sceneId, dto);
  }

  @Delete('scenes/:sceneId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a scene' })
  deleteScene(@Param('sceneId') sceneId: string) {
    return this.visualFlowService.deleteScene(sceneId);
  }

  // ─────────────────────────────────────────────
  // PIPELINE
  // ─────────────────────────────────────────────

  @Post('projects/:id/gen-refs')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({
    summary:
      'Generate reference images for all pending characters in a project',
  })
  generateRefs(
    @Param('id') projectId: string,
    @Body() dto: GenerateRefsDto,
    @Request() req: any,
  ) {
    return this.visualFlowService.generateRefs(
      projectId,
      req.user.id,
      dto.characterIds,
    );
  }

  @Post('projects/:id/videos/:videoId/gen-images')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiOperation({
    summary:
      'Generate scene still images for all pending scenes in a video',
  })
  generateSceneImages(
    @Param('id') projectId: string,
    @Param('videoId') videoId: string,
    @Body() dto: GenerateSceneImagesDto,
    @Request() req: any,
  ) {
    return this.visualFlowService.generateSceneImages(
      projectId,
      videoId,
      req.user.id,
      dto.orientation ?? 'BOTH',
      dto.sceneIds,
    );
  }

  @Post('projects/:id/videos/:videoId/gen-videos')
  @Throttle({ default: { limit: 2, ttl: 60000 } })
  @ApiOperation({
    summary: 'Generate video clips for all scenes with completed images',
  })
  generateSceneVideos(
    @Param('id') projectId: string,
    @Param('videoId') videoId: string,
    @Body() dto: GenerateSceneVideosDto,
    @Request() req: any,
  ) {
    return this.visualFlowService.generateSceneVideos(
      projectId,
      videoId,
      req.user.id,
      dto.orientation ?? 'BOTH',
      dto.sceneIds,
    );
  }

  @Get('projects/:id/videos/:videoId/status')
  @ApiOperation({ summary: 'Get pipeline status dashboard for a video' })
  getPipelineStatus(
    @Param('id') projectId: string,
    @Param('videoId') videoId: string,
    @Request() req: any,
  ) {
    return this.visualFlowService.getPipelineStatus(
      projectId,
      videoId,
      req.user.id,
    );
  }

  // ─────────────────────────────────────────────
  // MATERIALS (FlowKit)
  // ─────────────────────────────────────────────

  @Get('materials')
  @ApiOperation({ summary: 'List all available visual style materials' })
  listMaterials() {
    return this.materialsService.listMaterials();
  }

  @Get('materials/:id')
  @ApiOperation({ summary: 'Get a material by ID' })
  getMaterial(@Param('id') id: string) {
    const mat = this.materialsService.getMaterial(id);
    if (!mat) throw new NotFoundException(`Material '${id}' not found`);
    return mat;
  }

  @Post('materials')
  @ApiOperation({ summary: 'Register a custom visual style material' })
  registerMaterial(@Body() dto: RegisterMaterialDto) {
    return this.materialsService.registerMaterial({
      id: dto.id,
      name: dto.name,
      styleInstruction: dto.styleInstruction,
      negativePrompt: dto.negativePrompt || '',
      scenePrefix: dto.scenePrefix,
      lighting: dto.lighting || '',
    });
  }

  @Delete('materials/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a custom material' })
  unregisterMaterial(@Param('id') id: string) {
    return this.materialsService.unregisterMaterial(id);
  }

  @Post('projects/:id/apply-material')
  @ApiOperation({ summary: 'Apply a material style to scene prompts in a project' })
  async applyMaterial(
    @Param('id') projectId: string,
    @Body() dto: ApplyMaterialDto,
    @Request() req: any,
  ) {
    const mat = this.materialsService.getMaterial(dto.materialId);
    if (!mat) throw new NotFoundException(`Material '${dto.materialId}' not found`);
    // Delegate to service to update scene prompts with material prefix
    return this.visualFlowService.applyMaterialToScenes(
      projectId,
      dto.materialId,
      req.user.id,
      dto.sceneIds,
    );
  }

  // ─────────────────────────────────────────────
  // POST-PROCESSING (FlowKit)
  // ─────────────────────────────────────────────

  @Post('post-process/trim')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Trim a video to [start, end] seconds' })
  trimVideo(@Body() dto: TrimVideoDto) {
    return this.postProcessService.trimVideo(
      dto.inputUrl,
      dto.inputUrl.replace(/\.mp4$/, '_trimmed.mp4'),
      dto.start,
      dto.end,
    );
  }

  @Post('post-process/merge')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiOperation({ summary: 'Concatenate multiple videos into one' })
  mergeVideos(@Body() dto: MergeVideosDto) {
    const outputPath = dto.videoUrls[0]?.replace(/\.mp4$/, '_merged.mp4') || '/tmp/merged.mp4';
    return this.postProcessService.mergeVideos(dto.videoUrls, outputPath);
  }

  @Post('post-process/add-narration')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Overlay narration audio on video (ducking SFX)' })
  addNarration(@Body() dto: AddNarrationDto) {
    const outputPath = dto.videoUrl.replace(/\.mp4$/, '_narrated.mp4');
    return this.postProcessService.addNarration(
      dto.videoUrl,
      dto.narrationUrl,
      outputPath,
      { narrationVolume: dto.narrationVolume, sfxVolume: dto.sfxVolume },
    );
  }

  @Post('post-process/add-music')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Overlay background music on video' })
  addMusicToVideo(@Body() dto: AddMusicDto) {
    const outputPath = dto.videoUrl.replace(/\.mp4$/, '_music.mp4');
    return this.postProcessService.addMusic(
      dto.videoUrl,
      dto.musicUrl,
      outputPath,
      { musicVolume: dto.musicVolume },
    );
  }

  @Post('projects/:id/videos/:videoId/concat')
  @Throttle({ default: { limit: 2, ttl: 60000 } })
  @ApiOperation({ summary: 'Concatenate all scene videos into final video with optional music' })
  async concatSceneVideos(
    @Param('id') projectId: string,
    @Param('videoId') videoId: string,
    @Body() dto: ConcatScenesDto,
    @Request() req: any,
  ) {
    return this.visualFlowService.concatSceneVideos(
      projectId,
      videoId,
      req.user.id,
      dto.orientation ?? 'VERTICAL',
      dto.sceneIds,
      dto.musicUrl,
      dto.musicVolume,
    );
  }

  // ─────────────────────────────────────────────
  // VIDEO REVIEW (FlowKit)
  // ─────────────────────────────────────────────

  @Post('projects/:id/videos/:videoId/review')
  @Throttle({ default: { limit: 2, ttl: 60000 } })
  @ApiOperation({ summary: 'Review video quality via Claude Vision frame analysis' })
  async reviewVideo(
    @Param('id') projectId: string,
    @Param('videoId') videoId: string,
    @Body() dto: ReviewVideoDto,
    @Request() req: any,
  ) {
    return this.visualFlowService.reviewVideoScenes(
      projectId,
      videoId,
      req.user.id,
      dto,
    );
  }

  // ─────────────────────────────────────────────
  // MUSIC (FlowKit — Suno API)
  // ─────────────────────────────────────────────

  @Post('music/generate')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Generate music via Suno (custom lyrics or description mode)' })
  async generateMusic(@Body() dto: GenerateMusicDto) {
    const taskId = await this.musicService.generate({
      prompt: dto.prompt,
      style: dto.style,
      title: dto.title,
      instrumental: dto.instrumental,
      model: dto.model,
      customMode: dto.customMode,
    });
    if (dto.poll) {
      const task = await this.musicService.pollTask(taskId);
      return { taskId, task };
    }
    return { taskId };
  }

  @Post('music/generate-lyrics')
  @ApiOperation({ summary: 'Generate lyrics from a natural language prompt' })
  async generateLyrics(@Body() dto: GenerateLyricsDto) {
    const taskId = await this.musicService.generateLyrics(dto.prompt);
    if (dto.poll) {
      const task = await this.musicService.pollTask(taskId);
      return { taskId, task };
    }
    return { taskId };
  }

  @Get('music/tasks/:taskId')
  @ApiOperation({ summary: 'Get music task status and clips' })
  getMusicTask(@Param('taskId') taskId: string) {
    return this.musicService.getTask(taskId);
  }

  @Post('music/tasks/:taskId/poll')
  @ApiOperation({ summary: 'Poll a music task until completion' })
  pollMusicTask(@Param('taskId') taskId: string) {
    return this.musicService.pollTask(taskId);
  }

  @Post('music/extend')
  @ApiOperation({ summary: 'Extend/continue an existing music track' })
  async extendMusic(@Body() dto: ExtendMusicDto) {
    const taskId = await this.musicService.extend(dto.audioId, {
      prompt: dto.prompt,
      continueAt: dto.continueAt,
      model: dto.model,
    });
    if (dto.poll) {
      const task = await this.musicService.pollTask(taskId);
      return { taskId, task };
    }
    return { taskId };
  }

  @Post('music/vocal-removal')
  @ApiOperation({ summary: 'Separate vocals from instrumental' })
  async vocalRemoval(@Body() dto: VocalRemovalDto) {
    const newTaskId = await this.musicService.vocalRemoval(
      dto.taskId,
      dto.audioId,
    );
    if (dto.poll) {
      const task = await this.musicService.pollTask(newTaskId);
      return { taskId: newTaskId, task };
    }
    return { taskId: newTaskId };
  }

  @Post('music/convert-to-wav')
  @ApiOperation({ summary: 'Convert a music clip to WAV format' })
  async convertToWav(@Body() dto: ConvertToWavDto) {
    const newTaskId = await this.musicService.convertToWav(
      dto.taskId,
      dto.audioId,
    );
    if (dto.poll) {
      const task = await this.musicService.pollTask(newTaskId);
      return { taskId: newTaskId, task };
    }
    return { taskId: newTaskId };
  }

  @Get('music/credits')
  @ApiOperation({ summary: 'Get Suno credits/quota' })
  getMusicCredits() {
    return this.musicService.getCredits();
  }

  // ─────────────────────────────────────────────
  // IMAGE → VIDEO (FlowKit)
  // ─────────────────────────────────────────────

  @Post('post-process/image-to-video')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Convert a single image into a video clip with Ken Burns zoom effect' })
  imageToVideo(@Body() dto: ImageToVideoDto) {
    const outputPath = dto.imagePath.replace(/\.(png|jpg|jpeg|webp)$/i, '_video.mp4');
    return this.postProcessService.imageToVideo(dto.imagePath, outputPath, {
      duration: dto.duration,
      width: dto.width,
      height: dto.height,
      zoomDirection: dto.zoomDirection,
    });
  }

  @Post('post-process/images-slideshow')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiOperation({ summary: 'Create a slideshow video from multiple images with crossfade transitions' })
  async imagesToSlideshow(@Body() dto: ImagesToSlideshowDto) {
    const outputPath = dto.imagePaths[0]?.replace(/\.(png|jpg|jpeg|webp)$/i, '_slideshow.mp4') || 'slideshow.mp4';
    const result = await this.postProcessService.imagesToSlideshow(
      dto.imagePaths,
      outputPath,
      {
        durationPerSlide: dto.durationPerSlide,
        transitionDuration: dto.transitionDuration,
        zoomEffect: dto.zoomEffect,
        width: dto.width,
        height: dto.height,
      },
    );

    // Optionally add music
    if (dto.musicUrl && result.path) {
      const musicOutput = result.path.replace('.mp4', '_music.mp4');
      await this.postProcessService.addMusic(result.path, dto.musicUrl, musicOutput, {
        musicVolume: dto.musicVolume ?? 0.3,
      });
      return { ...result, path: musicOutput, hasMusicOverlay: true };
    }

    return result;
  }

  @Post('projects/:id/videos/:videoId/slideshow')
  @Throttle({ default: { limit: 2, ttl: 60000 } })
  @ApiOperation({
    summary: 'Create a slideshow video from project scene images (Ken Burns + crossfade)',
    description: 'Pulls scene images from the project, creates a slideshow with Ken Burns zoom and crossfade transitions. ' +
      'This is a quick alternative to AI video generation — no credits needed, just ffmpeg.',
  })
  async slideshowFromScenes(
    @Param('id') projectId: string,
    @Param('videoId') videoId: string,
    @Body() dto: SlideshowFromScenesDto,
    @Request() req: any,
  ) {
    return this.visualFlowService.createSlideshowFromScenes(
      projectId,
      videoId,
      req.user.id,
      dto,
    );
  }

  // ─────────────────────────────────────────────
  // TTS / NARRATION (FlowKit)
  // ─────────────────────────────────────────────

  @Post('tts/generate')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Generate speech from text (single)' })
  async generateSpeech(@Body() dto: GenerateSpeechDto) {
    const outputPath = `files/tts/${Date.now()}.mp3`;
    const path = await this.ttsService.generateSpeech({
      text: dto.text,
      voice: dto.voice,
      speed: dto.speed,
      model: dto.model,
      outputPath,
    });
    return { audioPath: path };
  }

  @Get('tts/voices')
  @ApiOperation({ summary: 'List available TTS voices' })
  listVoices() {
    return this.ttsService.listVoices();
  }

  @Post('projects/:id/videos/:videoId/narration')
  @Throttle({ default: { limit: 2, ttl: 60000 } })
  @ApiOperation({
    summary: 'Generate narration audio for all scenes with narrator_text',
    description: 'Batch TTS: generates audio for each scene that has narratorText. Optionally overlays onto scene videos.',
  })
  async generateVideoNarration(
    @Param('id') projectId: string,
    @Param('videoId') videoId: string,
    @Body() dto: GenerateVideoNarrationDto,
    @Request() req: any,
  ) {
    return this.visualFlowService.generateVideoNarration(
      projectId,
      videoId,
      req.user.id,
      dto,
    );
  }

  // ─────────────────────────────────────────────
  // SCENE CHAIN (FlowKit)
  // ─────────────────────────────────────────────

  @Post('projects/:id/videos/:videoId/scenes/continue')
  @ApiOperation({ summary: 'Create a continuation scene from a parent scene' })
  async createContinuationScene(
    @Param('id') projectId: string,
    @Param('videoId') videoId: string,
    @Body() dto: CreateContinuationSceneDto,
    @Request() req: any,
  ) {
    await this.visualFlowService.findOneProject(projectId, req.user.id);
    return this.sceneChainService.createContinuationScene(
      videoId,
      dto.parentSceneId,
      dto.prompt,
      {
        characterNames: dto.characterNames,
        videoPrompt: dto.videoPrompt,
        displayOrder: dto.displayOrder,
      },
    );
  }

  @Post('projects/:id/videos/:videoId/scenes/insert')
  @ApiOperation({ summary: 'Insert a scene at a specific position' })
  async createInsertScene(
    @Param('id') projectId: string,
    @Param('videoId') videoId: string,
    @Body() dto: CreateInsertSceneDto,
    @Request() req: any,
  ) {
    await this.visualFlowService.findOneProject(projectId, req.user.id);
    return this.sceneChainService.createInsertScene(
      videoId,
      dto.atOrder,
      dto.prompt,
      { characterNames: dto.characterNames },
    );
  }

  @Get('projects/:id/videos/:videoId/scenes/:sceneId/chain')
  @ApiOperation({ summary: 'Get chain info for a scene (parent, children, type)' })
  async getSceneChainInfo(
    @Param('id') projectId: string,
    @Param('sceneId') sceneId: string,
    @Request() req: any,
  ) {
    await this.visualFlowService.findOneProject(projectId, req.user.id);
    return this.sceneChainService.getChainInfo(sceneId);
  }

  @Post('projects/:id/videos/:videoId/scenes/reorder')
  @ApiOperation({ summary: 'Reorder scenes (drag & drop)' })
  async reorderScenes(
    @Param('id') projectId: string,
    @Param('videoId') videoId: string,
    @Body() dto: ReorderScenesDto,
    @Request() req: any,
  ) {
    await this.visualFlowService.findOneProject(projectId, req.user.id);
    await this.sceneChainService.reorderScenes(videoId, dto.sceneIds);
    return { success: true, reordered: dto.sceneIds.length };
  }

  // ─────────────────────────────────────────────
  // CASCADE (FlowKit)
  // ─────────────────────────────────────────────

  @Get('projects/:id/videos/:videoId/stale-scenes')
  @ApiOperation({ summary: 'Find scenes with stale downstream assets (image done but video pending)' })
  async findStaleScenes(
    @Param('id') projectId: string,
    @Param('videoId') videoId: string,
    @Request() req: any,
  ) {
    await this.visualFlowService.findOneProject(projectId, req.user.id);
    return this.cascadeService.findStaleScenes(videoId);
  }

  // ─────────────────────────────────────────────
  // PROMPT BUILDER (FlowKit)
  // ─────────────────────────────────────────────

  @Post('projects/:id/videos/:videoId/enrich-prompts')
  @ApiOperation({
    summary: 'Enrich scene prompts with Veo 3 audio labels, negative prompts, and voice context',
    description: 'Batch-processes all scenes to add proper audio instructions, ' +
      'character voice descriptions for dialogue, and negative prompts. ' +
      'Does not modify DB — returns enriched prompts for preview/use.',
  })
  async enrichScenePrompts(
    @Param('id') projectId: string,
    @Param('videoId') videoId: string,
    @Request() req: any,
  ) {
    await this.visualFlowService.findOneProject(projectId, req.user.id);
    const scenes = await this.visualFlowService.getScenes(videoId);
    return this.promptBuilderService.enrichScenePrompts(
      scenes.map((s) => ({
        id: s.id,
        prompt: s.prompt || '',
        videoPrompt: s.videoPrompt || undefined,
        characterNames: s.characterNames || undefined,
        chainType: s.chainType || 'ROOT',
      })),
      { projectId },
    );
  }

  // ─────────────────────────────────────────────
  // VOICE TEMPLATES (FlowKit)
  // ─────────────────────────────────────────────

  @Post('tts/templates')
  @ApiOperation({ summary: 'Create a voice template (generates reference audio)' })
  async createVoiceTemplate(
    @Body() dto: CreateVoiceTemplateDto,
    @Request() req: any,
  ) {
    const outputPath = `files/tts/templates/${dto.name}_${Date.now()}.mp3`;
    const audioPath = await this.ttsService.generateSpeech({
      text: dto.text,
      voice: dto.voice,
      speed: dto.speed,
      model: dto.model,
      outputPath,
    });

    const template = this.voiceTemplateRepo.create({
      userId: req.user.id,
      name: dto.name,
      description: dto.description,
      audioPath,
      referenceText: dto.text,
      voice: dto.voice,
      model: dto.model,
      speed: dto.speed,
      provider: 'openai',
    });
    return this.voiceTemplateRepo.save(template);
  }

  @Get('tts/templates')
  @ApiOperation({ summary: 'List all voice templates' })
  async listVoiceTemplates(@Request() req: any) {
    return this.voiceTemplateRepo.find({
      where: { userId: req.user.id },
      order: { createdAt: 'DESC' },
    });
  }

  @Get('tts/templates/:templateId')
  @ApiOperation({ summary: 'Get voice template by ID' })
  async getVoiceTemplate(@Param('templateId') id: string) {
    const template = await this.voiceTemplateRepo.findOneBy({ id });
    if (!template) throw new NotFoundException(`Template ${id} not found`);
    return template;
  }

  @Patch('tts/templates/:templateId')
  @ApiOperation({ summary: 'Update voice template' })
  async updateVoiceTemplate(
    @Param('templateId') id: string,
    @Body() dto: UpdateVoiceTemplateDto,
  ) {
    const template = await this.voiceTemplateRepo.findOneBy({ id });
    if (!template) throw new NotFoundException(`Template ${id} not found`);
    Object.assign(template, dto);
    return this.voiceTemplateRepo.save(template);
  }

  @Delete('tts/templates/:templateId')
  @ApiOperation({ summary: 'Delete voice template' })
  async deleteVoiceTemplate(@Param('templateId') id: string) {
    const result = await this.voiceTemplateRepo.delete(id);
    if (!result.affected) throw new NotFoundException(`Template ${id} not found`);
    return { success: true };
  }

  // ─────────────────────────────────────────────
  // SCENE CLEANUP (FlowKit)
  // ─────────────────────────────────────────────

  @Delete('projects/:id/videos/:videoId/scenes/cleanup')
  @ApiOperation({
    summary: 'Delete all scenes of a given chain type and re-compact order',
    description: 'Bulk-remove all CONTINUATION or INSERT scenes, then re-index displayOrder (0, 1, 2, ...).',
  })
  async cleanupScenes(
    @Param('id') projectId: string,
    @Param('videoId') videoId: string,
    @Body() dto: CleanupScenesDto,
    @Request() req: any,
  ) {
    await this.visualFlowService.findOneProject(projectId, req.user.id);
    return this.sceneChainService.cleanupScenes(videoId, dto.chainType);
  }

  // ─────────────────────────────────────────────
  // REFERENCE IMAGE PROMPT BUILDER (FlowKit)
  // ─────────────────────────────────────────────

  @Post('prompt-builder/reference')
  @ApiOperation({
    summary: 'Build an optimized reference image prompt for a character/entity',
    description: 'Combines entity type composition guidelines + material styling to create a high-quality reference image prompt.',
  })
  async buildReferencePrompt(@Body() dto: BuildReferencePromptDto) {
    const material = dto.materialId
      ? this.materialsService.getMaterial(dto.materialId)
      : undefined;

    const prompt = this.promptBuilderService.buildReferenceImagePrompt(
      dto.entityName,
      dto.description,
      {
        entityType: dto.entityType,
        materialPrefix: material?.scenePrefix,
        materialNegative: material?.negativePrompt,
        lighting: material?.lighting,
        story: dto.story,
      },
    );

    return {
      prompt,
      entityType: dto.entityType || 'character',
      materialId: dto.materialId,
      compositionGuideline: this.promptBuilderService.getCompositionGuideline(
        dto.entityType || 'character',
      ),
    };
  }
}
