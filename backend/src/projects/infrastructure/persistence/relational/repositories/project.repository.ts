import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectEntity } from '../entities/project.entity';
import { ProjectRepository } from '../../project.repository';
import { Project } from '../../../../domain/project';
import { ProjectMapper } from '../mappers/project.mapper';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';
import { DeepPartial } from '../../../../../utils/types/deep-partial.type';
import {
  FilterProjectDto,
  SortProjectDto,
} from '../../../../dto/query-project.dto';
import { FindOptionsWhere, ILike } from 'typeorm';

@Injectable()
export class ProjectsRelationalRepository implements ProjectRepository {
  constructor(
    @InjectRepository(ProjectEntity)
    private readonly projectsRepository: Repository<ProjectEntity>,
  ) {}

  async create(data: Project): Promise<Project> {
    const persistenceModel = ProjectMapper.toPersistence(data);
    const newEntity = await this.projectsRepository.save(
      this.projectsRepository.create(persistenceModel),
    );
    return ProjectMapper.toDomain(newEntity);
  }

  async findAll(
    userId: string | number,
    workspaceId?: string | null,
  ): Promise<Project[]> {
    const where: FindOptionsWhere<ProjectEntity> = {
      userId: String(userId),
    };

    if (workspaceId) {
      where.workspaceId = workspaceId;
    }

    const entities = await this.projectsRepository.find({
      where: where,
    });
    return entities.map((entity) => ProjectMapper.toDomain(entity));
  }

  async findManyWithPagination({
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
    const where: FindOptionsWhere<ProjectEntity> = {
      userId: String(userId),
    };

    if (workspaceId) {
      where.workspaceId = workspaceId;
    }

    if (filterOptions?.workspaceId) {
      where.workspaceId = filterOptions.workspaceId;
    }

    if (filterOptions?.name) {
      where.name = ILike(`%${filterOptions.name}%`);
    }

    const entities = await this.projectsRepository.find({
      skip: (paginationOptions.page - 1) * paginationOptions.limit,
      take: paginationOptions.limit,
      where: where,
      order: sortOptions?.reduce(
        (accumulator, sort) => ({
          ...accumulator,
          [sort.orderBy]: sort.order,
        }),
        {},
      ),
    });

    return entities.map((entity) => ProjectMapper.toDomain(entity));
  }

  async findById(id: string): Promise<NullableType<Project>> {
    const entity = await this.projectsRepository.findOne({
      where: { id },
    });

    return entity ? ProjectMapper.toDomain(entity) : null;
  }

  async update(id: string, payload: DeepPartial<Project>): Promise<Project> {
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
        } as Project),
      ),
    );

    return ProjectMapper.toDomain(updatedEntity);
  }

  async remove(id: string): Promise<void> {
    await this.projectsRepository.softDelete(id);
  }
}
