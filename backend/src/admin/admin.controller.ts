import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { RolesGuard } from '../roles/roles.guard';
import { AdminCatalogService } from './admin-catalog.service';
import { AdminQueueService } from './admin-queue.service';
import { ImportExternalCatalogDto } from './dto/import-external-catalog.dto';
import { UpdateAdminTemplateDto } from './dto/update-admin-template.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';
import { QueryAdminUsersDto } from './dto/query-admin-users.dto';
import { QueryAdminTemplatesDto } from './dto/query-admin-templates.dto';
import { QueryAdminAssetsDto } from './dto/query-admin-assets.dto';
import { QueryAdminWorkspacesDto } from './dto/query-admin-workspaces.dto';
import { QueryAdminAuditLogsDto } from './dto/query-admin-audit-logs.dto';
import { BulkUpdateAdminUsersDto } from './dto/bulk-update-admin-users.dto';
import { BulkUpdateAdminTemplatesDto } from './dto/bulk-update-admin-templates.dto';
import { BulkDeleteAdminAssetsDto } from './dto/bulk-delete-admin-assets.dto';
import { UpdateAdminWorkspaceDto } from './dto/update-admin-workspace.dto';
import { UpdateAdminWorkspaceMemberDto } from './dto/update-admin-workspace-member.dto';
import { TransferAdminWorkspaceDto } from './dto/transfer-admin-workspace.dto';
import { QuerySiteConfigsDto } from '../site-config/dto/query-site-configs.dto';
import { UpsertSiteConfigDto } from '../site-config/dto/upsert-site-config.dto';
import { SiteConfigService } from '../site-config/site-config.service';
import { AdminAuditService } from './admin-audit.service';

const toActor = (req: any) => ({
  id: Number(req.user?.id),
  email: req.user?.email ?? null,
  role: req.user?.role?.name ?? req.user?.role?.id ?? null,
});

@ApiBearerAuth()
@Roles(RoleEnum.admin)
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiTags('Admin')
@Controller({
  path: 'admin',
  version: '1',
})
export class AdminController {
  constructor(
    private readonly adminCatalogService: AdminCatalogService,
    private readonly siteConfigService: SiteConfigService,
    private readonly adminAuditService: AdminAuditService,
    private readonly adminQueueService: AdminQueueService,
  ) {}

  @ApiOkResponse({ description: 'Admin operational overview.' })
  @Get('overview')
  @HttpCode(HttpStatus.OK)
  getOverview() {
    return this.adminCatalogService.getOverview();
  }

  @ApiOkResponse({ description: 'Admin notification feed and alert summary.' })
  @Get('notifications')
  @HttpCode(HttpStatus.OK)
  getNotifications(@Query() query: { q?: string; severity?: string; category?: string }) {
    return this.adminCatalogService.getNotifications(query as any);
  }

  @ApiOkResponse({ description: 'Role matrix and admin guardrails.' })
  @Get('roles/matrix')
  @HttpCode(HttpStatus.OK)
  getRolesMatrix() {
    return this.adminCatalogService.getRolesMatrix();
  }

  @ApiOkResponse({ description: 'Admin user directory.' })
  @Get('users')
  @HttpCode(HttpStatus.OK)
  getUsers(@Query() query: QueryAdminUsersDto) {
    return this.adminCatalogService.getUsers(query);
  }

  @Get('users/export')
  @Header('Content-Type', 'text/csv')
  @HttpCode(HttpStatus.OK)
  async exportUsers(@Query() query: QueryAdminUsersDto) {
    return this.adminCatalogService.exportUsersCsv(query);
  }

  @ApiOkResponse({ description: 'Updated user role/status.' })
  @Patch('users/:id')
  @HttpCode(HttpStatus.OK)
  updateUser(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateAdminUserDto,
  ) {
    return this.adminCatalogService.updateUser(Number(id), dto, toActor(req));
  }

