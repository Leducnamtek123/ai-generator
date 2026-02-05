import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { WorkflowsService } from './workflows.service';
import { WorkflowsController } from './workflows.controller';
import { WorkflowsExecutionController } from './workflows.execution.controller';
import { RelationalPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { WorkflowEngine } from './engine/workflow.engine';
import { WorkflowProcessor } from './engine/workflow.processor';
import { QueuesModule } from '../queues/queues.module';
import { WORKFLOW_QUEUE, GENERATION_QUEUE } from '../queues/queues.constants';

@Module({
  imports: [
    RelationalPersistenceModule,
    forwardRef(() => QueuesModule),
    BullModule.registerQueue(
      { name: WORKFLOW_QUEUE },
      { name: GENERATION_QUEUE },
    ),
  ],
  controllers: [WorkflowsController, WorkflowsExecutionController],
  providers: [WorkflowsService, WorkflowEngine, WorkflowProcessor],
  exports: [WorkflowsService, WorkflowEngine, RelationalPersistenceModule],
})
export class WorkflowsModule {}
