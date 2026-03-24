import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { InvitesService } from './invites.service';
import { CreateInviteDto } from '../members/dto/member.dto';

@ApiBearerAuth()
@ApiTags('Invites')
@Controller({ version: '1' })
@UseGuards(AuthGuard('jwt'))
export class InvitesController {
  constructor(private readonly invitesService: InvitesService) {}

  @Post('orgs/:orgSlug/invites')
  create(
    @Request() req,
    @Param('orgSlug') orgSlug: string,
    @Body() dto: CreateInviteDto,
  ) {
    return this.invitesService.create(orgSlug, req.user.id, dto);
  }

  @Get('orgs/:orgSlug/invites')
  findByOrg(@Request() req, @Param('orgSlug') orgSlug: string) {
    return this.invitesService.findByOrganization(orgSlug, req.user.id);
  }

  @Get('invites/pending')
  findPending(@Request() req) {
    return this.invitesService.findPendingForUser(req.user.email);
  }

  @Post('invites/:inviteId/accept')
  accept(@Request() req, @Param('inviteId') inviteId: string) {
    return this.invitesService.accept(inviteId, req.user.id, req.user.email);
  }

  @Post('invites/:inviteId/reject')
  reject(@Request() req, @Param('inviteId') inviteId: string) {
    return this.invitesService.reject(inviteId, req.user.email);
  }

  @Delete('orgs/:orgSlug/invites/:inviteId')
  revoke(
    @Request() req,
    @Param('orgSlug') orgSlug: string,
    @Param('inviteId') inviteId: string,
  ) {
    return this.invitesService.revoke(inviteId, orgSlug, req.user.id);
  }
}
