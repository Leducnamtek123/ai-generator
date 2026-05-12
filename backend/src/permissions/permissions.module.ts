import { Module } from '@nestjs/common';
import { PermissionsGuard } from './permissions.guard';
import { MemberRelationalPersistenceModule } from '../members/infrastructure/persistence/relational/relational-persistence.module';
import { WorkspaceRelationalPersistenceModule } from '../workspaces/infrastructure/persistence/relational/relational-persistence.module';

@Module({
  imports: [
    MemberRelationalPersistenceModule,
    WorkspaceRelationalPersistenceModule,
  ],
  providers: [PermissionsGuard],
  exports: [PermissionsGuard],
})
export class PermissionsModule {}
