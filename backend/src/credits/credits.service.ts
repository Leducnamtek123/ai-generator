import { BadRequestException, Injectable } from '@nestjs/common';
import { CreditRepository } from './infrastructure/persistence/credit.repository';
import { IPaginationOptions } from '../utils/types/pagination-options';
import {
  CreditTransaction,
  CreditTransactionStatus,
} from './domain/credit-transaction';

type CreditCreateInput = Omit<
  CreditTransaction,
  'id' | 'createdAt'
> & {
  status?: CreditTransactionStatus;
};

type CreditReserveInput = {
  userId: string;
  amount: number;
  referenceType?: string;
  referenceId?: string;
  metadata?: any;
};

@Injectable()
export class CreditsService {
  constructor(private readonly creditRepository: CreditRepository) {}

  create(data: CreditCreateInput) {
    return this.creditRepository.create({
      ...data,
      status: data.status ?? 'posted',
    });
  }

  async reserve(data: CreditReserveInput) {
    const amount = Math.abs(data.amount);
    const balance = await this.getBalance(data.userId);
    if (balance < amount) {
      throw new BadRequestException('Insufficient credits');
    }

    return this.create({
      userId: data.userId,
      amount: -amount,
      type: 'generation',
      status: 'pending',
      referenceType: data.referenceType || 'generation',
      referenceId: data.referenceId,
      metadata: data.metadata,
    });
  }

  async capture(
    transactionId: string,
    userId: string,
  ): Promise<CreditTransaction> {
    const transaction = await this.creditRepository.updateStatus(
      transactionId,
      userId,
      'posted',
    );
    if (!transaction) {
      throw new BadRequestException('Credit reservation not found');
    }
    return transaction;
  }

  async release(
    transactionId: string,
    userId: string,
  ): Promise<CreditTransaction> {
    const transaction = await this.creditRepository.updateStatus(
      transactionId,
      userId,
      'reversed',
    );
    if (!transaction) {
      throw new BadRequestException('Credit reservation not found');
    }
    return transaction;
  }

  refund(data: {
    userId: string;
    amount: number;
    referenceType?: string;
    referenceId?: string;
    metadata?: any;
  }) {
    return this.create({
      userId: data.userId,
      amount: Math.abs(data.amount),
      type: 'refund',
      status: 'posted',
      referenceType: data.referenceType || 'refund',
      referenceId: data.referenceId,
      metadata: data.metadata,
    });
  }

  findAll(paginationOptions: IPaginationOptions, userId: string) {
    return this.creditRepository.findAllWithPagination(
      paginationOptions,
      userId,
    );
  }

  getBalance(userId: string) {
    return this.creditRepository.getBalance(userId);
  }
}
