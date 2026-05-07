import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { bootstrapHttpApp } from './bootstrap/http-bootstrap';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  await bootstrapHttpApp(app, AppModule, {
    title: 'AI Generator API',
    description:
      'AI Generator - Image, Video, Audio & Workflow Generation Platform',
    docsPath: 'docs',
    logLabel: 'API',
    configureDocumentBuilder: (builder: DocumentBuilder) =>
      builder.addApiKey(
        { type: 'apiKey', name: 'X-API-KEY', in: 'header' },
        'api-key',
      ),
  });
}

void bootstrap();
