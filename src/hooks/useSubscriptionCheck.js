import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSubscriptionStatus } from '../api';
import { STORAGE_KEYS } from '../constants';

/**
 * Custom hook to check subscription/trial status
 * Redirects to subscription page if trial expired
 *
 * Usage:
 * const { subscriptionStatus, isTrialExpired, loading } = useSubscriptionCheck();
 *
 * @param {boolean} shouldRedirect - If true, auto-redirect to subscription page when trial expired
 * @param {number} checkInterval - How often to check (in milliseconds). Default: 5 minutes
 * @returns {object} - { subscriptionStatus, isTrialExpired, loading, error }
 */
const useSubscriptionCheck = (shouldRedirect = true, checkInterval = 5 * 60 * 1000) => {
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [isTrialExpired, setIsTrialExpired] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const checkSubscription = async () => {
    const companyId = localStorage.getItem(STORAGE_KEYS.COMPANY_ID);
    const userType = localStorage.getItem(STORAGE_KEYS.ADMIN_TYPE);

    // Only check for Owners (not Admins or SuperAdmins)
    if (userType !== 'Owner') {
      setLoading(false);
      return;
    }

    if (!companyId) {
      setLoading(false);
      return;
    }

    try {
      const response = await getSubscriptionStatus(companyId);

      if (response.success) {
        const status = response.data;
        setSubscriptionStatus(status);

        // Check if trial is expired and no active subscription
        const expired = status.trial_expired &&
                       status.subscription_status !== 'active' &&
                       status.subscription_status !== 'trialing';

        setIsTrialExpired(expired);

        // Auto-redirect if trial expired and redirect enabled
        if (expired && shouldRedirect) {
          // Only redirect if not already on subscription page
          const currentPath = window.location.pathname;
          if (!currentPath.includes('/profile')) {
            navigate('/profile?tab=subscription', {
              state: { message: 'Your trial has expired. Please subscribe to continue.' }
            });
          }
        }
      } else {
        setError(response.error);
      }
    } catch (err) {
      console.error('Subscription check error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial check
    checkSubscription();

    // Set up periodic check
    const interval = setInterval(() => {
      checkSubscription();
    }, checkInterval);

    // Cleanup
    return () => clearInterval(interval);
  }, [checkInterval, shouldRedirect]);

  return {
    subscriptionStatus,
    isTrialExpired,
    loading,
    error,
    refetch: checkSubscription
  };
};

export default useSubscriptionCheck;