  @Post('users/bulk')
  @HttpCode(HttpStatus.OK)
  bulkUpdateUsers(@Request() req: any, @Body() dto: BulkUpdateAdminUsersDto) {
    return this.adminCatalogService.bulkUpdateUsers(dto, toActor(req));
  }

  @ApiOkResponse({ description: 'Admin workspace directory.' })
  @Get('workspaces')
  @HttpCode(HttpStatus.OK)
  getWorkspaces(@Query() query: QueryAdminWorkspacesDto) {
    return this.adminCatalogService.getWorkspaces(query);
  }

  @Get('workspaces/export')
  @Header('Content-Type', 'text/csv')
  @HttpCode(HttpStatus.OK)
  async exportWorkspaces(@Query() query: QueryAdminWorkspacesDto) {
    return this.adminCatalogService.exportWorkspacesCsv(query);
  }

  @Get('workspaces/:id')
  @HttpCode(HttpStatus.OK)
  getWorkspace(@Param('id') id: string) {
    return this.adminCatalogService.getWorkspaceDetail(id);
  }

  @Patch('workspaces/:id')
  @HttpCode(HttpStatus.OK)
  updateWorkspace(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateAdminWorkspaceDto,
  ) {
    return this.adminCatalogService.updateWorkspace(id, dto, toActor(req));
  }

  @Post('workspaces/:id/transfer-owner')
  @HttpCode(HttpStatus.OK)
  transferWorkspaceOwner(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: TransferAdminWorkspaceDto,
  ) {
    return this.adminCatalogService.updateWorkspaceOwner(id, dto.memberId, toActor(req));
  }

  @Get('workspaces/:id/members')
  @HttpCode(HttpStatus.OK)
  getWorkspaceMembers(@Param('id') id: string) {
    return this.adminCatalogService.getWorkspaceMembers(id);
  }

  @Patch('workspaces/:id/members/:memberId')
  @HttpCode(HttpStatus.OK)
  updateWorkspaceMember(
    @Request() req: any,
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateAdminWorkspaceMemberDto,
  ) {
    return this.adminCatalogService.updateWorkspaceMemberRole(
      id,
      memberId,
      dto,
      toActor(req),
    );
  }

  @Delete('workspaces/:id/members/:memberId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeWorkspaceMember(
    @Request() req: any,
    @Param('id') id: string,
    @Param('memberId') memberId: string,
  ) {
    return this.adminCatalogService.removeWorkspaceMember(id, memberId, toActor(req));
  }

  @ApiOkResponse({ description: 'Admin asset directory.' })
  @Get('assets')
  @HttpCode(HttpStatus.OK)
  getAssets(@Query() query: QueryAdminAssetsDto) {
    return this.adminCatalogService.getAssets(query);
  }

  @Get('assets/export')
  @Header('Content-Type', 'text/csv')
  @HttpCode(HttpStatus.OK)
  async exportAssets(@Query() query: QueryAdminAssetsDto) {
    return this.adminCatalogService.exportAssetsCsv(query);
  }

  @Post('assets/bulk-delete')
  @HttpCode(HttpStatus.OK)
  bulkDeleteAssets(
    @Request() req: any,
    @Body() dto: BulkDeleteAdminAssetsDto,
  ) {
    return this.adminCatalogService.bulkDeleteAssets(dto, toActor(req));
  }

  @Delete('assets/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeAsset(@Request() req: any, @Param('id') id: string) {
    return this.adminCatalogService.removeAsset(id, toActor(req));
  }

  @ApiOkResponse({ description: 'Admin template moderation queue.' })
  @Get('templates')
  @HttpCode(HttpStatus.OK)
  getTemplates(@Query() query: QueryAdminTemplatesDto) {
    return this.adminCatalogService.getTemplates(query);
  }

  @Get('templates/export')
  @Header('Content-Type', 'text/csv')
  @HttpCode(HttpStatus.OK)
  async exportTemplates(@Query() query: QueryAdminTemplatesDto) {
    return this.adminCatalogService.exportTemplatesCsv(query);
  }

