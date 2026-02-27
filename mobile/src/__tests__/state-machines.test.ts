// ─── Comprehensive State Machine Tests ──────────────────────────────────────

describe('Auth State Machine', () => {
  type AuthState = 'idle' | 'checking' | 'authenticated' | 'unauthenticated' | 'refreshing' | 'error';
  type AuthEvent = 'CHECK_AUTH' | 'AUTH_SUCCESS' | 'AUTH_FAIL' | 'LOGOUT' | 'TOKEN_EXPIRED' | 'REFRESH_SUCCESS' | 'REFRESH_FAIL';

  const transition = (state: AuthState, event: AuthEvent): AuthState => {
    const transitions: Record<AuthState, Partial<Record<AuthEvent, AuthState>>> = {
      idle:            { CHECK_AUTH: 'checking' },
      checking:        { AUTH_SUCCESS: 'authenticated', AUTH_FAIL: 'unauthenticated' },
      authenticated:   { LOGOUT: 'unauthenticated', TOKEN_EXPIRED: 'refreshing' },
      unauthenticated: { AUTH_SUCCESS: 'authenticated' },
      refreshing:      { REFRESH_SUCCESS: 'authenticated', REFRESH_FAIL: 'unauthenticated' },
      error:           { CHECK_AUTH: 'checking' },
    };
    return transitions[state]?.[event] ?? state;
  };

  const testCases: Array<[AuthState, AuthEvent, AuthState]> = [
    ['idle', 'CHECK_AUTH', 'checking'],
    ['checking', 'AUTH_SUCCESS', 'authenticated'],
    ['checking', 'AUTH_FAIL', 'unauthenticated'],
    ['authenticated', 'LOGOUT', 'unauthenticated'],
    ['authenticated', 'TOKEN_EXPIRED', 'refreshing'],
    ['unauthenticated', 'AUTH_SUCCESS', 'authenticated'],
    ['refreshing', 'REFRESH_SUCCESS', 'authenticated'],
    ['refreshing', 'REFRESH_FAIL', 'unauthenticated'],
    ['error', 'CHECK_AUTH', 'checking'],
    // Invalid transitions (state unchanged)
    ['idle', 'AUTH_SUCCESS', 'idle'],
    ['idle', 'LOGOUT', 'idle'],
    ['checking', 'LOGOUT', 'checking'],
    ['authenticated', 'AUTH_FAIL', 'authenticated'],
    ['unauthenticated', 'LOGOUT', 'unauthenticated'],
    ['refreshing', 'LOGOUT', 'refreshing'],
  ];

  testCases.forEach(([from, event, to]) => {
    it(`${from} + ${event} → ${to}`, () => {
      expect(transition(from, event)).toBe(to);
    });
  });

  it('full login flow', () => {
    let state: AuthState = 'idle';
    state = transition(state, 'CHECK_AUTH');    // → checking
    state = transition(state, 'AUTH_FAIL');     // → unauthenticated
    state = transition(state, 'AUTH_SUCCESS');  // → authenticated
    expect(state).toBe('authenticated');
  });

  it('full refresh flow', () => {
    let state: AuthState = 'authenticated';
    state = transition(state, 'TOKEN_EXPIRED');     // → refreshing
    state = transition(state, 'REFRESH_SUCCESS');   // → authenticated
    expect(state).toBe('authenticated');
  });

  it('refresh failure forces re-auth', () => {
    let state: AuthState = 'authenticated';
    state = transition(state, 'TOKEN_EXPIRED');   // → refreshing
    state = transition(state, 'REFRESH_FAIL');    // → unauthenticated
    expect(state).toBe('unauthenticated');
  });
});

