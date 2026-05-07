import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpAdapterHost } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { bootstrapHttpApp } from './http-bootstrap';

describe('bootstrapHttpApp', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('applies production-hardening defaults to the HTTP app', async () => {
    const createDocumentSpy = jest
      .spyOn(SwaggerModule, 'createDocument')
      .mockReturnValue({} as never);
    const setupSpy = jest
      .spyOn(SwaggerModule, 'setup')
      .mockImplementation(() => undefined as never);
    const disableSpy = jest.fn();
    const setSpy = jest.fn();
    const app = {
      select: jest.fn().mockReturnThis(),
      getHttpAdapter: jest.fn(() => ({
        getInstance: () => ({
          disable: disableSpy,
          set: setSpy,
        }),
      })),
      get: jest.fn((token) => {
        if (token === ConfigService) {
          return {
            get: jest.fn((key: string) => {
              if (key === 'app.frontendDomain') {
                return undefined;
              }

              if (key === 'app.nodeEnv') {
                return 'development';
              }

              if (key === 'app.headerLanguage') {
                return 'x-custom-lang';
              }

              return undefined;
            }),
            getOrThrow: jest.fn((key: string) => {
              if (key === 'app.apiPrefix') {
                return 'api';
              }

              if (key === 'app.headerLanguage') {
                return 'x-custom-lang';
              }

              if (key === 'app.port') {
                return 3000;
              }

              throw new Error(`Unexpected key: ${key}`);
            }),
          };
        }

        if (token === HttpAdapterHost) {
          return {
            httpAdapter: { reply: jest.fn(), getRequestUrl: jest.fn() },
          };
        }

        return {};
      }),
      disable: jest.fn(),
      enableCors: jest.fn(),
      use: jest.fn(),
      enableShutdownHooks: jest.fn(),
      setGlobalPrefix: jest.fn(),
      enableVersioning: jest.fn(),
      useGlobalPipes: jest.fn(),
      useGlobalInterceptors: jest.fn(),
      useGlobalFilters: jest.fn(),
      listen: jest.fn().mockResolvedValue(undefined),
    };

    await bootstrapHttpApp(app as never, class TestModule {}, {
      title: 'Test API',
      description: 'Test description',
      docsPath: 'docs',
      logLabel: 'Test API',
      configureDocumentBuilder: (builder: DocumentBuilder) => builder,
    });

    expect(disableSpy).toHaveBeenCalledWith('x-powered-by');
    expect(setSpy).toHaveBeenCalledWith('trust proxy', false);
    expect(app.enableCors).toHaveBeenCalledWith(
      expect.objectContaining({
        origin: expect.arrayContaining([
          'http://localhost:3000',
          'http://127.0.0.1:3000',
        ]),
        credentials: true,
      }),
    );
    expect(app.useGlobalPipes).toHaveBeenCalledWith(expect.any(ValidationPipe));
    expect(createDocumentSpy).toHaveBeenCalled();
    expect(setupSpy).toHaveBeenCalledWith('docs', app, {});
  });
});
