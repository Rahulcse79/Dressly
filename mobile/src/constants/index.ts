// ══════════════════════════════════════════════════════════════
// Dressly — App Constants
// ══════════════════════════════════════════════════════════════

// ── API Configuration ───────────────────────────────────────
export const API_BASE_URL = __DEV__
  ? 'http://172.20.10.3:8080/v1'
  : 'https://api.dressly.app/v1';

export const WS_BASE_URL = __DEV__
  ? 'ws://172.20.10.3:8080/ws'
  : 'wss://api.dressly.app/ws';

// ── API Endpoints ───────────────────────────────────────────
export const ENDPOINTS = {
  // Auth
  REGISTER: '/auth/register',
  LOGIN: '/auth/login',
  REFRESH: '/auth/refresh',
  LOGOUT: '/auth/logout',

  // User
  ME: '/users/me',
  UPDATE_ME: '/users/me',
  DELETE_ME: '/users/me',
  UPLOAD_AVATAR: '/users/me/avatar',

  // Wardrobe
  WARDROBE_LIST: '/wardrobe',
  WARDROBE_ADD: '/wardrobe',
  WARDROBE_ITEM: (id: string) => `/wardrobe/${id}`,

  // AI
  AI_GENERATE: '/ai/generate',
  AI_LIST: '/ai/generations',
  AI_DETAIL: (id: string) => `/ai/generations/${id}`,
  AI_QUOTA: '/ai/quota',

  // Subscription
  SUBSCRIPTION: '/subscription',
  SUBSCRIPTION_CHECKOUT: '/subscription/checkout',
  SUBSCRIPTION_VERIFY: '/subscription/verify',
  SUBSCRIPTION_CANCEL: '/subscription/cancel',

  // Notifications
  NOTIFICATIONS: '/notifications',
  NOTIFICATION_READ: (id: string) => `/notifications/${id}/read`,
  REGISTER_FCM: '/notifications/token',
  NOTIFICATIONS_UNREAD: '/notifications/unread-count',

  // Admin
  ADMIN_USERS: '/admin/users',
  ADMIN_USER: (id: string) => `/admin/users/${id}`,
  ADMIN_CONFIG: '/admin/config',
  ADMIN_ANALYTICS: '/admin/analytics',
  ADMIN_SUBSCRIPTIONS: '/admin/subscriptions',

  // Health
  HEALTH: '/health',
  READINESS: '/health/ready',
} as const;

// ── Storage Keys ────────────────────────────────────────────
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'dressly.access-token',
  REFRESH_TOKEN: 'dressly.refresh-token',
  USER: 'dressly.user',
  THEME_MODE: 'dressly.theme-mode',
  ONBOARDING_DONE: 'dressly.onboarding-done',
  FCM_TOKEN: 'dressly.fcm-token',
  DEVICE_ID: 'dressly.device-id',
} as const;

// ── Theme Colors ────────────────────────────────────────────
export const LIGHT_COLORS = {
  background: '#FFFFFF',
  surface: '#F8F9FA',
  surfaceElevated: '#FFFFFF',
  text: '#1A1A2E',
  textSecondary: '#6C757D',
  textMuted: '#ADB5BD',
  primary: '#6C63FF',
  primaryLight: '#8B83FF',
  primaryDark: '#5046E4',
  secondary: '#FF6B9D',
  secondaryLight: '#FF8FB3',
  accent: '#00D9A5',
  error: '#EF4444',
  warning: '#F59E0B',
  success: '#10B981',
  info: '#3B82F6',
  border: '#E9ECEF',
  borderFocused: '#6C63FF',
  overlay: 'rgba(0,0,0,0.4)',
  card: '#FFFFFF',
  skeleton: '#E9ECEF',
  tabBarBackground: '#FFFFFF',
  statusBar: 'dark-content' as const,
} as const;

export const DARK_COLORS = {
  background: '#0D0D1A',
  surface: '#1A1A2E',
  surfaceElevated: '#252540',
  text: '#F8F9FA',
  textSecondary: '#ADB5BD',
  textMuted: '#6C757D',
  primary: '#8B83FF',
  primaryLight: '#A9A3FF',
  primaryDark: '#6C63FF',
  secondary: '#FF8FB3',
  secondaryLight: '#FFB3CC',
  accent: '#00F5BB',
  error: '#F87171',
  warning: '#FBBF24',
  success: '#34D399',
  info: '#60A5FA',
  border: '#2A2A45',
  borderFocused: '#8B83FF',
  overlay: 'rgba(0,0,0,0.6)',
  card: '#1A1A2E',
  skeleton: '#252540',
  tabBarBackground: '#1A1A2E',
  statusBar: 'light-content' as const,
} as const;

