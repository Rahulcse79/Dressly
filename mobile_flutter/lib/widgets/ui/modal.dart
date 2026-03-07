// ══════════════════════════════════════════════════════════════
// Dressly — Modal Widget (Flutter)
// ══════════════════════════════════════════════════════════════

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../constants/constants.dart';
import '../../providers/theme_provider.dart';

enum ModalSize { sm, md, lg, full }

Future<T?> showDresslyModal<T>({
  required BuildContext context,
  WidgetRef? ref,
  AppColors? colors,
  String? title,
  required Widget child,
  bool showCloseButton = true,
  ModalSize size = ModalSize.md,
}) {
  final resolvedColors =
      colors ?? ref!.read(themeProvider).colors;

  double maxHeightFactor;
  switch (size) {
    case ModalSize.sm:
      maxHeightFactor = 0.4;
    case ModalSize.lg:
      maxHeightFactor = 0.85;
    case ModalSize.full:
      maxHeightFactor = 0.95;
    case ModalSize.md:
      maxHeightFactor = 0.65;
  }

  return showModalBottomSheet<T>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (context) => Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * maxHeightFactor,
      ),
      decoration: BoxDecoration(
        color: resolvedColors.surfaceElevated,
        borderRadius: const BorderRadius.only(
          topLeft: Radius.circular(AppRadius.xl),
          topRight: Radius.circular(AppRadius.xl),
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Header
          if (title != null || showCloseButton)
            Container(
              padding: const EdgeInsets.only(
                left: Spacing.lg,
                right: Spacing.lg,
                top: Spacing.lg,
                bottom: Spacing.md,
              ),
              decoration: BoxDecoration(
                border: Border(
                  bottom: BorderSide(
                    color: resolvedColors.border.withOpacity(0.2),
                    width: 0.5,
                  ),
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      title ?? '',
                      style: TextStyle(
                        fontSize: FontSizes.lg,
                        fontWeight: FontWeight.w700,
                        color: resolvedColors.text,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  if (showCloseButton)
                    GestureDetector(
                      onTap: () => Navigator.of(context).pop(),
                      child: Icon(
                        Icons.close,
                        size: 24,
                        color: resolvedColors.textMuted,
                      ),
                    ),
                ],
              ),
            ),
          // Body
          Flexible(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(Spacing.lg),
              child: child,
            ),
          ),
          const SizedBox(height: Spacing.xxl),
        ],
      ),
    ),
  );
}
