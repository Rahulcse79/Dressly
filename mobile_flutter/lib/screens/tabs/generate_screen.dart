// ══════════════════════════════════════════════════════════════
// Dressly — AI Generate Screen (Flutter)
// ══════════════════════════════════════════════════════════════

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import '../../constants/constants.dart';
import '../../models/models.dart';
import '../../providers/theme_provider.dart';
import '../../services/api_service.dart';
import '../../widgets/widgets.dart';
import 'home_screen.dart';

class GenerateScreen extends ConsumerStatefulWidget {
  const GenerateScreen({super.key});

  @override
  ConsumerState<GenerateScreen> createState() => _GenerateScreenState();
}

class _GenerateScreenState extends ConsumerState<GenerateScreen> {
  final _promptController = TextEditingController();
  String? _selectedOccasion;
  final List<XFile> _selectedImages = [];
  OutfitGeneration? _result;
  bool _isGenerating = false;

  @override
  void dispose() {
    _promptController.dispose();
    super.dispose();
  }

  Future<void> _handleGenerate() async {
    final prompt = _promptController.text.trim();
    if (prompt.isEmpty) {
      _showError('Please describe what outfit you want');
      return;
    }

    final quota = ref.read(aiQuotaProvider).value;
    if (quota != null && quota.remaining <= 0) {
      _showError(
          "You've used all your daily generations. Upgrade to Pro for more!");
      return;
    }

    setState(() => _isGenerating = true);
    try {
      final response = await apiService.post(
        Endpoints.aiGenerate,
        data: {
          'prompt': prompt,
          if (_selectedOccasion != null) 'occasion': _selectedOccasion,
        },
      );
      final generation = OutfitGeneration.fromJson(
          response.data['data'] as Map<String, dynamic>);
      setState(() => _result = generation);
      ref.invalidate(aiQuotaProvider);
      ref.invalidate(recentGenerationsProvider);
    } catch (err) {
      final apiErr = extractApiError(err);
      if (mounted) _showError(apiErr.message);
    } finally {
      if (mounted) setState(() => _isGenerating = false);
    }
  }

