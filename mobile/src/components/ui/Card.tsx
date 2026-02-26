// ══════════════════════════════════════════════════════════════
// Dressly — Card Component
// ══════════════════════════════════════════════════════════════

import React from 'react';
import {
  View,
  StyleSheet,
  ViewProps,
  ViewStyle,
  TouchableOpacity,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useThemeStore } from '@/stores/themeStore';
import { RADIUS, SPACING } from '@/constants';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface CardProps extends ViewProps {
  children: React.ReactNode;
  onPress?: () => void;
  padding?: number;
  elevated?: boolean;
  containerStyle?: ViewStyle;
}

export function Card({
  children,
  onPress,
  padding = SPACING.base,
  elevated = false,
  containerStyle,
  style,
  ...rest
}: CardProps) {
  const colors = useThemeStore((s) => s.colors);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (onPress) {
      scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const cardStyle: ViewStyle = {
    backgroundColor: elevated ? colors.surfaceElevated : colors.card,
    borderRadius: RADIUS.lg,
    padding,
    borderWidth: 1,
    borderColor: colors.border,
    ...(elevated
      ? {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 3,
        }
      : {}),
  };

  if (onPress) {
    return (
      <AnimatedTouchable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
        style={[cardStyle, animatedStyle, containerStyle, style as ViewStyle]}
        {...rest}
      >
        {children}
      </AnimatedTouchable>
    );
  }

  return (
    <View style={[cardStyle, containerStyle, style as ViewStyle]} {...rest}>
      {children}
    </View>
  );
}
