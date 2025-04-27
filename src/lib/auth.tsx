import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { getSupabase, refreshSupabaseClient } from './supabase';

// Helper function to get the correct site URL for redirects
const getSiteUrl = (): string => {
  // For production, always use the production URL directly
  if (process.env.NODE_ENV === 'production') {
    return 'https://arabic-stories.vercel.app';
  }
  
  // For development, return localhost
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }
  
  // Fallback to environment variable or window.location.origin as last resort
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.trim().replace(/\/$/, '');
  }
  
  if (typeof window !== 'undefined') {
    // Check if we're on localhost in browser
    const origin = window.location.origin;
    if (origin.includes('localhost')) {
      return 'http://localhost:3000';
    }
    return origin;
  }
  
  // Final fallback for SSR without configured environment
  return 'https://arabic-stories.vercel.app';
};

// Define auth context type
type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any, user: User | null }>;
  signOut: () => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  isPaid: boolean;
  refreshPaymentStatus: () => Promise<boolean>;
  recoverConnection: () => Promise<boolean>;
};

// Create auth context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  signIn: () => Promise.resolve({ error: null }),
  signInWithGoogle: () => Promise.resolve({ error: null }),
  signUp: () => Promise.resolve({ error: null, user: null }),
  signOut: () => Promise.resolve({ error: null }),
  resetPassword: () => Promise.resolve({ error: null }),
  isPaid: false,
  refreshPaymentStatus: () => Promise.resolve(false),
  recoverConnection: () => Promise.resolve(false),
});

