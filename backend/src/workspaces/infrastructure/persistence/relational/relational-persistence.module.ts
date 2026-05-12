import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkspaceEntity } from './entities/workspace.entity';
import { WorkspaceRepository } from '../workspace.repository';
import { WorkspacesRelationalRepository } from './repositories/workspace.repository';
import { MemberEntity } from '../../../../members/infrastructure/persistence/relational/entities/member.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WorkspaceEntity, MemberEntity])],
  providers: [
    {
      provide: WorkspaceRepository,
      useClass: WorkspacesRelationalRepository,
    },
  ],
  exports: [WorkspaceRepository],
})
export class WorkspaceRelationalPersistenceModule {}
