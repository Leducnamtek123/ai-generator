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
    await this.creditsService.create({
      userId: req.user.id,
      amount: dto.amount,
      type: 'topup',
      metadata: { paymentRef: dto.paymentRef || 'manual' },
    });
    const newBalance = await this.creditsService.getBalance(req.user.id);
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
}