// ── Typography ──────────────────────────────────────────────
export const FONT_SIZES = {
  xs: 10,
  sm: 12,
  md: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
} as const;

export const FONT_WEIGHTS = {
  light: '300' as const,
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

// ── Spacing ─────────────────────────────────────────────────
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
} as const;

export const RADIUS = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
} as const;

// ── Animation Durations (ms) ────────────────────────────────
export const ANIMATION = {
  fast: 150,
  normal: 250,
  slow: 400,
  spring: { damping: 15, stiffness: 150 },
} as const;

// ── App Limits ──────────────────────────────────────────────
export const LIMITS = {
  MAX_WARDROBE_IMAGES: 200,
  MAX_GENERATION_IMAGES: 5,
  MAX_IMAGE_SIZE_MB: 10,
  FREE_DAILY_GENERATIONS: 5,
  PRO_DAILY_GENERATIONS: 100,
  PASSWORD_MIN_LENGTH: 8,
  DISPLAY_NAME_MAX_LENGTH: 50,
  MAX_OCCASION_TAGS: 10,
} as const;

// ── Clothing Categories Config ──────────────────────────────
export const CATEGORY_CONFIG = {
  top: { label: 'Tops', icon: 'shirt-outline', color: '#6C63FF' },
  bottom: { label: 'Bottoms', icon: 'body-outline', color: '#FF6B9D' },
  dress: { label: 'Dresses', icon: 'flower-outline', color: '#00D9A5' },
  outerwear: { label: 'Outerwear', icon: 'snow-outline', color: '#F59E0B' },
  shoes: { label: 'Shoes', icon: 'footsteps-outline', color: '#3B82F6' },
  accessory: { label: 'Accessories', icon: 'glasses-outline', color: '#EF4444' },
  bag: { label: 'Bags', icon: 'bag-outline', color: '#8B5CF6' },
  jewelry: { label: 'Jewelry', icon: 'diamond-outline', color: '#EC4899' },
  other: { label: 'Other', icon: 'ellipsis-horizontal-outline', color: '#6B7280' },
} as const;

// ── Occasions ───────────────────────────────────────────────
export const OCCASIONS = [
  'casual', 'formal', 'business', 'party', 'date_night',
  'workout', 'outdoor', 'beach', 'wedding', 'interview',
  'travel', 'festival', 'brunch', 'evening',
] as const;

// ── Seasons ─────────────────────────────────────────────────
export const SEASONS = [
  { key: 'spring', label: 'Spring', icon: '🌸' },
  { key: 'summer', label: 'Summer', icon: '☀️' },
  { key: 'autumn', label: 'Autumn', icon: '🍂' },
  { key: 'winter', label: 'Winter', icon: '❄️' },
  { key: 'allseason', label: 'All Season', icon: '🔄' },
] as const;

// ── Razorpay ────────────────────────────────────────────────
export const RAZORPAY = {
  COLOR: '#6C63FF',
  CURRENCY: 'INR',
  COMPANY_NAME: 'Dressly',
  DESCRIPTION: 'Dressly Pro Subscription',
  PREFILL: {
    contact: '',
    email: '',
  },
} as const;

// ── WebSocket ───────────────────────────────────────────────
export const WS_CONFIG = {
  HEARTBEAT_INTERVAL: 10_000, // 10s
  RECONNECT_BASE_DELAY: 1_000, // 1s
  RECONNECT_MAX_DELAY: 30_000, // 30s
  RECONNECT_MAX_ATTEMPTS: 10,
  JITTER_FACTOR: 0.3,
} as const;

// ── Query Keys (TanStack Query) ─────────────────────────────
export const QUERY_KEYS = {
  USER: ['user'] as const,
  WARDROBE: ['wardrobe'] as const,
  WARDROBE_ITEM: (id: string) => ['wardrobe', id] as const,
  GENERATIONS: ['generations'] as const,
  GENERATION: (id: string) => ['generations', id] as const,
  AI_QUOTA: ['ai-quota'] as const,
  SUBSCRIPTION: ['subscription'] as const,
  NOTIFICATIONS: ['notifications'] as const,
  UNREAD_COUNT: ['unread-count'] as const,
  ADMIN_USERS: ['admin-users'] as const,
  ADMIN_CONFIG: ['admin-config'] as const,
  ADMIN_ANALYTICS: ['admin-analytics'] as const,
  ADMIN_SUBSCRIPTIONS: ['admin-subscriptions'] as const,
} as const;
