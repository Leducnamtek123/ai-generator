import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  Param,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MessengerService } from '../services/messenger.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SocialAccountEntity } from '../infrastructure/persistence/relational/entities/social-account.entity';
import { ConfigService } from '@nestjs/config';

@ApiTags('Social Hub - Triggers')
@Controller({
  path: 'triggers/messenger/webhook',
  version: '1',
})
export class FacebookMessengerController {
  private readonly logger = new Logger(FacebookMessengerController.name);

  constructor(
    private readonly messengerService: MessengerService,
    private readonly configService: ConfigService,
    @InjectRepository(SocialAccountEntity)
    private readonly socialAccountRepository: Repository<SocialAccountEntity>,
  ) {}

  /**
   * Meta Webhook Verification (Handshake)
   * URL: {BASE_URL}/v1/triggers/messenger/webhook/:channelId
   */
  @Get(':channelId')
  @ApiOperation({ summary: 'Meta Webhook Handshake' })
  async verifyWebhook(
    @Param('channelId') channelId: string,
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ) {
    this.logger.log(`Verifying webhook for channel ${channelId}`);

    // Check if the trigger is enabled globally
    const isEnabled = this.configService.get('MESSENGER_TRIGGER_ENABLED') === 'true';
    if (!isEnabled) {
      throw new ForbiddenException('Messenger trigger is disabled');
    }

    const account = await this.socialAccountRepository.findOne({
      where: { id: parseInt(channelId) },
    });

    if (!account) {
      throw new NotFoundException('Channel not found');
    }

    // Check verify_token from account metadata (Dify style)
    const expectedToken = account.metadata?.verifyToken;

    if (mode === 'subscribe' && token === expectedToken) {
      this.logger.log('Webhook verified successfully');
      return challenge;
    }

    this.logger.error('Webhook verification failed: Token mismatch');
    throw new ForbiddenException('Verification token mismatch');
  }

  /**
   * Meta Webhook Event Handler
   */
  @Post(':channelId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle Meta Webhook Events' })
  async handleWebhook(
    @Param('channelId') channelId: string,
    @Body() payload: any,
  ) {
    // Note: In production, you should validate X-Hub-Signature-256 here
    // using the App Secret and raw body.

    const account = await this.socialAccountRepository.findOne({
      where: { id: parseInt(channelId) },
    });

    if (!account) {
      throw new NotFoundException('Channel not found');
    }

    // Process events asynchronously to return 200 OK to Meta quickly
    this.messengerService.parseAndProcessEvents(payload, account).catch((err) => {
      this.logger.error(`Error processing webhook events: ${err.message}`);
    });

    return { status: 'received' };
  }
}
