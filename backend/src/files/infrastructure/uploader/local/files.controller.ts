import {
  BadRequestException,
  Controller,
  Get,
  Param,
  NotFoundException,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../../../../auth/decorators/current-user.decorator';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiExcludeEndpoint,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { FilesLocalService } from './files.service';
import { FileResponseDto } from './dto/file-response.dto';
import { AuthenticatedUser } from '../../../../auth/types/authenticated-user.type';
import * as path from 'node:path';
import { createReadStream, existsSync } from 'node:fs';
import { guessContentType } from '../../../utils/file-content-type';
import type { Response } from 'express';

function resolveSafeDownloadPath(requestedPath: string) {
  const rootDir = path.resolve(process.cwd(), 'files');
  const normalized = path.normalize(requestedPath).replace(/^([\\/])+/, '');
  const resolved = path.resolve(rootDir, normalized);

  if (resolved !== rootDir && !resolved.startsWith(`${rootDir}${path.sep}`)) {
    throw new BadRequestException('Invalid file path');
  }

  return { rootDir, relativePath: normalized };
}

@ApiTags('Files')
@Controller({
  path: 'files',
  version: '1',
})
export class FilesLocalController {
  constructor(private readonly filesService: FilesLocalService) {}

  @ApiCreatedResponse({
    type: FileResponseDto,
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
      },
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<FileResponseDto> {
    return this.filesService.create(file, String(user.id));
  }

  @ApiExcludeEndpoint()
  @Get(':path')
  download(
    @Param('path') requestedPath: string,
    @Res() response: Response,
  ): void {
    const { rootDir, relativePath } = resolveSafeDownloadPath(requestedPath);
    const fullPath = path.resolve(rootDir, relativePath);

    if (!existsSync(fullPath)) {
      throw new NotFoundException(`File '${requestedPath}' not found`);
    }

    response.setHeader('Content-Type', guessContentType(fullPath));
    void createReadStream(fullPath).pipe(response);
  }
}
