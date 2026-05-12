import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { RelationalPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { WorkspaceRelationalPersistenceModule } from '../workspaces/infrastructure/persistence/relational/relational-persistence.module';
import { MemberRelationalPersistenceModule } from '../members/infrastructure/persistence/relational/relational-persistence.module';

@Module({
  imports: [
    RelationalPersistenceModule,
    WorkspaceRelationalPersistenceModule,
    MemberRelationalPersistenceModule,
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService, RelationalPersistenceModule],
})
export class ProjectsModule {}
