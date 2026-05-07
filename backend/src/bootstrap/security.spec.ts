import { ConfigService } from '@nestjs/config';
import { attachRequestId, buildCorsOptions } from './security';

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
});
