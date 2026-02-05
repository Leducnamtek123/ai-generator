import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TemplateEntity } from './entities/template.entity';
import { CreateTemplateDto } from '../../../dto/create-template.dto';
import { IPaginationOptions } from 'src/utils/types/pagination-options';

@Injectable()
export class TemplateRepository {
  constructor(
    @InjectRepository(TemplateEntity)
    private readonly itemsRepository: Repository<TemplateEntity>,
  ) { }

  async create(
    data: CreateTemplateDto & { authorId: string },
  ): Promise<TemplateEntity> {
    const persistenceModel = this.itemsRepository.create({
      ...data,
      type: data.type as any, // Cast string to TemplateTypeEnum
    });
    return this.itemsRepository.save(persistenceModel);
  }

  async findAllWithPagination(
    paginationOptions: IPaginationOptions,
    filters?: {
      type?: string;
      authorId?: string;
    },
  ): Promise<TemplateEntity[]> {
    const where: any = {};
    if (filters?.type && filters.type !== 'all') {
      where.type = filters.type;
    }
    if (filters?.authorId) {
      where.authorId = filters.authorId;
    }

    return this.itemsRepository.find({
      skip: (paginationOptions.page - 1) * paginationOptions.limit,
      take: paginationOptions.limit,
      where,
      order: {
        createdAt: 'DESC',
      },
      relations: ['author'],
    });
  }

  async findById(id: string): Promise<TemplateEntity | null> {
    return this.itemsRepository.findOne({
      where: { id },
    });
  }

  async update(
    id: string,
    payload: Partial<TemplateEntity>,
  ): Promise<TemplateEntity | null> {
    await this.itemsRepository.update(id, payload);
    return this.findById(id);
  }

  async remove(id: string): Promise<void> {
    await this.itemsRepository.softDelete(id);
  }
}
