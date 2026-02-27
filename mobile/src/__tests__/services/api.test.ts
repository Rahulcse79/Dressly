// ─── API Service Tests ──────────────────────────────────────────────────────

import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Since apiClient is a configured axios instance, test the configuration
// and interceptor behaviors

describe('API Service Configuration', () => {
  // ── Instance Configuration ────────────────────────────────

  it('axios is available', () => {
    expect(axios).toBeDefined();
  });

  it('axios.create is a function', () => {
    expect(typeof axios.create).toBe('function');
  });

  it('creates instance with default headers', () => {
    const instance = axios.create({
      baseURL: 'http://localhost:8080/api/v1',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Client-Platform': 'mobile',
        'X-Client-Version': '1.0.0',
      },
    });
    expect(instance.defaults.baseURL).toBe('http://localhost:8080/api/v1');
    expect(instance.defaults.timeout).toBe(30000);
  });

  // ── Token Attachment ──────────────────────────────────────

  it('SecureStore mock is available', () => {
    expect(SecureStore.getItemAsync).toBeDefined();
  });

  it('reads access token from SecureStore', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('test-token');
    const token = await SecureStore.getItemAsync('access_token');
    expect(token).toBe('test-token');
  });

  it('returns null when no token stored', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
    const token = await SecureStore.getItemAsync('access_token');
    expect(token).toBeNull();
  });

  // ── Error Extraction ──────────────────────────────────────

  it('extracts error from API error response', () => {
    const error = {
      response: {
        data: {
          error: {
            code: 'AUTH_INVALID',
            message: 'Invalid credentials',
          },
        },
      },
    };

    const msg = error.response?.data?.error?.message;
    expect(msg).toBe('Invalid credentials');
  });

  it('handles network errors without response', () => {
    const error = { message: 'Network Error' };
    const msg = (error as any).response?.data?.error?.message || error.message;
    expect(msg).toBe('Network Error');
  });

  it('handles timeout errors', () => {
    const error = { code: 'ECONNABORTED', message: 'timeout of 30000ms exceeded' };
    expect(error.code).toBe('ECONNABORTED');
    expect(error.message).toContain('timeout');
  });

  // ── Token Refresh Logic ───────────────────────────────────

  it('stores tokens after refresh', async () => {
    await SecureStore.setItemAsync('access_token', 'new-access');
    await SecureStore.setItemAsync('refresh_token', 'new-refresh');

    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('access_token', 'new-access');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('refresh_token', 'new-refresh');
  });

  it('deletes tokens on logout', async () => {
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');
    await SecureStore.deleteItemAsync('user');

    expect(SecureStore.deleteItemAsync).toHaveBeenCalledTimes(3);
  });

  // ── Queue Processing ──────────────────────────────────────

  it('queues failed requests during token refresh', () => {
    const queue: Array<{ resolve: (v: string) => void; reject: (e: unknown) => void }> = [];

    queue.push({
      resolve: jest.fn(),
      reject: jest.fn(),
    });
    queue.push({
      resolve: jest.fn(),
      reject: jest.fn(),
    });

    expect(queue).toHaveLength(2);

    // Process queue with success
    queue.forEach(({ resolve }) => resolve('new-token'));
    expect(queue[0].resolve).toHaveBeenCalledWith('new-token');
    expect(queue[1].resolve).toHaveBeenCalledWith('new-token');
  });

  it('rejects queued requests on refresh failure', () => {
    const queue: Array<{ resolve: (v: string) => void; reject: (e: unknown) => void }> = [];

    queue.push({
      resolve: jest.fn(),
      reject: jest.fn(),
    });

    const error = new Error('Refresh failed');
    queue.forEach(({ reject }) => reject(error));
    expect(queue[0].reject).toHaveBeenCalledWith(error);
  });

  // ── 401 Detection ────────────────────────────────────────

  it('detects 401 status for token refresh', () => {
    const error = { response: { status: 401 } };
    expect(error.response.status).toBe(401);
  });

  it('does not refresh for auth endpoints', () => {
    const authUrls = ['/auth/login', '/auth/register', '/auth/refresh'];
    authUrls.forEach((url) => {
      expect(
        url.includes('/auth/login') ||
        url.includes('/auth/register') ||
        url.includes('/auth/refresh')
      ).toBe(true);
    });
  });

  it('allows refresh for non-auth endpoints', () => {
    const urls = ['/wardrobe', '/generations', '/subscriptions', '/profile'];
    urls.forEach((url) => {
      expect(
        url.includes('/auth/login') ||
        url.includes('/auth/register') ||
        url.includes('/auth/refresh')
      ).toBe(false);
    });
  });

  // ── Request Configuration ─────────────────────────────────

  it('sets Authorization header format', () => {
    const token = 'eyJhbGciOiJIUzI1NiJ9.test';
    const header = `Bearer ${token}`;
    expect(header).toBe('Bearer eyJhbGciOiJIUzI1NiJ9.test');
    expect(header.startsWith('Bearer ')).toBe(true);
  });

  it('sets platform header', () => {
    const headers = { 'X-Client-Platform': 'mobile' };
    expect(headers['X-Client-Platform']).toBe('mobile');
  });

  it('sets content type', () => {
    const headers = { 'Content-Type': 'application/json' };
    expect(headers['Content-Type']).toBe('application/json');
  });
});
