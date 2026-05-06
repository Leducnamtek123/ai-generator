import { CreditTransaction } from '../../../../domain/credit-transaction';
import { CreditTransactionEntity } from '../entities/credit-transaction.entity';

type CreditPersistenceInput = Omit<
  CreditTransaction,
  'id' | 'createdAt'
> &
  Partial<Pick<CreditTransaction, 'id' | 'createdAt'>>;

export class CreditMapper {
  static toDomain(raw: CreditTransactionEntity): CreditTransaction {
    const domainEntity = new CreditTransaction();
    domainEntity.id = raw.id;
    domainEntity.userId = raw.userId;
    domainEntity.amount = raw.amount;
    domainEntity.type = raw.type;
    domainEntity.status = raw.status;
    domainEntity.referenceType = raw.referenceType;
    domainEntity.referenceId = raw.referenceId;
    domainEntity.metadata = raw.metadata;
    domainEntity.createdAt = raw.createdAt;

    return domainEntity;
  }

  static toPersistence(
    domainEntity: CreditPersistenceInput,
  ): CreditTransactionEntity {
    const persistenceEntity = new CreditTransactionEntity();
    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }
    persistenceEntity.userId = domainEntity.userId;
    persistenceEntity.amount = domainEntity.amount;
    persistenceEntity.type = domainEntity.type;
    persistenceEntity.status = domainEntity.status ?? 'posted';
    persistenceEntity.referenceType = domainEntity.referenceType;
    persistenceEntity.referenceId = domainEntity.referenceId;
    persistenceEntity.metadata = domainEntity.metadata;
    if (domainEntity.createdAt) {
      persistenceEntity.createdAt = domainEntity.createdAt;
    }

    return persistenceEntity;
  }
}
