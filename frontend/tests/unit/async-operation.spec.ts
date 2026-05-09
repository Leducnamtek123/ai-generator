import { expect, test } from '@playwright/test';

import {
  getUserFacingErrorMessage,
  isAbortError,
  pollUntil,
  sleep,
} from '../../src/lib/async-operation';

test.describe('async operation helpers', () => {
  test('derives safe error messages from common failure shapes', async () => {
    expect(
      getUserFacingErrorMessage(
        { response: { data: { message: 'Backend validation failed' } } },
        'Fallback',
      ),
    ).toBe('Backend validation failed');

    expect(getUserFacingErrorMessage(new Error('Plain error'), 'Fallback')).toBe('Plain error');
    expect(getUserFacingErrorMessage('string failure', 'Fallback')).toBe('string failure');
    expect(getUserFacingErrorMessage(null, 'Fallback')).toBe('Fallback');
  });

  test('detects abort-style failures', async () => {
    expect(isAbortError(new DOMException('Aborted', 'AbortError'))).toBeTruthy();
    expect(isAbortError({ code: 'ERR_CANCELED' })).toBeTruthy();
    expect(isAbortError(new Error('boom'))).toBeFalsy();
  });

  test('polls until the terminal condition is satisfied', async () => {
    let attempts = 0;

    const result = await pollUntil({
      fetcher: async () => {
        attempts += 1;
        return attempts < 3 ? { status: 'processing' } : { status: 'completed', resultUrl: '/done' };
      },
      shouldStop: (value) => value.status === 'completed',
      intervalMs: 1,
      timeoutMs: 250,
    });

    expect(result.status).toBe('completed');
    expect(attempts).toBe(3);
  });

  test('cancels long-running polls and sleeps cleanly', async () => {
    const controller = new AbortController();
    const observed: number[] = [];

    const polling = pollUntil({
      fetcher: async () => {
        observed.push(Date.now());
        return { status: 'processing' };
      },
      shouldStop: () => false,
      intervalMs: 20,
      timeoutMs: 250,
      signal: controller.signal,
    });

    setTimeout(() => controller.abort(), 10);

    await expect(polling).rejects.toThrow(/aborted/i);
    await expect(sleep(0, controller.signal)).resolves.toBeUndefined();
    expect(observed.length).toBeGreaterThan(0);
  });
});
