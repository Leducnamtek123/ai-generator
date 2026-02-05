import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TemplateSeedService } from './template-seed.service';
import { TemplateEntity } from '../../../../templates/infrastructure/persistence/relational/entities/template.entity';
import { UserEntity } from '../../../../users/infrastructure/persistence/relational/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TemplateEntity, UserEntity])],
  providers: [TemplateSeedService],
  exports: [TemplateSeedService],
})
export class TemplateSeedModule {}
