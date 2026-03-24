import {
  Controller,
  Get,
  Post,
  Body,
  Param,
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
import { GenerationsService } from './generations.service';
import {
  GenerateImageDto,
  GenerateVideoDto,
  UpscaleImageDto,
  EnhancePromptDto,
  GenerationCallbackDto,
  GenerateMusicDto,
  GenerateSfxDto,
  GenerateVoiceDto,
  LipSyncDto,
  UpscaleVideoDto,
  RemoveBackgroundDto,
} from './dto/generate.dto';

import { Throttle } from '@nestjs/throttler';

@ApiTags('Generations')
@Controller({ path: 'generations', version: '1' })
export class GenerationsController {
  constructor(private readonly generationsService: GenerationsService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List user generations with pagination' })
  @ApiResponse({ status: 200, description: 'Generation list' })
  findAll(
    @Request() req: any,
    @Param('page') page?: string,
    @Param('limit') limit?: string,
    @Param('type') type?: string,
    @Param('search') search?: string,
  ) {
    return this.generationsService.findAll(req.user.id, {
      page: parseInt(page || '1', 10),
      limit: parseInt(limit || '20', 10),
      type,
      search,
    });
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get generation status and result' })
  @ApiResponse({ status: 200, description: 'Generation details' })
  findOne(@Param('id') id: string) {
    return this.generationsService.findOne(id);
  }

  @Post(':id/delete')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a generation' })
  async remove(@Param('id') id: string, @Request() req: any) {
    return this.generationsService.remove(id, req.user.id);
  }

  @Post('image')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Generate an image from text prompt' })
  @ApiResponse({ status: 201, description: 'Generation started' })
  async generateImage(@Body() dto: GenerateImageDto, @Request() req: any) {
    return this.generationsService.generateImage(dto, req.user.id);
  }

  @Post('video')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Generate a video from text prompt' })
  @ApiResponse({ status: 201, description: 'Generation started' })
  async generateVideo(@Body() dto: GenerateVideoDto, @Request() req: any) {
    return this.generationsService.generateVideo(dto, req.user.id);
  }

  @Post('upscale')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Upscale an existing image' })
  @ApiResponse({ status: 201, description: 'Upscale started' })
  async upscaleImage(@Body() dto: UpscaleImageDto, @Request() req: any) {
    return this.generationsService.upscaleImage(dto, req.user.id);
  }

  @Post('enhance-prompt')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enhance a prompt using AI' })
  @ApiResponse({ status: 200, description: 'Enhanced prompt returned' })
  @HttpCode(HttpStatus.OK)
  async enhancePrompt(@Body() dto: EnhancePromptDto, @Request() req: any) {
    const enhanced = await this.generationsService.enhancePrompt(
      dto,
      req.user.id,
    );
    return { enhancedPrompt: enhanced };
  }

  // ======== Audio Generation Endpoints ========

  @Post('music')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Generate music from text prompt' })
  @ApiResponse({ status: 201, description: 'Music generation started' })
  async generateMusic(@Body() dto: GenerateMusicDto, @Request() req: any) {
    return this.generationsService.generateAudio(dto, req.user.id, 'music');
  }

  @Post('sfx')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Generate a sound effect from text' })
  @ApiResponse({ status: 201, description: 'SFX generation started' })
  async generateSfx(@Body() dto: GenerateSfxDto, @Request() req: any) {
    return this.generationsService.generateAudio(dto, req.user.id, 'sfx');
  }

  @Post('voice')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Generate voice audio (TTS or clone)' })
  @ApiResponse({ status: 201, description: 'Voice generation started' })
  async generateVoice(@Body() dto: GenerateVoiceDto, @Request() req: any) {
    return this.generationsService.generateAudio(dto, req.user.id, 'voice');
  }

  // ======== Video Processing Endpoints ========

  @Post('lip-sync')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Synchronize lip movements to audio' })
  @ApiResponse({ status: 201, description: 'Lip sync processing started' })
  async lipSync(@Body() dto: LipSyncDto, @Request() req: any) {
    return this.generationsService.processVideo(dto, req.user.id, 'lip-sync');
  }

  @Post('video-upscale')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiOperation({ summary: 'Upscale a video to higher resolution' })
  @ApiResponse({ status: 201, description: 'Video upscale started' })
  async upscaleVideo(@Body() dto: UpscaleVideoDto, @Request() req: any) {
    return this.generationsService.processVideo(dto, req.user.id, 'video-upscale');
  }

  // ======== Image Processing Endpoints ========

  @Post('bg-remove')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Remove background from an image' })
  @ApiResponse({ status: 201, description: 'Background removal started' })
  async removeBackground(@Body() dto: RemoveBackgroundDto, @Request() req: any) {
    return this.generationsService.processImage(dto, req.user.id, 'bg-remove');
  }

  @Post('callback')
  @ApiOperation({
    summary: 'Webhook callback for async generation results (from n8n)',
  })
  @ApiResponse({ status: 200, description: 'Callback processed' })
  @HttpCode(HttpStatus.OK)
  async handleCallback(@Body() dto: GenerationCallbackDto) {
    await this.generationsService.handleCallback(
      dto.id,
      dto.status,
      dto.resultUrl,
      dto.error,
    );
    return { success: true };
  }
}

