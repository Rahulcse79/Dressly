// ══════════════════════════════════════════════════════════════
// Dressly — Admin Dashboard
// ══════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/layout';
import { Card, Button, Loading } from '@/components/ui';
import { useThemeStore } from '@/stores/themeStore';
import apiClient, { extractApiError } from '@/services/api';
import { ENDPOINTS, QUERY_KEYS, FONT_SIZES, SPACING, RADIUS } from '@/constants';
import type { ApiResponse, AdminAnalytics, AdminConfig } from '@/types';

export default function AdminScreen() {
  const router = useRouter();
  const colors = useThemeStore((s) => s.colors);
  const queryClient = useQueryClient();

  // Fetch analytics
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: QUERY_KEYS.ADMIN_ANALYTICS,
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<AdminAnalytics>>(
        ENDPOINTS.ADMIN_ANALYTICS,
      );
      return res.data.data;
    },
  });

  // Fetch config
  const { data: configs, isLoading: configLoading } = useQuery({
    queryKey: QUERY_KEYS.ADMIN_CONFIG,
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<AdminConfig[]>>(
        ENDPOINTS.ADMIN_CONFIG,
      );
      return res.data.data;
    },
  });

  // Update config mutation
  const updateConfig = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      await apiClient.put(ENDPOINTS.ADMIN_CONFIG, {
        configs: [{ key, value }],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ADMIN_CONFIG });
      Alert.alert('Success', 'Configuration updated');
    },
    onError: (err) => {
      const { message } = extractApiError(err);
      Alert.alert('Error', message);
    },
  });

  const StatCard = ({
    icon,
    label,
    value,
    color,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value: string | number;
    color: string;
  }) => (
    <Card containerStyle={styles.statCard} elevated>
      <View style={[styles.statIcon, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
        {label}
      </Text>
    </Card>
  );

  const ConfigRow = ({ config }: { config: AdminConfig }) => {
    const [editing, setEditing] = useState(false);
    const [newValue, setNewValue] = useState(String(config.value));

    return (
      <View style={[styles.configRow, { borderBottomColor: colors.border }]}>
        <View style={styles.configInfo}>
          <Text style={[styles.configKey, { color: colors.text }]}>
            {config.key.replace(/_/g, ' ').toUpperCase()}
          </Text>
          {editing ? (
            <TextInput
              style={[
                styles.configInput,
                { color: colors.text, borderColor: colors.primary },
              ]}
              value={newValue}
              onChangeText={setNewValue}
              autoFocus
              onBlur={() => {
                if (newValue !== String(config.value)) {
                  updateConfig.mutate({ key: config.key, value: newValue });
                }
                setEditing(false);
              }}
              onSubmitEditing={() => {
                if (newValue !== String(config.value)) {
                  updateConfig.mutate({ key: config.key, value: newValue });
                }
                setEditing(false);
              }}
              returnKeyType="done"
            />
          ) : (
            <Text style={[styles.configValue, { color: colors.textSecondary }]}>
              {String(config.value)}
            </Text>
          )}
        </View>
        <TouchableOpacity onPress={() => setEditing(!editing)}>
          <Ionicons
            name={editing ? 'checkmark-circle' : 'create-outline'}
            size={20}
            color={editing ? colors.success : colors.textMuted}
          />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Screen scrollable padding>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Admin Panel',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          ),
        }}
      />

      {/* Analytics */}
      <Animated.View entering={FadeInDown.duration(500)}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Analytics
        </Text>
        {analyticsLoading ? (
          <Loading />
        ) : analytics ? (
          <View style={styles.statsGrid}>
            <StatCard
              icon="people"
              label="Total Users"
              value={analytics.total_users.toLocaleString()}
              color="#6C63FF"
            />
            <StatCard
              icon="person"
              label="Active"
              value={analytics.active_users.toLocaleString()}
              color="#10B981"
            />
            <StatCard
              icon="diamond"
              label="Pro Users"
              value={analytics.pro_users.toLocaleString()}
              color="#F59E0B"
            />
            <StatCard
              icon="sparkles"
              label="Generations"
              value={analytics.total_generations.toLocaleString()}
              color="#EC4899"
            />
            <StatCard
              icon="card"
              label="Revenue ₹"
              value={`₹${analytics.total_revenue_inr.toLocaleString()}`}
              color="#3B82F6"
            />
            <StatCard
              icon="wifi"
              label="WS Conns"
              value={analytics.ws_connections}
              color="#8B5CF6"
            />
          </View>
        ) : null}
      </Animated.View>

      {/* Configuration */}
      <Animated.View entering={FadeInDown.duration(500).delay(200)}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Configuration
        </Text>
        {configLoading ? (
          <Loading />
        ) : configs ? (
          <Card containerStyle={styles.configCard}>
            {configs.map((config) => (
              <ConfigRow key={config.key} config={config} />
            ))}
          </Card>
        ) : null}
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    marginBottom: SPACING.md,
    marginTop: SPACING.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  statCard: {
    width: '47%',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.base,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
  },
  configCard: {
    marginBottom: SPACING['3xl'],
  },
  configRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  configInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  configKey: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  configValue: {
    fontSize: FONT_SIZES.base,
  },
  configInput: {
    fontSize: FONT_SIZES.base,
    borderBottomWidth: 1.5,
    paddingVertical: 4,
  },
});
