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
import { WorkspaceRepository } from '../workspaces/infrastructure/persistence/workspace.repository';
import { MemberRepository } from '../members/infrastructure/persistence/member.repository';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly workspaceRepository: WorkspaceRepository,
    private readonly memberRepository: MemberRepository,
  ) {}

  async create(
    createProjectDto: CreateProjectDto,
    userId: string | number,
    workspaceId?: string | null,
  ) {
    if (workspaceId) {
      const workspace = await this.workspaceRepository.findById(workspaceId);
      if (!workspace) {
        throw new NotFoundException('Workspace not found');
      }

      const member = await this.memberRepository.findByUserAndWorkspace(
        Number(userId),
        workspaceId,
      );
      if (!member) {
        throw new ForbiddenException('Cannot create project in this workspace');
      }
    }

    const clonedPayload = {
      name: createProjectDto.name,
      description: createProjectDto.description,
      content: createProjectDto.content,
      userId: String(userId),
      workspaceId: workspaceId || undefined,
    };

    return this.projectRepository.create(clonedPayload);
  }

  findAll(userId: string | number, workspaceId?: string | null) {
    return this.projectRepository.findAll(userId, workspaceId);
  }

  findManyWithPagination({
    userId,
    workspaceId,
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    userId: string | number;
    workspaceId?: string | null;
    filterOptions?: FilterProjectDto | null;
    sortOptions?: SortProjectDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<Project[]> {
    return this.projectRepository.findManyWithPagination({
      userId,
      workspaceId,
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

    if (updateProjectDto.workspaceId) {
      const workspace = await this.workspaceRepository.findById(
        updateProjectDto.workspaceId,
      );
      if (!workspace) {
        throw new NotFoundException('Workspace not found');
      }

      const member = await this.memberRepository.findByUserAndWorkspace(
        Number(userId),
        updateProjectDto.workspaceId,
      );
      if (!member) {
        throw new ForbiddenException('Cannot move project to this workspace');
      }
    }

    const clonedPayload = {
      name: updateProjectDto.name,
      description: updateProjectDto.description,
      content: updateProjectDto.content,
      workspaceId: updateProjectDto.workspaceId,
    };

    return this.projectRepository.update(id, clonedPayload);
  }

  async remove(id: string, userId: string | number) {
    await this.findOne(id, userId);
    return this.projectRepository.remove(id);
  }
}
