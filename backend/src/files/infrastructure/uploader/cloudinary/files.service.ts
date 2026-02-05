import {
    HttpStatus,
    Injectable,
    UnprocessableEntityException,
} from '@nestjs/common';
import { FileRepository } from '../../persistence/file.repository';
import { FileType } from '../../../domain/file';

@Injectable()
export class FilesCloudinaryService {
    constructor(private readonly fileRepository: FileRepository) { }

    async create(file: Express.Multer.File): Promise<{ file: FileType }> {
        if (!file) {
            throw new UnprocessableEntityException({
                status: HttpStatus.UNPROCESSABLE_ENTITY,
                errors: {
                    file: 'selectFile',
                },
            });
        }

        // Cloudinary storage puts the URL in file.path
        return {
            file: await this.fileRepository.create({
                path: file.path,
            }),
        };
    }
}
