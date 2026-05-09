'use client';

import React, { createContext, use, useEffect, useSyncExternalStore } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

interface SocketSnapshot {
  socket: Socket | null;
  isConnected: boolean;
}

const socketListeners = new Set<() => void>();

let socketSnapshot: SocketSnapshot = {
  socket: null,
  isConnected: false,
};

const subscribeToSocketStore = (listener: () => void) => {
  socketListeners.add(listener);
  return () => socketListeners.delete(listener);
};

const getSocketSnapshot = () => socketSnapshot;

const updateSocketSnapshot = (nextSnapshot: SocketSnapshot) => {
  socketSnapshot = nextSnapshot;
  socketListeners.forEach((listener) => listener());
};

const resolveSocketOrigin = () => {
  const explicitSocketUrl = process.env.NEXT_PUBLIC_WS_URL;
  if (explicitSocketUrl) return explicitSocketUrl;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  
  if (typeof window !== 'undefined') {
    const windowOrigin = window.location.origin;
    
    // If we are on localhost (standard port 80/443) but API is set to localhost:8000,
    // we should use the current window origin instead as it's likely proxied via Nginx.
    if (window.location.hostname === 'localhost' && 
        (window.location.port === '' || window.location.port === '80' || window.location.port === '443') && 
        apiUrl?.includes('localhost:8000')) {
      return windowOrigin;
    }

    // If API URL is relative or points to the current host, use window origin
    if (!apiUrl || apiUrl.startsWith('/') || apiUrl.includes(window.location.host)) {
      return windowOrigin;
    }

    try {
      return new URL(apiUrl).origin;
    } catch {
      return windowOrigin;
    }
  }

  // Server-side fallback
  return apiUrl ? new URL(apiUrl).origin : 'http://localhost:3000';
};

export const useSocialSocket = () => use(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const { data: session } = useSession();
  const socketState = useSyncExternalStore(subscribeToSocketStore, getSocketSnapshot, getSocketSnapshot);

  useEffect(() => {
    if (!session?.accessToken) {
      updateSocketSnapshot({
        socket: null,
        isConnected: false,
      });
      return;
    }

    const socketOrigin = resolveSocketOrigin();

    // Connect to the backend social-hub namespace, not the frontend origin.
    const socketInstance = io(`${socketOrigin}/social-hub`, {
      auth: {
        token: session.accessToken,
      },
      // Also pass via query for fallback if auth headers aren't supported by proxy
      query: {
        token: session.accessToken
      },
      transports: ['websocket'],
    });

    const onConnect = () => {
      console.debug('Connected to Social Hub WebSocket');
      updateSocketSnapshot({
        socket: socketInstance,
        isConnected: true,
      });
    };

    const onDisconnect = () => {
      console.debug('Disconnected from Social Hub WebSocket');
      updateSocketSnapshot({
        socket: socketInstance,
        isConnected: false,
      });
    };

    const onConnectError = (err: Error) => {
      console.warn('Social Hub WebSocket connection failed:', err.message);
      updateSocketSnapshot({
        socket: socketInstance,
        isConnected: false,
      });
    };

    // Global listener for interactions to show toasts
    const onInteractionCreated = (data: { platform: string }) => {
      // If we are not on the inbox page, show a toast
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/social/inbox')) {
        toast(`New ${data.platform} interaction!`, {
          description: `You have activity on your ${data.platform} post.`,
          action: {
            label: 'View Inbox',
            onClick: () => window.location.href = '/social/inbox'
          }
        });
      }
    };

    socketInstance.on('connect', onConnect);
    socketInstance.on('disconnect', onDisconnect);
    socketInstance.on('connect_error', onConnectError);
    socketInstance.on('interaction:created', onInteractionCreated);

    updateSocketSnapshot({
      socket: socketInstance,
      isConnected: false,
    });

    return () => {
      socketInstance.off('connect', onConnect);
      socketInstance.off('disconnect', onDisconnect);
      socketInstance.off('connect_error', onConnectError);
      socketInstance.off('interaction:created', onInteractionCreated);
      socketInstance.disconnect();
      updateSocketSnapshot({
        socket: null,
        isConnected: false,
      });
    };
  }, [session?.accessToken]);

  return <SocketContext.Provider value={socketState}>{children}</SocketContext.Provider>;
};
