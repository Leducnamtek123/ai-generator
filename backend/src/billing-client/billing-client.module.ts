import { Module } from '@nestjs/common';
import { BillingCreditsClientService } from './billing-credits-client.service';

@Module({
  providers: [BillingCreditsClientService],
  exports: [BillingCreditsClientService],
})
export class BillingClientModule {}
