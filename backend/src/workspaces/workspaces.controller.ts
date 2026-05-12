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
import { WorkspacesService } from './workspaces.service';
import {
  CreateWorkspaceDto,
  UpdateWorkspaceDto,
  TransferWorkspaceOwnershipDto,
} from './dto/workspace.dto';
import { PermissionsGuard } from '../permissions/permissions.guard';
import { CheckPermissions } from '../permissions/permissions.decorator';
import { WorkspaceAction } from '../permissions/permissions';

@ApiBearerAuth()
@ApiTags('Workspaces')
@Controller({ path: 'workspaces', version: '1' })
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Post()
  @CheckPermissions({ action: WorkspaceAction.Create, subject: 'Workspace' })
  create(@Request() req, @Body() dto: CreateWorkspaceDto) {
    return this.workspacesService.create(dto, req.user.id);
  }

  @Get()
  findAll(@Request() req) {
    return this.workspacesService.findByUserId(req.user.id);
  }

  @Get(':workspaceSlug')
  @CheckPermissions({ action: WorkspaceAction.Read, subject: 'Workspace' })
  findBySlug(@Param('workspaceSlug') workspaceSlug: string) {
    return this.workspacesService.findBySlug(workspaceSlug);
  }

  @Get(':workspaceSlug/membership')
  @CheckPermissions({ action: WorkspaceAction.Read, subject: 'Workspace' })
  getMembership(@Request() req, @Param('workspaceSlug') workspaceSlug: string) {
    return this.workspacesService.getMembership(req.user.id, workspaceSlug);
  }

  @Patch(':workspaceSlug')
  @CheckPermissions({ action: WorkspaceAction.Update, subject: 'Workspace' })
  update(
    @Request() req,
    @Param('workspaceSlug') workspaceSlug: string,
    @Body() dto: UpdateWorkspaceDto,
  ) {
    return this.workspacesService.update(workspaceSlug, req.user.id, dto);
  }

  @Delete(':workspaceSlug')
  @CheckPermissions({ action: WorkspaceAction.Delete, subject: 'Workspace' })
  shutdown(@Request() req, @Param('workspaceSlug') workspaceSlug: string) {
    return this.workspacesService.shutdown(workspaceSlug, req.user.id);
  }

  @Patch(':workspaceSlug/transfer')
  @CheckPermissions({
    action: WorkspaceAction.TransferOwnership,
    subject: 'Workspace',
  })
  transferOwnership(
    @Request() req,
    @Param('workspaceSlug') workspaceSlug: string,
    @Body() dto: TransferWorkspaceOwnershipDto,
  ) {
    return this.workspacesService.transferOwnership(workspaceSlug, req.user.id, dto);
  }
}
