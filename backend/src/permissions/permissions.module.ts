import { Module } from '@nestjs/common';
import { PermissionsGuard } from './permissions.guard';
import { MemberRelationalPersistenceModule } from '../members/infrastructure/persistence/relational/relational-persistence.module';
import { OrgRelationalPersistenceModule } from '../organizations/infrastructure/persistence/relational/relational-persistence.module';

@Module({
  imports: [MemberRelationalPersistenceModule, OrgRelationalPersistenceModule],
  providers: [PermissionsGuard],
  exports: [PermissionsGuard],
})
export class PermissionsModule {}
