import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectRepository } from './infrastructure/persistence/project.repository';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { FilterProjectDto, SortProjectDto } from './dto/query-project.dto';
import { Project } from './domain/project';
import { OrganizationRepository } from '../organizations/infrastructure/persistence/organization.repository';
import { MemberRepository } from '../members/infrastructure/persistence/member.repository';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly orgRepository: OrganizationRepository,
    private readonly memberRepository: MemberRepository,
  ) {}

  async create(
    createProjectDto: CreateProjectDto,
    userId: string | number,
    organizationId?: string | null,
  ) {
    if (organizationId) {
      const org = await this.orgRepository.findById(organizationId);
      if (!org) {
        throw new NotFoundException('Organization not found');
      }

      const member = await this.memberRepository.findByUserAndOrg(
        Number(userId),
        organizationId,
      );
      if (!member) {
        throw new ForbiddenException(
          'Cannot create project in this organization',
        );
      }
    }

    const clonedPayload = {
      name: createProjectDto.name,
      description: createProjectDto.description,
      content: createProjectDto.content,
      userId: String(userId),
      organizationId: organizationId || undefined,
    };

    return this.projectRepository.create(clonedPayload);
  }

  findAll(userId: string | number, organizationId?: string | null) {
    return this.projectRepository.findAll(userId, organizationId);
  }

  findManyWithPagination({
    userId,
    organizationId,
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    userId: string | number;
    organizationId?: string | null;
    filterOptions?: FilterProjectDto | null;
    sortOptions?: SortProjectDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<Project[]> {
    return this.projectRepository.findManyWithPagination({
      userId,
      organizationId,
      filterOptions,
      sortOptions,
      paginationOptions,
    });
  }

  async findOne(id: string, userId: string | number) {
    const project = await this.projectRepository.findById(id);

    if (!project || String(project.userId) !== String(userId)) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async update(
    id: string,
    userId: string | number,
    updateProjectDto: UpdateProjectDto,
  ) {
    // Verify ownership first
    await this.findOne(id, userId);

    const clonedPayload = {
      name: updateProjectDto.name,
      description: updateProjectDto.description,
      content: updateProjectDto.content,
    };

    return this.projectRepository.update(id, clonedPayload);
  }

  async remove(id: string, userId: string | number) {
    await this.findOne(id, userId);
    return this.projectRepository.remove(id);
  }
}
