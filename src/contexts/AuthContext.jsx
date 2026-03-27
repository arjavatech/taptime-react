import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { googleSignInCheck, getTimeZone, clearApiCache } from '../api.js';
import AccountDeletionModal from '../components/ui/AccountDeletionModal';
import { useAutoLogout } from '../hooks/useAutoLogout';
import { useCompany } from './CompanyContext';
import { STORAGE_KEYS } from '../constants/index.js';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const { loadUserCompanies } = useCompany();
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAccountDeletionModal, setShowAccountDeletionModal] = useState(false);
  const [deletedAccountType, setDeletedAccountType] = useState('');
  const [accountDeleted, setAccountDeleted] = useState(false);
  const [isLoginInProgress, setIsLoginInProgress] = useState(false);

  
  // Auto-logout for inactive users
  useAutoLogout(() => {
    signOut();
  }, 8); // 8 minutes

  // Check if account has been deleted
  const checkAccountDeletion = useCallback(async (email) => {
    // If account already detected as deleted, don't make API calls
    if (accountDeleted) return true;
    
    try {
      const result = await googleSignInCheck(email, 'email');
      
      if (!result.success) {
        // Check if error message indicates account deletion
        const errorMsg = (result.error || '').toLowerCase();
        if (result.deleted || 
            errorMsg.includes('not found') || 
            errorMsg.includes('deleted') || 
            errorMsg.includes('may have been deleted')) {
          console.log('Account detected as deleted, showing modal');
          const adminType = localStorage.getItem('adminType') || localStorage.getItem('ADMIN_TYPE') || 'Account';
          setDeletedAccountType(adminType);
          setShowAccountDeletionModal(true);
          setAccountDeleted(true);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.log('Account deletion check error:', error);
      // If API call fails, check error message for deletion indicators
      const errorMsg = error.message.toLowerCase();
      if (errorMsg.includes('not found') || 
          errorMsg.includes('deleted') || 
          errorMsg.includes('404') ||
          errorMsg.includes('403') ||
          errorMsg.includes('access denied')) {
        console.log('Account deletion detected from error, showing modal');
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
      
      // Check if user had "Remember Me" enabled
      const rememberMe = localStorage.getItem('rememberMe') === 'true';
      const storedSession = localStorage.getItem('supabase.auth.token');
      
      // If no active session but user had rememberMe enabled, try to restore
      if (!session && rememberMe && storedSession) {
        try {
          const parsedSession = JSON.parse(storedSession);
          // Check if stored session is still valid (not expired)
          if (parsedSession.expires_at && new Date(parsedSession.expires_at * 1000) > new Date()) {
            setSession(parsedSession);
            setUser(parsedSession.user);
            // Store access token for API calls
            if (parsedSession.access_token) {
              localStorage.setItem("access_token", parsedSession.access_token);
            }
          } else {
            // Session expired, clean up
            localStorage.removeItem('supabase.auth.token');
            localStorage.removeItem('rememberMe');
          }
        } catch (e) {
          // Invalid stored session, clean up
          localStorage.removeItem('supabase.auth.token');
          localStorage.removeItem('rememberMe');
        }
      } else {
        setSession(session);
        setUser(session?.user ?? null);
        // Store access token for API calls if session exists
        if (session?.access_token) {
          localStorage.setItem("access_token", session.access_token);
        }
      }
      
      // If no session but localStorage has user data, clear it only on initial load
      if (!session && localStorage.getItem("adminMail") && !rememberMe) {
        // Only clear if this is not a remember me session
        const hasValidSession = storedSession && rememberMe;
        if (!hasValidSession) {
          localStorage.clear();
        }
      }
      
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
     
      
      setSession(session);
      setUser(session?.user ?? null);
      
      // Store access token for API calls when session changes
      if (session?.access_token) {
        localStorage.setItem("access_token", session.access_token);
      }
      
      // Only clear localStorage when session is lost AND user was actually logged out
      // Don't clear on company switches or other internal state changes
      if (!session && localStorage.getItem("adminMail") && _event === 'SIGNED_OUT') {
        localStorage.clear();
      }
      
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []); // Only run once on mount

  // Check account deletion on page focus/visibility change
  useEffect(() => {
    const handleVisibilityChange = async () => {
      // Only check when page becomes visible and user is logged in
      if (!document.hidden && user && !accountDeleted && !loading && !isLoginInProgress) {
        const userEmail = user?.email || localStorage.getItem('adminMail');
        if (userEmail) {
          await checkAccountDeletion(userEmail);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, checkAccountDeletion, accountDeleted, loading, isLoginInProgress]);

  // Sign in with email and password
  const signInWithEmail = async (email, password, rememberMe = false) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      // Handle session persistence based on rememberMe preference
      if (data.session) {
        localStorage.setItem("access_token", data.session.access_token);

        if (rememberMe) {
          // Store session info in localStorage for persistence
          localStorage.setItem('supabase.auth.token', JSON.stringify(data.session));
          
          
          console.log('Access token stored:', data.session.access_token);
          localStorage.setItem('rememberMe', 'true');
        } else {
          // Ensure localStorage is cleared for session-only login
          localStorage.removeItem('supabase.auth.token');
          localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
          localStorage.removeItem('rememberMe');
        }
      }
      
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
      // Clear API cache to prevent stale data
      clearApiCache();
      
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
      clearApiCache();
      
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
      const emailCheck = await googleSignInCheck(email, 'email');
      
      if (!emailCheck.success) {
        return { data: null, error: "You are not a user" };
      }

      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        emailRedirectTo: "https://dev.taptime-react.pages.dev/set-password"
});

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  // Fetch backend user data after Supabase authentication
  // Called for BOTH email/password and Google OAuth logins
  // Wrapped in useCallback to prevent unnecessary re-renders
  const fetchBackendUserData = useCallback(async (email, userName = null, userPicture = null, authMethod = 'google') => {
    try {
      setIsLoginInProgress(true);
      
      // For Google OAuth, generate a temporary token if no access_token is available
      let accessToken = localStorage.getItem("access_token");
      if (!accessToken && session) {
        // Try to get a fresh session
        const { data: { session: freshSession } } = await supabase.auth.getSession();
        if (freshSession?.access_token) {
          accessToken = freshSession.access_token;
          localStorage.setItem("access_token", accessToken);
          console.log('Fresh access token obtained:', accessToken);
        } else {
          // Generate a temporary token for API calls
          accessToken = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          localStorage.setItem("access_token", accessToken);
          console.log('Temporary access token generated:', accessToken);
        }
      }

      // Step 1: Validate email with backend and get companyID
      // This validates the email exists in the backend employee database
      // and fetches company, timezone, and customer data
      // CRITICAL: Pass the authMethod to ensure proper validation
      // Note: This single call will also detect if account is deleted
      const result = await googleSignInCheck(email, authMethod);

      if (!result.success) {
        // Check if the error indicates account deletion
        if (result.deleted) {
          const adminType = localStorage.getItem('adminType') || localStorage.getItem('ADMIN_TYPE') || 'Account';
          setDeletedAccountType(adminType);
          setShowAccountDeletionModal(true);
          setAccountDeleted(true);
        }
        console.error('Backend validation failed:', result.error);
        return {
          success: false,
          error: result.error || 'Failed to validate user with backend'
        };
      }

      const companyID = result.companyID;

      // Step 2: Store user information in localStorage
      if (userName) {
        localStorage.setItem('userName', userName);
      }
      if (userPicture) {
        console.log('Storing userPicture:', userPicture);
        localStorage.setItem('userPicture', userPicture);
      } else {
        // Remove any existing userPicture to ensure fallback is used
        localStorage.removeItem('userPicture');
      }

      // Step 3: Fetch timezone data
      await getTimeZone(companyID);

      // Step 4: Load user's companies for company switching
      const companiesResult = await loadUserCompanies(email);
      
      // Check if companies loading failed due to account deletion
      if (companiesResult && companiesResult.success === false && companiesResult.deleted) {
        return {
          success: false,
          error: 'Account has been deleted'
        };
      }

      return { success: true, companyID };
    } catch (error) {
      console.error('Error fetching backend user data:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch user data from backend'
      };
    } finally {
      setIsLoginInProgress(false);
    }
  }, [session]); // Depend on session

  // Handle account deletion modal close
  const handleAccountDeletionModalClose = useCallback(async () => {
    setShowAccountDeletionModal(false);
    await signOut();
    // Use React Router navigation instead of hard redirect
    navigate('/login', { replace: true });
  }, [signOut, navigate]);

  // Check account deletion on navigation - only when explicitly called
  const checkOnNavigation = useCallback(async () => {
    if (!user) return;
    const userEmail = user?.email || localStorage.getItem('adminMail');
    if (userEmail && !accountDeleted) {
      await checkAccountDeletion(userEmail);
    }
  }, [user, checkAccountDeletion, accountDeleted]);

  // Test function to manually trigger account deletion modal
  const testAccountDeletionModal = useCallback(() => {
    console.log('Manually triggering account deletion modal');
    const adminType = localStorage.getItem('adminType') || localStorage.getItem('ADMIN_TYPE') || 'Account';
    setDeletedAccountType(adminType);
    setShowAccountDeletionModal(true);
    setAccountDeleted(true);
  }, []);

  const value = useMemo(() => ({
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
    testAccountDeletionModal, // Add test function
  }), [
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
    testAccountDeletionModal,
  ]);

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
