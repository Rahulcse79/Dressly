// ══════════════════════════════════════════════════════════════
// Dressly — Wardrobe Screen (Flutter)
// ══════════════════════════════════════════════════════════════

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import '../../constants/constants.dart';
import '../../models/models.dart';
import '../../providers/theme_provider.dart';
import '../../services/api_service.dart';
import '../../widgets/widgets.dart';

// ── Wardrobe data provider ──────────────────────────────────

final wardrobeProvider =
    FutureProvider.autoDispose<List<WardrobeItem>>((ref) async {
  try {
    final response = await apiService.get(Endpoints.wardrobeList);
    return (response.data['data'] as List<dynamic>)
        .map((e) => WardrobeItem.fromJson(e as Map<String, dynamic>))
        .toList();
  } catch (_) {
    return [];
  }
});

class WardrobeScreen extends ConsumerStatefulWidget {
  const WardrobeScreen({super.key});

  @override
  ConsumerState<WardrobeScreen> createState() => _WardrobeScreenState();
}

class _WardrobeScreenState extends ConsumerState<WardrobeScreen> {
  String _selectedCategory = 'all';

  void _handleDeleteItem(String id) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Item'),
        content:
            const Text('Are you sure you want to remove this item?'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Cancel')),
          TextButton(
            onPressed: () async {
              Navigator.pop(ctx);
              try {
                await apiService.delete(Endpoints.wardrobeItem(id));
                ref.invalidate(wardrobeProvider);
              } catch (err) {
                if (mounted) {
                  final apiErr = extractApiError(err);
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text(apiErr.message)),
                  );
                }
              }
            },
            child: const Text('Delete',
                style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }

  Future<void> _handleAddItem() async {
    final picker = ImagePicker();
    final image = await picker.pickImage(
      source: ImageSource.gallery,
      maxWidth: 1024,
      imageQuality: 80,
    );
    if (image == null) return;

    // TODO: Upload image and create wardrobe item via API
    ref.invalidate(wardrobeProvider);
  }

