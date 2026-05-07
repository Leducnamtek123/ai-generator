import { Injectable } from '@nestjs/common';
import { User } from '../../users/domain/user';
import { UsersService } from '../../users/users.service';
import { OrganizationsService } from '../../organizations/organizations.service';
import { ProjectsService } from '../../projects/projects.service';

@Injectable()
export class AuthProvisioningService {
  constructor(
    private usersService: UsersService,
    private projectsService: ProjectsService,
    private organizationsService: OrganizationsService,
  ) {}

  async ensureDefaultOrganization(userId: User['id']): Promise<void> {
    const numericId = Number(userId);
    try {
      const user = await this.usersService.findById(userId);
      if (!user) return;

      const orgs = await this.organizationsService.findByUserId(numericId);
      
      // If user has a domain, try to find organizations to auto-join
      if (user.email && user.email.includes('@')) {
        const domain = user.email.split('@')[1];
        // Note: You would need a method in OrganizationsService to find by domain and autoAttach
        // For now, let's assume we can query them.
        // This is a placeholder for actual domain-based join logic which should be in OrganizationsService
        await this.organizationsService.autoJoinByDomain(numericId, domain);
      }

      if (orgs.length === 0) {
        await this.organizationsService.create(
          {
            name: user?.firstName ? `${user.firstName}'s Personal Space` : 'Personal Workspace',
            description: 'Default personal organization',
            type: 'PERSONAL',
          } as any,
          numericId,
        );
      }
    } catch (error) {
      console.error('Failed to ensure default organization:', error);
    }
  }

  async ensureDefaultProject(userId: User['id']): Promise<void> {
    const numericId = Number(userId);
    try {
      const projects = await this.projectsService.findAll(numericId);
      if (projects.length === 0) {
        const orgs = await this.organizationsService.findByUserId(numericId);
        const orgId = orgs.length > 0 ? orgs[0].id : undefined;

        await this.projectsService.create(
          {
            name: 'General',
            description: 'Default personal workspace',
            organizationId: orgId,
          } as any,
          numericId,
        );
      }
    } catch (error) {
      console.error('Failed to ensure default project:', error);
    }
  }

  async provisionUser(userId: User['id']): Promise<void> {
    await this.ensureDefaultOrganization(userId);
    await this.ensureDefaultProject(userId);
  }
}
