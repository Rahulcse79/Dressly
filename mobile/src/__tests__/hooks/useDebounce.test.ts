// ─── useDebounce Hook Tests ─────────────────────────────────────────────────

import { renderHook, act } from '@testing-library/react-native';
import { useDebounce } from '../../hooks/useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ── Basic Functionality ───────────────────────────────────

  it('returns initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 300));
    expect(result.current).toBe('initial');
  });

  it('does not update until delay has passed', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'first', delay: 300 } }
    );

    rerender({ value: 'second', delay: 300 });
    expect(result.current).toBe('first');

    act(() => {
      jest.advanceTimersByTime(200);
    });
    expect(result.current).toBe('first');
  });

  it('updates after delay passes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'first', delay: 300 } }
    );

    rerender({ value: 'second', delay: 300 });

    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(result.current).toBe('second');
  });

  it('resets timer on rapid changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'a', delay: 300 } }
    );

    rerender({ value: 'b', delay: 300 });
    act(() => { jest.advanceTimersByTime(100); });

    rerender({ value: 'c', delay: 300 });
    act(() => { jest.advanceTimersByTime(100); });

    rerender({ value: 'd', delay: 300 });
    act(() => { jest.advanceTimersByTime(100); });

    // After 100ms from last change, not yet
    expect(result.current).toBe('a');

    act(() => { jest.advanceTimersByTime(200); });
    // Now 300ms from last change
    expect(result.current).toBe('d');
  });

  // ── Different Delays ──────────────────────────────────────

  it('works with 0ms delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'init', delay: 0 } }
    );

    rerender({ value: 'updated', delay: 0 });
    act(() => { jest.advanceTimersByTime(0); });
    expect(result.current).toBe('updated');
  });

  it('uses default 300ms delay', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value),
      { initialProps: { value: 'init' } }
    );

    rerender({ value: 'updated' });

    act(() => { jest.advanceTimersByTime(299); });
    expect(result.current).toBe('init');

    act(() => { jest.advanceTimersByTime(1); });
    expect(result.current).toBe('updated');
  });

  it('works with long delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'init', delay: 2000 } }
    );

    rerender({ value: 'updated', delay: 2000 });

    act(() => { jest.advanceTimersByTime(1999); });
    expect(result.current).toBe('init');

    act(() => { jest.advanceTimersByTime(1); });
    expect(result.current).toBe('updated');
  });

  // ── Type Support ──────────────────────────────────────────

  it('works with numbers', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 0, delay: 300 } }
    );

    rerender({ value: 42, delay: 300 });
    act(() => { jest.advanceTimersByTime(300); });
    expect(result.current).toBe(42);
  });

  it('works with objects', () => {
    const obj1 = { name: 'Alice' };
    const obj2 = { name: 'Bob' };

    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: obj1, delay: 300 } }
    );

    rerender({ value: obj2, delay: 300 });
    act(() => { jest.advanceTimersByTime(300); });
    expect(result.current).toEqual({ name: 'Bob' });
  });

  it('works with null values', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: null as string | null, delay: 300 } }
    );

    rerender({ value: 'non-null', delay: 300 });
    act(() => { jest.advanceTimersByTime(300); });
    expect(result.current).toBe('non-null');
  });

  it('works with boolean values', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: false, delay: 300 } }
    );

    rerender({ value: true, delay: 300 });
    act(() => { jest.advanceTimersByTime(300); });
    expect(result.current).toBe(true);
  });

  // ── Cleanup ───────────────────────────────────────────────

  it('cleans up timer on unmount', () => {
    const { unmount, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'init', delay: 300 } }
    );

    rerender({ value: 'updated', delay: 300 });
    unmount();

    // Should not throw
    act(() => { jest.advanceTimersByTime(300); });
  });

  // ── Search Input Simulation ───────────────────────────────

  it('simulates search-as-you-type', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: '', delay: 300 } }
    );

    // User types "d-r-e-s-s-l-y" with 50ms between keystrokes
    const chars = ['d', 'dr', 'dre', 'dres', 'dress', 'dressl', 'dressly'];
    chars.forEach((val, i) => {
      rerender({ value: val, delay: 300 });
      act(() => { jest.advanceTimersByTime(50); });
    });

    // Should still be empty since no 300ms gap
    expect(result.current).toBe('');

    // Wait remaining time
    act(() => { jest.advanceTimersByTime(300); });
    expect(result.current).toBe('dressly');
  });
});
