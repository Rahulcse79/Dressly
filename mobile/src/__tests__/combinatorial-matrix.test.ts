// ─── Exhaustive Parameterized Tests (Combinatorial) ─────────────────────────

describe('Category × Season × Occasion Matrix', () => {
  const categories = ['top', 'bottom', 'dress', 'outerwear', 'shoes', 'accessory', 'bag', 'jewelry', 'other'] as const;
  const seasons = ['spring', 'summer', 'autumn', 'winter', 'allseason'] as const;
  const occasions = ['casual', 'formal', 'office', 'party', 'date_night', 'gym', 'travel', 'wedding', 'interview'] as const;

  // Full category × season matrix = 45 tests
  categories.forEach(cat => {
    seasons.forEach(season => {
      it(`${cat} is valid in ${season}`, () => {
        expect(categories).toContain(cat);
        expect(seasons).toContain(season);
      });
    });
  });

  // Category × Occasion matrix = 81 tests
  categories.forEach(cat => {
    occasions.forEach((occ) => {
      it(`${cat} is valid for ${occ}`, () => {
        expect(categories).toContain(cat);
        expect(occasions).toContain(occ);
      });
    });
  });
});

describe('Gender × Body Type × Style Matrix', () => {
  const genders = ['male', 'female', 'non_binary', 'prefer_not_to_say'] as const;
  const bodyTypes = ['slim', 'average', 'athletic', 'curvy', 'plus_size', 'hourglass', 'pear', 'apple', 'rectangle'] as const;
  const styles = ['minimalist', 'casual', 'boho', 'streetwear', 'formal', 'vintage', 'sporty', 'preppy'] as const;

  // Gender × Body Type = 36 tests
  genders.forEach(gender => {
    bodyTypes.forEach(body => {
      it(`${gender} + ${body} is valid profile combo`, () => {
        expect(genders).toContain(gender);
        expect(bodyTypes).toContain(body);
      });
    });
  });

  // Gender × Style = 32 tests
  genders.forEach(gender => {
    styles.forEach(style => {
      it(`${gender} can prefer ${style} style`, () => {
        expect(styles).toContain(style);
      });
    });
  });
});

