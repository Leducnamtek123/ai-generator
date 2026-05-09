import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  SocialPostEntity,
  SocialPostStatus,
} from '../infrastructure/persistence/relational/entities/social-post.entity';
import { SOCIAL_POSTING_QUEUE } from '../../queues/queues.constants';
import { UserEntity } from '../../users/infrastructure/persistence/relational/entities/user.entity';
import { SocialAccountEntity } from '../infrastructure/persistence/relational/entities/social-account.entity';
import { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import {
  CreateSocialPostDto,
  UpdateSocialPostDto,
} from '../dto/social-hub.dto';

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

  private getPostJobId(postId: number) {
    return `social-post:${postId}`;
  }

  async findAll(user: AuthenticatedUser) {
    const userId = Number(user.id);
    try {
      return this.socialPostRepository.find({
        where: {
          user: { id: userId },
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

  async create(user: AuthenticatedUser, data: CreateSocialPostDto) {
    const userId = Number(user.id);
    const requestedAccountIds = [
      ...(Array.isArray(data.socialAccountIds) ? data.socialAccountIds : []),
      ...(typeof data.socialAccountId === 'number'
        ? [data.socialAccountId]
        : []),
    ]
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id));

    const uniqueAccountIds = [...new Set(requestedAccountIds)];

    const accounts = uniqueAccountIds.length
      ? await this.socialAccountRepository.find({
          where: uniqueAccountIds.map((id) => ({
            id,
            user: { id: userId },
          })),
        })
      : [];

    if (
      uniqueAccountIds.length > 0 &&
      accounts.length !== uniqueAccountIds.length
    ) {
      throw new NotFoundException(
        'One or more social accounts were not found for this user',
      );
    }

    const targetAccounts = accounts.length > 0 ? accounts : [null];
    const userRef = { id: userId } as UserEntity;
    const shouldSaveDraft = Boolean(data.saveDraft);
    const scheduledAt = data.scheduledAt
      ? new Date(data.scheduledAt)
      : shouldSaveDraft
        ? undefined
        : new Date();
    const postsToCreate = targetAccounts.map((account) =>
      this.socialPostRepository.create({
        content: data.content,
        mediaUrls: data.mediaUrls,
        scheduledAt,
        user: userRef,
        socialAccount: account ?? undefined,
        status: shouldSaveDraft
          ? SocialPostStatus.DRAFT
          : SocialPostStatus.SCHEDULED,
      }),
    );

    const savedPosts = (await this.socialPostRepository.save(
      postsToCreate,
    )) as unknown as SocialPostEntity[];

    for (const savedPost of savedPosts) {
      if (
        savedPost.status === SocialPostStatus.SCHEDULED &&
        savedPost.scheduledAt
      ) {
        const delay = new Date(savedPost.scheduledAt).getTime() - Date.now();
        await this.socialPostingQueue.add(
          'post',
          { postId: savedPost.id },
          {
            delay: Math.max(0, delay),
            jobId: this.getPostJobId(savedPost.id),
            removeOnComplete: true,
            removeOnFail: 10,
          },
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

  async findOwnedPost(id: number, userId: AuthenticatedUser['id']) {
    const ownerId = Number(userId);
    const post = await this.socialPostRepository.findOne({
      where: { id, user: { id: ownerId } },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return post;
  }

  async updateStatus(
    id: number,
    status: SocialPostStatus,
    externalPostId?: string,
    error?: string,
  ) {
    await this.socialPostRepository.update(id, {
      status,
      externalPostId,
      error,
      publishedAt:
        status === SocialPostStatus.PUBLISHED ? new Date() : undefined,
    });
  }

  /**
   * Update post content/settings.
   * New endpoint inspired by Postiz's post management patterns.
   */
  async update(
    id: number,
    userId: AuthenticatedUser['id'],
    data: UpdateSocialPostDto,
  ) {
    const post = await this.findOwnedPost(id, userId);

    if (post.status === SocialPostStatus.PUBLISHED) {
      throw new Error('Cannot update a published post');
    }

    await this.socialPostRepository.update(id, {
      ...(data.content !== undefined ? { content: data.content } : {}),
      ...(data.mediaUrls !== undefined ? { mediaUrls: data.mediaUrls } : {}),
    });

    return this.findOwnedPost(id, userId);
  }

  /**
   * Reschedule a post to a new date/time.
   * Inspired by Postiz's changeDate endpoint.
   */
  async reschedule(
    id: number,
    userId: AuthenticatedUser['id'],
    newScheduledAt: Date,
  ) {
    const post = await this.findOwnedPost(id, userId);

    if (post.status === SocialPostStatus.PUBLISHED) {
      throw new Error('Cannot reschedule a published post');
    }

    await this.socialPostRepository.update(id, {
      scheduledAt: newScheduledAt,
      status: SocialPostStatus.SCHEDULED,
    });

    const jobId = this.getPostJobId(id);
    const existingJob = await this.socialPostingQueue.getJob(jobId);
    if (existingJob) {
      await existingJob.remove();
    }

    const delay = newScheduledAt.getTime() - Date.now();
    await this.socialPostingQueue.add(
      'post',
      { postId: id },
      {
        delay: Math.max(0, delay),
        jobId,
        removeOnComplete: true,
        removeOnFail: 10,
      },
    );

    return this.findOwnedPost(id, userId);
  }

  /**
   * Delete a post (soft delete or hard delete based on status).
   * Inspired by Postiz's deletePost.
   */
  async delete(id: number, userId: AuthenticatedUser['id']) {
    const post = await this.findOwnedPost(id, userId);

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
