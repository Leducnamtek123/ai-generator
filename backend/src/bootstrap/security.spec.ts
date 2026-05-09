import { ConfigService } from '@nestjs/config';
import { EventEmitter } from 'node:events';
import { Logger } from '@nestjs/common';
import { createRequestLogger, attachRequestId, buildCorsOptions } from './security';

describe('bootstrap security helpers', () => {
  it('normalizes and deduplicates CORS origins', () => {
    const configService = {
      get: jest.fn((key: string) => {
        if (key === 'app.frontendDomain') {
          return 'https://example.com/app, https://example.com, invalid, https://example.com/';
        }

        if (key === 'app.nodeEnv') {
          return 'production';
        }

        return undefined;
      }),
    } as unknown as ConfigService;

    expect(buildCorsOptions(configService)).toEqual({
      origin: ['https://example.com'],
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      credentials: true,
    });
  });

  it('disables CORS origins in production when none are configured', () => {
    const configService = {
      get: jest.fn((key: string) => {
        if (key === 'app.nodeEnv') {
          return 'production';
        }

        return undefined;
      }),
    } as unknown as ConfigService;

    expect(buildCorsOptions(configService)).toEqual({
      origin: false,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      credentials: true,
    });
  });

  it('propagates the inbound request id header', () => {
    const setHeader = jest.fn();
    const next = jest.fn();

    attachRequestId(
      {
        headers: {
          'x-request-id': 'req-123',
        },
      } as never,
      { setHeader } as never,
      next,
    );

    expect(next).toHaveBeenCalled();
    expect(setHeader).toHaveBeenCalledWith('x-request-id', 'req-123');
  });

  it('rejects unsafe request id headers', () => {
    const setHeader = jest.fn();
    const next = jest.fn();

    attachRequestId(
      {
        headers: {
          'x-request-id': 'bad\nheader',
        },
      } as never,
      { setHeader } as never,
      next,
    );

    expect(next).toHaveBeenCalled();
    expect(setHeader).toHaveBeenCalledWith(
      'x-request-id',
      expect.stringMatching(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      ),
    );
  });

  it('emits structured request logs with context and status', () => {
    const logSpy = jest
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => undefined as never);
    const warnSpy = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined as never);
    const errorSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined as never);

    const middleware = createRequestLogger();
    const res = new EventEmitter() as EventEmitter & {
      statusCode: number;
      writableEnded: boolean;
      setHeader: jest.Mock;
    };
    res.statusCode = 200;
    res.writableEnded = true;
    res.setHeader = jest.fn();

    middleware(
      {
        requestId: 'req-abc',
        method: 'POST',
        originalUrl: '/api/v1/example?foo=bar',
        ip: '127.0.0.1',
        user: { id: 42 },
      } as never,
      res as never,
      jest.fn(),
    );

    res.emit('finish');

    expect(logSpy).toHaveBeenCalledTimes(1);
    const parsed = JSON.parse(logSpy.mock.calls[0][0] as string);
    expect(parsed).toEqual(
      expect.objectContaining({
        requestId: 'req-abc',
        userId: 42,
        method: 'POST',
        path: '/api/v1/example',
        ip: '127.0.0.1',
        statusCode: 200,
        message: 'request completed',
      }),
    );
    expect(parsed.durationMs).toEqual(expect.any(Number));
    expect(warnSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();

    logSpy.mockRestore();
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });
});
