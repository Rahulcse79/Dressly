import 'dart:math';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../constants/constants.dart';
import '../models/models.dart';
import '../services/api_service.dart';

class NotificationState {
  final List<AppNotification> notifications;
  final int unreadCount;
  final bool isLoading;
  final int page;
  final bool hasMore;

  const NotificationState({
    this.notifications = const [],
    this.unreadCount = 0,
    this.isLoading = false,
    this.page = 1,
    this.hasMore = true,
  });

  NotificationState copyWith({
    List<AppNotification>? notifications,
    int? unreadCount,
    bool? isLoading,
    int? page,
    bool? hasMore,
  }) =>
      NotificationState(
        notifications: notifications ?? this.notifications,
        unreadCount: unreadCount ?? this.unreadCount,
        isLoading: isLoading ?? this.isLoading,
        page: page ?? this.page,
        hasMore: hasMore ?? this.hasMore,
      );
}

class NotificationNotifier extends StateNotifier<NotificationState> {
  final ApiService _api = apiService;

  NotificationNotifier() : super(const NotificationState());

  Future<void> fetchNotifications({int page = 1, bool refresh = false}) async {
    if (refresh) page = 1;
    state = state.copyWith(isLoading: true);
    try {
      final response = await _api.get(
        Endpoints.notifications,
        queryParameters: {'page': page, 'per_page': 20},
      );

      final data = (response.data['data'] as List<dynamic>)
          .map((e) =>
              AppNotification.fromJson(e as Map<String, dynamic>))
          .toList();

      final pagination =
          response.data['pagination'] as Map<String, dynamic>;
      final totalPages = pagination['total_pages'] as int;

      final newNotifications = page == 1
          ? data
          : [...state.notifications, ...data];

      state = state.copyWith(
        notifications: newNotifications,
        page: page,
        hasMore: page < totalPages,
        isLoading: false,
      );
    } catch (_) {
      state = state.copyWith(isLoading: false);
    }
  }

  Future<void> fetchUnreadCount() async {
    try {
      final response = await _api.get(Endpoints.notificationsUnread);
      final count = response.data['data']['count'] as int;
      state = state.copyWith(unreadCount: count);
    } catch (_) {
      // Silent fail
    }
  }

  Future<void> markRead(String id) async {
    try {
      await _api.patch(Endpoints.notificationRead(id));
      final updated = state.notifications.map((n) {
        if (n.id == id && !n.isRead) {
          return n.copyWith(isRead: true);
        }
        return n;
      }).toList();

      final wasUnread =
          state.notifications.any((n) => n.id == id && !n.isRead);

      state = state.copyWith(
        notifications: updated,
        unreadCount: wasUnread
            ? max(0, state.unreadCount - 1)
            : state.unreadCount,
      );
    } catch (_) {
      // Silent fail
    }
  }

  void addNotification(AppNotification notification) {
    state = state.copyWith(
      notifications: [notification, ...state.notifications],
    );
  }

  void incrementUnread() {
    state = state.copyWith(unreadCount: state.unreadCount + 1);
  }

  void reset() {
    state = const NotificationState();
  }
}

final notificationProvider =
    StateNotifierProvider<NotificationNotifier, NotificationState>(
        (ref) => NotificationNotifier());
