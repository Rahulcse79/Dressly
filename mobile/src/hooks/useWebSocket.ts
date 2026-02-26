// ══════════════════════════════════════════════════════════════
// Dressly — useWebSocket Hook
// ══════════════════════════════════════════════════════════════

import { useEffect, useCallback, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import wsService from '@/services/websocket';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import type { WsMessage } from '@/types';

export function useWebSocket() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const addNotification = useNotificationStore((s) => s.addNotification);
  const incrementUnread = useNotificationStore((s) => s.incrementUnread);
  const [isConnected, setIsConnected] = useState(false);
  const appState = useRef(AppState.currentState);

  // ── Connect / Disconnect on auth change ─────────────────
  useEffect(() => {
    if (isAuthenticated) {
      wsService.connect();
    } else {
      wsService.disconnect();
    }
    return () => {
      wsService.disconnect();
    };
  }, [isAuthenticated]);

  // ── Handle app state changes (background / foreground) ──
  useEffect(() => {
    const sub = AppState.addEventListener(
      'change',
      (nextState: AppStateStatus) => {
        if (
          appState.current.match(/inactive|background/) &&
          nextState === 'active' &&
          isAuthenticated
        ) {
          wsService.connect();
        } else if (nextState.match(/inactive|background/)) {
          wsService.disconnect();
        }
        appState.current = nextState;
      },
    );
    return () => sub.remove();
  }, [isAuthenticated]);

  // ── Handle incoming messages ────────────────────────────
  useEffect(() => {
    const unsubMessage = wsService.onMessage((message: WsMessage) => {
      switch (message.type) {
        case 'notification': {
          const notif = message.notification as any;
          if (notif) {
            addNotification(notif);
            incrementUnread();
          }
          break;
        }
        case 'ai_complete':
        case 'ai_progress':
        case 'subscription_updated':
        case 'config_updated':
          // These are handled by specific screen components
          break;
        default:
          break;
      }
    });

    const unsubConnect = wsService.onConnect(() => {
      setIsConnected(true);
    });

    const unsubDisconnect = wsService.onDisconnect(() => {
      setIsConnected(false);
    });

    return () => {
      unsubMessage();
      unsubConnect();
      unsubDisconnect();
    };
  }, [addNotification, incrementUnread]);

  const send = useCallback((data: Record<string, unknown>) => {
    return wsService.send(data);
  }, []);

  return { isConnected, send };
}
