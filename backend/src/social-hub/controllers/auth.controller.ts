import { Controller, Get, Param, Query, Res, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { SocialAuthService } from '../services/auth.service';
import { Response } from 'express';

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
    @Request() req: any,
    @Param('platform') platform: string,
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    const result = await this.authService.handleCallback(req.user, platform, code, state);
    
    // Redirect back to frontend with status
    return res.redirect(`${process.env.FRONTEND_DOMAIN}/settings?tab=account&status=success&platform=${platform}`);
  }
}
