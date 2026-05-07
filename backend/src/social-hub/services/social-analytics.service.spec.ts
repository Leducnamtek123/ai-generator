import { NotFoundException } from '@nestjs/common';
import { SocialAnalyticsService } from './social-analytics.service';

describe('SocialAnalyticsService', () => {
  const postRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
  } as any;

  const metricRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(),
  } as any;

  const accountRepository = {
    findOne: jest.fn(),
  } as any;

  const providerRegistry = {
    getProvider: jest.fn(),
  } as any;

  const socialHubGateway = {
    broadcastInteraction: jest.fn(),
  } as any;

  const service = new SocialAnalyticsService(
    postRepository,
    metricRepository,
    accountRepository,
    providerRegistry,
    socialHubGateway,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should reject channel analytics for accounts that do not belong to the user', async () => {
    accountRepository.findOne.mockResolvedValue(null);

    await expect(
      service.getChannelAnalytics(41, 30, 'user-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('should reject post analytics for posts that do not belong to the user', async () => {
    postRepository.findOne.mockResolvedValue(null);

    await expect(service.getPostAnalytics(41, 'user-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
