import {
  Controller,
  Sse,
  Param,
  UseGuards,
  Request,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { VisualFlowEventsService } from './services/visual-flow-events.service';
import { VisualFlowService } from './visual-flow.service';

/**
 * SSE Controller for Visual Flow real-time events.
 *
 * Clients connect via GET /visual-flow/projects/:id/events
 * and receive server-sent events for pipeline status changes.
 */
@ApiTags('Visual Flow SSE')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'visual-flow', version: '1' })
export class VisualFlowSseController {
  private readonly logger = new Logger(VisualFlowSseController.name);

  constructor(
    private readonly eventsService: VisualFlowEventsService,
    private readonly visualFlowService: VisualFlowService,
  ) {}

  @Sse('projects/:id/events')
  @ApiOperation({
    summary: 'SSE stream for real-time pipeline updates',
    description:
      'Server-Sent Events endpoint. Connect to receive real-time status updates ' +
      'for generation pipeline progress, scene updates, and export completion.',
  })
  async streamEvents(
    @Param('id') projectId: string,
    @Request() req: any,
  ): Promise<Observable<MessageEvent>> {
    const userId = req.user?.id ?? 'anonymous';
    await this.visualFlowService.findOneProject(projectId, userId);
    this.logger.log(`SSE connected: project=${projectId} user=${userId}`);

    // Start heartbeat to keep the connection alive
    const stopHeartbeat = this.eventsService.startHeartbeat(projectId);

    // Cleanup on disconnect
    req.on('close', () => {
      this.logger.log(`SSE disconnected: project=${projectId} user=${userId}`);
      stopHeartbeat();
    });

    return this.eventsService.getProjectStream(projectId);
  }
}
