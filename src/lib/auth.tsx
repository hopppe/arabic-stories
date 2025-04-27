import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { getSupabase, refreshSupabaseClient, ensureValidSession } from './supabase';
import { useRouter } from 'next/router';

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

// Create context for authentication
type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isPaid: boolean;
  connectionError: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null; user: User | null }>;
  signOut: () => Promise<{ error: Error | null }>;
  recoverConnection: () => Promise<boolean>;
  validateSession: () => Promise<boolean>;
};

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  isPaid: false,
  connectionError: false,
  signIn: async () => ({ error: new Error('Not implemented') }),
  signInWithGoogle: async () => ({ error: new Error('Not implemented') }),
  signUp: async () => ({ error: new Error('Not implemented'), user: null }),
  signOut: async () => ({ error: new Error('Not implemented') }),
  recoverConnection: async () => false,
  validateSession: async () => false
});

// Export hook for using auth context
export const useAuth = () => useContext(AuthContext);

// Auth provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaid, setIsPaid] = useState(false);
  const [connectionError, setConnectionError] = useState<boolean>(false);
  const [recoveryAttempts, setRecoveryAttempts] = useState(0);
  const router = useRouter();

  // Initialize auth on component mount
  const initializeAuth = useCallback(async () => {
    try {
      // Get Supabase client
      const supabase = getSupabase();
      if (!supabase) {
        console.error("Supabase client not initialized in initializeAuth");
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
        
        // Try up to 3 times to get the payment status
        let attempts = 0;
        let success = false;
        
        while (attempts < 3 && !success) {
          attempts++;
          console.log(`Initial payment status check attempt ${attempts}/3`);
          
          try {
            // Add slight delay between attempts
            if (attempts > 1) {
              await new Promise(resolve => setTimeout(resolve, 500 * attempts));
            }
            
            const { data, error } = await supabase
              .from('profiles')
              .select('has_paid, id')
              .eq('id', session.user.id)
              .single();
            
            if (error) {
              console.error(`Initial payment status check attempt ${attempts} failed:`, error);
              console.log('Error code:', error.code, 'Message:', error.message);
              
              // If profile doesn't exist, create it
              if (error.code === 'PGRST116' || 
                  error.message.includes('does not exist') || 
                  error.message.includes('no rows')) {
                console.log(`Profile missing for user ${session.user.id}, creating one...`);
                
                const { error: upsertError } = await supabase.from('profiles').upsert({ 
                  id: session.user.id,
                  email: session.user.email,
                  created_at: new Date().toISOString(),
                  has_paid: false
                });
                
                if (upsertError) {
                  console.error('Failed to create profile:', upsertError);
                } else {
                  console.log('Profile created successfully');
                  setIsPaid(false);
                  success = true;
                  break;
                }
              }
            } else {
              console.log("Initial payment status data received:", data);
              setIsPaid(data?.has_paid === true);
              success = true;
              break;
            }
          } catch (attemptError) {
            console.error(`Exception during attempt ${attempts}:`, attemptError);
          }
        }
        
        // If all attempts failed, default to unpaid
        if (!success) {
          console.warn('All initial payment status check attempts failed, defaulting to unpaid');
          setIsPaid(false);
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
            console.log("Auth state change: checking payment status for user:", session.user.id);
            
            // Try up to 3 times to get the payment status
            let attempts = 0;
            let success = false;
            
            while (attempts < 3 && !success) {
              attempts++;
              console.log(`Payment status check attempt ${attempts}/3`);
              
              try {
                // Add slight delay between attempts
                if (attempts > 1) {
                  await new Promise(resolve => setTimeout(resolve, 500 * attempts));
                }
                
                const { data, error } = await supabase
                  .from('profiles')
                  .select('has_paid, id')
                  .eq('id', session.user.id)
                  .single();
                
                if (error) {
                  console.error(`Payment status check attempt ${attempts} failed:`, error);
                  console.log('Error code:', error.code, 'Message:', error.message);
                  
                  // If profile doesn't exist, create it
                  if (error.code === 'PGRST116' || 
                      error.message.includes('does not exist') || 
                      error.message.includes('no rows')) {
                    console.log(`Profile missing for user ${session.user.id}, creating one...`);
                    
                    const { error: upsertError } = await supabase.from('profiles').upsert({ 
                      id: session.user.id,
                      email: session.user.email,
                      created_at: new Date().toISOString(),
                      has_paid: false
                    });
                    
                    if (upsertError) {
                      console.error('Failed to create profile:', upsertError);
                    } else {
                      console.log('Profile created successfully');
                      setIsPaid(false);
                      success = true;
                      break;
                    }
                  }
                } else {
                  console.log("Payment status data received:", data);
                  setIsPaid(data?.has_paid === true);
                  success = true;
                  break;
                }
              } catch (attemptError) {
                console.error(`Exception during attempt ${attempts}:`, attemptError);
              }
            }
            
            // If all attempts failed, default to unpaid
            if (!success) {
              console.warn('All payment status check attempts failed, defaulting to unpaid');
              setIsPaid(false);
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
  }, []);

  // Validate session before operations
  const validateSession = useCallback(async (): Promise<boolean> => {
    try {
      // First, check if session is valid and refresh if needed
      const isValid = await ensureValidSession();
      
      if (!isValid) {
        console.log('Session invalid during validation, attempting connection recovery');
        
        // If session is invalid, try recovery
        const recovered = await recoverConnection();
        
        if (!recovered) {
          // If recovery failed and we're on a protected page, redirect to login
          const isProtectedRoute = router.pathname.startsWith('/dashboard') ||
                                  router.pathname.startsWith('/my-stories') ||
                                  router.pathname.startsWith('/create-story');
          
          if (isProtectedRoute) {
            console.log('Session invalid on protected route, redirecting to login');
            router.push('/login');
          }
          
          setConnectionError(true);
          return false;
        }
      } else {
        // Valid session, clear any connection error state
        setConnectionError(false);
      }
      
      return isValid;
    } catch (error) {
      console.error('Error validating session:', error);
      setConnectionError(true);
      return false;
    }
  }, [router]);

  useEffect(() => {
    initializeAuth();
    
    // Setup a recovery interval to check connection status
    const recoveryInterval = setInterval(() => {
      if (connectionError) {
        console.log("Attempting to recover Supabase connection...");
        recoverConnection();
      } else {
        // Even when not in error state, periodically validate session to keep it fresh
        validateSession();
      }
    }, 30000); // Check every 30 seconds
    
    // Add event listener for online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }
    
    return () => {
      clearInterval(recoveryInterval);
      
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
    };
  }, [connectionError, initializeAuth, validateSession]);

  // Handle online event
  const handleOnline = useCallback(() => {
    console.log('Network connection restored, validating session...');
    validateSession();
  }, [validateSession]);

  // Handle offline event
  const handleOffline = useCallback(() => {
    console.log('Network connection lost');
    setConnectionError(true);
  }, []);

  // Recover connection function
  const recoverConnection = useCallback(async (): Promise<boolean> => {
    console.log("Executing connection recovery...");
    
    // Increment recovery attempts
    setRecoveryAttempts(prev => prev + 1);
    
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
      
      // If we don't have a session but had one before, try to refresh it
      if (!data.session && session) {
        try {
          console.log("Attempting to refresh expired session");
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError) {
            console.error("Session refresh failed:", refreshError);
            return false;
          }
          
          if (!refreshData.session) {
            console.error("Session refresh returned no session");
            return false;
          }
        } catch (refreshError) {
          console.error("Error refreshing session:", refreshError);
          return false;
        }
      }
      
      console.log("Connection recovery succeeded");
      setConnectionError(false);
      setRecoveryAttempts(0);
      
      // Re-initialize auth
      await initializeAuth();
      return true;
    } catch (error) {
      console.error("Error during connection recovery:", error);
      return false;
    }
  }, [session, initializeAuth]);

  // Sign in with email
  const signIn = useCallback(async (email: string, password: string) => {
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
      return { error: error as Error };
    }
  }, []);

  // Sign in with Google
  const signInWithGoogle = useCallback(async () => {
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
      return { error: error as Error };
    }
  }, []);

  // Sign up with email
  const signUp = useCallback(async (email: string, password: string) => {
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
      
      if (error) {
        return { error, user: null };
      }
      
      if (data.user) {
        try {
          // Create profile record
          await supabase.from('profiles').upsert({ 
            id: data.user.id,
            email: data.user.email,
            created_at: new Date().toISOString(),
            has_paid: false
          });
          
          console.log('Created profile for new user:', data.user.id);
        } catch (profileError) {
          console.error('Error creating profile for new user:', profileError);
          // Don't fail signup if profile creation fails
        }
      }
      
      return { error: null, user: data.user };
    } catch (error) {
      console.error('Error during sign up:', error);
      return { error: error as Error, user: null };
    }
  }, []);

  // Sign out current user
  const signOut = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) return { error: new Error('Supabase client not initialized') };
    
    try {
      const { error } = await supabase.auth.signOut();
      
      if (!error) {
        // Clear user state on successful signout
        setUser(null);
        setSession(null);
        setIsPaid(false);
        
        // Redirect to home page
        router.push('/');
      }
      
      return { error };
    } catch (error) {
      console.error("Sign out error:", error);
      return { error: error as Error };
    }
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isPaid,
        connectionError,
        signIn,
        signInWithGoogle,
        signUp,
        signOut,
        recoverConnection,
        validateSession
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider; 