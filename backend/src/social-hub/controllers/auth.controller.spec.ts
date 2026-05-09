import { ConfigService } from '@nestjs/config';
import { SocialAuthController } from './auth.controller';
import { SocialAuthService } from '../services/auth.service';

describe('SocialAuthController', () => {
  const authService = {
    handleCallback: jest.fn(),
    getAuthUrl: jest.fn(),
  } as unknown as jest.Mocked<SocialAuthService>;

  const configService = {
    get: jest.fn((key: string) => {
      if (key === 'app.frontendDomain') {
        return 'https://app.example.com';
      }

      return undefined;
    }),
  } as unknown as jest.Mocked<ConfigService>;

  const controller = new SocialAuthController(authService, configService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('redirects to the configured frontend domain on success', async () => {
    const redirect = jest.fn();

    await controller.callback('facebook', 'code-123', 'state-123', {
      redirect,
    } as never);

    expect(authService.handleCallback).toHaveBeenCalledWith(
      'facebook',
      'code-123',
      'state-123',
    );
    expect(redirect).toHaveBeenCalledWith(
      'https://app.example.com/social/channels?status=success&platform=facebook',
    );
  });

  it('redirects to the configured frontend domain on failure', async () => {
    const redirect = jest.fn();
    authService.handleCallback.mockRejectedValueOnce(new Error('boom'));

    await controller.callback('facebook', 'code-123', 'state-123', {
      redirect,
    } as never);

    expect(redirect).toHaveBeenCalledWith(
      'https://app.example.com/social/channels?status=error&platform=facebook',
    );
  });
});
