import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiKeyEntity } from '../entities/api-key.entity';
import { ApiKeyRepository } from '../../api-key.repository';
import { ApiKey } from '../../../../domain/api-key';
import { ApiKeyMapper } from '../mappers/api-key.mapper';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { User } from '../../../../../users/domain/user';

@Injectable()
export class ApiKeyRelationalRepository implements ApiKeyRepository {
  constructor(
    @InjectRepository(ApiKeyEntity)
    private readonly apiKeysRepository: Repository<ApiKeyEntity>,
  ) {}

  async create(data: ApiKey): Promise<ApiKey> {
    const persistenceModel = ApiKeyMapper.toPersistence(data);
    const newEntity = await this.apiKeysRepository.save(
      this.apiKeysRepository.create(persistenceModel),
    );
    return ApiKeyMapper.toDomain(newEntity);
  }

  async findAll(fields: Partial<ApiKey>): Promise<ApiKey[]> {
    const entities = await this.apiKeysRepository.find({
      where: fields as any,
      relations: ['user'],
    });

    return entities.map((entity) => ApiKeyMapper.toDomain(entity));
  }

  async findAllByUserId(userId: User['id']): Promise<ApiKey[]> {
    const normalizedUserId = Number(userId);
    const entities = await this.apiKeysRepository.find({
      where: { user: { id: normalizedUserId } },
      relations: ['user'],
    });

    return entities.map((entity) => ApiKeyMapper.toDomain(entity));
  }

  async findOneByIdAndUserId(
    id: ApiKey['id'],
    userId: User['id'],
  ): Promise<NullableType<ApiKey>> {
    const normalizedUserId = Number(userId);
    const entity = await this.apiKeysRepository.findOne({
      where: { id, user: { id: normalizedUserId } },
      relations: ['user'],
    });

    return entity ? ApiKeyMapper.toDomain(entity) : null;
  }

  async findOne(fields: Partial<ApiKey>): Promise<NullableType<ApiKey>> {
    const entity = await this.apiKeysRepository.findOne({
      where: fields as any,
      relations: ['user'],
    });

    return entity ? ApiKeyMapper.toDomain(entity) : null;
  }

  async update(
    id: ApiKey['id'],
    payload: Partial<ApiKey>,
  ): Promise<ApiKey | null> {
    const entity = await this.apiKeysRepository.findOne({
      where: { id },
    });

    if (!entity) {
      return null;
    }

    const updatedEntity = await this.apiKeysRepository.save(
      this.apiKeysRepository.create(
        ApiKeyMapper.toPersistence({
          ...ApiKeyMapper.toDomain(entity),
          ...payload,
        }),
      ),
    );

    return ApiKeyMapper.toDomain(updatedEntity);
  }

  async softDelete(id: ApiKey['id']): Promise<void> {
    await this.apiKeysRepository.softDelete(id);
  }
}
