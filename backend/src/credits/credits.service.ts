import { Injectable } from '@nestjs/common';
import { CreditRepository } from './infrastructure/persistence/credit.repository';
import { IPaginationOptions } from '../utils/types/pagination-options';

@Injectable()
export class CreditsService {
  constructor(private readonly creditRepository: CreditRepository) {}

  create(data: {
    userId: string;
    amount: number;
    type: 'generation' | 'topup' | 'refund';
    metadata?: any;
  }) {
    return this.creditRepository.create(data as any);
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
