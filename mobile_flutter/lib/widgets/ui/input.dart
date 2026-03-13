// ══════════════════════════════════════════════════════════════
// Dressly — Input Widget (Flutter)
// Glassmorphism dark style with focus animations
// ══════════════════════════════════════════════════════════════

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../constants/constants.dart';
import '../../providers/theme_provider.dart';

class DresslyInput extends ConsumerStatefulWidget {
  final String? label;
  final String? placeholder;
  final String? error;
  final String? hint;
  final IconData? leftIcon;
  final IconData? rightIcon;
  final VoidCallback? onRightIconPress;
  final bool isPassword;
  final TextEditingController? controller;
  final ValueChanged<String>? onChanged;
  final VoidCallback? onSubmitted;
  final TextInputType? keyboardType;
  final TextInputAction? textInputAction;
  final bool multiline;
  final int? maxLines;
  final FocusNode? focusNode;
  final bool autofocus;

  const DresslyInput({
    super.key,
    this.label,
    this.placeholder,
    this.error,
    this.hint,
    this.leftIcon,
    this.rightIcon,
    this.onRightIconPress,
    this.isPassword = false,
    this.controller,
    this.onChanged,
    this.onSubmitted,
    this.keyboardType,
    this.textInputAction,
    this.multiline = false,
    this.maxLines,
    this.focusNode,
    this.autofocus = false,
  });

  @override
  ConsumerState<DresslyInput> createState() => _DresslyInputState();
}

class _DresslyInputState extends ConsumerState<DresslyInput> {
  bool _obscureText = true;
  bool _isFocused = false;
  late FocusNode _focusNode;

  @override
  void initState() {
    super.initState();
    _focusNode = widget.focusNode ?? FocusNode();
    _focusNode.addListener(_onFocusChange);
  }

  @override
  void dispose() {
    if (widget.focusNode == null) {
      _focusNode.removeListener(_onFocusChange);
      _focusNode.dispose();
    } else {
      _focusNode.removeListener(_onFocusChange);
    }
    super.dispose();
  }

  void _onFocusChange() {
    setState(() => _isFocused = _focusNode.hasFocus);
  }

  @override
  Widget build(BuildContext context) {
    final colors = ref.watch(themeProvider).colors;
    final isDark = ref.watch(themeProvider).isDark;
    final hasError = widget.error != null && widget.error!.isNotEmpty;

    // Use glassmorphism style for dark mode, standard style for light
    final bgColor = isDark
        ? Colors.white.withOpacity(_isFocused ? 0.10 : 0.07)
        : (_isFocused ? colors.primary.withOpacity(0.04) : colors.surface);

    final borderColor = hasError
        ? colors.error
        : _isFocused
            ? (isDark
                ? Colors.white.withOpacity(0.20)
                : colors.primary)
            : (isDark
                ? Colors.white.withOpacity(0.10)
                : colors.border);

    final iconColor = isDark
        ? Colors.white.withOpacity(_isFocused ? 0.6 : 0.4)
        : (_isFocused ? colors.primary : colors.textMuted);

    final textColor = isDark ? Colors.white : colors.text;
    final hintColor = isDark
        ? Colors.white.withOpacity(0.3)
        : colors.textMuted.withOpacity(0.7);
    final labelColor = isDark
        ? Colors.white
        : (_isFocused ? colors.primary : colors.textSecondary);

    return Padding(
      padding: const EdgeInsets.only(bottom: Spacing.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (widget.label != null)
            Padding(
              padding: const EdgeInsets.only(bottom: 6),
              child: Text(
                widget.label!,
                style: TextStyle(
                  fontSize: FontSizes.sm,
                  fontWeight: FontWeight.w600,
                  color: labelColor,
                  letterSpacing: 0.3,
                ),
              ),
            ),
          AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            decoration: BoxDecoration(
              color: bgColor,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: borderColor,
                width: _isFocused ? 1.5 : 1,
              ),
              boxShadow: _isFocused && isDark
                  ? [
                      BoxShadow(
                        color: const Color(0xFFE53935).withOpacity(0.08),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      ),
                    ]
                  : _isFocused
                      ? [
                          BoxShadow(
                            color: colors.primary.withOpacity(0.12),
                            blurRadius: 12,
                            offset: const Offset(0, 4),
                          ),
                        ]
                      : null,
            ),
            child: Row(
              children: [
                if (widget.leftIcon != null)
                  Padding(
                    padding: const EdgeInsets.only(
                        left: Spacing.base, right: Spacing.sm),
                    child: Icon(
                      widget.leftIcon,
                      size: 20,
                      color: iconColor,
                    ),
                  ),
                Expanded(
                  child: TextField(
                    controller: widget.controller,
                    focusNode: _focusNode,
                    autofocus: widget.autofocus,
                    obscureText: widget.isPassword && _obscureText,
                    keyboardType: widget.multiline
                        ? TextInputType.multiline
                        : widget.keyboardType,
                    textInputAction: widget.textInputAction,
                    maxLines:
                        widget.multiline ? (widget.maxLines ?? 3) : 1,
                    onChanged: widget.onChanged,
                    onSubmitted: widget.onSubmitted != null
                        ? (_) => widget.onSubmitted!()
                        : null,
                    cursorColor:
                        isDark ? const Color(0xFFE53935) : colors.primary,
                    style: TextStyle(
                      fontSize: FontSizes.base,
                      color: textColor,
                      fontWeight: FontWeight.w400,
                    ),
                    decoration: InputDecoration(
                      hintText: widget.placeholder,
                      hintStyle: TextStyle(
                        color: hintColor,
                        fontWeight: FontWeight.w400,
                      ),
                      border: InputBorder.none,
                      contentPadding: EdgeInsets.only(
                        left: widget.leftIcon != null ? 0 : Spacing.base,
                        right: Spacing.base,
                        top: 16,
                        bottom: 16,
                      ),
                    ),
                  ),
                ),
                if (widget.isPassword)
                  GestureDetector(
                    onTap: () =>
                        setState(() => _obscureText = !_obscureText),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(
                          horizontal: Spacing.base),
                      child: Icon(
                        _obscureText
                            ? Icons.visibility_off_outlined
                            : Icons.visibility_outlined,
                        size: 20,
                        color: iconColor,
                      ),
                    ),
                  ),
                if (widget.rightIcon != null && !widget.isPassword)
                  GestureDetector(
                    onTap: widget.onRightIconPress,
                    child: Padding(
                      padding: const EdgeInsets.symmetric(
                          horizontal: Spacing.base),
                      child: Icon(
                        widget.rightIcon,
                        size: 20,
                        color: iconColor,
                      ),
                    ),
                  ),
              ],
            ),
          ),
          if (hasError)
            Padding(
              padding: const EdgeInsets.only(top: 6, left: 4),
              child: Row(
                children: [
                  Icon(Icons.error_outline, size: 14, color: colors.error),
                  const SizedBox(width: 4),
                  Text(
                    widget.error!,
                    style: TextStyle(
                        fontSize: FontSizes.xs, color: colors.error),
                  ),
                ],
              ),
            ),
          if (widget.hint != null && !hasError)
            Padding(
              padding: const EdgeInsets.only(top: 6, left: 4),
              child: Text(
                widget.hint!,
                style: TextStyle(
                  fontSize: FontSizes.xs,
                  color: isDark
                      ? Colors.white.withOpacity(0.35)
                      : colors.textMuted,
                  height: 1.3,
                ),
              ),
            ),
        ],
      ),
    );
  }
}
