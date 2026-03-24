import { Module } from '@nestjs/common';
import { MembersService } from './members.service';
import { MembersController } from './members.controller';
import { MemberRelationalPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { OrgRelationalPersistenceModule } from '../organizations/infrastructure/persistence/relational/relational-persistence.module';

@Module({
  imports: [MemberRelationalPersistenceModule, OrgRelationalPersistenceModule],
  controllers: [MembersController],
  providers: [MembersService],
  exports: [MembersService, MemberRelationalPersistenceModule],
})
export class MembersModule {}
