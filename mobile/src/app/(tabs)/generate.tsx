// ══════════════════════════════════════════════════════════════
// Dressly — AI Generate Screen
// ══════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/layout';
import { Button, Card, Input, Loading } from '@/components/ui';
import { useThemeStore } from '@/stores/themeStore';
import { useImagePicker } from '@/hooks/useImagePicker';
import apiClient, { extractApiError } from '@/services/api';
import {
  ENDPOINTS,
  QUERY_KEYS,
  FONT_SIZES,
  SPACING,
  RADIUS,
  OCCASIONS,
  LIMITS,
} from '@/constants';
import type { ApiResponse, OutfitGeneration, AiQuota } from '@/types';

export default function GenerateScreen() {
  const colors = useThemeStore((s) => s.colors);
  const queryClient = useQueryClient();
  const { pickFromGallery } = useImagePicker();

  const [prompt, setPrompt] = useState('');
  const [selectedOccasion, setSelectedOccasion] = useState<string | null>(null);
  const [selectedImages, setSelectedImages] = useState<
    Array<{ uri: string; base64: string | null }>
  >([]);
  const [result, setResult] = useState<OutfitGeneration | null>(null);

  // Fetch quota
  const { data: quota } = useQuery({
    queryKey: QUERY_KEYS.AI_QUOTA,
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<AiQuota>>(ENDPOINTS.AI_QUOTA);
      return res.data.data;
    },
  });

  // Generate mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post<ApiResponse<OutfitGeneration>>(
        ENDPOINTS.AI_GENERATE,
        {
          prompt: prompt.trim(),
          occasion: selectedOccasion,
        },
      );
      return res.data.data;
    },
    onSuccess: (data) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.AI_QUOTA });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.GENERATIONS });
    },
    onError: (err) => {
      const { message } = extractApiError(err);
      Alert.alert('Generation Failed', message);
    },
  });

  const handleGenerate = () => {
    if (!prompt.trim()) {
      Alert.alert('Error', 'Please describe what outfit you want');
      return;
    }
    if (quota && quota.remaining <= 0) {
      Alert.alert(
        'Quota Exceeded',
        'You\'ve used all your daily generations. Upgrade to Pro for more!',
      );
      return;
    }
    generateMutation.mutate();
  };

  const handleAddImages = async () => {
    const images = await pickFromGallery(true);
    if (images.length > 0) {
      setSelectedImages((prev) =>
        [...prev, ...images].slice(0, LIMITS.MAX_GENERATION_IMAGES),
      );
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Screen scrollable padding keyboardAvoiding>
      {/* Header */}
      <Animated.View
        entering={FadeInDown.duration(500)}
        style={styles.header}
      >
        <Text style={[styles.title, { color: colors.text }]}>
          AI Style Generator ✨
        </Text>
        {quota && (
          <Text style={[styles.quotaText, { color: colors.textSecondary }]}>
            {quota.remaining}/{quota.daily_limit} left today
          </Text>
        )}
      </Animated.View>

      {/* Prompt Input */}
      <Animated.View entering={FadeInDown.duration(500).delay(100)}>
        <Input
          label="Describe your ideal outfit"
          placeholder="e.g., Smart casual for a summer dinner date"
          value={prompt}
          onChangeText={setPrompt}
          multiline
          numberOfLines={3}
          containerStyle={styles.promptInput}
        />
      </Animated.View>

      {/* Occasion Selector */}
      <Animated.View entering={FadeInDown.duration(500).delay(200)}>
        <Text style={[styles.sectionLabel, { color: colors.text }]}>
          Occasion (optional)
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: SPACING.sm }}
          style={styles.occasionScroll}
        >
          {OCCASIONS.map((occ) => {
            const isSelected = occ === selectedOccasion;
            return (
              <TouchableOpacity
                key={occ}
                onPress={() =>
                  setSelectedOccasion(isSelected ? null : occ)
                }
                style={[
                  styles.occasionChip,
                  {
                    backgroundColor: isSelected
                      ? colors.primary
                      : colors.surface,
                    borderColor: isSelected
                      ? colors.primary
                      : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.occasionText,
                    { color: isSelected ? '#FFF' : colors.textSecondary },
                  ]}
                >
                  {occ.replace('_', ' ')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </Animated.View>

      {/* Image Attachments */}
      <Animated.View entering={FadeInDown.duration(500).delay(300)}>
        <Text style={[styles.sectionLabel, { color: colors.text }]}>
          Reference Photos (optional)
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: SPACING.sm }}
          style={styles.imageScroll}
        >
          {selectedImages.map((img, idx) => (
            <View key={idx} style={styles.imageWrapper}>
              <Image source={{ uri: img.uri }} style={styles.selectedImage} />
              <TouchableOpacity
                onPress={() => removeImage(idx)}
                style={[
                  styles.removeImageBtn,
                  { backgroundColor: colors.error },
                ]}
              >
                <Ionicons name="close" size={14} color="#FFF" />
              </TouchableOpacity>
            </View>
          ))}
          {selectedImages.length < LIMITS.MAX_GENERATION_IMAGES && (
            <TouchableOpacity
              onPress={handleAddImages}
              style={[
                styles.addImageBtn,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <Ionicons
                name="add-circle-outline"
                size={28}
                color={colors.textMuted}
              />
              <Text style={[styles.addImageText, { color: colors.textMuted }]}>
                Add
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </Animated.View>

      {/* Generate Button */}
      <Animated.View entering={FadeInDown.duration(500).delay(400)}>
        <Button
          title={
            generateMutation.isPending
              ? 'Generating...'
              : '🪄 Generate Outfit'
          }
          onPress={handleGenerate}
          loading={generateMutation.isPending}
          fullWidth
          size="lg"
          disabled={!prompt.trim() || generateMutation.isPending}
        />
      </Animated.View>

      {/* Result */}
      {result && (
        <Animated.View entering={ZoomIn.duration(500)}>
          <Card elevated containerStyle={styles.resultCard}>
            <Text style={[styles.resultTitle, { color: colors.text }]}>
              Your AI Styled Outfit
            </Text>

            {result.output_image_url && (
              <Image
                source={{ uri: result.output_image_url }}
                style={styles.resultImage}
                resizeMode="contain"
              />
            )}

            {result.style_score !== null && (
              <View style={styles.scoreContainer}>
                <Ionicons name="star" size={20} color={colors.warning} />
                <Text style={[styles.scoreValue, { color: colors.text }]}>
                  {result.style_score.toFixed(1)}/10
                </Text>
                <Text style={[styles.scoreLabel, { color: colors.textSecondary }]}>
                  Style Score
                </Text>
              </View>
            )}

            {result.ai_feedback && (
              <View
                style={[
                  styles.feedbackContainer,
                  { backgroundColor: colors.surface },
                ]}
              >
                <Text style={[styles.feedbackLabel, { color: colors.primary }]}>
                  AI Feedback
                </Text>
                <Text
                  style={[
                    styles.feedbackText,
                    { color: colors.textSecondary },
                  ]}
                >
                  {result.ai_feedback}
                </Text>
              </View>
            )}
          </Card>
        </Animated.View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZES['2xl'],
    fontWeight: '800',
  },
  quotaText: {
    fontSize: FONT_SIZES.sm,
    marginTop: SPACING.xs,
  },
  promptInput: {
    marginBottom: SPACING.md,
  },
  sectionLabel: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  occasionScroll: {
    marginBottom: SPACING.lg,
    maxHeight: 40,
  },
  occasionChip: {
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  occasionText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  imageScroll: {
    marginBottom: SPACING.xl,
    maxHeight: 100,
  },
  imageWrapper: {
    position: 'relative',
  },
  selectedImage: {
    width: 80,
    height: 80,
    borderRadius: RADIUS.md,
  },
  removeImageBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addImageBtn: {
    width: 80,
    height: 80,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addImageText: {
    fontSize: FONT_SIZES.xs,
  },
  resultCard: {
    marginTop: SPACING.xl,
    gap: SPACING.md,
  },
  resultTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    textAlign: 'center',
  },
  resultImage: {
    width: '100%',
    height: 300,
    borderRadius: RADIUS.md,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  scoreValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '800',
  },
  scoreLabel: {
    fontSize: FONT_SIZES.sm,
  },
  feedbackContainer: {
    padding: SPACING.base,
    borderRadius: RADIUS.md,
  },
  feedbackLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  feedbackText: {
    fontSize: FONT_SIZES.md,
    lineHeight: 22,
  },
});
