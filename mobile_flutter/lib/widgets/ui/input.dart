// ══════════════════════════════════════════════════════════════
// Dressly — Input Widget (Flutter)
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
    final hasError = widget.error != null && widget.error!.isNotEmpty;

    return Padding(
      padding: const EdgeInsets.only(bottom: Spacing.base),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (widget.label != null)
            Padding(
              padding: const EdgeInsets.only(bottom: Spacing.xs),
              child: Text(
                widget.label!,
                style: TextStyle(
                  fontSize: FontSizes.sm,
                  fontWeight: FontWeight.w600,
                  color: colors.text,
                ),
              ),
            ),
          AnimatedContainer(
            duration: AppAnimation.fast,
            decoration: BoxDecoration(
              color: colors.surface,
              borderRadius: BorderRadius.circular(AppRadius.md),
              border: Border.all(
                color: hasError
                    ? colors.error
                    : _isFocused
                        ? colors.borderFocused
                        : colors.border,
                width: _isFocused ? 2 : 1,
              ),
            ),
            child: Row(
              children: [
                if (widget.leftIcon != null)
                  Padding(
                    padding: const EdgeInsets.only(
                        left: Spacing.md, right: Spacing.sm),
                    child: Icon(
                      widget.leftIcon,
                      size: 20,
                      color:
                          _isFocused ? colors.primary : colors.textMuted,
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
                    style: TextStyle(
                      fontSize: FontSizes.base,
                      color: colors.text,
                    ),
                    decoration: InputDecoration(
                      hintText: widget.placeholder,
                      hintStyle: TextStyle(color: colors.textMuted),
                      border: InputBorder.none,
                      contentPadding: EdgeInsets.only(
                        left: widget.leftIcon != null ? 0 : Spacing.base,
                        right: Spacing.base,
                        top: Spacing.md,
                        bottom: Spacing.md,
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
                          horizontal: Spacing.md),
                      child: Icon(
                        _obscureText
                            ? Icons.visibility_off_outlined
                            : Icons.visibility_outlined,
                        size: 20,
                        color: colors.textMuted,
                      ),
                    ),
                  ),
                if (widget.rightIcon != null && !widget.isPassword)
                  GestureDetector(
                    onTap: widget.onRightIconPress,
                    child: Padding(
                      padding: const EdgeInsets.symmetric(
                          horizontal: Spacing.md),
                      child: Icon(
                        widget.rightIcon,
                        size: 20,
                        color: colors.textMuted,
                      ),
                    ),
                  ),
              ],
            ),
          ),
          if (hasError)
            Padding(
              padding: const EdgeInsets.only(top: Spacing.xs),
              child: Text(
                widget.error!,
                style: TextStyle(
                    fontSize: FontSizes.xs, color: colors.error),
              ),
            ),
          if (widget.hint != null && !hasError)
            Padding(
              padding: const EdgeInsets.only(top: Spacing.xs),
              child: Text(
                widget.hint!,
                style: TextStyle(
                    fontSize: FontSizes.xs, color: colors.textMuted),
              ),
            ),
        ],
      ),
    );
  }
}
