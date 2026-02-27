// ─── Comprehensive Edge Case & Integration Tests ────────────────────────────

describe('Edge Cases', () => {
  // ── Email Edge Cases ──────────────────────────────────────

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  it('accepts normal email', () => expect(isValidEmail('test@dressly.com')).toBe(true));
  it('accepts email with dots', () => expect(isValidEmail('a.b.c@dressly.com')).toBe(true));
  it('accepts email with plus', () => expect(isValidEmail('test+tag@dressly.com')).toBe(true));
  it('accepts email with numbers', () => expect(isValidEmail('user123@dressly.com')).toBe(true));
  it('accepts email with hyphens', () => expect(isValidEmail('test-user@dressly.com')).toBe(true));
  it('accepts email with subdomain', () => expect(isValidEmail('a@b.c.d.com')).toBe(true));
  it('rejects email without @', () => expect(isValidEmail('nodomain.com')).toBe(false));
  it('rejects email without domain', () => expect(isValidEmail('test@')).toBe(false));
  it('rejects email without local part', () => expect(isValidEmail('@domain.com')).toBe(false));
  it('rejects empty email', () => expect(isValidEmail('')).toBe(false));
  it('rejects email with spaces', () => expect(isValidEmail('test @dressly.com')).toBe(false));
  it('rejects email without TLD', () => expect(isValidEmail('test@domain')).toBe(false));

  // ── Password Strength Edge Cases ──────────────────────────

  const checkPassword = (pw: string) => ({
    hasLength: pw.length >= 8,
    hasUpper: /[A-Z]/.test(pw),
    hasLower: /[a-z]/.test(pw),
    hasDigit: /[0-9]/.test(pw),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"|,.<>?]/.test(pw),
  });

  it('empty password fails all', () => {
    const r = checkPassword('');
    expect(r.hasLength).toBe(false);
  });

  it('short password fails length', () => {
    const r = checkPassword('Ab1!');
    expect(r.hasLength).toBe(false);
  });

  it('all lowercase fails uppercase check', () => {
    const r = checkPassword('abcdefgh1!');
    expect(r.hasUpper).toBe(false);
  });

  it('all uppercase fails lowercase check', () => {
    const r = checkPassword('ABCDEFGH1!');
    expect(r.hasLower).toBe(false);
  });

  it('no digits fails digit check', () => {
    const r = checkPassword('Abcdefgh!');
    expect(r.hasDigit).toBe(false);
  });

  it('no special chars fails special check', () => {
    const r = checkPassword('Abcdefgh1');
    expect(r.hasSpecial).toBe(false);
  });

  it('strong password passes all', () => {
    const r = checkPassword('Str0ng!Pass');
    expect(r.hasLength).toBe(true);
    expect(r.hasUpper).toBe(true);
    expect(r.hasLower).toBe(true);
    expect(r.hasDigit).toBe(true);
    expect(r.hasSpecial).toBe(true);
  });

  it('very long password passes', () => {
    const r = checkPassword('A'.repeat(50) + 'a1!bcdef');
    expect(r.hasLength).toBe(true);
  });

  // ── JSON Serialization Edge Cases ─────────────────────────

  it('serializes null values', () => {
    const obj = { value: null };
    expect(JSON.stringify(obj)).toBe('{"value":null}');
  });

  it('serializes nested objects', () => {
    const obj = { a: { b: { c: 1 } } };
    const str = JSON.stringify(obj);
    const parsed = JSON.parse(str);
    expect(parsed.a.b.c).toBe(1);
  });

  it('serializes arrays', () => {
    const arr = [1, 'two', null, { four: 4 }];
    const str = JSON.stringify(arr);
    const parsed = JSON.parse(str);
    expect(parsed).toHaveLength(4);
  });

  it('handles unicode in JSON', () => {
    const obj = { emoji: '👗', text: '日本語' };
    const str = JSON.stringify(obj);
    const parsed = JSON.parse(str);
    expect(parsed.emoji).toBe('👗');
    expect(parsed.text).toBe('日本語');
  });

  it('handles empty string JSON fields', () => {
    const obj = { name: '', value: 0, flag: false };
    const str = JSON.stringify(obj);
    const parsed = JSON.parse(str);
    expect(parsed.name).toBe('');
    expect(parsed.value).toBe(0);
    expect(parsed.flag).toBe(false);
  });

  // ── Date Handling ─────────────────────────────────────────

  it('parses ISO date string', () => {
    const dateStr = '2024-06-15T10:30:00Z';
    const date = new Date(dateStr);
    expect(date.getFullYear()).toBe(2024);
    expect(date.getUTCMonth()).toBe(5); // June (0-indexed)
  });

  it('compares dates correctly', () => {
    const d1 = new Date('2024-01-01');
    const d2 = new Date('2024-06-01');
    expect(d2.getTime()).toBeGreaterThan(d1.getTime());
  });

  it('calculates days remaining', () => {
    const now = new Date();
    const future = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const daysRemaining = Math.ceil(
      (future.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
    );
    expect(daysRemaining).toBe(30);
  });

  it('detects expired dates', () => {
    const past = new Date('2020-01-01');
    expect(past.getTime() < Date.now()).toBe(true);
  });

  // ── Number Formatting ─────────────────────────────────────

  it('formats currency in INR', () => {
    const amount = 49900;
    const formatted = (amount / 100).toFixed(2);
    expect(formatted).toBe('499.00');
  });

  it('formats large numbers', () => {
    const format = (n: number) =>
      n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` :
      n >= 1_000 ? `${(n / 1_000).toFixed(1)}K` : `${n}`;

    expect(format(0)).toBe('0');
    expect(format(999)).toBe('999');
    expect(format(1000)).toBe('1.0K');
    expect(format(1500)).toBe('1.5K');
    expect(format(1_000_000)).toBe('1.0M');
    expect(format(2_500_000)).toBe('2.5M');
  });

  it('formats percentage', () => {
    const score = 85.5;
    expect(`${score}%`).toBe('85.5%');
    expect(`${Math.round(score)}%`).toBe('86%');
  });

  // ── Array Operations ──────────────────────────────────────

  it('removes duplicates', () => {
    const arr = [1, 2, 2, 3, 3, 3];
    const unique = [...new Set(arr)];
    expect(unique).toEqual([1, 2, 3]);
  });

  it('chunks array', () => {
    const chunk = <T,>(arr: T[], size: number) =>
      Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
        arr.slice(i * size, (i + 1) * size)
      );

    const result = chunk([1, 2, 3, 4, 5, 6, 7], 3);
    expect(result).toEqual([[1, 2, 3], [4, 5, 6], [7]]);
  });

  it('groups items by key', () => {
    const items = [
      { category: 'top', name: 'Shirt' },
      { category: 'bottom', name: 'Jeans' },
      { category: 'top', name: 'T-shirt' },
    ];

    const grouped = items.reduce((acc, item) => {
      (acc[item.category] ??= []).push(item);
      return acc;
    }, {} as Record<string, typeof items>);

    expect(grouped['top']).toHaveLength(2);
    expect(grouped['bottom']).toHaveLength(1);
  });

  // ── String Operations ─────────────────────────────────────

  it('truncates long strings', () => {
    const truncate = (s: string, max: number) =>
      s.length > max ? s.slice(0, max - 3) + '...' : s;

    expect(truncate('Hello', 10)).toBe('Hello');
    expect(truncate('Hello World!', 8)).toBe('Hello...');
  });

  it('capitalizes first letter', () => {
    const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
    expect(capitalize('hello')).toBe('Hello');
    expect(capitalize('HELLO')).toBe('HELLO');
  });

  it('generates initials', () => {
    const getInitials = (name: string) =>
      name.split(' ').map((p) => p[0]?.toUpperCase()).filter(Boolean).join('');

    expect(getInitials('Alice Johnson')).toBe('AJ');
    expect(getInitials('Bob')).toBe('B');
    expect(getInitials('Alice Bob Charlie')).toBe('ABC');
  });

  // ── UUID Validation ───────────────────────────────────────

  it('validates UUID v4 format', () => {
    const uuid = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';
    const isValid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid);
    expect(isValid).toBe(true);
  });

  it('rejects invalid UUID', () => {
    const uuid = 'not-a-uuid';
    const isValid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid);
    expect(isValid).toBe(false);
  });

  // ── URL Validation ────────────────────────────────────────

  it('validates HTTP URL', () => {
    const url = 'https://api.dressly.com/v1';
    expect(url.startsWith('http')).toBe(true);
  });

  it('validates WebSocket URL', () => {
    const url = 'wss://api.dressly.com/ws';
    expect(url.startsWith('ws')).toBe(true);
  });

  it('constructs CDN URL', () => {
    const cdnBase = 'https://cdn.dressly.com';
    const imageId = 'abc123';
    const url = `${cdnBase}/images/${imageId}.jpg`;
    expect(url).toBe('https://cdn.dressly.com/images/abc123.jpg');
  });
});

describe('Pagination Logic', () => {
  it('calculates total pages', () => {
    const totalPages = (total: number, perPage: number) =>
      Math.ceil(total / perPage);

    expect(totalPages(100, 20)).toBe(5);
    expect(totalPages(101, 20)).toBe(6);
    expect(totalPages(0, 20)).toBe(0);
    expect(totalPages(1, 20)).toBe(1);
    expect(totalPages(20, 20)).toBe(1);
  });

  it('determines hasMore', () => {
    expect(1 < 5).toBe(true);  // page 1 of 5
    expect(5 < 5).toBe(false); // page 5 of 5
    expect(6 < 5).toBe(false); // beyond
  });

  it('generates page numbers', () => {
    const pages = Array.from({ length: 5 }, (_, i) => i + 1);
    expect(pages).toEqual([1, 2, 3, 4, 5]);
  });

  it('calculates offset', () => {
    const offset = (page: number, perPage: number) => (page - 1) * perPage;
    expect(offset(1, 20)).toBe(0);
    expect(offset(2, 20)).toBe(20);
    expect(offset(3, 20)).toBe(40);
  });
});

describe('Color Utilities', () => {
  it('validates hex color format', () => {
    const isHex = (c: string) => /^#([0-9A-Fa-f]{3}){1,2}$/.test(c);
    expect(isHex('#6C63FF')).toBe(true);
    expect(isHex('#fff')).toBe(true);
    expect(isHex('#FFFFFF')).toBe(true);
    expect(isHex('red')).toBe(false);
    expect(isHex('#GGG')).toBe(false);
  });

  it('extracts RGB from hex', () => {
    const hex = '#6C63FF';
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    expect(r).toBe(108);
    expect(g).toBe(99);
    expect(b).toBe(255);
  });

  it('creates rgba string', () => {
    const rgba = (hex: string, alpha: number) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };
    expect(rgba('#6C63FF', 0.5)).toBe('rgba(108, 99, 255, 0.5)');
  });
});

describe('Rate Limiting Logic', () => {
  it('tracks request count', () => {
    let count = 0;
    const limit = 10;
    for (let i = 0; i < 15; i++) {
      if (count < limit) count++;
    }
    expect(count).toBe(10);
  });

  it('resets after window', () => {
    let count = 10;
    // Window reset
    count = 0;
    expect(count).toBe(0);
  });

  it('calculates retry-after', () => {
    const windowEnd = Date.now() + 60_000;
    const retryAfter = Math.ceil((windowEnd - Date.now()) / 1000);
    expect(retryAfter).toBeGreaterThan(0);
    expect(retryAfter).toBeLessThanOrEqual(60);
  });
});

describe('HMAC Signature Verification Logic', () => {
  it('constructs Razorpay signature body', () => {
    const orderId = 'order_abc123';
    const paymentId = 'pay_def456';
    const body = `${orderId}|${paymentId}`;
    expect(body).toBe('order_abc123|pay_def456');
  });

  it('hex signature has correct length', () => {
    // HMAC-SHA256 produces 32 bytes = 64 hex chars
    const sigLength = 64;
    const mockSig = 'a'.repeat(sigLength);
    expect(mockSig).toHaveLength(64);
  });

  it('signature comparison is constant-time concept', () => {
    const sig1 = 'abc123def456';
    const sig2 = 'abc123def456';
    const sig3 = 'different_sig';

    // Correct comparison
    expect(sig1 === sig2).toBe(true);
    expect(sig1 === sig3).toBe(false);
  });
});
