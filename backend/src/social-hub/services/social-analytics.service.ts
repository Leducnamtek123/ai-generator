import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual } from 'typeorm';
import { SocialPostEntity, SocialPostStatus } from '../infrastructure/persistence/relational/entities/social-post.entity';
import { SocialPostMetricEntity } from '../infrastructure/persistence/relational/entities/social-post-metric.entity';
import { SocialAccountEntity } from '../infrastructure/persistence/relational/entities/social-account.entity';
import { SocialProviderRegistry } from '../providers/social-provider.registry';
import { SocialHubGateway } from '../gateways/social-hub.gateway';
import { decrypt } from '../utils/encryption.helper';
import { UserEntity } from '../../users/infrastructure/persistence/relational/entities/user.entity';

@Injectable()
export class SocialAnalyticsService {
  private readonly logger = new Logger(SocialAnalyticsService.name);

  constructor(
    @InjectRepository(SocialPostEntity)
    private readonly postRepository: Repository<SocialPostEntity>,
    @InjectRepository(SocialPostMetricEntity)
    private readonly metricRepository: Repository<SocialPostMetricEntity>,
    @InjectRepository(SocialAccountEntity)
    private readonly accountRepository: Repository<SocialAccountEntity>,
    private readonly providerRegistry: SocialProviderRegistry,
    private readonly socialHubGateway: SocialHubGateway,
  ) {}

  /**
   * Refresh metrics for all posts published in the last 30 days
   */
  async refreshAllMetrics() {
    this.logger.log('Starting global metrics refresh cycle...');
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activePosts = await this.postRepository.find({
      where: {
        status: SocialPostStatus.PUBLISHED,
        publishedAt: Between(thirtyDaysAgo, new Date()),
      },
      relations: ['socialAccount'],
    });

    this.logger.log(`Found ${activePosts.length} posts to refresh`);

    for (const post of activePosts) {
      if (!post.externalPostId || !post.socialAccount) continue;

      try {
        const provider = this.providerRegistry.getProvider(post.socialAccount.platform);
        if (provider.getMetrics) {
          const metrics = await provider.getMetrics(
            decrypt(post.socialAccount.accessToken),
            post.externalPostId
          );

          await this.metricRepository.save(
            this.metricRepository.create({
              post,
              likes: metrics.likes,
              comments: metrics.comments,
              shares: metrics.shares,
              views: metrics.views || 0,
              rawMetrics: metrics.raw
            })
          );
          
          this.logger.debug(`Updated metrics for post ${post.id} (${post.socialAccount.platform})`);

          // Emit a real-time event via WebSocket
          if (post.user) {
            this.socialHubGateway.broadcastInteraction(post.user.id, {
              postId: post.id,
              platform: post.socialAccount.platform,
              metrics: metrics,
              timestamp: new Date()
            });
          }
        }
      } catch (error) {
        this.logger.error(`Failed to refresh metrics for post ${post.id}: ${error.message}`);
      }
    }
  }

