import { CreditTransaction } from '../../domain/credit-transaction';
import { IPaginationOptions } from '../../../utils/types/pagination-options';
import { CreditTransactionStatus } from '../../domain/credit-transaction';

export abstract class CreditRepository {
  abstract create(
    data: Omit<CreditTransaction, 'id' | 'createdAt'>,
  ): Promise<CreditTransaction>;

  abstract updateStatus(
    transactionId: string,
    userId: string,
    status: CreditTransactionStatus,
  ): Promise<CreditTransaction | null>;

  abstract findById(
    transactionId: string,
    userId: string,
  ): Promise<CreditTransaction | null>;

  abstract findAllWithPagination(
    paginationOptions: IPaginationOptions,
    userId: string,
  ): Promise<CreditTransaction[]>;

  abstract getBalance(userId: string): Promise<number>;
}
