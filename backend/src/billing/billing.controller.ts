import {
  Controller,
  Get,
  Param,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BillingService } from './billing.service';

@ApiBearerAuth()
@ApiTags('Billing')
@Controller({ path: 'orgs/:orgSlug/billing', version: '1' })
@UseGuards(AuthGuard('jwt'))
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get()
  getBilling(@Request() req, @Param('orgSlug') orgSlug: string) {
    return this.billingService.getBilling(orgSlug, req.user.id);
  }
}
