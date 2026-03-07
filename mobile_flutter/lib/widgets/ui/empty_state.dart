// ══════════════════════════════════════════════════════════════
// Dressly — Empty State Widget (Flutter)
// ══════════════════════════════════════════════════════════════

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../constants/constants.dart';
import '../../providers/theme_provider.dart';
import 'button.dart';

class DresslyEmptyState extends ConsumerWidget {
  final IconData icon;
  final String title;
  final String? message;
  final String? actionTitle;
  final VoidCallback? onAction;

  const DresslyEmptyState({
    super.key,
    this.icon = Icons.photo_library_outlined,
    required this.title,
    this.message,
    this.actionTitle,
    this.onAction,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = ref.watch(themeProvider).colors;

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(Spacing.xxl),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 64, color: colors.textMuted),
            const SizedBox(height: Spacing.md),
            Text(
              title,
              style: TextStyle(
                fontSize: FontSizes.lg,
                fontWeight: FontWeight.w600,
                color: colors.text,
              ),
              textAlign: TextAlign.center,
            ),
            if (message != null) ...[
              const SizedBox(height: Spacing.md),
              Text(
                message!,
                style: TextStyle(
                  fontSize: FontSizes.md,
                  color: colors.textSecondary,
                  height: 1.5,
                ),
                textAlign: TextAlign.center,
              ),
            ],
            if (actionTitle != null && onAction != null) ...[
              const SizedBox(height: Spacing.base),
              DresslyButton(
                title: actionTitle!,
                variant: ButtonVariant.outline,
                size: ButtonSize.sm,
                onPressed: onAction,
              ),
            ],
          ],
        ),
      ),
    );
  }
}