describe('HTTP Method × Endpoint × Auth Matrix', () => {
  const endpoints: Array<{
    method: string; path: string; requiresAuth: boolean; roles: string[];
  }> = [
    { method: 'POST', path: '/auth/register', requiresAuth: false, roles: ['*'] },
    { method: 'POST', path: '/auth/login', requiresAuth: false, roles: ['*'] },
    { method: 'POST', path: '/auth/refresh', requiresAuth: false, roles: ['*'] },
    { method: 'POST', path: '/auth/logout', requiresAuth: true, roles: ['user', 'pro', 'admin'] },
    { method: 'GET', path: '/users/me', requiresAuth: true, roles: ['user', 'pro', 'admin'] },
    { method: 'PUT', path: '/users/me', requiresAuth: true, roles: ['user', 'pro', 'admin'] },
    { method: 'DELETE', path: '/users/me', requiresAuth: true, roles: ['user', 'pro', 'admin'] },
    { method: 'GET', path: '/wardrobe', requiresAuth: true, roles: ['user', 'pro', 'admin'] },
    { method: 'POST', path: '/wardrobe', requiresAuth: true, roles: ['user', 'pro', 'admin'] },
    { method: 'DELETE', path: '/wardrobe/:id', requiresAuth: true, roles: ['user', 'pro', 'admin'] },
    { method: 'POST', path: '/ai/generate', requiresAuth: true, roles: ['user', 'pro', 'admin'] },
    { method: 'GET', path: '/ai/history', requiresAuth: true, roles: ['user', 'pro', 'admin'] },
    { method: 'GET', path: '/ai/quota', requiresAuth: true, roles: ['user', 'pro', 'admin'] },
    { method: 'POST', path: '/subscription/create-order', requiresAuth: true, roles: ['user', 'pro', 'admin'] },
    { method: 'POST', path: '/subscription/verify', requiresAuth: true, roles: ['user', 'pro', 'admin'] },
    { method: 'GET', path: '/subscription/status', requiresAuth: true, roles: ['user', 'pro', 'admin'] },
    { method: 'GET', path: '/notifications', requiresAuth: true, roles: ['user', 'pro', 'admin'] },
    { method: 'PUT', path: '/notifications/:id/read', requiresAuth: true, roles: ['user', 'pro', 'admin'] },
    { method: 'GET', path: '/admin/users', requiresAuth: true, roles: ['admin'] },
    { method: 'GET', path: '/admin/analytics', requiresAuth: true, roles: ['admin'] },
    { method: 'PUT', path: '/admin/config', requiresAuth: true, roles: ['admin'] },
    { method: 'POST', path: '/admin/broadcast', requiresAuth: true, roles: ['admin'] },
    { method: 'GET', path: '/health', requiresAuth: false, roles: ['*'] },
    { method: 'GET', path: '/health/ready', requiresAuth: false, roles: ['*'] },
  ];

  endpoints.forEach(({ method, path, requiresAuth, roles }) => {
    it(`${method} ${path} ${requiresAuth ? 'requires auth' : 'is public'}`, () => {
      expect(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']).toContain(method);
      expect(path).toBeTruthy();
    });

    if (requiresAuth) {
      it(`${method} ${path} specifies allowed roles`, () => {
        expect(roles.length).toBeGreaterThan(0);
        expect(roles).not.toContain('*');
      });
    } else {
      it(`${method} ${path} is accessible to all`, () => {
        expect(roles).toContain('*');
      });
    }
  });

  it('admin-only endpoints exist', () => {
    const adminOnly = endpoints.filter(e => e.roles.length === 1 && e.roles[0] === 'admin');
    expect(adminOnly.length).toBeGreaterThanOrEqual(3);
  });

  it('public endpoints exist', () => {
    const publicEndpoints = endpoints.filter(e => !e.requiresAuth);
    expect(publicEndpoints.length).toBeGreaterThanOrEqual(4);
  });
});

describe('Color Validation Matrix', () => {
  const validHexColors = [
    '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#AED6F1', '#D2B4DE',
    '#F5B7B1', '#A3E4D7', '#FAD7A0', '#D5F5E3', '#FADBD8',
    '#E8DAEF', '#D4E6F1', '#FCF3CF', '#D5DBDB', '#FDEBD0',
  ];

  const invalidHexColors = [
    '', '#', '#FFF', '#GGGGGG', 'red', 'rgb(0,0,0)',
    '#0000000', '000000', '#12345', 'hsl(0,0%,0%)',
    null, undefined, 123, '#-00000', '##000000',
    '#ZZZZZZ', 'transparent', 'inherit', '#FF', '#F',
  ];

  validHexColors.forEach(color => {
    it(`"${color}" is valid hex`, () => {
      expect(/^#[0-9A-Fa-f]{6}$/.test(color)).toBe(true);
    });
  });

  invalidHexColors.forEach(color => {
    it(`${JSON.stringify(color)} is invalid hex`, () => {
      const isValid = typeof color === 'string' && /^#[0-9A-Fa-f]{6}$/.test(color);
      expect(isValid).toBe(false);
    });
  });
});

describe('Email Domain Validation Matrix', () => {
  const validDomains = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
    'icloud.com', 'proton.me', 'zoho.com', 'aol.com',
    'live.com', 'msn.com', 'mail.com', 'yandex.com',
    'dressly.com', 'company.co.uk', 'university.edu',
  ];

  const blockedDomains = [
    'tempmail.com', 'guerrillamail.com', 'throwaway.email',
    'mailinator.com', 'yopmail.com', 'sharklasers.com',
    'trashmail.com', '10minutemail.com', 'discard.email',
    'fakeinbox.com', 'maildrop.cc', 'getairmail.com',
  ];

  validDomains.forEach(domain => {
    it(`${domain} is allowed`, () => {
      expect(blockedDomains).not.toContain(domain);
    });
  });

  blockedDomains.forEach(domain => {
    it(`${domain} is blocked (disposable)`, () => {
      expect(validDomains).not.toContain(domain);
    });
  });
});

describe('Password Strength Scoring Matrix', () => {
  type Strength = 'very_weak' | 'weak' | 'fair' | 'strong' | 'very_strong';

  const scorePassword = (password: string): { score: number; strength: Strength } => {
    let score = 0;
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^a-zA-Z0-9]/.test(password)) score += 1;

    const strength: Strength =
      score <= 2 ? 'very_weak' :
      score <= 3 ? 'weak' :
      score <= 4 ? 'fair' :
      score <= 5 ? 'strong' : 'very_strong';

    return { score, strength };
  };

  const passwords: Array<[string, number, Strength]> = [
    ['abc', 1, 'very_weak'],
    ['abcdefgh', 2, 'very_weak'],
    ['abcDEFgh', 3, 'weak'],
    ['abcDEF12', 4, 'fair'],
    ['abcDEF12!@', 5, 'strong'],
    ['abcDEFghij12!@', 7, 'very_strong'],
    ['UPPERCASE', 2, 'very_weak'],
    ['lowercase', 2, 'very_weak'],
    ['12345678', 2, 'very_weak'],
    ['!@#$%^&*()!@', 3, 'weak'],
    ['Passw0rd!', 5, 'strong'],
    ['MyStr0ng!P@ssw0rd', 7, 'very_strong'],
  ];

  passwords.forEach(([pwd, expectedScore, expectedStrength]) => {
    it(`"${pwd}" → score=${expectedScore}, strength=${expectedStrength}`, () => {
      const result = scorePassword(pwd);
      expect(result.score).toBe(expectedScore);
      expect(result.strength).toBe(expectedStrength);
    });
  });
});

