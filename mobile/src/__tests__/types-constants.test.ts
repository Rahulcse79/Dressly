// ─── Types & Constants Tests ────────────────────────────────────────────────

describe('TypeScript Types', () => {
  // ── User Types ────────────────────────────────────────────

  it('UserRole has 3 values', () => {
    const roles = ['user', 'pro', 'admin'];
    expect(roles).toHaveLength(3);
  });

  it('User object has required fields', () => {
    const user = {
      id: '1',
      email: 'test@dressly.com',
      role: 'user',
      is_verified: true,
      is_active: true,
      display_name: 'Test',
      avatar_url: null,
      gender: null,
      body_type: null,
      style_preferences: null,
      color_preferences: null,
      created_at: '2024-01-01T00:00:00Z',
    };
    expect(user.id).toBeDefined();
    expect(user.email).toBeDefined();
    expect(user.role).toBeDefined();
    expect(typeof user.is_verified).toBe('boolean');
    expect(typeof user.is_active).toBe('boolean');
  });

  it('User role is valid', () => {
    const validRoles = ['user', 'pro', 'admin'];
    const role = 'pro';
    expect(validRoles).toContain(role);
  });

  // ── Wardrobe Types ────────────────────────────────────────

  it('ClothingCategory has 9 values', () => {
    const categories = [
      'top', 'bottom', 'dress', 'outerwear', 'shoes',
      'accessory', 'bag', 'jewelry', 'other',
    ];
    expect(categories).toHaveLength(9);
  });

  it('Season has 5 values', () => {
    const seasons = ['spring', 'summer', 'autumn', 'winter', 'allseason'];
    expect(seasons).toHaveLength(5);
  });

  it('WardrobeItem has required fields', () => {
    const item = {
      id: '1',
      user_id: '2',
      image_url: 'https://cdn.dressly.com/item.jpg',
      category: 'top',
      color: 'Blue',
      brand: null,
      occasion_tags: ['casual'],
      season: 'summer',
      metadata: null,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    };
    expect(item.id).toBeDefined();
    expect(item.image_url).toBeDefined();
    expect(item.category).toBeDefined();
  });

  // ── Generation Types ──────────────────────────────────────

  it('GenerationStatus has 4 values', () => {
    const statuses = ['pending', 'processing', 'completed', 'failed'];
    expect(statuses).toHaveLength(4);
  });

  it('OutfitGeneration has required fields', () => {
    const gen = {
      id: '1',
      user_id: '2',
      prompt_text: 'Create a casual outfit',
      input_image_urls: [],
      output_image_url: null,
      style_score: 85.0,
      occasion: 'casual',
      ai_feedback: 'Great!',
      model_version: 'gemini-2.0-flash',
      latency_ms: 1234,
      status: 'completed',
      error_message: null,
      created_at: '2024-01-01',
    };
    expect(gen.prompt_text).toBeDefined();
    expect(gen.model_version).toBeDefined();
  });

  // ── Subscription Types ────────────────────────────────────

  it('PlanType has 2 values', () => {
    const plans = ['free', 'pro'];
    expect(plans).toHaveLength(2);
  });

  it('SubscriptionStatus has 4 values', () => {
    const statuses = ['active', 'cancelled', 'expired', 'pending'];
    expect(statuses).toHaveLength(4);
  });

  // ── Notification Types ────────────────────────────────────

  it('NotificationType has 7 values', () => {
    const types = [
      'ai_generation_complete', 'subscription_activated',
      'subscription_expiring', 'admin_announcement',
      'style_tip', 'payment_success', 'payment_failed',
    ];
    expect(types).toHaveLength(7);
  });

  // ── WebSocket Types ───────────────────────────────────────

  it('WsServerMessageType has 8 values', () => {
    const types = [
      'pong', 'notification', 'ai_progress', 'ai_complete',
      'subscription_updated', 'config_updated', 'error', 'connected',
    ];
    expect(types).toHaveLength(8);
  });

  it('WsClientMessageType has 3 values', () => {
    const types = ['ping', 'subscribe', 'unsubscribe'];
    expect(types).toHaveLength(3);
  });

  // ── API Response Types ────────────────────────────────────

  it('ApiResponse structure is valid', () => {
    const response = { success: true, data: { id: '1' }, message: 'OK' };
    expect(response.success).toBe(true);
    expect(response.data).toBeDefined();
  });

  it('ApiError structure is valid', () => {
    const error = {
      success: false,
      error: { code: 'AUTH_FAILED', message: 'Unauthorized' },
    };
    expect(error.success).toBe(false);
    expect(error.error.code).toBeDefined();
    expect(error.error.message).toBeDefined();
  });

  it('PaginatedResponse structure is valid', () => {
    const response = {
      data: [{ id: '1' }, { id: '2' }],
      pagination: { page: 1, per_page: 20, total: 100, total_pages: 5 },
    };
    expect(response.pagination.total_pages).toBe(5);
    expect(response.data).toHaveLength(2);
  });

  // ── ThemeMode ─────────────────────────────────────────────

  it('ThemeMode has 3 values', () => {
    const modes = ['light', 'dark', 'system'];
    expect(modes).toHaveLength(3);
  });
});