  /**
   * Get aggregated analytics for a user's dashboard.
   * Phase 1 improvement: Real chart data from DB instead of mock.
   */
  async getDashboardStats(user: UserEntity) {
    try {
      const posts = await this.postRepository.find({
        where: { user: { id: user.id }, status: SocialPostStatus.PUBLISHED },
        relations: ['socialAccount'],
        order: { publishedAt: 'DESC' },
        take: 20
      });
      const stats = await Promise.all(posts.map(async (post) => {
        const latestMetric = await this.metricRepository.findOne({
          where: { post: { id: post.id } },
          order: { createdAt: 'DESC' }
        });
        return {
          id: post.id,
          content: (post.content || '').substring(0, 50),
          platform: post.socialAccount?.platform,
          publishedAt: post.publishedAt,
          likes: latestMetric?.likes || 0,
          comments: latestMetric?.comments || 0,
          shares: latestMetric?.shares || 0,
          views: latestMetric?.views || 0
        };
      }));
      const chartData = await this.buildEngagementChart(user.id, 7);
      const platformBreakdown = this.buildPlatformBreakdown(stats);
      return {
        recentPosts: stats,
        chartData,
        platformBreakdown,
        totals: {
          likes: stats.reduce((sum, s) => sum + s.likes, 0),
          comments: stats.reduce((sum, s) => sum + s.comments, 0),
          shares: stats.reduce((sum, s) => sum + s.shares, 0),
          views: stats.reduce((sum, s) => sum + s.views, 0),
          totalPosts: stats.length,
        }
      };
    } catch (error) {
      this.logger.error(
        'Failed to build dashboard analytics for user ' +
          user?.id +
          ': ' +
          (error?.message || error),
      );
      return {
        recentPosts: [],
        chartData: [],
        platformBreakdown: {},
        totals: {
          likes: 0,
          comments: 0,
          shares: 0,
          views: 0,
          totalPosts: 0,
        }
      };
    }
  }
  /**
   * Get analytics per specific channel/account.
   * New endpoint inspired by Postiz's AnalyticsController.
   */
  async getChannelAnalytics(accountId: number, days: number = 30) {
    const account = await this.accountRepository.findOne({
      where: { id: accountId },
    });

    if (!account) {
      throw new Error('Account not found');
    }

    // Try to get platform-level analytics
    const provider = this.providerRegistry.getProvider(account.platform);
    let platformAnalytics: any[] = [];

    if (provider.getAnalytics) {
      try {
        platformAnalytics = await provider.getAnalytics(
          decrypt(account.accessToken),
          account.platformId,
          days,
        );
      } catch (error) {
        this.logger.warn(`Failed to fetch platform analytics for ${account.platform}:`, error);
      }
    }

    // Get our own stored metrics for this channel
    const nDaysAgo = new Date();
    nDaysAgo.setDate(nDaysAgo.getDate() - days);

    const posts = await this.postRepository.find({
      where: {
        socialAccount: { id: accountId },
        status: SocialPostStatus.PUBLISHED,
        publishedAt: MoreThanOrEqual(nDaysAgo),
      },
    });

    const postMetrics = await Promise.all(
      posts.map(async (post) => {
        const metric = await this.metricRepository.findOne({
          where: { post: { id: post.id } },
          order: { createdAt: 'DESC' },
        });
        return {
          postId: post.id,
          content: post.content.substring(0, 80),
          publishedAt: post.publishedAt,
          likes: metric?.likes || 0,
          comments: metric?.comments || 0,
          shares: metric?.shares || 0,
          views: metric?.views || 0,
        };
      }),
    );

    return {
      account: {
        id: account.id,
        platform: account.platform,
        name: account.name,
        picture: account.picture,
      },
      platformAnalytics,
      postMetrics,
      totals: {
        totalPosts: postMetrics.length,
        likes: postMetrics.reduce((s, p) => s + p.likes, 0),
        comments: postMetrics.reduce((s, p) => s + p.comments, 0),
        shares: postMetrics.reduce((s, p) => s + p.shares, 0),
        views: postMetrics.reduce((s, p) => s + p.views, 0),
      },
    };
  }

