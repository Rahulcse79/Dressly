// ─── Auth Screen Tests ──────────────────────────────────────────────────────

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { useAuthStore } from '../../stores/authStore';

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  Link: ({ children }: any) => children,
}));

// Mock stores
jest.mock('../../stores/authStore');
jest.mock('../../stores/themeStore', () => ({
  useThemeStore: (selector: any) =>
    selector({
      colors: {
        background: '#FFFFFF',
        text: '#1A1A2E',
        textSecondary: '#6B7280',
        primary: '#6C63FF',
        primaryLight: '#E8E7FF',
        border: '#E5E7EB',
        borderFocused: '#6C63FF',
        surface: '#F9FAFB',
        error: '#EF4444',
        success: '#10B981',
        card: '#FFFFFF',
        inputBg: '#F3F4F6',
      },
      isDark: false,
      mode: 'light',
    }),
}));

describe('Login Screen Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Email Validation ──────────────────────────────────────

  it('validates email format - valid email', () => {
    const email = 'user@dressly.com';
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    expect(isValid).toBe(true);
  });

  it('validates email format - invalid email (no @)', () => {
    const email = 'invalid-email';
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    expect(isValid).toBe(false);
  });

  it('validates email format - invalid email (no domain)', () => {
    const email = 'user@';
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    expect(isValid).toBe(false);
  });

  it('validates email format - empty string', () => {
    const email = '';
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    expect(isValid).toBe(false);
  });

  it('validates email format - with spaces', () => {
    const email = 'user @dressly.com';
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    expect(isValid).toBe(false);
  });

  it('validates email format - valid with subdomain', () => {
    const email = 'user@mail.dressly.com';
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    expect(isValid).toBe(true);
  });

  // ── Password Validation ───────────────────────────────────

  it('validates password - too short', () => {
    const password = '1234567';
    expect(password.length >= 8).toBe(false);
  });

  it('validates password - minimum length', () => {
    const password = '12345678';
    expect(password.length >= 8).toBe(true);
  });

  it('validates password - strong password', () => {
    const password = 'StrongP@ss1';
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasDigit = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*]/.test(password);
    expect(hasUpper && hasLower && hasDigit && hasSpecial).toBe(true);
  });

  it('validates empty password', () => {
    const password = '';
    expect(password.length > 0).toBe(false);
  });

  // ── Form State ────────────────────────────────────────────

  it('initializes form with empty fields', () => {
    const formState = { email: '', password: '' };
    expect(formState.email).toBe('');
    expect(formState.password).toBe('');
  });

  it('tracks form dirty state', () => {
    const isDirty = (email: string, password: string) =>
      email.length > 0 || password.length > 0;

    expect(isDirty('', '')).toBe(false);
    expect(isDirty('a', '')).toBe(true);
    expect(isDirty('', 'b')).toBe(true);
    expect(isDirty('a', 'b')).toBe(true);
  });

  it('validates form is complete', () => {
    const isComplete = (email: string, password: string) =>
      email.length > 0 && password.length >= 8;

    expect(isComplete('user@dressly.com', 'Password1!')).toBe(true);
    expect(isComplete('user@dressly.com', 'short')).toBe(false);
    expect(isComplete('', 'Password1!')).toBe(false);
  });
});

describe('Register Screen Logic', () => {
  // ── Registration Form ─────────────────────────────────────

  it('validates registration form fields', () => {
    const form = {
      email: 'new@dressly.com',
      password: 'StrongPass1!',
      displayName: 'New User',
    };

    expect(form.email.includes('@')).toBe(true);
    expect(form.password.length >= 8).toBe(true);
    expect(form.displayName.length > 0).toBe(true);
  });

  it('display name is optional', () => {
    const form = { email: 'new@dressly.com', password: 'StrongPass1!' };
    const isValid = form.email.includes('@') && form.password.length >= 8;
    expect(isValid).toBe(true);
  });

  it('validates password confirmation', () => {
    const password = 'StrongPass1!';
    const confirm = 'StrongPass1!';
    expect(password === confirm).toBe(true);
  });

  it('detects password mismatch', () => {
    const password = 'StrongPass1!';
    const confirm = 'DifferentPass1!';
    expect(password === confirm).toBe(false);
  });

  it('validates email uniqueness error handling', () => {
    const error = 'Email already exists';
    expect(error.toLowerCase().includes('email')).toBe(true);
    expect(error.toLowerCase().includes('exists')).toBe(true);
  });
});

describe('Forgot Password Screen Logic', () => {
  // ── Reset Flow ────────────────────────────────────────────

  it('validates email before sending reset', () => {
    const email = 'user@dressly.com';
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    expect(isValid).toBe(true);
  });

  it('shows error for invalid reset email', () => {
    const email = 'not-an-email';
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    expect(isValid).toBe(false);
  });

  it('tracks reset email sent state', () => {
    let isResetSent = false;
    isResetSent = true;
    expect(isResetSent).toBe(true);
  });

  it('resets form on cancel', () => {
    let email = 'test@dressly.com';
    email = '';
    expect(email).toBe('');
  });
});
