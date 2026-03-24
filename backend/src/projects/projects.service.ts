import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectRepository } from './infrastructure/persistence/project.repository';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { FilterProjectDto, SortProjectDto } from './dto/query-project.dto';
import { Project } from './domain/project';

@Injectable()
export class ProjectsService {
  constructor(private readonly projectRepository: ProjectRepository) {}

  create(createProjectDto: CreateProjectDto, userId: string | number) {
    const clonedPayload = {
      name: createProjectDto.name,
      description: createProjectDto.description,
      content: createProjectDto.content,
      userId: String(userId),
    };

    return this.projectRepository.create(clonedPayload);
  }

  findAll(userId: string | number) {
    return this.projectRepository.findAll(userId);
  }

  findManyWithPagination({
    userId,
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    userId: string | number;
    filterOptions?: FilterProjectDto | null;
    sortOptions?: SortProjectDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<Project[]> {
    return this.projectRepository.findManyWithPagination({
      userId,
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
