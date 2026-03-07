// ══════════════════════════════════════════════════════════════
// Dressly Web — WebSocket Service (1:1 per user)
// Auto-reconnect, heartbeat, typed message handlers
// Matches backend: WsClientMessage / WsServerMessage
// ══════════════════════════════════════════════════════════════

import { getWsUrl } from './api';

class WebSocketService {
  constructor() {
    this.ws = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 1000;
    this.heartbeatInterval = null;
    this.isManualClose = false;
    this.connected = false;
  }

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) return;
    this.isManualClose = false;

    try {
      const url = getWsUrl();
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log('[WS] Connected');
        this.connected = true;
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        this.emit('connection', { status: 'connected' });
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (e) {
          console.error('[WS] Failed to parse message:', e);
        }
      };

      this.ws.onclose = (event) => {
        console.log('[WS] Disconnected:', event.code, event.reason);
        this.connected = false;
        this.stopHeartbeat();
        this.emit('connection', { status: 'disconnected' });

        if (!this.isManualClose && this.reconnectAttempts < this.maxReconnectAttempts) {
          const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
          console.log(`[WS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);
          setTimeout(() => {
            this.reconnectAttempts++;
            this.connect();
          }, delay);
        }
      };

      this.ws.onerror = (error) => {
        console.error('[WS] Error:', error);
        this.emit('connection', { status: 'error' });
      };
    } catch (e) {
      console.error('[WS] Failed to create connection:', e);
    }
  }

  disconnect() {
    this.isManualClose = true;
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close(1000, 'User logout');
      this.ws = null;
    }
    this.connected = false;
    this.reconnectAttempts = 0;
  }

  // Send typed client messages matching backend WsClientMessage
  send(message) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  sendPing() {
    this.send({ type: 'ping' });
  }

  subscribe(channel) {
    this.send({ type: 'subscribe', channel });
  }

  unsubscribe(channel) {
    this.send({ type: 'unsubscribe', channel });
  }

  // Heartbeat — send ping every 25s matching backend's heartbeat_interval
  startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      this.sendPing();
    }, 25000);
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // Route server messages to typed handlers
  handleMessage(message) {
    switch (message.type) {
      case 'connected':
        this.emit('connected', message);
        break;
      case 'pong':
        // heartbeat response
        break;
      case 'notification':
        this.emit('notification', message.data);
        break;
      case 'ai_progress':
        this.emit('ai_progress', message);
        break;
      case 'ai_complete':
        this.emit('ai_complete', message);
        break;
      case 'subscription_updated':
        this.emit('subscription_updated', message.data);
        break;
      case 'config_updated':
        this.emit('config_updated', { key: message.key, value: message.value });
        break;
      case 'error':
        console.error('[WS] Server error:', message.message);
        this.emit('error', message);
        break;
      default:
        console.log('[WS] Unknown message type:', message.type);
    }
  }

  // Event emitter pattern
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    const cbs = this.listeners.get(event);
    if (cbs) {
      this.listeners.set(event, cbs.filter((cb) => cb !== callback));
    }
  }

  emit(event, data) {
    const cbs = this.listeners.get(event);
    if (cbs) {
      cbs.forEach((cb) => {
        try { cb(data); }
        catch (e) { console.error(`[WS] Listener error for ${event}:`, e); }
      });
    }
  }

  isConnected() {
    return this.connected && this.ws?.readyState === WebSocket.OPEN;
  }
}

// Singleton — 1 WebSocket connection per browser tab
const wsService = new WebSocketService();
export default wsService;
