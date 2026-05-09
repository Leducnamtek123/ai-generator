'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { toast } from 'sonner';

/**
 * Visual Flow SSE Event Types (mirror of backend VFEventType)
 */
type VFEventType =
  | 'pipeline:status'
  | 'scene:updated'
  | 'character:updated'
  | 'generation:started'
  | 'generation:completed'
  | 'generation:failed'
  | 'export:completed'
  | 'heartbeat';

interface VFEvent {
  type: VFEventType;
  projectId: string;
  videoId?: string;
  payload: Record<string, unknown>;
  timestamp: number;
}

interface CharacterUpdatePayload {
  characterId: string;
  refStatus: string;
  referenceImageUrl?: string;
  [key: string]: unknown;
}

interface SceneUpdatePayload {
  sceneId: string;
  [key: string]: unknown;
}

interface UseVisualFlowSSEOptions {
  projectId: string | null;
  enabled?: boolean;
  onEvent?: (event: VFEvent) => void;
  onReconnect?: () => void | Promise<void>;
  onCharacterUpdate?: (payload: CharacterUpdatePayload) => void;
  onSceneUpdate?: (payload: SceneUpdatePayload) => void;
  onPipelineStatus?: (payload: Record<string, unknown>) => void;
  onExportCompleted?: (payload: { outputUrl: string }) => void;
}

/**
 * Hook to connect to Visual Flow SSE endpoint for real-time pipeline updates.
 *
 * Usage:
 * ```tsx
 * useVisualFlowSSE({
 *   projectId: 'abc-123',
 *   onCharacterUpdate: (p) => updateCharacterInStore(p),
 *   onSceneUpdate: (p) => updateSceneInStore(p),
 * });
 * ```
 */
export function useVisualFlowSSE({
  projectId,
  enabled = true,
  onEvent,
  onReconnect,
  onCharacterUpdate,
  onSceneUpdate,
  onPipelineStatus,
  onExportCompleted,
}: UseVisualFlowSSEOptions) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasConnectedOnceRef = useRef(false);
  const [isConnected, setIsConnected] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const MAX_RETRIES = 5;
  const BASE_RETRY_DELAY = 2000; // 2 seconds

  const connect = useCallback(function connect() {
    if (!projectId || !enabled) return;

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    // Proxy rewrites /api/* to the backend /api/v1/* namespace.
    const url = `/api/visual-flow/projects/${projectId}/events`;
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onopen = () => {
      setIsConnected(true);
      if (hasConnectedOnceRef.current) {
        void onReconnect?.();
      }
      hasConnectedOnceRef.current = true;
      setRetryCount(0);
    };

    es.onmessage = (messageEvent) => {
      try {
        const event: VFEvent = JSON.parse(messageEvent.data);

        // Skip heartbeats for callbacks
        if (event.type === 'heartbeat') return;

        // Generic event handler
        onEvent?.(event);

        // Typed handlers
        switch (event.type) {
          case 'character:updated':
            onCharacterUpdate?.(event.payload as CharacterUpdatePayload);
            break;
          case 'scene:updated':
            onSceneUpdate?.(event.payload as SceneUpdatePayload);
            break;
          case 'pipeline:status':
            onPipelineStatus?.(event.payload);
            break;
          case 'export:completed':
            onExportCompleted?.(event.payload as { outputUrl: string });
            toast.success('Video export completed!');
            break;
          case 'generation:completed':
            toast.success(`Generation completed: ${event.payload.step}`);
            break;
          case 'generation:failed':
            toast.error(`Generation failed: ${event.payload.step}`);
            break;
        }
      } catch {
        // Ignore malformed events
      }
    };

    es.onerror = () => {
      setIsConnected(false);
      es.close();

      // Exponential backoff reconnection
      setRetryCount((prev) => {
        const next = prev + 1;
        if (next > MAX_RETRIES) {
          console.warn('SSE: Max retries reached, giving up');
          return next;
        }

        const delay = BASE_RETRY_DELAY * Math.pow(2, Math.min(next - 1, 4));
        console.log(`SSE: Reconnecting in ${delay}ms (attempt ${next}/${MAX_RETRIES})`);

        reconnectTimeoutRef.current = setTimeout(connect, delay);

        return next;
      });
    };
  }, [projectId, enabled, onEvent, onReconnect, onCharacterUpdate, onSceneUpdate, onPipelineStatus, onExportCompleted]);

  // Connect when projectId changes
  useEffect(() => {
    if (projectId && enabled) {
      connect();
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      hasConnectedOnceRef.current = false;
      setIsConnected(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, enabled]);

  return {
    isConnected,
    retryCount,
    reconnect: connect,
  };
}
