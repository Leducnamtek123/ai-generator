import {
    HttpStatus,
    Module,
    UnprocessableEntityException,
} from '@nestjs/common';
import { FilesCloudinaryController } from './files.controller';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

import { FilesCloudinaryService } from './files.service';

import { DocumentFilePersistenceModule } from '../../persistence/document/document-persistence.module';
import { RelationalFilePersistenceModule } from '../../persistence/relational/relational-persistence.module';
import { AllConfigType } from '../../../../config/config.type';
import { DatabaseConfig } from '../../../../database/config/database-config.type';
import databaseConfig from '../../../../database/config/database.config';

// <database-block>
const infrastructurePersistenceModule = (databaseConfig() as DatabaseConfig)
    .isDocumentDatabase
    ? DocumentFilePersistenceModule
    : RelationalFilePersistenceModule;
// </database-block>

@Module({
    imports: [
        infrastructurePersistenceModule,
        MulterModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService<AllConfigType>) => {
                cloudinary.config({
                    cloud_name: configService.get('file.cloudinaryCloudName', { infer: true }),
                    api_key: configService.get('file.cloudinaryApiKey', { infer: true }),
                    api_secret: configService.get('file.cloudinaryApiSecret', { infer: true }),
                });

                const storage = new CloudinaryStorage({
                    cloudinary: cloudinary,
                    params: {
                        folder: 'ai-generator',
                        allowed_formats: ['jpg', 'png', 'jpeg', 'gif'],
                        public_id: (req, file) => {
                            const name = file.originalname.split('.')[0];
                            return `${name}-${Date.now()}`;
                        }
                    } as any,
                });

                return {
                    fileFilter: (request, file, callback) => {
                        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
                            return callback(
                                new UnprocessableEntityException({
                                    status: HttpStatus.UNPROCESSABLE_ENTITY,
                                    errors: {
                                        file: `cantUploadFileType`,
                                    },
                                }),
                                false,
                            );
                        }
                        callback(null, true);
                    },
                    storage,
                    limits: {
                        fileSize: configService.get('file.maxFileSize', { infer: true }),
                    },
                };
            },
        }),
    ],
    controllers: [FilesCloudinaryController],
    providers: [FilesCloudinaryService],
    exports: [FilesCloudinaryService],
})
export class FilesCloudinaryModule { }
