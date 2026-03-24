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
@Controller({ path: 'orgs/:orgSlug/members', version: '1' })
@UseGuards(AuthGuard('jwt'))
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Get()
  findAll(@Request() req, @Param('orgSlug') orgSlug: string) {
    return this.membersService.findByOrganization(orgSlug, req.user.id);
  }

  @Patch(':memberId')
  updateRole(
    @Request() req,
    @Param('orgSlug') orgSlug: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberDto,
  ) {
    return this.membersService.updateRole(orgSlug, memberId, req.user.id, dto);
  }

  @Delete(':memberId')
  remove(
    @Request() req,
    @Param('orgSlug') orgSlug: string,
    @Param('memberId') memberId: string,
  ) {
    return this.membersService.removeMember(orgSlug, memberId, req.user.id);
  }
}
