import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreditTransactionEntity } from '../entities/credit-transaction.entity';
import { CreditRepository } from '../../credit.repository';
import { CreditTransaction } from '../../../../domain/credit-transaction';
import { CreditMapper } from '../mappers/credit.mapper';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';

@Injectable()
export class CreditRelationalRepository implements CreditRepository {
  constructor(
    @InjectRepository(CreditTransactionEntity)
    private readonly creditRepository: Repository<CreditTransactionEntity>,
  ) {}

  async create(data: CreditTransaction): Promise<CreditTransaction> {
    const persistenceModel = CreditMapper.toPersistence(data);
    const newEntity = await this.creditRepository.save(
      this.creditRepository.create(persistenceModel),
    );
    return CreditMapper.toDomain(newEntity);
  }

  async findAllWithPagination(
    paginationOptions: IPaginationOptions,
    userId: string,
  ): Promise<CreditTransaction[]> {
    const entities = await this.creditRepository.find({
      skip: (paginationOptions.page - 1) * paginationOptions.limit,
      take: paginationOptions.limit,
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return entities.map((entity) => CreditMapper.toDomain(entity));
  }

  async getBalance(userId: string): Promise<number> {
    const { total } = await this.creditRepository
      .createQueryBuilder('credit')
      .select('SUM(credit.amount)', 'total')
      .where('credit.userId = :userId', { userId })
      .getRawOne();

    return Number(total) || 0;
  }
}