describe('WebSocket State Machine', () => {
  type WsState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';
  type WsEvent = 'CONNECT' | 'CONNECTED' | 'DISCONNECT' | 'ERROR' | 'RETRY' | 'MAX_RETRIES';

  const transition = (state: WsState, event: WsEvent): WsState => {
    const transitions: Record<WsState, Partial<Record<WsEvent, WsState>>> = {
      disconnected:  { CONNECT: 'connecting' },
      connecting:    { CONNECTED: 'connected', ERROR: 'reconnecting', DISCONNECT: 'disconnected' },
      connected:     { DISCONNECT: 'disconnected', ERROR: 'reconnecting' },
      reconnecting:  { CONNECTED: 'connected', MAX_RETRIES: 'error', DISCONNECT: 'disconnected' },
      error:         { CONNECT: 'connecting', RETRY: 'reconnecting' },
    };
    return transitions[state]?.[event] ?? state;
  };

  const testCases: Array<[WsState, WsEvent, WsState]> = [
    ['disconnected', 'CONNECT', 'connecting'],
    ['connecting', 'CONNECTED', 'connected'],
    ['connecting', 'ERROR', 'reconnecting'],
    ['connecting', 'DISCONNECT', 'disconnected'],
    ['connected', 'DISCONNECT', 'disconnected'],
    ['connected', 'ERROR', 'reconnecting'],
    ['reconnecting', 'CONNECTED', 'connected'],
    ['reconnecting', 'MAX_RETRIES', 'error'],
    ['reconnecting', 'DISCONNECT', 'disconnected'],
    ['error', 'CONNECT', 'connecting'],
    ['error', 'RETRY', 'reconnecting'],
    // Invalid transitions
    ['disconnected', 'CONNECTED', 'disconnected'],
    ['disconnected', 'ERROR', 'disconnected'],
    ['connected', 'CONNECT', 'connected'],
    ['error', 'CONNECTED', 'error'],
  ];

  testCases.forEach(([from, event, to]) => {
    it(`${from} + ${event} → ${to}`, () => {
      expect(transition(from, event)).toBe(to);
    });
  });
});

describe('Subscription State Machine', () => {
  type SubState = 'none' | 'trial' | 'active' | 'expiring' | 'expired' | 'cancelled';
  type SubEvent = 'START_TRIAL' | 'SUBSCRIBE' | 'APPROACHING_EXPIRY' | 'EXPIRE' | 'CANCEL' | 'RENEW';

  const transition = (state: SubState, event: SubEvent): SubState => {
    const transitions: Record<SubState, Partial<Record<SubEvent, SubState>>> = {
      none:      { START_TRIAL: 'trial', SUBSCRIBE: 'active' },
      trial:     { SUBSCRIBE: 'active', EXPIRE: 'expired' },
      active:    { APPROACHING_EXPIRY: 'expiring', CANCEL: 'cancelled', EXPIRE: 'expired' },
      expiring:  { RENEW: 'active', EXPIRE: 'expired', CANCEL: 'cancelled' },
      expired:   { SUBSCRIBE: 'active' },
      cancelled: { SUBSCRIBE: 'active' },
    };
    return transitions[state]?.[event] ?? state;
  };

  const testCases: Array<[SubState, SubEvent, SubState]> = [
    ['none', 'START_TRIAL', 'trial'],
    ['none', 'SUBSCRIBE', 'active'],
    ['trial', 'SUBSCRIBE', 'active'],
    ['trial', 'EXPIRE', 'expired'],
    ['active', 'APPROACHING_EXPIRY', 'expiring'],
    ['active', 'CANCEL', 'cancelled'],
    ['active', 'EXPIRE', 'expired'],
    ['expiring', 'RENEW', 'active'],
    ['expiring', 'EXPIRE', 'expired'],
    ['expiring', 'CANCEL', 'cancelled'],
    ['expired', 'SUBSCRIBE', 'active'],
    ['cancelled', 'SUBSCRIBE', 'active'],
    // Invalid
    ['none', 'EXPIRE', 'none'],
    ['none', 'CANCEL', 'none'],
    ['trial', 'RENEW', 'trial'],
    ['expired', 'RENEW', 'expired'],
    ['cancelled', 'CANCEL', 'cancelled'],
  ];

  testCases.forEach(([from, event, to]) => {
    it(`${from} + ${event} → ${to}`, () => {
      expect(transition(from, event)).toBe(to);
    });
  });
});

