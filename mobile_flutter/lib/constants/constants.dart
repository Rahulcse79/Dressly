// ══════════════════════════════════════════════════════════════
// Dressly — App Constants (Dart)
// ══════════════════════════════════════════════════════════════

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

// ── API Configuration ───────────────────────────────────────

const String apiBaseUrl = kDebugMode
    ? 'http://192.168.0.106:8080/v1'
    : 'https://api.dressly.app/v1';

const String wsBaseUrl = kDebugMode
    ? 'ws://192.168.0.106:8080/ws'
    : 'wss://api.dressly.app/ws';

// ── API Endpoints ───────────────────────────────────────────

class Endpoints {
  Endpoints._();

  // Auth
  static const String register = '/auth/register';
  static const String login = '/auth/login';
  static const String refresh = '/auth/refresh';
  static const String logout = '/auth/logout';

  // User
  static const String me = '/users/me';
  static const String updateMe = '/users/me';
  static const String deleteMe = '/users/me';
  static const String uploadAvatar = '/users/me/avatar';

  // Wardrobe
  static const String wardrobeList = '/wardrobe';
  static const String wardrobeAdd = '/wardrobe';
  static String wardrobeItem(String id) => '/wardrobe/$id';

  // AI
  static const String aiGenerate = '/ai/generate';
  static const String aiList = '/ai/generations';
  static String aiDetail(String id) => '/ai/generations/$id';
  static const String aiQuota = '/ai/quota';

  // Subscription
  static const String subscription = '/subscription';
  static const String subscriptionCheckout = '/subscription/checkout';
  static const String subscriptionVerify = '/subscription/verify';
  static const String subscriptionCancel = '/subscription/cancel';

  // Notifications
  static const String notifications = '/notifications';
  static String notificationRead(String id) => '/notifications/$id/read';
  static const String registerFcm = '/notifications/token';
  static const String notificationsUnread = '/notifications/unread-count';

  // Admin
  static const String adminUsers = '/admin/users';
  static String adminUser(String id) => '/admin/users/$id';
  static const String adminConfig = '/admin/config';
  static const String adminAnalytics = '/admin/analytics';
  static const String adminSubscriptions = '/admin/subscriptions';

  // Health
  static const String health = '/health';
  static const String readiness = '/health/ready';
}

// ── Storage Keys ────────────────────────────────────────────

class StorageKeys {
  StorageKeys._();

  static const String accessToken = 'dressly.access-token';
  static const String refreshToken = 'dressly.refresh-token';
  static const String user = 'dressly.user';
  static const String themeMode = 'dressly.theme-mode';
  static const String onboardingDone = 'dressly.onboarding-done';
  static const String fcmToken = 'dressly.fcm-token';
  static const String deviceId = 'dressly.device-id';
}

// ── Theme Colors ────────────────────────────────────────────

class AppColors {
  final Color background;
  final Color surface;
  final Color surfaceElevated;
  final Color text;
  final Color textSecondary;
  final Color textMuted;
  final Color primary;
  final Color primaryLight;
  final Color primaryDark;
  final Color secondary;
  final Color secondaryLight;
  final Color accent;
  final Color error;
  final Color warning;
  final Color success;
  final Color info;
  final Color border;
  final Color borderFocused;
  final Color overlay;
  final Color card;
  final Color skeleton;
  final Color tabBarBackground;

  const AppColors({
    required this.background,
    required this.surface,
    required this.surfaceElevated,
    required this.text,
    required this.textSecondary,
    required this.textMuted,
    required this.primary,
    required this.primaryLight,
    required this.primaryDark,
    required this.secondary,
    required this.secondaryLight,
    required this.accent,
    required this.error,
    required this.warning,
    required this.success,
    required this.info,
    required this.border,
    required this.borderFocused,
    required this.overlay,
    required this.card,
    required this.skeleton,
    required this.tabBarBackground,
  });
}

const lightColors = AppColors(
  background: Color(0xFFFFFFFF),
  surface: Color(0xFFF8F9FA),
  surfaceElevated: Color(0xFFFFFFFF),
  text: Color(0xFF1A1A2E),
  textSecondary: Color(0xFF6C757D),
  textMuted: Color(0xFFADB5BD),
  primary: Color(0xFF6C63FF),
  primaryLight: Color(0xFF8B83FF),
  primaryDark: Color(0xFF5046E4),
  secondary: Color(0xFFFF6B9D),
  secondaryLight: Color(0xFFFF8FB3),
  accent: Color(0xFF00D9A5),
  error: Color(0xFFEF4444),
  warning: Color(0xFFF59E0B),
  success: Color(0xFF10B981),
  info: Color(0xFF3B82F6),
  border: Color(0xFFE9ECEF),
  borderFocused: Color(0xFF6C63FF),
  overlay: Color(0x66000000),
  card: Color(0xFFFFFFFF),
  skeleton: Color(0xFFE9ECEF),
  tabBarBackground: Color(0xFFFFFFFF),
);

