import { Injectable, Logger } from '@nestjs/common';
import { Subject, Observable, filter, map } from 'rxjs';

/**
 * Visual Flow Events Service
 *
 * Manages Server-Sent Events (SSE) for real-time pipeline status updates.
 * Uses RxJS Subject for fan-out to multiple connected clients.
 *
 * Events are scoped by projectId so clients only receive relevant updates.
 */

// ─────────────────────────────────────────────
// Event Types
// ─────────────────────────────────────────────

export type VFEventType =
  | 'pipeline:status'      // Full pipeline status refresh
  | 'scene:updated'        // Single scene status change
  | 'character:updated'    // Character ref status change
  | 'generation:started'   // A generation step started
  | 'generation:completed' // A generation step completed
  | 'generation:failed'    // A generation step failed
  | 'export:completed'     // Concat/export finished
  | 'heartbeat';           // Keep-alive

export interface VFEvent {
  type: VFEventType;
  projectId: string;
  videoId?: string;
  payload: Record<string, any>;
  timestamp: number;
}

// ─────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────

@Injectable()
export class VisualFlowEventsService {
  private readonly logger = new Logger(VisualFlowEventsService.name);
  private readonly events$ = new Subject<VFEvent>();

  /**
   * Get an observable filtered by projectId for SSE streaming.
   */
  getProjectStream(projectId: string): Observable<MessageEvent> {
    return this.events$.pipe(
      filter((event) => event.projectId === projectId || event.type === 'heartbeat'),
      map((event) => ({
        data: JSON.stringify(event),
        type: event.type,
        id: `${event.timestamp}`,
      } as unknown as MessageEvent)),
    );
  }

  /**
   * Emit a pipeline status update.
   */
  emitPipelineStatus(projectId: string, videoId: string, status: Record<string, any>) {
    this.emit({
      type: 'pipeline:status',
      projectId,
      videoId,
      payload: status,
    });
  }

  /**
   * Emit a scene update (image/video status change).
   */
  emitSceneUpdate(projectId: string, videoId: string, sceneId: string, updates: Record<string, any>) {
    this.emit({
      type: 'scene:updated',
      projectId,
      videoId,
      payload: { sceneId, ...updates },
    });
  }

  /**
   * Emit a character reference image status change.
   */
  emitCharacterUpdate(projectId: string, characterId: string, updates: Record<string, any>) {
    this.emit({
      type: 'character:updated',
      projectId,
      payload: { characterId, ...updates },
    });
  }

  /**
   * Emit a generation step event (started/completed/failed).
   */
  emitGenerationEvent(
    type: 'generation:started' | 'generation:completed' | 'generation:failed',
    projectId: string,
    videoId: string,
    step: string,
    details?: Record<string, any>,
  ) {
    this.emit({
      type,
      projectId,
      videoId,
      payload: { step, ...details },
    });
  }

  /**
   * Emit an export completion event.
   */
  emitExportCompleted(projectId: string, videoId: string, outputUrl: string) {
    this.emit({
      type: 'export:completed',
      projectId,
      videoId,
      payload: { outputUrl },
    });
  }

  /**
   * Low-level emit — attaches timestamp.
   */
  private emit(event: Omit<VFEvent, 'timestamp'>) {
    const fullEvent: VFEvent = {
      ...event,
      timestamp: Date.now(),
    };
    this.logger.debug(`SSE event [${event.type}] project=${event.projectId}`);
    this.events$.next(fullEvent);
  }

  /**
   * Start heartbeat interval to keep SSE connections alive.
   * Returns a cleanup function.
   */
  startHeartbeat(projectId: string, intervalMs = 30000): () => void {
    const timer = setInterval(() => {
      this.events$.next({
        type: 'heartbeat',
        projectId,
        payload: {},
        timestamp: Date.now(),
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }
}
