import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationEntity } from './entities/organization.entity';
import { OrganizationRepository } from '../organization.repository';
import { OrganizationsRelationalRepository } from './repositories/organization.repository';
import { MemberEntity } from '../../../../members/infrastructure/persistence/relational/entities/member.entity';

@Module({
  imports: [TypeOrmModule.forFeature([OrganizationEntity, MemberEntity])],
  providers: [
    {
      provide: OrganizationRepository,
      useClass: OrganizationsRelationalRepository,
    },
  ],
  exports: [OrganizationRepository],
})
export class OrgRelationalPersistenceModule {}
