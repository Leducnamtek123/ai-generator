import { NotFoundException } from '@nestjs/common';
import { PublishingService } from './publishing.service';
import { SocialPostStatus } from '../infrastructure/persistence/relational/entities/social-post.entity';

describe('PublishingService', () => {
  const postRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    softRemove: jest.fn(),
  } as any;

  const accountRepository = {
    findOne: jest.fn(),
  } as any;

  const queue = {
    add: jest.fn(),
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
});
