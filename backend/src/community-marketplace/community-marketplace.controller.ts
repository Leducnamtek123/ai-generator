import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { infinityPagination } from '../utils/infinity-pagination';
import { InfinityPaginationResponseDto } from '../utils/dto/infinity-pagination-response.dto';
import { QueryCommunityListingsDto } from './dto/query-community-listings.dto';
import { CreateCommunityListingDto } from './dto/create-community-listing.dto';
import { UpdateCommunityListingDto } from './dto/update-community-listing.dto';
import { CommunityMarketplaceService } from './community-marketplace.service';
import { TemplateEntity } from '../templates/infrastructure/persistence/relational/entities/template.entity';

@ApiTags('Community Marketplace')
@Controller({
  path: 'community-marketplace',
  version: '1',
})
export class CommunityMarketplaceController {
  constructor(
    private readonly communityMarketplaceService: CommunityMarketplaceService,
  ) {}

  @Get('listings')
  @ApiOkResponse({ type: InfinityPaginationResponseDto })
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(12), ParseIntPipe) limit: number,
    @Query() query: QueryCommunityListingsDto,
  ): Promise<InfinityPaginationResponseDto<TemplateEntity>> {
    if (limit > 50) limit = 50;

    const listings = await this.communityMarketplaceService.findAll(
      { page, limit },
      {
        q: query.q,
        type: query.type,
        authorId: query.authorId,
      },
    );

    return infinityPagination(listings as TemplateEntity[], { page, limit });
  }

  @Get('listings/me')
  @ApiOkResponse({ type: InfinityPaginationResponseDto })
  @HttpCode(HttpStatus.OK)
  async findMine(
    @Request() req: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(12), ParseIntPipe) limit: number,
  ): Promise<InfinityPaginationResponseDto<TemplateEntity>> {
    if (limit > 50) limit = 50;

    if (!req.user?.id) {
      return infinityPagination([], { page, limit });
    }

    const listings = await this.communityMarketplaceService.findMine(
      req.user.id,
      { page, limit },
    );

    return infinityPagination(listings as TemplateEntity[], { page, limit });
  }

  @Get('listings/:id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string) {
    return this.communityMarketplaceService.findOne(id);
  }

  @Post('listings')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  create(@Request() req: any, @Body() dto: CreateCommunityListingDto) {
    return this.communityMarketplaceService.create(req.user.id, dto);
  }

  @Patch('listings/:id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateCommunityListingDto,
  ) {
    return this.communityMarketplaceService.update(req.user.id, id, dto);
  }

  @Delete('listings/:id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  remove(@Request() req: any, @Param('id') id: string) {
    return this.communityMarketplaceService.remove(req.user.id, id);
  }

  @Post('listings/:id/purchase')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  purchase(@Request() req: any, @Param('id') id: string) {
    return this.communityMarketplaceService.purchase(req.user.id, id);
  }
}
