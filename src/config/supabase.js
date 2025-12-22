import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

// Validate environment variables
if (supabaseUrl === 'https://placeholder.supabase.co' || supabaseAnonKey === 'placeholder-key') {
  console.warn('Using placeholder Supabase credentials. Please configure your .env file.');
}

// Custom storage that uses sessionStorage for auth tokens
const customStorage = {
  getItem: (key) => {
    if (key.includes('supabase.auth.token')) {
      return sessionStorage.getItem(key);
    }
    return localStorage.getItem(key);
  },
  setItem: (key, value) => {
    if (key.includes('supabase.auth.token')) {
      sessionStorage.setItem(key, value);
    } else {
      localStorage.setItem(key, value);
    }
  },
  removeItem: (key) => {
    if (key.includes('supabase.auth.token')) {
      sessionStorage.removeItem(key);
    } else {
      localStorage.removeItem(key);
    }
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: customStorage
  }
});
