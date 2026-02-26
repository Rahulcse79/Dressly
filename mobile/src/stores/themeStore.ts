// ══════════════════════════════════════════════════════════════
// Dressly — Theme Store (Light / Dark / System)
// ══════════════════════════════════════════════════════════════

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance, ColorSchemeName } from 'react-native';
import { STORAGE_KEYS, LIGHT_COLORS, DARK_COLORS } from '@/constants';
import type { ThemeMode } from '@/types';

type Colors = typeof LIGHT_COLORS;

interface ThemeState {
  mode: ThemeMode;
  isDark: boolean;
  colors: Colors;
}

interface ThemeActions {
  initialize: () => Promise<void>;
  setMode: (mode: ThemeMode) => Promise<void>;
  toggle: () => Promise<void>;
}

type ThemeStore = ThemeState & ThemeActions;

const resolveIsDark = (
  mode: ThemeMode,
  systemScheme: ColorSchemeName,
): boolean => {
  if (mode === 'system') return systemScheme === 'dark';
  return mode === 'dark';
};

export const useThemeStore = create<ThemeStore>()((set, get) => {
  const systemScheme = Appearance.getColorScheme();

  return {
    // ── State ────────────────────────────────────────────
    mode: 'system',
    isDark: systemScheme === 'dark',
    colors: systemScheme === 'dark' ? DARK_COLORS : LIGHT_COLORS,

    // ── Initialize ───────────────────────────────────────
    initialize: async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEYS.THEME_MODE);
        if (stored && ['light', 'dark', 'system'].includes(stored)) {
          const mode = stored as ThemeMode;
          const dark = resolveIsDark(mode, Appearance.getColorScheme());
          set({
            mode,
            isDark: dark,
            colors: dark ? DARK_COLORS : LIGHT_COLORS,
          });
        }
      } catch {
        // Use default
      }

      // Listen for system theme changes
      Appearance.addChangeListener(({ colorScheme }) => {
        const { mode } = get();
        if (mode === 'system') {
          const dark = colorScheme === 'dark';
          set({
            isDark: dark,
            colors: dark ? DARK_COLORS : LIGHT_COLORS,
          });
        }
      });
    },

    // ── Set Mode ─────────────────────────────────────────
    setMode: async (mode: ThemeMode) => {
      const dark = resolveIsDark(mode, Appearance.getColorScheme());
      set({
        mode,
        isDark: dark,
        colors: dark ? DARK_COLORS : LIGHT_COLORS,
      });
      await AsyncStorage.setItem(STORAGE_KEYS.THEME_MODE, mode);
    },

    // ── Toggle ───────────────────────────────────────────
    toggle: async () => {
      const { isDark } = get();
      const newMode: ThemeMode = isDark ? 'light' : 'dark';
      await get().setMode(newMode);
    },
  };
});
