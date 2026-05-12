import { Module } from '@nestjs/common';
import { MembersService } from './members.service';
import { MembersController } from './members.controller';
import { MemberRelationalPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { WorkspaceRelationalPersistenceModule } from '../workspaces/infrastructure/persistence/relational/relational-persistence.module';

@Module({
  imports: [
    MemberRelationalPersistenceModule,
    WorkspaceRelationalPersistenceModule,
  ],
  controllers: [MembersController],
  providers: [MembersService],
  exports: [MembersService, MemberRelationalPersistenceModule],
})
export class MembersModule {}
