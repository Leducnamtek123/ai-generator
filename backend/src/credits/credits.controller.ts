import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { CreditsService } from './credits.service';

class TopUpCreditsDto {
  @ApiProperty({ description: 'Number of credits to add', minimum: 1 })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiPropertyOptional({ description: 'Payment reference or method', default: 'manual' })
  @IsOptional()
  @IsString()
  paymentRef?: string;
}

class CreditReserveDto {
  @ApiProperty({ description: 'User ID that owns the balance' })
  @IsString()
  userId: string;

  @ApiPropertyOptional({ description: 'Billing scope type', enum: ['user', 'organization'] })
  @IsOptional()
  @IsString()
  scopeType?: 'user' | 'organization';

  @ApiPropertyOptional({ description: 'Billing scope identifier' })
  @IsOptional()
  @IsString()
  scopeId?: string;

  @ApiProperty({ description: 'Amount of credits to mutate', minimum: 1 })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiPropertyOptional({ description: 'Optional metadata for audit' })
  @IsOptional()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'External reference type' })
  @IsOptional()
  @IsString()
  referenceType?: string;

  @ApiPropertyOptional({ description: 'External reference ID' })
  @IsOptional()
  @IsString()
  referenceId?: string;
}

class CreditCaptureDto {
  @ApiProperty({ description: 'User ID that owns the balance' })
  @IsString()
  userId: string;

  @ApiProperty({ description: 'Reserved transaction ID' })
  @IsString()
  transactionId: string;
}

class CreditReleaseDto {
  @ApiProperty({ description: 'User ID that owns the balance' })
  @IsString()
  userId: string;

  @ApiProperty({ description: 'Reserved transaction ID' })
  @IsString()
  transactionId: string;
}

@ApiTags('Credits')
@Controller({ path: 'credits', version: '1' })
export class CreditsController {
  constructor(private readonly creditsService: CreditsService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  create(@Body() createCreditDto: any, @Request() req: any) {
    return this.creditsService.create({
      ...createCreditDto,
      userId: req.user.id,
    });
  }

  @Post('topup')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add credits to your account' })
  @ApiResponse({ status: 201, description: 'Credits added successfully' })
  async topUp(@Body() dto: TopUpCreditsDto, @Request() req: any) {
    await this.creditsService.addTopUpCredits({
      userId: req.user.id,
      amount: dto.amount,
      referenceType: 'manual_topup',
      referenceId: dto.paymentRef || 'manual',
      metadata: { paymentRef: dto.paymentRef || 'manual' },
    });
    const newBalance = await this.creditsService.getBalance(String(req.user.id));
    return {
      success: true,
      added: dto.amount,
      balance: newBalance,
    };
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get credit transaction history' })
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Request() req: any,
  ) {
    return this.creditsService.findAll({ page, limit }, req.user.id);
  }

  @Get('balance')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current credit balance' })
  @ApiResponse({ status: 200, description: 'Returns the balance as a number' })
  getBalance(@Request() req: any) {
    return this.creditsService.getBalance(req.user.id);
  }

  @Post('deduct')
  @ApiOperation({ summary: 'Deduct credits for generation or workflow usage' })
  async deduct(@Body() dto: CreditReserveDto) {
    await this.creditsService.reserve({
      userId: dto.userId,
      amount: dto.amount,
      scopeType: dto.scopeType,
      scopeId: dto.scopeId,
      referenceType: dto.referenceType,
      referenceId: dto.referenceId,
      metadata: dto.metadata,
    });

    const balance = await this.creditsService.getBalance(dto.userId);
    return {
      success: true,
      amount: dto.amount,
      balance,
    };
  }

  @Post('refund')
  @ApiOperation({ summary: 'Refund credits after a failed generation' })
  async refund(@Body() dto: CreditReserveDto) {
    await this.creditsService.refund({
      userId: dto.userId,
      amount: dto.amount,
      scopeType: dto.scopeType,
      scopeId: dto.scopeId,
      referenceType: dto.referenceType,
      referenceId: dto.referenceId,
      metadata: dto.metadata,
    });

    const balance = await this.creditsService.getBalance(dto.userId);
    return {
      success: true,
      amount: dto.amount,
      balance,
    };
  }

  @Post('reserve')
  @ApiOperation({ summary: 'Reserve credits before running a generation' })
  async reserve(@Body() dto: CreditReserveDto) {
    const reservation = await this.creditsService.reserve({
      userId: dto.userId,
      amount: dto.amount,
      scopeType: dto.scopeType,
      scopeId: dto.scopeId,
      referenceType: dto.referenceType,
      referenceId: dto.referenceId,
      metadata: dto.metadata,
    });

    const balance = await this.creditsService.getBalance(dto.userId);
    return {
      success: true,
      amount: Math.abs(reservation.amount),
      balance,
      transactionId: reservation.id,
      status: reservation.status,
    };
  }

  @Post('capture')
  @ApiOperation({ summary: 'Confirm a reserved credit transaction' })
  async capture(@Body() dto: CreditCaptureDto) {
    await this.creditsService.capture(dto.transactionId, dto.userId);
    const balance = await this.creditsService.getBalance(dto.userId);
    return {
      success: true,
      transactionId: dto.transactionId,
      balance,
    };
  }

  @Post('release')
  @ApiOperation({ summary: 'Release a reserved credit transaction' })
  async release(@Body() dto: CreditReleaseDto) {
    await this.creditsService.release(dto.transactionId, dto.userId);
    const balance = await this.creditsService.getBalance(dto.userId);
    return {
      success: true,
      transactionId: dto.transactionId,
      balance,
    };
  }
}
