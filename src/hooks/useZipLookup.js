import { useState, useEffect, useRef } from 'react';
import { lookupZipCode } from '../utils/zipLookup';

/**
 * Custom hook for ZIP code lookup with debouncing
 * @param {string} zipCode - Current ZIP code value
 * @param {function} onResult - Callback when city/state is found: ({city, state}) => void
 * @param {number} debounceMs - Debounce delay in milliseconds (default 300ms)
 * @returns {{ isLoading: boolean }}
 */
export const useZipLookup = (zipCode, onResult, debounceMs = 300) => {
  const [isLoading, setIsLoading] = useState(false);
  const timeoutRef = useRef(null);
  const onResultRef = useRef(onResult);

  // Keep onResult ref up to date to avoid stale closures
  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    // Clear any pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Only proceed if we have exactly 5 digits
    if (!zipCode || zipCode.length !== 5) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Debounce the API call
    timeoutRef.current = setTimeout(async () => {
      try {
        const result = await lookupZipCode(zipCode);

        if (result && onResultRef.current) {
          onResultRef.current(result);
        }
      } catch (err) {
        // Fail silently - user can manually enter city/state
        console.error('ZIP lookup failed:', err);
      } finally {
        setIsLoading(false);
      }
    }, debounceMs);

    // Cleanup on unmount or when zipCode changes
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [zipCode, debounceMs]);

  return { isLoading };
};
