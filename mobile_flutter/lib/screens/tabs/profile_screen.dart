// ══════════════════════════════════════════════════════════════
// Dressly — Profile Screen (Flutter)
// ══════════════════════════════════════════════════════════════

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../constants/constants.dart';
import '../../models/models.dart' as models;
import '../../providers/auth_provider.dart';
import '../../providers/theme_provider.dart';
import '../../services/api_service.dart';
import '../../widgets/widgets.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final themeState = ref.watch(themeProvider);
    final colors = themeState.colors;
    final user = authState.user;

    return DresslyScreen(
      scrollable: true,
      child: Column(
        children: [
          const SizedBox(height: Spacing.lg),

          // Avatar + Name
          CircleAvatar(
            radius: 48,
            backgroundColor: colors.primary.withOpacity(0.12),
            backgroundImage: user?.avatarUrl != null
                ? NetworkImage(user!.avatarUrl!)
                : null,
            child: user?.avatarUrl == null
                ? Text(
                    _initials(user?.name),
                    style: TextStyle(
                      fontSize: FontSizes.xxl,
                      fontWeight: FontWeight.w800,
                      color: colors.primary,
                    ),
                  )
                : null,
          ),
          const SizedBox(height: Spacing.md),
          Text(
            user?.name ?? 'Dressly User',
            style: TextStyle(
              fontSize: FontSizes.xl,
              fontWeight: FontWeight.w700,
              color: colors.text,
            ),
          ),
          const SizedBox(height: Spacing.xs),
          Text(
            user?.email ?? '',
            style: TextStyle(
              fontSize: FontSizes.sm,
              color: colors.textSecondary,
            ),
          ),

          // Subscription badge
          if (user?.subscriptionTier != null &&
              user!.subscriptionTier != 'free') ...[
            const SizedBox(height: Spacing.sm),
            Container(
              padding: const EdgeInsets.symmetric(
                  horizontal: Spacing.md, vertical: Spacing.xs),
              decoration: BoxDecoration(
                color: colors.warning.withOpacity(0.15),
                borderRadius: BorderRadius.circular(AppRadius.full),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.star, size: 14, color: colors.warning),
                  const SizedBox(width: 4),
                  Text(
                    user.subscriptionTier!.toUpperCase(),
                    style: TextStyle(
                      fontSize: FontSizes.xs,
                      fontWeight: FontWeight.w800,
                      color: colors.warning,
                    ),
                  ),
                ],
              ),
            ),
          ],
          const SizedBox(height: Spacing.xxl),

          // Settings section
          _SectionHeader(title: 'Settings', colors: colors),
          _MenuRow(
            icon: Icons.palette,
            label: 'Theme',
            trailing: Text(
              _themeLabel(themeState.mode),
              style: TextStyle(
                fontSize: FontSizes.sm,
                color: colors.textSecondary,
              ),
            ),
            colors: colors,
            onTap: () => _showThemeModal(context, ref),
          ),
          _MenuRow(
            icon: Icons.notifications_outlined,
            label: 'Notification Preferences',
            colors: colors,
            onTap: () {},
          ),

          const SizedBox(height: Spacing.lg),

          // Account section
          _SectionHeader(title: 'Account', colors: colors),
          if (user?.role == models.UserRole.admin)
            _MenuRow(
              icon: Icons.admin_panel_settings,
              label: 'Admin Panel',
              colors: colors,
              onTap: () => context.push('/admin'),
            ),
          _MenuRow(
            icon: Icons.card_membership,
            label: 'Manage Subscription',
            colors: colors,
            onTap: () {},
          ),
          _MenuRow(
            icon: Icons.help_outline,
            label: 'Help & Support',
            colors: colors,
            onTap: () {},
          ),

          const SizedBox(height: Spacing.lg),

          // Logout
          DresslyButton(
            title: 'Sign Out',
            onPressed: () async {
              await ref.read(authProvider.notifier).logout();
            },
            variant: ButtonVariant.outline,
            fullWidth: true,
            icon: Icon(Icons.logout),
          ),

          const SizedBox(height: Spacing.md),

          // Delete account
          DresslyButton(
            title: 'Delete Account',
            onPressed: () => _confirmDelete(context, ref),
            variant: ButtonVariant.ghost,
            fullWidth: true,
            icon: Icon(Icons.delete_outline),
          ),

          const SizedBox(height: Spacing.xxxl),
        ],
      ),
    );
  }

  String _initials(String? name) {
    if (name == null || name.isEmpty) return '?';
    final parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    }
    return parts[0][0].toUpperCase();
  }

  String _themeLabel(models.ThemeMode mode) {
    switch (mode) {
      case models.ThemeMode.light:
        return 'Light';
      case models.ThemeMode.dark:
        return 'Dark';
      case models.ThemeMode.system:
        return 'System';
    }
  }

  void _showThemeModal(BuildContext context, WidgetRef ref) {
    final themeState = ref.read(themeProvider);
    final colors = themeState.colors;

    showDresslyModal(
      context: context,
      title: 'Choose Theme',
      size: ModalSize.sm,
      colors: colors,
      child: Column(
        children: [
          for (final mode in models.ThemeMode.values)
            ListTile(
              leading: Icon(
                mode == models.ThemeMode.light
                    ? Icons.light_mode
                    : mode == models.ThemeMode.dark
                        ? Icons.dark_mode
                        : Icons.settings_brightness,
                color: themeState.mode == mode
                    ? colors.primary
                    : colors.textSecondary,
              ),
              title: Text(
                mode == models.ThemeMode.light
                    ? 'Light'
                    : mode == models.ThemeMode.dark
                        ? 'Dark'
                        : 'System',
                style: TextStyle(
                  fontWeight: themeState.mode == mode
                      ? FontWeight.w700
                      : FontWeight.w500,
                  color: colors.text,
                ),
              ),
              trailing: themeState.mode == mode
                  ? Icon(Icons.check_circle, color: colors.primary)
                  : null,
              onTap: () {
                ref.read(themeProvider.notifier).setMode(mode);
                Navigator.pop(context);
              },
            ),
        ],
      ),
    );
  }

  void _confirmDelete(BuildContext context, WidgetRef ref) {
    final colors = ref.read(themeProvider).colors;
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: colors.card,
        title: Text('Delete Account?',
            style: TextStyle(color: colors.text)),
        content: Text(
          'This action is irreversible. All your data including wardrobe items, generations, and subscription will be permanently deleted.',
          style: TextStyle(color: colors.textSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text('Cancel',
                style: TextStyle(color: colors.textSecondary)),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(ctx);
              try {
                await apiService.delete(Endpoints.deleteMe);
                ref.read(authProvider.notifier).logout();
              } catch (_) {}
            },
            child:
                Text('Delete', style: TextStyle(color: colors.error)),
          ),
        ],
      ),
    );
  }
}