describe('Payment State Machine', () => {
  type PayState = 'idle' | 'creating_order' | 'awaiting_payment' | 'verifying' | 'captured' | 'failed';
  type PayEvent = 'CREATE_ORDER' | 'ORDER_CREATED' | 'PAYMENT_COMPLETE' | 'PAYMENT_VERIFIED' | 'PAYMENT_FAILED' | 'RETRY';

  const transition = (state: PayState, event: PayEvent): PayState => {
    const transitions: Record<PayState, Partial<Record<PayEvent, PayState>>> = {
      idle:             { CREATE_ORDER: 'creating_order' },
      creating_order:   { ORDER_CREATED: 'awaiting_payment', PAYMENT_FAILED: 'failed' },
      awaiting_payment: { PAYMENT_COMPLETE: 'verifying', PAYMENT_FAILED: 'failed' },
      verifying:        { PAYMENT_VERIFIED: 'captured', PAYMENT_FAILED: 'failed' },
      captured:         {},
      failed:           { RETRY: 'idle' },
    };
    return transitions[state]?.[event] ?? state;
  };

  const testCases: Array<[PayState, PayEvent, PayState]> = [
    ['idle', 'CREATE_ORDER', 'creating_order'],
    ['creating_order', 'ORDER_CREATED', 'awaiting_payment'],
    ['creating_order', 'PAYMENT_FAILED', 'failed'],
    ['awaiting_payment', 'PAYMENT_COMPLETE', 'verifying'],
    ['awaiting_payment', 'PAYMENT_FAILED', 'failed'],
    ['verifying', 'PAYMENT_VERIFIED', 'captured'],
    ['verifying', 'PAYMENT_FAILED', 'failed'],
    ['failed', 'RETRY', 'idle'],
    // Terminal state
    ['captured', 'CREATE_ORDER', 'captured'],
    ['captured', 'RETRY', 'captured'],
  ];

  testCases.forEach(([from, event, to]) => {
    it(`${from} + ${event} → ${to}`, () => {
      expect(transition(from, event)).toBe(to);
    });
  });

  it('full successful payment flow', () => {
    let state: PayState = 'idle';
    state = transition(state, 'CREATE_ORDER');
    expect(state).toBe('creating_order');
    state = transition(state, 'ORDER_CREATED');
    expect(state).toBe('awaiting_payment');
    state = transition(state, 'PAYMENT_COMPLETE');
    expect(state).toBe('verifying');
    state = transition(state, 'PAYMENT_VERIFIED');
    expect(state).toBe('captured');
  });
});

describe('AI Generation State Machine', () => {
  type GenState = 'idle' | 'uploading_images' | 'generating' | 'completed' | 'failed';
  type GenEvent = 'START' | 'IMAGES_UPLOADED' | 'GENERATION_COMPLETE' | 'ERROR' | 'RESET';

  const transition = (state: GenState, event: GenEvent): GenState => {
    const transitions: Record<GenState, Partial<Record<GenEvent, GenState>>> = {
      idle:              { START: 'uploading_images' },
      uploading_images:  { IMAGES_UPLOADED: 'generating', ERROR: 'failed' },
      generating:        { GENERATION_COMPLETE: 'completed', ERROR: 'failed' },
      completed:         { RESET: 'idle', START: 'uploading_images' },
      failed:            { RESET: 'idle', START: 'uploading_images' },
    };
    return transitions[state]?.[event] ?? state;
  };

  const testCases: Array<[GenState, GenEvent, GenState]> = [
    ['idle', 'START', 'uploading_images'],
    ['uploading_images', 'IMAGES_UPLOADED', 'generating'],
    ['uploading_images', 'ERROR', 'failed'],
    ['generating', 'GENERATION_COMPLETE', 'completed'],
    ['generating', 'ERROR', 'failed'],
    ['completed', 'RESET', 'idle'],
    ['completed', 'START', 'uploading_images'],
    ['failed', 'RESET', 'idle'],
    ['failed', 'START', 'uploading_images'],
    // Invalid
    ['idle', 'GENERATION_COMPLETE', 'idle'],
    ['idle', 'ERROR', 'idle'],
    ['generating', 'START', 'generating'],
  ];

  testCases.forEach(([from, event, to]) => {
    it(`${from} + ${event} → ${to}`, () => {
      expect(transition(from, event)).toBe(to);
    });
  });
});

