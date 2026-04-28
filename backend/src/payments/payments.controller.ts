import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '../config/config.type';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { PaymentProvider } from './config/payments-config.type';
import { PaymentsService } from './payments.service';

@ApiTags('Payments')
@Controller({ path: 'payments', version: '1' })
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly configService: ConfigService<AllConfigType>,
  ) {}

  @Post('checkout')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create payment checkout session for credit topup' })
  @ApiResponse({ status: 201, description: 'Checkout URL created' })
  createCheckout(@Body() dto: CreateCheckoutDto, @Request() req: any) {
    return this.paymentsService.createCheckout(req.user.id, dto);
  }

  @Get('status/:orderCode')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment order status' })
  getStatus(@Param('orderCode') orderCode: string, @Request() req: any) {
    return this.paymentsService.getOrder(orderCode, req.user.id);
  }

  @Get('return/:provider')
  @ApiOperation({ summary: 'Gateway return URL callback' })
  async handleReturn(
    @Param('provider') provider: PaymentProvider,
    @Query() query: Record<string, string | string[]>,
    @Res() res: Response,
  ) {
    const result = await this.paymentsService.handleReturn(provider, query);
    const frontendDomain = this.configService.getOrThrow('app.frontendDomain', {
      infer: true,
    });
    const returnPath = this.configService.getOrThrow('payments.returnPath', {
      infer: true,
    });
    const redirectUrl = new URL(returnPath, frontendDomain);
    redirectUrl.searchParams.set('paymentProvider', provider);
    redirectUrl.searchParams.set('paymentOrder', result.orderCode);
    redirectUrl.searchParams.set('paymentStatus', result.status);
    redirectUrl.searchParams.set('paymentVerified', String(result.verified));
    return res.redirect(redirectUrl.toString());
  }

  @Post('ipn/:provider')
  @ApiOperation({ summary: 'Gateway instant payment notification callback' })
  handleIpn(
    @Param('provider') provider: PaymentProvider,
    @Body() body: Record<string, string | string[]>,
    @Query() query: Record<string, string | string[]>,
  ) {
    return this.paymentsService.handleIpn(provider, { ...query, ...body });
  }

  @Get('ipn/:provider')
  @ApiOperation({
    summary: 'Gateway instant payment notification callback (GET)',
  })
  handleIpnGet(
    @Param('provider') provider: PaymentProvider,
    @Query() query: Record<string, string | string[]>,
  ) {
    return this.paymentsService.handleIpn(provider, query);
  }
}
