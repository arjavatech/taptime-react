// Local Supabase replacement - uses raw data instead of external service
import { rawData } from '../data/rawData.js';

let currentUser = null;
let currentSession = null;
const listeners = [];

const notifyListeners = (event, session) => {
  listeners.forEach(callback => callback(event, session));
};

const mockSupabase = {
  auth: {
    async getSession() {
      return { data: { session: currentSession } };
    },

    async signInWithPassword({ email, password }) {
      const user = rawData.authUsers.find(u => u.email === email && u.password === password);
      if (!user) {
        return { data: null, error: { message: 'Invalid credentials' } };
      }

      const mockUser = {
        id: user.id,
        email: user.email,
        user_metadata: {
          full_name: `${user.first_name} ${user.last_name}`,
          name: `${user.first_name} ${user.last_name}`
        }
      };

      currentUser = mockUser;
      currentSession = {
        user: mockUser,
        access_token: 'mock_token',
        expires_at: Math.floor(Date.now() / 1000) + 3600
      };

      // Notify listeners of auth state change
      setTimeout(() => notifyListeners('SIGNED_IN', currentSession), 0);

      return { data: { user: mockUser, session: currentSession }, error: null };
    },

    async signInWithOAuth({ provider, options }) {
      // Simulate OAuth redirect
      window.location.href = `${window.location.origin}/login`;
      return { data: null, error: null };
    },

    async signOut() {
      currentUser = null;
      currentSession = null;
      
      // Notify listeners of auth state change
      setTimeout(() => notifyListeners('SIGNED_OUT', null), 0);
      
      return { error: null };
    },

    async resetPasswordForEmail(email) {
      const user = rawData.authUsers.find(u => u.email === email);
      if (!user) {
        return { data: null, error: { message: 'User not found' } };
      }
      return { data: {}, error: null };
    },

    onAuthStateChange(callback) {
      listeners.push(callback);
      return {
        data: {
          subscription: {
            unsubscribe: () => {
              const index = listeners.indexOf(callback);
              if (index > -1) listeners.splice(index, 1);
            }
          }
        }
      };
    }
  }
};

export const supabase = mockSupabase;