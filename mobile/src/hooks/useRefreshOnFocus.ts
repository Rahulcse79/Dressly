// ══════════════════════════════════════════════════════════════
// Dressly — useRefreshOnFocus Hook (TanStack Query)
// ══════════════════════════════════════════════════════════════

import { useCallback, useRef } from 'react';
import { useFocusEffect } from 'expo-router';

/**
 * Refetch data when screen comes into focus.
 * Pass a TanStack Query refetch function.
 */
export function useRefreshOnFocus(refetch: () => void) {
  const isFirstTime = useRef(true);

  useFocusEffect(
    useCallback(() => {
      if (isFirstTime.current) {
        isFirstTime.current = false;
        return;
      }
      refetch();
    }, [refetch]),
  );
}
