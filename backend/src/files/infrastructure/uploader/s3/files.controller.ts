import {
  Controller,
  Get,
  Param,
  Post,
  NotFoundException,
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
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { FilesS3Service } from './files.service';
import { FileResponseDto } from './dto/file-response.dto';
import { guessContentType } from '../../../utils/file-content-type';
import { AuthenticatedUser } from '../../../../auth/types/authenticated-user.type';
import type { Response } from 'express';

@ApiTags('Files')
@Controller({
  path: 'files',
  version: '1',
})
export class FilesS3Controller {
  constructor(private readonly filesService: FilesS3Service) {}

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
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.MulterS3.File,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<FileResponseDto> {
    return this.filesService.create(file, String(user.id));
  }

  @Get(':path')
  async download(
    @Param('path') path: string,
    @Res() response: Response,
  ): Promise<void> {
    const file = await this.filesService.download(path);
    if (!file?.Body) {
      throw new NotFoundException(`File '${path}' not found`);
    }

    const stream = file.Body as any;
    const contentType = file.ContentType ?? guessContentType(path);
    response.setHeader('Content-Type', contentType);
    if (file.ContentLength) {
      response.setHeader('Content-Length', String(file.ContentLength));
    }

    if (typeof stream.pipe === 'function') {
      void stream.pipe(response);
      return;
    }

    if (typeof stream.transformToByteArray === 'function') {
      const bytes = await stream.transformToByteArray();
      response.send(Buffer.from(bytes));
      return;
    }

    response.send(Buffer.from(stream));
  }
}
