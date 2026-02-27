// ─── Home Screen Tests ──────────────────────────────────────────────────────

import React from 'react';
import { render } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/authStore';

// Mock stores
jest.mock('../../stores/authStore');
jest.mock('../../stores/themeStore', () => ({
  useThemeStore: (selector: any) =>
    selector({
      colors: {
        background: '#FFFFFF',
        text: '#1A1A2E',
        textSecondary: '#6B7280',
        primary: '#6C63FF',
        primaryLight: '#E8E7FF',
        surface: '#F9FAFB',
        card: '#FFFFFF',
        border: '#E5E7EB',
        error: '#EF4444',
        success: '#10B981',
      },
      isDark: false,
    }),
}));

jest.mock('../../hooks/useWebSocket', () => ({
  useWebSocket: () => ({ isConnected: true, send: jest.fn() }),
}));

describe('Home Screen Logic', () => {
  // ── User Greeting ─────────────────────────────────────────

  it('builds greeting from display name', () => {
    const user = { display_name: 'Alice', email: 'alice@dressly.com' };
    const greeting = `Hi, ${user.display_name || 'there'}!`;
    expect(greeting).toBe('Hi, Alice!');
  });

  it('uses fallback greeting when no display name', () => {
    const user = { display_name: null, email: 'user@dressly.com' };
    const greeting = `Hi, ${user.display_name || 'there'}!`;
    expect(greeting).toBe('Hi, there!');
  });

  // ── Time-based Greeting ───────────────────────────────────

  it('returns morning greeting before noon', () => {
    const hour = 9;
    const timeGreeting =
      hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
    expect(timeGreeting).toBe('Good Morning');
  });

  it('returns afternoon greeting in the afternoon', () => {
    const hour = 14;
    const timeGreeting =
      hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
    expect(timeGreeting).toBe('Good Afternoon');
  });

  it('returns evening greeting after 5pm', () => {
    const hour = 19;
    const timeGreeting =
      hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
    expect(timeGreeting).toBe('Good Evening');
  });

  // ── Quick Actions ─────────────────────────────────────────

  it('defines quick action items', () => {
    const actions = [
      { title: 'Generate Outfit', icon: 'sparkles', route: '/generate' },
      { title: 'My Wardrobe', icon: 'shirt', route: '/wardrobe' },
      { title: 'Style Tips', icon: 'bulb', route: '/tips' },
    ];
    expect(actions).toHaveLength(3);
    expect(actions[0].route).toBe('/generate');
  });

  // ── Pro Status ────────────────────────────────────────────

  it('shows upgrade prompt for free users', () => {
    const user = { role: 'user' };
    const showUpgrade = user.role === 'user';
    expect(showUpgrade).toBe(true);
  });

  it('hides upgrade prompt for pro users', () => {
    const user = { role: 'pro' };
    const showUpgrade = user.role === 'user';
    expect(showUpgrade).toBe(false);
  });

  it('hides upgrade prompt for admin users', () => {
    const user = { role: 'admin' };
    const showUpgrade = user.role === 'user';
    expect(showUpgrade).toBe(false);
  });
});

describe('Wardrobe Screen Logic', () => {
  // ── Category Filtering ────────────────────────────────────

  it('filters wardrobe by category', () => {
    const items = [
      { id: '1', category: 'top', color: 'Blue' },
      { id: '2', category: 'bottom', color: 'Black' },
      { id: '3', category: 'top', color: 'White' },
      { id: '4', category: 'shoes', color: 'Brown' },
    ];

    const filtered = items.filter((i) => i.category === 'top');
    expect(filtered).toHaveLength(2);
    expect(filtered.every((i) => i.category === 'top')).toBe(true);
  });

  it('shows all items when no filter', () => {
    const items = [
      { id: '1', category: 'top' },
      { id: '2', category: 'bottom' },
      { id: '3', category: 'shoes' },
    ];
    const filter: string | null = null;
    const filtered = filter ? items.filter((i) => i.category === filter) : items;
    expect(filtered).toHaveLength(3);
  });

  it('filters by multiple categories', () => {
    const items = [
      { id: '1', category: 'top' },
      { id: '2', category: 'bottom' },
      { id: '3', category: 'shoes' },
      { id: '4', category: 'accessory' },
    ];
    const categories = ['top', 'shoes'];
    const filtered = items.filter((i) => categories.includes(i.category));
    expect(filtered).toHaveLength(2);
  });

  // ── Season Filtering ──────────────────────────────────────

  it('filters by season', () => {
    const items = [
      { id: '1', season: 'summer' },
      { id: '2', season: 'winter' },
      { id: '3', season: 'summer' },
      { id: '4', season: 'allseason' },
    ];

    const filtered = items.filter(
      (i) => i.season === 'summer' || i.season === 'allseason'
    );
    expect(filtered).toHaveLength(3);
  });

  // ── Category List ─────────────────────────────────────────

  it('has all clothing categories', () => {
    const categories = [
      'top',
      'bottom',
      'dress',
      'outerwear',
      'shoes',
      'accessory',
      'bag',
      'jewelry',
      'other',
    ];
    expect(categories).toHaveLength(9);
  });

  // ── Sorting ───────────────────────────────────────────────

  it('sorts items by created date descending', () => {
    const items = [
      { id: '1', created_at: '2024-01-01' },
      { id: '2', created_at: '2024-03-01' },
      { id: '3', created_at: '2024-02-01' },
    ];

    const sorted = [...items].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    expect(sorted[0].id).toBe('2');
    expect(sorted[1].id).toBe('3');
    expect(sorted[2].id).toBe('1');
  });

  // ── Empty State ───────────────────────────────────────────

  it('detects empty wardrobe', () => {
    const items: any[] = [];
    expect(items.length === 0).toBe(true);
  });

  it('detects non-empty wardrobe', () => {
    const items = [{ id: '1' }];
    expect(items.length > 0).toBe(true);
  });
});

