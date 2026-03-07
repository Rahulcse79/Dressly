// ══════════════════════════════════════════════════════════════
// Dressly — Admin Screen (Flutter)
// ══════════════════════════════════════════════════════════════

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../constants/constants.dart';
import '../../models/models.dart';
import '../../providers/theme_provider.dart';
import '../../services/api_service.dart';
import '../../widgets/widgets.dart';

// ── Providers ───────────────────────────────────────────────

final adminAnalyticsProvider =
    FutureProvider.autoDispose<AdminAnalytics?>((ref) async {
  try {
    final resp = await apiService.get(Endpoints.adminAnalytics);
    return AdminAnalytics.fromJson(
        resp.data['data'] as Map<String, dynamic>);
  } catch (_) {
    return null;
  }
});

final adminConfigProvider =
    FutureProvider.autoDispose<AdminConfig?>((ref) async {
  try {
    final resp = await apiService.get(Endpoints.adminConfig);
    return AdminConfig.fromJson(
        resp.data['data'] as Map<String, dynamic>);
  } catch (_) {
    return null;
  }
});

class AdminScreen extends ConsumerStatefulWidget {
  const AdminScreen({super.key});

  @override
  ConsumerState<AdminScreen> createState() => _AdminScreenState();
}

class _AdminScreenState extends ConsumerState<AdminScreen> {
  bool _isSavingConfig = false;

  // Inline edit state
  String? _editingField;
  final _editController = TextEditingController();

  @override
  void dispose() {
    _editController.dispose();
    super.dispose();
  }

