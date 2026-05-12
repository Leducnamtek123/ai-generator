import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { MembersService } from './members.service';
import { UpdateMemberDto } from './dto/member.dto';

@ApiBearerAuth()
@ApiTags('Members')
@Controller({ path: 'workspaces/:workspaceSlug/members', version: '1' })
@UseGuards(AuthGuard('jwt'))
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Get()
  findAll(@Request() req, @Param('workspaceSlug') workspaceSlug: string) {
    return this.membersService.findByWorkspace(workspaceSlug, req.user.id);
  }

  @Patch(':memberId')
  updateRole(
    @Request() req,
    @Param('workspaceSlug') workspaceSlug: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberDto,
  ) {
    return this.membersService.updateRole(
      workspaceSlug,
      memberId,
      req.user.id,
      dto,
    );
  }

  @Delete(':memberId')
  remove(
    @Request() req,
    @Param('workspaceSlug') workspaceSlug: string,
    @Param('memberId') memberId: string,
  ) {
    return this.membersService.removeMember(
      workspaceSlug,
      memberId,
      req.user.id,
    );
  }
}
