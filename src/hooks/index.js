import { useState, useCallback } from 'react';

// Simple API hook
export const useApi = (apiFunction) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiFunction(...args);
      setData(result);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFunction]);

  return { data, loading, error, execute };
};

// Export modal close hook
export { useModalClose } from './useModalClose';

// Export ZIP code lookup hook
export { useZipLookup } from './useZipLookup';

// Export auto-logout hook
export { useAutoLogout } from './useAutoLogout';

// Export subscription check hook
export { default as useSubscriptionCheck } from './useSubscriptionCheck';