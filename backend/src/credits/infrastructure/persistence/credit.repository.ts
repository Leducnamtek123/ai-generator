import { CreditTransaction } from '../../domain/credit-transaction';
import { IPaginationOptions } from '../../../utils/types/pagination-options';

export abstract class CreditRepository {
  abstract create(
    data: Omit<CreditTransaction, 'id' | 'createdAt'>,
  ): Promise<CreditTransaction>;

  abstract findAllWithPagination(
    paginationOptions: IPaginationOptions,
    userId: string,
  ): Promise<CreditTransaction[]>;

  abstract getBalance(userId: string): Promise<number>;
}
