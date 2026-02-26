// ══════════════════════════════════════════════════════════════
// Dressly — Wardrobe Screen
// ══════════════════════════════════════════════════════════════

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Animated, { FadeInDown, Layout as AnimatedLayout } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/layout';
import { Button, Card, Loading, EmptyState, Modal } from '@/components/ui';
import { useThemeStore } from '@/stores/themeStore';
import { useImagePicker } from '@/hooks/useImagePicker';
import apiClient, { extractApiError } from '@/services/api';
import {
  ENDPOINTS,
  QUERY_KEYS,
  FONT_SIZES,
  SPACING,
  RADIUS,
  CATEGORY_CONFIG,
} from '@/constants';
import type {
  ApiResponse,
  WardrobeItem,
  ClothingCategory,
  AddWardrobeItemRequest,
} from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ITEM_WIDTH = (SCREEN_WIDTH - SPACING.base * 2 - SPACING.md) / 2;

type CategoryFilter = ClothingCategory | 'all';

export default function WardrobeScreen() {
  const colors = useThemeStore((s) => s.colors);
  const queryClient = useQueryClient();
  const { showPicker } = useImagePicker();
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemCategory, setNewItemCategory] = useState<ClothingCategory>('top');
  const [newItemColor, setNewItemColor] = useState('');

  // Fetch wardrobe items
  const { data: items, isLoading, refetch } = useQuery({
    queryKey: QUERY_KEYS.WARDROBE,
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<WardrobeItem[]>>(
        ENDPOINTS.WARDROBE_LIST,
      );
      return res.data.data;
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(ENDPOINTS.WARDROBE_ITEM(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.WARDROBE });
    },
    onError: (err) => {
      const { message } = extractApiError(err);
      Alert.alert('Error', message);
    },
  });

  const handleDeleteItem = (id: string) => {
    Alert.alert('Delete Item', 'Are you sure you want to remove this item?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteMutation.mutate(id),
      },
    ]);
  };

  const handleAddItem = async () => {
    const images = await showPicker();
    if (images.length === 0) return;

    // TODO: Upload image and create wardrobe item via API
    setShowAddModal(false);
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.WARDROBE });
  };

  // Filter items by category
  const filteredItems = useMemo(() => {
    if (!items) return [];
    if (selectedCategory === 'all') return items;
    return items.filter((item) => item.category === selectedCategory);
  }, [items, selectedCategory]);

  const categories: CategoryFilter[] = [
    'all',
    ...Object.keys(CATEGORY_CONFIG) as ClothingCategory[],
  ];

  return (
    <Screen padding>
      {/* Header */}
      <Animated.View
        entering={FadeInDown.duration(500)}
        style={styles.header}
      >
        <Text style={[styles.title, { color: colors.text }]}>My Wardrobe</Text>
        <TouchableOpacity
          onPress={() => setShowAddModal(true)}
          style={[styles.addButton, { backgroundColor: colors.primary }]}
        >
          <Ionicons name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </Animated.View>

      {/* Category Filters */}
      <FlatList
        data={categories}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterList}
        contentContainerStyle={{ gap: SPACING.sm }}
        keyExtractor={(item) => item}
        renderItem={({ item: cat }) => {
          const isActive = cat === selectedCategory;
          const config = cat === 'all' ? null : CATEGORY_CONFIG[cat];
          return (
            <TouchableOpacity
              onPress={() => setSelectedCategory(cat)}
              style={[
                styles.filterChip,
                {
                  backgroundColor: isActive
                    ? colors.primary
                    : colors.surface,
                  borderColor: isActive ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: isActive ? '#FFF' : colors.textSecondary },
                ]}
              >
                {cat === 'all' ? '🗂 All' : `${config?.label}`}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      {/* Items Grid */}
      {isLoading ? (
        <Loading message="Loading wardrobe..." />
      ) : filteredItems.length === 0 ? (
        <EmptyState
          icon="shirt-outline"
          title="Your wardrobe is empty"
          message="Add your first clothing item to get started with AI outfit generation"
          actionTitle="Add Item"
          onAction={() => setShowAddModal(true)}
        />
      ) : (
        <FlatList
          data={filteredItems}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={{ gap: SPACING.md }}
          contentContainerStyle={{ gap: SPACING.md, paddingBottom: 100 }}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const config = CATEGORY_CONFIG[item.category];
            return (
              <Card
                containerStyle={[styles.itemCard, { width: ITEM_WIDTH }]}
                padding={0}
              >
                <Image
                  source={{ uri: item.image_url }}
                  style={styles.itemImage}
                  resizeMode="cover"
                />
                <View style={styles.itemInfo}>
                  <View
                    style={[
                      styles.categoryBadge,
                      { backgroundColor: (config?.color || colors.primary) + '15' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        { color: config?.color || colors.primary },
                      ]}
                    >
                      {config?.label || item.category}
                    </Text>
                  </View>
                  {item.color && (
                    <Text
                      style={[styles.colorText, { color: colors.textSecondary }]}
                      numberOfLines={1}
                    >
                      {item.color}
                    </Text>
                  )}
                </View>

                {/* Delete button */}
                <TouchableOpacity
                  onPress={() => handleDeleteItem(item.id)}
                  style={[
                    styles.deleteButton,
                    { backgroundColor: colors.error + '20' },
                  ]}
                >
                  <Ionicons name="trash-outline" size={16} color={colors.error} />
                </TouchableOpacity>
              </Card>
            );
          }}
        />
      )}

      {/* Add Item Modal */}
      <Modal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add to Wardrobe"
      >
        <View style={styles.modalContent}>
          <Text style={[styles.modalLabel, { color: colors.text }]}>
            Category
          </Text>
          <View style={styles.categoryGrid}>
            {(Object.keys(CATEGORY_CONFIG) as ClothingCategory[]).map(
              (cat) => {
                const config = CATEGORY_CONFIG[cat];
                const isSelected = cat === newItemCategory;
                return (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setNewItemCategory(cat)}
                    style={[
                      styles.categoryOption,
                      {
                        backgroundColor: isSelected
                          ? config.color + '20'
                          : colors.surface,
                        borderColor: isSelected
                          ? config.color
                          : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryOptionText,
                        { color: isSelected ? config.color : colors.text },
                      ]}
                    >
                      {config.label}
                    </Text>
                  </TouchableOpacity>
                );
              },
            )}
          </View>

          <Button
            title="Take Photo / Choose from Gallery"
            onPress={handleAddItem}
            fullWidth
            size="lg"
            icon={<Ionicons name="camera" size={20} color="#FFF" />}
          />
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.base,
  },
  title: {
    fontSize: FONT_SIZES['2xl'],
    fontWeight: '800',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterList: {
    maxHeight: 44,
    marginBottom: SPACING.base,
  },
  filterChip: {
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  filterText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  itemCard: {
    overflow: 'hidden',
  },
  itemImage: {
    width: '100%',
    height: ITEM_WIDTH * 1.2,
  },
  itemInfo: {
    padding: SPACING.sm,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    marginBottom: 4,
  },
  categoryText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  colorText: {
    fontSize: FONT_SIZES.xs,
  },
  deleteButton: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    gap: SPACING.base,
  },
  modalLabel: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  categoryOption: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
  },
  categoryOptionText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
});