const darkColors = AppColors(
  background: Color(0xFF0D0D1A),
  surface: Color(0xFF1A1A2E),
  surfaceElevated: Color(0xFF252540),
  text: Color(0xFFF8F9FA),
  textSecondary: Color(0xFFADB5BD),
  textMuted: Color(0xFF6C757D),
  primary: Color(0xFF8B83FF),
  primaryLight: Color(0xFFA9A3FF),
  primaryDark: Color(0xFF6C63FF),
  secondary: Color(0xFFFF8FB3),
  secondaryLight: Color(0xFFFFB3CC),
  accent: Color(0xFF00F5BB),
  error: Color(0xFFF87171),
  warning: Color(0xFFFBBF24),
  success: Color(0xFF34D399),
  info: Color(0xFF60A5FA),
  border: Color(0xFF2A2A45),
  borderFocused: Color(0xFF8B83FF),
  overlay: Color(0x99000000),
  card: Color(0xFF1A1A2E),
  skeleton: Color(0xFF252540),
  tabBarBackground: Color(0xFF1A1A2E),
);

// ── Typography ──────────────────────────────────────────────

class FontSizes {
  FontSizes._();

  static const double xs = 10;
  static const double sm = 12;
  static const double md = 14;
  static const double base = 16;
  static const double lg = 18;
  static const double xl = 20;
  static const double xxl = 24;
  static const double xxxl = 30;
  static const double xxxxl = 36;
  static const double xxxxxl = 48;
}

// ── Spacing ─────────────────────────────────────────────────

class Spacing {
  Spacing._();

  static const double xs = 4;
  static const double sm = 8;
  static const double md = 12;
  static const double base = 16;
  static const double lg = 20;
  static const double xl = 24;
  static const double xxl = 32;
  static const double xxxl = 40;
  static const double xxxxl = 48;
  static const double xxxxxl = 64;
}

class AppRadius {
  AppRadius._();

  static const double sm = 6;
  static const double md = 10;
  static const double lg = 14;
  static const double xl = 20;
  static const double full = 9999;
}

// ── Animation Durations (ms) ────────────────────────────────

class AppAnimation {
  AppAnimation._();

  static const Duration fast = Duration(milliseconds: 150);
  static const Duration normal = Duration(milliseconds: 250);
  static const Duration slow = Duration(milliseconds: 400);
}

// ── App Limits ──────────────────────────────────────────────

class Limits {
  Limits._();

  static const int maxWardrobeImages = 200;
  static const int maxGenerationImages = 5;
  static const int maxImageSizeMb = 10;
  static const int freeDailyGenerations = 5;
  static const int proDailyGenerations = 100;
  static const int passwordMinLength = 8;
  static const int displayNameMaxLength = 50;
  static const int maxOccasionTags = 10;
}

// ── Clothing Categories Config ──────────────────────────────

class CategoryInfo {
  final String label;
  final IconData icon;
  final Color color;

  const CategoryInfo({
    required this.label,
    required this.icon,
    required this.color,
  });
}

final Map<String, CategoryInfo> categoryConfig = {
  'top': const CategoryInfo(
      label: 'Tops', icon: Icons.checkroom, color: Color(0xFF6C63FF)),
  'bottom': const CategoryInfo(
      label: 'Bottoms', icon: Icons.accessibility, color: Color(0xFFFF6B9D)),
  'dress': const CategoryInfo(
      label: 'Dresses', icon: Icons.local_florist, color: Color(0xFF00D9A5)),
  'outerwear': const CategoryInfo(
      label: 'Outerwear', icon: Icons.ac_unit, color: Color(0xFFF59E0B)),
  'shoes': const CategoryInfo(
      label: 'Shoes', icon: Icons.directions_walk, color: Color(0xFF3B82F6)),
  'accessory': const CategoryInfo(
      label: 'Accessories',
      icon: Icons.visibility,
      color: Color(0xFFEF4444)),
  'bag': const CategoryInfo(
      label: 'Bags', icon: Icons.shopping_bag, color: Color(0xFF8B5CF6)),
  'jewelry': const CategoryInfo(
      label: 'Jewelry', icon: Icons.diamond, color: Color(0xFFEC4899)),
  'other': const CategoryInfo(
      label: 'Other', icon: Icons.more_horiz, color: Color(0xFF6B7280)),
};

// ── Occasions ───────────────────────────────────────────────

const List<String> occasions = [
  'casual',
  'formal',
  'business',
  'party',
  'date_night',
  'workout',
  'outdoor',
  'beach',
  'wedding',
  'interview',
  'travel',
  'festival',
  'brunch',
  'evening',
];

// ── Seasons ─────────────────────────────────────────────────

class SeasonInfo {
  final String key;
  final String label;
  final String icon;

  const SeasonInfo({
    required this.key,
    required this.label,
    required this.icon,
  });
}

const List<SeasonInfo> seasons = [
  SeasonInfo(key: 'spring', label: 'Spring', icon: '🌸'),
  SeasonInfo(key: 'summer', label: 'Summer', icon: '☀️'),
  SeasonInfo(key: 'autumn', label: 'Autumn', icon: '🍂'),
  SeasonInfo(key: 'winter', label: 'Winter', icon: '❄️'),
  SeasonInfo(key: 'allseason', label: 'All Season', icon: '🔄'),
];

// ── WebSocket Config ────────────────────────────────────────

class WsConfig {
  WsConfig._();

  static const int heartbeatInterval = 10000;
  static const int reconnectBaseDelay = 1000;
  static const int reconnectMaxDelay = 30000;
  static const int reconnectMaxAttempts = 10;
  static const double jitterFactor = 0.3;
}
