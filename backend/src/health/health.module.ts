import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';
import { HealthController } from './health.controller';
import { QueuesModule } from '../queues/queues.module';
import { QueueHealthService } from './queue-health.service';

@Module({
  imports: [TerminusModule, HttpModule, QueuesModule],
  controllers: [HealthController],
  providers: [QueueHealthService],
})
export class HealthModule {}
