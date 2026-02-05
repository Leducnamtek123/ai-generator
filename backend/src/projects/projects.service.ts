import { Injectable } from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectRepository } from './infrastructure/persistence/project.repository';
import { Project } from './domain/project';

@Injectable()
export class ProjectsService {
  constructor(private readonly projectRepository: ProjectRepository) { }

  create(createProjectDto: CreateProjectDto, userId: string) {
    const clonedPayload = {
      name: createProjectDto.name,
      description: createProjectDto.description,
      visibility: createProjectDto.visibility || 'private',
      userId: userId,
    };


    return this.projectRepository.create(clonedPayload);
  }

  findAll(userId: string) {
    return this.projectRepository.findAll(userId);
  }

  findCommunity() {
    return this.projectRepository.findCommunity();
  }


  async findOne(id: string, userId: string) {
    const project = await this.projectRepository.findById(id);
    if (!project || project.userId !== userId) {
      throw new Error('Project not found');
    }
    return project;
  }

  async update(id: string, userId: string, updateProjectDto: UpdateProjectDto) {
    // Verify ownership first
    await this.findOne(id, userId);

    const clonedPayload = {
      name: updateProjectDto.name,
      description: updateProjectDto.description,
      visibility: updateProjectDto.visibility,
    };


    return this.projectRepository.update(id, clonedPayload);
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    return this.projectRepository.remove(id);
  }
}
