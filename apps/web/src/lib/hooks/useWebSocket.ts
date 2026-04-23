'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import type { WsEventMap } from '@Noblesse/shared';

// ─── Singleton socket instance ─────────────────────────────────────────────

let socketInstance: Socket | null = null;
let currentToken: string | null = null;

function getSocket(token: string): Socket {
  if (socketInstance && currentToken === token && socketInstance.connected) {
    return socketInstance;
  }

  // Disconnect stale socket
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

  socketInstance = io(`${apiUrl}/ws`, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  currentToken = token;
  return socketInstance;
}

// ─── Main hook ─────────────────────────────────────────────────────────────

export interface UseWebSocketOptions {
  /** If provided, the hook will emit join:property for this propertyId */
  propertyId?: string;
  /** Called when socket connects */
  onConnect?: () => void;
  /** Called when socket disconnects */
  onDisconnect?: () => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { propertyId, onConnect, onDisconnect } = options;
  const accessToken = useAuthStore((s) => s.tokens?.accessToken ?? null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!accessToken) return;

    const socket = getSocket(accessToken);
    socketRef.current = socket;

    const handleConnect = () => {
      if (propertyId) {
        socket.emit('join:property', { propertyId });
      }
      onConnect?.();
    };

    const handleDisconnect = () => {
      onDisconnect?.();
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    // If already connected, join property immediately
    if (socket.connected && propertyId) {
      socket.emit('join:property', { propertyId });
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, [accessToken, propertyId, onConnect, onDisconnect]);

  const on = useCallback(
    <K extends keyof WsEventMap>(event: K, handler: (data: WsEventMap[K]) => void) => {
      socketRef.current?.on(event as string, handler as (data: unknown) => void);
    },
    [],
  );

  const off = useCallback(
    <K extends keyof WsEventMap>(event: K, handler: (data: WsEventMap[K]) => void) => {
      socketRef.current?.off(event as string, handler as (data: unknown) => void);
    },
    [],
  );

  const emit = useCallback(
    <K extends keyof WsEventMap>(event: K, data?: WsEventMap[K]) => {
      socketRef.current?.emit(event as string, data);
    },
    [],
  );

  return { on, off, emit, socket: socketRef };
}

// ─── Convenience hook: auto-invalidate queries on WS events ───────────────

export function useWebSocketQuerySync(propertyId?: string) {
  const queryClient = useQueryClient();
  const { on, off } = useWebSocket({ propertyId });

  useEffect(() => {
    const handleRoomStatusChanged = () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['front-desk'] });
    };

    const handleReservationCreated = () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['front-desk'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    };

    const handleReservationUpdated = () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['front-desk'] });
    };

    const handleReservationCancelled = () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['front-desk'] });
    };

    const handleHousekeepingTaskUpdated = () => {
      queryClient.invalidateQueries({ queryKey: ['housekeeping'] });
    };

    const handleNotificationNew = () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    };

    on('room:status_changed', handleRoomStatusChanged);
    on('reservation:created', handleReservationCreated);
    on('reservation:updated', handleReservationUpdated);
    on('reservation:cancelled', handleReservationCancelled);
    on('housekeeping:task_updated', handleHousekeepingTaskUpdated);
    on('notification:new', handleNotificationNew);

    return () => {
      off('room:status_changed', handleRoomStatusChanged);
      off('reservation:created', handleReservationCreated);
      off('reservation:updated', handleReservationUpdated);
      off('reservation:cancelled', handleReservationCancelled);
      off('housekeeping:task_updated', handleHousekeepingTaskUpdated);
      off('notification:new', handleNotificationNew);
    };
  }, [on, off, queryClient]);
}

// ─── Connection status hook ────────────────────────────────────────────────

import { useState } from 'react';

export function useWebSocketStatus() {
  const [connected, setConnected] = useState(false);

  useWebSocket({
    onConnect: () => setConnected(true),
    onDisconnect: () => setConnected(false),
  });

  return connected;
}