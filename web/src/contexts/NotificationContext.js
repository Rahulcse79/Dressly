// ══════════════════════════════════════════════════════════════
// Dressly Web — Notification Context (WebSocket powered)
// ══════════════════════════════════════════════════════════════

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { notificationApi } from '../services/api';
import wsService from '../services/websocket';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [wsStatus, setWsStatus] = useState('disconnected');

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await notificationApi.list(1, 50);
      const d = res.data.data;
      setNotifications(d.notifications || []);
      setUnreadCount(d.unread_count || 0);
    } catch { /* ignore */ }
  }, [isAuthenticated]);

  // Listen for WebSocket events
  useEffect(() => {
    if (!isAuthenticated) return;

    fetchNotifications();

    const unsubConn = wsService.on('connection', ({ status }) => {
      setWsStatus(status);
    });

    const unsubNotif = wsService.on('notification', (data) => {
      setNotifications((prev) => [data, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    return () => {
      unsubConn();
      unsubNotif();
    };
  }, [isAuthenticated, fetchNotifications]);

  const markRead = useCallback(async (id) => {
    try {
      await notificationApi.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch { /* ignore */ }
  }, []);

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, wsStatus, fetchNotifications, markRead }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
