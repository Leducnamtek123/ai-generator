import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InviteEntity } from './entities/invite.entity';
import { InviteRepository } from '../invite.repository';
import { InvitesRelationalRepository } from './repositories/invite.repository';

@Module({
  imports: [TypeOrmModule.forFeature([InviteEntity])],
  providers: [
    {
      provide: InviteRepository,
      useClass: InvitesRelationalRepository,
    },
  ],
  exports: [InviteRepository],
})
export class InviteRelationalPersistenceModule {}
