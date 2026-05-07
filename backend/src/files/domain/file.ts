import { ApiProperty } from '@nestjs/swagger';
import { Allow } from 'class-validator';
import { Transform } from 'class-transformer';
import fileConfig from '../config/file.config';
import { FileConfig, FileDriver } from '../config/file-config.type';

import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { AppConfig } from '../../config/app-config.type';
import appConfig from '../../config/app.config';

export class FileType {
  @ApiProperty({
    type: String,
    example: 'cbcfa8b8-3a25-4adb-a9c6-e325f0d0f3ae',
  })
  @Allow()
  id: string;

  @ApiProperty({
    type: String,
    example: 'https://example.com/path/to/file.jpg',
  })
  @Transform(
    ({ value }) => {
      if (!value) return value;
      if (value.startsWith('http')) return value;

      const fileDriver = (fileConfig() as FileConfig).driver;

      if (
        [FileDriver.S3_PRESIGNED, FileDriver.S3].includes(fileDriver) &&
        process.env.S3_USE_SIGNED_URL === 'true'
      ) {
        const s3 = new S3Client({
          region: (fileConfig() as FileConfig).awsS3Region ?? '',
          credentials: {
            accessKeyId: (fileConfig() as FileConfig).accessKeyId ?? '',
            secretAccessKey: (fileConfig() as FileConfig).secretAccessKey ?? '',
          },
          endpoint: (fileConfig() as FileConfig).awsS3Endpoint,
          forcePathStyle: true,
        });

        const command = new GetObjectCommand({
          Bucket: (fileConfig() as FileConfig).awsDefaultS3Bucket ?? '',
          Key: value,
        });

        return getSignedUrl(s3, command, { expiresIn: 3600 });
      }

      const appCfg = appConfig() as AppConfig;
      const baseUrl = appCfg.backendDomain?.replace(/\/$/, '') ?? 'http://localhost';
      
      if (value.startsWith('/')) {
        return baseUrl + value;
      }

      return `${baseUrl}/${appCfg.apiPrefix}/v1/files/${value}`;
    },
    {
      toPlainOnly: true,
    },
  )
  path: string;
}
