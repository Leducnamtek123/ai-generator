import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service';
import {
  CreateOrganizationDto,
  UpdateOrganizationDto,
  TransferOwnershipDto,
} from './dto/organization.dto';
import { PermissionsGuard } from '../permissions/permissions.guard';
import { CheckPermissions } from '../permissions/permissions.decorator';
import { OrgAction } from '../permissions/permissions';

@ApiBearerAuth()
@ApiTags('Organizations')
@Controller({ path: 'orgs', version: '1' })
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class OrganizationsController {
  constructor(private readonly orgsService: OrganizationsService) {}

  @Post()
  @CheckPermissions({ action: OrgAction.Create, subject: 'Organization' })
  create(@Request() req, @Body() dto: CreateOrganizationDto) {
    return this.orgsService.create(dto, req.user.id);
  }

  @Get()
  findAll(@Request() req) {
    return this.orgsService.findByUserId(req.user.id);
  }

  @Get(':orgSlug')
  @CheckPermissions({ action: OrgAction.Read, subject: 'Organization' })
  findBySlug(@Param('orgSlug') orgSlug: string) {
    return this.orgsService.findBySlug(orgSlug);
  }

  @Get(':orgSlug/membership')
  @CheckPermissions({ action: OrgAction.Read, subject: 'Organization' })
  getMembership(@Request() req, @Param('orgSlug') orgSlug: string) {
    return this.orgsService.getMembership(req.user.id, orgSlug);
  }

  @Patch(':orgSlug')
  @CheckPermissions({ action: OrgAction.Update, subject: 'Organization' })
  update(
    @Request() req,
    @Param('orgSlug') orgSlug: string,
    @Body() dto: UpdateOrganizationDto,
  ) {
    return this.orgsService.update(orgSlug, req.user.id, dto);
  }

  @Delete(':orgSlug')
  @CheckPermissions({ action: OrgAction.Delete, subject: 'Organization' })
  shutdown(@Request() req, @Param('orgSlug') orgSlug: string) {
    return this.orgsService.shutdown(orgSlug, req.user.id);
  }

  @Patch(':orgSlug/transfer')
  @CheckPermissions({
    action: OrgAction.TransferOwnership,
    subject: 'Organization',
  })
  transferOwnership(
    @Request() req,
    @Param('orgSlug') orgSlug: string,
    @Body() dto: TransferOwnershipDto,
  ) {
    return this.orgsService.transferOwnership(orgSlug, req.user.id, dto);
  }
}
