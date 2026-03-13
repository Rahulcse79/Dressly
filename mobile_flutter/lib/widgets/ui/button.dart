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
        borderRadius = AppRadius.md;
      case ButtonSize.lg:
        hPad = Spacing.xl;
        vPad = Spacing.base;
        fontSize = FontSizes.lg;
        borderRadius = AppRadius.lg;
      case ButtonSize.md:
        hPad = Spacing.lg;
        vPad = Spacing.md;
        fontSize = FontSizes.base;
        borderRadius = AppRadius.md;
    }

    // Variant colors
    Color bgColor, textColor;
    Color? borderColor;
    List<Color>? gradientColors;

    switch (variant) {
      case ButtonVariant.primary:
        bgColor = colors.primary;
        textColor = Colors.white;
        gradientColors = [colors.primary, colors.primaryDark];
      case ButtonVariant.secondary:
        bgColor = colors.secondary;
        textColor = Colors.white;
        gradientColors = [colors.secondary, colors.secondary.withOpacity(0.8)];
      case ButtonVariant.outline:
        bgColor = Colors.transparent;
        textColor = colors.primary;
        borderColor = colors.primary;
      case ButtonVariant.ghost:
        bgColor = Colors.transparent;
        textColor = colors.textSecondary;
      case ButtonVariant.danger:
        bgColor = colors.error;
        textColor = Colors.white;
        gradientColors = [colors.error, colors.error.withOpacity(0.8)];
    }

    final textWidget = Text(
      title,
      style: TextStyle(
        color: textColor,
        fontSize: fontSize,
        fontWeight: FontWeight.w700,
        letterSpacing: 0.5,
      ),
    );

    final buttonChild = loading
        ? SizedBox(
            width: 22,
            height: 22,
            child: CircularProgressIndicator(
              strokeWidth: 2.5,
              color: variant == ButtonVariant.outline ||
                      variant == ButtonVariant.ghost
                  ? colors.primary
                  : Colors.white,
            ),
          )
        : Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (icon != null && !iconRight) ...[
                icon!,
                const SizedBox(width: Spacing.sm),
              ],
              textWidget,
              if (icon != null && iconRight) ...[
                const SizedBox(width: Spacing.sm),
                icon!,
              ],
            ],
          );

    final bool hasGradient =
        gradientColors != null && !isDisabled;

    return SizedBox(
      width: fullWidth ? double.infinity : null,
      child: AnimatedOpacity(
        opacity: isDisabled ? 0.55 : 1.0,
        duration: AppAnimation.fast,
        child: Material(
          color: Colors.transparent,
          borderRadius: BorderRadius.circular(borderRadius),
          child: InkWell(
            onTap: isDisabled ? null : onPressed,
            borderRadius: BorderRadius.circular(borderRadius),
            splashColor: textColor.withOpacity(0.1),
            highlightColor: textColor.withOpacity(0.05),
            child: AnimatedContainer(
              duration: AppAnimation.fast,
              padding: EdgeInsets.symmetric(
                  horizontal: hPad, vertical: vPad),
              decoration: BoxDecoration(
                gradient: hasGradient
                    ? LinearGradient(
                        colors: gradientColors!,
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      )
                    : null,
                color: hasGradient ? null : bgColor,
                borderRadius: BorderRadius.circular(borderRadius),
                border: borderColor != null
                    ? Border.all(color: borderColor, width: 1.5)
                    : null,
                boxShadow: hasGradient
                    ? [
                        BoxShadow(
                          color: gradientColors!.first.withOpacity(0.3),
                          blurRadius: 12,
                          offset: const Offset(0, 4),
                        ),
                      ]
                    : null,
              ),
              alignment: Alignment.center,
              child: buttonChild,
            ),
          ),
        ),
      ),
    );
  }
}
