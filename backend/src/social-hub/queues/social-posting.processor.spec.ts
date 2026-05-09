import { SocialPostingProcessor } from './social-posting.processor';
import { SocialPostStatus } from '../infrastructure/persistence/relational/entities/social-post.entity';

describe('SocialPostingProcessor', () => {
  const publishingService = {
    findById: jest.fn(),
    updateStatus: jest.fn(),
  } as any;

  const socialProviderRegistry = {
    getProvider: jest.fn(),
  } as any;

  const queueReliabilityService = {
    archiveFailure: jest.fn().mockResolvedValue(false),
  };

  const processor = new SocialPostingProcessor(
    publishingService,
    socialProviderRegistry,
    queueReliabilityService as any,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should skip missing posts without failing the job', async () => {
    publishingService.findById.mockRejectedValueOnce(new Error('not found'));

    await expect(
      processor.process({ data: { postId: 42 } } as any),
    ).resolves.toEqual({ status: 'skipped', reason: 'not_found' });
    expect(publishingService.updateStatus).not.toHaveBeenCalled();
  });

  it('should skip already published posts without republishing', async () => {
    publishingService.findById.mockResolvedValueOnce({
      id: 42,
      status: SocialPostStatus.PUBLISHED,
      content: 'hello',
      socialAccount: {
        platform: 'facebook',
      },
    });

    await expect(
      processor.process({ data: { postId: 42 } } as any),
    ).resolves.toEqual({ status: 'skipped', reason: 'already_published' });
    expect(socialProviderRegistry.getProvider).not.toHaveBeenCalled();
    expect(publishingService.updateStatus).not.toHaveBeenCalled();
  });
});
