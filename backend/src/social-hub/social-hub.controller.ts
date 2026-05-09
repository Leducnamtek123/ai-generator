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
  ParseIntPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { SocialAnalyticsService } from './services/social-analytics.service';
import { ChannelsService } from './services/channels.service';
import { PublishingService } from './services/publishing.service';
import { TokenRefreshService } from './services/token-refresh.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import {
  ConfirmFacebookPendingConnectionDto,
  ConnectSocialChannelDto,
  CreateSocialPostDto,
  ReplyInboxInteractionDto,
  RescheduleSocialPostDto,
  SocialAnalyticsQueryDto,
  UpdateInboxInteractionTriageDto,
  UpdateSocialPostDto,
} from './dto/social-hub.dto';

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
  ) {}

  // ==========================================
  // CHANNELS
  // ==========================================

  @Get('channels')
  @ApiOperation({ summary: 'List all connected social channels' })
  findAllChannels(@CurrentUser() user: AuthenticatedUser) {
    return this.channelsService.findAllForUser(user);
  }

  @Post('channels/connect')
  @ApiOperation({ summary: 'Connect a new social channel via OAuth code' })
  connectChannel(
    @CurrentUser() user: AuthenticatedUser,
    @Body() data: ConnectSocialChannelDto,
  ) {
    return this.channelsService.connect(user, data.platform, data.code);
  }

  @Delete('channels/:id')
  @ApiOperation({ summary: 'Disconnect a social channel' })
  disconnectChannel(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.channelsService.disconnect(id, user.id);
  }

  @Get('channels/facebook/pending')
  @ApiOperation({ summary: 'List pending Facebook page connections' })
  findPendingFacebookConnections(@CurrentUser() user: AuthenticatedUser) {
    return this.channelsService.getPendingFacebookConnections(user);
  }

  @Post('channels/facebook/pending/:id/confirm')
  @ApiOperation({ summary: 'Confirm selected Facebook pages' })
  confirmPendingFacebookConnection(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() data: ConfirmFacebookPendingConnectionDto,
  ) {
    return this.channelsService.confirmPendingFacebookConnection(
      user,
      id,
      Array.isArray(data.selectedPageIds) ? data.selectedPageIds : [],
    );
  }

  @Delete('channels/facebook/pending/:id')
  @ApiOperation({ summary: 'Discard pending Facebook page connection' })
  discardPendingFacebookConnection(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.channelsService.discardPendingFacebookConnection(user, id);
  }

  @Post('channels/:id/refresh')
  @ApiOperation({ summary: 'Force refresh token for a channel' })
  refreshChannelToken(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.tokenRefreshService.forceRefresh(id, user.id);
  }

  // ==========================================
  // POSTS
  // ==========================================

  @Get('posts')
  @ApiOperation({ summary: 'List all posts' })
  findAllPosts(@CurrentUser() user: AuthenticatedUser) {
    return this.publishingService.findAll(user);
  }

  @Get('posts/:id')
  @ApiOperation({ summary: 'Get a single post by ID' })
  findPostById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.publishingService.findOwnedPost(id, user.id);
  }

  @Post('posts')
  @ApiOperation({ summary: 'Create a new post (draft or scheduled)' })
  createPost(@CurrentUser() user: AuthenticatedUser, @Body() data: CreateSocialPostDto) {
    return this.publishingService.create(user, data);
  }

  @Patch('posts/:id')
  @ApiOperation({ summary: 'Update post content or settings' })
  updatePost(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateSocialPostDto,
  ) {
    return this.publishingService.update(id, user.id, data);
  }

  @Patch('posts/:id/reschedule')
  @ApiOperation({ summary: 'Reschedule a post to a new date/time' })
  reschedulePost(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() data: RescheduleSocialPostDto,
  ) {
    return this.publishingService.reschedule(
      id,
      user.id,
      new Date(data.scheduledAt),
    );
  }

  @Delete('posts/:id')
  @ApiOperation({ summary: 'Delete a post' })
  deletePost(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.publishingService.delete(id, user.id);
  }

  // ==========================================
  // INTERACTIONS / INBOX
  // ==========================================

  @Get('interactions')
  @ApiOperation({ summary: 'Get interactions for a specific channel' })
  getInteractions(
    @CurrentUser() user: AuthenticatedUser,
    @Query('accountId', ParseIntPipe) accountId: number,
  ) {
    return this.channelsService.getInteractions(accountId, user.id);
  }

  @Get('inbox')
  @ApiOperation({ summary: 'Get unified inbox feed across all channels' })
  getInbox(@CurrentUser() user: AuthenticatedUser) {
    return this.channelsService.getFeed(user);
  }

  @Post('inbox/reply')
  @ApiOperation({ summary: 'Reply to a social inbox interaction' })
  replyToInbox(
    @CurrentUser() user: AuthenticatedUser,
    @Body() data: ReplyInboxInteractionDto,
  ) {
    return this.channelsService.replyToInteraction(
      user,
      data.accountId,
      data.interactionId,
      data.message,
    );
  }

  @Patch('inbox/:accountId/:interactionId/handled')
  @ApiOperation({ summary: 'Mark a social inbox interaction as handled' })
  markInboxInteractionHandled(
    @CurrentUser() user: AuthenticatedUser,
    @Param('accountId', ParseIntPipe) accountId: number,
    @Param('interactionId') interactionId: string,
  ) {
    return this.channelsService.markInteractionHandled(
      user,
      accountId,
      interactionId,
    );
  }

  @Patch('inbox/:accountId/:interactionId/triage')
  @ApiOperation({ summary: 'Update inbox assignment, labels, and follow-up state' })
  updateInboxInteractionTriage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('accountId', ParseIntPipe) accountId: number,
    @Param('interactionId') interactionId: string,
    @Body() data: UpdateInboxInteractionTriageDto,
  ) {
    return this.channelsService.updateInteractionTriage(user, accountId, interactionId, {
      assignedTo: data.assignedTo,
      labels: data.labels,
      followUp: data.followUp,
    });
  }

  // ==========================================
  // ANALYTICS
  // ==========================================

  @Get('analytics')
  @ApiOperation({ summary: 'Get dashboard analytics overview' })
  getAnalytics(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: SocialAnalyticsQueryDto,
  ) {
    return this.analyticsService.getDashboardStats(user, query.days ?? 7);
  }

  @Get('analytics/channel/:accountId')
  @ApiOperation({ summary: 'Get analytics for a specific channel' })
  getChannelAnalytics(
    @CurrentUser() user: AuthenticatedUser,
    @Param('accountId', ParseIntPipe) accountId: number,
    @Query() query: SocialAnalyticsQueryDto,
  ) {
    return this.analyticsService.getChannelAnalytics(
      accountId,
      query.days ?? 30,
      user.id,
    );
  }

  @Get('analytics/post/:postId')
  @ApiOperation({ summary: 'Get detailed analytics for a specific post' })
  getPostAnalytics(
    @CurrentUser() user: AuthenticatedUser,
    @Param('postId', ParseIntPipe) postId: number,
  ) {
    return this.analyticsService.getPostAnalytics(postId, user.id);
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
