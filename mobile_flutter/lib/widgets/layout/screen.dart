// ══════════════════════════════════════════════════════════════
// Dressly — Screen Wrapper (SafeArea + StatusBar)
// ══════════════════════════════════════════════════════════════

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../constants/constants.dart';
import '../../providers/theme_provider.dart';

class DresslyScreen extends ConsumerWidget {
  final Widget child;
  final bool scrollable;
  final bool padding;
  final bool keyboardAvoiding;
  final Future<void> Function()? onRefresh;

  const DresslyScreen({
    super.key,
    required this.child,
    this.scrollable = false,
    this.padding = true,
    this.keyboardAvoiding = false,
    this.onRefresh,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = ref.watch(themeProvider);
    final colors = theme.colors;

    final content = scrollable
        ? RefreshIndicator(
            onRefresh: onRefresh ?? () async {},
            color: colors.primary,
            child: SingleChildScrollView(
              physics: onRefresh != null
                  ? const AlwaysScrollableScrollPhysics()
                  : null,
              padding: padding
                  ? const EdgeInsets.symmetric(horizontal: Spacing.base)
                  : null,
              child: child,
            ),
          )
        : Padding(
            padding: padding
                ? const EdgeInsets.symmetric(horizontal: Spacing.base)
                : EdgeInsets.zero,
            child: child,
          );

    final body = keyboardAvoiding
        ? SafeArea(
            child: GestureDetector(
              onTap: () => FocusScope.of(context).unfocus(),
              child: content,
            ),
          )
        : SafeArea(child: content);

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness:
            theme.isDark ? Brightness.light : Brightness.dark,
        statusBarBrightness:
            theme.isDark ? Brightness.dark : Brightness.light,
      ),
      child: Scaffold(
        backgroundColor: colors.background,
        body: body,
      ),
    );
  }
}
