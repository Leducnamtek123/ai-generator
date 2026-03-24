import { Module } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { OrganizationsController } from './organizations.controller';
import { OrgRelationalPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { MemberRelationalPersistenceModule } from '../members/infrastructure/persistence/relational/relational-persistence.module';

@Module({
  imports: [OrgRelationalPersistenceModule, MemberRelationalPersistenceModule],
  controllers: [OrganizationsController],
  providers: [OrganizationsService],
  exports: [OrganizationsService, OrgRelationalPersistenceModule],
})
export class OrganizationsModule {}
