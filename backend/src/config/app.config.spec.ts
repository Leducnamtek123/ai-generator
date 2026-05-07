import appConfig from './app.config';

describe('app config validation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      NODE_ENV: 'production',
      FRONTEND_DOMAIN: 'https://app.example.com, https://admin.example.com',
      BACKEND_DOMAIN: 'https://api.example.com',
      API_PREFIX: 'api',
      APP_FALLBACK_LANGUAGE: 'en',
      APP_HEADER_LANGUAGE: 'x-custom-lang',
      APP_PORT: '3000',
      GENERATION_CALLBACK_SECRET:
        '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should accept comma-separated frontend origins and strong production secrets', () => {
    expect(appConfig()).toEqual(
      expect.objectContaining({
        frontendDomain: 'https://app.example.com, https://admin.example.com',
        generationCallbackSecret:
          '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
      }),
    );
  });

  it('should reject a weak generation callback secret in production', () => {
    process.env.GENERATION_CALLBACK_SECRET = 'short-secret';

    expect(() => appConfig()).toThrow();
  });
});
