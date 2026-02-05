import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectRepository } from './infrastructure/persistence/project.repository';

@Injectable()
export class ProjectsService {
  constructor(private readonly projectRepository: ProjectRepository) {}

  create(createProjectDto: CreateProjectDto, userId: string | number) {
    const clonedPayload = {
      name: createProjectDto.name,
      description: createProjectDto.description,
      userId: String(userId),
    };

    return this.projectRepository.create(clonedPayload);
  }

  findAll(userId: string | number) {
    return this.projectRepository.findAll(userId);
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
    };

    return this.projectRepository.update(id, clonedPayload);
  }

  async remove(id: string, userId: string | number) {
    await this.findOne(id, userId);
    return this.projectRepository.remove(id);
  }
}