  Future<void> _saveConfig(String field, String value) async {
    setState(() => _isSavingConfig = true);
    try {
      await apiService.put(
        Endpoints.adminConfig,
        data: {field: _parseConfigValue(value)},
      );
      ref.invalidate(adminConfigProvider);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content: Text('Config updated'),
              backgroundColor: Colors.green),
        );
      }
    } catch (err) {
      final apiErr = extractApiError(err);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text(apiErr.message),
              backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isSavingConfig = false;
          _editingField = null;
        });
      }
    }
  }

  dynamic _parseConfigValue(String value) {
    if (value == 'true') return true;
    if (value == 'false') return false;
    final asInt = int.tryParse(value);
    if (asInt != null) return asInt;
    final asDouble = double.tryParse(value);
    if (asDouble != null) return asDouble;
    return value;
  }

  @override
  Widget build(BuildContext context) {
    final colors = ref.watch(themeProvider).colors;
    final analyticsAsync = ref.watch(adminAnalyticsProvider);
    final configAsync = ref.watch(adminConfigProvider);

    return Scaffold(
      backgroundColor: colors.background,
      appBar: AppBar(
        backgroundColor: colors.card,
        foregroundColor: colors.text,
        title: Text('Admin Panel',
            style: TextStyle(
                fontWeight: FontWeight.w800, color: colors.text)),
        elevation: 0.5,
      ),
      body: RefreshIndicator(
        color: colors.primary,
        onRefresh: () async {
          ref.invalidate(adminAnalyticsProvider);
          ref.invalidate(adminConfigProvider);
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(Spacing.base),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // ── Analytics ─────────────────────────────────
              Text(
                'Analytics',
                style: TextStyle(
                  fontSize: FontSizes.lg,
                  fontWeight: FontWeight.w700,
                  color: colors.text,
                ),
              ),
              const SizedBox(height: Spacing.md),
              analyticsAsync.when(
                data: (analytics) => analytics == null
                    ? const DresslyEmptyState(
                        icon: Icons.error_outline,
                        title: 'Failed to load',
                        message: 'Pull to refresh',
                      )
                    : GridView.count(
                        crossAxisCount: 2,
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        mainAxisSpacing: Spacing.md,
                        crossAxisSpacing: Spacing.md,
                        childAspectRatio: 1.6,
                        children: [
                          _StatCard(
                            label: 'Total Users',
                            value: analytics.totalUsers.toString(),
                            icon: Icons.people,
                            color: colors.primary,
                            colors: colors,
                          ),
                          _StatCard(
                            label: 'Active Subscriptions',
                            value:
                                analytics.activeSubscriptions.toString(),
                            icon: Icons.card_membership,
                            color: colors.success,
                            colors: colors,
                          ),
                          _StatCard(
                            label: 'Total Generations',
                            value:
                                analytics.totalGenerations.toString(),
                            icon: Icons.auto_awesome,
                            color: colors.warning,
                            colors: colors,
                          ),
                          _StatCard(
                            label: 'Revenue (₹)',
                            value: analytics.totalRevenue
                                .toStringAsFixed(0),
                            icon: Icons.currency_rupee,
                            color: colors.error,
                            colors: colors,
                          ),
                        ],
                      ),
                loading: () =>
                    const DresslyLoading(message: 'Loading analytics…'),
                error: (_, __) => const DresslyEmptyState(
                  icon: Icons.error_outline,
                  title: 'Error',
                  message: 'Pull to refresh',
                ),
              ),

              const SizedBox(height: Spacing.xl),

              // ── Configuration ──────────────────────────────
              Text(
                'Configuration',
                style: TextStyle(
                  fontSize: FontSizes.lg,
                  fontWeight: FontWeight.w700,
                  color: colors.text,
                ),
              ),
              const SizedBox(height: Spacing.md),
              configAsync.when(
                data: (config) => config == null
                    ? const DresslyEmptyState(
                        icon: Icons.error_outline,
                        title: 'Failed to load config',
                        message: 'Pull to refresh',
                      )
                    : Column(
                        children: _buildConfigRows(config, colors),
                      ),
                loading: () =>
                    const DresslyLoading(message: 'Loading config…'),
                error: (_, __) => const DresslyEmptyState(
                  icon: Icons.error_outline,
                  title: 'Error',
                  message: 'Pull to refresh',
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  List<Widget> _buildConfigRows(AdminConfig config, AppColors colors) {
    final fields = {
      'max_daily_generations': config.maxDailyGenerations.toString(),
      'max_wardrobe_items': config.maxWardrobeItems.toString(),
      'subscription_price': config.subscriptionPrice.toString(),
      'maintenance_mode': config.maintenanceMode.toString(),
    };

    return fields.entries.map((entry) {
      final isEditing = _editingField == entry.key;
      return Container(
        margin: const EdgeInsets.only(bottom: Spacing.sm),
        padding: const EdgeInsets.symmetric(
            horizontal: Spacing.base, vertical: Spacing.md),
        decoration: BoxDecoration(
          color: colors.card,
          borderRadius: BorderRadius.circular(AppRadius.md),
          border: Border.all(color: colors.border),
        ),
        child: Row(
          children: [
            Expanded(
              flex: 2,
              child: Text(
                entry.key.replaceAll('_', ' ').toUpperCase(),
                style: TextStyle(
                  fontSize: FontSizes.xs,
                  fontWeight: FontWeight.w700,
                  color: colors.textMuted,
                  letterSpacing: 0.8,
                ),
              ),
            ),
            const SizedBox(width: Spacing.md),
            Expanded(
              flex: 2,
              child: isEditing
                  ? TextField(
                      controller: _editController,
                      autofocus: true,
                      style: TextStyle(
                          fontSize: FontSizes.base, color: colors.text),
                      decoration: InputDecoration(
                        isDense: true,
                        contentPadding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 6),
                        border: OutlineInputBorder(
                          borderRadius:
                              BorderRadius.circular(AppRadius.sm),
                          borderSide:
                              BorderSide(color: colors.primary),
                        ),
                      ),
                      onSubmitted: (val) =>
                          _saveConfig(entry.key, val),
                    )
                  : Text(
                      entry.value,
                      style: TextStyle(
                        fontSize: FontSizes.base,
                        fontWeight: FontWeight.w600,
                        color: colors.text,
                      ),
                      textAlign: TextAlign.right,
                    ),
            ),
            const SizedBox(width: Spacing.sm),
            if (isEditing)
              _isSavingConfig
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        GestureDetector(
                          onTap: () =>
                              _saveConfig(entry.key, _editController.text),
                          child: Icon(Icons.check,
                              size: 20, color: colors.success),
                        ),
                        const SizedBox(width: Spacing.sm),
                        GestureDetector(
                          onTap: () =>
                              setState(() => _editingField = null),
                          child: Icon(Icons.close,
                              size: 20, color: colors.error),
                        ),
                      ],
                    )
            else
              GestureDetector(
                onTap: () {
                  setState(() {
                    _editingField = entry.key;
                    _editController.text = entry.value;
                  });
                },
                child: Icon(Icons.edit,
                    size: 18, color: colors.textMuted),
              ),
          ],
        ),
      );
    }).toList();
  }
}

// ── Stat Card ───────────────────────────────────────────────

class _StatCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color color;
  final AppColors colors;

  const _StatCard({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
    required this.colors,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(Spacing.base),
      decoration: BoxDecoration(
        color: colors.card,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: colors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Icon(icon, size: 22, color: color),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                value,
                style: TextStyle(
                  fontSize: FontSizes.xl,
                  fontWeight: FontWeight.w800,
                  color: colors.text,
                ),
              ),
              Text(
                label,
                style: TextStyle(
                  fontSize: FontSizes.xs,
                  color: colors.textSecondary,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
