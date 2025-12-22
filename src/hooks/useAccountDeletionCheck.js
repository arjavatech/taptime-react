import { useAuth } from '../contexts/AuthContext';

/**
 * Hook to manually trigger account deletion check
 * Useful for checking account status on critical operations
 */
export const useAccountDeletionCheck = () => {
  const { checkAccountDeletion, user } = useAuth();

  const triggerCheck = async () => {
    const userEmail = user?.email || localStorage.getItem('adminMail');
    if (userEmail) {
      return await checkAccountDeletion(userEmail);
    }
    return false;
  };

  return { triggerCheck };
};