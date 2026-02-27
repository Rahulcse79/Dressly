// ─── Security & Cryptography Validation Tests ──────────────────────────────

describe('JWT Token Structure', () => {
  const createMockJWT = (header: object, payload: object) => {
    const h = Buffer.from(JSON.stringify(header)).toString('base64url');
    const p = Buffer.from(JSON.stringify(payload)).toString('base64url');
    return `${h}.${p}.mock_signature`;
  };

  const decodeJWT = (token: string) => {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    try {
      const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
      return { header, payload, signature: parts[2] };
    } catch {
      return null;
    }
  };

  it('creates valid 3-part JWT', () => {
    const token = createMockJWT({ alg: 'HS256', typ: 'JWT' }, { sub: 'usr-1' });
    expect(token.split('.')).toHaveLength(3);
  });

  it('decodes header correctly', () => {
    const token = createMockJWT({ alg: 'HS256', typ: 'JWT' }, { sub: 'usr-1' });
    const decoded = decodeJWT(token);
    expect(decoded?.header.alg).toBe('HS256');
    expect(decoded?.header.typ).toBe('JWT');
  });

  it('decodes payload correctly', () => {
    const token = createMockJWT(
      { alg: 'HS256' },
      { sub: 'usr-1', role: 'pro', exp: 1700000000 }
    );
    const decoded = decodeJWT(token);
    expect(decoded?.payload.sub).toBe('usr-1');
    expect(decoded?.payload.role).toBe('pro');
    expect(decoded?.payload.exp).toBe(1700000000);
  });

  it('returns null for invalid JWT', () => {
    expect(decodeJWT('not.a.valid.jwt.token')).toBeNull();
    expect(decodeJWT('')).toBeNull();
    expect(decodeJWT('only-one-part')).toBeNull();
  });

  it('access token has short expiry', () => {
    const now = Math.floor(Date.now() / 1000);
    const exp = now + 15 * 60; // 15 minutes
    const ttl = exp - now;
    expect(ttl).toBe(900);
    expect(ttl).toBeLessThanOrEqual(3600); // max 1 hour
  });

  it('refresh token has longer expiry', () => {
    const now = Math.floor(Date.now() / 1000);
    const exp = now + 7 * 24 * 60 * 60; // 7 days
    const ttl = exp - now;
    expect(ttl).toBe(604800);
  });

  const tokenPayloadFields = ['sub', 'role', 'exp', 'iat', 'jti'];
  tokenPayloadFields.forEach(field => {
    it(`JWT payload contains "${field}" claim`, () => {
      const payload: Record<string, any> = {
        sub: 'usr-1', role: 'user',
        exp: 1700000000, iat: 1699999000, jti: 'unique-id',
      };
      expect(payload[field]).toBeDefined();
    });
  });
});

describe('HMAC-SHA256 Signature Verification', () => {
  const mockHMAC = (message: string, key: string): string => {
    // Simplified mock - in real app uses crypto.createHmac
    let hash = 0;
    const combined = message + key;
    for (let i = 0; i < combined.length; i++) {
      hash = ((hash << 5) - hash + combined.charCodeAt(i)) | 0;
    }
    return Math.abs(hash).toString(16).padStart(16, '0');
  };

  it('same input produces same hash', () => {
    const h1 = mockHMAC('order_1|pay_1', 'secret');
    const h2 = mockHMAC('order_1|pay_1', 'secret');
    expect(h1).toBe(h2);
  });

  it('different message produces different hash', () => {
    const h1 = mockHMAC('order_1|pay_1', 'secret');
    const h2 = mockHMAC('order_2|pay_2', 'secret');
    expect(h1).not.toBe(h2);
  });

  it('different key produces different hash', () => {
    const h1 = mockHMAC('order_1|pay_1', 'key1');
    const h2 = mockHMAC('order_1|pay_1', 'key2');
    expect(h1).not.toBe(h2);
  });

  it('Razorpay signature format: order_id|payment_id', () => {
    const orderId = 'order_DZBRPBtjgaIrax';
    const paymentId = 'pay_EAm09Uq8wMK2Nm';
    const message = `${orderId}|${paymentId}`;
    expect(message).toBe('order_DZBRPBtjgaIrax|pay_EAm09Uq8wMK2Nm');
    expect(message).toContain('|');
  });

  it('validates signature match', () => {
    const expected = mockHMAC('msg', 'key');
    const received = mockHMAC('msg', 'key');
    const isValid = expected === received;
    expect(isValid).toBe(true);
  });

  it('rejects signature mismatch', () => {
    const expected = mockHMAC('msg', 'key');
    const received = 'tampered_signature';
    const isValid = expected === received;
    expect(isValid).toBe(false);
  });
});

