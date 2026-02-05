import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { TemplateRepository } from './infrastructure/persistence/relational/template.repository';
import { IPaginationOptions } from '../utils/types/pagination-options';

@Injectable()
export class TemplatesService {
  constructor(private readonly templateRepository: TemplateRepository) { }

  create(createTemplateDto: CreateTemplateDto, userId: string) {
    return this.templateRepository.create({
      ...createTemplateDto,
      authorId: userId,
    });
  }

  findAll(
    paginationOptions: IPaginationOptions,
    filters?: { type?: string; authorId?: string },
  ) {
    return this.templateRepository.findAllWithPagination(
      paginationOptions,
      filters,
    );
  }

  findOne(id: string) {
    return this.templateRepository.findById(id);
  }

  async update(
    id: string,
    updateTemplateDto: UpdateTemplateDto,
    userId: string,
  ) {
    const template = await this.findOne(id);
    if (!template) {
      throw new NotFoundException('Template not found');
    }

    if (template.authorId !== userId) {
      throw new ForbiddenException('You can only update your own templates');
    }

    return this.templateRepository.update(id, updateTemplateDto as any);
  }

  async remove(id: string, userId: string) {
    const template = await this.findOne(id);
    if (!template) {
      throw new NotFoundException('Template not found');
    }

    if (template.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own templates');
    }

    return this.templateRepository.remove(id);
  }
}
