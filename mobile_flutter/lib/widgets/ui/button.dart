// ══════════════════════════════════════════════════════════════
// Dressly — Button Widget (Flutter)
// ══════════════════════════════════════════════════════════════

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../constants/constants.dart';
import '../../providers/theme_provider.dart';

enum ButtonVariant { primary, secondary, outline, ghost, danger }

enum ButtonSize { sm, md, lg }

class DresslyButton extends ConsumerWidget {
  final String title;
  final ButtonVariant variant;
  final ButtonSize size;
  final bool loading;
  final Widget? icon;
  final bool iconRight;
  final bool fullWidth;
  final bool disabled;
  final VoidCallback? onPressed;

  const DresslyButton({
    super.key,
    required this.title,
    this.variant = ButtonVariant.primary,
    this.size = ButtonSize.md,
    this.loading = false,
    this.icon,
    this.iconRight = false,
    this.fullWidth = false,
    this.disabled = false,
    this.onPressed,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = ref.watch(themeProvider).colors;
    final isDisabled = disabled || loading;

    // Size
    double hPad, vPad, fontSize, borderRadius;
    switch (size) {
      case ButtonSize.sm:
        hPad = Spacing.md;
        vPad = Spacing.sm;
        fontSize = FontSizes.sm;
        borderRadius = AppRadius.sm;
      case ButtonSize.lg:
        hPad = Spacing.xl;
        vPad = Spacing.base;
        fontSize = FontSizes.lg;
        borderRadius = AppRadius.md;
      case ButtonSize.md:
        hPad = Spacing.lg;
        vPad = Spacing.md;
        fontSize = FontSizes.base;
        borderRadius = AppRadius.md;
    }

    // Variant colors
    Color bgColor, textColor;
    Color? borderColor;

    switch (variant) {
      case ButtonVariant.primary:
        bgColor = colors.primary;
        textColor = Colors.white;
      case ButtonVariant.secondary:
        bgColor = colors.secondary;
        textColor = Colors.white;
      case ButtonVariant.outline:
        bgColor = Colors.transparent;
        textColor = colors.primary;
        borderColor = colors.primary;
      case ButtonVariant.ghost:
        bgColor = Colors.transparent;
        textColor = colors.text;
      case ButtonVariant.danger:
        bgColor = colors.error;
        textColor = Colors.white;
    }

    final textWidget = Text(
      title,
      style: TextStyle(
        color: textColor,
        fontSize: fontSize,
        fontWeight: FontWeight.w600,
      ),
    );

    final buttonChild = loading
        ? SizedBox(
            width: 20,
            height: 20,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              color: variant == ButtonVariant.outline ||
                      variant == ButtonVariant.ghost
                  ? colors.primary
                  : Colors.white,
            ),
          )
        : Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (icon != null && !iconRight) ...[icon!, const SizedBox(width: Spacing.sm)],
              textWidget,
              if (icon != null && iconRight) ...[const SizedBox(width: Spacing.sm), icon!],
            ],
          );

    return AnimatedScale(
      scale: 1.0,
      duration: AppAnimation.fast,
      child: SizedBox(
        width: fullWidth ? double.infinity : null,
        child: AnimatedOpacity(
          opacity: isDisabled ? 0.5 : 1.0,
          duration: AppAnimation.fast,
          child: Material(
            color: bgColor,
            borderRadius: BorderRadius.circular(borderRadius),
            child: InkWell(
              onTap: isDisabled ? null : onPressed,
              borderRadius: BorderRadius.circular(borderRadius),
              child: Container(
                padding: EdgeInsets.symmetric(
                    horizontal: hPad, vertical: vPad),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(borderRadius),
                  border: borderColor != null
                      ? Border.all(color: borderColor, width: 1.5)
                      : null,
                ),
                alignment: Alignment.center,
                child: buttonChild,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
