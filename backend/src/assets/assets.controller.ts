import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AssetsService } from './assets.service';
import { ApiTags, ApiOkResponse } from '@nestjs/swagger';
import { infinityPagination } from '../utils/infinity-pagination';
import { InfinityPaginationResponseDto } from '../utils/dto/infinity-pagination-response.dto';
import { Asset } from './domain/asset';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';

// Assets API endpoints
@ApiTags('Assets')
@Controller({
  path: 'assets',
  version: '1',
})
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Post()
  create(@Body() createAssetDto: any) {
    return this.assetsService.create(createAssetDto);
  }

  @ApiOkResponse({
    type: InfinityPaginationResponseDto,
  })
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('mode') mode?: string,
    @CurrentUser() user?: AuthenticatedUser,
  ): Promise<InfinityPaginationResponseDto<Asset>> {
    if (limit > 50) {
      limit = 50;
    }

    let assets: Asset[];
    if (mode === 'public') {
      assets = await this.assetsService.findAllPublic({ page, limit });
    } else {
      assets = await this.assetsService.findAll(
        { page, limit },
        String(user?.id || 'temp-user-id'),
      );
    }

    return infinityPagination(assets, { page, limit });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.assetsService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.assetsService.remove(id);
  }
}
