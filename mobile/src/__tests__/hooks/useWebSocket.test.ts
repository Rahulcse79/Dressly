// ─── useWebSocket Hook Tests ────────────────────────────────────────────────

import { renderHook, act } from '@testing-library/react-native';
import { useWebSocket } from '../../hooks/useWebSocket';
import wsService from '../../services/websocket';
import { useAuthStore } from '../../stores/authStore';
import { useNotificationStore } from '../../stores/notificationStore';

// Mock modules
jest.mock('../../services/websocket', () => ({
  __esModule: true,
  default: {
    connect: jest.fn(),
    disconnect: jest.fn(),
    send: jest.fn().mockReturnValue(true),
    onMessage: jest.fn().mockReturnValue(jest.fn()),
    onConnect: jest.fn().mockReturnValue(jest.fn()),
    onDisconnect: jest.fn().mockReturnValue(jest.fn()),
  },
}));

describe('useWebSocket', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: false,
      error: null,
    });
  });

  // ── Connection Lifecycle ──────────────────────────────────

  it('connects when authenticated', () => {
    useAuthStore.setState({ isAuthenticated: true });
    renderHook(() => useWebSocket());
    expect(wsService.connect).toHaveBeenCalled();
  });

  it('does not connect when not authenticated', () => {
    useAuthStore.setState({ isAuthenticated: false });
    renderHook(() => useWebSocket());
    expect(wsService.connect).not.toHaveBeenCalled();
  });

  it('disconnects when auth state changes to unauthenticated', () => {
    useAuthStore.setState({ isAuthenticated: true });
    const { rerender } = renderHook(() => useWebSocket());

    useAuthStore.setState({ isAuthenticated: false });
    rerender({});

    expect(wsService.disconnect).toHaveBeenCalled();
  });

  it('disconnects on unmount', () => {
    useAuthStore.setState({ isAuthenticated: true });
    const { unmount } = renderHook(() => useWebSocket());
    unmount();
    expect(wsService.disconnect).toHaveBeenCalled();
  });

  // ── Return Values ─────────────────────────────────────────

  it('returns isConnected state', () => {
    const { result } = renderHook(() => useWebSocket());
    expect(typeof result.current.isConnected).toBe('boolean');
  });

  it('returns send function', () => {
    const { result } = renderHook(() => useWebSocket());
    expect(typeof result.current.send).toBe('function');
  });

  it('isConnected is initially false', () => {
    const { result } = renderHook(() => useWebSocket());
    expect(result.current.isConnected).toBe(false);
  });

  // ── Send ──────────────────────────────────────────────────

  it('delegates send to wsService', () => {
    const { result } = renderHook(() => useWebSocket());
    result.current.send({ type: 'subscribe', channel: 'ai' });
    expect(wsService.send).toHaveBeenCalledWith({
      type: 'subscribe',
      channel: 'ai',
    });
  });

  // ── Event Handlers ────────────────────────────────────────

  it('registers message handler', () => {
    renderHook(() => useWebSocket());
    expect(wsService.onMessage).toHaveBeenCalledWith(expect.any(Function));
  });

  it('registers connect handler', () => {
    renderHook(() => useWebSocket());
    expect(wsService.onConnect).toHaveBeenCalledWith(expect.any(Function));
  });

  it('registers disconnect handler', () => {
    renderHook(() => useWebSocket());
    expect(wsService.onDisconnect).toHaveBeenCalledWith(expect.any(Function));
  });

  // ── Message Handling ──────────────────────────────────────

  it('handles notification message type', () => {
    const addNotification = jest.fn();
    const incrementUnread = jest.fn();

    useNotificationStore.setState({
      addNotification,
      incrementUnread,
    } as any);

    let messageCallback: Function;
    (wsService.onMessage as jest.Mock).mockImplementation((cb: Function) => {
      messageCallback = cb;
      return jest.fn();
    });

    renderHook(() => useWebSocket());

    // Simulate notification message
    act(() => {
      messageCallback!({
        type: 'notification',
        notification: {
          id: '1',
          title: 'Test',
          body: 'Test body',
          notification_type: 'style_tip',
          is_read: false,
        },
      });
    });

    expect(addNotification).toHaveBeenCalled();
    expect(incrementUnread).toHaveBeenCalled();
  });

  it('handles ai_progress message without error', () => {
    let messageCallback: Function;
    (wsService.onMessage as jest.Mock).mockImplementation((cb: Function) => {
      messageCallback = cb;
      return jest.fn();
    });

    renderHook(() => useWebSocket());

    // Should not throw
    act(() => {
      messageCallback!({
        type: 'ai_progress',
        generation_id: 'gen-1',
        progress: 50,
        status: 'processing',
      });
    });
  });

  it('handles unknown message types gracefully', () => {
    let messageCallback: Function;
    (wsService.onMessage as jest.Mock).mockImplementation((cb: Function) => {
      messageCallback = cb;
      return jest.fn();
    });

    renderHook(() => useWebSocket());

    // Should not throw
    act(() => {
      messageCallback!({ type: 'unknown_type' });
    });
  });

  // ── Cleanup ───────────────────────────────────────────────

  it('unsubscribes event handlers on unmount', () => {
    const unsubMessage = jest.fn();
    const unsubConnect = jest.fn();
    const unsubDisconnect = jest.fn();

    (wsService.onMessage as jest.Mock).mockReturnValue(unsubMessage);
    (wsService.onConnect as jest.Mock).mockReturnValue(unsubConnect);
    (wsService.onDisconnect as jest.Mock).mockReturnValue(unsubDisconnect);

    const { unmount } = renderHook(() => useWebSocket());
    unmount();

    expect(unsubMessage).toHaveBeenCalled();
    expect(unsubConnect).toHaveBeenCalled();
    expect(unsubDisconnect).toHaveBeenCalled();
  });
});
