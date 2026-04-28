import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { SocialPostEntity, SocialPostStatus } from '../infrastructure/persistence/relational/entities/social-post.entity';
import { SOCIAL_POSTING_QUEUE } from '../../queues/queues.constants';
import { UserEntity } from '../../users/infrastructure/persistence/relational/entities/user.entity';
import { SocialAccountEntity } from '../infrastructure/persistence/relational/entities/social-account.entity';

@Injectable()
export class PublishingService {
  private readonly logger = new Logger(PublishingService.name);

  constructor(
    @InjectRepository(SocialPostEntity)
    private readonly socialPostRepository: Repository<SocialPostEntity>,
    @InjectRepository(SocialAccountEntity)
    private readonly socialAccountRepository: Repository<SocialAccountEntity>,
    @InjectQueue(SOCIAL_POSTING_QUEUE)
    private readonly socialPostingQueue: Queue,
  ) {}

  async findAll(user: UserEntity) {
    try {
      return this.socialPostRepository.find({
        where: {
          user: { id: user.id },
        },
        order: { scheduledAt: 'DESC' },
      });
    } catch (error) {
      this.logger.error(
        `Failed to fetch posts for user ${user?.id}: ${error?.message || error}`,
      );
      return [];
    }
  }

  async create(user: UserEntity, data: any) {
    const requestedAccountIds = [
      ...(Array.isArray(data.socialAccountIds) ? data.socialAccountIds : []),
      ...(typeof data.socialAccountId === 'number' ? [data.socialAccountId] : []),
    ]
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id));

    const uniqueAccountIds = [...new Set(requestedAccountIds)];

    const accounts = uniqueAccountIds.length
      ? await this.socialAccountRepository.find({
          where: uniqueAccountIds.map((id) => ({
            id,
            user: { id: user.id },
          })),
        })
      : [];

    if (uniqueAccountIds.length > 0 && accounts.length !== uniqueAccountIds.length) {
      throw new NotFoundException('One or more social accounts were not found for this user');
    }

    const targetAccounts = accounts.length > 0 ? accounts : [null];
    const postsToCreate = targetAccounts.map((account) =>
      this.socialPostRepository.create({
        content: data.content,
        mediaUrls: data.mediaUrls,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
        user,
        socialAccount: account ?? undefined,
        status: data.scheduledAt ? SocialPostStatus.SCHEDULED : SocialPostStatus.DRAFT,
      }),
    );

    const savedPosts = (await this.socialPostRepository.save(postsToCreate)) as unknown as SocialPostEntity[];

    for (const savedPost of savedPosts) {
      if (savedPost.status === SocialPostStatus.SCHEDULED && savedPost.scheduledAt) {
        const delay = new Date(savedPost.scheduledAt).getTime() - Date.now();
        await this.socialPostingQueue.add(
          'post',
          { postId: savedPost.id },
          { delay: Math.max(0, delay) },
        );
      }
    }

    if (savedPosts.length === 1) {
      return savedPosts[0];
    }

    return {
      created: savedPosts.length,
      posts: savedPosts,
    };
  }

  async findById(id: number) {
    const post = await this.socialPostRepository.findOne({ where: { id } });
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    return post;
  }

  async updateStatus(id: number, status: SocialPostStatus, externalPostId?: string, error?: string) {
    await this.socialPostRepository.update(id, {
      status,
      externalPostId,
      error,
      publishedAt: status === SocialPostStatus.PUBLISHED ? new Date() : undefined,
    });
  }

  /**
   * Update post content/settings.
   * New endpoint inspired by Postiz's post management patterns.
   */
  async update(id: number, data: Partial<{ content: string; mediaUrls: string[] }>) {
    const post = await this.findById(id);
    
    if (post.status === SocialPostStatus.PUBLISHED) {
      throw new Error('Cannot update a published post');
    }

    await this.socialPostRepository.update(id, {
      ...(data.content ? { content: data.content } : {}),
      ...(data.mediaUrls ? { mediaUrls: data.mediaUrls } : {}),
    });

    return this.findById(id);
  }

  /**
   * Reschedule a post to a new date/time.
   * Inspired by Postiz's changeDate endpoint.
   */
  async reschedule(id: number, newScheduledAt: Date) {
    const post = await this.findById(id);

    if (post.status === SocialPostStatus.PUBLISHED) {
      throw new Error('Cannot reschedule a published post');
    }

    await this.socialPostRepository.update(id, {
      scheduledAt: newScheduledAt,
      status: SocialPostStatus.SCHEDULED,
    });

    // Remove old job and add new one
    const delay = newScheduledAt.getTime() - Date.now();
    await this.socialPostingQueue.add(
      'post',
      { postId: id },
      { 
        delay: Math.max(0, delay),
        jobId: `reschedule_${id}_${Date.now()}`, // unique job ID
      },
    );

    return this.findById(id);
  }

  /**
   * Delete a post (soft delete or hard delete based on status).
   * Inspired by Postiz's deletePost.
   */
  async delete(id: number) {
    const post = await this.findById(id);
    
    if (post.status === SocialPostStatus.PUBLISHED) {
      // Soft delete published posts (keep for analytics)
      await this.socialPostRepository.softRemove(post);
    } else {
      // Hard delete drafts and scheduled posts
      await this.socialPostRepository.remove(post);
    }

    return { deleted: true, id };
  }
}
