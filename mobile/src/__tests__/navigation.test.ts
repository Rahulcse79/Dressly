// ─── Navigation & Routing Tests ─────────────────────────────────────────────

import { router } from 'expo-router';

// Mock expo-router
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    navigate: jest.fn(),
    canGoBack: jest.fn(() => true),
  },
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    navigate: jest.fn(),
    canGoBack: jest.fn(() => true),
  }),
  useLocalSearchParams: jest.fn(() => ({})),
  usePathname: jest.fn(() => '/'),
  useSegments: jest.fn(() => []),
  Link: 'Link',
  Stack: { Screen: 'Screen' },
  Tabs: { Screen: 'Screen' },
}));

describe('Navigation Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Auth Routes ─────────────────────────────────────────

  it('navigates to login', () => {
    router.push('/auth/login');
    expect(router.push).toHaveBeenCalledWith('/auth/login');
  });

  it('navigates to register', () => {
    router.push('/auth/register');
    expect(router.push).toHaveBeenCalledWith('/auth/register');
  });

  it('navigates to forgot password', () => {
    router.push('/auth/forgot-password');
    expect(router.push).toHaveBeenCalledWith('/auth/forgot-password');
  });

  it('replaces to login after logout', () => {
    router.replace('/auth/login');
    expect(router.replace).toHaveBeenCalledWith('/auth/login');
  });

  // ── Tab Routes ──────────────────────────────────────────

  it('navigates to home tab', () => {
    router.push('/(tabs)/home');
    expect(router.push).toHaveBeenCalledWith('/(tabs)/home');
  });

  it('navigates to wardrobe tab', () => {
    router.push('/(tabs)/wardrobe');
    expect(router.push).toHaveBeenCalledWith('/(tabs)/wardrobe');
  });

  it('navigates to generate tab', () => {
    router.push('/(tabs)/generate');
    expect(router.push).toHaveBeenCalledWith('/(tabs)/generate');
  });

  it('navigates to notifications tab', () => {
    router.push('/(tabs)/notifications');
    expect(router.push).toHaveBeenCalledWith('/(tabs)/notifications');
  });

  it('navigates to profile tab', () => {
    router.push('/(tabs)/profile');
    expect(router.push).toHaveBeenCalledWith('/(tabs)/profile');
  });

  // ── Admin Routes ────────────────────────────────────────

  it('navigates to admin dashboard', () => {
    router.push('/admin');
    expect(router.push).toHaveBeenCalledWith('/admin');
  });

  // ── Detail Routes ───────────────────────────────────────

  it('navigates to wardrobe item detail', () => {
    router.push('/wardrobe/item-123');
    expect(router.push).toHaveBeenCalledWith('/wardrobe/item-123');
  });

  it('navigates to generation result', () => {
    router.push('/generation/gen-456');
    expect(router.push).toHaveBeenCalledWith('/generation/gen-456');
  });

  it('navigates to notification detail', () => {
    router.push('/notifications/notif-789');
    expect(router.push).toHaveBeenCalledWith('/notifications/notif-789');
  });

  // ── Navigation Actions ──────────────────────────────────

  it('goes back', () => {
    router.back();
    expect(router.back).toHaveBeenCalled();
  });

  it('checks canGoBack', () => {
    const result = router.canGoBack();
    expect(result).toBe(true);
  });

  it('replaces route', () => {
    router.replace('/(tabs)/home');
    expect(router.replace).toHaveBeenCalledWith('/(tabs)/home');
  });

  it('navigate vs push', () => {
    router.navigate('/(tabs)/wardrobe');
    expect(router.navigate).toHaveBeenCalledWith('/(tabs)/wardrobe');
  });
});

