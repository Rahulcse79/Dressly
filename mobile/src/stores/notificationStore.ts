// ══════════════════════════════════════════════════════════════
// Dressly — Notification Store (Zustand)
// ══════════════════════════════════════════════════════════════

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import apiClient, { extractApiError } from '@/services/api';
import { ENDPOINTS } from '@/constants';
import type { ApiResponse, Notification, PaginatedResponse } from '@/types';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  page: number;
  hasMore: boolean;
}

interface NotificationActions {
  fetchNotifications: (page?: number) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  addNotification: (notification: Notification) => void;
  incrementUnread: () => void;
  reset: () => void;
}

type NotificationStore = NotificationState & NotificationActions;

export const useNotificationStore = create<NotificationStore>()(
  immer((set) => ({
    // ── State ────────────────────────────────────────────
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    page: 1,
    hasMore: true,

    // ── Fetch Notifications ──────────────────────────────
    fetchNotifications: async (page = 1) => {
      set((s) => {
        s.isLoading = true;
      });
      try {
        const response = await apiClient.get<PaginatedResponse<Notification>>(
          ENDPOINTS.NOTIFICATIONS,
          { params: { page, per_page: 20 } },
        );
        const { data, pagination } = response.data;

        set((s) => {
          if (page === 1) {
            s.notifications = data;
          } else {
            s.notifications.push(...data);
          }
          s.page = pagination.page;
          s.hasMore = pagination.page < pagination.total_pages;
          s.isLoading = false;
        });
      } catch {
        set((s) => {
          s.isLoading = false;
        });
      }
    },

    // ── Fetch Unread Count ───────────────────────────────
    fetchUnreadCount: async () => {
      try {
        const response = await apiClient.get<ApiResponse<{ count: number }>>(
          ENDPOINTS.NOTIFICATIONS_UNREAD,
        );
        set((s) => {
          s.unreadCount = response.data.data.count;
        });
      } catch {
        // Silent fail
      }
    },

    // ── Mark Read ────────────────────────────────────────
    markRead: async (id: string) => {
      try {
        await apiClient.patch(ENDPOINTS.NOTIFICATION_READ(id));
        set((s) => {
          const idx = s.notifications.findIndex((n) => n.id === id);
          if (idx !== -1 && !s.notifications[idx].is_read) {
            s.notifications[idx].is_read = true;
            s.unreadCount = Math.max(0, s.unreadCount - 1);
          }
        });
      } catch {
        // Silent fail
      }
    },

    // ── Realtime: Add from WebSocket ─────────────────────
    addNotification: (notification: Notification) => {
      set((s) => {
        s.notifications.unshift(notification);
      });
    },

    incrementUnread: () => {
      set((s) => {
        s.unreadCount++;
      });
    },

    // ── Reset ────────────────────────────────────────────
    reset: () => {
      set((s) => {
        s.notifications = [];
        s.unreadCount = 0;
        s.page = 1;
        s.hasMore = true;
      });
    },
  })),
);
