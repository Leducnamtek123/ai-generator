import { ClassSerializerInterceptor, INestApplication, Logger, Type, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Reflector } from '@nestjs/core';
import { json, urlencoded } from 'express';
import helmet from 'helmet';
import compression from 'compression';
import { useContainer } from 'class-validator';
import { HttpAdapterHost } from '@nestjs/core';
import { AllConfigType } from '../config/config.type';
import validationOptions from '../utils/validation-options';
import { ResolvePromisesInterceptor } from '../utils/serializer.interceptor';
import { AllExceptionsFilter } from '../utils/filters/all-exceptions.filter';

export interface HttpBootstrapOptions {
  title: string;
  description: string;
  docsPath?: string;
  logLabel?: string;
}

export async function bootstrapHttpApp(
  app: INestApplication,
  rootModule: Type<unknown>,
  options: HttpBootstrapOptions,
) {
  useContainer(app.select(rootModule), { fallbackOnErrors: true });
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

  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  app.useGlobalInterceptors(
    new ResolvePromisesInterceptor(),
    new ClassSerializerInterceptor(app.get(Reflector)),
  );

  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter({ httpAdapter } as any));

  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle(options.title)
      .setDescription(options.description)
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
      .build(),
  );
  SwaggerModule.setup(options.docsPath || 'docs', app, document);

  const port = configService.getOrThrow('app.port', { infer: true });
  await app.listen(port);
  Logger.log(
    `${options.logLabel || options.title} running on http://localhost:${port}/${configService.getOrThrow('app.apiPrefix', { infer: true })}/v1`,
  );
}
