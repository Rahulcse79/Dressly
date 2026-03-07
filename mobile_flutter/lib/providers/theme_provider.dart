// ══════════════════════════════════════════════════════════════
// Dressly — Theme Provider (Light / Dark / System)
// ══════════════════════════════════════════════════════════════

import 'package:flutter/material.dart' hide ThemeMode;
import 'package:flutter/scheduler.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../constants/constants.dart';
import '../models/models.dart' show ThemeMode;

class ThemeState {
  final ThemeMode mode;
  final bool isDark;
  final AppColors colors;

  const ThemeState({
    this.mode = ThemeMode.system,
    this.isDark = false,
    this.colors = lightColors,
  });

  ThemeState copyWith({
    ThemeMode? mode,
    bool? isDark,
    AppColors? colors,
  }) =>
      ThemeState(
        mode: mode ?? this.mode,
        isDark: isDark ?? this.isDark,
        colors: colors ?? this.colors,
      );
}

class ThemeNotifier extends StateNotifier<ThemeState> {
  ThemeNotifier() : super(const ThemeState()) {
    final brightness =
        SchedulerBinding.instance.platformDispatcher.platformBrightness;
    final systemDark = brightness == Brightness.dark;
    state = ThemeState(
      mode: ThemeMode.system,
      isDark: systemDark,
      colors: systemDark ? darkColors : lightColors,
    );
  }

  bool _resolveIsDark(ThemeMode mode) {
    if (mode == ThemeMode.system) {
      final brightness =
          SchedulerBinding.instance.platformDispatcher.platformBrightness;
      return brightness == Brightness.dark;
    }
    return mode == ThemeMode.dark;
  }

  Future<void> initialize() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final stored = prefs.getString(StorageKeys.themeMode);
      if (stored != null &&
          ['light', 'dark', 'system'].contains(stored)) {
        final mode = ThemeMode.values.firstWhere((e) => e.name == stored);
        final dark = _resolveIsDark(mode);
        state = ThemeState(
          mode: mode,
          isDark: dark,
          colors: dark ? darkColors : lightColors,
        );
      }
    } catch (_) {
      // Use default
    }
  }

  Future<void> setMode(ThemeMode mode) async {
    final dark = _resolveIsDark(mode);
    state = ThemeState(
      mode: mode,
      isDark: dark,
      colors: dark ? darkColors : lightColors,
    );
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(StorageKeys.themeMode, mode.name);
  }

  Future<void> toggle() async {
    final newMode = state.isDark ? ThemeMode.light : ThemeMode.dark;
    await setMode(newMode);
  }

  void onSystemBrightnessChanged() {
    if (state.mode == ThemeMode.system) {
      final dark = _resolveIsDark(ThemeMode.system);
      state = state.copyWith(
        isDark: dark,
        colors: dark ? darkColors : lightColors,
      );
    }
  }
}

final themeProvider =
    StateNotifierProvider<ThemeNotifier, ThemeState>((ref) => ThemeNotifier());
