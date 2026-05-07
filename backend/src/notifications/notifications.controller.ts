import {
  Body,
  Controller,
  Get,
  Patch,
  Param,
  UseGuards,
  Query,
  Request,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NotificationsService } from './notifications.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'notifications',
  version: '1',
})
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async findAll(
    @Request() request,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    if (limit > 50) {
      limit = 50;
    }

    return this.notificationsService.findAllByUserId(request.user.id, {
      page,
      limit,
    });
  }

  @Get('unread-count')
  async countUnread(@Request() request) {
    const count = await this.notificationsService.countUnread(request.user.id);
    return { count };
  }

  @Get('preferences')
  async getPreferences(@Request() request) {
    return this.notificationsService.getPreferences(request.user.id);
  }

  @Patch('preferences')
  async updatePreferences(
    @Request() request,
    @Body() dto: UpdateNotificationPreferencesDto,
  ) {
    return this.notificationsService.updatePreferences(
      request.user.id,
      dto.preferences,
    );
  }

  @Patch(':id/read')
  async markAsRead(@Param('id') id: string, @Request() request) {
    return this.notificationsService.markAsRead(id, request.user.id);
  }

  @Patch('mark-all-read')
  async markAllAsRead(@Request() request) {
    await this.notificationsService.markAllAsRead(request.user.id);
    return { success: true };
  }
}
