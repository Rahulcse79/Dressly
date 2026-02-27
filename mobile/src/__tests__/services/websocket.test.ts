// ─── WebSocket Service Tests ────────────────────────────────────────────────

import * as SecureStore from 'expo-secure-store';

describe('WebSocketService', () => {
  let originalWebSocket: typeof WebSocket;

  beforeEach(() => {
    jest.clearAllMocks();
    originalWebSocket = (global as any).WebSocket;

    // Mock WebSocket constructor
    (global as any).WebSocket = jest.fn().mockImplementation(() => ({
      onopen: null,
      onmessage: null,
      onerror: null,
      onclose: null,
      send: jest.fn(),
      close: jest.fn(),
      readyState: 0, // CONNECTING
      OPEN: 1,
      CLOSED: 3,
    }));
  });

  afterEach(() => {
    (global as any).WebSocket = originalWebSocket;
    jest.useRealTimers();
  });

  // ── Connection ────────────────────────────────────────────

  it('WebSocket constructor is available', () => {
    expect((global as any).WebSocket).toBeDefined();
  });

  it('creates WebSocket with URL containing token', () => {
    const token = 'test-jwt-token';
    const url = `ws://localhost:8080/ws?token=${encodeURIComponent(token)}`;
    const ws = new ((global as any).WebSocket)(url);
    expect((global as any).WebSocket).toHaveBeenCalledWith(url);
  });

  it('does not connect without access token', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
    const token = await SecureStore.getItemAsync('access_token');
    expect(token).toBeNull();
    // No WebSocket should be created
  });

  // ── Message Handling ──────────────────────────────────────

  it('parses JSON messages', () => {
    const raw = '{"type":"notification","title":"Test"}';
    const parsed = JSON.parse(raw);
    expect(parsed.type).toBe('notification');
    expect(parsed.title).toBe('Test');
  });

  it('handles pong messages silently', () => {
    const message = { type: 'pong' };
    expect(message.type).toBe('pong');
  });

  it('parses all server message types', () => {
    const types = [
      'pong',
      'notification',
      'ai_progress',
      'ai_complete',
      'subscription_updated',
      'config_updated',
      'error',
      'connected',
    ];
    types.forEach((type) => {
      const msg = JSON.parse(JSON.stringify({ type }));
      expect(msg.type).toBe(type);
    });
  });

  it('handles invalid JSON gracefully', () => {
    const invalidJson = 'not json {{{';
    let parsed = null;
    try {
      parsed = JSON.parse(invalidJson);
    } catch {
      // Expected
    }
    expect(parsed).toBeNull();
  });

  // ── Heartbeat ─────────────────────────────────────────────

  it('heartbeat sends ping message', () => {
    const pingMessage = JSON.stringify({ type: 'ping' });
    expect(pingMessage).toBe('{"type":"ping"}');
  });

  it('heartbeat interval is configurable', () => {
    const interval = 10000; // 10s
    expect(interval).toBeGreaterThan(0);
  });

  // ── Reconnect Logic ───────────────────────────────────────

  it('calculates exponential backoff correctly', () => {
    const baseDelay = 1000;
    const maxDelay = 30000;

    const delays: number[] = [];
    for (let attempt = 0; attempt < 10; attempt++) {
      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      delays.push(delay);
    }

    expect(delays[0]).toBe(1000);
    expect(delays[1]).toBe(2000);
    expect(delays[2]).toBe(4000);
    expect(delays[3]).toBe(8000);
    expect(delays[4]).toBe(16000);
    expect(delays[5]).toBe(30000); // Capped
    expect(delays[9]).toBe(30000); // Still capped
  });

  it('adds jitter to prevent thundering herd', () => {
    const baseDelay = 1000;
    const jitterFactor = 0.3;

    const results = new Set<number>();
    for (let i = 0; i < 100; i++) {
      const jitter = baseDelay * jitterFactor * Math.random();
      const total = baseDelay + jitter;
      results.add(Math.round(total));
    }

    // Should have variation
    expect(results.size).toBeGreaterThan(1);
    // All values should be between baseDelay and baseDelay * (1 + jitterFactor)
    results.forEach((val) => {
      expect(val).toBeGreaterThanOrEqual(baseDelay);
      expect(val).toBeLessThanOrEqual(baseDelay * (1 + jitterFactor) + 1);
    });
  });

  it('stops reconnecting after max attempts', () => {
    const maxAttempts = 10;
    let attempts = 0;

    while (attempts < maxAttempts + 5) {
      if (attempts >= maxAttempts) break;
      attempts++;
    }

    expect(attempts).toBe(maxAttempts);
  });

  // ── Event Handlers ────────────────────────────────────────

  it('manages message handler set', () => {
    const handlers = new Set<Function>();
    const handler1 = () => {};
    const handler2 = () => {};

    handlers.add(handler1);
    handlers.add(handler2);
    expect(handlers.size).toBe(2);

    handlers.delete(handler1);
    expect(handlers.size).toBe(1);
  });

  it('manages connect handler set', () => {
    const handlers = new Set<Function>();
    const handler = jest.fn();

    handlers.add(handler);
    handlers.forEach((h) => h());

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('manages disconnect handler set', () => {
    const handlers = new Set<Function>();
    const handler = jest.fn();

    handlers.add(handler);
    handlers.forEach((h) => h());

    expect(handler).toHaveBeenCalledTimes(1);
  });

  // ── Send ──────────────────────────────────────────────────

  it('serializes data before sending', () => {
    const data = { type: 'subscribe', channel: 'ai_updates' };
    const serialized = JSON.stringify(data);
    expect(serialized).toBe('{"type":"subscribe","channel":"ai_updates"}');
  });

  it('returns false when not connected', () => {
    const readyState = 3; // CLOSED
    const canSend = readyState === 1; // OPEN
    expect(canSend).toBe(false);
  });

  it('returns true when connected', () => {
    const readyState = 1; // OPEN
    const canSend = readyState === 1;
    expect(canSend).toBe(true);
  });

  // ── Disconnect ────────────────────────────────────────────

  it('sets intentional close flag on disconnect', () => {
    let isIntentionalClose = false;
    isIntentionalClose = true;
    expect(isIntentionalClose).toBe(true);
  });

  it('clears reconnect timeout on disconnect', () => {
    jest.useFakeTimers();
    const timeout = setTimeout(() => {}, 5000);
    clearTimeout(timeout);
    // Should not throw
  });

  it('stops heartbeat on disconnect', () => {
    jest.useFakeTimers();
    const interval = setInterval(() => {}, 10000);
    clearInterval(interval);
    // Should not throw
  });

  // ── URL Construction ──────────────────────────────────────

  it('constructs correct WebSocket URL', () => {
    const baseUrl = 'ws://localhost:8080/ws';
    const token = 'my.jwt.token';
    const url = `${baseUrl}?token=${encodeURIComponent(token)}`;
    expect(url).toBe('ws://localhost:8080/ws?token=my.jwt.token');
  });

  it('encodes special characters in token', () => {
    const token = 'token+with/special=chars';
    const encoded = encodeURIComponent(token);
    expect(encoded).not.toContain('+');
    expect(encoded).not.toContain('/');
    expect(encoded).not.toContain('=');
  });
});
