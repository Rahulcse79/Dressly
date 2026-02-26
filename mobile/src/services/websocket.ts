// ══════════════════════════════════════════════════════════════
// Dressly — WebSocket Service with Auto-Reconnect
// ══════════════════════════════════════════════════════════════

import * as SecureStore from 'expo-secure-store';
import { WS_BASE_URL, WS_CONFIG, STORAGE_KEYS } from '@/constants';
import type { WsMessage } from '@/types';

type MessageHandler = (message: WsMessage) => void;
type ConnectionHandler = () => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private messageHandlers: Set<MessageHandler> = new Set();
  private connectHandlers: Set<ConnectionHandler> = new Set();
  private disconnectHandlers: Set<ConnectionHandler> = new Set();
  private isIntentionalClose = false;
  private url: string | null = null;

  // ── Connect ─────────────────────────────────────────────
  async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    const token = await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
    if (!token) {
      console.warn('[WS] No access token — skipping connection');
      return;
    }

    this.isIntentionalClose = false;
    this.url = `${WS_BASE_URL}?token=${encodeURIComponent(token)}`;

    this.createConnection();
  }

  private createConnection(): void {
    if (!this.url) return;

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('[WS] Connected');
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        this.connectHandlers.forEach((h) => h());
      };

      this.ws.onmessage = (event: MessageEvent) => {
        try {
          const message: WsMessage = JSON.parse(event.data as string);
          if (message.type === 'pong') return; // Silent heartbeat ack
          this.messageHandlers.forEach((h) => h(message));
        } catch (err) {
          console.warn('[WS] Failed to parse message:', err);
        }
      };

      this.ws.onerror = (event: Event) => {
        console.error('[WS] Error:', event);
      };

      this.ws.onclose = (event: CloseEvent) => {
        console.log(`[WS] Closed: code=${event.code} reason=${event.reason}`);
        this.stopHeartbeat();
        this.disconnectHandlers.forEach((h) => h());

        if (!this.isIntentionalClose) {
          this.scheduleReconnect();
        }
      };
    } catch (err) {
      console.error('[WS] Connection failed:', err);
      this.scheduleReconnect();
    }
  }

  // ── Reconnect with Exponential Backoff + Jitter ─────────
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= WS_CONFIG.RECONNECT_MAX_ATTEMPTS) {
      console.warn('[WS] Max reconnect attempts reached');
      return;
    }

    const baseDelay = Math.min(
      WS_CONFIG.RECONNECT_BASE_DELAY * Math.pow(2, this.reconnectAttempts),
      WS_CONFIG.RECONNECT_MAX_DELAY,
    );

    // Add jitter to prevent thundering herd
    const jitter = baseDelay * WS_CONFIG.JITTER_FACTOR * Math.random();
    const delay = baseDelay + jitter;

    console.log(
      `[WS] Reconnecting in ${Math.round(delay)}ms (attempt ${this.reconnectAttempts + 1})`,
    );

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++;
      this.createConnection();
    }, delay);
  }

  // ── Heartbeat ───────────────────────────────────────────
  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      this.send({ type: 'ping' });
    }, WS_CONFIG.HEARTBEAT_INTERVAL);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // ── Send ────────────────────────────────────────────────
  send(data: Record<string, unknown>): boolean {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
      return true;
    }
    return false;
  }

  // ── Disconnect ──────────────────────────────────────────
  disconnect(): void {
    this.isIntentionalClose = true;

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    this.stopHeartbeat();

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }

    this.reconnectAttempts = 0;
  }

  // ── Event Handlers ──────────────────────────────────────
  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  onConnect(handler: ConnectionHandler): () => void {
    this.connectHandlers.add(handler);
    return () => this.connectHandlers.delete(handler);
  }

  onDisconnect(handler: ConnectionHandler): () => void {
    this.disconnectHandlers.add(handler);
    return () => this.disconnectHandlers.delete(handler);
  }

  // ── State ───────────────────────────────────────────────
  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  get readyState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }

  // ── Cleanup ─────────────────────────────────────────────
  removeAllHandlers(): void {
    this.messageHandlers.clear();
    this.connectHandlers.clear();
    this.disconnectHandlers.clear();
  }
}

// Singleton instance
export const wsService = new WebSocketService();
export default wsService;
