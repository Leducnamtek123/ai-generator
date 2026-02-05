import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TemplatesController } from './templates.controller';
import { TemplatesService } from './templates.service';
import { TemplateRepository } from './infrastructure/persistence/relational/template.repository';
import { TemplateEntity } from './infrastructure/persistence/relational/entities/template.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([TemplateEntity])
  ],
  controllers: [TemplatesController],
  providers: [TemplatesService, TemplateRepository]
})
export class TemplatesModule { }
