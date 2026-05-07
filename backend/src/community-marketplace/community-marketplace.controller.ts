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
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { infinityPagination } from '../utils/infinity-pagination';
import { InfinityPaginationResponseDto } from '../utils/dto/infinity-pagination-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
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
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOkResponse({ type: InfinityPaginationResponseDto })
  @HttpCode(HttpStatus.OK)
  async findMine(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(12), ParseIntPipe) limit: number,
  ): Promise<InfinityPaginationResponseDto<TemplateEntity>> {
    if (limit > 50) limit = 50;

    const listings = await this.communityMarketplaceService.findMine(
      String(user.id),
      {
        page,
        limit,
      },
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
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCommunityListingDto,
  ) {
    return this.communityMarketplaceService.create(String(user.id), dto);
  }

  @Patch('listings/:id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateCommunityListingDto,
  ) {
    return this.communityMarketplaceService.update(String(user.id), id, dto);
  }

  @Delete('listings/:id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.communityMarketplaceService.remove(String(user.id), id);
  }

  @Post('listings/:id/purchase')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  purchase(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.communityMarketplaceService.purchase(String(user.id), id);
  }
}
