// ══════════════════════════════════════════════════════════════
// Dressly Web — Theme Context (Dark / Light / System)
// ══════════════════════════════════════════════════════════════

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext(null);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};

const THEME_KEY = 'dressly.theme-mode';

export const ThemeProvider = ({ children }) => {
  const [mode, setModeState] = useState(() => {
    return localStorage.getItem(THEME_KEY) || 'dark';
  });

  const resolvedTheme = mode === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : mode;

  const isDark = resolvedTheme === 'dark';

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolvedTheme);
    document.documentElement.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);

  // Listen for system theme changes
  useEffect(() => {
    if (mode !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => setModeState('system'); // force re-render
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [mode]);

  const setMode = useCallback((newMode) => {
    localStorage.setItem(THEME_KEY, newMode);
    setModeState(newMode);
  }, []);

  const toggleTheme = useCallback(() => {
    setMode(isDark ? 'light' : 'dark');
  }, [isDark, setMode]);

  return (
    <ThemeContext.Provider value={{ mode, resolvedTheme, isDark, setMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
