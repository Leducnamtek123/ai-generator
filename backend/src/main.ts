import 'dotenv/config';
import { json, urlencoded } from 'express';
import {
  ClassSerializerInterceptor,
  ValidationPipe,
  VersioningType,
  Logger,
} from '@nestjs/common';
import helmet from 'helmet';
import compression from 'compression';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { useContainer } from 'class-validator';
import { AppModule } from './app.module';
import validationOptions from './utils/validation-options';
import { AllConfigType } from './config/config.type';
import { ResolvePromisesInterceptor } from './utils/serializer.interceptor';
import { AllExceptionsFilter } from './utils/filters/all-exceptions.filter';
import { HttpAdapterHost } from '@nestjs/core';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  const configService = app.get(ConfigService<AllConfigType>);

  app.enableCors({
    origin: configService.get('app.frontendDomain', { infer: true }) || '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
 
  app.use(helmet());
  app.use(compression());

  app.enableShutdownHooks();
  app.setGlobalPrefix(
    configService.getOrThrow('app.apiPrefix', { infer: true }),
    {
      exclude: ['/'],
    },
  );
  app.enableVersioning({
    type: VersioningType.URI,
  });
  app.useGlobalPipes(new ValidationPipe(validationOptions));

  // Increase body limit
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  app.useGlobalInterceptors(
    // ResolvePromisesInterceptor is used to resolve promises in responses because class-transformer can't do it
    // https://github.com/typestack/class-transformer/issues/549
    new ResolvePromisesInterceptor(),
    new ClassSerializerInterceptor(app.get(Reflector)),
  );

  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter({ httpAdapter } as any));

  const options = new DocumentBuilder()
    .setTitle('AI Generator API')
    .setDescription('AI Generator - Image, Video, Audio & Workflow Generation Platform')
    .setVersion('1.0')
    .addBearerAuth()
    .addGlobalParameters({
      in: 'header',
      required: false,
      name: process.env.APP_HEADER_LANGUAGE || 'x-custom-lang',
      schema: {
        example: 'en',
      },
    })
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('docs', app, document);
 
  const port = configService.getOrThrow('app.port', { infer: true });
  const appMode = configService.get('app.nodeEnv', { infer: true }); // Or use a specific APP_MODE
 
  // If we are in worker mode, we might not want to listen on a port,
  // or listen on a different port for health checks.
  // For now, let's just log the mode.
  if (process.env.APP_MODE === 'worker') {
    Logger.log('👷 Worker Mode enabled - Processing background jobs...');
    // In many setups, workers don't need a port, but for health checks we might still keep it.
    await app.listen(port); 
  } else {
    await app.listen(port);
    Logger.log(`🚀 API Mode enabled - Running on: http://localhost:${port}/${configService.getOrThrow('app.apiPrefix', { infer: true })}/v1`);
  }
}
void bootstrap();