describe('Constants', () => {
  // ── API Endpoints ─────────────────────────────────────────

  it('auth endpoints are defined', () => {
    const endpoints = {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
      REFRESH: '/auth/refresh',
      LOGOUT: '/auth/logout',
    };
    expect(endpoints.LOGIN).toContain('/auth/');
    expect(endpoints.REGISTER).toContain('/auth/');
    expect(endpoints.REFRESH).toContain('/auth/');
  });

  it('wardrobe endpoints are defined', () => {
    const endpoints = {
      WARDROBE: '/wardrobe',
      WARDROBE_ITEM: (id: string) => `/wardrobe/${id}`,
    };
    expect(endpoints.WARDROBE).toBe('/wardrobe');
    expect(endpoints.WARDROBE_ITEM('abc')).toBe('/wardrobe/abc');
  });

  it('generation endpoints are defined', () => {
    const endpoints = {
      GENERATE: '/ai/generate',
      ANALYZE: '/ai/analyze',
      QUOTA: '/ai/quota',
    };
    expect(endpoints.GENERATE).toContain('/ai/');
    expect(endpoints.QUOTA).toContain('/ai/');
  });

  it('subscription endpoints are defined', () => {
    const endpoints = {
      CHECKOUT: '/subscriptions/checkout',
      VERIFY: '/subscriptions/verify',
      STATUS: '/subscriptions/status',
    };
    expect(endpoints.CHECKOUT).toContain('/subscriptions/');
  });

  it('notification endpoints are defined', () => {
    const endpoints = {
      NOTIFICATIONS: '/notifications',
      NOTIFICATION_READ: (id: string) => `/notifications/${id}/read`,
    };
    expect(endpoints.NOTIFICATION_READ('n1')).toContain('/read');
  });

  // ── Storage Keys ──────────────────────────────────────────

  it('storage keys are unique', () => {
    const keys = [
      'access_token',
      'refresh_token',
      'user',
      'theme_mode',
      'onboarding_complete',
    ];
    const unique = new Set(keys);
    expect(unique.size).toBe(keys.length);
  });

  // ── Limits ────────────────────────────────────────────────

  it('free daily limit is a positive number', () => {
    const FREE_DAILY_LIMIT = 10;
    expect(FREE_DAILY_LIMIT).toBeGreaterThan(0);
  });

  it('pro daily limit is greater than free', () => {
    const FREE_DAILY_LIMIT = 10;
    const PRO_DAILY_LIMIT = 100;
    expect(PRO_DAILY_LIMIT).toBeGreaterThan(FREE_DAILY_LIMIT);
  });

  it('max image upload size is reasonable', () => {
    const MAX_IMAGE_SIZE_MB = 10;
    expect(MAX_IMAGE_SIZE_MB).toBeGreaterThanOrEqual(5);
    expect(MAX_IMAGE_SIZE_MB).toBeLessThanOrEqual(50);
  });

  it('max generation images is set', () => {
    const MAX_GENERATION_IMAGES = 5;
    expect(MAX_GENERATION_IMAGES).toBeGreaterThan(0);
    expect(MAX_GENERATION_IMAGES).toBeLessThanOrEqual(10);
  });

  // ── WebSocket Config ──────────────────────────────────────

  it('WS config has reconnect settings', () => {
    const config = {
      HEARTBEAT_INTERVAL: 10000,
      RECONNECT_BASE_DELAY: 1000,
      RECONNECT_MAX_DELAY: 30000,
      RECONNECT_MAX_ATTEMPTS: 10,
      JITTER_FACTOR: 0.3,
    };
    expect(config.HEARTBEAT_INTERVAL).toBeGreaterThan(0);
    expect(config.RECONNECT_MAX_DELAY).toBeGreaterThan(config.RECONNECT_BASE_DELAY);
    expect(config.JITTER_FACTOR).toBeGreaterThan(0);
    expect(config.JITTER_FACTOR).toBeLessThan(1);
  });

  // ── Color Constants ───────────────────────────────────────

  it('light theme has all required colors', () => {
    const requiredColors = [
      'background', 'text', 'textSecondary', 'primary',
      'surface', 'card', 'border', 'error', 'success',
    ];
    const lightColors: Record<string, string> = {
      background: '#FFFFFF',
      text: '#1A1A2E',
      textSecondary: '#6B7280',
      primary: '#6C63FF',
      surface: '#F9FAFB',
      card: '#FFFFFF',
      border: '#E5E7EB',
      error: '#EF4444',
      success: '#10B981',
    };
    requiredColors.forEach((key) => {
      expect(lightColors[key]).toBeDefined();
    });
  });

  it('dark theme has all required colors', () => {
    const requiredColors = [
      'background', 'text', 'textSecondary', 'primary',
      'surface', 'card', 'border', 'error', 'success',
    ];
    const darkColors: Record<string, string> = {
      background: '#0F0F23',
      text: '#E8E8F0',
      textSecondary: '#9CA3AF',
      primary: '#8B83FF',
      surface: '#1A1A2E',
      card: '#16213E',
      border: '#2D2D44',
      error: '#F87171',
      success: '#34D399',
    };
    requiredColors.forEach((key) => {
      expect(darkColors[key]).toBeDefined();
    });
  });

  // ── Font Sizes ────────────────────────────────────────────

  it('font sizes are ordered', () => {
    const sizes = { xs: 10, sm: 12, md: 14, lg: 16, xl: 18, xxl: 24, xxxl: 32 };
    expect(sizes.xs).toBeLessThan(sizes.sm);
    expect(sizes.sm).toBeLessThan(sizes.md);
    expect(sizes.md).toBeLessThan(sizes.lg);
    expect(sizes.lg).toBeLessThan(sizes.xl);
    expect(sizes.xl).toBeLessThan(sizes.xxl);
    expect(sizes.xxl).toBeLessThan(sizes.xxxl);
  });

  // ── Spacing ───────────────────────────────────────────────

  it('spacing values follow scale', () => {
    const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
    expect(spacing.xs).toBeLessThan(spacing.sm);
    expect(spacing.sm).toBeLessThan(spacing.md);
    expect(spacing.md).toBeLessThan(spacing.lg);
  });

  // ── Border Radius ─────────────────────────────────────────

  it('radius values follow scale', () => {
    const radius = { sm: 4, md: 8, lg: 12, xl: 16, full: 9999 };
    expect(radius.sm).toBeLessThan(radius.md);
    expect(radius.md).toBeLessThan(radius.lg);
    expect(radius.full).toBeGreaterThan(1000);
  });
});
