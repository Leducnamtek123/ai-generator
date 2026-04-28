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
import { Throttle } from '@nestjs/throttler';

@ApiTags('VisualFlow Studio')
@Controller({ path: 'visual-flow', version: '1' })
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class VisualFlowController {
  constructor(private readonly visualFlowService: VisualFlowService) {}

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
}
