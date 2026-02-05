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
import { ApiBearerAuth, ApiTags, ApiOkResponse } from '@nestjs/swagger';
import { infinityPagination } from '../utils/infinity-pagination';
import { InfinityPaginationResponseDto } from '../utils/dto/infinity-pagination-response.dto';
import { TemplateEntity } from './infrastructure/persistence/relational/entities/template.entity';

@ApiTags('Templates')
@Controller({
  path: 'templates',
  version: '1',
})
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) { }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Post()
  create(@Request() req, @Body() createTemplateDto: CreateTemplateDto) {
    return this.templatesService.create(createTemplateDto, req.user.id);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
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
      filters.type = type;
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
    @Query('mode') mode?: string,
  ): Promise<InfinityPaginationResponseDto<TemplateEntity>> {
    if (limit > 50) {
      limit = 50;
    }

    const filters: { type?: string; authorId?: string } = {};
    if (type) {
      filters.type = type;
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
  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateTemplateDto: UpdateTemplateDto,
  ) {
    return this.templatesService.update(id, updateTemplateDto, req.user.id);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.templatesService.remove(id, req.user.id);
  }
}
