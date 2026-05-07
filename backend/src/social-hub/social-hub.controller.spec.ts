import { SocialHubController } from './social-hub.controller';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';

describe('SocialHubController', () => {
  const user = {
    id: 'user-1',
    email: 'user@example.com',
    role: null,
  } as AuthenticatedUser;

  const channelsService = {
    findAllForUser: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    getInteractions: jest.fn(),
    getFeed: jest.fn(),
    replyToInteraction: jest.fn(),
    markInteractionHandled: jest.fn(),
    listAvailableProviders: jest.fn(),
  } as any;

  const publishingService = {
    findAll: jest.fn(),
    findOwnedPost: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    reschedule: jest.fn(),
    delete: jest.fn(),
  } as any;

  const analyticsService = {
    getDashboardStats: jest.fn(),
    getChannelAnalytics: jest.fn(),
    getPostAnalytics: jest.fn(),
  } as any;

  const tokenRefreshService = {
    forceRefresh: jest.fn(),
  } as any;

  const controller = new SocialHubController(
    channelsService,
    publishingService,
    analyticsService,
    tokenRefreshService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should scope channel listing to the authenticated user', async () => {
    await controller.findAllChannels(user);

    expect(channelsService.findAllForUser).toHaveBeenCalledWith(user);
  });

  it('should scope channel disconnect to the authenticated user', async () => {
    await controller.disconnectChannel(user, 12);

    expect(channelsService.disconnect).toHaveBeenCalledWith(12, user.id);
  });

  it('should scope channel refresh to the authenticated user', async () => {
    await controller.refreshChannelToken(user, 12);

    expect(tokenRefreshService.forceRefresh).toHaveBeenCalledWith(12, user.id);
  });

  it('should scope social post reads and writes to the authenticated user', async () => {
    await controller.findPostById(user, 41);
    await controller.updatePost(user, 41, { content: 'hello' });
    await controller.reschedulePost(user, 41, {
      scheduledAt: '2026-05-07T00:00:00.000Z',
    });
    await controller.deletePost(user, 41);

    expect(publishingService.findOwnedPost).toHaveBeenCalledWith(41, user.id);
    expect(publishingService.update).toHaveBeenCalledWith(41, user.id, {
      content: 'hello',
    });
    expect(publishingService.reschedule).toHaveBeenCalledWith(
      41,
      user.id,
      new Date('2026-05-07T00:00:00.000Z'),
    );
    expect(publishingService.delete).toHaveBeenCalledWith(41, user.id);
  });

  it('should scope analytics to the authenticated user', async () => {
    await controller.getAnalytics(user, '14');
    await controller.getChannelAnalytics(user, 12, '21');
    await controller.getPostAnalytics(user, 41);

    expect(analyticsService.getDashboardStats).toHaveBeenCalledWith(user, 14);
    expect(analyticsService.getChannelAnalytics).toHaveBeenCalledWith(
      12,
      21,
      user.id,
    );
    expect(analyticsService.getPostAnalytics).toHaveBeenCalledWith(41, user.id);
  });
});
