// ══════════════════════════════════════════════════════════════
// Dressly — Core Type Definitions
// ══════════════════════════════════════════════════════════════

// ── User Types ──────────────────────────────────────────────
export type UserRole = 'user' | 'pro' | 'admin';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  is_verified: boolean;
  is_active: boolean;
  display_name: string | null;
  avatar_url: string | null;
  gender: string | null;
  body_type: string | null;
  style_preferences: Record<string, unknown> | null;
  color_preferences: string[] | null;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user: User;
}

export interface UpdateProfileRequest {
  display_name?: string;
  gender?: string;
  body_type?: string;
  style_preferences?: Record<string, unknown>;
  color_preferences?: string[];
}

// ── Auth Types ──────────────────────────────────────────────
export interface RegisterRequest {
  email: string;
  password: string;
  display_name?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  device_id?: string;
  fcm_token?: string;
  platform?: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

// ── Wardrobe Types ──────────────────────────────────────────
export type ClothingCategory =
  | 'top' | 'bottom' | 'dress' | 'outerwear'
  | 'shoes' | 'accessory' | 'bag' | 'jewelry' | 'other';

export type Season = 'spring' | 'summer' | 'autumn' | 'winter' | 'allseason';

export interface WardrobeItem {
  id: string;
  user_id: string;
  image_url: string;
  category: ClothingCategory;
  color: string | null;
  brand: string | null;
  occasion_tags: string[] | null;
  season: Season | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface AddWardrobeItemRequest {
  category: ClothingCategory;
  color?: string;
  brand?: string;
  occasion_tags?: string[];
  season?: Season;
  image: string; // Base64 or URI
}

// ── AI Generation Types ─────────────────────────────────────
export type GenerationStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface OutfitGeneration {
  id: string;
  user_id: string;
  prompt_text: string;
  input_image_urls: string[];
  output_image_url: string | null;
  style_score: number | null;
  occasion: string | null;
  ai_feedback: string | null;
  model_version: string;
  latency_ms: number | null;
  status: GenerationStatus;
  error_message: string | null;
  created_at: string;
}

export interface GenerateOutfitRequest {
  prompt: string;
  occasion?: string;
  image_ids?: string[];
}

export interface AiQuota {
  used_today: number;
  daily_limit: number;
  remaining: number;
  is_pro: boolean;
  resets_at: string;
}

// ── Subscription Types ──────────────────────────────────────
export type PlanType = 'free' | 'pro';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'pending';

export interface Subscription {
  id: string;
  user_id: string;
  plan_type: PlanType;
  status: SubscriptionStatus;
  price_inr: number;
  starts_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface SubscriptionResponse {
  subscription: Subscription | null;
  is_pro: boolean;
  days_remaining: number | null;
}

export interface CheckoutResponse {
  order_id: string;
  amount: number;
  currency: string;
  key_id: string;
  subscription_id: string;
}

export interface VerifyPaymentRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

// ── Notification Types ──────────────────────────────────────
export type NotificationType =
  | 'ai_generation_complete'
  | 'subscription_activated'
  | 'subscription_expiring'
  | 'admin_announcement'
  | 'style_tip'
  | 'payment_success'
  | 'payment_failed';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  notification_type: NotificationType;
  is_read: boolean;
  data: Record<string, unknown> | null;
  created_at: string;
}

// ── WebSocket Types ─────────────────────────────────────────
export type WsClientMessageType = 'ping' | 'subscribe' | 'unsubscribe';
export type WsServerMessageType =
  | 'pong' | 'notification' | 'ai_progress' | 'ai_complete'
  | 'subscription_updated' | 'config_updated' | 'error' | 'connected';

export interface WsMessage {
  type: WsServerMessageType;
  [key: string]: unknown;
}

export interface AiProgressMessage {
  type: 'ai_progress';
  generation_id: string;
  status: string;
  progress: number;
  message: string | null;
}

// ── Admin Types ─────────────────────────────────────────────
export interface AdminConfig {
  key: string;
  value: unknown;
  updated_at: string;
  updated_by: string | null;
}

export interface AdminAnalytics {
  total_users: number;
  active_users: number;
  pro_users: number;
  total_generations: number;
  total_revenue_inr: number;
  active_subscriptions: number;
  ws_connections: number;
}

// ── API Response Types ──────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

// ── Theme Types ─────────────────────────────────────────────
export type ThemeMode = 'light' | 'dark' | 'system';
