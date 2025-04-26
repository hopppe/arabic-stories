import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { getSupabase } from './supabase';

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
});

// Auth provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaid, setIsPaid] = useState(false);

  useEffect(() => {
    // Initialize auth state
    const initializeAuth = async () => {
      try {
        const supabase = getSupabase();
        if (!supabase) return;

        // Check for current session
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user || null);

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
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Sign in with email
  const signIn = async (email: string, password: string) => {
    const supabase = getSupabase();
    if (!supabase) return { error: new Error('Supabase client not initialized') };
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    return { error };
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    const supabase = getSupabase();
    if (!supabase) return { error: new Error('Supabase client not initialized') };
    
    // Get current origin to handle both production and development environments
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${origin}/auth/callback`,
      }
    });
    
    return { error };
  };

  // Sign up with email
  const signUp = async (email: string, password: string) => {
    const supabase = getSupabase();
    if (!supabase) return { error: new Error('Supabase client not initialized'), user: null };
    
    // Get current origin if we need to set a redirect URL in the future
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    
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
    
    return { error, user: data.user };
  };

  // Sign out
  const signOut = async () => {
    const supabase = getSupabase();
    if (!supabase) return { error: new Error('Supabase client not initialized') };
    
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  // Reset password
  const resetPassword = async (email: string) => {
    const supabase = getSupabase();
    if (!supabase) return { error: new Error('Supabase client not initialized') };
    
    // Get current origin to handle both production and development environments
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/reset-password`,
    });
    
    return { error };
  };

  // Update profile with payment status
  const updatePaymentStatus = async (hasPaid: boolean) => {
    if (!user) return { error: new Error('User not authenticated') };
    
    const supabase = getSupabase();
    if (!supabase) return { error: new Error('Supabase client not initialized') };
    
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, has_paid: hasPaid });
    
    if (!error) {
      setIsPaid(hasPaid);
    }
    
    return { error };
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