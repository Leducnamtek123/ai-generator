'use client';

import React, { createContext, useContext, useEffect, useSyncExternalStore } from 'react';
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

export const useSocialSocket = () => useContext(SocketContext);

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

    const socketUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8000';
    
    // Connect to the 'social-hub' namespace
    const socketInstance = io(`${socketUrl}/social-hub`, {
      auth: {
        token: session.accessToken,
      },
      // Also pass via query for fallback if auth headers aren't supported by proxy
      query: {
        token: session.accessToken
      },
      transports: ['websocket'],
    });

    socketInstance.on('connect', () => {
      console.log('Connected to Social Hub WebSocket');
      updateSocketSnapshot({
        socket: socketInstance,
        isConnected: true,
      });
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from Social Hub WebSocket');
      updateSocketSnapshot({
        socket: socketInstance,
        isConnected: false,
      });
    });

    socketInstance.on('connect_error', (err) => {
      console.error('Socket Connection Error:', err.message);
      updateSocketSnapshot({
        socket: socketInstance,
        isConnected: false,
      });
    });

    // Global listener for interactions to show toasts
    socketInstance.on('interaction:created', (data) => {
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
    });

    updateSocketSnapshot({
      socket: socketInstance,
      isConnected: false,
    });

    return () => {
      socketInstance.disconnect();
      updateSocketSnapshot({
        socket: null,
        isConnected: false,
      });
    };
  }, [session?.accessToken]);

  return <SocketContext.Provider value={socketState}>{children}</SocketContext.Provider>;
};
