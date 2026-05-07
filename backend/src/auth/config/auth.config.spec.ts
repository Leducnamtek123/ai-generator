import authConfig from './auth.config';

describe('auth config validation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      NODE_ENV: 'production',
      AUTH_JWT_SECRET:
        '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
      AUTH_JWT_TOKEN_EXPIRES_IN: '15m',
      AUTH_REFRESH_SECRET:
        'fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210',
      AUTH_REFRESH_TOKEN_EXPIRES_IN: '7d',
      AUTH_FORGOT_SECRET:
        'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      AUTH_FORGOT_TOKEN_EXPIRES_IN: '30m',
      AUTH_CONFIRM_EMAIL_SECRET:
        'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      AUTH_CONFIRM_EMAIL_TOKEN_EXPIRES_IN: '1d',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should accept strong secrets in production', () => {
    expect(authConfig()).toEqual(
      expect.objectContaining({
        secret:
          '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
        refreshSecret:
          'fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210',
      }),
    );
  });

  it('should reject a short jwt secret in production', () => {
    process.env.AUTH_JWT_SECRET = 'short-secret';

    expect(() => authConfig()).toThrow();
  });
});
