// ─── Notification Store Tests ────────────────────────────────────────────────

import { useNotificationStore } from '../../stores/notificationStore';
import apiClient from '../../services/api';

const initialState = useNotificationStore.getState();

beforeEach(() => {
  useNotificationStore.setState(initialState);
  jest.clearAllMocks();
});

describe('NotificationStore', () => {
  // ── Initial State ─────────────────────────────────────────

  it('has empty notifications array', () => {
    expect(useNotificationStore.getState().notifications).toEqual([]);
  });

  it('has zero unread count', () => {
    expect(useNotificationStore.getState().unreadCount).toBe(0);
  });

  it('is not loading initially', () => {
    expect(useNotificationStore.getState().isLoading).toBe(false);
  });

  it('starts at page 1', () => {
    expect(useNotificationStore.getState().page).toBe(1);
  });

  it('hasMore is true initially', () => {
    expect(useNotificationStore.getState().hasMore).toBe(true);
  });

  // ── fetchNotifications ────────────────────────────────────

  it('fetches notifications page 1', async () => {
    const mockNotifications = [
      {
        id: '1',
        user_id: 'u1',
        title: 'Test',
        body: 'Test body',
        notification_type: 'style_tip',
        is_read: false,
        data: null,
        created_at: new Date().toISOString(),
      },
      {
        id: '2',
        user_id: 'u1',
        title: 'Test 2',
        body: 'Test body 2',
        notification_type: 'admin_announcement',
        is_read: true,
        data: null,
        created_at: new Date().toISOString(),
      },
    ];

    (apiClient.get as jest.Mock).mockResolvedValue({
      data: {
        data: mockNotifications,
        pagination: { page: 1, per_page: 20, total: 2, total_pages: 1 },
      },
    });

    await useNotificationStore.getState().fetchNotifications(1);

    const state = useNotificationStore.getState();
    expect(state.notifications).toHaveLength(2);
    expect(state.notifications[0].title).toBe('Test');
    expect(state.isLoading).toBe(false);
    expect(state.hasMore).toBe(false);
  });

  it('appends notifications for page > 1', async () => {
    // Seed page 1
    useNotificationStore.setState({
      notifications: [
        {
          id: '1',
          user_id: 'u1',
          title: 'Page 1',
          body: 'Body',
          notification_type: 'style_tip' as const,
          is_read: false,
          data: null,
          created_at: new Date().toISOString(),
        },
      ],
    });

    (apiClient.get as jest.Mock).mockResolvedValue({
      data: {
        data: [
          {
            id: '2',
            user_id: 'u1',
            title: 'Page 2',
            body: 'Body 2',
            notification_type: 'admin_announcement',
            is_read: false,
            data: null,
            created_at: new Date().toISOString(),
          },
        ],
        pagination: { page: 2, per_page: 20, total: 2, total_pages: 2 },
      },
    });

    await useNotificationStore.getState().fetchNotifications(2);

    expect(useNotificationStore.getState().notifications).toHaveLength(2);
    expect(useNotificationStore.getState().hasMore).toBe(false);
  });

  it('sets loading state during fetch', async () => {
    let resolveGet: any;
    (apiClient.get as jest.Mock).mockReturnValue(
      new Promise((r) => (resolveGet = r))
    );

    const promise = useNotificationStore.getState().fetchNotifications();
    expect(useNotificationStore.getState().isLoading).toBe(true);

    resolveGet({
      data: {
        data: [],
        pagination: { page: 1, per_page: 20, total: 0, total_pages: 0 },
      },
    });
    await promise;

    expect(useNotificationStore.getState().isLoading).toBe(false);
  });

  it('handles fetch error gracefully', async () => {
    (apiClient.get as jest.Mock).mockRejectedValue(new Error('Network error'));
    await useNotificationStore.getState().fetchNotifications();

    expect(useNotificationStore.getState().isLoading).toBe(false);
    expect(useNotificationStore.getState().notifications).toEqual([]);
  });

  // ── fetchUnreadCount ──────────────────────────────────────

  it('fetches unread count', async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({
      data: { data: { count: 5 } },
    });

    await useNotificationStore.getState().fetchUnreadCount();
    expect(useNotificationStore.getState().unreadCount).toBe(5);
  });

  it('handles unread count error silently', async () => {
    (apiClient.get as jest.Mock).mockRejectedValue(new Error('fail'));
    await useNotificationStore.getState().fetchUnreadCount();
    expect(useNotificationStore.getState().unreadCount).toBe(0);
  });

  // ── markRead ──────────────────────────────────────────────

  it('marks notification as read', async () => {
    useNotificationStore.setState({
      notifications: [
        {
          id: 'n1',
          user_id: 'u1',
          title: 'Unread',
          body: 'Body',
          notification_type: 'style_tip' as const,
          is_read: false,
          data: null,
          created_at: new Date().toISOString(),
        },
      ],
      unreadCount: 1,
    });

    (apiClient.patch as jest.Mock).mockResolvedValue({});

    await useNotificationStore.getState().markRead('n1');

    const state = useNotificationStore.getState();
    expect(state.notifications[0].is_read).toBe(true);
    expect(state.unreadCount).toBe(0);
  });

  it('does not double-decrement unread count', async () => {
    useNotificationStore.setState({
      notifications: [
        {
          id: 'n1',
          user_id: 'u1',
          title: 'Already Read',
          body: 'Body',
          notification_type: 'style_tip' as const,
          is_read: true,
          data: null,
          created_at: new Date().toISOString(),
        },
      ],
      unreadCount: 3,
    });

    (apiClient.patch as jest.Mock).mockResolvedValue({});

    await useNotificationStore.getState().markRead('n1');
    expect(useNotificationStore.getState().unreadCount).toBe(3);
  });

  it('handles markRead with non-existent ID', async () => {
    useNotificationStore.setState({
      notifications: [],
      unreadCount: 0,
    });

    (apiClient.patch as jest.Mock).mockResolvedValue({});

    await useNotificationStore.getState().markRead('nonexistent');
    expect(useNotificationStore.getState().unreadCount).toBe(0);
  });

  it('unread count never goes below zero', async () => {
    useNotificationStore.setState({
      notifications: [
        {
          id: 'n1',
          user_id: 'u1',
          title: 'Test',
          body: 'Body',
          notification_type: 'style_tip' as const,
          is_read: false,
          data: null,
          created_at: new Date().toISOString(),
        },
      ],
      unreadCount: 0,
    });

    (apiClient.patch as jest.Mock).mockResolvedValue({});

    await useNotificationStore.getState().markRead('n1');
    expect(useNotificationStore.getState().unreadCount).toBe(0);
  });

  // ── addNotification (WebSocket realtime) ──────────────────

  it('adds notification to top of list', () => {
    useNotificationStore.setState({
      notifications: [
        {
          id: 'old',
          user_id: 'u1',
          title: 'Old',
          body: 'Old',
          notification_type: 'style_tip' as const,
          is_read: true,
          data: null,
          created_at: new Date().toISOString(),
        },
      ],
    });

    const newNotif = {
      id: 'new',
      user_id: 'u1',
      title: 'New',
      body: 'New notification',
      notification_type: 'ai_generation_complete' as const,
      is_read: false,
      data: null,
      created_at: new Date().toISOString(),
    };

    useNotificationStore.getState().addNotification(newNotif);

    const state = useNotificationStore.getState();
    expect(state.notifications).toHaveLength(2);
    // New notification should be at the beginning
    expect(state.notifications[0].id).toBe('new');
  });

  // ── incrementUnread ───────────────────────────────────────

  it('increments unread count', () => {
    useNotificationStore.setState({ unreadCount: 3 });
    useNotificationStore.getState().incrementUnread();
    expect(useNotificationStore.getState().unreadCount).toBe(4);
  });

  it('increments from zero', () => {
    useNotificationStore.setState({ unreadCount: 0 });
    useNotificationStore.getState().incrementUnread();
    expect(useNotificationStore.getState().unreadCount).toBe(1);
  });

  // ── reset ─────────────────────────────────────────────────

  it('resets store to initial state', () => {
    useNotificationStore.setState({
      notifications: [
        {
          id: '1',
          user_id: 'u1',
          title: 'Test',
          body: 'Body',
          notification_type: 'style_tip' as const,
          is_read: false,
          data: null,
          created_at: new Date().toISOString(),
        },
      ],
      unreadCount: 5,
      page: 3,
      hasMore: false,
    });

    useNotificationStore.getState().reset();

    const state = useNotificationStore.getState();
    expect(state.notifications).toEqual([]);
    expect(state.unreadCount).toBe(0);
    expect(state.page).toBe(1);
    expect(state.hasMore).toBe(true);
  });
});
