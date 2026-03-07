// ══════════════════════════════════════════════════════════════
// Dressly — Core Data Models (Dart)
// ══════════════════════════════════════════════════════════════

// ── User Types ──────────────────────────────────────────────

enum UserRole { user, pro, admin }

class User {
  final String id;
  final String email;
  final UserRole role;
  final bool isVerified;
  final bool isActive;
  final String? displayName;
  final String? avatarUrl;
  final String? gender;
  final String? bodyType;
  final Map<String, dynamic>? stylePreferences;
  final List<String>? colorPreferences;
  final String createdAt;
  final String? subscriptionTier;

  const User({
    required this.id,
    required this.email,
    required this.role,
    required this.isVerified,
    required this.isActive,
    this.displayName,
    this.avatarUrl,
    this.gender,
    this.bodyType,
    this.stylePreferences,
    this.colorPreferences,
    required this.createdAt,
    this.subscriptionTier,
  });

  factory User.fromJson(Map<String, dynamic> json) => User(
        id: json['id'] as String,
        email: json['email'] as String,
        role: UserRole.values.firstWhere(
          (e) => e.name == json['role'],
          orElse: () => UserRole.user,
        ),
        isVerified: json['is_verified'] as bool? ?? false,
        isActive: json['is_active'] as bool? ?? true,
  displayName: json['display_name'] as String?,
  avatarUrl: json['avatar_url'] as String?,
  subscriptionTier: json['subscription_tier'] as String?,
        gender: json['gender'] as String?,
        bodyType: json['body_type'] as String?,
        stylePreferences: json['style_preferences'] as Map<String, dynamic>?,
        colorPreferences: (json['color_preferences'] as List<dynamic>?)
            ?.map((e) => e as String)
            .toList(),
        createdAt: json['created_at'] as String,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'email': email,
        'role': role.name,
        'is_verified': isVerified,
        'is_active': isActive,
        'display_name': displayName,
        'avatar_url': avatarUrl,
        'gender': gender,
        'body_type': bodyType,
        'style_preferences': stylePreferences,
        'color_preferences': colorPreferences,
        'created_at': createdAt,
        'subscription_tier': subscriptionTier,
      };

  // Convenience getter used in UI
  String get name => displayName ?? (email.split('@').first);
}

class TokenResponse {
  final String accessToken;
  final String refreshToken;
  final int expiresIn;
  final String tokenType;
  final User user;

  const TokenResponse({
    required this.accessToken,
    required this.refreshToken,
    required this.expiresIn,
    required this.tokenType,
    required this.user,
  });

  factory TokenResponse.fromJson(Map<String, dynamic> json) => TokenResponse(
        accessToken: json['access_token'] as String,
        refreshToken: json['refresh_token'] as String,
        expiresIn: json['expires_in'] as int,
        tokenType: json['token_type'] as String,
        user: User.fromJson(json['user'] as Map<String, dynamic>),
      );
}

// ── Auth Types ──────────────────────────────────────────────

class RegisterRequest {
  final String email;
  final String password;
  final String? displayName;

  const RegisterRequest({
    required this.email,
    required this.password,
    this.displayName,
  });

  Map<String, dynamic> toJson() => {
        'email': email,
        'password': password,
        if (displayName != null) 'display_name': displayName,
      };
}

class LoginRequest {
  final String email;
  final String password;
  final String? deviceId;
  final String? fcmToken;
  final String? platform;

  const LoginRequest({
    required this.email,
    required this.password,
    this.deviceId,
    this.fcmToken,
    this.platform,
  });

  Map<String, dynamic> toJson() => {
        'email': email,
        'password': password,
        if (deviceId != null) 'device_id': deviceId,
        if (fcmToken != null) 'fcm_token': fcmToken,
        if (platform != null) 'platform': platform,
      };
}

// ── Wardrobe Types ──────────────────────────────────────────

enum ClothingCategory {
  top,
  bottom,
  dress,
  outerwear,
  shoes,
  accessory,
  bag,
  jewelry,
  other,
}

enum Season { spring, summer, autumn, winter, allseason }

class WardrobeItem {
  final String id;
  final String userId;
  final String imageUrl;
  final ClothingCategory category;
  final String? color;
  final String? brand;
  final List<String>? occasionTags;
  final Season? season;
  final Map<String, dynamic>? metadata;
  final String createdAt;
  final String updatedAt;

  const WardrobeItem({
    required this.id,
    required this.userId,
    required this.imageUrl,
    required this.category,
    this.color,
    this.brand,
    this.occasionTags,
    this.season,
    this.metadata,
    required this.createdAt,
    required this.updatedAt,
  });

  factory WardrobeItem.fromJson(Map<String, dynamic> json) => WardrobeItem(
        id: json['id'] as String,
        userId: json['user_id'] as String,
        imageUrl: json['image_url'] as String,
        category: ClothingCategory.values.firstWhere(
          (e) => e.name == json['category'],
          orElse: () => ClothingCategory.other,
        ),
        color: json['color'] as String?,
        brand: json['brand'] as String?,
        occasionTags: (json['occasion_tags'] as List<dynamic>?)
            ?.map((e) => e as String)
            .toList(),
        season: json['season'] != null
            ? Season.values.firstWhere(
                (e) => e.name == json['season'],
                orElse: () => Season.allseason,
              )
            : null,
        metadata: json['metadata'] as Map<String, dynamic>?,
        createdAt: json['created_at'] as String,
        updatedAt: json['updated_at'] as String,
      );
}

