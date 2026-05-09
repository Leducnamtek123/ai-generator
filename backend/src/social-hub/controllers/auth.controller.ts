import {
  Controller,
  Get,
  Logger,
  Param,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { SocialAuthService } from '../services/auth.service';
import { Response } from 'express';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import { AllConfigType } from '../../config/config.type';
import { resolveFrontendRedirectBase } from '../utils/frontend-origin.helper';

@ApiTags('Social Auth')
@Controller({
  path: 'social-hub/auth',
  version: '1',
})
export class SocialAuthController {
  private readonly logger = new Logger(SocialAuthController.name);

  constructor(
    private readonly authService: SocialAuthService,
    private readonly configService: ConfigService<AllConfigType>,
  ) {}

  @Get(':platform')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async authenticate(
    @Param('platform') platform: string,
    @Query() query: Record<string, string>,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const url = await this.authService.getAuthUrl(platform, user, query);
    return { url };
  }

  @Get(':platform/callback')
  async callback(
    @Param('platform') platform: string,
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ): Promise<void> {
    const frontendDomain = this.configService.get<string>(
      'app.frontendDomain',
      { infer: true },
    );
    const frontendBase = resolveFrontendRedirectBase(frontendDomain);
    if (!frontendBase) {
      throw new Error('Invalid frontend domain configuration');
    }

    try {
      await this.authService.handleCallback(platform, code, state);

      // Redirect back to frontend with status
      void res.redirect(
        `${frontendBase}/social/channels?status=success&platform=${platform}`,
      );
    } catch (error) {
      this.logger.error(
        `OAuth callback failed for ${platform}: ${error?.message || error}`,
      );
      void res.redirect(
        `${frontendBase}/social/channels?status=error&platform=${platform}`,
      );
    }
  }
}
