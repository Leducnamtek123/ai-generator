import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags, ApiOkResponse, ApiSecurity } from '@nestjs/swagger';
import { infinityPagination } from '../utils/infinity-pagination';
import { InfinityPaginationResponseDto } from '../utils/dto/infinity-pagination-response.dto';
import { TemplateEntity } from './infrastructure/persistence/relational/entities/template.entity';
import { TemplateTypeEnum } from './types/template-type.enum';

const TEMPLATE_TYPE_ENUM_BY_ALIAS: Record<string, TemplateTypeEnum> = {
  image: TemplateTypeEnum.IMAGE_GENERATOR,
  video: TemplateTypeEnum.VIDEO_GENERATOR,
  music: TemplateTypeEnum.MUSIC_GENERATOR,
  voice: TemplateTypeEnum.VOICE_GENERATOR,
  sfx: TemplateTypeEnum.SOUND_EFFECT_GENERATOR,
  'image-generator': TemplateTypeEnum.IMAGE_GENERATOR,
  'video-generator': TemplateTypeEnum.VIDEO_GENERATOR,
  'music-generator': TemplateTypeEnum.MUSIC_GENERATOR,
  'voice-generator': TemplateTypeEnum.VOICE_GENERATOR,
  'sfx-generator': TemplateTypeEnum.SOUND_EFFECT_GENERATOR,
  'image-upscaler': TemplateTypeEnum.IMAGE_UPSCALER,
  'video-upscaler': TemplateTypeEnum.VIDEO_UPSCALER,
  'workflow-editor': TemplateTypeEnum.WORKFLOW_EDITOR,
  'design-editor': TemplateTypeEnum.DESIGN_EDITOR,
  'ai-assistant': TemplateTypeEnum.AI_ASSISTANT,
  'icon-generator': TemplateTypeEnum.ICON_GENERATOR,
  'mockup-generator': TemplateTypeEnum.MOCKUP_GENERATOR,
  'bg-remover': TemplateTypeEnum.BG_REMOVER,
};

const toTemplateTypeEnum = (type?: string): TemplateTypeEnum | undefined => {
  if (!type) return undefined;
  return TEMPLATE_TYPE_ENUM_BY_ALIAS[type] ?? (type as TemplateTypeEnum);
};

@ApiSecurity('api-key')
@ApiTags('Templates')
@Controller({
  path: 'templates',
  version: '1',
})
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @ApiBearerAuth()
  @UseGuards(AuthGuard(['jwt', 'api-key']))
  @Post()
  create(@Request() req, @Body() createTemplateDto: CreateTemplateDto) {
    return this.templatesService.create(
      {
        ...createTemplateDto,
        type: toTemplateTypeEnum(createTemplateDto.type) ?? createTemplateDto.type,
      },
      req.user.id,
    );
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard(['jwt', 'api-key']))
  @Get('me')
  @HttpCode(HttpStatus.OK)
  async findMy(
    @Request() req,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('type') type?: string,
  ): Promise<InfinityPaginationResponseDto<TemplateEntity>> {
    if (limit > 50) {
      limit = 50;
    }

    const filters: { type?: string; authorId?: string } = {
      authorId: req.user.id,
    };
    if (type) {
      filters.type = toTemplateTypeEnum(type) ?? type;
    }

    const templates = await this.templatesService.findAll(
      { page, limit },
      filters,
    );
    return infinityPagination(templates, { page, limit });
  }

  @ApiOkResponse({
    type: InfinityPaginationResponseDto,
  })
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Request() req,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('type') type?: string,
    @Query('mode') _mode?: string,
  ): Promise<InfinityPaginationResponseDto<TemplateEntity>> {
    if (limit > 50) {
      limit = 50;
    }

    const filters: { type?: string; authorId?: string } = {};
    if (type) {
      filters.type = toTemplateTypeEnum(type) ?? type;
    }

    const templates = await this.templatesService.findAll(
      { page, limit },
      filters,
    );
    return infinityPagination(templates, { page, limit });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.templatesService.findOne(id);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard(['jwt', 'api-key']))
  @Patch(':id')
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateTemplateDto: UpdateTemplateDto,
  ) {
    return this.templatesService.update(
      id,
      {
        ...updateTemplateDto,
        type: toTemplateTypeEnum(updateTemplateDto.type) ?? updateTemplateDto.type,
      },
      req.user.id,
    );
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.templatesService.remove(id, req.user.id);
  }
}
