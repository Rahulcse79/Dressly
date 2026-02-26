// ══════════════════════════════════════════════════════════════
// Dressly — useDebounce Hook
// ══════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react';

/**
 * Debounce a value by the given delay (ms).
 * Useful for search inputs, API calls on typing, etc.
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