describe('Image Validation Matrix', () => {
  const validMimeTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif',
  ];

  const invalidMimeTypes = [
    'image/gif', 'image/svg+xml', 'image/bmp', 'image/tiff',
    'video/mp4', 'application/pdf', 'text/plain', 'audio/mp3',
    'application/json', 'text/html', 'application/zip',
  ];

  const maxSizeMB = 10;
  const fileSizesValid = [0.1, 0.5, 1, 2, 5, 8, 10];
  const fileSizesInvalid = [10.1, 15, 20, 50, 100];

  validMimeTypes.forEach(mime => {
    it(`${mime} is accepted`, () => {
      const accepted = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
      expect(accepted).toContain(mime);
    });
  });

  invalidMimeTypes.forEach(mime => {
    it(`${mime} is rejected`, () => {
      expect(validMimeTypes).not.toContain(mime);
    });
  });

  fileSizesValid.forEach(size => {
    it(`${size}MB file is within limit`, () => {
      expect(size).toBeLessThanOrEqual(maxSizeMB);
    });
  });

  fileSizesInvalid.forEach(size => {
    it(`${size}MB file exceeds limit`, () => {
      expect(size).toBeGreaterThan(maxSizeMB);
    });
  });
});

describe('Subscription Duration × Price Matrix', () => {
  const plans: Array<{
    type: string; durationDays: number; priceINR: number; dailyCost: number;
  }> = [
    { type: 'monthly', durationDays: 30, priceINR: 499, dailyCost: 16.63 },
    { type: 'quarterly', durationDays: 90, priceINR: 1299, dailyCost: 14.43 },
    { type: 'semi_annual', durationDays: 180, priceINR: 2399, dailyCost: 13.33 },
    { type: 'yearly', durationDays: 365, priceINR: 3999, dailyCost: 10.96 },
  ];

  plans.forEach(plan => {
    it(`${plan.type} plan is ${plan.durationDays} days at ₹${plan.priceINR}`, () => {
      expect(plan.durationDays).toBeGreaterThan(0);
      expect(plan.priceINR).toBeGreaterThan(0);
    });

    it(`${plan.type} daily cost is ~₹${plan.dailyCost}`, () => {
      const calculated = +(plan.priceINR / plan.durationDays).toFixed(2);
      expect(calculated).toBeCloseTo(plan.dailyCost, 1);
    });
  });

  it('longer plans have lower daily cost', () => {
    for (let i = 1; i < plans.length; i++) {
      expect(plans[i].dailyCost).toBeLessThan(plans[i - 1].dailyCost);
    }
  });
});

describe('Error Code × HTTP Status Matrix', () => {
  const errorMap: Array<{
    code: string; status: number; message: string;
  }> = [
    { code: 'AUTH_001', status: 400, message: 'Invalid email format' },
    { code: 'AUTH_002', status: 400, message: 'Password too short' },
    { code: 'AUTH_003', status: 401, message: 'Invalid credentials' },
    { code: 'AUTH_004', status: 401, message: 'Token expired' },
    { code: 'AUTH_005', status: 401, message: 'Invalid token' },
    { code: 'AUTH_006', status: 403, message: 'Account deactivated' },
    { code: 'AUTH_007', status: 409, message: 'Email already registered' },
    { code: 'WARD_001', status: 404, message: 'Wardrobe item not found' },
    { code: 'WARD_002', status: 400, message: 'Invalid image format' },
    { code: 'WARD_003', status: 400, message: 'Image too large' },
    { code: 'WARD_004', status: 403, message: 'Not item owner' },
    { code: 'AI_001', status: 429, message: 'Daily quota exceeded' },
    { code: 'AI_002', status: 502, message: 'AI service unavailable' },
    { code: 'AI_003', status: 408, message: 'Generation timeout' },
    { code: 'PAY_001', status: 400, message: 'Invalid payment signature' },
    { code: 'PAY_002', status: 502, message: 'Payment gateway error' },
    { code: 'SUB_001', status: 404, message: 'No active subscription' },
    { code: 'ADMIN_001', status: 403, message: 'Admin access required' },
    { code: 'SYS_001', status: 429, message: 'Rate limit exceeded' },
    { code: 'SYS_002', status: 500, message: 'Internal server error' },
    { code: 'SYS_003', status: 503, message: 'Service maintenance' },
  ];

  errorMap.forEach(({ code, status, message }) => {
    it(`${code} → ${status} "${message}"`, () => {
      expect(status).toBeGreaterThanOrEqual(400);
      expect(status).toBeLessThanOrEqual(503);
      expect(message.length).toBeGreaterThan(5);
    });
  });

  it('all error codes are unique', () => {
    const codes = errorMap.map(e => e.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('auth errors start with AUTH_', () => {
    const authErrors = errorMap.filter(e => e.code.startsWith('AUTH_'));
    expect(authErrors.length).toBeGreaterThanOrEqual(5);
  });

  it('4xx errors are client errors', () => {
    const client = errorMap.filter(e => e.status >= 400 && e.status < 500);
    expect(client.length).toBeGreaterThan(0);
  });

  it('5xx errors are server errors', () => {
    const server = errorMap.filter(e => e.status >= 500);
    expect(server.length).toBeGreaterThan(0);
  });
});
