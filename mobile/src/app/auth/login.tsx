// ══════════════════════════════════════════════════════════════
// Dressly — Login Screen
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
import { useRouter, Link } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/layout';
import { Button, Input } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore } from '@/stores/themeStore';
import { extractApiError } from '@/services/api';
import { FONT_SIZES, SPACING } from '@/constants';

export default function LoginScreen() {
  const router = useRouter();
  const colors = useThemeStore((s) => s.colors);
  const { login, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const passwordRef = useRef<TextInput>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      await login({ email: email.trim().toLowerCase(), password });
    } catch (err) {
      const { message } = extractApiError(err);
      Alert.alert('Login Failed', message);
    }
  };

  return (
    <Screen scrollable keyboardAvoiding padding>
      <View style={styles.container}>
        {/* Logo */}
        <Animated.View
          entering={FadeInUp.duration(600)}
          style={styles.header}
        >
          <View
            style={[
              styles.logoContainer,
              { backgroundColor: colors.primary + '15' },
            ]}
          >
            <Ionicons name="shirt" size={48} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>
            Welcome Back
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Sign in to your Dressly account
          </Text>
        </Animated.View>

        {/* Form */}
        <Animated.View
          entering={FadeInDown.duration(600).delay(200)}
          style={styles.form}
        >
          <Input
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
            placeholder="Enter your password"
            leftIcon="lock-closed-outline"
            isPassword
            autoComplete="password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              clearError();
            }}
            onSubmitEditing={handleLogin}
            returnKeyType="done"
          />

          <TouchableOpacity
            onPress={() => router.push('/auth/forgot-password')}
            style={styles.forgotButton}
          >
            <Text style={[styles.forgotText, { color: colors.primary }]}>
              Forgot Password?
            </Text>
          </TouchableOpacity>

          {error && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {error}
            </Text>
          )}

          <Button
            title="Sign In"
            onPress={handleLogin}
            loading={isLoading}
            fullWidth
            size="lg"
          />
        </Animated.View>

        {/* Register Link */}
        <Animated.View
          entering={FadeInDown.duration(600).delay(400)}
          style={styles.footer}
        >
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            Don't have an account?{' '}
          </Text>
          <Link href="/auth/register" asChild>
            <TouchableOpacity>
              <Text style={[styles.linkText, { color: colors.primary }]}>
                Sign Up
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
    paddingVertical: SPACING['3xl'],
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING['2xl'],
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
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: SPACING.lg,
    marginTop: -SPACING.sm,
  },
  forgotText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  errorText: {
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
    marginBottom: SPACING.md,
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
