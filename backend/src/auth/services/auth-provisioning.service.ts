import { Injectable } from '@nestjs/common';
import { User } from '../../users/domain/user';
import { UsersService } from '../../users/users.service';
import { WorkspacesService } from '../../workspaces/workspaces.service';
import { ProjectsService } from '../../projects/projects.service';

@Injectable()
export class AuthProvisioningService {
  constructor(
    private usersService: UsersService,
    private projectsService: ProjectsService,
    private workspacesService: WorkspacesService,
  ) {}

  async ensureDefaultWorkspace(userId: User['id']): Promise<void> {
    const numericId = Number(userId);
    try {
      const user = await this.usersService.findById(userId);
      if (!user) return;

      const workspaces = await this.workspacesService.findByUserId(numericId);
      
      // If user has a domain, try to find workspaces to auto-join
      if (user.email && user.email.includes('@')) {
        const domain = user.email.split('@')[1];
        // Note: You would need a method in WorkspacesService to find by domain and autoAttach.
        // For now, let's assume we can query them.
        // This is a placeholder for actual domain-based join logic which should be in WorkspacesService.
        await this.workspacesService.autoJoinByDomain(numericId, domain);
      }

      if (workspaces.length === 0) {
        await this.workspacesService.create(
          {
            name: user?.firstName ? `${user.firstName}'s Personal Space` : 'Personal Workspace',
            description: 'Default personal workspace',
            type: 'PERSONAL',
          } as any,
          numericId,
        );
      }
    } catch (error) {
      console.error('Failed to ensure default workspace:', error);
    }
  }

  async ensureDefaultProject(userId: User['id']): Promise<void> {
    const numericId = Number(userId);
    try {
      const projects = await this.projectsService.findAll(numericId);
      if (projects.length === 0) {
        const workspaces = await this.workspacesService.findByUserId(numericId);
        const workspaceId =
          workspaces.length > 0 ? workspaces[0].id : undefined;

        await this.projectsService.create(
          {
            name: 'General',
            description: 'Default personal workspace',
            workspaceId: workspaceId,
          } as any,
          numericId,
        );
      }
    } catch (error) {
      console.error('Failed to ensure default project:', error);
    }
  }

  async provisionUser(userId: User['id']): Promise<void> {
    await this.ensureDefaultWorkspace(userId);
    await this.ensureDefaultProject(userId);
  }
}
