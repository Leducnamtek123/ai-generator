import { CreditTransaction } from '../../../../domain/credit-transaction';
import { CreditTransactionEntity } from '../entities/credit-transaction.entity';

export class CreditMapper {
  static toDomain(raw: CreditTransactionEntity): CreditTransaction {
    const domainEntity = new CreditTransaction();
    domainEntity.id = raw.id;
    domainEntity.userId = raw.userId;
    domainEntity.amount = raw.amount;
    domainEntity.type = raw.type;
    domainEntity.metadata = raw.metadata;
    domainEntity.createdAt = raw.createdAt;

    return domainEntity;
  }

  static toPersistence(
    domainEntity: CreditTransaction,
  ): CreditTransactionEntity {
    const persistenceEntity = new CreditTransactionEntity();
    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }
    persistenceEntity.userId = domainEntity.userId;
    persistenceEntity.amount = domainEntity.amount;
    persistenceEntity.type = domainEntity.type;
    persistenceEntity.metadata = domainEntity.metadata;
    persistenceEntity.createdAt = domainEntity.createdAt;

    return persistenceEntity;
  }
}
