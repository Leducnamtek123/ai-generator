import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkflowsService } from './workflows.service';
import { WorkflowsController } from './workflows.controller';
import { WorkflowsExecutionController } from './workflows.execution.controller';
import { RelationalPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { WorkflowExecutionEntity } from './infrastructure/persistence/relational/entities/workflow-execution.entity';
import { WorkflowEngine } from './engine/workflow.engine';
import { WorkflowProcessor } from './engine/workflow.processor';
import { QueuesModule } from '../queues/queues.module';
import { GenerationsModule } from '../generations/generations.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    RelationalPersistenceModule,
    TypeOrmModule.forFeature([WorkflowExecutionEntity]),
    forwardRef(() => QueuesModule),
    GenerationsModule,
    NotificationsModule,
  ],
  controllers: [WorkflowsController, WorkflowsExecutionController],
  providers: [WorkflowsService, WorkflowEngine, WorkflowProcessor],
  exports: [WorkflowsService, WorkflowEngine, RelationalPersistenceModule],
})
export class WorkflowsModule {}
