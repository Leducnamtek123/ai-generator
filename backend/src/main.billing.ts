import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { BillingServiceModule } from './billing-service.module';
import { bootstrapHttpApp } from './bootstrap/http-bootstrap';

async function bootstrap() {
  const app = await NestFactory.create(BillingServiceModule);
  await bootstrapHttpApp(app, BillingServiceModule, {
    title: 'AI Generator Billing Service',
    description:
      'Billing service for payments, credits, balance, ledger and refunds',
    docsPath: 'docs',
    logLabel: 'Billing Service',
  });
}

void bootstrap();
