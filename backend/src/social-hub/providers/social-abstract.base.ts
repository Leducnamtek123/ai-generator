import { Logger } from '@nestjs/common';

/**
 * Structured error types inspired by Postiz's SocialAbstract.
 * These allow providers to classify errors for proper upstream handling.
 */
export class RefreshTokenError extends Error {
  constructor(
    public readonly identifier: string,
    public readonly originalBody: string,
    message = 'Token needs refresh',
  ) {
    super(message);
    this.name = 'RefreshTokenError';
  }
}

export class BadBodyError extends Error {
  constructor(
    public readonly identifier: string,
    public readonly originalBody: string,
    message = 'Invalid request body or content policy violation',
  ) {
    super(message);
    this.name = 'BadBodyError';
  }
}

export class RateLimitError extends Error {
  constructor(
    public readonly retryAfterMs: number = 5000,
    message = 'Rate limit exceeded',
  ) {
    super(message);
    this.name = 'RateLimitError';
  }
}

/**
 * Abstract base class for all social media providers.
 * Inspired by Postiz's SocialAbstract pattern — provides:
 * - Automatic retry with exponential backoff on 429/500
 * - Structured error classification (refresh-token, bad-body, retry)
 * - Rate-limit aware fetching
 * - Scope validation
 */
export abstract class SocialAbstractBase {
  abstract identifier: string;
  protected readonly logger = new Logger(this.constructor.name);

  /** Max concurrent API calls for this provider */
  maxConcurrentJobs = 5;

  /** Max retries before giving up */
  private readonly MAX_RETRIES = 3;

  /**
   * Override per provider to classify platform-specific errors.
   * Return undefined if the error is not recognized.
   */
  protected handleErrors(
    body: string,
    status: number,
  ): { type: 'refresh-token' | 'bad-body' | 'retry'; value: string } | undefined {
    return undefined;
  }

  /**
   * Fetch wrapper with automatic retry, rate-limit handling, and error classification.
   * Inspired by Postiz's SocialAbstract.fetch()
   */
  protected async fetchWithRetry(
    url: string,
    options: RequestInit = {},
    context = '',
    retryCount = 0,
  ): Promise<Response> {
    const response = await fetch(url, options);

    // Success
    if (response.ok) {
      return response;
    }

    // Max retries exceeded
    if (retryCount >= this.MAX_RETRIES) {
      this.logger.error(`[${this.identifier}] Max retries exceeded for: ${context}`);
      throw new BadBodyError(this.identifier, '{}', `Max retries exceeded for ${context}`);
    }

    // Read response body for error classification
    let body = '{}';
    try {
      body = await response.text();
    } catch {
      body = '{}';
    }

    // Check platform-specific error handling
    const handledError = this.handleErrors(body, response.status);

    // Rate limiting (429) or transient server error (500 without specific handling)
    if (
      response.status === 429 ||
      (response.status === 500 && !handledError) ||
      body.includes('rate_limit_exceeded') ||
      body.includes('Rate limit')
    ) {
      const delay = this.getBackoffDelay(retryCount);
      this.logger.warn(`[${this.identifier}] Rate limited, retrying in ${delay}ms (${context})`);
      await this.sleep(delay);
      return this.fetchWithRetry(url, options, context, retryCount + 1);
    }

    // Provider says retry
    if (handledError?.type === 'retry') {
      const delay = this.getBackoffDelay(retryCount);
      this.logger.warn(`[${this.identifier}] Retrying in ${delay}ms: ${handledError.value}`);
      await this.sleep(delay);
      return this.fetchWithRetry(url, options, context, retryCount + 1);
    }

    // Token needs refresh (401 or provider-specific)
    if (
      (response.status === 401 && (handledError?.type === 'refresh-token' || !handledError)) ||
      handledError?.type === 'refresh-token'
    ) {
      throw new RefreshTokenError(
        this.identifier,
        body,
        handledError?.value || 'Token expired, needs re-authentication',
      );
    }

    // All other errors
    throw new BadBodyError(
      this.identifier,
      body,
      handledError?.value || `API error ${response.status}: ${body.substring(0, 200)}`,
    );
  }

  /**
   * Validate that all required scopes are present.
   * Inspired by Postiz's checkScopes()
   */
  protected checkScopes(required: string[], granted: string | string[]): boolean {
    const grantedArray = Array.isArray(granted)
      ? granted
      : decodeURIComponent(granted).split(/[, ]+/);

    const missing = required.filter(scope => !grantedArray.includes(scope));
    if (missing.length > 0) {
      throw new Error(
        `Missing required scopes: ${missing.join(', ')}. Please re-authenticate with all required permissions.`,
      );
    }
    return true;
  }

  /**
   * Exponential backoff delay: 2^retry * 1000ms + random jitter
   */
  private getBackoffDelay(retryCount: number): number {
    const baseDelay = Math.pow(2, retryCount) * 1000;
    const jitter = Math.random() * 1000;
    return Math.min(baseDelay + jitter, 30000); // Cap at 30s
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
