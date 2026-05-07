import {
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter';

describe('AllExceptionsFilter', () => {
  const httpAdapter = {
    getRequestUrl: jest.fn().mockReturnValue('/api/v1/test'),
    reply: jest.fn(),
  };

  const makeHost = (request: Record<string, unknown>) =>
    ({
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => ({}),
      }),
    }) as ArgumentsHost;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns a safe payload for application errors', () => {
    const filter = new AllExceptionsFilter({ httpAdapter } as any);
    const exception = new HttpException(
      { message: ['Validation failed'], errors: { field: 'required' } },
      HttpStatus.UNPROCESSABLE_ENTITY,
    );

    filter.catch(
      exception,
      makeHost({ requestId: 'req-1', method: 'POST', url: '/api/v1/test' }),
    );

    expect(httpAdapter.reply).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        requestId: 'req-1',
        path: '/api/v1/test',
        message: ['Validation failed'],
        errors: { field: 'required' },
      }),
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  });

  it('logs internal failures without leaking the raw exception object', () => {
    const errorSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined as never);
    const filter = new AllExceptionsFilter({ httpAdapter } as any);

    filter.catch(
      new Error('database connection failed'),
      makeHost({
        requestId: 'req-2',
        method: 'GET',
        originalUrl: '/api/v1/test',
      }),
    );

    expect(errorSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: 'req-2',
        method: 'GET',
        path: '/api/v1/test',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'database connection failed',
      }),
      expect.stringContaining('database connection failed'),
    );
    expect(httpAdapter.reply).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        requestId: 'req-2',
        path: '/api/v1/test',
        message: 'Internal server error',
      }),
      HttpStatus.INTERNAL_SERVER_ERROR,
    );

    errorSpy.mockRestore();
  });
});
