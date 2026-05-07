import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BillingAccountsService } from '../billing-accounts/billing-accounts.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';

@ApiBearerAuth()
@ApiTags('Billing')
@Controller({ path: 'billing', version: '1' })
@UseGuards(AuthGuard('jwt'))
export class PersonalBillingController {
  constructor(
    private readonly billingAccountsService: BillingAccountsService,
  ) {}

  @Get('me')
  getMe(@CurrentUser() user: AuthenticatedUser) {
    const userId = String(user.id);
    return this.billingAccountsService.getSummary('user', userId);
  }
}
