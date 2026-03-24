import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MemberEntity } from '../entities/member.entity';
import { MemberRepository } from '../../member.repository';
import { Member } from '../../../../domain/member';
import { MemberMapper } from '../mappers/member.mapper';
import { NullableType } from '../../../../../utils/types/nullable.type';

@Injectable()
export class MembersRelationalRepository implements MemberRepository {
  constructor(
    @InjectRepository(MemberEntity)
    private readonly memberRepo: Repository<MemberEntity>,
  ) {}

  async create(data: Member): Promise<Member> {
    const persistenceModel = MemberMapper.toPersistence(data);
    const newEntity = await this.memberRepo.save(
      this.memberRepo.create(persistenceModel),
    );
    return MemberMapper.toDomain(newEntity);
  }

  async findById(id: string): Promise<NullableType<Member>> {
    const entity = await this.memberRepo.findOne({ where: { id } });
    return entity ? MemberMapper.toDomain(entity) : null;
  }

  async findByUserAndOrg(
    userId: number,
    organizationId: string,
  ): Promise<NullableType<Member>> {
    const entity = await this.memberRepo.findOne({
      where: { userId, organizationId },
    });
    return entity ? MemberMapper.toDomain(entity) : null;
  }

  async findByOrganizationId(organizationId: string): Promise<Member[]> {
    const entities = await this.memberRepo.find({
      where: { organizationId },
    });
    return entities.map((e) => MemberMapper.toDomain(e));
  }

  async update(id: string, payload: Partial<Member>): Promise<Member | null> {
    const entity = await this.memberRepo.findOne({ where: { id } });
    if (!entity) return null;

    const updated = await this.memberRepo.save(
      this.memberRepo.create(
        MemberMapper.toPersistence({
          ...MemberMapper.toDomain(entity),
          ...payload,
        }),
      ),
    );
    return MemberMapper.toDomain(updated);
  }

  async remove(id: string): Promise<void> {
    await this.memberRepo.delete(id);
  }
}