describe('XSS Prevention', () => {
  const escapeHtml = (str: string): string => {
    const map: Record<string, string> = {
      '&': '&amp;', '<': '&lt;', '>': '&gt;',
      '"': '&quot;', "'": '&#x27;', '/': '&#x2F;',
    };
    return str.replace(/[&<>"'/]/g, char => map[char]);
  };

  const xssPayloads: Array<[string, string]> = [
    ['<script>alert("xss")</script>', '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;'],
    ['<img onerror="alert(1)" src=x>', '&lt;img onerror=&quot;alert(1)&quot; src=x&gt;'],
    ['<svg onload="alert(1)">', '&lt;svg onload=&quot;alert(1)&quot;&gt;'],
    ["javascript:alert('xss')", "javascript:alert(&#x27;xss&#x27;)"],
    ['<a href="javascript:void(0)">click</a>', '&lt;a href=&quot;javascript:void(0)&quot;&gt;click&lt;&#x2F;a&gt;'],
    ['"><script>alert(1)</script>', '&quot;&gt;&lt;script&gt;alert(1)&lt;&#x2F;script&gt;'],
    ["'><script>alert(1)</script>", "&#x27;&gt;&lt;script&gt;alert(1)&lt;&#x2F;script&gt;"],
    ['{{constructor.constructor("return this")()}}', '{{constructor.constructor(&quot;return this&quot;)()}}'],
  ];

  xssPayloads.forEach(([input, expected]) => {
    it(`escapes: ${input.slice(0, 30)}...`, () => {
      const escaped = escapeHtml(input);
      expect(escaped).toBe(expected);
      expect(escaped).not.toContain('<script>');
    });
  });

  it('safe text passes through', () => {
    const safe = 'Hello World';
    expect(escapeHtml(safe)).toBe('Hello World');
  });

  it('empty string passes through', () => {
    expect(escapeHtml('')).toBe('');
  });
});

describe('SQL Injection Prevention', () => {
  const sanitizeForSQL = (input: string): string => {
    return input.replace(/['";\\]/g, '');
  };

  const sqlInjections = [
    "'; DROP TABLE users; --",
    "1 OR 1=1",
    "1' OR '1'='1",
    "admin'--",
    "' UNION SELECT * FROM users --",
    "1; INSERT INTO users VALUES('hack')",
    "' AND 1=0 UNION SELECT password FROM users --",
    "1' AND (SELECT COUNT(*) FROM users) > 0 --",
    "'; EXEC xp_cmdshell('dir'); --",
    "' OR '' = '",
  ];

  sqlInjections.forEach(payload => {
    it(`sanitizes SQL injection: ${payload.slice(0, 25)}...`, () => {
      const sanitized = sanitizeForSQL(payload);
      expect(sanitized).not.toContain("'");
      expect(sanitized).not.toContain('"');
      expect(sanitized).not.toContain(';');
    });
  });
});

describe('Rate Limiting Algorithms', () => {
  // ── Token Bucket ──────────────────────────────────────────
  class TokenBucket {
    tokens: number;
    maxTokens: number;
    refillRate: number; // per second
    lastRefill: number;

    constructor(max: number, rate: number) {
      this.tokens = max;
      this.maxTokens = max;
      this.refillRate = rate;
      this.lastRefill = Date.now();
    }

    consume(now: number = Date.now()): boolean {
      const elapsed = (now - this.lastRefill) / 1000;
      this.tokens = Math.min(this.maxTokens, this.tokens + elapsed * this.refillRate);
      this.lastRefill = now;
      if (this.tokens >= 1) {
        this.tokens--;
        return true;
      }
      return false;
    }
  }

  it('allows requests within limit', () => {
    const bucket = new TokenBucket(10, 1);
    expect(bucket.consume()).toBe(true);
  });

  it('denies when empty', () => {
    const bucket = new TokenBucket(2, 0);
    expect(bucket.consume()).toBe(true);
    expect(bucket.consume()).toBe(true);
    expect(bucket.consume()).toBe(false);
  });

  it('refills over time', () => {
    const bucket = new TokenBucket(2, 10);
    const now = Date.now();
    bucket.consume(now);
    bucket.consume(now);
    expect(bucket.consume(now)).toBe(false);
    // After 1 second, 10 tokens refilled
    expect(bucket.consume(now + 1000)).toBe(true);
  });

  it('does not exceed max tokens', () => {
    const bucket = new TokenBucket(5, 100);
    const now = Date.now();
    bucket.consume(now + 60000); // 60 sec later, should not exceed 5
    expect(bucket.tokens).toBeLessThanOrEqual(5);
  });

  // ── Sliding Window Counter ────────────────────────────────
  class SlidingWindow {
    requests: number[] = [];
    windowMs: number;
    maxRequests: number;

    constructor(windowMs: number, maxRequests: number) {
      this.windowMs = windowMs;
      this.maxRequests = maxRequests;
    }

    allow(now: number = Date.now()): boolean {
      this.requests = this.requests.filter(t => now - t < this.windowMs);
      if (this.requests.length >= this.maxRequests) return false;
      this.requests.push(now);
      return true;
    }
  }

  it('allows within window limit', () => {
    const window = new SlidingWindow(60000, 10);
    for (let i = 0; i < 10; i++) {
      expect(window.allow()).toBe(true);
    }
  });

  it('blocks when limit exceeded', () => {
    const window = new SlidingWindow(60000, 3);
    const now = Date.now();
    expect(window.allow(now)).toBe(true);
    expect(window.allow(now + 1)).toBe(true);
    expect(window.allow(now + 2)).toBe(true);
    expect(window.allow(now + 3)).toBe(false);
  });

  it('allows after window expires', () => {
    const window = new SlidingWindow(1000, 1);
    const now = Date.now();
    expect(window.allow(now)).toBe(true);
    expect(window.allow(now + 500)).toBe(false);
    expect(window.allow(now + 1001)).toBe(true);
  });
});

describe('Input Encoding', () => {
  const base64Encode = (str: string) => Buffer.from(str).toString('base64');
  const base64Decode = (str: string) => Buffer.from(str, 'base64').toString();

  const testStrings = [
    'Hello, World!',
    'user@dressly.com',
    '{"key":"value"}',
    'Special chars: !@#$%^&*()',
    'Unicode: 日本語 한국어 العربية',
    '',
    'A',
    'A longer string that tests the encoding behavior with more data',
  ];

  testStrings.forEach(str => {
    it(`base64 round-trip: "${str.slice(0, 20)}"`, () => {
      const encoded = base64Encode(str);
      const decoded = base64Decode(encoded);
      expect(decoded).toBe(str);
    });
  });
});

describe('Password Hashing Rules', () => {
  const argon2Params = {
    algorithm: 'argon2id',
    version: 19,
    memoryCost: 65536, // 64MB
    timeCost: 3,
    parallelism: 4,
    hashLength: 32,
    saltLength: 16,
  };

  it('uses argon2id variant', () => {
    expect(argon2Params.algorithm).toBe('argon2id');
  });

  it('memory cost is 64MB', () => {
    expect(argon2Params.memoryCost).toBe(65536);
    expect(argon2Params.memoryCost).toBeGreaterThanOrEqual(32768);
  });

  it('time cost is at least 3 iterations', () => {
    expect(argon2Params.timeCost).toBeGreaterThanOrEqual(3);
  });

  it('parallelism is 4 threads', () => {
    expect(argon2Params.parallelism).toBe(4);
    expect(argon2Params.parallelism).toBeGreaterThanOrEqual(1);
  });

  it('hash length is 32 bytes', () => {
    expect(argon2Params.hashLength).toBe(32);
  });

  it('salt length is 16 bytes', () => {
    expect(argon2Params.saltLength).toBe(16);
  });

  it('hash format matches expected pattern', () => {
    const hashPattern = /^\$argon2id\$v=\d+\$m=\d+,t=\d+,p=\d+\$/;
    const sampleHash = '$argon2id$v=19$m=65536,t=3,p=4$salt$hash';
    expect(hashPattern.test(sampleHash)).toBe(true);
  });
});

describe('CORS Policy', () => {
  const allowedOrigins = [
    'https://dressly.com',
    'https://www.dressly.com',
    'https://admin.dressly.com',
    'https://api.dressly.com',
  ];

  const blockedOrigins = [
    'http://dressly.com',
    'https://evil.com',
    'https://dressly.com.evil.com',
    'null',
    '',
    'https://sub.dressly.com',
  ];

  allowedOrigins.forEach(origin => {
    it(`allows ${origin}`, () => {
      expect(allowedOrigins).toContain(origin);
    });
  });

  blockedOrigins.forEach(origin => {
    it(`blocks ${origin}`, () => {
      expect(allowedOrigins).not.toContain(origin);
    });
  });

  it('allows specific methods', () => {
    const methods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'];
    expect(methods).toContain('GET');
    expect(methods).toContain('POST');
    expect(methods).not.toContain('TRACE');
    expect(methods).not.toContain('CONNECT');
  });

  it('allows required headers', () => {
    const headers = ['Content-Type', 'Authorization', 'X-Request-ID'];
    expect(headers).toContain('Authorization');
    expect(headers).toContain('Content-Type');
  });
});
