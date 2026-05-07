import {
  HttpStatus,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { instanceToPlain } from 'class-transformer';
import {
  GetObjectCommand,
  GetObjectCommandOutput,
  S3Client,
} from '@aws-sdk/client-s3';
import { FileRepository } from '../../persistence/file.repository';
import { FileType } from '../../../domain/file';
import { AllConfigType } from '../../../../config/config.type';
import { AssetsService } from '../../../../assets/assets.service';

function resolvePublicFileUrl(file: FileType): string {
  const plain = instanceToPlain(file) as FileType;
  return plain.path;
}

function inferAssetType(file: Express.MulterS3.File): 'image' | 'video' | 'audio' {
  if (file.mimetype.startsWith('video/')) {
    return 'video';
  }

  if (file.mimetype.startsWith('audio/')) {
    return 'audio';
  }

  return 'image';
}

@Injectable()
export class FilesS3Service {
  constructor(
    private readonly configService: ConfigService<AllConfigType>,
    private readonly fileRepository: FileRepository,
    private readonly assetsService: AssetsService,
  ) {}

  async create(
    file: Express.MulterS3.File,
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
      path: file.key,
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
        key: file.key,
      },
    });

    return {
      file: uploadedFile,
    };
  }

  async download(key: string): Promise<GetObjectCommandOutput> {
    const s3 = new S3Client({
      region: this.configService.get('file.awsS3Region', { infer: true }),
      credentials: {
        accessKeyId: this.configService.getOrThrow('file.accessKeyId', {
          infer: true,
        }),
        secretAccessKey: this.configService.getOrThrow('file.secretAccessKey', {
          infer: true,
        }),
      },
      endpoint: this.configService.get('file.awsS3Endpoint', { infer: true }),
      forcePathStyle: true,
    });

    const command = new GetObjectCommand({
      Bucket: this.configService.getOrThrow('file.awsDefaultS3Bucket', {
        infer: true,
      }),
      Key: key,
    });

    return s3.send(command);
  }
}
