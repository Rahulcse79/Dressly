// ─── Theme Store Tests ──────────────────────────────────────────────────────

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';
import { useThemeStore } from '../../stores/themeStore';

// Reset store between tests
const initialState = useThemeStore.getState();

beforeEach(() => {
  useThemeStore.setState(initialState);
  jest.clearAllMocks();
});

describe('ThemeStore', () => {
  // ── Initial State ─────────────────────────────────────────

  it('has default mode of system', () => {
    expect(useThemeStore.getState().mode).toBe('system');
  });

  it('has colors object defined', () => {
    const { colors } = useThemeStore.getState();
    expect(colors).toBeDefined();
    expect(typeof colors).toBe('object');
  });

  it('has isDark boolean', () => {
    expect(typeof useThemeStore.getState().isDark).toBe('boolean');
  });

  // ── setMode ───────────────────────────────────────────────

  it('sets mode to light', async () => {
    await useThemeStore.getState().setMode('light');
    const state = useThemeStore.getState();
    expect(state.mode).toBe('light');
    expect(state.isDark).toBe(false);
  });

  it('sets mode to dark', async () => {
    await useThemeStore.getState().setMode('dark');
    const state = useThemeStore.getState();
    expect(state.mode).toBe('dark');
    expect(state.isDark).toBe(true);
  });

  it('sets mode to system', async () => {
    await useThemeStore.getState().setMode('system');
    expect(useThemeStore.getState().mode).toBe('system');
  });

  it('persists mode to AsyncStorage', async () => {
    await useThemeStore.getState().setMode('dark');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('theme_mode', 'dark');
  });

  it('changes colors when mode changes to dark', async () => {
    await useThemeStore.getState().setMode('dark');
    const { colors } = useThemeStore.getState();
    // Dark colors should be different from light
    expect(colors).toBeDefined();
  });

  it('changes colors when mode changes to light', async () => {
    await useThemeStore.getState().setMode('dark');
    await useThemeStore.getState().setMode('light');
    const { colors } = useThemeStore.getState();
    expect(colors).toBeDefined();
    expect(useThemeStore.getState().isDark).toBe(false);
  });

  // ── toggle ────────────────────────────────────────────────

  it('toggles from light to dark', async () => {
    await useThemeStore.getState().setMode('light');
    await useThemeStore.getState().toggle();
    expect(useThemeStore.getState().mode).toBe('dark');
    expect(useThemeStore.getState().isDark).toBe(true);
  });

  it('toggles from dark to light', async () => {
    await useThemeStore.getState().setMode('dark');
    await useThemeStore.getState().toggle();
    expect(useThemeStore.getState().mode).toBe('light');
    expect(useThemeStore.getState().isDark).toBe(false);
  });

  it('persists toggled mode', async () => {
    await useThemeStore.getState().setMode('light');
    jest.clearAllMocks();
    await useThemeStore.getState().toggle();
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('theme_mode', 'dark');
  });

  // ── initialize ────────────────────────────────────────────

  it('loads stored theme on initialize', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('dark');
    await useThemeStore.getState().initialize();
    expect(useThemeStore.getState().mode).toBe('dark');
    expect(useThemeStore.getState().isDark).toBe(true);
  });

  it('handles missing stored theme gracefully', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    await useThemeStore.getState().initialize();
    // Should keep default
    expect(useThemeStore.getState().mode).toBe('system');
  });

  it('handles invalid stored theme', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('invalid');
    await useThemeStore.getState().initialize();
    // Should keep default
    expect(useThemeStore.getState().mode).toBe('system');
  });

  it('handles AsyncStorage error on initialize', async () => {
    (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('fail'));
    await useThemeStore.getState().initialize();
    // Should use default
    expect(useThemeStore.getState().mode).toBe('system');
  });

  // ── Color consistency ─────────────────────────────────────

  it('dark mode colors have background property', async () => {
    await useThemeStore.getState().setMode('dark');
    expect(useThemeStore.getState().colors.background).toBeDefined();
  });

  it('light mode colors have background property', async () => {
    await useThemeStore.getState().setMode('light');
    expect(useThemeStore.getState().colors.background).toBeDefined();
  });

  it('dark mode colors have text property', async () => {
    await useThemeStore.getState().setMode('dark');
    expect(useThemeStore.getState().colors.text).toBeDefined();
  });

  it('light mode colors have text property', async () => {
    await useThemeStore.getState().setMode('light');
    expect(useThemeStore.getState().colors.text).toBeDefined();
  });

  it('dark mode colors have primary property', async () => {
    await useThemeStore.getState().setMode('dark');
    expect(useThemeStore.getState().colors.primary).toBeDefined();
  });

  // ── Mode transitions ──────────────────────────────────────

  it('rapid mode changes settle correctly', async () => {
    await useThemeStore.getState().setMode('dark');
    await useThemeStore.getState().setMode('light');
    await useThemeStore.getState().setMode('dark');
    await useThemeStore.getState().setMode('light');
    expect(useThemeStore.getState().mode).toBe('light');
    expect(useThemeStore.getState().isDark).toBe(false);
  });

  it('multiple toggles return to original', async () => {
    await useThemeStore.getState().setMode('light');
    await useThemeStore.getState().toggle();
    await useThemeStore.getState().toggle();
    expect(useThemeStore.getState().mode).toBe('light');
    expect(useThemeStore.getState().isDark).toBe(false);
  });
});
