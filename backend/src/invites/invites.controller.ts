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

  @Post('workspaces/:workspaceSlug/invites')
  create(
    @Request() req,
    @Param('workspaceSlug') workspaceSlug: string,
    @Body() dto: CreateInviteDto,
  ) {
    return this.invitesService.create(workspaceSlug, req.user.id, dto);
  }

  @Get('workspaces/:workspaceSlug/invites')
  findByOrg(@Request() req, @Param('workspaceSlug') workspaceSlug: string) {
    return this.invitesService.findByWorkspace(workspaceSlug, req.user.id);
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

  @Delete('workspaces/:workspaceSlug/invites/:inviteId')
  revoke(
    @Request() req,
    @Param('workspaceSlug') workspaceSlug: string,
    @Param('inviteId') inviteId: string,
  ) {
    return this.invitesService.revoke(inviteId, workspaceSlug, req.user.id);
  }
}