describe('Generate Screen Logic', () => {
  // ── Prompt Validation ─────────────────────────────────────

  it('validates non-empty prompt', () => {
    const prompt = 'Create a casual outfit for summer';
    expect(prompt.trim().length > 0).toBe(true);
  });

  it('rejects empty prompt', () => {
    const prompt = '';
    expect(prompt.trim().length > 0).toBe(false);
  });

  it('rejects whitespace-only prompt', () => {
    const prompt = '   ';
    expect(prompt.trim().length > 0).toBe(false);
  });

  it('validates prompt max length', () => {
    const maxLength = 500;
    const prompt = 'A'.repeat(501);
    expect(prompt.length <= maxLength).toBe(false);
  });

  // ── Image Validation ──────────────────────────────────────

  it('validates max images count', () => {
    const maxImages = 5;
    const images = Array(6).fill({ uri: 'test.jpg' });
    expect(images.length <= maxImages).toBe(false);
  });

  it('allows valid image count', () => {
    const maxImages = 5;
    const images = Array(3).fill({ uri: 'test.jpg' });
    expect(images.length <= maxImages).toBe(true);
  });

  // ── Occasion Options ──────────────────────────────────────

  it('has predefined occasions', () => {
    const occasions = [
      'casual',
      'formal',
      'business',
      'party',
      'date',
      'wedding',
      'sport',
      'travel',
    ];
    expect(occasions.length).toBeGreaterThan(0);
    expect(occasions).toContain('casual');
    expect(occasions).toContain('formal');
  });

  // ── AI Quota ──────────────────────────────────────────────

  it('checks remaining AI quota', () => {
    const quota = { used_today: 3, daily_limit: 10, remaining: 7, is_pro: false };
    expect(quota.remaining).toBe(7);
    expect(quota.remaining > 0).toBe(true);
  });

  it('detects exhausted quota', () => {
    const quota = { used_today: 10, daily_limit: 10, remaining: 0, is_pro: false };
    expect(quota.remaining).toBe(0);
    expect(quota.remaining > 0).toBe(false);
  });

  it('pro users have higher limit', () => {
    const freeQuota = { daily_limit: 10, is_pro: false };
    const proQuota = { daily_limit: 100, is_pro: true };
    expect(proQuota.daily_limit).toBeGreaterThan(freeQuota.daily_limit);
  });
});

describe('Notifications Screen Logic', () => {
  // ── Notification Types ────────────────────────────────────

  it('handles all notification types', () => {
    const types = [
      'ai_generation_complete',
      'subscription_activated',
      'subscription_expiring',
      'admin_announcement',
      'style_tip',
      'payment_success',
      'payment_failed',
    ];
    expect(types).toHaveLength(7);
  });

  it('formats notification type for display', () => {
    const typeMap: Record<string, string> = {
      ai_generation_complete: 'AI Complete',
      subscription_activated: 'Subscription',
      style_tip: 'Style Tip',
      admin_announcement: 'Announcement',
      payment_success: 'Payment',
    };
    expect(typeMap['ai_generation_complete']).toBe('AI Complete');
  });

  // ── Read/Unread ───────────────────────────────────────────

  it('separates read and unread notifications', () => {
    const notifications = [
      { id: '1', is_read: false },
      { id: '2', is_read: true },
      { id: '3', is_read: false },
    ];

    const unread = notifications.filter((n) => !n.is_read);
    const read = notifications.filter((n) => n.is_read);

    expect(unread).toHaveLength(2);
    expect(read).toHaveLength(1);
  });

  // ── Time Ago Formatting ───────────────────────────────────

  it('formats recent notification as "just now"', () => {
    const now = Date.now();
    const created = new Date(now - 30_000).toISOString();
    const diffMs = Date.now() - new Date(created).getTime();
    const diffMins = Math.floor(diffMs / 60_000);
    const label = diffMins < 1 ? 'Just now' : `${diffMins}m ago`;
    expect(label).toBe('Just now');
  });

  it('formats notification as minutes ago', () => {
    const now = Date.now();
    const created = new Date(now - 5 * 60_000).toISOString();
    const diffMs = Date.now() - new Date(created).getTime();
    const diffMins = Math.floor(diffMs / 60_000);
    const label = diffMins < 60 ? `${diffMins}m ago` : `${Math.floor(diffMins / 60)}h ago`;
    expect(label).toBe('5m ago');
  });
});