describe('App Lifecycle State Machine', () => {
  type AppState = 'initializing' | 'splash' | 'onboarding' | 'auth' | 'main' | 'background' | 'suspended';
  type AppEvent = 'INIT_COMPLETE' | 'FIRST_LAUNCH' | 'RETURNING_USER' | 'LOGGED_IN' | 'LOGGED_OUT' |
    'APP_BACKGROUND' | 'APP_FOREGROUND' | 'APP_SUSPEND';

  const transition = (state: AppState, event: AppEvent): AppState => {
    const transitions: Record<AppState, Partial<Record<AppEvent, AppState>>> = {
      initializing: { INIT_COMPLETE: 'splash' },
      splash:       { FIRST_LAUNCH: 'onboarding', RETURNING_USER: 'auth' },
      onboarding:   { LOGGED_IN: 'main', RETURNING_USER: 'auth' },
      auth:         { LOGGED_IN: 'main' },
      main:         { LOGGED_OUT: 'auth', APP_BACKGROUND: 'background' },
      background:   { APP_FOREGROUND: 'main', APP_SUSPEND: 'suspended' },
      suspended:    { APP_FOREGROUND: 'main' },
    };
    return transitions[state]?.[event] ?? state;
  };

  const testCases: Array<[AppState, AppEvent, AppState]> = [
    ['initializing', 'INIT_COMPLETE', 'splash'],
    ['splash', 'FIRST_LAUNCH', 'onboarding'],
    ['splash', 'RETURNING_USER', 'auth'],
    ['onboarding', 'LOGGED_IN', 'main'],
    ['auth', 'LOGGED_IN', 'main'],
    ['main', 'LOGGED_OUT', 'auth'],
    ['main', 'APP_BACKGROUND', 'background'],
    ['background', 'APP_FOREGROUND', 'main'],
    ['background', 'APP_SUSPEND', 'suspended'],
    ['suspended', 'APP_FOREGROUND', 'main'],
    // Invalid
    ['initializing', 'LOGGED_IN', 'initializing'],
    ['auth', 'APP_BACKGROUND', 'auth'],
  ];

  testCases.forEach(([from, event, to]) => {
    it(`${from} + ${event} → ${to}`, () => {
      expect(transition(from, event)).toBe(to);
    });
  });
});

describe('Notification Permission State Machine', () => {
  type PermState = 'undetermined' | 'requesting' | 'granted' | 'denied' | 'settings_redirect';
  type PermEvent = 'REQUEST' | 'GRANT' | 'DENY' | 'OPEN_SETTINGS' | 'RETURN_GRANTED' | 'RETURN_DENIED';

  const transition = (state: PermState, event: PermEvent): PermState => {
    const transitions: Record<PermState, Partial<Record<PermEvent, PermState>>> = {
      undetermined:      { REQUEST: 'requesting' },
      requesting:        { GRANT: 'granted', DENY: 'denied' },
      granted:           {},
      denied:            { OPEN_SETTINGS: 'settings_redirect' },
      settings_redirect: { RETURN_GRANTED: 'granted', RETURN_DENIED: 'denied' },
    };
    return transitions[state]?.[event] ?? state;
  };

  const testCases: Array<[PermState, PermEvent, PermState]> = [
    ['undetermined', 'REQUEST', 'requesting'],
    ['requesting', 'GRANT', 'granted'],
    ['requesting', 'DENY', 'denied'],
    ['denied', 'OPEN_SETTINGS', 'settings_redirect'],
    ['settings_redirect', 'RETURN_GRANTED', 'granted'],
    ['settings_redirect', 'RETURN_DENIED', 'denied'],
    // Terminal
    ['granted', 'REQUEST', 'granted'],
    ['granted', 'DENY', 'granted'],
  ];

  testCases.forEach(([from, event, to]) => {
    it(`${from} + ${event} → ${to}`, () => {
      expect(transition(from, event)).toBe(to);
    });
  });
});
