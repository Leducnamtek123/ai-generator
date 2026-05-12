import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { PaymentProvider } from '../config/payments-config.type';
import { BillingPlanType } from '../../billing/config/billing-catalog';

export class CreateCheckoutDto {
  @ApiPropertyOptional({
    enum: ['subscription', 'topup'],
    default: 'topup',
    description: 'Purchase type',
  })
  @IsOptional()
  @IsIn(['subscription', 'topup'])
  purchaseType?: 'subscription' | 'topup';

  @ApiPropertyOptional({
    enum: ['trial', 'starter', 'pro', 'team', 'enterprise'],
    description: 'Subscription plan identifier',
  })
  @IsOptional()
  @IsIn(['trial', 'starter', 'pro', 'team', 'enterprise'])
  planId?: BillingPlanType;

  @ApiPropertyOptional({
    enum: ['starter', 'pro', 'enterprise'],
    description: 'Top-up package identifier',
  })
  @IsOptional()
  @IsIn(['starter', 'pro', 'enterprise'])
  topUpPackageId?: string;

  @ApiPropertyOptional({
    description: 'Legacy top-up package identifier',
  })
  @IsOptional()
  @IsString()
  packageId?: string;

  @ApiPropertyOptional({
    enum: ['user', 'workspace'],
    default: 'user',
    description: 'Billing scope type',
  })
  @IsOptional()
  @IsIn(['user', 'workspace'])
  scopeType?: 'user' | 'workspace';

  @ApiPropertyOptional({
    description: 'Billing scope identifier. Defaults to the current user.',
  })
  @IsOptional()
  @IsString()
  scopeId?: string;

  @ApiPropertyOptional({
    enum: ['vnpay', 'momo', 'zalopay', '9pay'],
    default: 'vnpay',
  })
  @IsOptional()
  @IsIn(['vnpay', 'momo', 'zalopay', '9pay'])
  provider?: PaymentProvider;

  @ApiPropertyOptional({
    description: 'Optional custom return URI (for mobile deep links).',
  })
  @IsOptional()
  @IsString()
  returnUri?: string;
}
