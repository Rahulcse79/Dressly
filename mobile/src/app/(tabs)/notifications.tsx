// ══════════════════════════════════════════════════════════════
// Dressly — Notifications Screen
// ══════════════════════════════════════════════════════════════

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/layout';
import { Loading, EmptyState } from '@/components/ui';
import { useNotificationStore } from '@/stores/notificationStore';
import { useThemeStore } from '@/stores/themeStore';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { FONT_SIZES, SPACING, RADIUS } from '@/constants';
import type { Notification, NotificationType } from '@/types';

const NOTIFICATION_ICONS: Record<NotificationType, keyof typeof Ionicons.glyphMap> = {
  ai_generation_complete: 'sparkles',
  subscription_activated: 'diamond',
  subscription_expiring: 'time',
  admin_announcement: 'megaphone',
  style_tip: 'bulb',
  payment_success: 'checkmark-circle',
  payment_failed: 'close-circle',
};

const NOTIFICATION_COLORS: Record<NotificationType, string> = {
  ai_generation_complete: '#6C63FF',
  subscription_activated: '#00D9A5',
  subscription_expiring: '#F59E0B',
  admin_announcement: '#3B82F6',
  style_tip: '#EC4899',
  payment_success: '#10B981',
  payment_failed: '#EF4444',
};

export default function NotificationsScreen() {
  const colors = useThemeStore((s) => s.colors);
  const {
    notifications,
    isLoading,
    hasMore,
    fetchNotifications,
    fetchUnreadCount,
    markRead,
  } = useNotificationStore();

  useEffect(() => {
    fetchNotifications(1);
    fetchUnreadCount();
  }, []);

  useRefreshOnFocus(() => {
    fetchNotifications(1);
    fetchUnreadCount();
  });

  const loadMore = () => {
    if (hasMore && !isLoading) {
      const nextPage = Math.floor(notifications.length / 20) + 1;
      fetchNotifications(nextPage);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60_000);
    const diffHr = Math.floor(diffMs / 3_600_000);
    const diffDay = Math.floor(diffMs / 86_400_000);

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    return date.toLocaleDateString();
  };

  const renderNotification = ({
    item,
    index,
  }: {
    item: Notification;
    index: number;
  }) => {
    const iconName = NOTIFICATION_ICONS[item.notification_type] || 'notifications';
    const iconColor = NOTIFICATION_COLORS[item.notification_type] || colors.primary;

    return (
      <Animated.View entering={FadeInRight.duration(300).delay(index * 50)}>
        <TouchableOpacity
          onPress={() => {
            if (!item.is_read) markRead(item.id);
          }}
          style={[
            styles.notifItem,
            {
              backgroundColor: item.is_read
                ? colors.surface
                : colors.primary + '08',
              borderColor: item.is_read ? colors.border : colors.primary + '30',
            },
          ]}
        >
          <View
            style={[
              styles.notifIcon,
              { backgroundColor: iconColor + '15' },
            ]}
          >
            <Ionicons name={iconName} size={20} color={iconColor} />
          </View>

          <View style={styles.notifContent}>
            <Text
              style={[
                styles.notifTitle,
                {
                  color: colors.text,
                  fontWeight: item.is_read ? '500' : '700',
                },
              ]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            <Text
              style={[styles.notifBody, { color: colors.textSecondary }]}
              numberOfLines={2}
            >
              {item.body}
            </Text>
            <Text style={[styles.notifTime, { color: colors.textMuted }]}>
              {formatTime(item.created_at)}
            </Text>
          </View>

          {!item.is_read && (
            <View
              style={[styles.unreadDot, { backgroundColor: colors.primary }]}
            />
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <Screen padding>
      <Animated.View
        entering={FadeInDown.duration(500)}
        style={styles.header}
      >
        <Text style={[styles.title, { color: colors.text }]}>
          Notifications
        </Text>
      </Animated.View>

      {isLoading && notifications.length === 0 ? (
        <Loading message="Loading notifications..." />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon="notifications-off-outline"
          title="No notifications yet"
          message="You'll receive updates about your AI generations, subscriptions, and style tips here"
        />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderNotification}
          contentContainerStyle={{ gap: SPACING.sm, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isLoading ? <Loading size="small" /> : null
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZES['2xl'],
    fontWeight: '800',
  },
  notifItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: SPACING.base,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    gap: SPACING.md,
  },
  notifIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifContent: {
    flex: 1,
  },
  notifTitle: {
    fontSize: FONT_SIZES.base,
    marginBottom: 2,
  },
  notifBody: {
    fontSize: FONT_SIZES.sm,
    lineHeight: 18,
    marginBottom: 4,
  },
  notifTime: {
    fontSize: FONT_SIZES.xs,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
});
