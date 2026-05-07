import {
  ClassSerializerInterceptor,
  INestApplication,
  Logger,
  Type,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
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
import { attachRequestId, buildCorsOptions, createRequestLogger } from './security';
import type { Request, Response } from 'express';

function captureRawBody(
  req: Request & { rawBody?: Buffer },
  _res: Response,
  buf: Buffer,
) {
  req.rawBody = Buffer.from(buf);
}

export interface HttpBootstrapOptions {
  title: string;
  description: string;
  docsPath?: string;
  logLabel?: string;
  configureDocumentBuilder?: (builder: DocumentBuilder) => DocumentBuilder;
}

export async function bootstrapHttpApp(
  app: INestApplication,
  rootModule: Type<unknown>,
  options: HttpBootstrapOptions,
) {
  useContainer(app.select(rootModule), { fallbackOnErrors: true });
  const configService = app.get(ConfigService<AllConfigType>);

  const httpServer = app.getHttpAdapter().getInstance();
  if (typeof httpServer?.disable === 'function') {
    httpServer.disable('x-powered-by');
  }
  app.enableCors(buildCorsOptions(configService));

  app.use(helmet());
  app.use(compression());
  app.use(attachRequestId);
  app.use(createRequestLogger());

  app.enableShutdownHooks();
  const expressApp = app.getHttpAdapter().getInstance();
  if (typeof expressApp?.set === 'function') {
    expressApp.set(
      'trust proxy',
      configService.get('app.nodeEnv', { infer: true }) === 'production',
    );
  }
  app.setGlobalPrefix(
    configService.getOrThrow('app.apiPrefix', { infer: true }),
    {
      exclude: ['/'],
    },
  );
  app.enableVersioning({
    type: VersioningType.URI,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      ...validationOptions,
      transformOptions: {
        enableImplicitConversion: false,
      },
      validationError: {
        target: false,
        value: false,
      },
      forbidUnknownValues: true,
    }),
  );

  app.use(json({ limit: '50mb', verify: captureRawBody }));
  app.use(urlencoded({ extended: true, limit: '50mb', verify: captureRawBody }));

  app.useGlobalInterceptors(
    new ResolvePromisesInterceptor(),
    new ClassSerializerInterceptor(app.get(Reflector)),
  );

  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter({ httpAdapter }));

  const documentBuilder = new DocumentBuilder()
    .setTitle(options.title)
    .setDescription(options.description)
    .setVersion('1.0')
    .addBearerAuth()
    .addGlobalParameters({
      in: 'header',
      required: false,
      name: configService.getOrThrow('app.headerLanguage', { infer: true }),
      schema: {
        example: 'en',
      },
    });
  const configuredDocumentBuilder =
    options.configureDocumentBuilder?.(documentBuilder) ?? documentBuilder;

  const document = SwaggerModule.createDocument(
    app,
    configuredDocumentBuilder.build(),
  );
  SwaggerModule.setup(options.docsPath || 'docs', app, document);

  const port = configService.getOrThrow('app.port', { infer: true });
  await app.listen(port);
  Logger.log(
    `${options.logLabel || options.title} running on http://localhost:${port}/${configService.getOrThrow('app.apiPrefix', { infer: true })}/v1`,
  );
}
