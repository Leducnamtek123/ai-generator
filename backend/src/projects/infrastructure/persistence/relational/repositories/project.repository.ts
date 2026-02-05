import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectEntity } from '../entities/project.entity';
import { ProjectRepository } from '../../project.repository';
import { Project } from '../../../../domain/project';
import { ProjectMapper } from '../mappers/project.mapper';
import { NullableType } from '../../../../../utils/types/nullable.type';

@Injectable()
export class ProjectsRelationalRepository implements ProjectRepository {
  constructor(
    @InjectRepository(ProjectEntity)
    private readonly projectsRepository: Repository<ProjectEntity>,
  ) { }

  async create(data: Project): Promise<Project> {
    const persistenceModel = ProjectMapper.toPersistence(data);
    const newEntity = await this.projectsRepository.save(
      this.projectsRepository.create(persistenceModel),
    );
    return ProjectMapper.toDomain(newEntity);
  }

  async findAll(userId: string): Promise<Project[]> {
    const entities = await this.projectsRepository.find({
      where: { userId },
    });
    return entities.map((entity) => ProjectMapper.toDomain(entity));
  }

  async findCommunity(): Promise<Project[]> {
    const entities = await this.projectsRepository.find({
      where: { visibility: 'public' },
    });
    return entities.map((entity) => ProjectMapper.toDomain(entity));
  }


  async findById(id: string): Promise<NullableType<Project>> {
    const entity = await this.projectsRepository.findOne({
      where: { id },
    });

    return entity ? ProjectMapper.toDomain(entity) : null;
  }

  async update(id: string, payload: Partial<Project>): Promise<Project> {
    const entity = await this.projectsRepository.findOne({
      where: { id },
    });

    if (!entity) {
      throw new Error('Project not found');
    }

    const updatedEntity = await this.projectsRepository.save(
      this.projectsRepository.create(
        ProjectMapper.toPersistence({
          ...ProjectMapper.toDomain(entity),
          ...payload,
        }),
      ),
    );

    return ProjectMapper.toDomain(updatedEntity);
  }

  async remove(id: string): Promise<void> {
    await this.projectsRepository.softDelete(id);
  }
}
