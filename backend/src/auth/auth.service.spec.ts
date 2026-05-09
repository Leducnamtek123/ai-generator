import bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should reject login for inactive users before creating a session', async () => {
    const usersService = {
      findByEmail: jest.fn().mockResolvedValue({
        id: 1,
        email: 'inactive@example.com',
        password: 'hashed',
        provider: 'email',
        status: { id: 2 },
        role: { id: 2 },
      }),
    };
    const sessionService = {
      create: jest.fn(),
    };
    const authTokenService = {
      getTokensData: jest.fn(),
    };
    const authProvisioningService = {
      provisionUser: jest.fn(),
    };
    const socialAuthService = {} as any;
    const authPasswordService = {} as any;
    const jwtService = {} as any;
    const mailService = {} as any;
    const configService = {} as any;

    jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

    const service = new AuthService(
      jwtService,
      usersService as any,
      sessionService as any,
      mailService,
      configService,
      authTokenService as any,
      socialAuthService,
      authProvisioningService as any,
      authPasswordService,
    );

    await expect(
      service.validateLogin({
        email: 'inactive@example.com',
        password: 'secret',
      }),
    ).rejects.toMatchObject({
      response: {
        errors: {
          email: 'inactiveAccount',
        },
      },
    });

    expect(sessionService.create).not.toHaveBeenCalled();
    expect(authTokenService.getTokensData).not.toHaveBeenCalled();
  });

  it('should reject refresh token flow for inactive users', async () => {
    const sessionService = {
      findById: jest.fn().mockResolvedValue({
        id: 1,
        user: { id: 1 },
        hash: 'hash',
      }),
      update: jest.fn(),
    };
    const usersService = {
      findById: jest.fn().mockResolvedValue({
        id: 1,
        role: { id: 2 },
        status: { id: 2 },
      }),
    };
    const authTokenService = {
      getTokensData: jest.fn(),
    };
    const service = new AuthService(
      {} as any,
      usersService as any,
      sessionService as any,
      {} as any,
      {} as any,
      authTokenService as any,
      {} as any,
      {} as any,
      {} as any,
    );

    await expect(
      service.refreshToken({
        sessionId: 1,
        hash: 'hash',
      }),
    ).rejects.toMatchObject({
      response: {
        errors: {
          email: 'inactiveAccount',
        },
      },
    });

    expect(sessionService.update).not.toHaveBeenCalled();
    expect(authTokenService.getTokensData).not.toHaveBeenCalled();
  });
});
