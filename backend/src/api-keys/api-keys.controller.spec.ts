import { NotFoundException } from '@nestjs/common';
import { ApiKeysController } from './api-keys.controller';
import { ApiKeysService } from './api-keys.service';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';

describe('ApiKeysController', () => {
  const user = {
    id: 'user-1',
    email: 'user@example.com',
    role: null,
  } as AuthenticatedUser;

  const service = {
    create: jest.fn(),
    findAllByUserId: jest.fn(),
    findOneByIdAndUserId: jest.fn(),
    softDelete: jest.fn(),
  } as unknown as jest.Mocked<ApiKeysService>;

  const controller = new ApiKeysController(service);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create keys for the authenticated user only', async () => {
    service.create.mockResolvedValue({
      apiKey: {
        id: 'key-1',
        key: 'hash',
        keyPrefix: 'ak_prefix',
        keyLast4: '1234',
        name: 'Claude Desktop',
        user: { id: user.id } as never,
        lastUsedAt: null,
        expiresAt: null,
        createdAt: new Date('2026-05-07T00:00:00.000Z'),
        updatedAt: new Date('2026-05-07T00:00:00.000Z'),
        deletedAt: new Date('2026-05-07T00:00:00.000Z'),
      },
      rawKey: 'ak_test',
      preview: 'ak_prefix...1234',
    });

    const result = await controller.create(user, 'Claude Desktop');

    expect(service.create).toHaveBeenCalledWith({
      name: 'Claude Desktop',
      user,
      expiresAt: null,
    });
    expect(result).toEqual(
      expect.objectContaining({
        rawKey: 'ak_test',
        keyPreview: 'ak_prefix...1234',
      }),
    );
  });

  it('should list only the authenticated user api keys', async () => {
    service.findAllByUserId.mockResolvedValue([
      {
        id: 'key-1',
        key: 'hash',
        keyPrefix: 'ak_prefix',
        keyLast4: '1234',
        name: 'Claude Desktop',
        user: { id: user.id } as never,
        lastUsedAt: null,
        expiresAt: null,
        createdAt: new Date('2026-05-07T00:00:00.000Z'),
        updatedAt: new Date('2026-05-07T00:00:00.000Z'),
        deletedAt: new Date('2026-05-07T00:00:00.000Z'),
      },
    ]);

    const result = await controller.findAll(user);

    expect(service.findAllByUserId).toHaveBeenCalledWith(user.id);
    expect(result).toEqual([
      expect.objectContaining({
        keyPreview: 'ak_prefix...1234',
      }),
    ]);
  });

  it('should reject revocation of keys that do not belong to the authenticated user', async () => {
    service.findOneByIdAndUserId.mockResolvedValue(null);

    await expect(controller.remove('key-2', user)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(service.softDelete).not.toHaveBeenCalled();
  });

  it('should revoke a key only after verifying ownership', async () => {
    service.findOneByIdAndUserId.mockResolvedValue({
      id: 'key-1',
      key: 'hash',
      keyPrefix: 'ak_prefix',
      keyLast4: '1234',
      name: 'Claude Desktop',
      user: { id: user.id } as never,
      lastUsedAt: null,
      expiresAt: null,
      createdAt: new Date('2026-05-07T00:00:00.000Z'),
      updatedAt: new Date('2026-05-07T00:00:00.000Z'),
      deletedAt: new Date('2026-05-07T00:00:00.000Z'),
    });

    await controller.remove('key-1', user);

    expect(service.findOneByIdAndUserId).toHaveBeenCalledWith('key-1', user.id);
    expect(service.softDelete).toHaveBeenCalledWith('key-1');
  });
});
