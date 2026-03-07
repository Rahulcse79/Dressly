// ══════════════════════════════════════════════════════════════
// Dressly — WebSocket Service with Auto-Reconnect (Dart)
// ══════════════════════════════════════════════════════════════

import 'dart:async';
import 'dart:convert';
import 'dart:math';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import '../constants/constants.dart';

typedef MessageHandler = void Function(Map<String, dynamic> message);
typedef ConnectionHandler = void Function();

class WebSocketService {
  WebSocketChannel? _channel;
  int _reconnectAttempts = 0;
  Timer? _reconnectTimer;
  Timer? _heartbeatTimer;
  bool _isIntentionalClose = false;
  String? _url;

  final Set<MessageHandler> _messageHandlers = {};
  final Set<ConnectionHandler> _connectHandlers = {};
  final Set<ConnectionHandler> _disconnectHandlers = {};
  final FlutterSecureStorage _secureStorage = const FlutterSecureStorage();

  static final WebSocketService _instance = WebSocketService._internal();
  factory WebSocketService() => _instance;
  WebSocketService._internal();

  bool get isConnected => _channel != null;

  // ── Connect ─────────────────────────────────────────────
  Future<void> connect() async {
    if (_channel != null) return;

    final token = await _secureStorage.read(key: StorageKeys.accessToken);
    if (token == null) {
      debugPrint('[WS] No access token — skipping connection');
      return;
    }

    _isIntentionalClose = false;
    _url = '$wsBaseUrl?token=${Uri.encodeComponent(token)}';

    _createConnection();
  }

  void _createConnection() {
    if (_url == null) return;

    try {
      _channel = WebSocketChannel.connect(Uri.parse(_url!));

      debugPrint('[WS] Connected');
      _reconnectAttempts = 0;
      _startHeartbeat();
      for (final h in _connectHandlers) {
        h();
      }

      _channel!.stream.listen(
        (data) {
          try {
            final message =
                jsonDecode(data as String) as Map<String, dynamic>;
            if (message['type'] == 'pong') return;
            for (final h in _messageHandlers) {
              h(message);
            }
          } catch (e) {
            debugPrint('[WS] Failed to parse message: $e');
          }
        },
        onError: (error) {
          debugPrint('[WS] Error: $error');
        },
        onDone: () {
          debugPrint('[WS] Closed');
          _stopHeartbeat();
          _channel = null;
          for (final h in _disconnectHandlers) {
            h();
          }
          if (!_isIntentionalClose) {
            _scheduleReconnect();
          }
        },
      );
    } catch (e) {
      debugPrint('[WS] Connection failed: $e');
      _channel = null;
      _scheduleReconnect();
    }
  }

  // ── Reconnect with Exponential Backoff + Jitter ─────────
  void _scheduleReconnect() {
    if (_reconnectAttempts >= WsConfig.reconnectMaxAttempts) {
      debugPrint('[WS] Max reconnect attempts reached');
      return;
    }

    final baseDelay = min(
      WsConfig.reconnectBaseDelay * pow(2, _reconnectAttempts),
      WsConfig.reconnectMaxDelay,
    );

    final jitter = (baseDelay * WsConfig.jitterFactor * Random().nextDouble())
        .toInt();
    final delay = baseDelay.toInt() + jitter;

    debugPrint(
        '[WS] Reconnecting in ${delay}ms (attempt ${_reconnectAttempts + 1})');

    _reconnectTimer = Timer(Duration(milliseconds: delay), () {
      _reconnectAttempts++;
      _createConnection();
    });
  }

  // ── Heartbeat ───────────────────────────────────────────
  void _startHeartbeat() {
    _stopHeartbeat();
    _heartbeatTimer = Timer.periodic(
      const Duration(milliseconds: WsConfig.heartbeatInterval),
      (_) => send({'type': 'ping'}),
    );
  }

  void _stopHeartbeat() {
    _heartbeatTimer?.cancel();
    _heartbeatTimer = null;
  }

  // ── Send ────────────────────────────────────────────────
  bool send(Map<String, dynamic> data) {
    if (_channel != null) {
      _channel!.sink.add(jsonEncode(data));
      return true;
    }
    return false;
  }

  // ── Disconnect ──────────────────────────────────────────
  void disconnect() {
    _isIntentionalClose = true;
    _reconnectTimer?.cancel();
    _reconnectTimer = null;
    _stopHeartbeat();

    _channel?.sink.close(1000, 'Client disconnect');
    _channel = null;
    _reconnectAttempts = 0;
  }

  // ── Event Handlers ──────────────────────────────────────
  VoidCallback onMessage(MessageHandler handler) {
    _messageHandlers.add(handler);
    return () => _messageHandlers.remove(handler);
  }

  VoidCallback onConnect(ConnectionHandler handler) {
    _connectHandlers.add(handler);
    return () => _connectHandlers.remove(handler);
  }

  VoidCallback onDisconnect(ConnectionHandler handler) {
    _disconnectHandlers.add(handler);
    return () => _disconnectHandlers.remove(handler);
  }

  void removeAllHandlers() {
    _messageHandlers.clear();
    _connectHandlers.clear();
    _disconnectHandlers.clear();
  }
}

final wsService = WebSocketService();
