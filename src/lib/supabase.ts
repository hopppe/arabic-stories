import { createClient } from '@supabase/supabase-js';
import { NextApiRequest } from 'next';

// Initialize Supabase client
// Can be used in both client and server contexts
let supabaseInstance: ReturnType<typeof createClient> | null = null;
let lastInitTime = 0; // Track when the client was last initialized
const TOKEN_REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutes in milliseconds
const CLIENT_MAX_AGE = 60 * 60 * 1000; // 1 hour in milliseconds - force client refresh after this time

// Function to check if the client needs to be refreshed
const shouldRefreshClient = () => {
  if (!supabaseInstance) return true;
  
  const now = Date.now();
  // Force refresh if client is too old
  return (now - lastInitTime) > CLIENT_MAX_AGE;
};

// Function to check if session is valid and refresh token if needed
export const ensureValidSession = async () => {
  const supabase = getSupabase();
  if (!supabase) return false;
  
  try {
    // Get current session
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Session validation error:', error);
      return false;
    }
    
    if (!data.session) {
      console.log('No active session found during validation');
      return false;
    }
    
    // Check if token is getting close to expiry
    // If session expires in less than 10 minutes, proactively refresh it
    const expiresAt = data.session.expires_at;
    if (expiresAt) {
      const expiresAtMs = expiresAt * 1000; // Convert to milliseconds
      const now = Date.now();
      const timeUntilExpiry = expiresAtMs - now;
      
      if (timeUntilExpiry < TOKEN_REFRESH_INTERVAL) {
        console.log('Token expiring soon, refreshing session...');
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) {
          console.error('Failed to refresh token:', refreshError);
          return false;
        }
        
        if (refreshData.session) {
          console.log('Session refreshed successfully');
          return true;
        }
      } else {
        // Session is valid and not expiring soon
        return true;
      }
    }
    
    return !!data.session;
  } catch (error) {
    console.error('Error during session validation:', error);
    return false;
  }
};

export const getSupabase = () => {
  // Check if we need to refresh the client
  if (shouldRefreshClient()) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    // Validate environment variables
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables:', {
        url: !supabaseUrl ? 'missing' : 'present',
        key: !supabaseAnonKey ? 'missing' : 'present'
      });
      return null;
    }
    
    try {
      console.log('Creating new Supabase client with URL:', supabaseUrl.substring(0, 15) + '...');
      
      // Get current origin for site URL
      const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';
     
      // Create client with additional options for better compatibility
      supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
          flowType: 'pkce',  // Use PKCE flow for better security
          storageKey: 'arabic-stories-auth', // Unique storage key for this app
          storage: {
            getItem: (key) => {
              if (typeof window === 'undefined') return null;
              try {
                const value = localStorage.getItem(key);
                return value;
              } catch (e) {
                console.warn('Error accessing localStorage:', e);
                return null;
              }
            },
            setItem: (key, value) => {
              if (typeof window === 'undefined') return;
              try {
                localStorage.setItem(key, value);
              } catch (e) {
                console.warn('Error writing to localStorage:', e);
              }
            },
            removeItem: (key) => {
              if (typeof window === 'undefined') return;
              try {
                localStorage.removeItem(key);
              } catch (e) {
                console.warn('Error removing from localStorage:', e);
              }
            },
          },
        },
        global: {
          fetch: (...args) => {
            return fetch(...args);
          },
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
        },
      });
      
      // Test if the client is valid
      if (!supabaseInstance || !supabaseInstance.auth) {
        console.error('Supabase client created but appears invalid');
        return null;
      }
      
      // Update the last initialization time
      lastInitTime = Date.now();
      
      console.log('Supabase client initialized successfully', { 
        siteUrl, 
        timestamp: new Date(lastInitTime).toISOString() 
      });
    } catch (error) {
      console.error('Error creating Supabase client:', error);
      return null;
    }
  }
  
  return supabaseInstance;
};

// Force refresh the Supabase client
export const refreshSupabaseClient = () => {
  try {
    console.log('Forcing Supabase client refresh...');
    
    if (typeof window !== 'undefined') {
      try {
        // Clear only supabase related storage items
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.includes('supabase') || key.includes('arabic-stories-auth'))) {
            console.log('Removing localStorage key for refresh:', key);
            localStorage.removeItem(key);
          }
        }
      } catch (e) {
        console.warn('Error clearing localStorage during refresh:', e);
      }
    }
    
    // Nullify the instance to force new creation
    supabaseInstance = null;
    lastInitTime = 0;
    
    // Create a fresh instance
    const newInstance = getSupabase();
    
    // Log the refresh operation
    console.log('Supabase client refreshed:', !!newInstance);
    
    return newInstance;
  } catch (error) {
    console.error('Error during Supabase client refresh:', error);
    return null;
  }
};

/**
 * Get a Supabase client specifically for server-side API handlers, with proper auth context
 */
export const getServerSupabase = (req: NextApiRequest) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  // Validate environment variables
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables');
    return null;
  }
  
  try {
    // Create a new client with the request cookies for auth context
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          cookie: req.headers.cookie || '',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      },
    });
    
    return supabase;
  } catch (error) {
    console.error('Error creating server Supabase client:', error);
    return null;
  }
};

// Define types for our custom stories
export interface UserStory {
  id: string;
  title: {
    english: string;
    arabic: string;
  };
  content: {
    english: string[];
    arabic: string[];
  };
  difficulty: 'simple' | 'easy' | 'normal' | 'advanced';
  dialect: 'hijazi' | 'saudi' | 'jordanian' | 'egyptian';
  created_at: string;
  user_id?: string;
  word_mappings?: Record<string, string>;
  // longStory is used only for story generation, not stored in the database
} 