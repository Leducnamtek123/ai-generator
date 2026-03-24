import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrganizationEntity } from '../entities/organization.entity';
import { OrganizationRepository } from '../../organization.repository';
import { Organization } from '../../../../domain/organization';
import { OrganizationMapper } from '../mappers/organization.mapper';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { MemberEntity } from '../../../../../members/infrastructure/persistence/relational/entities/member.entity';

@Injectable()
export class OrganizationsRelationalRepository
  implements OrganizationRepository
{
  constructor(
    @InjectRepository(OrganizationEntity)
    private readonly orgRepo: Repository<OrganizationEntity>,
    @InjectRepository(MemberEntity)
    private readonly memberRepo: Repository<MemberEntity>,
  ) {}

  async create(data: Organization): Promise<Organization> {
    const persistenceModel = OrganizationMapper.toPersistence(data);
    const newEntity = await this.orgRepo.save(
      this.orgRepo.create(persistenceModel),
    );
    return OrganizationMapper.toDomain(newEntity);
  }

  async findById(id: string): Promise<NullableType<Organization>> {
    const entity = await this.orgRepo.findOne({ where: { id } });
    return entity ? OrganizationMapper.toDomain(entity) : null;
  }

  async findBySlug(slug: string): Promise<NullableType<Organization>> {
    const entity = await this.orgRepo.findOne({ where: { slug } });
    return entity ? OrganizationMapper.toDomain(entity) : null;
  }

  async findByDomain(domain: string): Promise<NullableType<Organization>> {
    const entity = await this.orgRepo.findOne({ where: { domain } });
    return entity ? OrganizationMapper.toDomain(entity) : null;
  }

  async findByOwnerId(ownerId: number): Promise<Organization[]> {
    const entities = await this.orgRepo.find({ where: { ownerId } });
    return entities.map((e) => OrganizationMapper.toDomain(e));
  }

  async findByUserId(userId: number): Promise<Organization[]> {
    // Find all orgs where user is a member
    const members = await this.memberRepo.find({
      where: { userId },
      relations: ['organization'],
    });
    return members
      .filter((m) => m.organization)
      .map((m) => OrganizationMapper.toDomain(m.organization));
  }

  async update(
    id: string,
    payload: Partial<Organization>,
  ): Promise<Organization | null> {
    const entity = await this.orgRepo.findOne({ where: { id } });
    if (!entity) return null;

    const updated = await this.orgRepo.save(
      this.orgRepo.create(
        OrganizationMapper.toPersistence({
          ...OrganizationMapper.toDomain(entity),
          ...payload,
        }),
      ),
    );
    return OrganizationMapper.toDomain(updated);
  }

  async remove(id: string): Promise<void> {
    await this.orgRepo.delete(id);
  }
}
