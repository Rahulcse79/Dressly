// ══════════════════════════════════════════════════════════════
// Dressly — Home Screen (Dashboard)
// ══════════════════════════════════════════════════════════════

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/layout';
import { Card, Loading } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore } from '@/stores/themeStore';
import apiClient from '@/services/api';
import { ENDPOINTS, QUERY_KEYS, FONT_SIZES, SPACING, RADIUS } from '@/constants';
import type { ApiResponse, AiQuota, OutfitGeneration } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const colors = useThemeStore((s) => s.colors);
  const user = useAuthStore((s) => s.user);

  // Fetch AI quota
  const { data: quotaData } = useQuery({
    queryKey: QUERY_KEYS.AI_QUOTA,
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<AiQuota>>(ENDPOINTS.AI_QUOTA);
      return res.data.data;
    },
  });

  // Fetch recent generations
  const { data: generationsData, isLoading } = useQuery({
    queryKey: QUERY_KEYS.GENERATIONS,
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<OutfitGeneration[]>>(
        ENDPOINTS.AI_LIST,
        { params: { page: 1, per_page: 6 } },
      );
      return res.data.data;
    },
  });

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <Screen scrollable padding>
      {/* Header */}
      <Animated.View
        entering={FadeInDown.duration(500)}
        style={styles.header}
      >
        <View>
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>
            {greeting()} 👋
          </Text>
          <Text style={[styles.name, { color: colors.text }]}>
            {user?.display_name || 'Fashionista'}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/profile')}
          style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}
        >
          {user?.avatar_url ? (
            <Image
              source={{ uri: user.avatar_url }}
              style={styles.avatarImage}
            />
          ) : (
            <Ionicons name="person" size={24} color={colors.primary} />
          )}
        </TouchableOpacity>
      </Animated.View>

      {/* Quick Actions */}
      <Animated.View
        entering={FadeInDown.duration(500).delay(100)}
        style={styles.quickActions}
      >
        <Card
          onPress={() => router.push('/(tabs)/generate')}
          elevated
          containerStyle={[
            styles.actionCard,
            { backgroundColor: colors.primary },
          ]}
        >
          <Ionicons name="sparkles" size={28} color="#FFF" />
          <Text style={styles.actionTitle}>Generate Outfit</Text>
          <Text style={styles.actionSubtitle}>
            AI-powered style advice
          </Text>
        </Card>

        <Card
          onPress={() => router.push('/(tabs)/wardrobe')}
          elevated
          containerStyle={[
            styles.actionCard,
            { backgroundColor: colors.secondary },
          ]}
        >
          <Ionicons name="shirt" size={28} color="#FFF" />
          <Text style={styles.actionTitle}>My Wardrobe</Text>
          <Text style={styles.actionSubtitle}>
            Manage your clothes
          </Text>
        </Card>
      </Animated.View>

      {/* AI Quota Card */}
      {quotaData && (
        <Animated.View entering={FadeInDown.duration(500).delay(200)}>
          <Card elevated containerStyle={styles.quotaCard}>
            <View style={styles.quotaHeader}>
              <Text style={[styles.quotaTitle, { color: colors.text }]}>
                Today's AI Quota
              </Text>
              {quotaData.is_pro && (
                <View
                  style={[
                    styles.proBadge,
                    { backgroundColor: colors.accent + '20' },
                  ]}
                >
                  <Ionicons name="diamond" size={12} color={colors.accent} />
                  <Text style={[styles.proText, { color: colors.accent }]}>
                    PRO
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.quotaBar}>
              <View
                style={[
                  styles.quotaProgress,
                  {
                    backgroundColor: colors.primary,
                    width: `${Math.min(
                      (quotaData.used_today / quotaData.daily_limit) * 100,
                      100,
                    )}%`,
                  },
                ]}
              />
            </View>
            <Text style={[styles.quotaText, { color: colors.textSecondary }]}>
              {quotaData.remaining} of {quotaData.daily_limit} generations
              remaining
            </Text>
          </Card>
        </Animated.View>
      )}

      {/* Recent Generations */}
      <Animated.View entering={FadeInDown.duration(500).delay(300)}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Recent Styles
          </Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/generate')}>
            <Text style={[styles.seeAll, { color: colors.primary }]}>
              See All
            </Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <Loading />
        ) : generationsData && generationsData.length > 0 ? (
          <FlatList
            data={generationsData}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ gap: SPACING.md }}
            renderItem={({ item }) => (
              <Card
                onPress={() => router.push(`/(tabs)/generate?id=${item.id}`)}
                containerStyle={styles.generationCard}
              >
                {item.output_image_url ? (
                  <Image
                    source={{ uri: item.output_image_url }}
                    style={styles.generationImage}
                  />
                ) : (
                  <View
                    style={[
                      styles.generationPlaceholder,
                      { backgroundColor: colors.surface },
                    ]}
                  >
                    <Ionicons
                      name="image-outline"
                      size={32}
                      color={colors.textMuted}
                    />
                  </View>
                )}
                <View style={styles.generationInfo}>
                  <Text
                    style={[styles.generationOccasion, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {item.occasion || 'Outfit'}
                  </Text>
                  {item.style_score && (
                    <View style={styles.scoreRow}>
                      <Ionicons
                        name="star"
                        size={12}
                        color={colors.warning}
                      />
                      <Text
                        style={[
                          styles.scoreText,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {item.style_score.toFixed(1)}
                      </Text>
                    </View>
                  )}
                </View>
              </Card>
            )}
          />
        ) : (
          <Card containerStyle={styles.emptyCard}>
            <Ionicons name="sparkles-outline" size={32} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No styles generated yet. Tap "Generate Outfit" to get started!
            </Text>
          </Card>
        )}
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    marginTop: SPACING.md,
  },
  greeting: {
    fontSize: FONT_SIZES.md,
  },
  name: {
    fontSize: FONT_SIZES['2xl'],
    fontWeight: '800',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  quickActions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  actionCard: {
    flex: 1,
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  actionTitle: {
    color: '#FFF',
    fontSize: FONT_SIZES.base,
    fontWeight: '700',
  },
  actionSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: FONT_SIZES.xs,
  },
  quotaCard: {
    marginBottom: SPACING.xl,
  },
  quotaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  quotaTitle: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  proText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
  },
  quotaBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(128,128,128,0.15)',
    marginBottom: SPACING.sm,
    overflow: 'hidden',
  },
  quotaProgress: {
    height: '100%',
    borderRadius: 4,
  },
  quotaText: {
    fontSize: FONT_SIZES.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
  },
  seeAll: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  generationCard: {
    width: SCREEN_WIDTH * 0.4,
    padding: 0,
    overflow: 'hidden',
  },
  generationImage: {
    width: '100%',
    height: 140,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
  },
  generationPlaceholder: {
    width: '100%',
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  generationInfo: {
    padding: SPACING.sm,
  },
  generationOccasion: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  scoreText: {
    fontSize: FONT_SIZES.xs,
  },
  emptyCard: {
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.xl,
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    textAlign: 'center',
    lineHeight: 22,
  },
});
