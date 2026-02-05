import { Injectable } from '@nestjs/common';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { TemplateRepository } from './infrastructure/persistence/relational/template.repository';

@Injectable()
export class TemplatesService {
    constructor(private readonly templateRepository: TemplateRepository) { }

    create(createTemplateDto: CreateTemplateDto, userId: string) {
        return this.templateRepository.create({
            ...createTemplateDto,
            authorId: userId
        });
    }

    findAll() {
        return this.templateRepository.findAll();
    }

    findOne(id: string) {
        return this.templateRepository.findById(id);
    }

    update(id: string, updateTemplateDto: UpdateTemplateDto, userId: string) {
        // Logic to check ownership could be added here
        return this.templateRepository.update(id, updateTemplateDto as any);
    }

    remove(id: string) {
        return this.templateRepository.remove(id);
    }
}
