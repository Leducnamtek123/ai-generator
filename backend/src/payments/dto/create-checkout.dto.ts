import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { PaymentProvider } from '../config/payments-config.type';

export class CreateCheckoutDto {
  @ApiProperty({
    enum: ['starter', 'pro', 'enterprise'],
    description: 'Credit package identifier',
  })
  @IsIn(['starter', 'pro', 'enterprise'])
  packageId: string;

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
