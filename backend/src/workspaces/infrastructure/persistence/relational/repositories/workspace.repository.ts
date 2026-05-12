import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkspaceEntity } from '../entities/workspace.entity';
import { WorkspaceRepository } from '../../workspace.repository';
import { Workspace } from '../../../../domain/workspace';
import { WorkspaceMapper } from '../mappers/workspace.mapper';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { MemberEntity } from '../../../../../members/infrastructure/persistence/relational/entities/member.entity';

@Injectable()
export class WorkspacesRelationalRepository
  implements WorkspaceRepository
{
  constructor(
    @InjectRepository(WorkspaceEntity)
    private readonly orgRepo: Repository<WorkspaceEntity>,
    @InjectRepository(MemberEntity)
    private readonly memberRepo: Repository<MemberEntity>,
  ) {}

  async create(data: Workspace): Promise<Workspace> {
    const persistenceModel = WorkspaceMapper.toPersistence(data);
    const newEntity = await this.orgRepo.save(
      this.orgRepo.create(persistenceModel),
    );
    return WorkspaceMapper.toDomain(newEntity);
  }

  async findById(id: string): Promise<NullableType<Workspace>> {
    const entity = await this.orgRepo.findOne({ where: { id } });
    return entity ? WorkspaceMapper.toDomain(entity) : null;
  }

  async findBySlug(slug: string): Promise<NullableType<Workspace>> {
    const entity = await this.orgRepo.findOne({ where: { slug } });
    return entity ? WorkspaceMapper.toDomain(entity) : null;
  }

  async findByDomain(domain: string): Promise<NullableType<Workspace>> {
    const entity = await this.orgRepo.findOne({ where: { domain } });
    return entity ? WorkspaceMapper.toDomain(entity) : null;
  }

  async findManyByDomain(domain: string): Promise<Workspace[]> {
    const entities = await this.orgRepo.find({ where: { domain } });
    return entities.map((e) => WorkspaceMapper.toDomain(e));
  }

  async findByOwnerId(ownerId: number): Promise<Workspace[]> {
    const entities = await this.orgRepo.find({ where: { ownerId } });
    return entities.map((e) => WorkspaceMapper.toDomain(e));
  }

  async findByUserId(userId: number): Promise<Workspace[]> {
    // Find all orgs where user is a member
    const members = await this.memberRepo.find({
      where: { userId },
      relations: ['workspace'],
    });
    return members
      .filter((m) => m.workspace)
      .map((m) => WorkspaceMapper.toDomain(m.workspace));
  }

  async update(
    id: string,
    payload: Partial<Workspace>,
  ): Promise<Workspace | null> {
    const entity = await this.orgRepo.findOne({ where: { id } });
    if (!entity) return null;

    const updated = await this.orgRepo.save(
      this.orgRepo.create(
        WorkspaceMapper.toPersistence({
          ...WorkspaceMapper.toDomain(entity),
          ...payload,
        }),
      ),
    );
    return WorkspaceMapper.toDomain(updated);
  }

  async remove(id: string): Promise<void> {
    await this.orgRepo.delete(id);
  }
}
