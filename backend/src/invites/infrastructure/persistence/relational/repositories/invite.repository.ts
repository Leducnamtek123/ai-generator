import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InviteEntity } from '../entities/invite.entity';
import { InviteRepository } from '../../invite.repository';
import { Invite } from '../../../../domain/invite';
import { InviteMapper } from '../mappers/invite.mapper';
import { NullableType } from '../../../../../utils/types/nullable.type';

@Injectable()
export class InvitesRelationalRepository implements InviteRepository {
  constructor(
    @InjectRepository(InviteEntity)
    private readonly inviteRepo: Repository<InviteEntity>,
  ) {}

  async create(data: Invite): Promise<Invite> {
    const persistenceModel = InviteMapper.toPersistence(data);
    const newEntity = await this.inviteRepo.save(
      this.inviteRepo.create(persistenceModel),
    );
    return InviteMapper.toDomain(newEntity);
  }

  async findById(id: string): Promise<NullableType<Invite>> {
    const entity = await this.inviteRepo.findOne({
      where: { id },
      relations: ['organization'],
    });
    return entity ? InviteMapper.toDomain(entity) : null;
  }

  async findByOrganizationId(organizationId: string): Promise<Invite[]> {
    const entities = await this.inviteRepo.find({
      where: { organizationId },
    });
    return entities.map((e) => InviteMapper.toDomain(e));
  }

  async findByEmail(email: string): Promise<Invite[]> {
    const entities = await this.inviteRepo.find({
      where: { email },
      relations: ['organization'],
    });
    return entities.map((e) => InviteMapper.toDomain(e));
  }

  async findByOrgAndEmail(
    organizationId: string,
    email: string,
  ): Promise<NullableType<Invite>> {
    const entity = await this.inviteRepo.findOne({
      where: { organizationId, email },
    });
    return entity ? InviteMapper.toDomain(entity) : null;
  }

  async remove(id: string): Promise<void> {
    await this.inviteRepo.delete(id);
  }
}
