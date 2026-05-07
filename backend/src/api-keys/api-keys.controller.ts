import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  HttpStatus,
  HttpCode,
  NotFoundException,
} from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';

@ApiTags('API Keys')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'api-keys',
  version: '1',
})
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new API key' })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body('name') name: string,
  ) {
    const { apiKey, rawKey, preview } = await this.apiKeysService.create({
      name,
      user,
      expiresAt: null,
    });

    return {
      ...apiKey,
      rawKey,
      keyPreview: preview,
    };
  }

  @Get()
  @ApiOperation({ summary: 'List your API keys' })
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    const keys = await this.apiKeysService.findAllByUserId(user.id);

    return keys.map((key) => ({
      ...key,
      keyPreview: `${key.keyPrefix}...${key.keyLast4}`,
    }));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke an API key' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const key = await this.apiKeysService.findOneByIdAndUserId(id, user.id);

    if (!key) {
      throw new NotFoundException('API key not found');
    }

    return this.apiKeysService.softDelete(id);
  }
}
