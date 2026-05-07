import {
  HttpStatus,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { instanceToPlain } from 'class-transformer';

import { FileRepository } from '../../persistence/file.repository';
import { AllConfigType } from '../../../../config/config.type';
import { FileType } from '../../../domain/file';
import { AssetsService } from '../../../../assets/assets.service';

function resolvePublicFileUrl(file: FileType): string {
  const plain = instanceToPlain(file) as FileType;
  return plain.path;
}

function inferAssetType(file: Express.Multer.File): 'image' | 'video' | 'audio' {
  if (file.mimetype.startsWith('video/')) {
    return 'video';
  }

  if (file.mimetype.startsWith('audio/')) {
    return 'audio';
  }

  return 'image';
}

@Injectable()
export class FilesLocalService {
  constructor(
    private readonly configService: ConfigService<AllConfigType>,
    private readonly fileRepository: FileRepository,
    private readonly assetsService: AssetsService,
  ) {}

  async create(
    file: Express.Multer.File,
    userId: string,
  ): Promise<{ file: FileType }> {
    if (!file) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          file: 'selectFile',
        },
      });
    }

    const uploadedFile = await this.fileRepository.create({
      path: `/${this.configService.get('app.apiPrefix', {
        infer: true,
      })}/v1/${file.path}`,
    });

    await this.assetsService.create({
      type: inferAssetType(file),
      url: resolvePublicFileUrl(uploadedFile),
      userId,
      metadata: {
        source: 'file-upload',
        fileId: uploadedFile.id,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
      },
    });

    return {
      file: uploadedFile,
    };
  }
}