// ── Section Header ──────────────────────────────────────────

class _SectionHeader extends StatelessWidget {
  final String title;
  final AppColors colors;

  const _SectionHeader({required this.title, required this.colors});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: Spacing.sm),
      child: Align(
        alignment: Alignment.centerLeft,
        child: Text(
          title.toUpperCase(),
          style: TextStyle(
            fontSize: FontSizes.xs,
            fontWeight: FontWeight.w700,
            color: colors.textMuted,
            letterSpacing: 1.2,
          ),
        ),
      ),
    );
  }
}

// ── Menu Row ────────────────────────────────────────────────

class _MenuRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final Widget? trailing;
  final AppColors colors;
  final VoidCallback onTap;

  const _MenuRow({
    required this.icon,
    required this.label,
    this.trailing,
    required this.colors,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(AppRadius.md),
      child: Padding(
        padding: const EdgeInsets.symmetric(
            horizontal: Spacing.base, vertical: Spacing.md),
        child: Row(
          children: [
            Icon(icon, size: 22, color: colors.textSecondary),
            const SizedBox(width: Spacing.md),
            Expanded(
              child: Text(
                label,
                style: TextStyle(
                  fontSize: FontSizes.base,
                  fontWeight: FontWeight.w500,
                  color: colors.text,
                ),
              ),
            ),
            if (trailing != null) trailing!,
            const SizedBox(width: Spacing.sm),
            Icon(Icons.chevron_right,
                size: 20, color: colors.textMuted),
          ],
        ),
      ),
    );
  }
}
