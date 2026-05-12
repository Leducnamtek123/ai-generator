import { Module } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { WorkspacesController } from './workspaces.controller';
import { WorkspaceRelationalPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { MemberRelationalPersistenceModule } from '../members/infrastructure/persistence/relational/relational-persistence.module';

@Module({
  imports: [
    WorkspaceRelationalPersistenceModule,
    MemberRelationalPersistenceModule,
  ],
  controllers: [WorkspacesController],
  providers: [WorkspacesService],
  exports: [WorkspacesService, WorkspaceRelationalPersistenceModule],
})
export class WorkspacesModule {}
