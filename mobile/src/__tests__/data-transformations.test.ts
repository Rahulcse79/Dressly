// ─── Data Transformation & Serialization Tests ─────────────────────────────
// Tests for data mapping, transformation pipelines, and serialization

describe('User Data Transformations', () => {
  const rawUserFromAPI = {
    id: 'usr_abc123',
    email: 'alice@dressly.com',
    role: 'pro',
    is_verified: true,
    is_active: true,
    display_name: 'Alice Johnson',
    avatar_url: 'https://cdn.dressly.com/avatars/alice.jpg',
    gender: 'female',
    body_type: 'hourglass',
    style_preferences: '["minimalist","casual","boho"]',
    color_preferences: '["earth_tones","pastels"]',
    created_at: '2024-01-15T08:30:00Z',
  };

  it('maps API user to display model', () => {
    const display = {
      name: rawUserFromAPI.display_name || rawUserFromAPI.email.split('@')[0],
      avatar: rawUserFromAPI.avatar_url,
      isPro: rawUserFromAPI.role === 'pro' || rawUserFromAPI.role === 'admin',
      isAdmin: rawUserFromAPI.role === 'admin',
      memberSince: new Date(rawUserFromAPI.created_at).getFullYear(),
    };
    expect(display.name).toBe('Alice Johnson');
    expect(display.isPro).toBe(true);
    expect(display.isAdmin).toBe(false);
    expect(display.memberSince).toBe(2024);
  });

  it('generates initials from display_name', () => {
    const name = rawUserFromAPI.display_name!;
    const initials = name.split(' ').map(p => p[0]).join('').toUpperCase();
    expect(initials).toBe('AJ');
  });

  it('falls back to email for display name', () => {
    const user = { ...rawUserFromAPI, display_name: null };
    const name = user.display_name || user.email.split('@')[0];
    expect(name).toBe('alice');
  });

  it('parses JSON style_preferences', () => {
    const prefs = JSON.parse(rawUserFromAPI.style_preferences);
    expect(prefs).toEqual(['minimalist', 'casual', 'boho']);
    expect(prefs).toHaveLength(3);
  });

  it('parses JSON color_preferences', () => {
    const prefs = JSON.parse(rawUserFromAPI.color_preferences);
    expect(prefs).toEqual(['earth_tones', 'pastels']);
  });

  it('handles null style_preferences', () => {
    const user = { ...rawUserFromAPI, style_preferences: null };
    const prefs = user.style_preferences ? JSON.parse(user.style_preferences) : [];
    expect(prefs).toEqual([]);
  });

  it('calculates account age in days', () => {
    const created = new Date(rawUserFromAPI.created_at);
    const now = new Date('2024-07-15T00:00:00Z');
    const days = Math.floor((now.getTime() - created.getTime()) / (24 * 60 * 60 * 1000));
    expect(days).toBe(182);
  });
});

