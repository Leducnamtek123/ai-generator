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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { GenerationsService } from './generations.service';
import {
    GenerateImageDto,
    GenerateVideoDto,
    UpscaleImageDto,
    EnhancePromptDto,
    GenerationCallbackDto,
} from './dto/generate.dto';

@ApiTags('Generations')
@Controller({ path: 'generations', version: '1' })
export class GenerationsController {
    constructor(private readonly generationsService: GenerationsService) { }

    @Get(':id')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get generation status and result' })
    @ApiResponse({ status: 200, description: 'Generation details' })
    findOne(@Param('id') id: string) {
        return this.generationsService.findOne(id);
    }

    @Post('image')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Generate an image from text prompt' })
    @ApiResponse({ status: 201, description: 'Generation started' })
    async generateImage(@Body() dto: GenerateImageDto, @Request() req: any) {
        return this.generationsService.generateImage(dto, req.user.id);
    }

    @Post('video')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Generate a video from text prompt' })
    @ApiResponse({ status: 201, description: 'Generation started' })
    async generateVideo(@Body() dto: GenerateVideoDto, @Request() req: any) {
        return this.generationsService.generateVideo(dto, req.user.id);
    }

    @Post('upscale')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
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
        const enhanced = await this.generationsService.enhancePrompt(dto, req.user.id);
        return { enhancedPrompt: enhanced };
    }

    @Post('callback')
    @ApiOperation({ summary: 'Webhook callback for async generation results (from n8n)' })
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
