import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { googleSignInCheck, getTimeZone } from '../api.js';
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
      if (!result.success && result.deleted) {
        const adminType = localStorage.getItem('adminType') || localStorage.getItem('ADMIN_TYPE') || 'Account';
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
      console.log('=== INITIAL SESSION DEBUG ===');
      console.log('Raw session from getSession:', session);
      console.log('Session access_token:', session?.access_token);
      console.log('============================');
      
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
          console.log('Access token stored from initial session:', session.access_token);
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
      console.log('=== AUTH STATE CHANGE DEBUG ===');
      console.log('Event:', _event);
      console.log('Session from onAuthStateChange:', session);
      console.log('Session access_token:', session?.access_token);
      console.log('===============================');
      
      setSession(session);
      setUser(session?.user ?? null);
      
      // Store access token for API calls when session changes
      if (session?.access_token) {
        localStorage.setItem("access_token", session.access_token);
        console.log('Access token stored from auth state change:', session.access_token);
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
      if (!document.hidden && user && !accountDeleted) {
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
  const signInWithEmail = async (email, password, rememberMe = false) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      // Handle session persistence based on rememberMe preference
      if (data.session) {
        console.log('signInWithEmail session:', data.session);
        localStorage.setItem("access_token", data.session.access_token);
        console.log(localStorage.getItem("access_token"));
        console.log("-----------------------------------------------------");

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
      const emailCheck = await googleSignInCheck(email, 'email');
      
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
  const fetchBackendUserData = useCallback(async (email, userName = null, userPicture = null, authMethod = 'google') => {
    try {
      console.log(`fetchBackendUserData called with email: ${email}, authMethod: ${authMethod}`);
      
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
      
      console.log("access_token:", accessToken);

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
      // CRITICAL: Pass the authMethod to ensure proper validation
      const result = await googleSignInCheck(email, authMethod);

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

      // Step 5: Load user's companies for company switching
      await loadUserCompanies(email);

      return { success: true, companyID };
    } catch (error) {
      console.error('Error fetching backend user data:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch user data from backend'
      };
    }
  }, [checkAccountDeletion, session]); // Depend on checkAccountDeletion and session

  // Handle account deletion modal close
  const handleAccountDeletionModalClose = useCallback(async () => {
    setShowAccountDeletionModal(false);
    await signOut();
    // Use React Router navigation instead of hard redirect
    navigate('/login', { replace: true });
  }, [signOut, navigate]);

  // Check account deletion on navigation
  const checkOnNavigation = useCallback(async () => {
    if (!user) return;
    const userEmail = user?.email || localStorage.getItem('adminMail');
    if (userEmail) {
      await checkAccountDeletion(userEmail);
    }
  }, [user, checkAccountDeletion]);

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
