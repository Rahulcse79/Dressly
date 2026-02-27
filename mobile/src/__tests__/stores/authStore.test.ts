// ─── Auth Store Tests ────────────────────────────────────────────────────────

import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '../../stores/authStore';
import apiClient from '../../services/api';

// Reset Zustand store between tests
const initialState = useAuthStore.getState();

beforeEach(() => {
  useAuthStore.setState(initialState);
  jest.clearAllMocks();
});

describe('AuthStore', () => {
  // ── Initial State ─────────────────────────────────────────

  it('has correct initial state', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(false);
    expect(state.isInitialized).toBe(false);
    expect(state.error).toBeNull();
  });

  // ── Initialize ────────────────────────────────────────────

  it('initializes with stored token and user', async () => {
    const mockUser = {
      id: '1',
      email: 'test@dressly.com',
      role: 'user',
      is_verified: true,
      is_active: true,
      display_name: 'Test',
      avatar_url: null,
      gender: null,
      body_type: null,
      style_preferences: null,
      color_preferences: null,
      created_at: new Date().toISOString(),
    };

    (SecureStore.getItemAsync as jest.Mock).mockImplementation((key: string) => {
      if (key === 'access_token') return Promise.resolve('mock-token');
      if (key === 'user') return Promise.resolve(JSON.stringify(mockUser));
      return Promise.resolve(null);
    });

    await useAuthStore.getState().initialize();
    const state = useAuthStore.getState();

    expect(state.isInitialized).toBe(true);
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual(mockUser);
  });

  it('initializes without tokens (fresh install)', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

    await useAuthStore.getState().initialize();
    const state = useAuthStore.getState();

    expect(state.isInitialized).toBe(true);
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
  });

  it('handles initialization error gracefully', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockRejectedValue(
      new Error('SecureStore failed')
    );

    await useAuthStore.getState().initialize();
    const state = useAuthStore.getState();

    expect(state.isInitialized).toBe(true);
    expect(state.isAuthenticated).toBe(false);
  });

  // ── Register ──────────────────────────────────────────────

  it('registers user successfully', async () => {
    const mockResponse = {
      data: {
        data: {
          access_token: 'access-123',
          refresh_token: 'refresh-123',
          user: {
            id: '1',
            email: 'new@dressly.com',
            role: 'user',
            is_verified: true,
            is_active: true,
            display_name: 'New User',
            avatar_url: null,
            gender: null,
            body_type: null,
            style_preferences: null,
            color_preferences: null,
            created_at: new Date().toISOString(),
          },
        },
      },
    };

    (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

    await useAuthStore.getState().register({
      email: 'new@dressly.com',
      password: 'StrongPass1!',
    });

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user?.email).toBe('new@dressly.com');
    expect(state.isLoading).toBe(false);
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      'access_token',
      'access-123'
    );
  });

  it('sets loading state during register', async () => {
    let resolvePost: any;
    (apiClient.post as jest.Mock).mockReturnValue(
      new Promise((r) => (resolvePost = r))
    );

    const promise = useAuthStore.getState().register({
      email: 'a@b.com',
      password: 'pass',
    });

    expect(useAuthStore.getState().isLoading).toBe(true);

    resolvePost({
      data: {
        data: {
          access_token: 'x',
          refresh_token: 'y',
          user: { id: '1', email: 'a@b.com', role: 'user' },
        },
      },
    });
    await promise;

    expect(useAuthStore.getState().isLoading).toBe(false);
  });

  it('handles register error', async () => {
    const error = {
      response: { data: { error: { message: 'Email already exists' } } },
    };
    (apiClient.post as jest.Mock).mockRejectedValue(error);

    await expect(
      useAuthStore.getState().register({
        email: 'dup@dressly.com',
        password: 'StrongPass1!',
      })
    ).rejects.toBeTruthy();

    const state = useAuthStore.getState();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeTruthy();
    expect(state.isAuthenticated).toBe(false);
  });

  // ── Login ─────────────────────────────────────────────────

  it('logs in user successfully', async () => {
    const mockResponse = {
      data: {
        data: {
          access_token: 'access-456',
          refresh_token: 'refresh-456',
          user: {
            id: '2',
            email: 'login@dressly.com',
            role: 'pro',
            is_verified: true,
            is_active: true,
            display_name: 'Login User',
            avatar_url: null,
            gender: null,
            body_type: null,
            style_preferences: null,
            color_preferences: null,
            created_at: new Date().toISOString(),
          },
        },
      },
    };

    (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

    await useAuthStore.getState().login({
      email: 'login@dressly.com',
      password: 'StrongPass1!',
    });

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user?.role).toBe('pro');
    expect(state.isLoading).toBe(false);
  });

  it('handles login error', async () => {
    const error = {
      response: { data: { error: { message: 'Invalid credentials' } } },
    };
    (apiClient.post as jest.Mock).mockRejectedValue(error);

    await expect(
      useAuthStore.getState().login({
        email: 'wrong@dressly.com',
        password: 'wrongpass',
      })
    ).rejects.toBeTruthy();

    expect(useAuthStore.getState().isLoading).toBe(false);
    expect(useAuthStore.getState().error).toBeTruthy();
  });

  // ── Logout ────────────────────────────────────────────────

  it('logs out user and clears state', async () => {
    // First set authenticated state
    useAuthStore.setState({
      user: { id: '1', email: 'a@b.com', role: 'user' } as any,
      isAuthenticated: true,
    });

    (apiClient.post as jest.Mock).mockResolvedValue({});

    await useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.error).toBeNull();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('access_token');
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('refresh_token');
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('user');
  });

  it('logs out even if API call fails', async () => {
    useAuthStore.setState({
      user: { id: '1', email: 'a@b.com', role: 'user' } as any,
      isAuthenticated: true,
    });

    (apiClient.post as jest.Mock).mockRejectedValue(new Error('Network error'));

    await useAuthStore.getState().logout();

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
  });

  // ── setUser ───────────────────────────────────────────────

  it('updates user directly', () => {
    const user = { id: '5', email: 'direct@dressly.com', role: 'admin' } as any;
    useAuthStore.getState().setUser(user);
    expect(useAuthStore.getState().user).toEqual(user);
  });

  // ── clearError ────────────────────────────────────────────

  it('clears error state', () => {
    useAuthStore.setState({ error: 'Some error' });
    useAuthStore.getState().clearError();
    expect(useAuthStore.getState().error).toBeNull();
  });

  // ── refreshUser ───────────────────────────────────────────

  it('refreshes user data from API', async () => {
    const updatedUser = {
      id: '1',
      email: 'updated@dressly.com',
      role: 'pro',
      is_verified: true,
      is_active: true,
      display_name: 'Updated Name',
      avatar_url: 'https://cdn.dressly.com/avatar.jpg',
      gender: 'female',
      body_type: 'athletic',
      style_preferences: null,
      color_preferences: ['blue', 'red'],
      created_at: new Date().toISOString(),
    };

    (apiClient.get as jest.Mock).mockResolvedValue({
      data: { data: updatedUser },
    });

    await useAuthStore.getState().refreshUser();

    expect(useAuthStore.getState().user).toEqual(updatedUser);
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      'user',
      JSON.stringify(updatedUser)
    );
  });

  it('handles refreshUser failure silently', async () => {
    const existingUser = { id: '1', email: 'a@b.com', role: 'user' } as any;
    useAuthStore.setState({ user: existingUser });

    (apiClient.get as jest.Mock).mockRejectedValue(new Error('fail'));

    await useAuthStore.getState().refreshUser();

    // User should remain unchanged
    expect(useAuthStore.getState().user).toEqual(existingUser);
  });
});
