import { Module } from '@nestjs/common';
import { WorkflowsRelationalRepository } from './repositories/workflow.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkflowEntity } from './entities/workflow.entity';
import { WorkflowRepository } from '../workflow.repository';

@Module({
  imports: [TypeOrmModule.forFeature([WorkflowEntity])],
  providers: [
    {
      provide: WorkflowRepository,
      useClass: WorkflowsRelationalRepository,
    },
  ],
  exports: [WorkflowRepository],
})
export class RelationalPersistenceModule {}
