// ══════════════════════════════════════════════════════════════
// Dressly — API Service (Dio with JWT Interceptors)
// ══════════════════════════════════════════════════════════════

import 'dart:async';
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../constants/constants.dart';
import '../models/models.dart';

class ApiService {
  late final Dio _dio;
  final FlutterSecureStorage _secureStorage = const FlutterSecureStorage();

  bool _isRefreshing = false;
  final List<Completer<String>> _refreshQueue = [];

  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;

  ApiService._internal() {
    _dio = Dio(
      BaseOptions(
        baseUrl: apiBaseUrl,
        connectTimeout: const Duration(seconds: 30),
        receiveTimeout: const Duration(seconds: 30),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Client-Platform': 'mobile',
          'X-Client-Version': '1.0.0',
        },
      ),
    );

    // Request interceptor: attach JWT
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          try {
            final token =
                await _secureStorage.read(key: StorageKeys.accessToken);
            if (token != null) {
              options.headers['Authorization'] = 'Bearer $token';
            }
          } catch (_) {
            // SecureStorage may fail on first launch
          }
          handler.next(options);
        },
        onError: (error, handler) async {
          if (error.response?.statusCode == 401 &&
              !(error.requestOptions.extra['_retry'] == true)) {
            final url = error.requestOptions.path;
            if (url.contains('/auth/login') ||
                url.contains('/auth/register') ||
                url.contains('/auth/refresh')) {
              return handler.next(error);
            }

            try {
              final newToken = await _refreshToken();
              error.requestOptions.headers['Authorization'] =
                  'Bearer $newToken';
              error.requestOptions.extra['_retry'] = true;
              final response = await _dio.fetch(error.requestOptions);
              return handler.resolve(response);
            } catch (e) {
              return handler.next(error);
            }
          }
          handler.next(error);
        },
      ),
    );
  }

  Dio get dio => _dio;

  Future<String> _refreshToken() async {
    if (_isRefreshing) {
      final completer = Completer<String>();
      _refreshQueue.add(completer);
      return completer.future;
    }

    _isRefreshing = true;

    try {
      final refreshToken =
          await _secureStorage.read(key: StorageKeys.refreshToken);
      if (refreshToken == null) {
        throw Exception('No refresh token available');
      }

      final response = await Dio().post(
        '$apiBaseUrl${Endpoints.refresh}',
        data: {'refresh_token': refreshToken},
        options: Options(headers: {'Content-Type': 'application/json'}),
      );

      final tokenData = response.data['data'] as Map<String, dynamic>;
      final newAccessToken = tokenData['access_token'] as String;
      final newRefreshToken = tokenData['refresh_token'] as String;

      await _secureStorage.write(
          key: StorageKeys.accessToken, value: newAccessToken);
      await _secureStorage.write(
          key: StorageKeys.refreshToken, value: newRefreshToken);

      for (final completer in _refreshQueue) {
        completer.complete(newAccessToken);
      }
      _refreshQueue.clear();

      return newAccessToken;
    } catch (e) {
      for (final completer in _refreshQueue) {
        completer.completeError(e);
      }
      _refreshQueue.clear();

      // Clear tokens on refresh failure
      await _secureStorage.delete(key: StorageKeys.accessToken);
      await _secureStorage.delete(key: StorageKeys.refreshToken);
      await _secureStorage.delete(key: StorageKeys.user);

      rethrow;
    } finally {
      _isRefreshing = false;
    }
  }

  // ── Convenience methods ─────────────────────────────────

  Future<Response<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
  }) =>
      _dio.get<T>(path, queryParameters: queryParameters);

  Future<Response<T>> post<T>(
    String path, {
    dynamic data,
  }) =>
      _dio.post<T>(path, data: data);

  Future<Response<T>> put<T>(
    String path, {
    dynamic data,
  }) =>
      _dio.put<T>(path, data: data);

  Future<Response<T>> patch<T>(
    String path, {
    dynamic data,
  }) =>
      _dio.patch<T>(path, data: data);

  Future<Response<T>> delete<T>(String path) => _dio.delete<T>(path);

  // ── Multipart Upload Helper ─────────────────────────────

  Future<Response> uploadFile(
    String url,
    FormData formData,
  ) =>
      _dio.post(
        url,
        data: formData,
        options: Options(
          headers: {'Content-Type': 'multipart/form-data'},
          sendTimeout: const Duration(minutes: 2),
          receiveTimeout: const Duration(minutes: 2),
        ),
      );
}

// ── Error Extractor ─────────────────────────────────────────

class ApiErrorInfo {
  final String code;
  final String message;

  const ApiErrorInfo({required this.code, required this.message});
}

ApiErrorInfo extractApiError(dynamic error) {
  if (error is DioException) {
    final data = error.response?.data;
    if (data is Map<String, dynamic> && data['error'] is Map) {
      final apiErr = data['error'] as Map<String, dynamic>;
      return ApiErrorInfo(
        code: apiErr['code'] as String? ?? 'UNKNOWN',
        message: apiErr['message'] as String? ?? 'Something went wrong',
      );
    }
    if (error.type == DioExceptionType.connectionError) {
      return const ApiErrorInfo(
        code: 'NETWORK_ERROR',
        message: 'No internet connection. Please check your network.',
      );
    }
    if (error.type == DioExceptionType.connectionTimeout ||
        error.type == DioExceptionType.receiveTimeout) {
      return const ApiErrorInfo(
        code: 'TIMEOUT',
        message: 'Request timed out. Please try again.',
      );
    }
    return ApiErrorInfo(
      code: 'HTTP_ERROR',
      message: error.message ?? 'Something went wrong',
    );
  }
  return ApiErrorInfo(
    code: 'UNKNOWN',
    message: error is Exception ? error.toString() : 'An unexpected error occurred',
  );
}

final apiService = ApiService();
