// ══════════════════════════════════════════════════════════════
// Dressly — Forgot Password Screen
// ══════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/layout';
import { Button, Input } from '@/components/ui';
import { useThemeStore } from '@/stores/themeStore';
import { FONT_SIZES, SPACING } from '@/constants';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const colors = useThemeStore((s) => s.colors);
  const [email, setEmail] = useState('');
  const [isSent, setIsSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Call password reset API
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setIsSent(true);
    } catch {
      Alert.alert('Error', 'Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Screen scrollable keyboardAvoiding padding>
      <View style={styles.container}>
        <Animated.View
          entering={FadeInUp.duration(600)}
          style={styles.header}
        >
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: colors.accent + '15' },
            ]}
          >
            <Ionicons
              name={isSent ? 'mail-open-outline' : 'key-outline'}
              size={48}
              color={colors.accent}
            />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>
            {isSent ? 'Check Your Email' : 'Reset Password'}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {isSent
              ? `We've sent a password reset link to ${email}`
              : 'Enter your email and we\'ll send you a reset link'}
          </Text>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.duration(600).delay(200)}
          style={styles.form}
        >
          {isSent ? (
            <Button
              title="Back to Login"
              onPress={() => router.replace('/auth/login')}
              fullWidth
              size="lg"
            />
          ) : (
            <>
              <Input
                label="Email Address"
                placeholder="you@example.com"
                leftIcon="mail-outline"
                keyboardType="email-address"
                autoComplete="email"
                value={email}
                onChangeText={setEmail}
                onSubmitEditing={handleSubmit}
                returnKeyType="done"
              />
              <Button
                title="Send Reset Link"
                onPress={handleSubmit}
                loading={isLoading}
                fullWidth
                size="lg"
              />
            </>
          )}

          <Button
            title="Back to Login"
            variant="ghost"
            onPress={() => router.back()}
          />
        </Animated.View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: SPACING['3xl'],
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING['2xl'],
  },
  iconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZES['3xl'],
    fontWeight: '800',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: FONT_SIZES.base,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
    lineHeight: 22,
  },
  form: {
    gap: SPACING.md,
  },
});
