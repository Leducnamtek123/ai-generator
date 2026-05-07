import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { randomUUID } from 'crypto';
import { AllConfigType } from '../config/config.type';

const DEFAULT_DEV_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3001',
  'http://localhost:3002',
  'http://127.0.0.1:3002',
];

const REQUEST_ID_PATTERN = /^[A-Za-z0-9._:-]{1,128}$/;

function normalizeOrigins(value?: string): string[] {
  if (!value) {
    return [];
  }

  const seen = new Set<string>();

  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
    .map((origin) => {
      try {
        return new URL(origin).origin;
      } catch {
        return '';
      }
    })
    .filter((origin) => {
      if (!origin) {
        return false;
      }

      if (seen.has(origin)) {
        return false;
      }

      seen.add(origin);
      return true;
    });
}

export function buildCorsOptions(
  configService: ConfigService<AllConfigType>,
): CorsOptions {
  const frontendDomain = configService.get('app.frontendDomain', { infer: true });
  const isProduction = configService.get('app.nodeEnv', { infer: true }) === 'production';
  const configuredOrigins = normalizeOrigins(frontendDomain);

  if (configuredOrigins.length > 0) {
    return {
      origin: configuredOrigins,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      credentials: true,
    };
  }

  return {
    origin: isProduction ? false : DEFAULT_DEV_ORIGINS,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  };
}

export const attachRequestId: RequestHandler = (
  req: Request & { requestId?: string },
  res: Response,
  next: NextFunction,
) => {
  const headerValue = req.headers?.['x-request-id'];
  const candidate = Array.isArray(headerValue) ? headerValue[0] : headerValue;
  const requestId =
    typeof candidate === 'string' && REQUEST_ID_PATTERN.test(candidate.trim())
      ? candidate.trim()
      : randomUUID();

  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);
  next();
};

type RequestWithContext = Request & {
  requestId?: string;
  user?: { id?: string | number };
};

function shouldSkipRequestLog(path: string): boolean {
  return (
    path === '/health' ||
    path.startsWith('/docs') ||
    path === '/favicon.ico'
  );
}

export function createRequestLogger(): RequestHandler {
  const logger = new Logger('HTTP');

  return (req: RequestWithContext, res: Response, next: NextFunction) => {
    const startedAt = process.hrtime.bigint();
    const path = (req.originalUrl ?? req.url ?? '/').split('?')[0];

    if (shouldSkipRequestLog(path)) {
      next();
      return;
    }

    let logged = false;

    const logRequest = (message: string) => {
      if (logged) {
        return;
      }

      logged = true;

      const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
      const payload = {
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
        userId: req.user?.id,
        method: req.method,
        path,
        ip: req.ip,
        statusCode: res.statusCode,
        durationMs: Number(durationMs.toFixed(2)),
        message,
      };

      const line = JSON.stringify(payload);
      if (res.statusCode >= 500) {
        logger.error(line);
        return;
      }

      if (res.statusCode >= 400) {
        logger.warn(line);
        return;
      }

      logger.log(line);
    };

    res.on('finish', () => {
      logRequest('request completed');
    });

    res.on('close', () => {
      if (!res.writableEnded) {
        logRequest('request aborted');
      }
    });

    next();
  };
}
