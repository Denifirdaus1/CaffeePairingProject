import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { authService, User } from '../services/authService';
import { supabase } from '../services/supabaseClient';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (data: any, logoFile?: File | null) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | undefined;

    const isProtectedRoute = location.pathname.startsWith('/dashboard');

    const initializeAuth = async () => {
      if (!isProtectedRoute) {
        // For public routes, don't block rendering or force auth
        setLoading(false);
        return;
      }

      try {
        console.log('Checking auth state...');
        const currentUser = await authService.getCurrentUser();
        console.log('Auth check result:', currentUser ? 'User found' : 'No user');
        setUser(currentUser);
      } catch (error) {
        console.error('Auth check failed:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    // Add timeout to prevent infinite loading on protected routes only
    if (isProtectedRoute) {
      timeoutId = setTimeout(() => {
        console.log('Auth check timeout, setting loading to false');
        setLoading(false);
      }, 5000);
    }

    // Start initial auth check
    initializeAuth();

    // Listen for auth changes (single subscription with proper cleanup)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!isProtectedRoute) {
          // Ignore auth updates on public routes
          return;
        }
        if (session?.user) {
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [location.pathname]);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      await authService.signIn(email, password);
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (data: any, logoFile?: File | null) => {
    setLoading(true);
    try {
      const result = await authService.signUp(data, logoFile);
      console.log('Signup successful:', result);
      // Set user immediately after successful signup
      setUser({
        id: result.user.id,
        email: result.user.email!,
        full_name: result.user.user_metadata?.full_name || '',
        cafe_profile: result.profile
      });
      console.log('User state set:', result.user.id);
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await authService.signOut();
      setUser(null);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data: any) => {
    try {
      await authService.updateCafeProfile(data);
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      throw error;
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