  @Patch('templates/:id')
  @HttpCode(HttpStatus.OK)
  updateTemplate(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateAdminTemplateDto,
  ) {
    return this.adminCatalogService.updateTemplate(id, dto, toActor(req));
  }

  @Post('templates/bulk')
  @HttpCode(HttpStatus.OK)
  bulkUpdateTemplates(
    @Request() req: any,
    @Body() dto: BulkUpdateAdminTemplatesDto,
  ) {
    return this.adminCatalogService.bulkUpdateTemplates(dto as any, toActor(req));
  }

  @Delete('templates/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeTemplate(@Request() req: any, @Param('id') id: string) {
    return this.adminCatalogService.removeTemplate(id, toActor(req));
  }

  @ApiOkResponse({ description: 'Admin site config directory.' })
  @Get('site-configs')
  @HttpCode(HttpStatus.OK)
  getSiteConfigs(@Query() query: QuerySiteConfigsDto) {
    return this.siteConfigService.list(query);
  }

  @Patch('site-configs/:key')
  @HttpCode(HttpStatus.OK)
  async upsertSiteConfig(
    @Request() req: any,
    @Param('key') key: string,
    @Body() dto: UpsertSiteConfigDto,
  ) {
    const actor = toActor(req);
    const before = await this.siteConfigService.getByKey(key, dto.locale);
    const after = await this.siteConfigService.upsert(key, dto, actor.id);

    await this.adminAuditService.record({
      actor,
      action: 'admin.site_config.update',
      entityType: 'site_config',
      entityId: after.id,
      entityName: `${after.key}:${after.locale}`,
      before: before ? { ...before, createdAt: before.createdAt?.toISOString?.() ?? before.createdAt, updatedAt: before.updatedAt?.toISOString?.() ?? before.updatedAt } : null,
      after: {
        ...after,
        createdAt: after.createdAt?.toISOString?.() ?? after.createdAt,
        updatedAt: after.updatedAt?.toISOString?.() ?? after.updatedAt,
      },
      meta: {
        key: after.key,
        locale: after.locale,
      },
    });

    return after;
  }

  @ApiOkResponse({ description: 'Admin activity logs.' })
  @Get('audit-logs')
  @HttpCode(HttpStatus.OK)
  getAuditLogs(@Query() query: QueryAdminAuditLogsDto) {
    return this.adminCatalogService.getAuditLogs(query);
  }

  @Get('audit-logs/export')
  @Header('Content-Type', 'text/csv')
  @HttpCode(HttpStatus.OK)
  async exportAuditLogs(@Query() query: QueryAdminAuditLogsDto) {
    return this.adminCatalogService.exportAuditLogs(query);
  }

  @ApiOkResponse({ description: 'Admin queue snapshot.' })
  @Get('queues')
  @HttpCode(HttpStatus.OK)
  getQueues() {
    return this.adminQueueService.getQueueSnapshot();
  }

  @ApiOkResponse({ description: 'Dead-letter queue job summaries.' })
  @Get('queues/dead-letter')
  @HttpCode(HttpStatus.OK)
  listDeadLetterJobs() {
    return this.adminQueueService.listDeadLetterJobs();
  }

  @ApiOkResponse({ description: 'Recovered a dead-letter queue job.' })
  @Post('queues/dead-letter/:jobId/requeue')
  @HttpCode(HttpStatus.OK)
  recoverDeadLetterJob(@Param('jobId') jobId: string) {
    return this.adminQueueService.recoverDeadLetterJob(jobId);
  }

  @ApiOkResponse({ description: 'External catalog source configuration.' })
  @Get('catalog/sources')
  @HttpCode(HttpStatus.OK)
  getCatalogSources() {
    return this.adminCatalogService.getSources();
  }

  @ApiOkResponse({ description: 'External catalog import result.' })
  @Post('catalog/import')
  @HttpCode(HttpStatus.OK)
  importCatalog(@Request() req: any, @Body() dto: ImportExternalCatalogDto) {
    return this.adminCatalogService.importExternalCatalog(dto, toActor(req));
  }
}
