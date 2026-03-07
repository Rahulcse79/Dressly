// ══════════════════════════════════════════════════════════════
// Dressly — Card Widget (Flutter)
// ══════════════════════════════════════════════════════════════

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../constants/constants.dart';
import '../../providers/theme_provider.dart';

class DresslyCard extends ConsumerWidget {
  final Widget child;
  final VoidCallback? onTap;
  final double padding;
  final bool elevated;
  final BoxDecoration? decoration;

  const DresslyCard({
    super.key,
    required this.child,
    this.onTap,
    this.padding = Spacing.base,
    this.elevated = false,
    this.decoration,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = ref.watch(themeProvider).colors;

    final cardDecoration = decoration ??
        BoxDecoration(
          color: elevated ? colors.surfaceElevated : colors.card,
          borderRadius: BorderRadius.circular(AppRadius.lg),
          border: Border.all(color: colors.border),
          boxShadow: elevated
              ? [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.08),
                    offset: const Offset(0, 2),
                    blurRadius: 8,
                  ),
                ]
              : null,
        );

    final content = Container(
      padding: EdgeInsets.all(padding),
      decoration: cardDecoration,
      child: child,
    );

    if (onTap != null) {
      return GestureDetector(
        onTap: onTap,
        child: content,
      );
    }

    return content;
  }
}
