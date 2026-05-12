import { Module } from '@nestjs/common';
import { InvitesService } from './invites.service';
import { InvitesController } from './invites.controller';
import { InviteRelationalPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { MemberRelationalPersistenceModule } from '../members/infrastructure/persistence/relational/relational-persistence.module';
import { WorkspaceRelationalPersistenceModule } from '../workspaces/infrastructure/persistence/relational/relational-persistence.module';

@Module({
  imports: [
    InviteRelationalPersistenceModule,
    MemberRelationalPersistenceModule,
    WorkspaceRelationalPersistenceModule,
  ],
  controllers: [InvitesController],
  providers: [InvitesService],
  exports: [InvitesService],
})
export class InvitesModule {}
