import { CommunityMarketplaceController } from './community-marketplace.controller';
import { CommunityMarketplaceService } from './community-marketplace.service';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { NotFoundException } from '@nestjs/common';

describe('CommunityMarketplaceController', () => {
  const user = {
    id: 'user-1',
    email: 'user@example.com',
    role: null,
  } as AuthenticatedUser;

  const service = {
    findAll: jest.fn(),
    findMine: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    purchase: jest.fn(),
  } as unknown as jest.Mocked<CommunityMarketplaceService>;

  const controller = new CommunityMarketplaceController(service);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should list only the authenticated user listings for the me route', async () => {
    service.findMine.mockResolvedValue([]);

    const result = await controller.findMine(user, 1, 12);

    expect(service.findMine).toHaveBeenCalledWith(user.id, {
      page: 1,
      limit: 12,
    });
    expect(result).toEqual({
      data: [],
      hasNextPage: false,
    });
  });

  it('should create listings for the authenticated user only', async () => {
    service.create.mockResolvedValue({ id: 'listing-1' } as never);

    await controller.create(user, { title: 'My template' } as never);

    expect(service.create).toHaveBeenCalledWith(user.id, {
      title: 'My template',
    });
  });

  it('should update listings for the authenticated user only', async () => {
    service.update.mockResolvedValue({ id: 'listing-1' } as never);

    await controller.update(user, 'listing-1', { title: 'Updated' } as never);

    expect(service.update).toHaveBeenCalledWith(user.id, 'listing-1', {
      title: 'Updated',
    });
  });

  it('should remove listings for the authenticated user only', async () => {
    service.remove.mockResolvedValue({ success: true });

    await controller.remove(user, 'listing-1');

    expect(service.remove).toHaveBeenCalledWith(user.id, 'listing-1');
  });

  it('should purchase listings for the authenticated user only', async () => {
    service.purchase.mockResolvedValue({ success: true } as never);

    await controller.purchase(user, 'listing-1');

    expect(service.purchase).toHaveBeenCalledWith(user.id, 'listing-1');
  });

  it('should surface not found errors from the service', async () => {
    service.findOne.mockRejectedValue(
      new NotFoundException('Template not found'),
    );

    await expect(controller.findOne('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
