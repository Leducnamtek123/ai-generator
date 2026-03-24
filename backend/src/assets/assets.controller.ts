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
  ): Promise<InfinityPaginationResponseDto<Asset>> {
    if (limit > 50) {
      limit = 50;
    }

    let assets: Asset[];
    if (mode === 'public') {
      assets = await this.assetsService.findAllPublic({ page, limit });
    } else {
      // Mock user ID for now, filtering by this ID implies only getting this user's assets
      assets = await this.assetsService.findAll(
        { page, limit },
        'temp-user-id',
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
