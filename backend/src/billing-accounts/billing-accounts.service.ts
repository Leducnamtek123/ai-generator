import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  BILLING_PLAN_CATALOG,
  BILLING_PLAN_BY_ID,
} from '../billing/config/billing-catalog';
import {
  BillingAccountEntity,
  BillingAccountScopeType,
  BillingAccountStatus,
  BillingPlanType,
} from './infrastructure/persistence/relational/entities/billing-account.entity';

export type BillingAllocation = {
  includedCredits: number;
  topUpCredits: number;
};

export type BillingSummary = {
  scopeType: BillingAccountScopeType;
  scopeId: string;
  plan: (typeof BILLING_PLAN_CATALOG)[number] | null;
  status: BillingAccountStatus;
  includedCreditsGranted: number;
  includedCreditsRemaining: number;
  topUpCreditsPurchased: number;
  topUpCreditsBalance: number;
  totalCredits: number;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  renewalAt: Date | null;
  metadata: Record<string, unknown> | null;
};

@Injectable()
export class BillingAccountsService {
  constructor(
    @InjectRepository(BillingAccountEntity)
    private readonly billingAccountRepository: Repository<BillingAccountEntity>,
  ) {}

  async getOrCreate(scopeType: BillingAccountScopeType, scopeId: string) {
    let account = await this.billingAccountRepository.findOne({
      where: { scopeType, scopeId },
    });

    if (!account) {
      account = this.billingAccountRepository.create({
        scopeType,
        scopeId,
        status: 'free',
        currentPlanId: null,
        includedCreditsGranted: 0,
        includedCreditsRemaining: 0,
        topUpCreditsPurchased: 0,
        topUpCreditsBalance: 0,
        currentPeriodStart: null,
        currentPeriodEnd: null,
        renewalAt: null,
        metadata: null,
      });
      account = await this.billingAccountRepository.save(account);
    }

    return account;
  }

  async getSummary(
    scopeType: BillingAccountScopeType,
    scopeId: string,
  ): Promise<BillingSummary> {
    const account = await this.getOrCreate(scopeType, scopeId);
const plan = account.currentPlanId
      ? BILLING_PLAN_BY_ID[account.currentPlanId as BillingPlanType] ?? null
      : null;

    return {
      scopeType: account.scopeType,
      scopeId: account.scopeId,
      plan,
      status: account.status,
      includedCreditsGranted: account.includedCreditsGranted,
      includedCreditsRemaining: account.includedCreditsRemaining,
      topUpCreditsPurchased: account.topUpCreditsPurchased,
      topUpCreditsBalance: account.topUpCreditsBalance,
      totalCredits: account.includedCreditsRemaining + account.topUpCreditsBalance,
      currentPeriodStart: account.currentPeriodStart,
      currentPeriodEnd: account.currentPeriodEnd,
      renewalAt: account.renewalAt,
      metadata: account.metadata,
    };
  }

  async grantSubscriptionCredits(data: {
    scopeType: BillingAccountScopeType;
    scopeId: string;
    planId: BillingPlanType;
    credits: number;
    renewalAt?: Date | null;
    periodStart?: Date | null;
    periodEnd?: Date | null;
    metadata?: Record<string, unknown> | null;
  }) {
    const account = await this.getOrCreate(data.scopeType, data.scopeId);
    account.currentPlanId = data.planId;
    account.status = data.planId === 'trial' ? 'trialing' : 'active';
    account.includedCreditsGranted = data.credits;
    account.includedCreditsRemaining = data.credits;
    account.currentPeriodStart = data.periodStart ?? new Date();
    account.currentPeriodEnd = data.periodEnd ?? data.renewalAt ?? null;
    account.renewalAt = data.renewalAt ?? data.periodEnd ?? null;
    account.metadata = {
      ...(account.metadata || {}),
      ...(data.metadata || {}),
      lastGrantType: 'subscription',
    };
    return this.billingAccountRepository.save(account);
  }

  async grantTopUpCredits(data: {
    scopeType: BillingAccountScopeType;
    scopeId: string;
    credits: number;
    metadata?: Record<string, unknown> | null;
  }) {
    const account = await this.getOrCreate(data.scopeType, data.scopeId);
    account.topUpCreditsPurchased += data.credits;
    account.topUpCreditsBalance += data.credits;
    account.metadata = {
      ...(account.metadata || {}),
      ...(data.metadata || {}),
      lastGrantType: 'topup',
    };
    return this.billingAccountRepository.save(account);
  }

  async allocateCredits(data: {
    scopeType: BillingAccountScopeType;
    scopeId: string;
    amount: number;
  }): Promise<BillingAllocation> {
    const account = await this.getOrCreate(data.scopeType, data.scopeId);
    const amount = Math.abs(data.amount);
    const totalAvailable =
      account.includedCreditsRemaining + account.topUpCreditsBalance;

    if (totalAvailable < amount) {
      throw new BadRequestException('Insufficient credits');
    }

    const includedCredits = Math.min(account.includedCreditsRemaining, amount);
    const topUpCredits = amount - includedCredits;

    account.includedCreditsRemaining -= includedCredits;
    account.topUpCreditsBalance -= topUpCredits;
    account.metadata = {
      ...(account.metadata || {}),
      lastAllocationAt: new Date().toISOString(),
    };
    await this.billingAccountRepository.save(account);

    return { includedCredits, topUpCredits };
  }

  async restoreCredits(data: {
    scopeType: BillingAccountScopeType;
    scopeId: string;
    allocation: BillingAllocation;
  }) {
    const account = await this.getOrCreate(data.scopeType, data.scopeId);
    account.includedCreditsRemaining += data.allocation.includedCredits;
    account.topUpCreditsBalance += data.allocation.topUpCredits;
    account.metadata = {
      ...(account.metadata || {}),
      lastRestoreAt: new Date().toISOString(),
    };
    return this.billingAccountRepository.save(account);
  }

  async addRefundCredits(data: {
    scopeType: BillingAccountScopeType;
    scopeId: string;
    amount: number;
    metadata?: Record<string, unknown> | null;
  }) {
    const account = await this.getOrCreate(data.scopeType, data.scopeId);
    account.topUpCreditsBalance += Math.abs(data.amount);
    account.topUpCreditsPurchased += Math.abs(data.amount);
    account.metadata = {
      ...(account.metadata || {}),
      ...(data.metadata || {}),
      lastRefundAt: new Date().toISOString(),
    };
    return this.billingAccountRepository.save(account);
  }
}
