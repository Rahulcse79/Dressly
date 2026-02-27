// ─── Test Utilities ─────────────────────────────────────────────────────────
// Shared test helpers, mock factories, render wrappers.

import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type {
  User,
  WardrobeItem,
  OutfitGeneration,
  Subscription,
  Notification,
} from '../types';

// ── Query Client for Tests ──────────────────────────────────────

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

// ── Render with Providers ───────────────────────────────────────

interface WrapperProps {
  children: React.ReactNode;
}

export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  const queryClient = createTestQueryClient();

  function Wrapper({ children }: WrapperProps) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...options }),
    queryClient,
  };
}

// ── Mock Data Factories ─────────────────────────────────────────

let idCounter = 0;

function nextId(): string {
  idCounter++;
  return `test-uuid-${idCounter}`;
}

export function mockUser(overrides: Partial<User> = {}): User {
  return {
    id: nextId(),
    email: `user${idCounter}@dressly.com`,
    role: 'user',
    is_verified: true,
    is_active: true,
    display_name: 'Test User',
    avatar_url: null,
    gender: null,
    body_type: null,
    style_preferences: null,
    color_preferences: null,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

export function mockAdminUser(overrides: Partial<User> = {}): User {
  return mockUser({ role: 'admin', display_name: 'Admin User', ...overrides });
}

export function mockProUser(overrides: Partial<User> = {}): User {
  return mockUser({ role: 'pro', display_name: 'Pro User', ...overrides });
}

export function mockWardrobeItem(overrides: Partial<WardrobeItem> = {}): WardrobeItem {
  return {
    id: nextId(),
    user_id: nextId(),
    image_url: `https://cdn.dressly.com/images/item-${idCounter}.jpg`,
    category: 'top',
    color: 'Navy Blue',
    brand: 'Nike',
    occasion_tags: ['casual'],
    season: 'allseason',
    metadata: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

export function mockOutfitGeneration(overrides: Partial<OutfitGeneration> = {}): OutfitGeneration {
  return {
    id: nextId(),
    user_id: nextId(),
    prompt_text: 'Create a casual summer outfit',
    input_image_urls: [],
    output_image_url: null,
    style_score: 85.5,
    occasion: 'casual',
    ai_feedback: 'Great outfit combination! The colors work well together.',
    model_version: 'gemini-2.0-flash',
    latency_ms: 1234,
    status: 'completed',
    error_message: null,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

export function mockSubscription(overrides: Partial<Subscription> = {}): Subscription {
  return {
    id: nextId(),
    user_id: nextId(),
    plan_type: 'pro',
    status: 'active',
    price_inr: 499,
    starts_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

export function mockNotification(overrides: Partial<Notification> = {}): Notification {
  return {
    id: nextId(),
    user_id: nextId(),
    title: 'AI Generation Complete',
    body: 'Your outfit generation is ready!',
    notification_type: 'ai_generation_complete',
    is_read: false,
    data: null,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

// ── Mock Auth State ─────────────────────────────────────────────

interface MockAuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}

export function mockAuthState(overrides: Partial<MockAuthState> = {}): MockAuthState {
  return {
    user: mockUser(),
    isAuthenticated: true,
    isLoading: false,
    isInitialized: true,
    error: null,
    ...overrides,
  };
}

// ── Mock API Response ───────────────────────────────────────────

export function mockApiResponse<T>(data: T, message?: string) {
  return {
    success: true,
    data,
    message: message || null,
  };
}

export function mockApiError(code: string, message: string) {
  return {
    success: false,
    error: {
      code,
      message,
      details: null,
    },
  };
}

// ── Wait Utilities ──────────────────────────────────────────────

export const waitForAsync = () => new Promise((r) => setTimeout(r, 0));

export function flushPromises() {
  return new Promise((resolve) => setImmediate(resolve));
}

// ── Reset Helpers ───────────────────────────────────────────────

export function resetIdCounter() {
  idCounter = 0;
}

// ── Assertion Helpers ───────────────────────────────────────────

export function expectToBeAccessible(component: any) {
  // Basic accessibility check
  expect(component).toBeTruthy();
}
