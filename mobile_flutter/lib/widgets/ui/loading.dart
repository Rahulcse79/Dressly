// ══════════════════════════════════════════════════════════════
// Dressly — Loading Widget (Flutter)
// ══════════════════════════════════════════════════════════════

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../constants/constants.dart';
import '../../providers/theme_provider.dart';

class DresslyLoading extends ConsumerWidget {
  final String? message;
  final bool fullScreen;
  final double size;

  const DresslyLoading({
    super.key,
    this.message,
    this.fullScreen = false,
    this.size = 36,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = ref.watch(themeProvider).colors;

    return Container(
      color: fullScreen ? colors.background : Colors.transparent,
      padding: const EdgeInsets.all(Spacing.xl),
      child: Center(
        child: Column(
          mainAxisSize:
              fullScreen ? MainAxisSize.max : MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            SizedBox(
              width: size,
              height: size,
              child: CircularProgressIndicator(
                color: colors.primary,
                strokeWidth: 3,
              ),
            ),
            if (message != null) ...[
              const SizedBox(height: Spacing.md),
              Text(
                message!,
                style: TextStyle(
                  fontSize: FontSizes.md,
                  color: colors.textSecondary,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
