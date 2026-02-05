import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkflowEntity } from '../entities/workflow.entity';
import { WorkflowRepository } from '../../workflow.repository';
import { Workflow } from '../../../../domain/workflow';
import { WorkflowMapper } from '../mappers/workflow.mapper';
import { NullableType } from '../../../../../utils/types/nullable.type';

@Injectable()
export class WorkflowsRelationalRepository implements WorkflowRepository {
  constructor(
    @InjectRepository(WorkflowEntity)
    private readonly workflowsRepository: Repository<WorkflowEntity>,
  ) {}

  async create(data: Workflow): Promise<Workflow> {
    const persistenceModel = WorkflowMapper.toPersistence(data);
    const newEntity = await this.workflowsRepository.save(
      this.workflowsRepository.create(persistenceModel),
    );
    return WorkflowMapper.toDomain(newEntity);
  }

  async findAll(userId: string): Promise<Workflow[]> {
    const entities = await this.workflowsRepository.find({
      relations: ['project'],
      where: {
        project: {
          userId: userId,
        },
      },
    });
    return entities.map((entity) => WorkflowMapper.toDomain(entity));
  }

  async findCommunity(): Promise<Workflow[]> {
    const entities = await this.workflowsRepository.find({
      where: { visibility: 'public' },
    });
    return entities.map((entity) => WorkflowMapper.toDomain(entity));
  }

  async findByProject(
    projectId: string,
    userId: string | number,
  ): Promise<Workflow[]> {
    const entities = await this.workflowsRepository.find({
      relations: ['project'],
      where: {
        projectId,
        project: {
          userId: String(userId),
        },
      },
    });
    return entities.map((entity) => WorkflowMapper.toDomain(entity));
  }

  async findById(
    id: string,
    userId?: string | number,
  ): Promise<NullableType<Workflow>> {
    const where: any = { id };
    if (userId) {
      where.project = { userId: String(userId) };
    }

    const entity = await this.workflowsRepository.findOne({
      relations: ['project'],
      where,
    });

    return entity ? WorkflowMapper.toDomain(entity) : null;
  }

  async update(
    id: string,
    userId: string | number,
    payload: Partial<Workflow>,
  ): Promise<Workflow> {
    const entity = await this.workflowsRepository.findOne({
      relations: ['project'],
      where: {
        id,
        project: {
          userId: String(userId),
        },
      },
    });

    if (!entity) {
      throw new Error('Workflow not found or access denied');
    }

    const updatedEntity = await this.workflowsRepository.save(
      this.workflowsRepository.create(
        WorkflowMapper.toPersistence({
          ...WorkflowMapper.toDomain(entity),
          ...payload,
        }),
      ),
    );

    return WorkflowMapper.toDomain(updatedEntity);
  }

  async remove(id: string, userId: string | number): Promise<void> {
    const entity = await this.workflowsRepository.findOne({
      relations: ['project'],
      where: {
        id,
        project: {
          userId: String(userId),
        },
      },
    });

    if (!entity) {
      throw new Error('Workflow not found or access denied');
    }

    await this.workflowsRepository.softDelete(id);
  }
}
