import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(
    private readonly httpAdapterHost: Pick<HttpAdapterHost, 'httpAdapter'>,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;

    const ctx = host.switchToHttp();
    const request = ctx.getRequest<{
      requestId?: string;
      method?: string;
      url?: string;
      originalUrl?: string;
    }>();

    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const response =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    const message =
      typeof response === 'string'
        ? response
        : ((response as { message?: string | string[] }).message ??
          'Request failed');

    const responseBody = {
      statusCode: httpStatus,
      timestamp: new Date().toISOString(),
      requestId: request?.requestId,
      path: httpAdapter.getRequestUrl(ctx.getRequest()),
      message,
      errors:
        typeof response === 'object' && response !== null
          ? (response as { errors?: unknown }).errors
          : undefined,
    };

    if (httpStatus === HttpStatus.INTERNAL_SERVER_ERROR) {
      const error =
        exception instanceof Error
          ? exception
          : new Error('Unhandled exception');
      this.logger.error(
        {
          requestId: request?.requestId,
          method: request?.method,
          path: request?.originalUrl ?? request?.url,
          statusCode: httpStatus,
          message: error.message,
        },
        error.stack,
      );
    }

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
