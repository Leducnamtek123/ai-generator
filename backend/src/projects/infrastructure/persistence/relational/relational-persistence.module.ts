import { Module } from '@nestjs/common';
import { ProjectsRelationalRepository } from './repositories/project.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectEntity } from './entities/project.entity';
import { ProjectRepository } from '../project.repository';

@Module({
  imports: [TypeOrmModule.forFeature([ProjectEntity])],
  providers: [
    {
      provide: ProjectRepository,
      useClass: ProjectsRelationalRepository,
    },
  ],
  exports: [ProjectRepository],
})
export class RelationalPersistenceModule {}