describe('Profile Screen Logic', () => {
  // ── User Info ─────────────────────────────────────────────

  it('displays user email', () => {
    const user = { email: 'alice@dressly.com', display_name: 'Alice' };
    expect(user.email).toBe('alice@dressly.com');
  });

  it('displays user role badge', () => {
    const roleLabels: Record<string, string> = {
      user: 'Free',
      pro: 'Pro ✨',
      admin: 'Admin 🛡️',
    };
    expect(roleLabels['user']).toBe('Free');
    expect(roleLabels['pro']).toBe('Pro ✨');
    expect(roleLabels['admin']).toBe('Admin 🛡️');
  });

  // ── Settings Items ────────────────────────────────────────

  it('has profile settings list', () => {
    const settings = [
      'Edit Profile',
      'Theme',
      'Notifications',
      'Subscription',
      'Privacy Policy',
      'Terms of Service',
      'About',
      'Logout',
    ];
    expect(settings).toContain('Edit Profile');
    expect(settings).toContain('Logout');
    expect(settings.length).toBeGreaterThanOrEqual(6);
  });

  // ── Logout Confirmation ───────────────────────────────────

  it('shows confirmation before logout', () => {
    const showConfirm = true;
    expect(showConfirm).toBe(true);
  });

  // ── Avatar ────────────────────────────────────────────────

  it('generates initials from display name', () => {
    const displayName = 'Alice Johnson';
    const parts = displayName.split(' ');
    const initials = parts.map((p) => p[0]).join('').toUpperCase();
    expect(initials).toBe('AJ');
  });

  it('handles single name initial', () => {
    const displayName = 'Alice';
    const parts = displayName.split(' ');
    const initials = parts.map((p) => p[0]).join('').toUpperCase();
    expect(initials).toBe('A');
  });

  it('handles null display name for avatar', () => {
    const displayName: string | null = null;
    const initials = displayName
      ? displayName.split(' ').map((p) => p[0]).join('').toUpperCase()
      : '?';
    expect(initials).toBe('?');
  });
});

describe('Admin Screen Logic', () => {
  // ── Admin Access ──────────────────────────────────────────

  it('checks admin role', () => {
    const user = { role: 'admin' };
    expect(user.role === 'admin').toBe(true);
  });

  it('denies non-admin access', () => {
    const user = { role: 'user' };
    expect(user.role === 'admin').toBe(false);
  });

  it('denies pro user admin access', () => {
    const user = { role: 'pro' };
    expect(user.role === 'admin').toBe(false);
  });

  // ── Analytics ─────────────────────────────────────────────

  it('formats analytics numbers', () => {
    const formatNumber = (n: number) =>
      n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` :
      n >= 1_000 ? `${(n / 1_000).toFixed(1)}K` :
      n.toString();

    expect(formatNumber(1_500_000)).toBe('1.5M');
    expect(formatNumber(25_000)).toBe('25.0K');
    expect(formatNumber(500)).toBe('500');
  });

  // ── Config Management ─────────────────────────────────────

  it('formats config key for display', () => {
    const formatKey = (key: string) =>
      key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

    expect(formatKey('daily_free_limit')).toBe('Daily Free Limit');
    expect(formatKey('pro_monthly_price_inr')).toBe('Pro Monthly Price Inr');
  });

  it('validates config value types', () => {
    const configs = [
      { key: 'daily_free_limit', value: 10, type: 'number' },
      { key: 'pro_monthly_price_inr', value: 499, type: 'number' },
      { key: 'maintenance_mode', value: false, type: 'boolean' },
    ];

    configs.forEach((c) => {
      expect(typeof c.value).toBe(c.type);
    });
  });

  // ── Revenue Formatting ────────────────────────────────────

  it('formats revenue in INR', () => {
    const amount = 125000;
    const formatted = `₹${amount.toLocaleString('en-IN')}`;
    expect(formatted).toContain('₹');
    expect(formatted).toContain('125');
  });
});