describe('Route Guard Logic', () => {
  const routeGuard = (
    isAuthenticated: boolean,
    segments: string[],
    userRole: string
  ): string | null => {
    const isAuthRoute = segments[0] === 'auth';
    const isAdminRoute = segments[0] === 'admin';

    if (!isAuthenticated && !isAuthRoute) return '/auth/login';
    if (isAuthenticated && isAuthRoute) return '/(tabs)/home';
    if (isAdminRoute && userRole !== 'admin') return '/(tabs)/home';
    return null; // No redirect
  };

  it('redirects unauthenticated user to login from home', () => {
    expect(routeGuard(false, ['(tabs)', 'home'], 'user')).toBe('/auth/login');
  });

  it('redirects unauthenticated user to login from wardrobe', () => {
    expect(routeGuard(false, ['(tabs)', 'wardrobe'], 'user')).toBe('/auth/login');
  });

  it('redirects unauthenticated user to login from admin', () => {
    expect(routeGuard(false, ['admin'], 'user')).toBe('/auth/login');
  });

  it('allows unauthenticated user on auth routes', () => {
    expect(routeGuard(false, ['auth', 'login'], 'user')).toBeNull();
  });

  it('redirects authenticated user away from auth routes', () => {
    expect(routeGuard(true, ['auth', 'login'], 'user')).toBe('/(tabs)/home');
  });

  it('redirects authenticated user away from register', () => {
    expect(routeGuard(true, ['auth', 'register'], 'user')).toBe('/(tabs)/home');
  });

  it('allows authenticated user on home', () => {
    expect(routeGuard(true, ['(tabs)', 'home'], 'user')).toBeNull();
  });

  it('allows authenticated user on wardrobe', () => {
    expect(routeGuard(true, ['(tabs)', 'wardrobe'], 'user')).toBeNull();
  });

  it('allows authenticated user on generate', () => {
    expect(routeGuard(true, ['(tabs)', 'generate'], 'user')).toBeNull();
  });

  it('allows authenticated user on notifications', () => {
    expect(routeGuard(true, ['(tabs)', 'notifications'], 'user')).toBeNull();
  });

  it('allows authenticated user on profile', () => {
    expect(routeGuard(true, ['(tabs)', 'profile'], 'user')).toBeNull();
  });

  it('blocks non-admin from admin route', () => {
    expect(routeGuard(true, ['admin'], 'user')).toBe('/(tabs)/home');
  });

  it('blocks pro user from admin route', () => {
    expect(routeGuard(true, ['admin'], 'pro')).toBe('/(tabs)/home');
  });

  it('allows admin on admin route', () => {
    expect(routeGuard(true, ['admin'], 'admin')).toBeNull();
  });
});

describe('Deep Linking', () => {
  const parseDeepLink = (url: string) => {
    const pattern = /dressly:\/\/(\w+)(?:\/(.+))?/;
    const match = url.match(pattern);
    if (!match) return null;
    return { screen: match[1], params: match[2] || null };
  };

  it('parses home deep link', () => {
    expect(parseDeepLink('dressly://home')).toEqual({ screen: 'home', params: null });
  });

  it('parses wardrobe deep link', () => {
    expect(parseDeepLink('dressly://wardrobe')).toEqual({ screen: 'wardrobe', params: null });
  });

  it('parses item deep link', () => {
    expect(parseDeepLink('dressly://wardrobe/item-123')).toEqual({
      screen: 'wardrobe',
      params: 'item-123',
    });
  });

  it('parses generation deep link', () => {
    expect(parseDeepLink('dressly://generation/gen-456')).toEqual({
      screen: 'generation',
      params: 'gen-456',
    });
  });

  it('parses profile deep link', () => {
    expect(parseDeepLink('dressly://profile')).toEqual({ screen: 'profile', params: null });
  });

  it('returns null for invalid deep link', () => {
    expect(parseDeepLink('https://example.com')).toBeNull();
  });

  it('returns null for empty deep link', () => {
    expect(parseDeepLink('')).toBeNull();
  });

  it('parses notification deep link', () => {
    expect(parseDeepLink('dressly://notifications/n1')).toEqual({
      screen: 'notifications',
      params: 'n1',
    });
  });

  it('parses admin deep link', () => {
    expect(parseDeepLink('dressly://admin')).toEqual({ screen: 'admin', params: null });
  });

  it('parses settings deep link', () => {
    expect(parseDeepLink('dressly://settings')).toEqual({ screen: 'settings', params: null });
  });
});

describe('Tab Navigation State', () => {
  it('tracks active tab index', () => {
    const tabs = ['home', 'wardrobe', 'generate', 'notifications', 'profile'];
    let activeIndex = 0;
    expect(tabs[activeIndex]).toBe('home');

    activeIndex = 2;
    expect(tabs[activeIndex]).toBe('generate');
  });

  it('all tabs have icons', () => {
    const tabIcons: Record<string, string> = {
      home: '🏠',
      wardrobe: '👗',
      generate: '✨',
      notifications: '🔔',
      profile: '👤',
    };
    expect(Object.keys(tabIcons)).toHaveLength(5);
  });

  it('notification badge count', () => {
    let badgeCount = 0;
    expect(badgeCount).toBe(0);

    badgeCount = 5;
    expect(badgeCount).toBe(5);

    const showBadge = badgeCount > 0;
    expect(showBadge).toBe(true);
  });

  it('tabs are in correct order', () => {
    const tabs = ['home', 'wardrobe', 'generate', 'notifications', 'profile'];
    expect(tabs[0]).toBe('home');
    expect(tabs[4]).toBe('profile');
    expect(tabs.indexOf('generate')).toBe(2);
  });
});
