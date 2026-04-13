import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { WorkflowsModule } from '../workflows/workflows.module';
import { CreditsModule } from '../credits/credits.module';
import { ProjectsModule } from '../projects/projects.module';

@Module({
  imports: [WorkflowsModule, CreditsModule, ProjectsModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