  /**
   * Get analytics for a specific post.
   * New endpoint inspired by Postiz's postAnalytics.
   */
  async getPostAnalytics(postId: number) {
    const post = await this.postRepository.findOne({
      where: { id: postId },
      relations: ['socialAccount'],
    });

    if (!post) {
      throw new Error('Post not found');
    }

    // Fetch all historical metrics (time series)
    const metrics = await this.metricRepository.find({
      where: { post: { id: postId } },
      order: { createdAt: 'ASC' },
    });

    // Try to get live analytics from the platform
    let liveAnalytics: any[] = [];
    if (post.socialAccount && post.externalPostId) {
      const provider = this.providerRegistry.getProvider(post.socialAccount.platform);
      if (provider.getPostAnalytics) {
        try {
          liveAnalytics = await provider.getPostAnalytics(
            decrypt(post.socialAccount.accessToken),
            post.externalPostId,
          );
        } catch (error) {
          this.logger.warn(`Failed to fetch live post analytics:`, error);
        }
      }
    }

    return {
      post: {
        id: post.id,
        content: post.content,
        platform: post.socialAccount?.platform,
        publishedAt: post.publishedAt,
        externalUrl: post.externalPostId
          ? this.buildExternalUrl(post.socialAccount?.platform, post.externalPostId)
          : null,
      },
      metricsHistory: metrics.map((m) => ({
        createdAt: m.createdAt,
        likes: m.likes,
        comments: m.comments,
        shares: m.shares,
        views: m.views,
      })),
      latestMetric: metrics.length > 0 ? metrics[metrics.length - 1] : null,
      liveAnalytics,
    };
  }

  /**
   * Build real engagement chart data from stored metrics.
   * Replaces mock data with actual DB queries.
   * Inspired by Chatwoot's ReportingEvent time-series pattern.
   */
  private async buildEngagementChart(userId: number, days: number) {
    const chartData: { name: string; engagement: number; likes: number; comments: number; shares: number }[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const dayStart = new Date();
      dayStart.setDate(dayStart.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);

      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const dayName = dayStart.toLocaleDateString('en-US', { weekday: 'short' });
      const dateStr = dayStart.toISOString().split('T')[0];

      // Sum metrics collected on this day for the user's posts
      let result: { likes?: string; comments?: string; shares?: string } | undefined;
      try {
        result = await this.metricRepository
          .createQueryBuilder('metric')
          .innerJoin('metric.post', 'post')
          .innerJoin('post.user', 'user')
          .where('user.id = :userId', { userId })
          .andWhere('metric.createdAt BETWEEN :start AND :end', {
            start: dayStart,
            end: dayEnd,
          })
          .select('COALESCE(SUM(metric.likes), 0)', 'likes')
          .addSelect('COALESCE(SUM(metric.comments), 0)', 'comments')
          .addSelect('COALESCE(SUM(metric.shares), 0)', 'shares')
          .addSelect('COALESCE(SUM(metric.views), 0)', 'views')
          .getRawOne();
      } catch (error) {
        this.logger.warn(
          'Failed to build chart segment for user ' +
            userId +
            ' on ' +
            dateStr +
            ': ' +
            (error?.message || error),
        );
      }
      const likes = parseInt(result?.likes || '0', 10);
      const comments = parseInt(result?.comments || '0', 10);
      const shares = parseInt(result?.shares || '0', 10);

      chartData.push({
        name: `${dayName} ${dateStr}`,
        engagement: likes + comments + shares,
        likes,
        comments,
        shares,
      });
    }

    return chartData;
  }

  /**
   * Build per-platform breakdown from stats.
   */
  private buildPlatformBreakdown(stats: any[]) {
    const breakdown: Record<string, { posts: number; likes: number; comments: number; shares: number }> = {};

    for (const stat of stats) {
      const platform = stat.platform || 'unknown';
      if (!breakdown[platform]) {
        breakdown[platform] = { posts: 0, likes: 0, comments: 0, shares: 0 };
      }
      breakdown[platform].posts++;
      breakdown[platform].likes += stat.likes;
      breakdown[platform].comments += stat.comments;
      breakdown[platform].shares += stat.shares;
    }

    return breakdown;
  }

  /**
   * Build external URL for a published post.
   */
  private buildExternalUrl(platform: string | undefined, externalPostId: string): string | null {
    if (!platform || !externalPostId) return null;

    switch (platform) {
      case 'facebook':
        return `https://facebook.com/${externalPostId}`;
      case 'twitter':
        return `https://x.com/i/status/${externalPostId}`;
      case 'linkedin':
        return `https://www.linkedin.com/feed/update/${externalPostId}`;
      default:
        return null;
    }
  }
}

