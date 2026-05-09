import { NotFoundException } from '@nestjs/common';
import { ChannelsService } from './channels.service';

describe('ChannelsService', () => {
  const repo = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  } as any;

  const pendingRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(),
  } as any;

  const registry = {
    getProvider: jest.fn(),
    listProviders: jest.fn(),
  } as any;

  const notificationsService = {
    notifyUser: jest.fn(),
  } as any;

  const service = new ChannelsService(
    repo,
    pendingRepo,
    registry,
    notificationsService,
  );

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

  it('should persist inbox triage state on the owning account', async () => {
    repo.findOne.mockResolvedValue({
      id: 42,
      user: { id: 1 },
      metadata: {
        inboxTriage: {
          existing: {
            assignedTo: 'Support',
            labels: ['Bug'],
            followUp: true,
            updatedAt: '2026-05-07T00:00:00.000Z',
          },
        },
      },
    });
    repo.save.mockResolvedValue({
      id: 42,
    });

    const result = await service.updateInteractionTriage(
      { id: 'user-1' } as any,
      42,
      'interaction-1',
      {
        assignedTo: 'Sales',
        labels: ['VIP', 'Lead'],
        followUp: false,
      },
    );

    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          inboxTriage: expect.objectContaining({
            existing: expect.any(Object),
            'interaction-1': expect.objectContaining({
              assignedTo: 'Sales',
              labels: ['VIP', 'Lead'],
              followUp: false,
              updatedAt: expect.any(String),
            }),
          }),
        }),
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        accountId: 42,
        interactionId: 'interaction-1',
        assignedTo: 'Sales',
        labels: ['VIP', 'Lead'],
        followUp: false,
      }),
    );
  });
});
