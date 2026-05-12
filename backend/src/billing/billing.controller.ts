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
@Controller({ path: 'workspaces/:workspaceSlug/billing', version: '1' })
@UseGuards(AuthGuard('jwt'))
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get()
  getBilling(@Request() req, @Param('workspaceSlug') workspaceSlug: string) {
    return this.billingService.getBilling(
      workspaceSlug,
      req.user.id,
      req.user.role,
    );
  }
}