// Auth provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaid, setIsPaid] = useState(false);
  const [connectionError, setConnectionError] = useState<boolean>(false);

  // Function to initialize Supabase auth
  const initializeAuth = async () => {
    try {
      const supabase = getSupabase();
      if (!supabase) {
        setConnectionError(true);
        return;
      }

      // Check for current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("Error getting session:", sessionError);
        setConnectionError(true);
        return;
      }
      
      setSession(session);
      setUser(session?.user || null);
      setConnectionError(false);

      // If user exists, check if they've paid
      if (session?.user) {
        console.log("Auth: checking payment status for user", session.user.id);
        const { data, error } = await supabase
          .from('profiles')
          .select('has_paid')
          .eq('id', session.user.id)
          .single();
        
        if (error) {
          console.error("Error fetching payment status:", error);
        } else {
          console.log("Auth: payment status data:", data);
          setIsPaid(data?.has_paid === true);
        }
      }

      // Set up auth state listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log("Auth state change event:", event);
          setSession(session);
          setUser(session?.user || null);
          
          // When user signs in, check paid status
          if (session?.user) {
            console.log("Auth state change: checking payment status");
            const { data, error } = await supabase
              .from('profiles')
              .select('has_paid')
              .eq('id', session.user.id)
              .single();
            
            if (error) {
              console.error("Error fetching payment status on auth change:", error);
            } else {
              console.log("Auth state change: payment status:", data);
              setIsPaid(data?.has_paid === true);
            }
          } else {
            // Reset paid status if logged out
            setIsPaid(false);
          }
        }
      );

      setIsLoading(false);
      
      // Cleanup subscription on unmount
      return () => {
        subscription.unsubscribe();
      };
    } catch (error) {
      console.error('Error initializing auth:', error);
      setConnectionError(true);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initializeAuth();
    
    // Setup a recovery interval to check connection status
    const recoveryInterval = setInterval(() => {
      if (connectionError) {
        console.log("Attempting to recover Supabase connection...");
        recoverConnection();
      }
    }, 30000); // Check every 30 seconds
    
    return () => {
      clearInterval(recoveryInterval);
    };
  }, [connectionError]);

  // Recover connection function
  const recoverConnection = async (): Promise<boolean> => {
    console.log("Executing connection recovery...");
    try {
      // Refresh the Supabase client first
      const supabase = refreshSupabaseClient();
      if (!supabase) {
        console.error("Failed to refresh Supabase client");
        return false;
      }
      
      // Verify connection by getting session
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Connection recovery failed:", error);
        return false;
      }
      
      console.log("Connection recovery succeeded");
      setConnectionError(false);
      
      // Re-initialize auth
      await initializeAuth();
      return true;
    } catch (error) {
      console.error("Error during connection recovery:", error);
      return false;
    }
  };

  // Sign in with email
  const signIn = async (email: string, password: string) => {
    const supabase = getSupabase();
    if (!supabase) return { error: new Error('Supabase client not initialized') };
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (!error) {
        setConnectionError(false);
      }
      
      return { error };
    } catch (error) {
      console.error("Sign in error:", error);
      setConnectionError(true);
      return { error };
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    const supabase = getSupabase();
    if (!supabase) return { error: new Error('Supabase client not initialized') };
    
    try {
      // Get current origin to handle both production and development environments
      const origin = getSiteUrl();
      const redirectUrl = `${origin}/auth/callback`;
      
      console.log('Google Auth - Environment:', process.env.NODE_ENV);
      console.log('Google Auth - Redirect URL:', redirectUrl);
      console.log('Google Auth - Origin URL:', origin);
      
      // Detection for incorrect localhost usage in production
      if (process.env.NODE_ENV === 'production') {
        if (redirectUrl.includes('localhost')) {
          console.error('CRITICAL ERROR: Detected localhost in production redirect URL. This will cause authentication to fail.');
          console.error('Environment check:', {
            NODE_ENV: process.env.NODE_ENV,
            SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'not set',
            window_location: typeof window !== 'undefined' ? window.location.href : 'SSR'
          });
          
          // Force production URL for Google auth
          const productionRedirectUrl = 'https://arabic-stories.vercel.app/auth/callback';
          console.log('Forcing production redirect URL:', productionRedirectUrl);
          
          const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: productionRedirectUrl,
              queryParams: {
                prompt: 'select_account',
                access_type: 'offline',
                from_signup: 'true'
              }
            }
          });
          
          if (!error) {
            setConnectionError(false);
          }
          
          return { error };
        }
      }
      
      // Normal flow with the correct redirect URL
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            prompt: 'select_account',
            access_type: 'offline',
            from_signup: 'true'
          }
        }
      });
      
      if (!error) {
        setConnectionError(false);
      }
      
      return { error };
    } catch (error) {
      console.error("Google sign in error:", error);
      setConnectionError(true);
      return { error };
    }
  };

  // Sign up with email
  const signUp = async (email: string, password: string) => {
    const supabase = getSupabase();
    if (!supabase) return { error: new Error('Supabase client not initialized'), user: null };
    
    try {
      // Get current origin if we need to set a redirect URL in the future
      const origin = getSiteUrl();
      console.log('Signup - Environment:', process.env.NODE_ENV);
      console.log('Signup - Origin URL:', origin);
      
      // Ensure we never use localhost in production
      if (process.env.NODE_ENV === 'production' && origin.includes('localhost')) {
        console.error('ERROR: Localhost detected in production origin. Using hardcoded production URL.');
      }
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: undefined,  // Don't redirect to any URL
          data: {
            confirmed_at: new Date().toISOString(),  // Pre-confirm the email
          }
        }
      });
      
      if (!error) {
        setConnectionError(false);
      }
      
      return { error, user: data.user };
    } catch (error) {
      console.error("Sign up error:", error);
      setConnectionError(true);
      return { error: error instanceof Error ? error : new Error('Unknown error during signup'), user: null };
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      // First try with a refreshed client
      const supabase = refreshSupabaseClient();
      if (!supabase) {
        console.error('Could not initialize Supabase client for signout');
        return { error: new Error('Supabase client not initialized') };
      }
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      // Clear stored session data aggressively
      if (typeof window !== 'undefined') {
        try {
          // Clear all potential auth storage keys
          localStorage.removeItem('arabic-stories-auth');
          localStorage.removeItem('supabase.auth.token');
          
          // Clear any cookies by setting expired date
          document.cookie.split(";").forEach(function(c) {
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
          });
          
          // Wait a bit for cookies to clear
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Reset auth state
          setUser(null);
          setSession(null);
          setIsPaid(false);
        } catch (e) {
          console.warn("Error clearing local storage:", e);
        }
      }
      
      console.log("Sign out completed, error:", error);
      
      // Force refresh of client on next use
      refreshSupabaseClient();
      
      return { error };
    } catch (error) {
      console.error("Sign out error:", error);
      return { error };
    }
  };

  // Reset password
  const resetPassword = async (email: string) => {
    const supabase = getSupabase();
    if (!supabase) return { error: new Error('Supabase client not initialized') };
    
    try {
      // Get current origin to handle both production and development environments
      const origin = getSiteUrl();
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/auth/reset-password`,
      });
      
      return { error };
    } catch (error) {
      console.error("Reset password error:", error);
      return { error };
    }
  };

  // Update profile with payment status
  const updatePaymentStatus = async (hasPaid: boolean) => {
    if (!user) return { error: new Error('User not authenticated') };
    
    const supabase = getSupabase();
    if (!supabase) return { error: new Error('Supabase client not initialized') };
    
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({ id: user.id, has_paid: hasPaid });
      
      if (!error) {
        setIsPaid(hasPaid);
      }
      
      return { error };
    } catch (error) {
      console.error("Update payment status error:", error);
      return { error };
    }
  };

  // Check and update payment status from database
  const refreshPaymentStatus = async (): Promise<boolean> => {
    if (!user) return false;
    
    const supabase = getSupabase();
    if (!supabase) return false;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('has_paid')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error('Error refreshing payment status:', error);
        return isPaid;
      }
      
      const hasPaid = data?.has_paid === true;
      console.log('Refreshed payment status:', { hasPaid, data });
      setIsPaid(hasPaid);
      return hasPaid;
    } catch (error) {
      console.error('Exception refreshing payment status:', error);
      return isPaid;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        signIn,
        signInWithGoogle,
        signUp,
        signOut,
        resetPassword,
        isPaid,
        refreshPaymentStatus,
        recoverConnection,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 