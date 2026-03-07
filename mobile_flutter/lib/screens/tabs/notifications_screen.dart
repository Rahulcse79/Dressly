// ══════════════════════════════════════════════════════════════
// Dressly — Notifications Screen (Flutter)
// ══════════════════════════════════════════════════════════════

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../constants/constants.dart';
import '../../models/models.dart';
import '../../providers/notification_provider.dart';
import '../../providers/theme_provider.dart';
import '../../widgets/widgets.dart';

class NotificationsScreen extends ConsumerStatefulWidget {
  const NotificationsScreen({super.key});

  @override
  ConsumerState<NotificationsScreen> createState() =>
      _NotificationsScreenState();
}

class _NotificationsScreenState extends ConsumerState<NotificationsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(notificationProvider.notifier).fetchNotifications();
    });
  }

  IconData _typeIcon(NotificationType type) {
    switch (type) {
      case NotificationType.outfitReady:
        return Icons.checkroom;
      case NotificationType.styleAlert:
        return Icons.auto_awesome;
      case NotificationType.subscriptionUpdate:
        return Icons.card_membership;
      case NotificationType.systemUpdate:
        return Icons.settings;
      case NotificationType.promotion:
        return Icons.local_offer;
    }
  }

  Color _typeColor(NotificationType type) {
    final colors = ref.read(themeProvider).colors;
    switch (type) {
      case NotificationType.outfitReady:
        return colors.success;
      case NotificationType.styleAlert:
        return colors.primary;
      case NotificationType.subscriptionUpdate:
        return colors.warning;
      case NotificationType.systemUpdate:
        return colors.textSecondary;
      case NotificationType.promotion:
        return colors.error;
    }
  }

  String _formatTime(DateTime dt) {
    final now = DateTime.now();
    final diff = now.difference(dt);
    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return '${dt.day}/${dt.month}/${dt.year}';
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(notificationProvider);
    final notifier = ref.read(notificationProvider.notifier);
    final colors = ref.watch(themeProvider).colors;

    return DresslyScreen(
      scrollable: false,
      onRefresh: () => notifier.fetchNotifications(refresh: true),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: Spacing.md),

          // Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Notifications',
                style: TextStyle(
                  fontSize: FontSizes.xxl,
                  fontWeight: FontWeight.w800,
                  color: colors.text,
                ),
              ),
              if (state.unreadCount > 0)
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: Spacing.sm, vertical: Spacing.xs),
                  decoration: BoxDecoration(
                    color: colors.primary,
                    borderRadius: BorderRadius.circular(AppRadius.full),
                  ),
                  child: Text(
                    '${state.unreadCount} new',
                    style: const TextStyle(
                      fontSize: FontSizes.xs,
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: Spacing.base),

          // List
          Expanded(
            child: state.isLoading && state.notifications.isEmpty
                ? const DresslyLoading(message: 'Loading notifications…')
                : state.notifications.isEmpty
                    ? const DresslyEmptyState(
                        icon: Icons.notifications_off,
                        title: 'No notifications yet',
                        message:
                            'Your style updates and alerts will appear here',
                      )
                    : NotificationListener<ScrollNotification>(
                        onNotification: (scroll) {
                          if (scroll is ScrollEndNotification &&
                              scroll.metrics.pixels >=
                                  scroll.metrics.maxScrollExtent - 200 &&
                              state.hasMore &&
                              !state.isLoading) {
                            notifier.fetchNotifications();
                          }
                          return false;
                        },
                        child: ListView.separated(
                          padding: EdgeInsets.zero,
                          itemCount: state.notifications.length +
                              (state.hasMore ? 1 : 0),
                          separatorBuilder: (_, __) =>
                              Divider(height: 1, color: colors.border),
                          itemBuilder: (context, index) {
                            if (index >= state.notifications.length) {
                              return const Padding(
                                padding: EdgeInsets.all(Spacing.md),
                                child: Center(
                                    child:
                                        CircularProgressIndicator()),
                              );
                            }
                            final notif = state.notifications[index];
                            return _NotificationTile(
                              notification: notif,
                              icon: _typeIcon(notif.notificationType),
                              iconColor:
                                  _typeColor(notif.notificationType),
                timeString:
                  _formatTime(notif.createdAtDate),
                              colors: colors,
                              onTap: () {
                                if (!notif.read) {
                                  notifier.markRead(notif.id);
                                }
                              },
                            );
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }
}

class _NotificationTile extends StatelessWidget {
  final AppNotification notification;
  final IconData icon;
  final Color iconColor;
  final String timeString;
  final AppColors colors;
  final VoidCallback onTap;

  const _NotificationTile({
    required this.notification,
    required this.icon,
    required this.iconColor,
    required this.timeString,
    required this.colors,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(
            horizontal: Spacing.base, vertical: Spacing.md),
    color: notification.read
      ? Colors.transparent
      : colors.primary.withOpacity(0.05),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Icon
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: iconColor.withOpacity(0.12),
                borderRadius: BorderRadius.circular(AppRadius.md),
              ),
              child: Icon(icon, size: 22, color: iconColor),
            ),
            const SizedBox(width: Spacing.md),

            // Content
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          notification.title,
                          style: TextStyle(
                            fontSize: FontSizes.base,
                            fontWeight: notification.read
                                ? FontWeight.w500
                                : FontWeight.w700,
                            color: colors.text,
                          ),
                        ),
                      ),
                      if (!notification.read)
                        Container(
                          width: 8,
                          height: 8,
                          margin: const EdgeInsets.only(left: Spacing.sm),
                          decoration: BoxDecoration(
                            color: colors.primary,
                            shape: BoxShape.circle,
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    notification.body,
                    style: TextStyle(
                      fontSize: FontSizes.sm,
                      color: colors.textSecondary,
                      height: 1.4,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: Spacing.xs),
                  Text(
                    timeString,
                    style: TextStyle(
                      fontSize: FontSizes.xs,
                      color: colors.textMuted,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
