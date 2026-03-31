import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'constants/constants.dart';
import 'models/models.dart' as models;
import 'providers/auth_provider.dart';
import 'providers/notification_provider.dart';
import 'providers/theme_provider.dart';
import 'router/router.dart';
import 'services/websocket_service.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();

  SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  runApp(const ProviderScope(child: DresslyApp()));
}

class DresslyApp extends ConsumerStatefulWidget {
  const DresslyApp({super.key});

  @override
  ConsumerState<DresslyApp> createState() => _DresslyAppState();
}

class _DresslyAppState extends ConsumerState<DresslyApp>
    with WidgetsBindingObserver {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _init();
  }

  Future<void> _init() async {
    await ref.read(themeProvider.notifier).initialize();
    await ref.read(authProvider.notifier).initialize();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    wsService.disconnect();
    super.dispose();
  }

  @override
  void didChangePlatformBrightness() {
    ref.read(themeProvider.notifier).onSystemBrightnessChanged();
  }

  @override
  Widget build(BuildContext context) {
    final themeState = ref.watch(themeProvider);
    final authState = ref.watch(authProvider);
    final router = ref.watch(routerProvider);
    final colors = themeState.colors;

    if (authState.isAuthenticated) {
      _connectWebSocket();
    }

    final isDark = themeState.mode == models.ThemeMode.dark ||
        (themeState.mode == models.ThemeMode.system &&
            MediaQuery.platformBrightnessOf(context) == Brightness.dark);

    SystemChrome.setSystemUIOverlayStyle(
      isDark
          ? SystemUiOverlayStyle.light.copyWith(
              statusBarColor: Colors.transparent,
            )
          : SystemUiOverlayStyle.dark.copyWith(
              statusBarColor: Colors.transparent,
            ),
    );

    return MaterialApp.router(
      title: 'Dressly',
      debugShowCheckedModeBanner: false,
      routerConfig: router,
      theme: ThemeData(
        useMaterial3: true,
        brightness: isDark ? Brightness.dark : Brightness.light,
        colorSchemeSeed: colors.primary,
        scaffoldBackgroundColor: colors.background,
        appBarTheme: AppBarTheme(
          backgroundColor: colors.card,
          foregroundColor: colors.text,
          elevation: 0,
        ),
        cardColor: colors.card,
        dividerColor: colors.border,
        textTheme: TextTheme(
          bodyLarge: TextStyle(color: colors.text),
          bodyMedium: TextStyle(color: colors.text),
          bodySmall: TextStyle(color: colors.textSecondary),
        ),
      ),
      builder: (context, child) {
        if (!authState.isInitialized) {
          return _SplashScreen(colors: colors);
        }
        return child ?? const SizedBox.shrink();
      },
    );
  }

  void _connectWebSocket() {
    if (!wsService.isConnected) {
      wsService.connect();
      wsService.onMessage((data) {
        if (data is Map<String, dynamic>) {
          final type = data['type'] as String?;
          if (type == 'notification') {
            ref
                .read(notificationProvider.notifier)
                .incrementUnread();
          }
        }
      });
    }
  }
}

class _SplashScreen extends StatelessWidget {
  final AppColors colors;

  const _SplashScreen({required this.colors});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0A),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text(
              'DRESSLY',
              style: TextStyle(
                fontSize: 48,
                fontWeight: FontWeight.w900,
                color: Color(0xFFE53935),
                letterSpacing: 4,
              ),
            ),
            const SizedBox(height: Spacing.sm),
            Text(
              'AI-Powered Fashion',
              style: TextStyle(
                fontSize: FontSizes.base,
                color: Colors.white.withOpacity(0.5),
                letterSpacing: 1,
              ),
            ),
            const SizedBox(height: Spacing.xxl),
            const SizedBox(
              width: 28,
              height: 28,
              child: CircularProgressIndicator(
                strokeWidth: 2.5,
                color: Color(0xFFE53935),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
