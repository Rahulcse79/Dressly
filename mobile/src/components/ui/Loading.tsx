// ══════════════════════════════════════════════════════════════
// Dressly — Loading Indicator Component
// ══════════════════════════════════════════════════════════════

import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useThemeStore } from '@/stores/themeStore';
import { FONT_SIZES, SPACING } from '@/constants';

interface LoadingProps {
  message?: string;
  size?: 'small' | 'large';
  fullScreen?: boolean;
}

export function Loading({
  message,
  size = 'large',
  fullScreen = false,
}: LoadingProps) {
  const colors = useThemeStore((s) => s.colors);

  return (
    <View
      style={[
        styles.container,
        fullScreen && styles.fullScreen,
        { backgroundColor: fullScreen ? colors.background : 'transparent' },
      ]}
    >
      <ActivityIndicator size={size} color={colors.primary} />
      {message && (
        <Text style={[styles.message, { color: colors.textSecondary }]}>
          {message}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  fullScreen: {
    flex: 1,
  },
  message: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.md,
  },
});
