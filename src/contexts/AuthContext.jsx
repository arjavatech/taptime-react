import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { supabase } from '../config/supabase';
import { googleSignInCheck, getTimeZone } from '../api.js';
import AccountDeletionModal from '../components/ui/AccountDeletionModal';
import { useAutoLogout } from '../hooks/useAutoLogout';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAccountDeletionModal, setShowAccountDeletionModal] = useState(false);
  const [deletedAccountType, setDeletedAccountType] = useState('');
  const [accountDeleted, setAccountDeleted] = useState(false);

  // Auto-logout for inactive users
  useAutoLogout(() => {
    if (user) {
      signOut();
    }
  }, 5); // 5 minutes

  // Check if account has been deleted
  const checkAccountDeletion = useCallback(async (email) => {
    // If account already detected as deleted, don't make API calls
    if (accountDeleted) return true;
    
    try {
      const result = await googleSignInCheck(email);
      if (!result.success && result.deleted) {
        const adminType = localStorage.getItem('adminType') || 
                         localStorage.getItem('ADMIN_TYPE') || 
                         'Account';
        setDeletedAccountType(adminType);
        setShowAccountDeletionModal(true);
        setAccountDeleted(true);
        return true;
      }
      return false;
    } catch (error) {
      // If API call fails, check error message for deletion indicators
      const errorMsg = error.message.toLowerCase();
      if (errorMsg.includes('not found') || 
          errorMsg.includes('deleted') || 
          errorMsg.includes('404')) {
        const adminType = localStorage.getItem('adminType') || 
                         localStorage.getItem('ADMIN_TYPE') || 
                         'Account';
        setDeletedAccountType(adminType);
        setShowAccountDeletionModal(true);
        setAccountDeleted(true);
        return true;
      }
      return false;
    }
  }, [accountDeleted]);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []); // Only run once on mount

  // Check account deletion on page focus/visibility change
  useEffect(() => {
    if (!user || accountDeleted) return;

    const handleVisibilityChange = async () => {
      if (!document.hidden) {
        const userEmail = user?.email || localStorage.getItem('adminMail');
        if (userEmail) {
          await checkAccountDeletion(userEmail);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user, checkAccountDeletion, accountDeleted]);

  // Sign in with email and password
  const signInWithEmail = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  // Sign up with email and password
  const signUpWithEmail = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  // Sign in with Google OAuth
  const signInWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/login`,
          queryParams: {
            // Force Google to show account picker every time
            // This allows users to choose which Gmail account to use
            prompt: 'select_account'
          }
        },
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      // Clear sessionStorage first to remove cached OAuth state and browser session
      sessionStorage.clear();

      const { error } = await supabase.auth.signOut();
      
      // Always clear localStorage regardless of Supabase logout success/failure
      localStorage.clear();
      
      // If there's a 403 error, it's likely due to an expired session
      // We can safely ignore this since we've already cleared local storage
      if (error && error.status !== 403) {
        throw error;
      }

      return { error: null };
    } catch (error) {
      // Even if logout fails, clear local storage to ensure user is logged out locally
      localStorage.clear();
      sessionStorage.clear();
      
      // For 403 errors, treat as successful logout since session is already invalid
      if (error.status === 403) {
        return { error: null };
      }
      
      return { error };
    }
  };

  // Reset password
  const resetPassword = async (email) => {
    try {
      // First check if email exists in database
      const emailCheck = await googleSignInCheck(email);
      
      if (!emailCheck.success) {
        return { data: null, error: "You are not a user" };
      }

      const { data, error } = await supabase.auth.resetPasswordForEmail(email);

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  // Fetch backend user data after Supabase authentication
  // Called for BOTH email/password and Google OAuth logins
  // Wrapped in useCallback to prevent unnecessary re-renders
  const fetchBackendUserData = useCallback(async (email, userName = null, userPicture = null) => {
    try {
      console.log(`fetchBackendUserData called with email: ${email}`);

      // Step 1: Check if account has been deleted
      const isDeleted = await checkAccountDeletion(email);
      if (isDeleted) {
        return {
          success: false,
          error: 'Account has been deleted'
        };
      }

      // Step 2: Validate email with backend and get companyID
      // This validates the email exists in the backend employee database
      // and fetches company, timezone, and customer data
      const result = await googleSignInCheck(email);

      console.log('googleSignInCheck API result:', result);

      if (!result.success) {
        console.error('Backend validation failed:', result.error);
        return {
          success: false,
          error: result.error || 'Failed to validate user with backend'
        };
      }

      const companyID = result.companyID;

      // Step 3: Store user information in localStorage
      if (userName) {
        localStorage.setItem('userName', userName);
      }
      if (userPicture) {
        localStorage.setItem('userPicture', userPicture);
      } else {
        // Remove any existing userPicture to ensure fallback is used
        localStorage.removeItem('userPicture');
      }

      // Step 4: Fetch timezone data
      await getTimeZone(companyID);

      // Step 5: Fetch customer data

      return { success: true, companyID };
    } catch (error) {
      console.error('Error fetching backend user data:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch user data from backend'
      };
    }
  }, [checkAccountDeletion]); // Depend on checkAccountDeletion

  // Handle account deletion modal close
  const handleAccountDeletionModalClose = useCallback(async () => {
    setShowAccountDeletionModal(false);
    await signOut();
    // Redirect to login page
    window.location.href = '/login';
  }, [signOut]);

  // Check account deletion on navigation
  const checkOnNavigation = useCallback(async () => {
    if (!user) return;
    const userEmail = user?.email || localStorage.getItem('adminMail');
    if (userEmail) {
      await checkAccountDeletion(userEmail);
    }
  }, [user, checkAccountDeletion]);

  const value = {
    user,
    session,
    loading,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signOut,
    resetPassword,
    fetchBackendUserData,
    checkAccountDeletion,
    checkOnNavigation,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      <AccountDeletionModal
        isOpen={showAccountDeletionModal}
        onClose={handleAccountDeletionModalClose}
        accountType={deletedAccountType}
      />
    </AuthContext.Provider>
  );
};
