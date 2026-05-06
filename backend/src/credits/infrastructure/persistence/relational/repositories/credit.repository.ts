import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreditTransactionEntity } from '../entities/credit-transaction.entity';
import { CreditRepository } from '../../credit.repository';
import {
  CreditTransaction,
  CreditTransactionStatus,
} from '../../../../domain/credit-transaction';
import { CreditMapper } from '../mappers/credit.mapper';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';

@Injectable()
export class CreditRelationalRepository implements CreditRepository {
  constructor(
    @InjectRepository(CreditTransactionEntity)
    private readonly creditRepository: Repository<CreditTransactionEntity>,
  ) {}

  async create(
    data: Omit<CreditTransaction, 'id' | 'createdAt'>,
  ): Promise<CreditTransaction> {
    const persistenceModel = CreditMapper.toPersistence(data);
    const newEntity = await this.creditRepository.save(
      this.creditRepository.create(persistenceModel),
    );
    return CreditMapper.toDomain(newEntity);
  }

  async updateStatus(
    transactionId: string,
    userId: string,
    status: CreditTransactionStatus,
  ): Promise<CreditTransaction | null> {
    const entity = await this.creditRepository.findOne({
      where: {
        id: transactionId,
        userId,
      },
    });

    if (!entity) {
      return null;
    }

    if (entity.status === status) {
      return CreditMapper.toDomain(entity);
    }

    if (entity.status === 'posted' && status === 'reversed') {
      throw new BadRequestException(
        'Posted credit transactions cannot be reversed',
      );
    }

    if (entity.status === 'reversed' && status === 'posted') {
      throw new BadRequestException(
        'Reversed credit transactions cannot be posted again',
      );
    }

    entity.status = status;
    const savedEntity = await this.creditRepository.save(entity);
    return CreditMapper.toDomain(savedEntity);
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
      .select('COALESCE(SUM(credit.amount), 0)', 'total')
      .where('credit.userId = :userId', { userId })
      .andWhere('credit.status != :reversed', { reversed: 'reversed' })
      .getRawOne();

    return Number(total) || 0;
  }
}
