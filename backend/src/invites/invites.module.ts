import { Module } from '@nestjs/common';
import { InvitesService } from './invites.service';
import { InvitesController } from './invites.controller';
import { InviteRelationalPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { MemberRelationalPersistenceModule } from '../members/infrastructure/persistence/relational/relational-persistence.module';
import { OrgRelationalPersistenceModule } from '../organizations/infrastructure/persistence/relational/relational-persistence.module';

@Module({
  imports: [
    InviteRelationalPersistenceModule,
    MemberRelationalPersistenceModule,
    OrgRelationalPersistenceModule,
  ],
  controllers: [InvitesController],
  providers: [InvitesService],
  exports: [InvitesService],
})
export class InvitesModule {}
