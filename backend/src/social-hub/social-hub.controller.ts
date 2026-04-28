import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { SocialAnalyticsService } from './services/social-analytics.service';
import { ChannelsService } from './services/channels.service';
import { PublishingService } from './services/publishing.service';
import { TokenRefreshService } from './services/token-refresh.service';

@ApiTags('Social Hub')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'social-hub',
  version: '1',
})
export class SocialHubController {
  constructor(
    private readonly channelsService: ChannelsService,
    private readonly publishingService: PublishingService,
    private readonly analyticsService: SocialAnalyticsService,
    private readonly tokenRefreshService: TokenRefreshService,
  ) { }

  // ==========================================
  // CHANNELS
  // ==========================================

  @Get('channels')
  @ApiOperation({ summary: 'List all connected social channels' })
  findAllChannels(@Request() req: any) {
    return this.channelsService.findAllForUser(req.user);
  }

  @Post('channels/connect')
  @ApiOperation({ summary: 'Connect a new social channel via OAuth code' })
  connectChannel(@Request() req: any, @Body() data: { platform: string; code: string }) {
    return this.channelsService.connect(req.user, data.platform, data.code);
  }

  @Delete('channels/:id')
  @ApiOperation({ summary: 'Disconnect a social channel' })
  disconnectChannel(@Param('id', ParseIntPipe) id: number) {
    return this.channelsService.disconnect(id);
  }

  @Post('channels/:id/refresh')
  @ApiOperation({ summary: 'Force refresh token for a channel' })
  refreshChannelToken(@Param('id', ParseIntPipe) id: number) {
    return this.tokenRefreshService.forceRefresh(id);
  }

  // ==========================================
  // POSTS
  // ==========================================

  @Get('posts')
  @ApiOperation({ summary: 'List all posts' })
  findAllPosts(@Request() req: any) {
    return this.publishingService.findAll(req.user);
  }

  @Get('posts/:id')
  @ApiOperation({ summary: 'Get a single post by ID' })
  findPostById(@Param('id', ParseIntPipe) id: number) {
    return this.publishingService.findById(id);
  }

  @Post('posts')
  @ApiOperation({ summary: 'Create a new post (draft or scheduled)' })
  createPost(@Request() req: any, @Body() data: any) {
    return this.publishingService.create(req.user, data);
  }

  @Patch('posts/:id')
  @ApiOperation({ summary: 'Update post content or settings' })
  updatePost(@Param('id', ParseIntPipe) id: number, @Body() data: any) {
    return this.publishingService.update(id, data);
  }

  @Patch('posts/:id/reschedule')
  @ApiOperation({ summary: 'Reschedule a post to a new date/time' })
  reschedulePost(@Param('id', ParseIntPipe) id: number, @Body() data: { scheduledAt: string }) {
    return this.publishingService.reschedule(id, new Date(data.scheduledAt));
  }

  @Delete('posts/:id')
  @ApiOperation({ summary: 'Delete a post' })
  deletePost(@Param('id', ParseIntPipe) id: number) {
    return this.publishingService.delete(id);
  }

  // ==========================================
  // INTERACTIONS / INBOX
  // ==========================================

  @Get('interactions')
  @ApiOperation({ summary: 'Get interactions for a specific channel' })
  getInteractions(@Query('accountId', ParseIntPipe) accountId: number) {
    return this.channelsService.getInteractions(accountId);
  }

  @Get('inbox')
  @ApiOperation({ summary: 'Get unified inbox feed across all channels' })
  getInbox(@Request() req: any) {
    return this.channelsService.getFeed(req.user);
  }

  // ==========================================
  // ANALYTICS
  // ==========================================

  @Get('analytics')
  @ApiOperation({ summary: 'Get dashboard analytics overview' })
  getAnalytics(@Request() req: any) {
    return this.analyticsService.getDashboardStats(req.user);
  }

  @Get('analytics/channel/:accountId')
  @ApiOperation({ summary: 'Get analytics for a specific channel' })
  getChannelAnalytics(
    @Param('accountId', ParseIntPipe) accountId: number,
    @Query('days') days?: string,
  ) {
    return this.analyticsService.getChannelAnalytics(accountId, days ? +days : 30);
  }

  @Get('analytics/post/:postId')
  @ApiOperation({ summary: 'Get detailed analytics for a specific post' })
  getPostAnalytics(@Param('postId', ParseIntPipe) postId: number) {
    return this.analyticsService.getPostAnalytics(postId);
  }

  // ==========================================
  // PROVIDERS
  // ==========================================

  @Get('providers')
  @ApiOperation({ summary: 'List all available social providers' })
  listProviders() {
    return this.channelsService.listAvailableProviders();
  }
}
