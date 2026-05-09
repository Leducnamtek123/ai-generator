import { NotFoundException } from '@nestjs/common';
import { PublishingService } from './publishing.service';
import { SocialPostStatus } from '../infrastructure/persistence/relational/entities/social-post.entity';

describe('PublishingService', () => {
  const postRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn((data) => data),
    update: jest.fn(),
    remove: jest.fn(),
    softRemove: jest.fn(),
  } as any;

  const accountRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
  } as any;

  const queue = {
    add: jest.fn(),
    getJob: jest.fn(),
  } as any;

  const service = new PublishingService(
    postRepository,
    accountRepository,
    queue,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should reject post updates for posts that do not belong to the user', async () => {
    postRepository.findOne.mockResolvedValue(null);

    await expect(
      service.update(41, 'user-1', { content: 'hello' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(postRepository.update).not.toHaveBeenCalled();
  });

  it('should reject post deletes for posts that do not belong to the user', async () => {
    postRepository.findOne.mockResolvedValue(null);

    await expect(service.delete(41, 'user-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(postRepository.remove).not.toHaveBeenCalled();
    expect(postRepository.softRemove).not.toHaveBeenCalled();
  });

  it('should reject fetching a post that does not belong to the user', async () => {
    postRepository.findOne.mockResolvedValue(null);

    await expect(service.findOwnedPost(41, 'user-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('should enforce ownership before rescheduling', async () => {
    postRepository.findOne
      .mockResolvedValueOnce({
        id: 41,
        status: SocialPostStatus.DRAFT,
      })
      .mockResolvedValueOnce(null);

    await expect(
      service.reschedule(41, 'user-1', new Date('2026-05-07T00:00:00.000Z')),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('should use a stable job id for scheduled posts and remove old reschedule jobs', async () => {
    postRepository.findOne
      .mockResolvedValueOnce({
        id: 41,
        status: SocialPostStatus.DRAFT,
      })
      .mockResolvedValueOnce({
        id: 41,
        status: SocialPostStatus.SCHEDULED,
      })
      .mockResolvedValueOnce({
        id: 41,
        status: SocialPostStatus.SCHEDULED,
      });
    postRepository.save.mockResolvedValue([
      {
        id: 41,
        status: SocialPostStatus.SCHEDULED,
        scheduledAt: new Date('2026-05-07T00:00:00.000Z'),
      },
    ]);
    queue.getJob.mockResolvedValue({
      remove: jest.fn().mockResolvedValue(undefined),
    });

    await service.create(
      { id: 'user-1' } as any,
      {
        content: 'hello',
        scheduledAt: '2026-05-07T00:00:00.000Z',
      } as any,
    );

    expect(queue.add).toHaveBeenCalledWith(
      'post',
      { postId: 41 },
      expect.objectContaining({
        jobId: 'social-post:41',
        removeOnComplete: true,
        removeOnFail: 10,
      }),
    );

    queue.add.mockClear();

    await service.reschedule(
      41,
      'user-1',
      new Date('2026-05-08T00:00:00.000Z'),
    );

    expect(queue.getJob).toHaveBeenCalledWith('social-post:41');
    expect(queue.add).toHaveBeenCalledWith(
      'post',
      { postId: 41 },
      expect.objectContaining({
        jobId: 'social-post:41',
        removeOnComplete: true,
      removeOnFail: 10,
      }),
    );
  });

  it('should save drafts without queueing a publish job', async () => {
    accountRepository.find.mockResolvedValue([]);
    postRepository.save.mockResolvedValue([
      {
        id: 99,
        status: SocialPostStatus.DRAFT,
        scheduledAt: undefined,
      },
    ]);

    const result = await service.create(
      { id: 'user-1' } as any,
      {
        content: 'draft content',
        saveDraft: true,
      } as any,
    );

    expect(postRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        status: SocialPostStatus.DRAFT,
        scheduledAt: undefined,
      }),
    );
    expect(queue.add).not.toHaveBeenCalled();
    expect(result).toEqual({
      id: 99,
      status: SocialPostStatus.DRAFT,
      scheduledAt: undefined,
    });
  });

  it('should queue immediate publishes when no schedule is provided', async () => {
    accountRepository.find.mockResolvedValue([]);
    postRepository.save.mockResolvedValue([
      {
        id: 101,
        status: SocialPostStatus.SCHEDULED,
        scheduledAt: new Date('2026-05-08T00:00:00.000Z'),
      },
    ]);

    await service.create(
      { id: 'user-1' } as any,
      {
        content: 'publish now',
      } as any,
    );

    expect(postRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        status: SocialPostStatus.SCHEDULED,
      }),
    );
    expect(queue.add).toHaveBeenCalledWith(
      'post',
      { postId: 101 },
      expect.objectContaining({
        jobId: 'social-post:101',
        delay: expect.any(Number),
      }),
    );
  });
});
