// ══════════════════════════════════════════════════════════════
// Dressly — Home Screen (Dashboard) — Flutter
// ══════════════════════════════════════════════════════════════

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../constants/constants.dart';
import '../../models/models.dart';
import '../../providers/auth_provider.dart';
import '../../providers/theme_provider.dart';
import '../../services/api_service.dart';
import '../../widgets/widgets.dart';

// ── Providers for data fetching ─────────────────────────────

final aiQuotaProvider = FutureProvider<AiQuota?>((ref) async {
  try {
    final response = await apiService.get(Endpoints.aiQuota);
    return AiQuota.fromJson(response.data['data'] as Map<String, dynamic>);
  } catch (_) {
    return null;
  }
});

final recentGenerationsProvider =
    FutureProvider<List<OutfitGeneration>>((ref) async {
  try {
    final response = await apiService.get(
      Endpoints.aiList,
      queryParameters: {'page': 1, 'per_page': 6},
    );
    return (response.data['data'] as List<dynamic>)
        .map((e) => OutfitGeneration.fromJson(e as Map<String, dynamic>))
        .toList();
  } catch (_) {
    return [];
  }
});

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  String _greeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = ref.watch(themeProvider).colors;
    final user = ref.watch(authProvider).user;
    final quotaAsync = ref.watch(aiQuotaProvider);
    final generationsAsync = ref.watch(recentGenerationsProvider);

    return DresslyScreen(
      scrollable: true,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: Spacing.md),

          // ── Header ────────────────────────────────────────
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${_greeting()} 👋',
                    style: TextStyle(
                      fontSize: FontSizes.md,
                      color: colors.textSecondary,
                    ),
                  ),
                  Text(
                    user?.displayName ?? 'Fashionista',
                    style: TextStyle(
                      fontSize: FontSizes.xxl,
                      fontWeight: FontWeight.w800,
                      color: colors.text,
                    ),
                  ),
                ],
              ),
              GestureDetector(
                onTap: () => context.go('/tabs/profile'),
                child: Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: colors.primary.withOpacity(0.12),
                    shape: BoxShape.circle,
                  ),
                  child: user?.avatarUrl != null
                      ? ClipOval(
                          child: Image.network(
                            user!.avatarUrl!,
                            width: 48,
                            height: 48,
                            fit: BoxFit.cover,
                          ),
                        )
                      : Icon(Icons.person, size: 24, color: colors.primary),
                ),
              ),
            ],
          ),
          const SizedBox(height: Spacing.xl),

          // ── Quick Actions ─────────────────────────────────
          Row(
            children: [
              Expanded(
                child: DresslyCard(
                  onTap: () => context.go('/tabs/generate'),
                  elevated: true,
                  decoration: BoxDecoration(
                    color: colors.primary,
                    borderRadius: BorderRadius.circular(AppRadius.lg),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(Icons.auto_awesome,
                          size: 28, color: Colors.white),
                      const SizedBox(height: Spacing.sm),
                      const Text(
                        'Generate Outfit',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: FontSizes.base,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      Text(
                        'AI-powered style advice',
                        style: TextStyle(
                          color: Colors.white.withOpacity(0.8),
                          fontSize: FontSizes.xs,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: Spacing.md),
              Expanded(
                child: DresslyCard(
                  onTap: () => context.go('/tabs/wardrobe'),
                  elevated: true,
                  decoration: BoxDecoration(
                    color: colors.secondary,
                    borderRadius: BorderRadius.circular(AppRadius.lg),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(Icons.checkroom,
                          size: 28, color: Colors.white),
                      const SizedBox(height: Spacing.sm),
                      const Text(
                        'My Wardrobe',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: FontSizes.base,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      Text(
                        'Manage your clothes',
                        style: TextStyle(
                          color: Colors.white.withOpacity(0.8),
                          fontSize: FontSizes.xs,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: Spacing.xl),

          // ── AI Quota Card ─────────────────────────────────
          quotaAsync.when(
            data: (quota) {
              if (quota == null) return const SizedBox.shrink();
              final pct = quota.dailyLimit > 0
                  ? (quota.usedToday / quota.dailyLimit).clamp(0.0, 1.0)
                  : 0.0;
              return DresslyCard(
                elevated: true,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          "Today's AI Quota",
                          style: TextStyle(
                            fontSize: FontSizes.base,
                            fontWeight: FontWeight.w600,
                            color: colors.text,
                          ),
                        ),
                        if (quota.isPro)
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: Spacing.sm, vertical: 2),
                            decoration: BoxDecoration(
                              color: colors.accent.withOpacity(0.12),
                              borderRadius:
                                  BorderRadius.circular(AppRadius.full),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.diamond,
                                    size: 12, color: colors.accent),
                                const SizedBox(width: 4),
                                Text(
                                  'PRO',
                                  style: TextStyle(
                                    fontSize: FontSizes.xs,
                                    fontWeight: FontWeight.w700,
                                    color: colors.accent,
                                  ),
                                ),
                              ],
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: Spacing.sm),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: LinearProgressIndicator(
                        value: pct,
                        backgroundColor: colors.border,
                        color: colors.primary,
                        minHeight: 6,
                      ),
                    ),
                    const SizedBox(height: Spacing.sm),
                    Text(
                      '${quota.remaining} of ${quota.dailyLimit} generations remaining',
                      style: TextStyle(
                        fontSize: FontSizes.sm,
                        color: colors.textSecondary,
                      ),
                    ),
                  ],
                ),
              );
            },
            loading: () => const DresslyLoading(),
            error: (_, __) => const SizedBox.shrink(),
          ),
          const SizedBox(height: Spacing.xl),

          // ── Recent Generations ─────────────────────────────
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Recent Styles',
                style: TextStyle(
                  fontSize: FontSizes.lg,
                  fontWeight: FontWeight.w700,
                  color: colors.text,
                ),
              ),
              GestureDetector(
                onTap: () => context.go('/tabs/generate'),
                child: Text(
                  'See All',
                  style: TextStyle(
                    fontSize: FontSizes.md,
                    fontWeight: FontWeight.w600,
                    color: colors.primary,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: Spacing.md),

          generationsAsync.when(
            data: (generations) {
              if (generations.isEmpty) {
                return DresslyCard(
                  child: Row(
                    children: [
                      Icon(Icons.auto_awesome_outlined,
                          size: 32, color: colors.textMuted),
                      const SizedBox(width: Spacing.md),
                      Expanded(
                        child: Text(
                          'No styles generated yet. Tap "Generate Outfit" to get started!',
                          style: TextStyle(
                            fontSize: FontSizes.sm,
                            color: colors.textSecondary,
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              }
              return SizedBox(
                height: 180,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: generations.length,
                  separatorBuilder: (_, __) =>
                      const SizedBox(width: Spacing.md),
                  itemBuilder: (context, index) {
                    final item = generations[index];
                    return GestureDetector(
                      onTap: () =>
                          context.go('/tabs/generate?id=${item.id}'),
                      child: SizedBox(
                        width: 140,
                        child: DresslyCard(
                          padding: 0,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              if (item.outputImageUrl != null)
                                ClipRRect(
                                  borderRadius: const BorderRadius.only(
                                    topLeft:
                                        Radius.circular(AppRadius.lg),
                                    topRight:
                                        Radius.circular(AppRadius.lg),
                                  ),
                                  child: Image.network(
                                    item.outputImageUrl!,
                                    width: 140,
                                    height: 120,
                                    fit: BoxFit.cover,
                                  ),
                                )
                              else
                                Container(
                                  width: 140,
                                  height: 120,
                                  decoration: BoxDecoration(
                                    color: colors.surface,
                                    borderRadius:
                                        const BorderRadius.only(
                                      topLeft: Radius.circular(
                                          AppRadius.lg),
                                      topRight: Radius.circular(
                                          AppRadius.lg),
                                    ),
                                  ),
                                  child: Icon(Icons.image_outlined,
                                      size: 32,
                                      color: colors.textMuted),
                                ),
                              Padding(
                                padding:
                                    const EdgeInsets.all(Spacing.sm),
                                child: Column(
                                  crossAxisAlignment:
                                      CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      item.occasion ?? 'Outfit',
                                      style: TextStyle(
                                        fontSize: FontSizes.sm,
                                        fontWeight: FontWeight.w600,
                                        color: colors.text,
                                      ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                    if (item.styleScore != null)
                                      Row(
                                        children: [
                                          Icon(Icons.star,
                                              size: 12,
                                              color: colors.warning),
                                          const SizedBox(width: 2),
                                          Text(
                                            item.styleScore!
                                                .toStringAsFixed(1),
                                            style: TextStyle(
                                              fontSize: FontSizes.xs,
                                              color:
                                                  colors.textSecondary,
                                            ),
                                          ),
                                        ],
                                      ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    );
                  },
                ),
              );
            },
            loading: () => const DresslyLoading(),
            error: (_, __) => const SizedBox.shrink(),
          ),

          const SizedBox(height: Spacing.xxxl),
        ],
      ),
    );
  }
}
