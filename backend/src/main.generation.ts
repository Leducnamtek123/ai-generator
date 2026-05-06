import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { GenerationServiceModule } from './generation-service.module';
import { bootstrapHttpApp } from './bootstrap/http-bootstrap';

async function bootstrap() {
  const app = await NestFactory.create(GenerationServiceModule);
  await bootstrapHttpApp(app, GenerationServiceModule, {
    title: 'AI Generator Generation Service',
    description:
      'Generation service for tasks, cost reservation and async processing',
    docsPath: 'docs',
    logLabel: 'Generation Service',
  });
}

void bootstrap();
