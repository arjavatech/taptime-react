import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { supabase } from '../config/supabase';
import { googleSignInCheck, getTimeZone, getCustomerData } from '../utils/apiUtils';

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

    return () => subscription.unsubscribe();
  }, []);

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
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Clear any additional localStorage items if needed
      localStorage.clear();

      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  // Reset password
  const resetPassword = async (email) => {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  // Fetch backend user data after Supabase authentication
  // Called ONLY for Google OAuth logins (email/password login skips this)
  // Wrapped in useCallback to prevent unnecessary re-renders
  const fetchBackendUserData = useCallback(async (email, userName = null, userPicture = null) => {
    try {
      // Step 1: Validate email with backend and get companyID
      // Note: This fetches company, timezone, and customer data from backend
      // Email/password logins skip this step and use only Supabase data
      const result = await googleSignInCheck(email);

      if (!result.success) {
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
        localStorage.setItem('userPicture', userPicture);
      }

      // Step 3: Fetch timezone data
      await getTimeZone(companyID);

      // Step 4: Fetch customer data
      await getCustomerData(companyID);

      return { success: true, companyID };
    } catch (error) {
      console.error('Error fetching backend user data:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch user data from backend'
      };
    }
  }, []); // Empty dependency array - function doesn't depend on external values

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
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
