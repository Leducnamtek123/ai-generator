
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TemplateEntity } from './entities/template.entity';
import { CreateTemplateDto } from '../../../dto/create-template.dto';

@Injectable()
export class TemplateRepository {
    constructor(
        @InjectRepository(TemplateEntity)
        private readonly itemsRepository: Repository<TemplateEntity>,
    ) { }

    async create(data: CreateTemplateDto & { authorId: string }): Promise<TemplateEntity> {
        const persistenceModel = this.itemsRepository.create(data);
        return this.itemsRepository.save(persistenceModel);
    }

    async findAll(options?: { visibility?: string }): Promise<TemplateEntity[]> {
        const where: any = {};
        if (options?.visibility) {
            where.visibility = options.visibility;
        }

        return this.itemsRepository.find({
            where,
            order: {
                createdAt: 'DESC',
            },
        });
    }

    async findById(id: string): Promise<TemplateEntity | null> {
        return this.itemsRepository.findOne({
            where: { id },
        });
    }

    async update(id: string, payload: Partial<TemplateEntity>): Promise<TemplateEntity | null> {
        await this.itemsRepository.update(id, payload);
        return this.findById(id);
    }

    async remove(id: string): Promise<void> {
        await this.itemsRepository.softDelete(id);
    }
}
