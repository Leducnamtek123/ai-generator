import { HeaderAPIKeyStrategy } from 'passport-headerapikey';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ApiKeysService } from '../../api-keys/api-keys.service';

@Injectable()
export class ApiKeyStrategy extends PassportStrategy(
  HeaderAPIKeyStrategy,
  'api-key',
) {
  constructor(private apiKeysService: ApiKeysService) {
    super({ header: 'X-API-KEY', prefix: '' }, false);
  }

  async validate(apiKey: string): Promise<any> {
    const keyRecord = await this.apiKeysService.findByKey(apiKey);
    if (!keyRecord) {
      throw new UnauthorizedException();
    }

    if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('API Key expired');
    }

    await this.apiKeysService.updateLastUsed(keyRecord.id);
    return keyRecord.user;
  }
}