describe('Wardrobe Data Transformations', () => {
  const items = [
    { id: '1', category: 'top', color: 'Blue', season: 'summer', brand: 'Zara', occasion_tags: ['casual', 'office'], created_at: '2024-03-01' },
    { id: '2', category: 'bottom', color: 'Black', season: 'allseason', brand: 'Levis', occasion_tags: ['casual'], created_at: '2024-02-15' },
    { id: '3', category: 'shoes', color: 'White', season: 'summer', brand: 'Nike', occasion_tags: ['casual', 'gym'], created_at: '2024-04-01' },
    { id: '4', category: 'top', color: 'Red', season: 'winter', brand: null, occasion_tags: ['party'], created_at: '2024-01-10' },
    { id: '5', category: 'dress', color: 'Green', season: 'spring', brand: 'H&M', occasion_tags: ['date_night', 'party'], created_at: '2024-05-01' },
    { id: '6', category: 'accessory', color: 'Gold', season: 'allseason', brand: 'Swarovski', occasion_tags: ['formal', 'party'], created_at: '2024-03-15' },
  ];

  it('groups by category', () => {
    const grouped = items.reduce((acc, item) => {
      (acc[item.category] ??= []).push(item);
      return acc;
    }, {} as Record<string, typeof items>);

    expect(Object.keys(grouped)).toContain('top');
    expect(grouped['top']).toHaveLength(2);
    expect(grouped['bottom']).toHaveLength(1);
    expect(grouped['shoes']).toHaveLength(1);
  });

  it('groups by season', () => {
    const grouped = items.reduce((acc, item) => {
      (acc[item.season] ??= []).push(item);
      return acc;
    }, {} as Record<string, typeof items>);

    expect(grouped['summer']).toHaveLength(2);
    expect(grouped['allseason']).toHaveLength(2);
    expect(grouped['winter']).toHaveLength(1);
    expect(grouped['spring']).toHaveLength(1);
  });

  it('extracts unique colors', () => {
    const colors = [...new Set(items.map(i => i.color))];
    expect(colors).toHaveLength(6);
    expect(colors).toContain('Blue');
    expect(colors).toContain('Black');
  });

  it('extracts unique brands (non-null)', () => {
    const brands = [...new Set(items.filter(i => i.brand).map(i => i.brand))];
    expect(brands).toHaveLength(5);
    expect(brands).toContain('Zara');
    expect(brands).not.toContain(null);
  });

  it('flattens and deduplicates occasion tags', () => {
    const allTags = [...new Set(items.flatMap(i => i.occasion_tags))];
    expect(allTags).toContain('casual');
    expect(allTags).toContain('office');
    expect(allTags).toContain('party');
    expect(allTags).toContain('gym');
    expect(allTags).toContain('date_night');
    expect(allTags).toContain('formal');
  });

  it('sorts by created_at newest first', () => {
    const sorted = [...items].sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    expect(sorted[0].id).toBe('5'); // May
    expect(sorted[sorted.length - 1].id).toBe('4'); // January
  });

  it('filters by occasion tag', () => {
    const partyItems = items.filter(i => i.occasion_tags.includes('party'));
    expect(partyItems).toHaveLength(3);
  });

  it('filters by brand', () => {
    const zaraItems = items.filter(i => i.brand === 'Zara');
    expect(zaraItems).toHaveLength(1);
    expect(zaraItems[0].id).toBe('1');
  });

  it('calculates category percentages', () => {
    const total = items.length;
    const topCount = items.filter(i => i.category === 'top').length;
    const percentage = Math.round((topCount / total) * 100);
    expect(percentage).toBe(33);
  });

  it('finds most common category', () => {
    const counts = items.reduce((acc, i) => {
      acc[i.category] = (acc[i.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const mostCommon = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    expect(mostCommon[0]).toBe('top');
    expect(mostCommon[1]).toBe(2);
  });
});

describe('Notification Data Transformations', () => {
  const notifications = [
    { id: 'n1', type: 'ai_generation_complete', title: 'Outfit Ready', is_read: false, created_at: '2024-06-15T10:00:00Z' },
    { id: 'n2', type: 'payment_success', title: 'Payment Received', is_read: true, created_at: '2024-06-14T09:00:00Z' },
    { id: 'n3', type: 'style_tip', title: 'Daily Style Tip', is_read: false, created_at: '2024-06-15T08:00:00Z' },
    { id: 'n4', type: 'subscription_expiring', title: 'Pro Expiring Soon', is_read: false, created_at: '2024-06-15T12:00:00Z' },
    { id: 'n5', type: 'admin_announcement', title: 'New Features!', is_read: true, created_at: '2024-06-13T14:00:00Z' },
  ];

  it('counts unread notifications', () => {
    const unread = notifications.filter(n => !n.is_read).length;
    expect(unread).toBe(3);
  });

  it('counts read notifications', () => {
    const read = notifications.filter(n => n.is_read).length;
    expect(read).toBe(2);
  });

  it('sorts by created_at descending', () => {
    const sorted = [...notifications].sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    expect(sorted[0].id).toBe('n4');
    expect(sorted[sorted.length - 1].id).toBe('n5');
  });

  it('filters by type', () => {
    const aiNotifs = notifications.filter(n => n.type === 'ai_generation_complete');
    expect(aiNotifs).toHaveLength(1);
  });

  it('groups by date', () => {
    const grouped = notifications.reduce((acc, n) => {
      const date = n.created_at.split('T')[0];
      (acc[date] ??= []).push(n);
      return acc;
    }, {} as Record<string, typeof notifications>);

    expect(grouped['2024-06-15']).toHaveLength(3);
    expect(grouped['2024-06-14']).toHaveLength(1);
  });

  it('badge shows unread count', () => {
    const unread = notifications.filter(n => !n.is_read).length;
    const badgeText = unread > 9 ? '9+' : `${unread}`;
    expect(badgeText).toBe('3');
  });

  it('badge shows 9+ for large counts', () => {
    const unread = 25;
    const badgeText = unread > 9 ? '9+' : `${unread}`;
    expect(badgeText).toBe('9+');
  });

  it('maps notification type to icon', () => {
    const iconMap: Record<string, string> = {
      ai_generation_complete: '✨',
      payment_success: '💳',
      payment_failed: '❌',
      subscription_activated: '🎉',
      subscription_expiring: '⚠️',
      admin_announcement: '📢',
      style_tip: '💡',
    };

    notifications.forEach(n => {
      expect(iconMap[n.type]).toBeDefined();
    });
  });
});

describe('Generation Data Transformations', () => {
  const generations = [
    { id: 'g1', prompt_text: 'Casual summer outfit', style_score: 85, status: 'completed', latency_ms: 1200, created_at: '2024-06-15T10:00:00Z' },
    { id: 'g2', prompt_text: 'Formal evening wear', style_score: 92, status: 'completed', latency_ms: 1500, created_at: '2024-06-14T14:00:00Z' },
    { id: 'g3', prompt_text: 'Gym outfit', style_score: 78, status: 'completed', latency_ms: 900, created_at: '2024-06-15T08:00:00Z' },
    { id: 'g4', prompt_text: 'Beach day', style_score: null, status: 'failed', latency_ms: 500, created_at: '2024-06-15T09:00:00Z' },
    { id: 'g5', prompt_text: 'Office casual', style_score: 88, status: 'completed', latency_ms: 1100, created_at: '2024-06-13T11:00:00Z' },
  ];

  it('filters completed generations', () => {
    const completed = generations.filter(g => g.status === 'completed');
    expect(completed).toHaveLength(4);
  });

  it('calculates average style score', () => {
    const completed = generations.filter(g => g.style_score !== null);
    const avg = completed.reduce((sum, g) => sum + g.style_score!, 0) / completed.length;
    expect(avg).toBeCloseTo(85.75, 1);
  });

  it('calculates average latency', () => {
    const avg = generations.reduce((sum, g) => sum + g.latency_ms, 0) / generations.length;
    expect(avg).toBe(1040);
  });

  it('finds best scored generation', () => {
    const best = generations
      .filter(g => g.style_score !== null)
      .sort((a, b) => b.style_score! - a.style_score!)[0];
    expect(best.id).toBe('g2');
    expect(best.style_score).toBe(92);
  });

  it('calculates success rate', () => {
    const total = generations.length;
    const successful = generations.filter(g => g.status === 'completed').length;
    const rate = (successful / total) * 100;
    expect(rate).toBe(80);
  });

  it('formats latency for display', () => {
    const format = (ms: number) =>
      ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;

    expect(format(1200)).toBe('1.2s');
    expect(format(500)).toBe('500ms');
    expect(format(1500)).toBe('1.5s');
  });

  it('counts daily generations', () => {
    const today = '2024-06-15';
    const todayCount = generations.filter(g =>
      g.created_at.startsWith(today)
    ).length;
    expect(todayCount).toBe(3);
  });
});

describe('Subscription Data Transformations', () => {
  it('calculates days remaining', () => {
    const expiresAt = '2024-07-15T00:00:00Z';
    const now = new Date('2024-06-15T00:00:00Z');
    const expires = new Date(expiresAt);
    const days = Math.ceil((expires.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
    expect(days).toBe(30);
  });

  it('detects expiring soon (< 7 days)', () => {
    const daysRemaining = 5;
    const isExpiringSoon = daysRemaining <= 7 && daysRemaining > 0;
    expect(isExpiringSoon).toBe(true);
  });

  it('detects expired', () => {
    const daysRemaining = -2;
    const isExpired = daysRemaining <= 0;
    expect(isExpired).toBe(true);
  });

  it('formats subscription period', () => {
    const start = '2024-01-15';
    const end = '2024-07-15';
    const period = `${new Date(start).toLocaleDateString()} - ${new Date(end).toLocaleDateString()}`;
    expect(period).toContain('2024');
  });

  it('determines effective plan type', () => {
    const getEffectivePlan = (sub: { plan_type: string; status: string } | null) => {
      if (!sub) return 'free';
      if (sub.status === 'active') return sub.plan_type;
      return 'free';
    };

    expect(getEffectivePlan(null)).toBe('free');
    expect(getEffectivePlan({ plan_type: 'pro', status: 'active' })).toBe('pro');
    expect(getEffectivePlan({ plan_type: 'pro', status: 'expired' })).toBe('free');
    expect(getEffectivePlan({ plan_type: 'pro', status: 'cancelled' })).toBe('free');
  });
});

describe('Search & Filter Pipelines', () => {
  const wardrobeItems = Array.from({ length: 100 }, (_, i) => ({
    id: `item-${i}`,
    category: ['top', 'bottom', 'shoes', 'accessory', 'dress'][i % 5],
    color: ['Red', 'Blue', 'Green', 'Black', 'White'][i % 5],
    season: ['spring', 'summer', 'autumn', 'winter', 'allseason'][i % 5],
    brand: i % 3 === 0 ? 'Zara' : i % 3 === 1 ? 'H&M' : null,
    occasion_tags: i % 2 === 0 ? ['casual'] : ['formal'],
    created_at: new Date(Date.now() - i * 86400000).toISOString(),
  }));

  it('applies category filter', () => {
    const result = wardrobeItems.filter(i => i.category === 'top');
    expect(result).toHaveLength(20);
  });

  it('applies season filter', () => {
    const result = wardrobeItems.filter(i => i.season === 'summer');
    expect(result).toHaveLength(20);
  });

  it('applies color filter', () => {
    const result = wardrobeItems.filter(i => i.color === 'Blue');
    expect(result).toHaveLength(20);
  });

  it('applies brand filter', () => {
    const result = wardrobeItems.filter(i => i.brand === 'Zara');
    expect(result).toHaveLength(34); // every 3rd: ceil(100/3) = 34
  });

  it('applies occasion filter', () => {
    const result = wardrobeItems.filter(i => i.occasion_tags.includes('casual'));
    expect(result).toHaveLength(50);
  });

  it('chains multiple filters', () => {
    const result = wardrobeItems
      .filter(i => i.category === 'top')
      .filter(i => i.season === 'spring');
    expect(result).toHaveLength(4);
  });

  it('search + filter combined', () => {
    const searchTerm = 'blue';
    const result = wardrobeItems
      .filter(i => i.color.toLowerCase().includes(searchTerm))
      .filter(i => i.category === 'bottom');
    expect(result).toHaveLength(4);
  });

  it('no results with impossible filter combo', () => {
    const result = wardrobeItems
      .filter(i => i.category === 'top')
      .filter(i => i.color === 'Green')
      .filter(i => i.season === 'winter');
    expect(result).toHaveLength(0);
  });

  it('sorts filtered results by date', () => {
    const result = wardrobeItems
      .filter(i => i.category === 'shoes')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    expect(result).toHaveLength(20);
    expect(new Date(result[0].created_at).getTime())
      .toBeGreaterThanOrEqual(new Date(result[1].created_at).getTime());
  });

  it('paginates results', () => {
    const filtered = wardrobeItems.filter(i => i.category === 'top');
    const page = 1;
    const perPage = 5;
    const paginated = filtered.slice((page - 1) * perPage, page * perPage);
    expect(paginated).toHaveLength(5);
  });
});

describe('Form Validation Pipeline', () => {
  type ValidationResult = { valid: boolean; errors: string[] };

  const validateLoginForm = (email: string, password: string): ValidationResult => {
    const errors: string[] = [];
    if (!email) errors.push('Email is required');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Invalid email format');
    if (!password) errors.push('Password is required');
    else if (password.length < 8) errors.push('Password must be at least 8 characters');
    return { valid: errors.length === 0, errors };
  };

  it('valid login form', () => {
    const result = validateLoginForm('test@dressly.com', 'Str0ng!Pass');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('empty email error', () => {
    const result = validateLoginForm('', 'password');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Email is required');
  });

  it('invalid email error', () => {
    const result = validateLoginForm('not-an-email', 'password123');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Invalid email format');
  });

  it('empty password error', () => {
    const result = validateLoginForm('test@dressly.com', '');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password is required');
  });

  it('short password error', () => {
    const result = validateLoginForm('test@dressly.com', 'short');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must be at least 8 characters');
  });

  it('multiple errors', () => {
    const result = validateLoginForm('', '');
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(2);
  });

  const validateRegisterForm = (
    email: string, password: string, confirmPassword: string, displayName?: string
  ): ValidationResult => {
    const errors: string[] = [];
    if (!email) errors.push('Email is required');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Invalid email');
    if (!password) errors.push('Password is required');
    else if (password.length < 8) errors.push('Password too short');
    if (password !== confirmPassword) errors.push('Passwords do not match');
    if (displayName && displayName.length > 50) errors.push('Display name too long');
    return { valid: errors.length === 0, errors };
  };

  it('valid registration', () => {
    const result = validateRegisterForm('a@b.com', 'Str0ng!P', 'Str0ng!P');
    expect(result.valid).toBe(true);
  });

  it('password mismatch', () => {
    const result = validateRegisterForm('a@b.com', 'Str0ng!P', 'Different');
    expect(result.errors).toContain('Passwords do not match');
  });

  it('display name too long', () => {
    const result = validateRegisterForm('a@b.com', 'Str0ng!P', 'Str0ng!P', 'A'.repeat(51));
    expect(result.errors).toContain('Display name too long');
  });

  it('all fields invalid', () => {
    const result = validateRegisterForm('', '', 'x');
    expect(result.errors.length).toBeGreaterThanOrEqual(3);
  });
});
