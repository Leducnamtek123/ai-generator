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

@ApiBearerAuth()
@ApiTags('Organizations')
@Controller({ path: 'orgs', version: '1' })
@UseGuards(AuthGuard('jwt'))
export class OrganizationsController {
  constructor(private readonly orgsService: OrganizationsService) {}

  @Post()
  create(@Request() req, @Body() dto: CreateOrganizationDto) {
    return this.orgsService.create(dto, req.user.id);
  }

  @Get()
  findAll(@Request() req) {
    return this.orgsService.findByUserId(req.user.id);
  }

  @Get(':orgSlug')
  findBySlug(@Param('orgSlug') orgSlug: string) {
    return this.orgsService.findBySlug(orgSlug);
  }

  @Get(':orgSlug/membership')
  getMembership(@Request() req, @Param('orgSlug') orgSlug: string) {
    return this.orgsService.getMembership(req.user.id, orgSlug);
  }

  @Patch(':orgSlug')
  update(
    @Request() req,
    @Param('orgSlug') orgSlug: string,
    @Body() dto: UpdateOrganizationDto,
  ) {
    return this.orgsService.update(orgSlug, req.user.id, dto);
  }

  @Delete(':orgSlug')
  shutdown(@Request() req, @Param('orgSlug') orgSlug: string) {
    return this.orgsService.shutdown(orgSlug, req.user.id);
  }

  @Patch(':orgSlug/transfer')
  transferOwnership(
    @Request() req,
    @Param('orgSlug') orgSlug: string,
    @Body() dto: TransferOwnershipDto,
  ) {
    return this.orgsService.transferOwnership(orgSlug, req.user.id, dto);
  }
}
