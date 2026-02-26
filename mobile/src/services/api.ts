// ══════════════════════════════════════════════════════════════
// Dressly — API Client (Axios with JWT Interceptors)
// ══════════════════════════════════════════════════════════════

import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL, ENDPOINTS, STORAGE_KEYS } from '@/constants';
import type { ApiError, ApiResponse, TokenResponse } from '@/types';

// ── Token Refresh Queue ─────────────────────────────────────
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token!);
    }
  });
  failedQueue = [];
};

// ── Create Axios Instance ───────────────────────────────────
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30_000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-Client-Platform': 'mobile',
    'X-Client-Version': '1.0.0',
  },
});

// ── Request Interceptor: Attach JWT ─────────────────────────
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // SecureStore may fail on first launch — continue without token
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response Interceptor: Auto-Refresh on 401 ───────────────
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Only attempt refresh for 401s that haven't been retried
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Don't refresh for auth endpoints
    const url = originalRequest.url || '';
    if (
      url.includes('/auth/login') ||
      url.includes('/auth/register') ||
      url.includes('/auth/refresh')
    ) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Queue the request while token is being refreshed
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token: string) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            resolve(apiClient(originalRequest));
          },
          reject,
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = await SecureStore.getItemAsync(
        STORAGE_KEYS.REFRESH_TOKEN,
      );

      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const { data } = await axios.post<ApiResponse<TokenResponse>>(
        `${API_BASE_URL}${ENDPOINTS.REFRESH}`,
        { refresh_token: refreshToken },
        { headers: { 'Content-Type': 'application/json' } },
      );

      const newAccessToken = data.data.access_token;
      const newRefreshToken = data.data.refresh_token;

      await SecureStore.setItemAsync(
        STORAGE_KEYS.ACCESS_TOKEN,
        newAccessToken,
      );
      await SecureStore.setItemAsync(
        STORAGE_KEYS.REFRESH_TOKEN,
        newRefreshToken,
      );

      processQueue(null, newAccessToken);

      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      }

      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);

      // Clear tokens on refresh failure — force re-login
      await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.USER);

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

// ── Multipart Upload Helper ─────────────────────────────────
export const uploadFile = async (
  url: string,
  formData: FormData,
  config?: AxiosRequestConfig,
) => {
  return apiClient.post(url, formData, {
    ...config,
    headers: {
      ...config?.headers,
      'Content-Type': 'multipart/form-data',
    },
    timeout: 120_000, // 2 min for uploads
  });
};

// ── Error Extractor ─────────────────────────────────────────
export const extractApiError = (
  error: unknown,
): { code: string; message: string } => {
  if (axios.isAxiosError(error)) {
    const apiErr = error.response?.data as ApiError | undefined;
    if (apiErr?.error) {
      return { code: apiErr.error.code, message: apiErr.error.message };
    }
    if (error.message === 'Network Error') {
      return {
        code: 'NETWORK_ERROR',
        message: 'No internet connection. Please check your network.',
      };
    }
    if (error.code === 'ECONNABORTED') {
      return {
        code: 'TIMEOUT',
        message: 'Request timed out. Please try again.',
      };
    }
    return {
      code: 'HTTP_ERROR',
      message: error.message || 'Something went wrong',
    };
  }
  return {
    code: 'UNKNOWN',
    message: error instanceof Error ? error.message : 'An unexpected error occurred',
  };
};

export default apiClient;
