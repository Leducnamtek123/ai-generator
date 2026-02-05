import { Module } from '@nestjs/common';
import { WorkflowsService } from './workflows.service';
import { WorkflowsController } from './workflows.controller';
import { WorkflowsExecutionController } from './workflows.execution.controller';
import { RelationalPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { WorkflowEngine } from './engine/workflow.engine';
import { QueuesModule } from '../queues/queues.module';

@Module({
  imports: [RelationalPersistenceModule, QueuesModule],
  controllers: [WorkflowsController, WorkflowsExecutionController],
  providers: [WorkflowsService, WorkflowEngine],
  exports: [WorkflowsService, WorkflowEngine, RelationalPersistenceModule],
})
export class WorkflowsModule { }