  Future<void> _handleAddImages() async {
    final picker = ImagePicker();
    final images = await picker.pickMultiImage(
      maxWidth: 1024,
      imageQuality: 80,
    );
    if (images.isNotEmpty) {
      setState(() {
        _selectedImages.addAll(images);
        if (_selectedImages.length > Limits.maxGenerationImages) {
          _selectedImages.removeRange(
              Limits.maxGenerationImages, _selectedImages.length);
        }
      });
    }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: Colors.red),
    );
  }

  @override
  Widget build(BuildContext context) {
    final colors = ref.watch(themeProvider).colors;
    final quotaAsync = ref.watch(aiQuotaProvider);

    return DresslyScreen(
      scrollable: true,
      keyboardAvoiding: true,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: Spacing.md),

          // Header
          Text(
            'AI Style Generator ✨',
            style: TextStyle(
              fontSize: FontSizes.xxl,
              fontWeight: FontWeight.w800,
              color: colors.text,
            ),
          ),
          quotaAsync.when(
            data: (quota) => quota != null
                ? Padding(
                    padding: const EdgeInsets.only(top: Spacing.xs),
                    child: Text(
                      '${quota.remaining}/${quota.dailyLimit} left today',
                      style: TextStyle(
                        fontSize: FontSizes.sm,
                        color: colors.textSecondary,
                      ),
                    ),
                  )
                : const SizedBox.shrink(),
            loading: () => const SizedBox.shrink(),
            error: (_, __) => const SizedBox.shrink(),
          ),
          const SizedBox(height: Spacing.lg),

          // Prompt
          DresslyInput(
            label: 'Describe your ideal outfit',
            placeholder: 'e.g., Smart casual for a summer dinner date',
            controller: _promptController,
            multiline: true,
            maxLines: 3,
          ),

          // Occasion selector
          Text(
            'Occasion (optional)',
            style: TextStyle(
              fontSize: FontSizes.base,
              fontWeight: FontWeight.w600,
              color: colors.text,
            ),
          ),
          const SizedBox(height: Spacing.sm),
          SizedBox(
            height: 40,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: occasions.length,
              separatorBuilder: (_, __) =>
                  const SizedBox(width: Spacing.sm),
              itemBuilder: (context, index) {
                final occ = occasions[index];
                final isSelected = occ == _selectedOccasion;
                return GestureDetector(
                  onTap: () => setState(() =>
                      _selectedOccasion = isSelected ? null : occ),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: Spacing.base, vertical: Spacing.sm),
                    decoration: BoxDecoration(
                      color: isSelected ? colors.primary : colors.surface,
                      borderRadius:
                          BorderRadius.circular(AppRadius.full),
                      border: Border.all(
                        color:
                            isSelected ? colors.primary : colors.border,
                      ),
                    ),
                    child: Text(
                      occ.replaceAll('_', ' '),
                      style: TextStyle(
                        fontSize: FontSizes.sm,
                        fontWeight: FontWeight.w600,
                        color: isSelected
                            ? Colors.white
                            : colors.textSecondary,
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: Spacing.lg),

          // Reference photos
          Text(
            'Reference Photos (optional)',
            style: TextStyle(
              fontSize: FontSizes.base,
              fontWeight: FontWeight.w600,
              color: colors.text,
            ),
          ),
          const SizedBox(height: Spacing.sm),
          SizedBox(
            height: 80,
            child: ListView(
              scrollDirection: Axis.horizontal,
              children: [
                ..._selectedImages.asMap().entries.map((entry) {
                  return Padding(
                    padding: const EdgeInsets.only(right: Spacing.sm),
                    child: Stack(
                      clipBehavior: Clip.none,
                      children: [
                        ClipRRect(
                          borderRadius:
                              BorderRadius.circular(AppRadius.md),
                          child: Image.network(
                            entry.value.path,
                            width: 80,
                            height: 80,
                            fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) => Container(
                              width: 80,
                              height: 80,
                              color: colors.surface,
                              child: Icon(Icons.image,
                                  color: colors.textMuted),
                            ),
                          ),
                        ),
                        Positioned(
                          top: -6,
                          right: -6,
                          child: GestureDetector(
                            onTap: () => setState(() =>
                                _selectedImages.removeAt(entry.key)),
                            child: Container(
                              width: 22,
                              height: 22,
                              decoration: BoxDecoration(
                                color: colors.error,
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(Icons.close,
                                  size: 14, color: Colors.white),
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                }),
                if (_selectedImages.length < Limits.maxGenerationImages)
                  GestureDetector(
                    onTap: _handleAddImages,
                    child: Container(
                      width: 80,
                      height: 80,
                      decoration: BoxDecoration(
                        color: colors.surface,
                        borderRadius:
                            BorderRadius.circular(AppRadius.md),
                        border: Border.all(
                          color: colors.border,
                          width: 1.5,
                          // Dashed border is not native in Flutter,
                          // using solid border instead
                        ),
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.add_circle_outline,
                              size: 28, color: colors.textMuted),
                          const SizedBox(height: 4),
                          Text(
                            'Add',
                            style: TextStyle(
                              fontSize: FontSizes.xs,
                              color: colors.textMuted,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(height: Spacing.xl),

          // Generate button
          DresslyButton(
            title: _isGenerating ? 'Generating...' : '🪄 Generate Outfit',
            onPressed: _handleGenerate,
            loading: _isGenerating,
            fullWidth: true,
            size: ButtonSize.lg,
            disabled: _promptController.text.trim().isEmpty || _isGenerating,
          ),

          // Result
          if (_result != null) ...[
            const SizedBox(height: Spacing.xl),
            DresslyCard(
              elevated: true,
              child: Column(
                children: [
                  Text(
                    'Your AI Styled Outfit',
                    style: TextStyle(
                      fontSize: FontSizes.lg,
                      fontWeight: FontWeight.w700,
                      color: colors.text,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: Spacing.md),
                  if (_result!.outputImageUrl != null)
                    ClipRRect(
                      borderRadius:
                          BorderRadius.circular(AppRadius.md),
                      child: Image.network(
                        _result!.outputImageUrl!,
                        width: double.infinity,
                        height: 300,
                        fit: BoxFit.contain,
                      ),
                    ),
                  if (_result!.styleScore != null) ...[
                    const SizedBox(height: Spacing.md),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.star,
                            size: 20, color: colors.warning),
                        const SizedBox(width: Spacing.sm),
                        Text(
                          '${_result!.styleScore!.toStringAsFixed(1)}/10',
                          style: TextStyle(
                            fontSize: FontSizes.xl,
                            fontWeight: FontWeight.w800,
                            color: colors.text,
                          ),
                        ),
                        const SizedBox(width: Spacing.sm),
                        Text(
                          'Style Score',
                          style: TextStyle(
                            fontSize: FontSizes.sm,
                            color: colors.textSecondary,
                          ),
                        ),
                      ],
                    ),
                  ],
                  if (_result!.aiFeedback != null) ...[
                    const SizedBox(height: Spacing.md),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(Spacing.base),
                      decoration: BoxDecoration(
                        color: colors.surface,
                        borderRadius:
                            BorderRadius.circular(AppRadius.md),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'AI Feedback',
                            style: TextStyle(
                              fontSize: FontSizes.sm,
                              fontWeight: FontWeight.w700,
                              color: colors.primary,
                            ),
                          ),
                          const SizedBox(height: Spacing.sm),
                          Text(
                            _result!.aiFeedback!,
                            style: TextStyle(
                              fontSize: FontSizes.sm,
                              color: colors.textSecondary,
                              height: 1.5,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],

          const SizedBox(height: Spacing.xxxl),
        ],
      ),
    );
  }
}
