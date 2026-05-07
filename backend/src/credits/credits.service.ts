import { BadRequestException, Injectable } from '@nestjs/common';
import { CreditRepository } from './infrastructure/persistence/credit.repository';
import { IPaginationOptions } from '../utils/types/pagination-options';
import {
  CreditTransaction,
  CreditTransactionStatus,
} from './domain/credit-transaction';
import {
  BillingAccountsService,
  BillingAllocation,
} from '../billing-accounts/billing-accounts.service';
import { BillingAccountScopeType } from '../billing-accounts/infrastructure/persistence/relational/entities/billing-account.entity';

type CreditCreateInput = Omit<
  CreditTransaction,
  'id' | 'createdAt'
> & {
  status?: CreditTransactionStatus;
};

type CreditReserveInput = {
  userId: string;
  amount: number;
  scopeType?: BillingAccountScopeType;
  scopeId?: string;
  referenceType?: string;
  referenceId?: string;
  metadata?: any;
};

@Injectable()
export class CreditsService {
  constructor(
    private readonly creditRepository: CreditRepository,
    private readonly billingAccountsService: BillingAccountsService,
  ) {}

  create(data: CreditCreateInput) {
    return this.creditRepository.create({
      ...data,
      scopeType: data.scopeType || 'user',
      scopeId: data.scopeId || data.userId,
      status: data.status ?? 'posted',
    });
  }

  async reserve(data: CreditReserveInput) {
    const amount = Math.abs(data.amount);
    const scopeType = data.scopeType || 'user';
    const scopeId = data.scopeId || data.userId;
    await this.ensureLegacyWalletSeeded(data.userId, scopeType, scopeId);
    const allocation = await this.billingAccountsService.allocateCredits({
      scopeType,
      scopeId,
      amount,
    });

    return this.create({
      userId: data.userId,
      scopeType,
      scopeId,
      amount: -amount,
      type: 'generation',
      status: 'pending',
      referenceType: data.referenceType || 'generation',
      referenceId: data.referenceId,
      metadata: {
        ...(data.metadata || {}),
        allocation,
        scopeType,
        scopeId,
      },
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
    const storedTransaction = await this.creditRepository.findById(
      transactionId,
      userId,
    );
    if (!storedTransaction) {
      throw new BadRequestException('Credit reservation not found');
    }
    if (storedTransaction.status === 'reversed') {
      return storedTransaction;
    }
    const allocation = this.extractAllocation(
      storedTransaction.metadata,
      Math.abs(storedTransaction.amount),
    );
    await this.billingAccountsService.restoreCredits({
      scopeType: storedTransaction.scopeType || 'user',
      scopeId: storedTransaction.scopeId || storedTransaction.userId,
      allocation,
    });

    const updatedTransaction = await this.creditRepository.updateStatus(
      transactionId,
      userId,
      'reversed',
    );
    if (!updatedTransaction) {
      throw new BadRequestException('Credit reservation not found');
    }
    return updatedTransaction;
  }

  async refund(data: {
    userId: string;
    amount: number;
    scopeType?: BillingAccountScopeType;
    scopeId?: string;
    referenceType?: string;
    referenceId?: string;
    metadata?: any;
  }) {
    const scopeType = data.scopeType || 'user';
    const scopeId = data.scopeId || data.userId;
    await this.billingAccountsService.addRefundCredits({
      scopeType,
      scopeId,
      amount: Math.abs(data.amount),
      metadata: data.metadata,
    });

    return this.create({
      userId: data.userId,
      scopeType,
      scopeId,
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
    return this.ensureLegacyWalletSeeded(userId, 'user', userId).then(() =>
      this.billingAccountsService
        .getSummary('user', userId)
        .then((summary) => summary.totalCredits),
    );
  }

  async grantSubscriptionCredits(data: {
    userId: string;
    scopeType?: BillingAccountScopeType;
    scopeId?: string;
    planId: string;
    credits: number;
    renewalAt?: Date | null;
    referenceType?: string;
    referenceId?: string;
    metadata?: Record<string, unknown>;
  }) {
    const scopeType = data.scopeType || 'user';
    const scopeId = data.scopeId || data.userId;
    await this.billingAccountsService.grantSubscriptionCredits({
      scopeType,
      scopeId,
      planId: data.planId as any,
      credits: data.credits,
      renewalAt: data.renewalAt ?? null,
      metadata: data.metadata || null,
    });

    return this.create({
      userId: data.userId,
      scopeType,
      scopeId,
      amount: Math.abs(data.credits),
      type: 'grant',
      status: 'posted',
      referenceType: data.referenceType || 'subscription',
      referenceId: data.referenceId,
      metadata: {
        ...(data.metadata || {}),
        planId: data.planId,
      },
    });
  }

  async addTopUpCredits(data: {
    userId: string;
    scopeType?: BillingAccountScopeType;
    scopeId?: string;
    amount: number;
    referenceType?: string;
    referenceId?: string;
    metadata?: Record<string, unknown>;
  }) {
    const scopeType = data.scopeType || 'user';
    const scopeId = data.scopeId || data.userId;
    await this.billingAccountsService.grantTopUpCredits({
      scopeType,
      scopeId,
      credits: Math.abs(data.amount),
      metadata: data.metadata || null,
    });

    return this.create({
      userId: data.userId,
      scopeType,
      scopeId,
      amount: Math.abs(data.amount),
      type: 'topup',
      status: 'posted',
      referenceType: data.referenceType || 'topup',
      referenceId: data.referenceId,
      metadata: data.metadata,
    });
  }

  private extractAllocation(
    metadata: any,
    amount: number,
  ): BillingAllocation {
    const allocation = metadata?.allocation as BillingAllocation | undefined;
    if (allocation) {
      return {
        includedCredits: Math.abs(allocation.includedCredits || 0),
        topUpCredits: Math.abs(allocation.topUpCredits || 0),
      };
    }

    return {
      includedCredits: 0,
      topUpCredits: Math.abs(amount),
    };
  }

  private async ensureLegacyWalletSeeded(
    userId: string,
    scopeType: BillingAccountScopeType,
    scopeId: string,
  ) {
    const summary = await this.billingAccountsService.getSummary(
      scopeType,
      scopeId,
    );
    if (summary.totalCredits > 0) {
      return;
    }

    const legacyBalance = await this.creditRepository.getBalance(userId);
    if (legacyBalance <= 0) {
      return;
    }

    await this.billingAccountsService.grantTopUpCredits({
      scopeType,
      scopeId,
      credits: legacyBalance,
      metadata: {
        seededFromLegacyLedger: true,
        legacyBalance,
      },
    });
  }
}
