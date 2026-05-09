import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  it('should reject tokens for inactive users', async () => {
    const configService = {
      getOrThrow: jest.fn().mockReturnValue('secret'),
    };

    const sessionService = {
      findById: jest.fn().mockResolvedValue({
        user: { id: 1 },
      }),
    };

    const usersService = {
      findById: jest.fn().mockResolvedValue({
        id: 1,
        status: { id: 2 },
      }),
    };

    const strategy = new JwtStrategy(
      configService as any,
      sessionService as any,
      usersService as any,
    );

    await expect(
      strategy.validate({
        id: 1,
        role: { id: 2 },
        sessionId: 10,
        iat: 0,
        exp: 0,
      } as any),
    ).rejects.toThrow('Unauthorized');
  });

  it('should accept tokens for active users with a valid session', async () => {
    const configService = {
      getOrThrow: jest.fn().mockReturnValue('secret'),
    };

    const sessionService = {
      findById: jest.fn().mockResolvedValue({
        user: { id: 1 },
      }),
    };

    const usersService = {
      findById: jest.fn().mockResolvedValue({
        id: 1,
        status: { id: 1 },
      }),
    };

    const strategy = new JwtStrategy(
      configService as any,
      sessionService as any,
      usersService as any,
    );

    await expect(
      strategy.validate({
        id: 1,
        role: { id: 2 },
        sessionId: 10,
        iat: 0,
        exp: 0,
      } as any),
    ).resolves.toMatchObject({
      id: 1,
      sessionId: 10,
    });
  });
});
