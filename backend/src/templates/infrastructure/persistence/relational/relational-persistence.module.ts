
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TemplateEntity } from './entities/template.entity';
import { TemplateRepository } from './template.repository';

@Module({
    imports: [TypeOrmModule.forFeature([TemplateEntity])],
    providers: [TemplateRepository],
    exports: [TemplateRepository],
})
export class RelationalPersistenceModule { }
