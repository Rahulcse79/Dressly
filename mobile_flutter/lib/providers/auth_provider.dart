// ══════════════════════════════════════════════════════════════
// Dressly — Auth Provider (Riverpod + SecureStorage)
// ══════════════════════════════════════════════════════════════

import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../constants/constants.dart';
import '../models/models.dart';
import '../services/api_service.dart';

class AuthState {
  final User? user;
  final String? token;
  final bool isAuthenticated;
  final bool isLoading;
  final bool isInitialized;
  final String? error;

  const AuthState({
    this.user,
    this.token,
    this.isAuthenticated = false,
    this.isLoading = false,
    this.isInitialized = false,
    this.error,
  });

  AuthState copyWith({
    User? user,
    String? token,
    bool? isAuthenticated,
    bool? isLoading,
    bool? isInitialized,
    String? error,
    bool clearUser = false,
    bool clearError = false,
    bool clearToken = false,
  }) =>
      AuthState(
        user: clearUser ? null : (user ?? this.user),
        token: clearToken ? null : (token ?? this.token),
        isAuthenticated: isAuthenticated ?? this.isAuthenticated,
        isLoading: isLoading ?? this.isLoading,
        isInitialized: isInitialized ?? this.isInitialized,
        error: clearError ? null : (error ?? this.error),
      );
}

class AuthNotifier extends StateNotifier<AuthState> {
  final FlutterSecureStorage _secureStorage = const FlutterSecureStorage();
  final ApiService _api = apiService;

  AuthNotifier() : super(const AuthState());

  // ── Initialize from stored tokens ────────────────────
  Future<void> initialize() async {
    try {
      final token =
          await _secureStorage.read(key: StorageKeys.accessToken);
      final userJson = await _secureStorage.read(key: StorageKeys.user);

      if (token != null && userJson != null) {
        final user = User.fromJson(
            jsonDecode(userJson) as Map<String, dynamic>);
        state = state.copyWith(
          user: user,
          token: token,
          isAuthenticated: true,
          isInitialized: true,
        );
        // Silently refresh user data
        refreshUser();
      } else {
        state = state.copyWith(isInitialized: true);
      }
    } catch (e) {
      state = state.copyWith(isInitialized: true);
    }
  }

  // ── Register ─────────────────────────────────────────
  Future<void> register(RegisterRequest data) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final response = await _api.post(
        Endpoints.register,
        data: data.toJson(),
      );
      final tokenResponse =
          TokenResponse.fromJson(response.data['data'] as Map<String, dynamic>);

      await _secureStorage.write(
          key: StorageKeys.accessToken,
          value: tokenResponse.accessToken);
      await _secureStorage.write(
          key: StorageKeys.refreshToken,
          value: tokenResponse.refreshToken);
      await _secureStorage.write(
          key: StorageKeys.user,
          value: jsonEncode(tokenResponse.user.toJson()));

      state = state.copyWith(
        user: tokenResponse.user,
        token: tokenResponse.accessToken,
        isAuthenticated: true,
        isLoading: false,
      );
    } catch (err) {
      final apiErr = extractApiError(err);
      state = state.copyWith(
        isLoading: false,
        error: apiErr.message,
      );
      rethrow;
    }
  }

  // ── Login ────────────────────────────────────────────
  Future<void> login(LoginRequest data) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final response = await _api.post(
        Endpoints.login,
        data: data.toJson(),
      );
      final tokenResponse =
          TokenResponse.fromJson(response.data['data'] as Map<String, dynamic>);

      await _secureStorage.write(
          key: StorageKeys.accessToken,
          value: tokenResponse.accessToken);
      await _secureStorage.write(
          key: StorageKeys.refreshToken,
          value: tokenResponse.refreshToken);
      await _secureStorage.write(
          key: StorageKeys.user,
          value: jsonEncode(tokenResponse.user.toJson()));

      state = state.copyWith(
        user: tokenResponse.user,
        token: tokenResponse.accessToken,
        isAuthenticated: true,
        isLoading: false,
      );
    } catch (err) {
      final apiErr = extractApiError(err);
      state = state.copyWith(
        isLoading: false,
        error: apiErr.message,
      );
      rethrow;
    }
  }

  // ── Logout ───────────────────────────────────────────
  Future<void> logout() async {
    try {
      await _api.post(Endpoints.logout).catchError((_) {});
    } finally {
      await _secureStorage.delete(key: StorageKeys.accessToken);
      await _secureStorage.delete(key: StorageKeys.refreshToken);
      await _secureStorage.delete(key: StorageKeys.user);

      state = state.copyWith(
        clearUser: true,
        clearToken: true,
        isAuthenticated: false,
        clearError: true,
      );
    }
  }

  // ── Refresh User Data ────────────────────────────────
  Future<void> refreshUser() async {
    try {
      final response = await _api.get(Endpoints.me);
      final user =
          User.fromJson(response.data['data'] as Map<String, dynamic>);
      await _secureStorage.write(
          key: StorageKeys.user,
          value: jsonEncode(user.toJson()));
      state = state.copyWith(user: user);
    } catch (_) {
      // Silent fail
    }
  }

  void setUser(User user) {
    state = state.copyWith(user: user);
  }

  void clearError() {
    state = state.copyWith(clearError: true);
  }
}

final authProvider =
    StateNotifierProvider<AuthNotifier, AuthState>((ref) => AuthNotifier());
