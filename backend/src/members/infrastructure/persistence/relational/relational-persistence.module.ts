import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MemberEntity } from './entities/member.entity';
import { MemberRepository } from '../member.repository';
import { MembersRelationalRepository } from './repositories/member.repository';

@Module({
  imports: [TypeOrmModule.forFeature([MemberEntity])],
  providers: [
    {
      provide: MemberRepository,
      useClass: MembersRelationalRepository,
    },
  ],
  exports: [MemberRepository],
})
export class MemberRelationalPersistenceModule {}
