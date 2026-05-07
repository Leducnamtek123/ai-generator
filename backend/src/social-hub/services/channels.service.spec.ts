import { NotFoundException } from '@nestjs/common';
import { ChannelsService } from './channels.service';

describe('ChannelsService', () => {
  const repo = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  } as any;

  const registry = {
    getProvider: jest.fn(),
    listProviders: jest.fn(),
  } as any;

  const notificationsService = {
    notifyUser: jest.fn(),
  } as any;

  const service = new ChannelsService(repo, registry, notificationsService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should reject disconnecting a channel that does not belong to the user', async () => {
    repo.findOne.mockResolvedValue(null);

    await expect(service.disconnect(42, 'user-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(repo.remove).not.toHaveBeenCalled();
  });

  it('should reject fetching interactions for a channel that does not belong to the user', async () => {
    repo.findOne.mockResolvedValue(null);

    await expect(service.getInteractions(42, 'user-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
