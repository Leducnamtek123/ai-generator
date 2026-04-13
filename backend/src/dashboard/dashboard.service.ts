import { Injectable } from '@nestjs/common';
import { WorkflowsService } from '../workflows/workflows.service';
import { CreditsService } from '../credits/credits.service';
import { ProjectsService } from '../projects/projects.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly workflowsService: WorkflowsService,
    private readonly creditsService: CreditsService,
    private readonly projectsService: ProjectsService,
  ) {}

  async getStats(userId: number) {
    const [workflows, balance, projects] = await Promise.all([
      this.workflowsService.findAll(userId),
      this.creditsService.getBalance(String(userId)),
      this.projectsService.findAll(userId),
    ]);

    // Format recent workflows (take last 4)
    const recentWorkflows = [...workflows]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 4);

    return {
      totalWorkflows: workflows.length,
      totalProjects: projects.length,
      creditBalance: balance || 0,
      recentWorkflows,
    };
  }
}