// ── AI Generation Types ─────────────────────────────────────

enum GenerationStatus { pending, processing, completed, failed }

class OutfitGeneration {
  final String id;
  final String userId;
  final String promptText;
  final List<String> inputImageUrls;
  final String? outputImageUrl;
  final double? styleScore;
  final String? occasion;
  final String? aiFeedback;
  final String modelVersion;
  final int? latencyMs;
  final GenerationStatus status;
  final String? errorMessage;
  final String createdAt;

  const OutfitGeneration({
    required this.id,
    required this.userId,
    required this.promptText,
    required this.inputImageUrls,
    this.outputImageUrl,
    this.styleScore,
    this.occasion,
    this.aiFeedback,
    required this.modelVersion,
    this.latencyMs,
    required this.status,
    this.errorMessage,
    required this.createdAt,
  });

  factory OutfitGeneration.fromJson(Map<String, dynamic> json) =>
      OutfitGeneration(
        id: json['id'] as String,
        userId: json['user_id'] as String,
        promptText: json['prompt_text'] as String,
        inputImageUrls: (json['input_image_urls'] as List<dynamic>)
            .map((e) => e as String)
            .toList(),
        outputImageUrl: json['output_image_url'] as String?,
        styleScore: (json['style_score'] as num?)?.toDouble(),
        occasion: json['occasion'] as String?,
        aiFeedback: json['ai_feedback'] as String?,
        modelVersion: json['model_version'] as String,
        latencyMs: json['latency_ms'] as int?,
        status: GenerationStatus.values.firstWhere(
          (e) => e.name == json['status'],
          orElse: () => GenerationStatus.pending,
        ),
        errorMessage: json['error_message'] as String?,
        createdAt: json['created_at'] as String,
      );
}

class AiQuota {
  final int usedToday;
  final int dailyLimit;
  final int remaining;
  final bool isPro;
  final String resetsAt;

  const AiQuota({
    required this.usedToday,
    required this.dailyLimit,
    required this.remaining,
    required this.isPro,
    required this.resetsAt,
  });

  factory AiQuota.fromJson(Map<String, dynamic> json) => AiQuota(
        usedToday: json['used_today'] as int,
        dailyLimit: json['daily_limit'] as int,
        remaining: json['remaining'] as int,
        isPro: json['is_pro'] as bool,
        resetsAt: json['resets_at'] as String,
      );
}

// ── Subscription Types ──────────────────────────────────────

enum PlanType { free, pro }

enum SubscriptionStatus { active, cancelled, expired, pending }

class Subscription {
  final String id;
  final String userId;
  final PlanType planType;
  final SubscriptionStatus status;
  final double priceInr;
  final String? startsAt;
  final String? expiresAt;
  final String createdAt;

  const Subscription({
    required this.id,
    required this.userId,
    required this.planType,
    required this.status,
    required this.priceInr,
    this.startsAt,
    this.expiresAt,
    required this.createdAt,
  });

  factory Subscription.fromJson(Map<String, dynamic> json) => Subscription(
        id: json['id'] as String,
        userId: json['user_id'] as String,
        planType: PlanType.values.firstWhere(
          (e) => e.name == json['plan_type'],
          orElse: () => PlanType.free,
        ),
        status: SubscriptionStatus.values.firstWhere(
          (e) => e.name == json['status'],
          orElse: () => SubscriptionStatus.pending,
        ),
        priceInr: (json['price_inr'] as num).toDouble(),
        startsAt: json['starts_at'] as String?,
        expiresAt: json['expires_at'] as String?,
        createdAt: json['created_at'] as String,
      );
}

class SubscriptionResponse {
  final Subscription? subscription;
  final bool isPro;
  final int? daysRemaining;

  const SubscriptionResponse({
    this.subscription,
    required this.isPro,
    this.daysRemaining,
  });

  factory SubscriptionResponse.fromJson(Map<String, dynamic> json) =>
      SubscriptionResponse(
        subscription: json['subscription'] != null
            ? Subscription.fromJson(
                json['subscription'] as Map<String, dynamic>)
            : null,
        isPro: json['is_pro'] as bool,
        daysRemaining: json['days_remaining'] as int?,
      );
}

// ── Notification Types ──────────────────────────────────────

enum NotificationType {
  aiGenerationComplete,
  subscriptionActivated,
  subscriptionExpiring,
  adminAnnouncement,
  styleTip,
  paymentSuccess,
  paymentFailed,
  // Aliases used by UI
  outfitReady,
  styleAlert,
  subscriptionUpdate,
  systemUpdate,
  promotion,
}

