import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FacebookAdapter } from '../providers/adapters/facebook.adapter';
import { decrypt } from '../utils/encryption.helper';
import { SocialAccountEntity } from '../infrastructure/persistence/relational/entities/social-account.entity';

@Injectable()
export class MessengerService {
  private readonly logger = new Logger(MessengerService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly facebookAdapter: FacebookAdapter,
  ) {}

  /**
   * Parse incoming webhook events from Meta (Messenger/Feed).
   */
  async parseAndProcessEvents(payload: any, account: SocialAccountEntity) {
    const entry = payload.entry || [];

    for (const item of entry) {
      // 1. Handle Messenger Messages
      if (item.messaging) {
        for (const messagingEvent of item.messaging) {
          if (messagingEvent.message && !messagingEvent.message.is_echo) {
            await this.handleMessengerMessage(messagingEvent, account);
          }
        }
      }

      // 2. Handle Page Feed Changes (Comments)
      if (item.changes) {
        for (const change of item.changes) {
          if (change.field === 'feed' && change.value.item === 'comment' && change.value.verb === 'add') {
            await this.handleFeedComment(change.value, account);
          }
        }
      }
    }
  }

  private async handleMessengerMessage(event: any, account: SocialAccountEntity) {
    const senderId = event.sender.id;
    const messageText = event.message.text;
    const pageAccessToken = decrypt(account.accessToken);

    this.logger.log(`Received Messenger message from ${senderId}: ${messageText}`);

    // In a real scenario, we would trigger an AI response here.
    // For now, let's just log and provide a placeholder for the AI logic.
    // const aiResponse = await this.aiService.generateResponse(messageText);
    const aiResponse = `Hello! This is an automated response from PaintAI. You said: "${messageText}"`;

    await this.sendMessengerReply(senderId, aiResponse, pageAccessToken);
  }

  private async handleFeedComment(comment: any, account: SocialAccountEntity) {
    const commentId = comment.comment_id;
    const message = comment.message;
    const pageAccessToken = decrypt(account.accessToken);

    if (comment.from.id === account.platformId) return; // Don't reply to self

    this.logger.log(`Received Feed comment ${commentId}: ${message}`);

    const aiResponse = `Thanks for your comment! We received: "${message}"`;

    await this.sendCommentReply(commentId, aiResponse, pageAccessToken);
  }

  private async sendMessengerReply(recipientId: string, text: string, accessToken: string) {
    try {
      await fetch(`https://graph.facebook.com/v20.0/me/messages?access_token=${accessToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: { id: recipientId },
          message: { text },
        }),
      });
    } catch (error) {
      this.logger.error(`Failed to send Messenger reply: ${error.message}`);
    }
  }

  private async sendCommentReply(commentId: string, text: string, accessToken: string) {
    try {
      await fetch(`https://graph.facebook.com/v20.0/${commentId}/comments?access_token=${accessToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
    } catch (error) {
      this.logger.error(`Failed to send Comment reply: ${error.message}`);
    }
  }
}
