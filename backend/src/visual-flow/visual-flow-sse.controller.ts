import { Controller, Sse, Param, UseGuards, Request, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { VisualFlowEventsService } from './services/visual-flow-events.service';

/**
 * SSE Controller for Visual Flow real-time events.
 *
 * Clients connect via GET /visual-flow/projects/:id/events
 * and receive server-sent events for pipeline status changes.
 */
@ApiTags('Visual Flow SSE')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('visual-flow')
export class VisualFlowSseController {
  private readonly logger = new Logger(VisualFlowSseController.name);

  constructor(private readonly eventsService: VisualFlowEventsService) {}

  @Sse('projects/:id/events')
  @ApiOperation({
    summary: 'SSE stream for real-time pipeline updates',
    description:
      'Server-Sent Events endpoint. Connect to receive real-time status updates ' +
      'for generation pipeline progress, scene updates, and export completion.',
  })
  streamEvents(
    @Param('id') projectId: string,
    @Request() req: any,
  ): Observable<MessageEvent> {
    const userId = req.user?.id ?? 'anonymous';
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
