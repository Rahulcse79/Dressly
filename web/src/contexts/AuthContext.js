// ══════════════════════════════════════════════════════════════
// Dressly Web — Auth Context (JWT + WebSocket lifecycle)
// ══════════════════════════════════════════════════════════════

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, userApi, tokenStore } from '../services/api';
import wsService from '../services/websocket';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => tokenStore.getUser());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check saved session on mount
  useEffect(() => {
    const token = tokenStore.getAccessToken();
    if (token) {
      userApi.getMe()
        .then((res) => {
          const u = res.data.data;
          setUser(u);
          tokenStore.setTokens(token, tokenStore.getRefreshToken(), u);
          wsService.connect();
        })
        .catch(() => {
          tokenStore.clear();
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    setError(null);
    try {
      const res = await authApi.login(email, password);
      const { access_token, refresh_token, user: userData } = res.data.data;
      tokenStore.setTokens(access_token, refresh_token, userData);
      setUser(userData);
      wsService.connect();
      return userData;
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      setError(msg);
      throw new Error(msg);
    }
  }, []);

  const register = useCallback(async (email, password, displayName) => {
    setError(null);
    try {
      const res = await authApi.register(email, password, displayName);
      const { access_token, refresh_token, user: userData } = res.data.data;
      tokenStore.setTokens(access_token, refresh_token, userData);
      setUser(userData);
      wsService.connect();
      return userData;
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      setError(msg);
      throw new Error(msg);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch { /* ignore */ }
    wsService.disconnect();
    tokenStore.clear();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await userApi.getMe();
      const u = res.data.data;
      setUser(u);
      const token = tokenStore.getAccessToken();
      tokenStore.setTokens(token, tokenStore.getRefreshToken(), u);
      return u;
    } catch {
      return null;
    }
  }, []);

  const isAdmin = user?.role === 'admin';
  const isPro = user?.role === 'pro' || user?.role === 'admin';
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        isAuthenticated,
        isAdmin,
        isPro,
        login,
        register,
        logout,
        refreshUser,
        setUser,
        setError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
