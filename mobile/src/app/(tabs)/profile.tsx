// ══════════════════════════════════════════════════════════════
// Dressly — Profile Screen
// ══════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/layout';
import { Button, Card, Modal } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore } from '@/stores/themeStore';
import apiClient, { extractApiError } from '@/services/api';
import {
  ENDPOINTS,
  QUERY_KEYS,
  FONT_SIZES,
  SPACING,
  RADIUS,
} from '@/constants';
import type { ApiResponse, SubscriptionResponse, ThemeMode } from '@/types';

export default function ProfileScreen() {
  const router = useRouter();
  const colors = useThemeStore((s) => s.colors);
  const isDark = useThemeStore((s) => s.isDark);
  const themeMode = useThemeStore((s) => s.mode);
  const setThemeMode = useThemeStore((s) => s.setMode);
  const toggleTheme = useThemeStore((s) => s.toggle);
  const { user, logout } = useAuthStore();

  const [showThemeModal, setShowThemeModal] = useState(false);

  // Fetch subscription status
  const { data: subscription } = useQuery({
    queryKey: QUERY_KEYS.SUBSCRIPTION,
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<SubscriptionResponse>>(
        ENDPOINTS.SUBSCRIPTION,
      );
      return res.data.data;
    },
  });

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action is irreversible. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(ENDPOINTS.DELETE_ME);
              await logout();
            } catch (err) {
              const { message } = extractApiError(err);
              Alert.alert('Error', message);
            }
          },
        },
      ],
    );
  };

  const MenuRow = ({
    icon,
    label,
    value,
    onPress,
    danger,
    rightElement,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value?: string;
    onPress?: () => void;
    danger?: boolean;
    rightElement?: React.ReactNode;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress && !rightElement}
      style={[styles.menuRow, { borderBottomColor: colors.border }]}
    >
      <View style={styles.menuLeft}>
        <Ionicons
          name={icon}
          size={20}
          color={danger ? colors.error : colors.primary}
        />
        <Text
          style={[
            styles.menuLabel,
            { color: danger ? colors.error : colors.text },
          ]}
        >
          {label}
        </Text>
      </View>
      <View style={styles.menuRight}>
        {value && (
          <Text style={[styles.menuValue, { color: colors.textSecondary }]}>
            {value}
          </Text>
        )}
        {rightElement}
        {onPress && !rightElement && (
          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.textMuted}
          />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <Screen scrollable padding>
      {/* Profile Header */}
      <Animated.View
        entering={FadeInDown.duration(500)}
        style={styles.profileHeader}
      >
        <TouchableOpacity style={styles.avatarContainer}>
          {user?.avatar_url ? (
            <Image
              source={{ uri: user.avatar_url }}
              style={styles.avatar}
            />
          ) : (
            <View
              style={[
                styles.avatar,
                styles.avatarPlaceholder,
                { backgroundColor: colors.primary + '20' },
              ]}
            >
              <Ionicons name="person" size={40} color={colors.primary} />
            </View>
          )}
          <View
            style={[
              styles.editAvatarBadge,
              { backgroundColor: colors.primary },
            ]}
          >
            <Ionicons name="camera" size={14} color="#FFF" />
          </View>
        </TouchableOpacity>

        <Text style={[styles.displayName, { color: colors.text }]}>
          {user?.display_name || 'Fashionista'}
        </Text>
        <Text style={[styles.email, { color: colors.textSecondary }]}>
          {user?.email}
        </Text>

        {/* Subscription Badge */}
        {subscription?.is_pro ? (
          <View
            style={[
              styles.proBadge,
              { backgroundColor: colors.accent + '15' },
            ]}
          >
            <Ionicons name="diamond" size={16} color={colors.accent} />
            <Text style={[styles.proText, { color: colors.accent }]}>
              PRO — {subscription.days_remaining} days remaining
            </Text>
          </View>
        ) : (
          <Button
            title="Upgrade to Pro ✨"
            variant="secondary"
            size="sm"
            onPress={() => router.push('/(tabs)/profile')} // TODO: subscription flow
          />
        )}
      </Animated.View>

      {/* Settings */}
      <Animated.View entering={FadeInDown.duration(500).delay(200)}>
        <Card containerStyle={styles.menuCard}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            PREFERENCES
          </Text>
          <MenuRow
            icon="color-palette-outline"
            label="Theme"
            value={themeMode === 'system' ? 'System' : isDark ? 'Dark' : 'Light'}
            onPress={() => setShowThemeModal(true)}
          />
          <MenuRow
            icon="moon-outline"
            label="Dark Mode"
            rightElement={
              <Switch
                value={isDark}
                onValueChange={() => toggleTheme()}
                trackColor={{ false: colors.border, true: colors.primary + '60' }}
                thumbColor={isDark ? colors.primary : '#f4f3f4'}
              />
            }
          />
        </Card>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(500).delay(300)}>
        <Card containerStyle={styles.menuCard}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            ACCOUNT
          </Text>
          {user?.role === 'admin' && (
            <MenuRow
              icon="shield-checkmark-outline"
              label="Admin Panel"
              onPress={() => router.push('/admin')}
            />
          )}
          <MenuRow
            icon="diamond-outline"
            label="Subscription"
            value={subscription?.is_pro ? 'Pro' : 'Free'}
            onPress={() => {}}
          />
          <MenuRow
            icon="help-circle-outline"
            label="Help & Support"
            onPress={() => {}}
          />
          <MenuRow
            icon="document-text-outline"
            label="Privacy Policy"
            onPress={() => {}}
          />
        </Card>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(500).delay(400)}>
        <Card containerStyle={styles.menuCard}>
          <MenuRow
            icon="log-out-outline"
            label="Sign Out"
            danger
            onPress={handleLogout}
          />
          <MenuRow
            icon="trash-outline"
            label="Delete Account"
            danger
            onPress={handleDeleteAccount}
          />
        </Card>
      </Animated.View>

      <Text style={[styles.version, { color: colors.textMuted }]}>
        Dressly v1.0.0
      </Text>

      {/* Theme Picker Modal */}
      <Modal
        visible={showThemeModal}
        onClose={() => setShowThemeModal(false)}
        title="Choose Theme"
        size="sm"
      >
        {(['light', 'dark', 'system'] as ThemeMode[]).map((mode) => (
          <TouchableOpacity
            key={mode}
            onPress={() => {
              setThemeMode(mode);
              setShowThemeModal(false);
            }}
            style={[
              styles.themeOption,
              {
                backgroundColor:
                  themeMode === mode ? colors.primary + '15' : 'transparent',
                borderColor:
                  themeMode === mode ? colors.primary : colors.border,
              },
            ]}
          >
            <Ionicons
              name={
                mode === 'light'
                  ? 'sunny'
                  : mode === 'dark'
                    ? 'moon'
                    : 'phone-portrait'
              }
              size={20}
              color={
                themeMode === mode ? colors.primary : colors.textSecondary
              }
            />
            <Text
              style={[
                styles.themeOptionText,
                {
                  color:
                    themeMode === mode ? colors.primary : colors.text,
                },
              ]}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </Text>
            {themeMode === mode && (
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={colors.primary}
                style={{ marginLeft: 'auto' }}
              />
            )}
          </TouchableOpacity>
        ))}
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  profileHeader: {
    alignItems: 'center',
    marginTop: SPACING.xl,
    marginBottom: SPACING.xl,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: SPACING.md,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  editAvatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  displayName: {
    fontSize: FONT_SIZES['2xl'],
    fontWeight: '800',
    marginBottom: 4,
  },
  email: {
    fontSize: FONT_SIZES.md,
    marginBottom: SPACING.md,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
  },
  proText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
  },
  menuCard: {
    marginBottom: SPACING.base,
    padding: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.xs,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  menuLabel: {
    fontSize: FONT_SIZES.base,
    fontWeight: '500',
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  menuValue: {
    fontSize: FONT_SIZES.sm,
  },
  version: {
    textAlign: 'center',
    fontSize: FONT_SIZES.xs,
    marginTop: SPACING.md,
    marginBottom: SPACING['3xl'],
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.base,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.sm,
  },
  themeOptionText: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
  },
});
