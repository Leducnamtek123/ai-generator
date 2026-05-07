import { BadRequestException, ForbiddenException } from '@nestjs/common';
import crypto from 'crypto';
import { FacebookMessengerController } from './facebook-messenger.controller';
import { MessengerService } from '../services/messenger.service';
import { SocialAccountEntity } from '../infrastructure/persistence/relational/entities/social-account.entity';
import { ConfigService } from '@nestjs/config';

describe('FacebookMessengerController', () => {
  const messengerService = {
    parseAndProcessEvents: jest.fn(),
  } as unknown as jest.Mocked<MessengerService>;

  const configService = {
    get: jest.fn((key: string) => {
      if (key === 'MESSENGER_TRIGGER_ENABLED') return 'true';
      if (key === 'facebook.appSecret') return 'super-secret';
      return undefined;
    }),
  } as unknown as jest.Mocked<ConfigService>;

  const socialAccountRepository = {
    findOne: jest.fn(),
  } as unknown as jest.Mocked<{
    findOne: jest.Mock;
  }>;

  const controller = new FacebookMessengerController(
    messengerService,
    configService,
    socialAccountRepository as unknown as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should reject missing signatures', async () => {
    await expect(
      controller.handleWebhook('1', { foo: 'bar' }, undefined),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should reject invalid signatures', async () => {
    await expect(
      controller.handleWebhook('1', { foo: 'bar' }, 'sha256=bad'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('should accept valid signatures and queue event processing', async () => {
    const payload = { foo: 'bar' };
    const rawBody = Buffer.from(JSON.stringify(payload));
    const signature =
      'sha256=' +
      crypto
        .createHmac('sha256', 'super-secret')
        .update(rawBody)
        .digest('hex');

    socialAccountRepository.findOne.mockResolvedValue({
      id: 1,
      metadata: {},
    } as SocialAccountEntity);

    messengerService.parseAndProcessEvents.mockResolvedValue(undefined);

    const result = await controller.handleWebhook('1', payload, signature, {
      rawBody,
    } as never);

    expect(result).toEqual({ status: 'received' });
    expect(messengerService.parseAndProcessEvents).toHaveBeenCalledWith(
      payload,
      expect.objectContaining({ id: 1 }),
    );
  });
});