NotificationType notificationTypeFromString(String s) {
  switch (s) {
    case 'ai_generation_complete':
      return NotificationType.aiGenerationComplete;
    case 'subscription_activated':
      return NotificationType.subscriptionActivated;
    case 'subscription_expiring':
      return NotificationType.subscriptionExpiring;
    case 'admin_announcement':
      return NotificationType.adminAnnouncement;
    case 'style_tip':
      return NotificationType.styleTip;
    case 'payment_success':
      return NotificationType.paymentSuccess;
    case 'payment_failed':
      return NotificationType.paymentFailed;
    case 'outfit_ready':
      return NotificationType.outfitReady;
    case 'style_alert':
      return NotificationType.styleAlert;
    case 'subscription_update':
      return NotificationType.subscriptionUpdate;
    case 'system_update':
      return NotificationType.systemUpdate;
    case 'promotion':
      return NotificationType.promotion;
    default:
      return NotificationType.adminAnnouncement;
  }
}

class AppNotification {
  final String id;
  final String userId;
  final String title;
  final String body;
  final NotificationType notificationType;
  final bool isRead;
  final Map<String, dynamic>? data;
  final String createdAt;

  const AppNotification({
    required this.id,
    required this.userId,
    required this.title,
    required this.body,
    required this.notificationType,
    required this.isRead,
    this.data,
    required this.createdAt,
  });

  AppNotification copyWith({bool? isRead}) => AppNotification(
        id: id,
        userId: userId,
        title: title,
        body: body,
        notificationType: notificationType,
    isRead: isRead ?? this.isRead,
        data: data,
        createdAt: createdAt,
      );

  // Convenience getters used by UI
  bool get read => isRead;
  DateTime get createdAtDate => DateTime.tryParse(createdAt) ?? DateTime.now();

  factory AppNotification.fromJson(Map<String, dynamic> json) =>
      AppNotification(
        id: json['id'] as String,
        userId: json['user_id'] as String,
        title: json['title'] as String,
        body: json['body'] as String,
        notificationType:
            notificationTypeFromString(json['notification_type'] as String),
        isRead: json['is_read'] as bool? ?? false,
        data: json['data'] as Map<String, dynamic>?,
        createdAt: json['created_at'] as String,
      );
}

// ── Admin Types ─────────────────────────────────────────────

class AdminConfig {
  final String key;
  final dynamic value;
  final String updatedAt;
  final String? updatedBy;
  // Parsed convenience getters (when value is a map)
  int? get maxDailyGenerations {
    if (value is Map && value['max_daily_generations'] != null) {
      return (value['max_daily_generations'] as num).toInt();
    }
    return null;
  }

  int? get maxWardrobeItems {
    if (value is Map && value['max_wardrobe_items'] != null) {
      return (value['max_wardrobe_items'] as num).toInt();
    }
    return null;
  }

  double? get subscriptionPrice {
    if (value is Map && value['subscription_price'] != null) {
      return (value['subscription_price'] as num).toDouble();
    }
    return null;
  }

  bool? get maintenanceMode {
    if (value is Map && value['maintenance_mode'] != null) {
      return value['maintenance_mode'] as bool;
    }
    return null;
  }

  const AdminConfig({
    required this.key,
    required this.value,
    required this.updatedAt,
    this.updatedBy,
  });

  factory AdminConfig.fromJson(Map<String, dynamic> json) => AdminConfig(
        key: json['key'] as String,
        value: json['value'],
        updatedAt: json['updated_at'] as String,
        updatedBy: json['updated_by'] as String?,
      );
}

class AdminAnalytics {
  final int totalUsers;
  final int activeUsers;
  final int proUsers;
  final int totalGenerations;
  final double totalRevenueInr;
  final int activeSubscriptions;
  final int wsConnections;

  const AdminAnalytics({
    required this.totalUsers,
    required this.activeUsers,
    required this.proUsers,
    required this.totalGenerations,
    required this.totalRevenueInr,
    required this.activeSubscriptions,
    required this.wsConnections,
  });

  factory AdminAnalytics.fromJson(Map<String, dynamic> json) =>
      AdminAnalytics(
        totalUsers: json['total_users'] as int,
        activeUsers: json['active_users'] as int,
        proUsers: json['pro_users'] as int,
        totalGenerations: json['total_generations'] as int,
        totalRevenueInr: (json['total_revenue_inr'] as num).toDouble(),
        activeSubscriptions: json['active_subscriptions'] as int,
        wsConnections: json['ws_connections'] as int,
      );

  // Backwards-compatible accessor expected by UI
  double get totalRevenue => totalRevenueInr;
}

// ── API Response Types ──────────────────────────────────────

class ApiResponse<T> {
  final bool success;
  final T data;
  final String? message;

  const ApiResponse({
    required this.success,
    required this.data,
    this.message,
  });
}

class PaginatedResponse<T> {
  final List<T> data;
  final int page;
  final int perPage;
  final int total;
  final int totalPages;

  const PaginatedResponse({
    required this.data,
    required this.page,
    required this.perPage,
    required this.total,
    required this.totalPages,
  });
}

// ── Theme Types ─────────────────────────────────────────────

enum ThemeMode { light, dark, system }