  @override
  Widget build(BuildContext context) {
    final colors = ref.watch(themeProvider).colors;
    final itemsAsync = ref.watch(wardrobeProvider);

    final categories = ['all', ...categoryConfig.keys];

    return DresslyScreen(
      padding: true,
      child: Column(
        children: [
          const SizedBox(height: Spacing.md),

          // Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'My Wardrobe',
                style: TextStyle(
                  fontSize: FontSizes.xxl,
                  fontWeight: FontWeight.w800,
                  color: colors.text,
                ),
              ),
              GestureDetector(
                onTap: () => _showAddModal(context, ref),
                child: Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: colors.primary,
                    shape: BoxShape.circle,
                  ),
                  child:
                      const Icon(Icons.add, size: 24, color: Colors.white),
                ),
              ),
            ],
          ),
          const SizedBox(height: Spacing.base),

          // Category filters
          SizedBox(
            height: 40,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: categories.length,
              separatorBuilder: (_, __) =>
                  const SizedBox(width: Spacing.sm),
              itemBuilder: (context, index) {
                final cat = categories[index];
                final isActive = cat == _selectedCategory;
                final config =
                    cat == 'all' ? null : categoryConfig[cat];
                return GestureDetector(
                  onTap: () =>
                      setState(() => _selectedCategory = cat),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: Spacing.base, vertical: Spacing.sm),
                    decoration: BoxDecoration(
                      color: isActive ? colors.primary : colors.surface,
                      borderRadius:
                          BorderRadius.circular(AppRadius.full),
                      border: Border.all(
                        color:
                            isActive ? colors.primary : colors.border,
                      ),
                    ),
                    child: Text(
                      cat == 'all' ? '🗂 All' : config?.label ?? cat,
                      style: TextStyle(
                        fontSize: FontSizes.sm,
                        fontWeight: FontWeight.w600,
                        color: isActive
                            ? Colors.white
                            : colors.textSecondary,
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: Spacing.base),

          // Items grid
          Expanded(
            child: itemsAsync.when(
              data: (items) {
                final filtered = _selectedCategory == 'all'
                    ? items
                    : items
                        .where(
                            (i) => i.category.name == _selectedCategory)
                        .toList();

                if (filtered.isEmpty) {
                  return DresslyEmptyState(
                    icon: Icons.checkroom_outlined,
                    title: 'Your wardrobe is empty',
                    message:
                        'Add your first clothing item to get started with AI outfit generation',
                    actionTitle: 'Add Item',
                    onAction: () => _showAddModal(context, ref),
                  );
                }

                return GridView.builder(
                  gridDelegate:
                      const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    mainAxisSpacing: Spacing.md,
                    crossAxisSpacing: Spacing.md,
                    childAspectRatio: 0.7,
                  ),
                  itemCount: filtered.length,
                  itemBuilder: (context, index) {
                    final item = filtered[index];
                    final config = categoryConfig[item.category.name];
                    return Stack(
                      children: [
                        DresslyCard(
                          padding: 0,
                          child: Column(
                            crossAxisAlignment:
                                CrossAxisAlignment.start,
                            children: [
                              Expanded(
                                child: ClipRRect(
                                  borderRadius:
                                      const BorderRadius.only(
                                    topLeft: Radius.circular(
                                        AppRadius.lg),
                                    topRight: Radius.circular(
                                        AppRadius.lg),
                                  ),
                                  child: Image.network(
                                    item.imageUrl,
                                    width: double.infinity,
                                    fit: BoxFit.cover,
                                  ),
                                ),
                              ),
                              Padding(
                                padding:
                                    const EdgeInsets.all(Spacing.sm),
                                child: Column(
                                  crossAxisAlignment:
                                      CrossAxisAlignment.start,
                                  children: [
                                    Container(
                                      padding:
                                          const EdgeInsets.symmetric(
                                        horizontal: Spacing.sm,
                                        vertical: 2,
                                      ),
                                      decoration: BoxDecoration(
                                        color: (config?.color ??
                                                colors.primary)
                                            .withOpacity(0.15),
                                        borderRadius:
                                            BorderRadius.circular(
                                                AppRadius.sm),
                                      ),
                                      child: Text(
                                        config?.label ??
                                            item.category.name,
                                        style: TextStyle(
                                          fontSize: FontSizes.xs,
                                          fontWeight: FontWeight.w600,
                                          color: config?.color ??
                                              colors.primary,
                                        ),
                                      ),
                                    ),
                                    if (item.color != null) ...[
                                      const SizedBox(height: 4),
                                      Text(
                                        item.color!,
                                        style: TextStyle(
                                          fontSize: FontSizes.xs,
                                          color: colors.textSecondary,
                                        ),
                                        maxLines: 1,
                                        overflow:
                                            TextOverflow.ellipsis,
                                      ),
                                    ],
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                        Positioned(
                          top: Spacing.sm,
                          right: Spacing.sm,
                          child: GestureDetector(
                            onTap: () =>
                                _handleDeleteItem(item.id),
                            child: Container(
                              width: 28,
                              height: 28,
                              decoration: BoxDecoration(
                                color:
                                    colors.error.withOpacity(0.2),
                                shape: BoxShape.circle,
                              ),
                              child: Icon(Icons.delete_outline,
                                  size: 16, color: colors.error),
                            ),
                          ),
                        ),
                      ],
                    );
                  },
                );
              },
              loading: () =>
                  const DresslyLoading(message: 'Loading wardrobe...'),
              error: (_, __) => const DresslyEmptyState(
                title: 'Failed to load wardrobe',
                message: 'Please check your connection and try again',
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _showAddModal(BuildContext context, WidgetRef ref) {
    showDresslyModal(
      context: context,
      ref: ref,
      title: 'Add to Wardrobe',
      child: Column(
        children: [
          Text(
            'Category',
            style: TextStyle(
              fontSize: FontSizes.base,
              fontWeight: FontWeight.w600,
              color: ref.read(themeProvider).colors.text,
            ),
          ),
          const SizedBox(height: Spacing.md),
          Wrap(
            spacing: Spacing.sm,
            runSpacing: Spacing.sm,
            children: categoryConfig.entries.map((entry) {
              return GestureDetector(
                onTap: () {},
                child: Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: Spacing.md, vertical: Spacing.sm),
                  decoration: BoxDecoration(
                    color: ref.read(themeProvider).colors.surface,
                    borderRadius: BorderRadius.circular(AppRadius.md),
                    border: Border.all(
                        color: ref.read(themeProvider).colors.border),
                  ),
                  child: Text(
                    entry.value.label,
                    style: TextStyle(
                      fontSize: FontSizes.sm,
                      fontWeight: FontWeight.w600,
                      color: ref.read(themeProvider).colors.text,
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: Spacing.lg),
          DresslyButton(
            title: 'Take Photo / Choose from Gallery',
            onPressed: () {
              Navigator.pop(context);
              _handleAddItem();
            },
            fullWidth: true,
            size: ButtonSize.lg,
            icon: const Icon(Icons.camera_alt, size: 20, color: Colors.white),
          ),
        ],
      ),
    );
  }
}
