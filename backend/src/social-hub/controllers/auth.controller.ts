import { Controller, Get, Param, Query, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { SocialAuthService } from '../services/auth.service';
import { Response } from 'express';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import { UserEntity } from '../../users/infrastructure/persistence/relational/entities/user.entity';

@ApiTags('Social Auth')
@Controller({
  path: 'social-hub/auth',
  version: '1',
})
export class SocialAuthController {
  constructor(private readonly authService: SocialAuthService) {}

  @Get(':platform')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async authenticate(
    @Param('platform') platform: string,
    @Query() query: Record<string, string>,
  ) {
    const url = await this.authService.getAuthUrl(platform, query);
    return { url };
  }

  @Get(':platform/callback')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async callback(
    @CurrentUser() user: AuthenticatedUser,
    @Param('platform') platform: string,
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ): Promise<void> {
    await this.authService.handleCallback(
      user as unknown as UserEntity,
      platform,
      code,
      state,
    );

    // Redirect back to frontend with status
    void res.redirect(
      `${process.env.FRONTEND_DOMAIN}/settings?tab=account&status=success&platform=${platform}`,
    );
  }
}
