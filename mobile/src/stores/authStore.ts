// ══════════════════════════════════════════════════════════════
// Dressly — Auth Store (Zustand + SecureStore persistence)
// ══════════════════════════════════════════════════════════════

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import * as SecureStore from 'expo-secure-store';
import apiClient, { extractApiError } from '@/services/api';
import { ENDPOINTS, STORAGE_KEYS } from '@/constants';
import type {
  ApiResponse,
  LoginRequest,
  RegisterRequest,
  TokenResponse,
  User,
} from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}

interface AuthActions {
  initialize: () => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (user: User) => void;
  clearError: () => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  immer((set, get) => ({
    // ── State ────────────────────────────────────────────
    user: null,
    isAuthenticated: false,
    isLoading: false,
    isInitialized: false,
    error: null,

    // ── Initialize from stored tokens ────────────────────
    initialize: async () => {
      try {
        const token = await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
        const userJson = await SecureStore.getItemAsync(STORAGE_KEYS.USER);

        if (token && userJson) {
          const user: User = JSON.parse(userJson);
          set((s) => {
            s.user = user;
            s.isAuthenticated = true;
            s.isInitialized = true;
          });

          // Silently refresh user data
          get().refreshUser().catch(() => {});
        } else {
          set((s) => {
            s.isInitialized = true;
          });
        }
      } catch {
        set((s) => {
          s.isInitialized = true;
        });
      }
    },

    // ── Register ─────────────────────────────────────────
    register: async (data: RegisterRequest) => {
      set((s) => {
        s.isLoading = true;
        s.error = null;
      });
      try {
        const response = await apiClient.post<ApiResponse<TokenResponse>>(
          ENDPOINTS.REGISTER,
          data,
        );
        const { access_token, refresh_token, user } = response.data.data;

        await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, access_token);
        await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, refresh_token);
        await SecureStore.setItemAsync(STORAGE_KEYS.USER, JSON.stringify(user));

        set((s) => {
          s.user = user;
          s.isAuthenticated = true;
          s.isLoading = false;
        });
      } catch (err) {
        const { message } = extractApiError(err);
        set((s) => {
          s.isLoading = false;
          s.error = message;
        });
        throw err;
      }
    },

    // ── Login ────────────────────────────────────────────
    login: async (data: LoginRequest) => {
      set((s) => {
        s.isLoading = true;
        s.error = null;
      });
      try {
        const response = await apiClient.post<ApiResponse<TokenResponse>>(
          ENDPOINTS.LOGIN,
          data,
        );
        const { access_token, refresh_token, user } = response.data.data;

        await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, access_token);
        await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, refresh_token);
        await SecureStore.setItemAsync(STORAGE_KEYS.USER, JSON.stringify(user));

        set((s) => {
          s.user = user;
          s.isAuthenticated = true;
          s.isLoading = false;
        });
      } catch (err) {
        const { message } = extractApiError(err);
        set((s) => {
          s.isLoading = false;
          s.error = message;
        });
        throw err;
      }
    },

    // ── Logout ───────────────────────────────────────────
    logout: async () => {
      try {
        await apiClient.post(ENDPOINTS.LOGOUT).catch(() => {});
      } finally {
        await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
        await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
        await SecureStore.deleteItemAsync(STORAGE_KEYS.USER);

        set((s) => {
          s.user = null;
          s.isAuthenticated = false;
          s.error = null;
        });
      }
    },

    // ── Refresh User Data ────────────────────────────────
    refreshUser: async () => {
      try {
        const response = await apiClient.get<ApiResponse<User>>(ENDPOINTS.ME);
        const user = response.data.data;

        await SecureStore.setItemAsync(STORAGE_KEYS.USER, JSON.stringify(user));

        set((s) => {
          s.user = user;
        });
      } catch {
        // Silent fail — user data will be stale but functional
      }
    },

    // ── Direct Set ───────────────────────────────────────
    setUser: (user: User) => {
      set((s) => {
        s.user = user;
      });
    },

    clearError: () => {
      set((s) => {
        s.error = null;
      });
    },
  })),
);
