// ══════════════════════════════════════════════════════════════
// Dressly — Register Screen
// ══════════════════════════════════════════════════════════════

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Link } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/layout';
import { Button, Input } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore } from '@/stores/themeStore';
import { extractApiError } from '@/services/api';
import { FONT_SIZES, LIMITS, SPACING } from '@/constants';

export default function RegisterScreen() {
  const colors = useThemeStore((s) => s.colors);
  const { register, isLoading, clearError } = useAuthStore();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const handleRegister = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Email and password are required');
      return;
    }

    if (password.length < LIMITS.PASSWORD_MIN_LENGTH) {
      Alert.alert('Error', `Password must be at least ${LIMITS.PASSWORD_MIN_LENGTH} characters`);
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      await register({
        email: email.trim().toLowerCase(),
        password,
        display_name: displayName.trim() || undefined,
      });
    } catch (err) {
      const { message } = extractApiError(err);
      Alert.alert('Registration Failed', message);
    }
  };

  return (
    <Screen scrollable keyboardAvoiding padding>
      <View style={styles.container}>
        {/* Header */}
        <Animated.View
          entering={FadeInUp.duration(600)}
          style={styles.header}
        >
          <View
            style={[
              styles.logoContainer,
              { backgroundColor: colors.secondary + '15' },
            ]}
          >
            <Ionicons name="sparkles" size={48} color={colors.secondary} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>
            Create Account
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Join Dressly and elevate your style
          </Text>
        </Animated.View>

        {/* Form */}
        <Animated.View
          entering={FadeInDown.duration(600).delay(200)}
          style={styles.form}
        >
          <Input
            label="Display Name (optional)"
            placeholder="What should we call you?"
            leftIcon="person-outline"
            value={displayName}
            onChangeText={setDisplayName}
            onSubmitEditing={() => emailRef.current?.focus()}
            returnKeyType="next"
          />

          <Input
            ref={emailRef}
            label="Email"
            placeholder="you@example.com"
            leftIcon="mail-outline"
            keyboardType="email-address"
            autoComplete="email"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              clearError();
            }}
            onSubmitEditing={() => passwordRef.current?.focus()}
            returnKeyType="next"
          />

          <Input
            ref={passwordRef}
            label="Password"
            placeholder="Min 8 characters"
            leftIcon="lock-closed-outline"
            isPassword
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={() => confirmRef.current?.focus()}
            returnKeyType="next"
            hint={`Minimum ${LIMITS.PASSWORD_MIN_LENGTH} characters with upper, lower, number, and symbol`}
          />

          <Input
            ref={confirmRef}
            label="Confirm Password"
            placeholder="Re-enter your password"
            leftIcon="shield-checkmark-outline"
            isPassword
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            onSubmitEditing={handleRegister}
            returnKeyType="done"
            error={
              confirmPassword && password !== confirmPassword
                ? 'Passwords do not match'
                : undefined
            }
          />

          <Button
            title="Create Account"
            onPress={handleRegister}
            loading={isLoading}
            fullWidth
            size="lg"
          />
        </Animated.View>

        {/* Login Link */}
        <Animated.View
          entering={FadeInDown.duration(600).delay(400)}
          style={styles.footer}
        >
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            Already have an account?{' '}
          </Text>
          <Link href="/auth/login" asChild>
            <TouchableOpacity>
              <Text style={[styles.linkText, { color: colors.primary }]}>
                Sign In
              </Text>
            </TouchableOpacity>
          </Link>
        </Animated.View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: SPACING['2xl'],
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  logoContainer: {
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
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZES.base,
  },
  form: {
    marginBottom: SPACING.xl,
    gap: SPACING.xs,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: FONT_SIZES.md,
  },
  linkText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
  },
});
