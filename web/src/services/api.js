// ══════════════════════════════════════════════════════════════
// Dressly Web — API Service (Axios + JWT Interceptors)
// ══════════════════════════════════════════════════════════════

import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8080/v1';
const WS_BASE = process.env.REACT_APP_WS_URL || 'ws://localhost:8080/ws';

// ── Axios Instance ───────────────────────────────────────────
const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// ── Token management ─────────────────────────────────────────
const TOKEN_KEY = 'dressly.access-token';
const REFRESH_KEY = 'dressly.refresh-token';
const USER_KEY = 'dressly.user';

export const tokenStore = {
  getAccessToken: () => localStorage.getItem(TOKEN_KEY),
  getRefreshToken: () => localStorage.getItem(REFRESH_KEY),
  getUser: () => {
    try { return JSON.parse(localStorage.getItem(USER_KEY)); }
    catch { return null; }
  },
  setTokens: (accessToken, refreshToken, user) => {
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_KEY, refreshToken);
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

// ── Request Interceptor — Attach JWT ─────────────────────────
api.interceptors.request.use((config) => {
  const token = tokenStore.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response Interceptor — Auto-refresh on 401 ──────────────
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = tokenStore.getRefreshToken();
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(`${API_BASE}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const { access_token, refresh_token, user } = data.data;
        tokenStore.setTokens(access_token, refresh_token, user);
        processQueue(null, access_token);
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        tokenStore.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ── Auth API ─────────────────────────────────────────────────
export const authApi = {
  register: (email, password, displayName) =>
    api.post('/auth/register', { email, password, display_name: displayName }),
  login: (email, password) =>
    api.post('/auth/login', { email, password }),
  refresh: (refreshToken) =>
    api.post('/auth/refresh', { refresh_token: refreshToken }),
  logout: () => api.post('/auth/logout'),
};

// ── User API ─────────────────────────────────────────────────
export const userApi = {
  getMe: () => api.get('/users/me'),
  updateMe: (data) => api.patch('/users/me', data),
  deleteMe: () => api.delete('/users/me'),
};

// ── Wardrobe API ─────────────────────────────────────────────
export const wardrobeApi = {
  list: (page = 1, perPage = 20, category, season) =>
    api.get('/wardrobe', { params: { page, per_page: perPage, category, season } }),
  get: (id) => api.get(`/wardrobe/${id}`),
  add: (data) => api.post('/wardrobe', data),
  update: (id, data) => api.patch(`/wardrobe/${id}`, data),
  delete: (id) => api.delete(`/wardrobe/${id}`),
};

// ── AI API ───────────────────────────────────────────────────
export const aiApi = {
  generate: (prompt, occasion, imageIds) =>
    api.post('/ai/generate', { prompt, occasion, image_ids: imageIds }),
  listGenerations: (page = 1, perPage = 20) =>
    api.get('/ai/generations', { params: { page, per_page: perPage } }),
  getGeneration: (id) => api.get(`/ai/generations/${id}`),
  getQuota: () => api.get('/ai/quota'),
};

// ── Subscription API ─────────────────────────────────────────
export const subscriptionApi = {
  get: () => api.get('/subscription'),
  checkout: () => api.post('/subscription/checkout'),
  verify: (razorpayOrderId, razorpayPaymentId, razorpaySignature) =>
    api.post('/subscription/verify', {
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature,
    }),
  cancel: () => api.post('/subscription/cancel'),
};

// ── Notifications API ────────────────────────────────────────
export const notificationApi = {
  list: (page = 1, perPage = 20) =>
    api.get('/notifications', { params: { page, per_page: perPage } }),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  registerToken: (token, platform, deviceId) =>
    api.post('/notifications/token', { token, platform, device_id: deviceId }),
};

// ── Admin API ────────────────────────────────────────────────
export const adminApi = {
  listUsers: (page = 1, perPage = 20) =>
    api.get('/admin/users', { params: { page, per_page: perPage } }),
  updateUser: (id, data) => api.patch(`/admin/users/${id}`, data),
  getConfig: () => api.get('/admin/config'),
  updateConfig: (configs) => api.patch('/admin/config', { configs }),
  getAnalytics: () => api.get('/admin/analytics'),
  listSubscriptions: (page = 1, perPage = 20) =>
    api.get('/admin/subscriptions', { params: { page, per_page: perPage } }),
};

// ── WebSocket URL Builder ────────────────────────────────────
export const getWsUrl = () => {
  const token = tokenStore.getAccessToken();
  return `${WS_BASE}?token=${token}`;
};

export { API_BASE, WS_BASE };
export default api;
