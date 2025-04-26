import { createClient } from '@supabase/supabase-js';
import { NextApiRequest } from 'next';

// Initialize Supabase client
// Can be used in both client and server contexts
let supabaseInstance: ReturnType<typeof createClient> | null = null;

export const getSupabase = () => {
  // Only create the client once
  if (!supabaseInstance) {
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
              const value = localStorage.getItem(key);
              return value;
            },
            setItem: (key, value) => {
              if (typeof window === 'undefined') return;
              localStorage.setItem(key, value);
            },
            removeItem: (key) => {
              if (typeof window === 'undefined') return;
              localStorage.removeItem(key);
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
      
      console.log('Supabase client initialized successfully', { siteUrl });
    } catch (error) {
      console.error('Error creating Supabase client:', error);
      return null;
    }
  }
  
  return supabaseInstance;
};

// Force refresh the Supabase client
export const refreshSupabaseClient = () => {
  // Force clear all supabase local storage items first
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
  
  // Create a fresh instance
  const newInstance = getSupabase();
  
  // Log the refresh operation
  console.log('Supabase client refreshed:', !!newInstance);
  
  return newInstance;
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