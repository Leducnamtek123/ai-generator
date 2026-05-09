import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Headers,
  Response,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiSecurity,
} from '@nestjs/swagger';
import { GenerationsService } from './generations.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
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
  SketchToImageDto,
  ImageVariationsDto,
  CameraChangeDto,
  IconGeneratorDto,
  ImageExtendDto,
  MockupGeneratorDto,
  SkinEnhanceDto,
} from './dto/generate.dto';
import { Throttle } from '@nestjs/throttler';

@ApiSecurity('api-key')
@ApiTags('Generations')
@Controller({ path: 'generations', version: '1' })
export class GenerationsController {
  constructor(private readonly generationsService: GenerationsService) {}

  private withRequestMetadata<T extends Record<string, any>>(
    dto: T,
    req?: { requestId?: string },
  ): T & { metadata?: Record<string, any> } {
    const requestId = req?.requestId?.trim();

    if (!requestId) {
      return dto;
    }

    return {
      ...dto,
      metadata: {
        ...(dto.metadata ?? {}),
        requestId,
      },
    } as T;
  }

  @Get()
  @UseGuards(AuthGuard(['jwt', 'api-key']))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List user generations with pagination' })
  @ApiResponse({ status: 200, description: 'Generation list' })
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: string,
    @Query('search') search?: string,
  ) {
    return this.generationsService.findAll(String(user.id), {
      page: parseInt(page || '1', 10),
      limit: parseInt(limit || '20', 10),
      type,
      search,
    });
  }

  @Get('providers')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List available AI providers and their capabilities',
  })
  listProviders() {
    return this.generationsService.listProviders();
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get generation status and result' })
  @ApiResponse({ status: 200, description: 'Generation details' })
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.generationsService.findOne(id, String(user.id));
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a generation' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.generationsService.remove(id, String(user.id));
  }

  @Post('image')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Generate an image from text prompt' })
  @ApiResponse({ status: 201, description: 'Generation started' })
  async generateImage(
    @Body() dto: GenerateImageDto,
    @Request() req: any,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.generationsService.generateImage(
      this.withRequestMetadata(dto, req),
      String(user.id),
    );
  }

  @Post('video')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Generate a video from text prompt' })
  @ApiResponse({ status: 201, description: 'Generation started' })
  async generateVideo(
    @Body() dto: GenerateVideoDto,
    @Request() req: any,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.generationsService.generateVideo(
      this.withRequestMetadata(dto, req),
      String(user.id),
    );
  }

  @Post('upscale')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Upscale an existing image' })
  @ApiResponse({ status: 201, description: 'Upscale started' })
  async upscaleImage(
    @Body() dto: UpscaleImageDto,
    @Request() req: any,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.generationsService.upscaleImage(
      this.withRequestMetadata(dto, req),
      String(user.id),
    );
  }

  @Post('enhance-prompt')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enhance a prompt using AI' })
  @ApiResponse({ status: 200, description: 'Enhanced prompt returned' })
  @HttpCode(HttpStatus.OK)
  async enhancePrompt(
    @Body() dto: EnhancePromptDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const enhanced = await this.generationsService.enhancePrompt(
      dto,
      String(user.id),
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
  async generateMusic(
    @Body() dto: GenerateMusicDto,
    @Request() req: any,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.generationsService.generateAudio(
      this.withRequestMetadata(dto, req),
      String(user.id),
      'music',
    );
  }

  @Post('sfx')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Generate a sound effect from text' })
  @ApiResponse({ status: 201, description: 'SFX generation started' })
  async generateSfx(
    @Body() dto: GenerateSfxDto,
    @Request() req: any,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.generationsService.generateAudio(
      this.withRequestMetadata(dto, req),
      String(user.id),
      'sfx',
    );
  }

  @Post('voice')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Generate voice audio (TTS or clone)' })
  @ApiResponse({ status: 201, description: 'Voice generation started' })
  async generateVoice(
    @Body() dto: GenerateVoiceDto,
    @Request() req: any,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.generationsService.generateAudio(
      this.withRequestMetadata(dto, req),
      String(user.id),
      'voice',
    );
  }

  // ======== Video Processing Endpoints ========

  @Post('lip-sync')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Synchronize lip movements to audio' })
  @ApiResponse({ status: 201, description: 'Lip sync processing started' })
  async lipSync(
    @Body() dto: LipSyncDto,
    @Request() req: any,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.generationsService.processVideo(
      this.withRequestMetadata(dto, req),
      String(user.id),
      'lip-sync',
    );
  }

  @Post('video-upscale')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiOperation({ summary: 'Upscale a video to higher resolution' })
  @ApiResponse({ status: 201, description: 'Video upscale started' })
  async upscaleVideo(
    @Body() dto: UpscaleVideoDto,
    @Request() req: any,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.generationsService.processVideo(
      this.withRequestMetadata(dto, req),
      String(user.id),
      'video-upscale',
    );
  }

  // ======== Image Processing Endpoints ========

  @Post('bg-remove')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Remove background from an image' })
  @ApiResponse({ status: 201, description: 'Background removal started' })
  async removeBackground(
    @Body() dto: RemoveBackgroundDto,
    @Request() req: any,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.generationsService.processImage(
      this.withRequestMetadata(dto, req),
      String(user.id),
      'bg-remove',
    );
  }

  @Post('sketch-to-image')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Convert a sketch/drawing into a full image' })
  @ApiResponse({
    status: 201,
    description: 'Sketch-to-image generation started',
  })
  async sketchToImage(
    @Body() dto: SketchToImageDto,
    @Request() req: any,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.generationsService.processImage(
      this.withRequestMetadata(dto, req),
      String(user.id),
      'sketch-to-image',
    );
  }

  @Post('variations')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Generate variations of an existing image' })
  @ApiResponse({ status: 201, description: 'Image variations started' })
  async imageVariations(
    @Body() dto: ImageVariationsDto,
    @Request() req: any,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.generationsService.processImage(
      this.withRequestMetadata(dto, req),
      String(user.id),
      'variations',
    );
  }

  @Post('camera-change')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Change camera angle/perspective of an image' })
  @ApiResponse({ status: 201, description: 'Camera change started' })
  async cameraChange(
    @Body() dto: CameraChangeDto,
    @Request() req: any,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.generationsService.processImage(
      this.withRequestMetadata(dto, req),
      String(user.id),
      'camera-change',
    );
  }

  @Post('icon-gen')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Generate an icon from text description' })
  @ApiResponse({ status: 201, description: 'Icon generation started' })
  async iconGenerator(
    @Body() dto: IconGeneratorDto,
    @Request() req: any,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.generationsService.processImage(
      this.withRequestMetadata(dto, req),
      String(user.id),
      'icon-gen',
    );
  }

  @Post('image-extend')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Extend/outpaint an image in a direction' })
  @ApiResponse({ status: 201, description: 'Image extension started' })
  async imageExtend(
    @Body() dto: ImageExtendDto,
    @Request() req: any,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.generationsService.processImage(
      this.withRequestMetadata(dto, req),
      String(user.id),
      'image-extend',
    );
  }

  @Post('mockup')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Generate a product mockup with your design' })
  @ApiResponse({ status: 201, description: 'Mockup generation started' })
  async mockupGenerator(
    @Body() dto: MockupGeneratorDto,
    @Request() req: any,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.generationsService.processImage(
      this.withRequestMetadata(dto, req),
      String(user.id),
      'mockup',
    );
  }

  @Post('skin-enhance')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Enhance skin quality in a portrait' })
  @ApiResponse({ status: 201, description: 'Skin enhancement started' })
  async skinEnhance(
    @Body() dto: SkinEnhanceDto,
    @Request() req: any,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.generationsService.processImage(
      this.withRequestMetadata(dto, req),
      String(user.id),
      'skin-enhance',
    );
  }

  // ======== Real-time Status (SSE) ========

  @Get(':id/stream')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Stream generation status updates via SSE' })
  streamStatus(
    @Param('id') id: string,
    @Request() req: any,
    @CurrentUser() user: AuthenticatedUser,
    @Response() res: any,
  ) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const send = (data: any) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    // Poll the database and stream changes
    let lastStatus = '';
    const pollInterval = setInterval(async () => {
      try {
        const gen = await this.generationsService.findOne(id, String(user.id));
        if (!gen) {
          send({ error: 'Generation not found' });
          clearInterval(pollInterval);
          res.end();
          return;
        }

        if (gen.status !== lastStatus) {
          lastStatus = gen.status;
          send({
            id: gen.id,
            status: gen.status,
            resultUrl: gen.resultUrl,
            error: gen.error,
            updatedAt: gen.updatedAt,
          });
        }

        if (gen.status === 'completed' || gen.status === 'failed') {
          clearInterval(pollInterval);
          res.end();
        }
      } catch {
        clearInterval(pollInterval);
        res.end();
      }
    }, 1000);

    // Cleanup on disconnect
    req.on('close', () => {
      clearInterval(pollInterval);
    });
  }

  @Post('callback')
  @ApiOperation({
    summary: 'Webhook callback for async generation results',
  })
  @ApiResponse({ status: 200, description: 'Callback processed' })
  @HttpCode(HttpStatus.OK)
  async handleCallback(
    @Body() dto: GenerationCallbackDto,
    @Headers('x-generation-callback-secret') callbackSecret?: string,
  ) {
    await this.generationsService.handleCallback(
      dto.id,
      dto.status,
      dto.resultUrl,
      dto.error,
      callbackSecret,
    );
    return { success: true };
  }
}
